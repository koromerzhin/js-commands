const fs = require('fs');
const yaml = require('yaml');
export class ProgramAction {
    dotenv: any = []
    docker: any;
    dockerScripts: any
    commands: any

    constructor(dotenv: any, docker: any, commands: any, dockerScripts: any) {
        this.dotenv = dotenv;
        this.docker = docker;
        this.commands = commands;
        this.dockerScripts = dockerScripts;
    }

    async docker_waiting(options: any) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.stack != undefined && options.status != undefined && options.container != undefined) {
            let json: any = [];
            options.container.forEach((container: any) => {
                let name = options.stack + '_' + container;
                json[name] = options.status;
            });
            await this.dockerScripts.getInfoContainers(json, -1, 1);
        } else {
            console.warn('you must have STACK, STATUS and CONTAINER option');
        }
    }
    async docker_getpull_image(options: any) {
        await this.dockerScripts.getImagesLocal(0);
        if (options.files == undefined && this.dotenv.DOCKERCOMPOSEFILES != undefined) {
            options.files = this.dotenv.DOCKERCOMPOSEFILES;
            options.files = options.files.split(' ');
        }
        if (options.files != undefined) {
            options.files.forEach(async (file: any) => {
                await this.dockerScripts.readDockerCompose(file);
            });
        } else {
            console.warn('files not found');
        }
    }

    async docker_get_image(options: any) {
        if (options.files == undefined && this.dotenv.DOCKERCOMPOSEFILES != undefined) {
            options.files = this.dotenv.DOCKERCOMPOSEFILES;
            options.files = options.files.split(' ');
        }
        if (options.files != undefined && options.key != undefined) {
            options.files.forEach(async (dockerfile: any) => {
                const file = fs.readFileSync(dockerfile, 'utf8');
                const parsing = yaml.parse(file);
                for (let key in parsing.services) {
                    if (key == options.key) {
                        console.log(parsing.services[key].image);
                    }
                }
            });
        } else {
            console.warn('files and key not found');
        }
    }


    async docker_getname_container(options: any) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }

        if (options.stack != '' && options.container != undefined) {
            let name = await this.dockerScripts.getNameContainer(options.stack, options.container);
            console.log(name);
        } else {
            console.warn('you must have STACK and CONTAINER option');
        }
    }

    async php_download_phar(options: any) {
        if (options.folder == undefined && this.dotenv.FOLDERPHAR != undefined) {
            options.folder = this.dotenv.FOLDERPHAR;
        }
        if (options.folder != undefined) {
            if (!fs.existsSync(options.folder)) {
                await fs.promises.mkdir(options.folder);
            }

            let rawdata = fs.readFileSync(__dirname + '/../phar.json');
            const phar = JSON.parse(rawdata);
            Object.keys(phar).forEach(id => {
                let command = 'wget ' + phar[id] + ' -O ' + options.folder + '/' + id;
                this.commands.exec(command);
            });
        } else {
            console.warn('Folder to download PHAR not found');
        }
    }

    global_command() {
        let rawdata = fs.readFileSync(__dirname + '/../commands.json');
        const commands = JSON.parse(rawdata);
        console.table(commands);
    }

    bddset_mariadb(options: any) {
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
        } else {
            console.warn('FILESQL + lampy folder not found');
        }
    }

    docker_swarm_init(options: any) {
        if (options.ip == undefined && this.dotenv.IPSWARM != undefined) {
            options.ip = this.dotenv.IPSWARM;
        }
        if (options.ip != undefined) {
            let command = 'docker swarm init --default-addr-pool ' + options.ip;
            if (this.dotenv.ADVERTISEADDR != undefined) {
                command += ' --advertise-addr ' + this.dotenv.ADVERTISEADDR;
            }
            this.commands.exec(command);
        } else {
            console.warn('IP not found');
        }
    }

    docker_create_network(options: any) {
        if (options.networks == undefined && this.dotenv.NETWORKS != undefined) {
            options.networks = this.dotenv.NETWORKS;
        }
        if (options.networks != undefined) {
            options.networks.split(',').forEach((network: any) => {
                this.docker.createNetwork({ driver: 'overlay', name: network });
            });
        } else {
            console.warn('networks not found');
        }
    }

    docker_stop(options: any) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.stack != undefined) {
            let command = 'docker stack rm ' + options.stack;
            this.commands.exec(command);
        } else {
            console.warn('stack not found');
        }
    }

    docker_deploy(options: any) {
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
        } else {
            console.warn('files and stack not found');
        }
    }

    docker_ls(options: any) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.stack != undefined) {
            let command = 'docker stack services ' + options.stack;
            this.commands.exec(command);
        } else {
            console.warn('stack not found');
        }
    }

    async docker_service_update(options: any) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.stack != undefined && options.container != undefined) {
            const name = options.stack + '_' + options.container;
            let idContainer = await this.dockerScripts.getIdContainer(name);
            const service = this.docker.getService(idContainer);
            service.update();
        } else {
            console.warn('stack and container not found');
        }
    }

    async docker_inspect(options: any) {
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.stack != undefined && options.container != undefined) {
            const name = options.stack + '_' + options.container;
            let idContainer = await this.dockerScripts.getIdContainer(name);
            const container = this.docker.getContainer(idContainer);
            container.inspect((err: any, data: any) => {
                console.log(data);
            });
        } else {
            console.warn('stack and container not found');
        }
    }

    async docker_container_logs(options: any) {
        const stream = require('stream');
        const logStream = new stream.PassThrough();
        logStream.on('data', (chunk: any) => {
            console.log(chunk.toString('utf8'));
        });
        if (options.stack == undefined && this.dotenv.STACK != undefined) {
            options.stack = this.dotenv.STACK;
        }
        if (options.stack != undefined && options.container != undefined) {
            const name = options.stack + '_' + options.container;
            let idContainer = await this.dockerScripts.getIdContainer(name);
            const container = this.docker.getContainer(idContainer);
            container.logs({
                follow: true,
                stdout: true,
                stderr: true
            }, (err: any, stream: any) => {
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
        } else {
            console.warn('stack and container not found');
        }
    }

}