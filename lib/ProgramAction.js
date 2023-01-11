"use strict";
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
exports.ProgramAction = void 0;
const fs = require('fs');
class ProgramAction {
    constructor(dotenv, docker, commands, dockerScripts) {
        this.dotenv = [];
        this.dotenv = dotenv;
        this.docker = docker;
        this.commands = commands;
        this.dockerScripts = dockerScripts;
    }
    docker_waiting(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.stack == undefined && this.dotenv.STACK != undefined) {
                options.stack = this.dotenv.STACK;
            }
            if (options.stack != undefined && options.status != undefined && options.container != undefined) {
                let json = [];
                options.container.forEach((container) => {
                    let name = options.stack + '_' + container;
                    json[name] = options.status;
                });
                yield this.dockerScripts.getInfoContainers(json, -1, 1);
            }
            else {
                console.warn('you must have STACK, STATUS and CONTAINER option');
            }
        });
    }
    docker_getpull_image(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.dockerScripts.getImagesLocal(0);
            if (options.files != undefined) {
                options.files.forEach((file) => __awaiter(this, void 0, void 0, function* () {
                    yield this.dockerScripts.readDockerCompose(file);
                }));
            }
            else {
                console.warn('files not found');
            }
        });
    }
    docker_getname_container(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.stack == undefined && this.dotenv.STACK != undefined) {
                options.stack = this.dotenv.STACK;
            }
            if (options.stack != '' && options.container != undefined) {
                let name = yield this.dockerScripts.getNameContainer(options.stack, options.container);
                console.log(name);
            }
            else {
                console.warn('you must have STACK and CONTAINER option');
            }
        });
    }
    php_download_phar(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.folder == undefined && this.dotenv.FOLDERPHAR != undefined) {
                options.folder = this.dotenv.FOLDERPHAR;
            }
            if (options.folder != undefined) {
                if (!fs.existsSync(options.folder)) {
                    yield fs.promises.mkdir(options.folder);
                }
                let rawdata = fs.readFileSync(__dirname + '/phar.json');
                const phar = JSON.parse(rawdata);
                Object.keys(phar).forEach(id => {
                    let command = 'wget ' + phar[id] + ' -O ' + options.folder + '/' + id;
                    this.commands.exec(command);
                });
            }
            else {
                console.warn('Folder to download PHAR not found');
            }
        });
    }
    global_command() {
        let rawdata = fs.readFileSync(__dirname + '/../commands.json');
        const commands = JSON.parse(rawdata);
        console.table(commands);
    }
    bddset_mariadb(options) {
        if (options.filesql == undefined && this.dotenv.FILESQL != undefined) {
            options.filesql = this.dotenv.FILESQL;
        }
        if (options.lampy == undefined && this.dotenv.FOLDERLAMPY != undefined) {
            options.lampy = this.dotenv.FOLDERLAMPY;
        }
        if (options.filesql != undefined && options.lampy != undefined) {
            const index = options.filesql.lastIndexOf('/');
            let command = 'cp ' + options.filesql + ' ' + options.lampy + '/mariadb_init/' + options.filesql.slice(index + 1);
            this.commands.exec(command);
        }
        else {
            console.warn('FILESQL + lampy folder not found');
        }
    }
    docker_swarm_init(options) {
        if (options.ip == undefined && this.dotenv.IPSWARM != undefined) {
            options.ip = this.dotenv.IPSWARM;
        }
        if (options.ip != undefined) {
            let command = 'docker swarm init --default-addr-pool ' + options.ip;
            this.commands.exec(command);
        }
        else {
            console.warn('IP not found');
        }
    }
    docker_create_network(options) {
        if (options.networks == undefined && this.dotenv.NETWORKS != undefined) {
            options.networks = this.dotenv.NETWORKS;
        }
        if (options.networks != undefined) {
            options.networks.split(',').forEach((network) => {
                this.docker.createNetwork({ driver: 'overlay', name: network });
            });
        }
        else {
            console.warn('networks not found');
        }
    }
    docker_stop(options) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.stack != undefined) {
            let command = 'docker stack rm ' + options.stack;
            this.commands.exec(command);
        }
        else {
            console.warn('stack not found');
        }
    }
    docker_deploy(options) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.files == undefined && this.dotenv.DOCKERCOMPOSEFILES != undefined) {
            options.files = this.dotenv.DOCKERCOMPOSEFILES;
            options.files = options.files.split(' ');
        }
        if (options.files != undefined && options.stack != undefined) {
            let command = 'docker stack deploy -c ' + options.files.join(' -c ') + ' ' + options.stack;
            this.commands.exec(command);
        }
        else {
            console.warn('files and stack not found');
        }
    }
    docker_ls(options) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.stack != undefined) {
            let command = 'docker stack services ' + options.stack;
            this.commands.exec(command);
        }
        else {
            console.warn('stack not found');
        }
    }
    docker_service_update(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.stack == undefined && this.dotenv.STACK != undefined) {
                options.stack = this.dotenv.STACK;
            }
            if (options.stack != undefined && options.container != undefined) {
                const name = options.stack + '_' + options.container;
                let idContainer = yield this.dockerScripts.getIdContainer(name);
                const service = this.docker.getService(idContainer);
                service.update();
            }
            else {
                console.warn('stack and container not found');
            }
        });
    }
    docker_inspect(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.stack == undefined && this.dotenv.STACK != undefined) {
                options.stack = this.dotenv.STACK;
            }
            if (options.stack != undefined && options.container != undefined) {
                const name = options.stack + '_' + options.container;
                let idContainer = yield this.dockerScripts.getIdContainer(name);
                const container = this.docker.getContainer(idContainer);
                container.inspect((err, data) => {
                    console.log(data);
                });
            }
            else {
                console.warn('stack and container not found');
            }
        });
    }
    docker_container_logs(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = require('stream');
            const logStream = new stream.PassThrough();
            logStream.on('data', (chunk) => {
                console.log(chunk.toString('utf8'));
            });
            if (options.stack == undefined && this.dotenv.STACK != undefined) {
                options.stack = this.dotenv.STACK;
            }
            if (options.stack != undefined && options.container != undefined) {
                const name = options.stack + '_' + options.container;
                let idContainer = yield this.dockerScripts.getIdContainer(name);
                const container = this.docker.getContainer(idContainer);
                container.logs({
                    follow: true,
                    stdout: true,
                    stderr: true
                }, (err, stream) => {
                    if (err) {
                        return console.error(err.message);
                    }
                    container.modem.demuxStream(stream, logStream, logStream);
                    stream.on('end', () => {
                        logStream.end('!stop!');
                    });
                    setTimeout(() => {
                        stream.destroy();
                    }, 2000);
                });
            }
            else {
                console.warn('stack and container not found');
            }
        });
    }
}
exports.ProgramAction = ProgramAction;
