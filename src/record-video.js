'use strict';

const path = require('path');

const { executeCommand } = require('../helpers/execute-command');

const RECORDING_DURATION = 15;

module.exports = {
  recordMacVideo: async function (recordingInput, resultsDir, testName) {
    // Record .mkv format video
    const originalRecordingFile = path.join(resultsDir, `${testName}_recording.mkv`);
    await executeCommand(
      `ffmpeg -y -t ${RECORDING_DURATION} -f avfoundation -framerate 30 -video_size 1920x1080 -i "${recordingInput}" -c copy ${originalRecordingFile}`,
      { verbose: false }
    );

    // Convert to .mp4
    const convertedRecordingFile = path.join(resultsDir, `${testName}_recording.mp4`);
    await executeCommand(
      `ffmpeg -y -i ${originalRecordingFile} -crf 0 -pix_fmt yuv420p -vf "scale=1920:1080,fps=30" ${convertedRecordingFile}`,
      { verbose: false }
    );

    return convertedRecordingFile;
  },
  recordAndroidVideo: async function (resultsDir, testName) {

  }
};
