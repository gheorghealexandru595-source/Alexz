---
name: edit-nora-video
description: Stitch and edit the 9 Google Flow clips of a Steady with Nora video into the final 1080x1920 TikTok/Reels file with captions, zooms, screen-recording overlays and a cover. Use when the user uploads Flow clips or asks to edit, join or export a video from videos/.
---

# Edit a Nora video

1. Find the clips the user uploaded (usually under `/root/.claude/uploads/...`). Copy them into a fresh folder `clips/video-NN/` and rename them `01.mp4` … `09.mp4` in scene order. If the order isn't obvious from the names, ask the user once.
2. Screen recordings for a scene go in `clips/video-NN/overlays/NN.mp4` (the scenes that say "Overlay in CapCut" in `videos/video-NN.md`).
3. Run:
   ```
   python3 editor/edit.py videos/video-NN.md clips/video-NN [--music path/to/licensed.mp3]
   ```
   Requires only `ffmpeg` and Python 3 (no pip packages).
4. Check the output: it must say over 60 s. Pull 4 frames with ffmpeg and look at them (face not covered by captions, top text readable).
5. Send `final.mp4` and `final-cover.jpg` to the user. Remind them to turn on the AI-generated label when posting. Do not commit the clips or the rendered video to git (they're large); `clips/` is ignored.
