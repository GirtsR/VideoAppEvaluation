https://trac.ffmpeg.org/wiki/Capture/Desktop

Local Recording on Mac:

```bash
ffmpeg -f avfoundation -list_devices true -i ""
```
```bash
ffmpeg -t <duration> -f avfoundation -framerate 30 -i "<OBS camera ID>" outgoing.mkv
```

Incoming recoding on Mac:

```bash
ffmpeg -t <duration> -f avfoundation -framerate 30 -i "<screen device>" incoming.mkv
```

VMAF command:
```bash
docker run --rm -v $PWD:/out gfdavila/easyvmaf -r /out/videos/2_ppl_speaking_reference.y4m -d /out/incoming_padded_cut.y4m
ffmpeg_quality_metrics <degraded> <reference> -m vmaf ssim psnr
```

Convert: 

Crop:
in_w is the width of the output rectangle
in_h is the height of the output rectangle
x and y specify the top left corner of the output rectangle
"crop=in_w:in_h:x:y"
```bash
ffmpeg -i incoming3_flip.mkv -vf "fps=30,crop=in_w-200:in_h-200:keep_aspect=1" incoming4.y4m
ffmpeg -i outgoing3.mkv -vf "fps=30,crop=in_w-200:in_h-200:keep_aspect=1" outgoing4.y4m
ffmpeg -i incoming_padded.mkv -vf "fps=30" incoming_padded.y4m
ffmpeg -i outgoing5_flip.mkv -vf "fps=30" outgoing5.y4m
ffmpeg -i ./videos/2_ppl_speaking_reference.y4m -vf "crop=in_w-200:in_h-200" 2_ppl_crop.y4m
ffmpeg -i incoming_padded_cut.y4m -vf "crop=in_w-200:in_h-200" incoming_crop.y4m
-pix_fmt yuv420p
```


AI: add padding with testsrc (ffmpeg)

https://www.npmjs.com/package/resemblejs

Add watermark to video:
```bash
ffmpeg -i 2_ppl_speaking.mp4 -ignore_loop 0 -r 30 -i markers.gif -filter_complex "overlay=100:100:shortest=1" 2_ppl_speaking_marked.mp4
```

Getting all frames:
```bash
ffmpeg -i incoming_m.mkv -vf "scale=640:360" 'frames/frame%d.png'
```


/Applications/VLC.app/Contents/MacOS/VLC --demux rawvideo --rawvid-fps 30 --rawvid-width 1920 --rawvid-height 1080 --rawvid-chroma I420 videos/BirdsInCage_30fps.yuv

Recording on mobile:
```bash
adb shell screenrecord --time-limit=15 --size 1920x1080 /sdcard/mobile.mp4
adb pull /sdcard/mobile.mp4 $PWD/results/mobile.mp4
ffmpeg -i results/mobile.mp4 -r 30 results/mobile_30fps.mp4
```

ffmpeg -i results/pc_zoom_cut_cropped.mp4 -i results/BirdsInCage_30fps_crop.mp4 -filter_complex "[0:v]scale=1920x1080:flags=bicubic[main]; [1:v]scale=1920x1080:flags=bicubic,format=pix_fmts=yuv420p,fps=fps=30/1[ref]; [main][ref]libvmaf=psnr=true:log_path=vmaflog.json:log_fmt=json" -f null -
