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
exports.DockerScripts = void 0;
const fs = require('fs');
const yaml = require('yaml');
class DockerScripts {
    constructor(docker, commands) {
        this.imagesData = [];
        this.docker = docker;
        this.commands = commands;
    }
    getInfoContainers(data, length, sleep) {
        return __awaiter(this, void 0, void 0, function* () {
            if (length == 0) {
                console.log('last');
                return;
            }
            yield this.docker.listContainers({ all: true }).then((containers) => __awaiter(this, void 0, void 0, function* () {
                let end = 0;
                let states = [];
                let waiting = [];
                containers.forEach((containerInfo) => __awaiter(this, void 0, void 0, function* () {
                    let name = containerInfo.Labels['com.docker.swarm.service.name'];
                    let state = containerInfo.State;
                    states[name] = state;
                }));
                for (let id in data) {
                    if (data[id] == states[id]) {
                        end++;
                    }
                    else {
                        waiting[id] = states[id];
                    }
                }
                if (end != Object.keys(data).length) {
                    yield this.commands.exec('docker system prune -a -f');
                    console.log('waiting');
                    yield new Promise(resolve => setTimeout(resolve, sleep * 1000));
                    yield this.getInfoContainers(data, length - 1, sleep);
                }
                else {
                    console.log(data);
                }
            }));
        });
    }
    getImagesLocal(status) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.docker.listImages().then((images) => {
                images.forEach((image) => {
                    let repoTags = image.RepoTags;
                    if (repoTags != null) {
                        let tag = repoTags[0];
                        this.imagesData[tag] = tag;
                    }
                });
            });
            if (status == 1) {
                console.log('Images in local');
                console.table(this.imagesData);
            }
        });
    }
    readDockerCompose(dockerfile) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = fs.readFileSync(dockerfile, 'utf8');
            const parsing = yaml.parse(file);
            let promises = [];
            for (let key in parsing.services) {
                let image = parsing.services[key].image;
                if (this.imagesData[image] == undefined && image != undefined) {
                    yield this.commands.exec('docker pull ' + image);
                    this.imagesData[image] = image;
                }
            }
            yield Promise.all(promises);
        });
    }
    getNameContainer(searchStack, searchContainer) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchServiceName = searchStack + '_' + searchContainer;
            let name = '';
            yield this.docker.listContainers({ all: true }).then((containers) => __awaiter(this, void 0, void 0, function* () {
                containers.forEach((containerInfo) => __awaiter(this, void 0, void 0, function* () {
                    let stack = containerInfo.Labels['com.docker.stack.namespace'];
                    let serviceName = containerInfo.Labels['com.docker.swarm.service.name'];
                    let stackName = containerInfo.Labels['com.docker.swarm.task.name'];
                    if (stack == searchStack && serviceName == searchServiceName) {
                        name = stackName;
                    }
                }));
            }));
            return name;
        });
    }
    getIdContainer(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let id = null;
            yield this.docker.listContainers({ all: true }).then((containers) => __awaiter(this, void 0, void 0, function* () {
                containers.forEach((containerInfo) => __awaiter(this, void 0, void 0, function* () {
                    if (containerInfo.Labels['com.docker.swarm.service.name'] == name) {
                        id = containerInfo.Id;
                    }
                }));
            }));
            return id;
        });
    }
}
exports.DockerScripts = DockerScripts;
