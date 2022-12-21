#!/usr/bin/env node
const Docker = require('dockerode');
const { exec } = require('child_process');
const dotenvConfig = require('dotenv').config();
const { program } = require('commander');
const fs = require('fs');
const yaml = require('yaml');
const docker = new Docker();

let imagesData = [];

let dotenv = [];
if (dotenvConfig.parsed != undefined) {
  dotenv = dotenvConfig.parsed;
}

function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        
        console.log(stdout);
        resolve(stdout? stdout : stderr);
      }
    );
  });
}

program
  .name('korojscommands')
  .description('CLI to execute command with docker')
  .version('1.1.3');

async function getInfoContainers(data, length, sleep)
{
  if (length == 0) {
    console.log('last');
    return;
  }
  await docker.listContainers({ all: true }).then(async (containers) => {
    let end = 0;
    let states = [];
    let waiting = [];
    containers.forEach(async (containerInfo) => {
      let name = containerInfo.Labels['com.docker.swarm.service.name'];
      let state = containerInfo.State;
      states[name] = state;
    });
    for (let id in data) {
      if (data[id] == states[id]) {
        end++;
      } else {
        waiting[id] = states[id];
      }
    }

    if (end != Object.keys(data).length) {
      await execShellCommand('docker system prune -a -f');
      console.log('waiting');
      await new Promise(resolve => setTimeout(resolve, sleep*1000))
      await getInfoContainers(data, length-1, sleep);
    } else {
      console.log(data);
    }
  });
}

program.command('docker_waiting')
  .description('waiting status container')
  .option('--stack <stack>', 'stack name')
  .option('--status <status>', 'status container')
  .option('--container <container...>', 'container(s) name')
  .action(async (options) => {
    if (options.stack == undefined && dotenv.STACK != undefined) {
      options.stack = dotenv.STACK;
    }
    if (options.stack != undefined && options.status != undefined && options.container != undefined) {
      json = [];
      options.container.forEach(container => {
        let name = options.stack + '_' + container;
        json[name] = options.status;
      });
      await getInfoContainers(json, -1, 1);
    } else {
      console.warn('you must have STACK, STATUS and CONTAINER option');
    }
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

program.command('docker_getlocal-image')
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

program.command('docker_getpull-image')
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

program.command('docker_getname-container')
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

program.command('php_download-phar')
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

      let rawdata = fs.readFileSync(__dirname+'/phar.json');
      const phar = JSON.parse(rawdata);
      Object.keys(phar).forEach(id => {
        let command = 'wget ' + phar[id] + ' -O ' + options.folder + '/' + id;
        execShellCommand(command);
      });
    } else {
      console.warn('Folder to download PHAR not found');
    }
  });

program.command('global-command')
  .description('global Command')
  .action(() => {
    let rawdata = fs.readFileSync(__dirname+'/commands.json');
    const commands = JSON.parse(rawdata);
    console.table(commands);
  });

program.command('bddset-mariadb')
  .description('set bdd')
  .option('--filesql <filesql>', 'file SQL')
  .option('--lampy <lampy>', 'Lampy folder')
  .action(options => {
    if (options.filesql == undefined && dotenv.FILESQL != undefined) {
      options.filesql = dotenv.FILESQL;
    }
    if (options.lampy == undefined && dotenv.FOLDERLAMPY != undefined) {
      options.lampy = dotenv.FOLDERLAMPY;
    }
    if (options.filesql != undefined && options.lampy != undefined) {
      const index = options.filesql.lastIndexOf('/');
      let command = 'cp ' + options.filesql + ' ' + options.lampy + '/mariadb_init/' + options.filesql.slice(index + 1);
      execShellCommand(command);
    } else {
      console.warn('FILESQL + lampy folder not found');
    }
  })

program.command('docker_swarm-init')
  .description('docker swarm init')
  .option('--ip <ip>', 'IP')
  .action(options => {
    if (options.ip == undefined && dotenv.IPSWARM != undefined) {
      options.ip = dotenv.IPSWARM;
    }
    if (options.ip != undefined) {
      let command = 'docker swarm init --default-addr-pool ' + options.ip;
      execShellCommand(command);
    } else {
      console.warn('IP not found');
    }
  });

program.command('docker_create-network')
  .description('docker create network')
  .option('--networks <networks>', 'Networks')
  .action(options => {
    if (options.networks == undefined && dotenv.NETWORKS != undefined) {
      options.networks = dotenv.NETWORKS;
    }
    if (options.networks != undefined) {
      options.networks.split(',').forEach(network => {
        docker.createNetwork({ driver: 'overlay', name: network });
      });
    } else {
      console.warn('networks not found');
    }
  });

program.command('docker_deploy')
  .description('docker deploy')
  .option('--stack <stack>', 'stack name')
  .option('--files <files...>', 'File(s) docker-compose.yml')
  .action(options => {
    if (options.stack == undefined && dotenv.STACK != undefined) {
      options.stack = dotenv.STACK;
    }
    if (options.files != undefined && options.stack != undefined) {
      let command = 'docker stack deploy -c '+ options.files.join(' -c ')+ " "+options.stack;
      execShellCommand(command);
    } else {
      console.warn('files not found');
    }
  });

program.command('docker_ls')
  .description('docker ls stack')
  .option('--stack <stack>', 'stack name')
  .action(options => {
    if (options.stack == undefined && dotenv.STACK != undefined) {
      options.stack = dotenv.STACK;
    }
    if (options.stack != undefined) {
      let command = 'docker stack services ' + options.stack;
      execShellCommand(command);
    } else {
      console.warn('stack not found');
    }
  });

program.parse();