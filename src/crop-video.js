'use strict';

const fs = require('fs');
const path = require('path');

const imageData = require('@andreekeberg/imagedata');
const AR = require('js-aruco').AR;

const { executeCommand } = require('../helpers/execute-command');

function roundToEven (value) {
  return 2 * Math.round(value / 2);
}

async function findMarkerInFrame (downscaleFactor, trimmedFile, resultsDir) {
  const frameFile = path.join(resultsDir, 'frame.png');
  await executeCommand(
    `ffmpeg -y -i ${trimmedFile} -frames 1 -vf "scale=iw/${downscaleFactor}:ih/${downscaleFactor},unsharp=luma_msize_x=7:luma_msize_y=7:luma_amount=2.5" ${frameFile}`
  );

  // Find marker position
  const detector = new AR.Detector();
  const frame = imageData.getSync(frameFile);
  const markers = detector.detect(frame);

  // Expected corner location in fullscreen mode
  const expectedCornerLocations = [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 300, y: 300 }, { x: 100, y: 300 }];

  let marker = markers[0];
  if (marker !== undefined) {
    marker.corners.forEach((corner, index) => {
      // Update coordinates if frame was downscaled
      corner.x *= downscaleFactor;
      corner.y *= downscaleFactor;
      // Check if recording was fullscreen
      if (Math.abs(corner.x - expectedCornerLocations[index].x) <= 10) {
        corner.x = expectedCornerLocations[index].x;
      }
      if (Math.abs(corner.y - expectedCornerLocations[index].y) <= 10) {
        corner.y = expectedCornerLocations[index].y;
      }
    });
  }

  // Remove frame file
  await fs.rm(frameFile, { recursive: true }, err => {
    if (err) {
      throw new Error(err);
    }
  });

  return marker;
}

module.exports = {
  cropVideo: async (trimmedFile, resultsDir, testName) => {
    let marker = undefined;
    let downscaleFactor = 1;
    while (marker === undefined && downscaleFactor < 4) {
      marker = await findMarkerInFrame(downscaleFactor, trimmedFile, resultsDir);
      downscaleFactor++;
    }

    if (marker === undefined) {
      throw new Error('Could not find ArUco marker in the frame');
    }

    console.log(JSON.stringify(marker));

    // Get top right corner of the marker
    const topRightCoords = marker.corners[1];
    topRightCoords.x = roundToEven(topRightCoords.x);
    topRightCoords.y = roundToEven(topRightCoords.y);

    // Calculate marker size in recording
    let markerSize = roundToEven(marker.corners[2].x - marker.corners[3].x);
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

    console.log(`Cropped video saved as ${croppedFile}`);
    return croppedFile;
  }
};
