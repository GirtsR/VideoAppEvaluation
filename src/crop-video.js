'use strict';

const fs = require('fs');
const path = require('path');

const imageData = require('@andreekeberg/imagedata');
const AR = require('js-aruco').AR;

const { executeCommand } = require('../helpers/execute-command');

function roundToEven(value) {
  return 2 * Math.round(value / 2);
}

module.exports = {
  cropVideo: async function (trimmedFile, resultsDir, testName) {
    // Save first frame to file
    const frameFile = path.join(resultsDir, 'frame.png');
    await executeCommand(
      `ffmpeg -y -i ${trimmedFile} -frames 1 -vf "unsharp=luma_msize_x=7:luma_msize_y=7:luma_amount=2.5" ${frameFile}`
    );

    // Find marker position
    const detector = new AR.Detector();
    const frame = imageData.getSync(frameFile);
    const markers = detector.detect(frame);

    console.log(JSON.stringify(markers[0]));

    // Get top right corner of the marker
    const topRightCoords = markers[0].corners[1];
    topRightCoords.x = roundToEven(topRightCoords.x);
    topRightCoords.y = roundToEven(topRightCoords.y);

    // Calculate marker size in recording
    let markerSize = roundToEven(markers[0].corners[2].x - markers[0].corners[3].x);
    // Round markerSize to even number
    markerSize = 2 * Math.round(markerSize / 2);
    // const markerSize = 200;
    const expectedMarkerSize = 200;

    // Recording upscale factor to match reference
    const videoUpscale = expectedMarkerSize / markerSize;

    console.log(`ArUco marker top right coordinates: ${JSON.stringify(topRightCoords)}`);
    console.log(`Marker size: ${markerSize}, upscale factor: ${videoUpscale}`);

    const downscaledHorixPx = Math.round(1320 / videoUpscale);
    const downscaledVertPx = Math.round(880 / videoUpscale);

    console.log(`${downscaledHorixPx}x${downscaledVertPx}`);

    // Crop and scale to same resolution as reference
    const croppedFile = path.join(resultsDir, `${testName}_cropped.mp4`);
    await executeCommand(
      `ffmpeg -y -i ${trimmedFile} -vf "crop=${downscaledHorixPx}:${downscaledVertPx}:${topRightCoords.x}:${topRightCoords.y},scale=1320:880" ${croppedFile}`
    );
    console.log(`Cropped file saved as ${croppedFile}`);

    // Remove first frame file
    await fs.rm(frameFile, { recursive: true }, err => {
      if (err) {
        throw new Error(err);
      }
    });

    return croppedFile;
  }
}
