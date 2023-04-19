export declare class DockerScripts {
    docker: any;
    commands: any;
    imagesData: any;
    constructor(docker: any, commands: any);
    getInfoContainers(data: any, length: any, sleep: any): Promise<void>;
    getImagesLocal(status: any): Promise<void>;
    readDockerCompose(dockerfile: string): Promise<void>;
    getNameContainer(searchStack: string, searchContainer: string): Promise<string>;
    getIdContainer(name: string): Promise<null>;
}
