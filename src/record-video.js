'use strict';

const path = require('path');

const { executeCommand } = require('../helpers/execute-command');

const RECORDING_DURATION = 15;

module.exports = {
  recordMacVideo: async (recordingInput, resultsDir, testName) => {
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

    console.log(`Recording saved to file ${convertedRecordingFile}`);
    return convertedRecordingFile;
  },
  recordAndroidVideo: async function (resultsDir, testName) {
    // Record and save recording on Android device using screenrecord
    const phoneFile = `/sdcard/${testName}_raw.mp4`;
    await executeCommand(
      `adb shell screenrecord --time-limit=15 --size 1920x1080 ${phoneFile}`
    );

    // Move file to computer using adb pull
    const rawFile = path.join(resultsDir, `${testName}_raw.mp4`);
    await executeCommand(
      `adb pull ${phoneFile} ${rawFile}`
    );

    // Re-encode to 30 FPS
    const convertedRecordingFile = path.join(resultsDir, `${testName}_recording.mp4`);
    await executeCommand(
      `ffmpeg -y -i ${rawFile} -r 30 ${convertedRecordingFile}`
    );

    console.log(`Recording saved to file ${convertedRecordingFile}`);
    return convertedRecordingFile;
  }
};
