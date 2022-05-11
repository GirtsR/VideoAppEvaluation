'use strict';

const { program } = require('commander');
const ArucoMarker = require('aruco-marker');
const path = require('path');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const svgToImg = require("svg-to-img");
const imageData = require('@andreekeberg/imagedata');
const { executeCommand } = require('./execute-command');

// Initialize command line options
program
.requiredOption('-f, --filepath <filepath>', 'Path to original video file');
program.parse(process.argv);
const options = program.opts();

createTestVideo().catch(error => {
  // Catch any error that is thrown
  console.error(error);
  process.exit(1);
});

async function createTestVideo() {
  const filepath = options.filepath;
  const fileObj = path.parse(filepath);
  const FPS = 30;

  // Step 1: create 200x200px ArUco marker GIF
  console.log('Creating ArUco markers');
  const encoder = new GIFEncoder(200, 200);
  const markerFile = path.join(fileObj.dir, 'markers.gif');
  encoder.createReadStream().pipe(fs.createWriteStream(markerFile));

  encoder.start();
  encoder.setFrameRate(FPS);
  encoder.setRepeat(0);

  for (let i = 1; i <= FPS; i++) {
    // Create new unique ArUco marker
    const marker = new ArucoMarker(i).toSVG('200px');
    const markerData = imageData.getSync(await svgToImg.from(marker).toPng());
    encoder.addFrame(markerData.data);
  }
  encoder.finish();

  // Step 2: add markers as watermark to the video
  console.log('Adding markers to the video');
  const referenceMarkedFile = path.join(fileObj.dir, `${fileObj.name}_marked${fileObj.ext}`);
  await executeCommand(`ffmpeg -y -i ${filepath} -ignore_loop 0 -r 30 -i ${markerFile} -filter_complex "overlay=100:100:shortest=1" ${referenceMarkedFile}`);

  // Step 3: add testsrc padding to video
  console.log('Adding padding to start and end of the video');
  const paddingFile = path.join(fileObj.dir, 'padding.mp4');
  await executeCommand(`ffmpeg -y -f lavfi -i testsrc=duration=5:size=1920x1080:rate=30 -pix_fmt yuv420p ${paddingFile}`);

  const webcamFile = path.join(fileObj.dir, `${fileObj.name}_full${fileObj.ext}`);
  await executeCommand(`ffmpeg -y -i ${paddingFile} -i ${referenceMarkedFile} -filter_complex "[0:v:0][1:v:0][0:v:0]concat=n=3:v=1[outv]" -map "[outv]" ${webcamFile}`);

  console.log(`Fake Webcam video file saved as ${webcamFile}`);

  // Step 4: create reference cropped video for quality evaluation
  const referenceFile = path.join(fileObj.dir, `${fileObj.name}_reference${fileObj.ext}`);
  await executeCommand(`ffmpeg -y -i ${referenceMarkedFile} -vf "crop=1320:880:300:100" ${referenceFile}`);

  console.log(`Cropped reference file saved as ${referenceFile}`);
}
