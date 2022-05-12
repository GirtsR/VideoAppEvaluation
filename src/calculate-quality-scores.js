'use strict';

const path = require('path');

const { executeCommand } = require('../helpers/execute-command');

module.exports = {
  calculateQualityScores: async (degradedFile, referenceFile, resultsDir, testName, phoneMode = false) => {
    const resultsJSON = path.join(resultsDir, `${testName}_quality.json`);

    // Calculate VMAF, PSNR and SSIM values
    let commandArgs = '-m vmaf psnr ssim';
    if (phoneMode === true) {
      // Use VMAF phone model for evaluation
      commandArgs += ' --phone-model';
    }

    await executeCommand(
      `ffmpeg_quality_metrics ${degradedFile} ${referenceFile} ${commandArgs}`,
      { outputFile: resultsJSON }
    );

    console.log(`Objective quality scores saved to file ${resultsJSON}`);
  }
};
