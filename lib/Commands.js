"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = void 0;
const { exec } = require('child_process');
class Commands {
    exec(cmd) {
        console.log(cmd);
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.warn(error);
                }
                console.log(stdout);
                resolve(stdout ? stdout : stderr);
            });
        });
    }
}
exports.Commands = Commands;
