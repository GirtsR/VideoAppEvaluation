'use strict';

const fs = require('fs');
const path = require('path');

const pixelmatch = require('pixelmatch');
const imageData = require('@andreekeberg/imagedata');

const { executeCommand } = require('../helpers/execute-command');

module.exports = {
  trimVideo: async (recordingFile, resultsDir, testName) => {
    // Create temporary directory for storing .png format frames
    const framesDir = path.join(resultsDir, 'frames');
    await fs.mkdir(framesDir, { recursive: true }, err => {
      if (err) {
        throw new Error(err);
      }
    });
    // Save frames from received video as png files
    const frameFiles = path.join(framesDir, 'frame%d.png');
    await executeCommand(
      `ffmpeg -y -i ${recordingFile} -vf "scale=640:360" ${frameFiles}`
    );

    const frameCount = fs.readdirSync(framesDir).length;
    console.log(`Frame count: ${frameCount}`);

    // Generate sample testsrc image for comparison
    const sampleFile = path.join(framesDir, 'sample.png');
    await executeCommand(
      `ffmpeg -y -f lavfi -i testsrc=duration=1:size=1920x1080:rate=30 -frames 1 -vf "scale=640:360" -pix_fmt yuv420p ${sampleFile}`
    );
    const sampleImage = imageData.getSync(sampleFile);

    // Pixel match threshold for comparison: 80% of pixels different
    const pixelMatchThreshold = (sampleImage.width * sampleImage.height) * 0.8;
    let videoStartFrame = 0;
    let videoEndFrame = 0;

    for (let i = 1; i <= frameCount; i++) {
      const currentFrame = imageData.getSync(path.join(framesDir, `frame${i}.png`));

      const numDiffPixels = pixelmatch(sampleImage.data, currentFrame.data, null, sampleImage.width, sampleImage.height);
      if (numDiffPixels > pixelMatchThreshold) {
        // Frame is different from the padding sample
        if (videoStartFrame === 0) {
          videoStartFrame = i;
          console.log(`Found video start frame: ${videoStartFrame}`);
        }
      } else if (numDiffPixels < pixelMatchThreshold && videoStartFrame !== 0) {
        // Found padding frame after test video
        videoEndFrame = i - 1;
        console.log(`Found video end frame: ${videoEndFrame}`);
        break;
      }
    }

    console.log(`Video frame interval: ${videoStartFrame} -> ${videoEndFrame}`);

    // Cut video using frame intervals
    const trimmedFile = path.join(resultsDir, `${testName}_trimmed.mp4`);
    await executeCommand(
      `ffmpeg -y -i ${recordingFile} -vf "trim=start_frame=${videoStartFrame}:end_frame=${videoEndFrame},setpts=PTS-STARTPTS" ${trimmedFile}`
    );

    // Remove temporary frames directory
    await fs.rm(framesDir, { recursive: true }, err => {
      if (err) {
        throw new Error(err);
      }
    });

    console.log(`Trimmed video saved as ${trimmedFile}`);
    return trimmedFile;
  }
};
