const Docker = require('dockerode');
const fs = require('fs');
const yaml = require('yaml');
const docker = new Docker();

var imagesData = [];
async function getInfoContainers(data)
{
  docker.listContainers({ all: true }).then(containers => {
    var end = 0;
    var states = [];
    containers.forEach(async (containerInfo) => {
      var name = containerInfo.Labels['com.docker.swarm.service.name'];
      var state = containerInfo.State;
      states[name] = state;
    });
    for (var id in data) {
      if (data[id] == states[id]) {
        end++;
      }
    }

    if (end == Object.keys(data).length) {
      console.log(data);
      clearInterval(IntervalContainer);
    } else {
      console.log('waiting');
    }
  });
}

async function getImagesLocal()
{
  await docker.listImages().then(images => {
    images.forEach(image => {
      var repoTags = image.RepoTags;
      if (repoTags != null) {
        var tag = repoTags[0];
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
  var promises = [];
  for (var key in parsing.services) {
    var image = parsing.services[key].image;
    if (imagesData[image] == undefined) {
      console.log('docker pull ' + image);
      await execShellCommand('docker pull ' + image);
    
      imagesData[image] = image;
    }
  }

  await Promise.all(promises);
}

async function waitingContainers()
{
  test = {
    'labstag_phpfpm': 'running',
    'labstag_phpfpmexec': 'exited'
  };
  const IntervalContainer = await setInterval(getInfoContainers,1000, test);
}

async function global() {
  console.clear();
  await getImagesLocal();
  await readDockerCompose();
  // Bug
  await waitingContainers();
  console.log('aa');
}

global();