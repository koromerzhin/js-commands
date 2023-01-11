export declare class ProgramAction {
    dotenv: any;
    docker: any;
    dockerScripts: any;
    commands: any;
    constructor(dotenv: any, docker: any, commands: any, dockerScripts: any);
    docker_waiting(options: any): Promise<void>;
    docker_getpull_image(options: any): Promise<void>;
    docker_getname_container(options: any): Promise<void>;
    php_download_phar(options: any): Promise<void>;
    global_command(): void;
    bddset_mariadb(options: any): void;
    docker_swarm_init(options: any): void;
    docker_create_network(options: any): void;
    docker_stop(options: any): void;
    docker_deploy(options: any): void;
    docker_ls(options: any): void;
    docker_service_update(options: any): Promise<void>;
    docker_inspect(options: any): Promise<void>;
    docker_container_logs(options: any): Promise<void>;
}
