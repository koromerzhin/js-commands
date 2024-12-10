const fs = require('fs');
const yaml = require('yaml');
export class DockerScripts {
    docker: any;
    commands: any
    imagesData: any = []
    constructor(docker: any, commands: any) {
        this.docker = docker
        this.commands = commands
    }


    async getInfoContainers(data: any, length: any, sleep: any) {
        if (length == 0) {
            console.log('last');
            return;
        }
        await this.docker.listContainers({ all: true }).then(async (containers: any) => {
            let end: any = 0;
            let states: any = [];
            let waiting: any = [];
            containers.forEach(async (containerInfo: any) => {
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
                await this.commands.exec('docker system prune -a -f');
                console.log('waiting', waiting);
                await new Promise(resolve => setTimeout(resolve, sleep * 1000))
                await this.getInfoContainers(data, length - 1, sleep);
            } else {
                console.log(data);
            }
        });
    }

    async getImagesLocal(status: any) {
        await this.docker.listImages().then((images: any) => {
            images.forEach((image: any) => {
                let repoTags = image.RepoTags;
                if (repoTags != null) {
                    let tag = repoTags[0];
                    this.imagesData[tag] = {
                        'name': tag,
                        'size': image.Size,
                        'virtualsize': image.VirtualSize
                    };
                }
            })
        });
        if (status == 1) {
            console.log('Images in local');
            console.table(this.imagesData);
        }
    }
    async readDockerCompose(dockerfile: string) {
        const file = fs.readFileSync(dockerfile, 'utf8');
        const parsing = yaml.parse(file);
        let promises: any = [];
        for (let key in parsing.services) {
            let image = parsing.services[key].image;
            if (this.imagesData[image] == undefined && image != undefined) {
                await this.commands.exec('docker pull ' + image);

                this.imagesData[image] = image;
            }
        }

        await Promise.all(promises);
    }

    async getNameContainer(searchStack: string, searchContainer: string) {
        const searchServiceName = searchStack + '_' + searchContainer;
        let name = ''
        await this.docker.listContainers({ all: true }).then(async (containers: any) => {
            containers.forEach(async (containerInfo: any) => {
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

    async getIdContainer(name: string) {
        let id = null;
        await this.docker.listContainers({ all: true }).then(async (containers: any) => {
            containers.forEach(async (containerInfo: any) => {
                if (containerInfo.Labels['com.docker.swarm.service.name'] == name) {
                    id = containerInfo.Id;
                }
            });
        });

        return id;
    }
}