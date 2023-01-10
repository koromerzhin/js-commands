const { exec } = require('child_process');

export class Commands {
    exec(cmd: any) {
        console.log(cmd);
        return new Promise((resolve, reject) => {
            exec(
                cmd,
                (error: any, stdout: any, stderr: any) => {
                if (error) {
                    console.warn(error);
                }
                
                console.log(stdout);
                resolve(stdout? stdout : stderr);
                }
            );
        });
    }
}