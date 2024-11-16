## VideoAppEvaluation

This repository contains tools for full reference video quality assessment between a reference and a recording (degraded file).

This testing solution was used to evaluate the video quality of three of the most popular real-time communications
applications: Zoom, Microsoft Teams and Google Meet on MacOS and Android devices.

### Project dependencies

- [Node.js](https://nodejs.org/en/download/)
- [npm](https://www.npmjs.com/) package manager
- [ffmpeg](https://ffmpeg.org/) library
- [ffmpeg-quality-metrics](https://github.com/slhck/ffmpeg-quality-metrics) Python package

### Installation

```shell
npm i
brew install ffmpeg
python3 -m venv ./venv
source ./venv/bin/activate
pip3 install ffmpeg-quality-metrics
```

### Preprocessing

Creation of the test video: [create-test-video.js](helpers/create-test-video.js)**

This script will first add an [ArUco marker](https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html) watermark to a .mp4 video, 
which will update once every video frame (markers are later used for FPS calculation).

Then, a padding video will be prepended and appended to the video, so that the recording can be synchronized with the reference video.

The following videos will be generated for testing:
 - `<filename>_marked.mp4`: Original video with the ArUco markers added
 - `<filename>_reference.mp4`: A cropped version of the original video, which only contains the central part of the video
   (used for full reference quality evaluation)
 - `<filename>_full.mp4`: Full video with padding and ArUco markers which is used for creation of a fake webcam
   (e.g [OBS Virtual Camera](https://obsproject.com/kb/virtual-camera-guide))
 - 

Example command:
```shell
node helpers/create-test-video.js --originalFile assets/BirdsInCage_30fps.mp4 --paddingFile assets/padding.mp4
```

### Video quality evaluation

#### Video recording: [record-video.js](src/record-video.js)**

In the first step, the tool records a 15 second video on the test device. Currently, recording is supported on MacOS 
(using the `ffmpeg` library) and on Android (using `adb screenrecord`).

#### Video trimming: [trim-video.js](src/trim-video.js)**

After recording, the video is trimmed, removing the padding from the start and end of the recording.

#### FPS calculation: [calculate-fps.js](src/calculate-fps.js)**

Next, FPS is calculated in the recorded video by checking each frame and verifying that it contains a unique ArUco
marker. FPS results are saved in a file called `${testName}_fps.json`.

#### Video cropping: [crop-video.js](src/crop-video.js)**

The video is then cropped to only contain the central part of the screen.

#### Quality evaluation (VMAF, PSNR, SSIM): [calculate-quality-scores.js](src/calculate-quality-scores.js)

Finally, the [ffmpeg-quality-metrics](https://github.com/slhck/ffmpeg-quality-metrics) script is executed to retrieve
VMAF, PSNR and SSIM video quality scores, comparing the recording with the reference file. Quality scores are saved to 
in a file called `${testName}_quality.json`.

### Running the tool

#### Recording on a MacOS device

First, find the ID of the screen you want to capture using the following command:
```shell
ffmpeg -f avfoundation -list_devices true -i " "
```
Then run the tool:
```shell
node index.js -d <path_to_results_folder> -r <path_to_reference_video> -t <test_name> -i <screen_index_to_record>
```

Example command (recording the main screen with ID `1`):
```shell
node index.js -d results -r assets/BirdsInCage_30fps_reference.mp4 -t Meet_baseline -i 1
```

#### Recording on an Android device

Connect the device to your laptop and run the tool with the additional `-p`/`--phone-mode` argument:
```shell
node index.js -d <path_to_results_folder> -r <path_to_reference_video> -t <test_name> -p
```

Example command:
```shell
node index.js -d results -r assets/BirdsInCage_30fps_reference.mp4 -t Zoom_mobile_baseline -p
```

#### Additional help
```shell
node index.js -h
```

### Testing results (2022)

This tool was created and used as part of the master's thesis "Automated evaluation of video quality 
in real-time communications software testing" published in 2022, where the video quality of video conferencing
applications **Zoom**, **Google Meet** and **Microsoft Teams** was compared.

Tests were conducted in optimal network conditions and additionally in degraded network conditions 
(limited bandwidth and packet loss).