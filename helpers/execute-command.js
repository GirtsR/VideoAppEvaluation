'use strict';

const childProcess = require('child_process');
const fs = require('fs');

module.exports = {
  /**
   * Executes a command on the host
   * @param {string} command - Command that needs to be executed
   * @param {string} workingDirectory - Directory where the command needs to be executed
   * @param {boolean} verbose - Set to true to enable logging for this command
   * @param {string} outputFile - Path to output for file for stdout
   * @returns {Promise<string>} - Resolves the Promise with the command output or rejects it with the error message of the command
   */
  executeCommand: (command, { workingDirectory = '.', verbose = false, outputFile = undefined } = {}) => {
    console.log(`Executing command: ${command}`);
    return new Promise((resolve, reject) => {
      const process = childProcess.exec(command, { cwd: workingDirectory }, (error, stdout) => {
        if (typeof outputFile !== 'undefined') {
          fs.writeFile(outputFile, stdout, err => {
            if (err) {
              throw new Error(err);
            }
          });
        }
        if (error) {
          reject(error);
        }

        resolve(stdout);
      });

      if (verbose === true) {
        process.stdout.on('data', data => {
          console.log(data);
        });

        process.stderr.on('data', data => {
          console.error(data);
        });
      }
    });
  }
};
