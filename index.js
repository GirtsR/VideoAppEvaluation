'use strict';

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

const { recordMacVideo, recordAndroidVideo } = require('./src/record-video');
const { trimVideo } = require('./src/trim-video');
const { calculateFPS } = require('./src/calculate-fps');
const { cropVideo } = require('./src/crop-video');
const { calculateQualityScores } = require('./src/calculate-quality-scores');

// Initialize command line options
program.
  requiredOption('-t, --test-name <name>', 'Name of current test').
  requiredOption('-d, --directory <dirpath>', 'Path where test results should be stored').
  requiredOption('-r, --reference-file <filepath>', 'Path to cropped reference file that will be used in quality evaluation').
  option('-i, --recording-input <id>', 'ID of the recording input screen. Can be found by running: ffmpeg -f avfoundation -list_devices true -i " "').
  option('-p, --phone-mode', 'Set to record video from a connected Android device');

program.parse(process.argv);
const options = program.opts();

VideoAppEvaluator().catch(error => {
  // Catch any error that is thrown
  console.error(error);
  process.exit(1);
});

async function VideoAppEvaluator () {
  // Create results directory for current test name
  const resultsDir = path.join(options.directory, options.testName);
  await fs.mkdir(resultsDir, { recursive: true }, err => {
    if (err) {
      throw new Error(err);
    }
  });

  // Record video
  let recordingFile;
  if (options.recordingInput !== undefined) {
    console.log(`Recording macOS AVFoundation video device [${options.recordingInput}]...`);
    recordingFile = await recordMacVideo(options.recordingInput, resultsDir, options.testName);
  } else if (options.phoneMode !== undefined) {
    console.log(`Recording Android device screen...`);
    recordingFile = await recordAndroidVideo(resultsDir, options.testName);
  } else {
    throw new Error('Either one of macOS recording input or phone mode CLI options were not set, exiting');
  }

  // Trim video padding
  console.log('Trimming video ...');
  const trimmedFile = await trimVideo(recordingFile, resultsDir, options.testName);

  // Calculate video FPS
  console.log('Starting FPS calculation...');
  await calculateFPS(trimmedFile, resultsDir, options.testName);

  // Crop video reference area
  console.log('Cropping video ...');
  const croppedFile = await cropVideo(trimmedFile, resultsDir, options.testName);

  // Evaluate video quality
  console.log('Evaluating video quality...');
  await calculateQualityScores(croppedFile, options.referenceFile, resultsDir, options.testName, options.phoneMode === true);
}
