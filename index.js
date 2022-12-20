#!/usr/bin/env node
const Docker = require('dockerode');
const { exec } = require('child_process');
const dotenvConfig = require('dotenv').config();
const { program } = require('commander');
const fs = require('fs');
const yaml = require('yaml');
const docker = new Docker();

let imagesData = [];

if (dotenvConfig.parsed != undefined) {
  const doteenv = dotenvConfig.parsed;
} else {
  const dotenv = [];
}

function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.warn(error);
    }
    resolve(stdout? stdout : stderr);
    });
  });
}

program
  .name('korojscommands')
  .description('CLI to execute command with docker')
  .version('0.1.1');

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

program.command('waiting')
  .description('waiting status container')
  .argument('<string>', 'JSON to execute')
  .action(async (str) => {
    await getInfoContainers(JSON.parse(str), -1, 1);
  });

async function getImagesLocal(status)
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
  if (status == 1) {
    console.log('Images in local');
    console.table(imagesData);
  }
}

program.command('getlocal-image')
  .description('get local image')
  .action(() => {
    getImagesLocal(1);
  });

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

program.command('getpull-image')
  .description('get pull image')
  .argument('<string>', 'File docker-compose.yml')
  .action(async (str) => {
    await getImagesLocal(0);
    await readDockerCompose(str);
  });

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

program.command('getname-container')
  .description('get name container')
  .option('--stack <stack>', 'stack name')
  .option('--container <container>', 'container name')
  .action(async (options) => {
    if (options.stack == undefined && dotenv.STACK != undefined) {
      options.stack = dotenv.STACK;
    }

    if (option.stack != '' && options.container != undefined) {
      let name = await getNameContainer(options.stack, options.container);
      console.log(name);
    } else {
      console.warn('you must have STACK and CONTAINER option');
    }
  });

program.command('download-phar')
  .description('download phar in folder')
  .option('--folder <folder>', 'folder name')
  .action(async (options) => {
    if (options.folder == undefined && dotenv.FOLDERPHAR != undefined) {
      options.folder = dotenv.FOLDERPHAR;
    }
    if (options.folder != undefined) {
      if (!fs.existsSync(options.folder)) {
        await fs.promises.mkdir(options.folder);
      }

      let rawdata = fs.readFileSync('phar.json');
      const phar = JSON.parse(rawdata);
      Object.keys(phar).forEach(id => {
        let command = 'wget ' + phar[id] + ' -O ' + options.folder + '/' + id;
        console.log(command);
        execShellCommand(command);
      });
    }
  });

program.command('global-command')
  .description('global Command')
  .action(() => {
  
    let rawdata = fs.readFileSync('commands.json');
    const commands = JSON.parse(rawdata);
    console.table(commands);
  });

program.parse();