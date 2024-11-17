## VideoAppEvaluation

This repository contains tools for full reference video quality assessment between a reference and a recording (degraded file).

This testing solution was used to evaluate the video quality of three of the most popular real-time communications
applications: Zoom, Microsoft Teams and Google Meet on MacOS and Android devices. This testing was conducted as part of the
Master's thesis _"Automated evaluation of video quality in real-time
communications software testing"_.

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

Creation of the test video: [create-test-video.js](helpers/create-test-video.js)

This script will first add an [ArUco marker](https://docs.opencv.org/4.x/d5/dae/tutorial_aruco_detection.html) watermark to a .mp4 video, 
which will update once every video frame (markers are later used for FPS calculation).

Then, a padding video will be prepended and appended to the video, so that the recording can be synchronized with the reference video.

The following videos will be generated for testing:
 - `<filename>_marked.mp4`: Original video with the ArUco markers added

https://github.com/user-attachments/assets/d3a6118b-bfe1-4034-8a25-ba3146aefdac

 - `<filenaame>_reference.mp4`: A cropped version of the original video, which only contains the central part of the video
   (used for full reference quality evaluation)

https://github.com/user-attachments/assets/c96ca2d0-8924-478f-8542-4c76854b29e3

 - `<filename>_full.mp4`: Full video with padding and ArUco markers which is used in the tests as a fake webcam input
   (e.g with [OBS Virtual Camera](https://obsproject.com/kb/virtual-camera-guide))

https://github.com/user-attachments/assets/4b1ddfad-d4fc-43c3-9526-20fd5b3102c6

Example command:
```shell
node helpers/create-test-video.js --originalFile assets/BirdsInCage_30fps.mp4 --paddingFile assets/padding.mp4
```

### Video quality evaluation

#### Video recording: [record-video.js](src/record-video.js)

In the first step, the tool records a 15 second video on the test device. Currently, recording is supported on MacOS 
(using the `ffmpeg` library) and on Android (using `adb screenrecord`).

Example recording from testing with Zoom (Zoom_baseline1):

https://github.com/user-attachments/assets/08d3895f-a274-4fee-988e-e3d2cd1d8d31

#### Video trimming: [trim-video.js](src/trim-video.js)

After recording, the video is trimmed, removing the padding from the start and end of the recording.

Example trimmed video:

https://github.com/user-attachments/assets/06669b7b-456a-4da3-b6d2-9a153cd1ba82

#### FPS calculation: [calculate-fps.js](src/calculate-fps.js)

Next, FPS is calculated in the recorded video by checking each frame and verifying that it contains a unique ArUco
marker. FPS results are saved in a file called `${testName}_fps.json`.

Example FPS results:
```json
[30,29,30,30,30,30,29]
```

#### Video cropping: [crop-video.js](src/crop-video.js)**

The video is then cropped to only contain the central part of the screen.

Example cropped video:

https://github.com/user-attachments/assets/72b59cd1-86a8-4daa-865f-7cd6763172c5

#### Quality evaluation (VMAF, PSNR, SSIM): [calculate-quality-scores.js](src/calculate-quality-scores.js)

Finally, the [ffmpeg-quality-metrics](https://github.com/slhck/ffmpeg-quality-metrics) script is executed to retrieve
VMAF, PSNR and SSIM video quality scores, comparing the cropped recording with the reference file. Quality scores are saved to 
in a file called `${testName}_quality.json`.

Example fragment from quality results:

```json
{
    "vmaf": [
        {
            "psnr": 28.956591,
            "integer_motion2": 0.0,
            "integer_motion": 0.0,
            "integer_adm2": 0.902353,
            "integer_adm_scale0": 0.917597,
            "integer_adm_scale1": 0.822193,
            "integer_adm_scale2": 0.877864,
            "integer_adm_scale3": 0.944743,
            "ssim": 0.979817,
            "integer_vif_scale0": 0.618589,
            "integer_vif_scale1": 0.8699,
            "integer_vif_scale2": 0.928493,
            "integer_vif_scale3": 0.958831,
            "ms_ssim": 0.984346,
            "vmaf": 70.198867,
            "n": 1
        },
        {
            "psnr": 28.982136,
            "integer_motion2": 0.158219,
            "integer_motion": 0.241165,
            "integer_adm2": 0.905198,
            "integer_adm_scale0": 0.921442,
            "integer_adm_scale1": 0.824236,
            "integer_adm_scale2": 0.879463,
            "integer_adm_scale3": 0.948508,
            "ssim": 0.980991,
            "integer_vif_scale0": 0.632037,
            "integer_vif_scale1": 0.88194,
            "integer_vif_scale2": 0.938547,
            "integer_vif_scale3": 0.967049,
            "ms_ssim": 0.985196,
            "vmaf": 71.990989,
            "n": 2
        },
    ]
}
    "global": {
        "vmaf": {
            "average": 68.282,
            "median": 72.5,
            "stdev": 8.795,
            "min": 34.572,
            "max": 76.547
        },
        "psnr": {
            "average": 30.165,
            "median": 30.51,
            "stdev": 0.837,
            "min": 26.41,
            "max": 30.84
        },
        "ssim": {
            "average": 0.969,
            "median": 0.972,
            "stdev": 0.008,
            "min": 0.931,
            "max": 0.975
        }
    },
    "input_file_dist": "results/Zoom_baseline/Zoom_baseline_cropped.mp4",
    "input_file_ref": "videos/BirdsInCage_30fps_reference.mp4"
```

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

Example command (recording the default screen with ID `1`):
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

Tests were conducted in optimal network conditions and additionally in degraded network conditions:
 - Bandwidth constraints: 2000kbps (bw2000), 1000kbps (bw1000), 500kbps (bw500), 200kbps (bw200)
 - Incoming packet loss: 5% (pl5), 10% (pl10), 20% (pl20) 

Overall, results showed that Zoom provided the highest video quality and FPS between the competitors in both
optimal (baseline network conditions).

All recordings and performance metrics from the executed tests can be found [here](https://drive.google.com/drive/folders/1QG-RmArThu03Xqa6FHIXQkubpu7kByuj.

Summarised graphs from the results gathered on MacOS can be found below:

![fps_bandwidth](https://github.com/user-attachments/assets/3a7b3470-84f9-434b-8e8c-d57e5af1d784)

![fps_packet_loss](https://github.com/user-attachments/assets/7e34f87f-b054-4767-bf72-a431c993da35)

![vmaf_bandwidth](https://github.com/user-attachments/assets/299ef2e4-d0b3-43c9-b4a6-d6aa2dbcada2)

![vmaf_packet_loss](https://github.com/user-attachments/assets/a1d57548-e778-4c79-84e8-6d7389230bac)


