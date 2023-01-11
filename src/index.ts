#!/usr/bin/env node
const version = '1.2.2';
const Docker = require('dockerode');
const dotenvConfig = require('dotenv').config();
const { program } = require('commander');
const docker = new Docker();

let dotenv: any = [];
if (dotenvConfig.parsed != undefined) {
    dotenv = dotenvConfig.parsed;
}

import * as ExportCommands from './Commands';
let commands = new ExportCommands.Commands();

import * as ExportDockerScripts from './DockerScripts';
let dockerScripts = new ExportDockerScripts.DockerScripts(docker, commands);

import * as ExportProgramAction from './ProgramAction';
let programAction = new ExportProgramAction.ProgramAction(dotenv, docker, commands, dockerScripts);

program
    .name('korojscommands')
    .description('CLI to execute command with docker')
    .version(version);

program.command('docker_waiting')
    .description('waiting status container')
    .option('--stack <stack>', 'stack name')
    .option('--status <status>', 'status container')
    .option('--container <container...>', 'container(s) name')
    .action(async (options: any) => {
        await programAction.docker_waiting(options);
    });

program.command('docker_getlocal-image')
    .description('get local image')
    .action(() => {
        dockerScripts.getImagesLocal(1);
    });

program.command('docker_getpull-image')
    .description('get pull image')
    .option('--files <files...>', 'File(s) docker-compose.yml')
    .action(async (options: any) => {
        await programAction.docker_getpull_image(options);
    });

program.command('docker_getname-container')
    .description('get name container')
    .option('--stack <stack>', 'stack name')
    .option('--container <container>', 'container name')
    .action(async (options: any) => {
        programAction.docker_getname_container(options);
    });

program.command('php_download-phar')
    .description('download phar in folder')
    .option('--folder <folder>', 'folder name')
    .action(async (options: any) => {
        programAction.php_download_phar(options);
    });

program.command('global-command')
    .description('global Command')
    .action(() => {
        programAction.global_command();
    });

program.command('bddset-mariadb')
    .description('set bdd')
    .option('--filesql <filesql>', 'file SQL')
    .option('--lampy <lampy>', 'Lampy folder')
    .action((options: any) => {
        programAction.bddset_mariadb(options);
    })

program.command('docker_swarm-init')
    .description('docker swarm init')
    .option('--ip <ip>', 'IP')
    .action((options: any) => {
        programAction.docker_swarm_init(options);
    });

program.command('docker_create-network')
    .description('docker create network')
    .option('--networks <networks>', 'Networks')
    .action((options: any) => {
        programAction.docker_create_network(options);
    });

program.command('docker_deploy')
    .description('docker deploy')
    .option('--stack <stack>', 'stack name')
    .option('--files <files...>', 'File(s) docker-compose.yml')
    .action((options: any) => {
        programAction.docker_deploy(options);
    });

program.command('docker_ls')
    .description('docker ls stack')
    .option('--stack <stack>', 'stack name')
    .action((options: any) => {
        programAction.docker_ls(options);
    });

program.command('docker_service-update')
    .description('docker update')
    .option('--stack <stack>', 'stack name')
    .option('--container <container>', 'container name')
    .action(async (options: any) => {
        await programAction.docker_service_update(options);
    });

program.command('docker_inspect')
    .description('docker inspect')
    .option('--stack <stack>', 'stack name')
    .option('--container <container>', 'container name')
    .action(async (options: any) => {
        await programAction.docker_inspect(options);
    });

program.command('docker_container-logs')
    .description('docker logs')
    .option('--stack <stack>', 'stack name')
    .option('--container <container>', 'container name')
    .action(async (options: any) => {
        await programAction.docker_container_logs(options);
    });

program.parse();