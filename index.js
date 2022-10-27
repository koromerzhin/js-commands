const Docker = require('dockerode');
const fs = require('fs');
const yaml = require('yaml');
const child_process = require('child_process');
const docker = new Docker();
function getInfoContainers(data)
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

function dockerpull(image)
{
  console.log('docker pull ' + image);
  watcher = child_process.spawn('docker', ['pull', image]);
  watcher.stdout.on('data', (data) => {
    console.log(`${data}`);
  });
}

// test = {
//   'labstag_phpfpm': 'running',
//   'labstag_phpfpmexec': 'exited'
// };
// const IntervalContainer = setInterval(getInfoContainers,1000, test);

const file = fs.readFileSync('./docker-compose.yml', 'utf8');
const parsing = yaml.parse(file);
for (var key in parsing.services) {
  var image = parsing.services[key].image;
  dockerpull(image);
}