#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const version = '1.2.7';
const Docker = require('dockerode');
const dotenvConfig = require('dotenv').config();
const { program } = require('commander');
const docker = new Docker();
let dotenv = [];
if (dotenvConfig.parsed != undefined) {
    dotenv = dotenvConfig.parsed;
}
const ExportCommands = __importStar(require("./Commands"));
let commands = new ExportCommands.Commands();
const ExportDockerScripts = __importStar(require("./DockerScripts"));
let dockerScripts = new ExportDockerScripts.DockerScripts(docker, commands);
const ExportProgramAction = __importStar(require("./ProgramAction"));
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
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    yield programAction.docker_waiting(options);
}));
program.command('docker_getlocal-image')
    .description('get local image')
    .action(() => {
    dockerScripts.getImagesLocal(1);
});
program.command('docker_getpull-image')
    .description('get pull image')
    .option('--files <files...>', 'File(s) docker-compose.yml')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    yield programAction.docker_getpull_image(options);
}));
program.command('docker:get-image')
    .description('get image')
    .option('--files <files...>', 'File(s) docker-compose.yml')
    .option('--key <key>', 'Key of services')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    yield programAction.docker_get_image(options);
}));
program.command('docker_getname-container')
    .description('get name container')
    .option('--stack <stack>', 'stack name')
    .option('--container <container>', 'container name')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    programAction.docker_getname_container(options);
}));
program.command('php_download-phar')
    .description('download phar in folder')
    .option('--folder <folder>', 'folder name')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    programAction.php_download_phar(options);
}));
program.command('global-command')
    .description('global Command')
    .action(() => {
    programAction.global_command();
});
program.command('bddset-mariadb')
    .description('set bdd')
    .option('--filesql <filesql>', 'file SQL')
    .option('--lampy <lampy>', 'Lampy folder')
    .action((options) => {
    programAction.bddset_mariadb(options);
});
program.command('docker_swarm-init')
    .description('docker swarm init')
    .option('--ip <ip>', 'IP')
    .action((options) => {
    programAction.docker_swarm_init(options);
});
program.command('docker_create-network')
    .description('docker create network')
    .option('--networks <networks>', 'Networks')
    .action((options) => {
    programAction.docker_create_network(options);
});
program.command('docker_deploy')
    .description('docker deploy')
    .option('--stack <stack>', 'stack name')
    .option('--files <files...>', 'File(s) docker-compose.yml')
    .action((options) => {
    programAction.docker_deploy(options);
});
program.command('docker_stop')
    .description('docker stop stack')
    .option('--stack <stack>', 'stack name')
    .action((options) => {
    programAction.docker_stop(options);
});
program.command('docker_ls')
    .description('docker ls stack')
    .option('--stack <stack>', 'stack name')
    .action((options) => {
    programAction.docker_ls(options);
});
program.command('docker_service-update')
    .description('docker update')
    .option('--stack <stack>', 'stack name')
    .option('--container <container>', 'container name')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    yield programAction.docker_service_update(options);
}));
program.command('docker_inspect')
    .description('docker inspect')
    .option('--stack <stack>', 'stack name')
    .option('--container <container>', 'container name')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    yield programAction.docker_inspect(options);
}));
program.command('docker_container-logs')
    .description('docker container logs')
    .option('--stack <stack>', 'stack name')
    .option('--container <container>', 'container name')
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    yield programAction.docker_container_logs(options);
}));
program.parse();
