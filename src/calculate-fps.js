'use strict';

const fs = require('fs');
const path = require('path');

const imageData = require('@andreekeberg/imagedata');
const AR = require('js-aruco').AR;

const { executeCommand } = require('../helpers/execute-command');

module.exports = {
  calculateFPS: async (trimmedFile, resultsDir, testName) => {
    // Create temporary directory for storing video frames
    const framesDir = path.join(resultsDir, 'frames2');
    await fs.mkdir(framesDir, { recursive: true }, err => {
      if (err) {
        throw new Error(err);
      }
    });
    // Save frames from received video as png files
    const frameFiles = path.join(framesDir, 'frame%d.png');
    await executeCommand(`ffmpeg -y -i ${trimmedFile} -vf "scale=640:360" ${frameFiles}`);

    const frameCount = fs.readdirSync(framesDir).length;
    console.log(`Frame count: ${frameCount}`);

    // Start marker detection
    const FPS = 30;
    const detector = new AR.Detector();
    const fpsResults = [];
    let prevMarkerID = 0;

    for (let i = 1; i <= frameCount; i++) {
      const currentIndex = Math.ceil(i / FPS) - 1;
      if (i % FPS === 1) {
        // Initialize current second FPS counter
        fpsResults.push(0);
      }
      const frame = imageData.getSync(`${framesDir}/frame${i}.png`);
      const markers = detector.detect(frame);
      if (markers.length === 0) {
        console.error(`No marker found in frame ${i}`);
      } else {
        const markerID = markers[0].id;
        if (markerID === prevMarkerID) {
          console.error(`Duplicate marker with ID ${markerID} in frame ${i}`);
        } else {
          // Found correct marker: increase FPS counter
          fpsResults[currentIndex]++;
          prevMarkerID = markerID;
        }
      }

      if (i % FPS === 0) {
        console.log(`FPS for second ${currentIndex + 1}: ${fpsResults[currentIndex]}`);
      }
    }

    console.log(`FPS measurements: ${fpsResults}`);

    // Remove frames directory
    await fs.rm(framesDir, { recursive: true }, err => {
      if (err) {
        throw new Error(err);
      }
    });

    // Write FPS results to file
    const fpsFile = path.join(resultsDir, `${testName}_fps.json`);
    await fs.writeFile(fpsFile, JSON.stringify(fpsResults), err => {
      if (err) {
        throw new Error(err);
      }
    });

    console.log(`FPS measurements saved to file ${fpsFile}`);
  }
}
