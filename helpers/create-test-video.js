'use strict';

const { program } = require('commander');
const ArucoMarker = require('aruco-marker');
const path = require('path');
const fs = require('fs');
const GIFEncoder = require('gifencoder');
const svg2img = require('svg2img');
const imageData = require('@andreekeberg/imagedata');
const { executeCommand } = require('./execute-command');

// Initialize command line options
program
.requiredOption('-o, --originalFile <original_filepath>', 'Path to original video file')
.requiredOption('-p, --paddingFile <padding_filepath>', 'Path to padding video file');
program.parse(process.argv);
const options = program.opts();

createTestVideo().catch(error => {
  // Catch any error that is thrown
  console.error(error);
  process.exit(1);
});

async function createTestVideo() {
  console.log(options);
  const originalFilepath = options.originalFile;
  const paddingFilepath = options.paddingFile;
  const fileObj = path.parse(originalFilepath);
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
    const promise = (marker) => {
      return new Promise((resolve, reject) => {
        svg2img(marker, (error, buffer) => {
          if (error) {
            reject(error);
          }
          resolve(buffer);
        });
      });
    }
    const markerImage = await promise(marker);
    const markerData = await imageData.getSync(markerImage);
    encoder.addFrame(markerData.data);
  }
  encoder.finish();

  // Step 2: add markers as watermark to the video
  console.log('Adding markers to the video');
  const referenceMarkedFile = path.join(fileObj.dir, `${fileObj.name}_marked${fileObj.ext}`);
  await executeCommand(`ffmpeg -y -i ${originalFilepath} -ignore_loop 0 -r 30 -i ${markerFile} -filter_complex "overlay=100:100:shortest=1" ${referenceMarkedFile}`);

  // Step 3: add testsrc padding to video
  console.log('Adding padding to start and end of the video');
  await executeCommand(`ffmpeg -y -f lavfi -i testsrc=duration=5:size=1920x1080:rate=30 -pix_fmt yuv420p ${paddingFilepath}`);

  const webcamFile = path.join(fileObj.dir, `${fileObj.name}_full${fileObj.ext}`);
  await executeCommand(`ffmpeg -y -i ${paddingFilepath} -i ${referenceMarkedFile} -filter_complex "[0:v:0][1:v:0][0:v:0]concat=n=3:v=1[outv]" -map "[outv]" ${webcamFile}`);

  console.log(`Fake Webcam video file saved as ${webcamFile}`);

  // Step 4: create reference cropped video for quality evaluation
  const referenceFile = path.join(fileObj.dir, `${fileObj.name}_reference${fileObj.ext}`);
  await executeCommand(`ffmpeg -y -i ${referenceMarkedFile} -vf "crop=1320:880:300:100" ${referenceFile}`);

  console.log(`Cropped reference file saved as ${referenceFile}`);
}
