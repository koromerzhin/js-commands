const Docker = require('dockerode');
const fs = require('fs');
const yaml = require('yaml');
const docker = new Docker();

let imagesData = [];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms*1000))

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
      await sleep(sleep);
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

async function readDockerCompose()
{
  const file = fs.readFileSync('./docker-compose.yml', 'utf8');
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

async function global() {
  console.clear();
  await getImagesLocal();
  await readDockerCompose();
  await getInfoContainers({
    'labstag_phpfpm': 'running',
    'labstag_phpfpmexec': 'exited'
  },
    -1,
    1
  );
  let name = await getNameContainer('labstag', 'phpfpm');
  console.log(name);
}

global();