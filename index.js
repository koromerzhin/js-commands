#!/usr/bin/env node
const Docker = require('dockerode');
const { program } = require('commander');
const fs = require('fs');
const yaml = require('yaml');
const docker = new Docker();

let imagesData = [];

async function getInfoContainers(data, length, sleep)
{
  if (length == 0) {
    console.log('last');
    return;
  }
  await docker.listContainers({ all: true }).then(async (containers) => {
    let end = 0;
    let states = [];
    containers.forEach(async (containerInfo) => {
      let name = containerInfo.Labels['com.docker.swarm.service.name'];
      let state = containerInfo.State;
      states[name] = state;
    });
    for (let id in data) {
      if (data[id] == states[id]) {
        end++;
      }
    }

    if (end != Object.keys(data).length) {
      console.log('waiting');
      await new Promise(resolve => setTimeout(resolve, sleep*1000))
      await getInfoContainers(data, length-1, sleep);
    } else {
      console.log(data);
    }
  });
}

async function getImagesLocal()
{
  await docker.listImages().then(images => {
    images.forEach(image => {
      let repoTags = image.RepoTags;
      if (repoTags != null) {
        let tag = repoTags[0];
        imagesData[tag] = tag
      }
    })
  });
  console.log('Images in local');
  console.table(imagesData);
}

function execShellCommand(cmd) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.warn(error);
    }
    resolve(stdout? stdout : stderr);
    });
  });
}

async function readDockerCompose(dockerfile)
{
  const file = fs.readFileSync(dockerfile, 'utf8');
  const parsing = yaml.parse(file);
  let promises = [];
  for (let key in parsing.services) {
    let image = parsing.services[key].image;
    if (imagesData[image] == undefined) {
      console.log('docker pull ' + image);
      await execShellCommand('docker pull ' + image);
    
      imagesData[image] = image;
    }
  }

  await Promise.all(promises);
}

async function getNameContainer(searchStack, searchContainer)
{
  const searchServiceName = searchStack + '_' + searchContainer;
  let name = ''
  await docker.listContainers({ all: true }).then(async (containers) => {
    containers.forEach(async (containerInfo) => {
      let stack = containerInfo.Labels['com.docker.stack.namespace'];
      let serviceName = containerInfo.Labels['com.docker.swarm.service.name'];
      let stackName = containerInfo.Labels['com.docker.swarm.task.name'];
      if (stack == searchStack && serviceName == searchServiceName) {
        name = stackName;
      }
    });
  });

  return name;
}

program
  .name('korojscommands')
  .description('CLI to execute command with docker')
  .version('0.0.3');

program.command('waiting')
  .description('waiting status container')
  .argument('<string>', 'JSON to execute')
  .action(async (str) => {
    await getInfoContainers(JSON.parse(str), -1, 1);
  });

program.command('getlocal-image')
  .description('get local image')
  .action(() => {
    getImagesLocal();
  });

program.command('getpull-image')
  .description('get pull image')
  .argument('<string>', 'File docker-compose.yml')
  .action(async (str) => {
    await readDockerCompose(str);
  });

program.command('getname-container')
.description('get name container')
.argument('<stack>', 'stack name')
.argument('<container>', 'container name')
  .action(async (stack, container) => {
    let name = await getNameContainer(stack, container);
    console.log(name);
});

program.parse();