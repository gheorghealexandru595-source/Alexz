# The free automatic editor

Replaces the CapCut steps. Free: only Python 3 and ffmpeg.

## The easiest way: let Claude do it
1. In Google Flow, generate the 9 blocks of a video (prompts in `videos/video-NN.md`) and **download** each one (Download → MP4).
2. Name them `01.mp4` … `09.mp4` in scene order (or just tell Claude which is which).
3. Optional: screen recordings of your Google Sheet for the scenes marked "Overlay in CapCut", named by scene, e.g. `05.mp4`.
4. Upload them in the chat and say "edit video 1". Claude runs the editor and sends back `final.mp4` + the cover.

## What the editor does
- Converts everything to 1080×1920, 30 fps.
- Cuts the dead air at the start and end of each block, but keeps the video **over 61 seconds** (for Creator Rewards).
- A punch-in zoom halfway through each block, so the image never sits still.
- The big hook text for the first 3 seconds, then the scene's on-screen text in the top third.
- Word captions in the lower third, 3 words at a time; numbers and CAPS words in terracotta.
- A small "AI creator · @steadywithnora" tag at the bottom.
- Screen recordings fill the frame while Nora keeps talking in a small window.
- Optional licensed music at low volume under the voice, loudness normalised to -14 LUFS.
- Saves a cover image (`final-cover.jpg`).

## Running it on your own computer
1. Install Python 3 (python.org) and ffmpeg (ffmpeg.org; on Windows: `winget install ffmpeg`).
2. Put the clips in `clips/video-01/`.
3. In this folder run:
   ```
   python3 editor/edit.py videos/video-01.md clips/video-01
   ```
   Add `--music music.mp3` for background music (only music you have the rights to).

Captions are timed from the script and the speech in each block, not transcribed, so if Veo says a line slightly differently, check the captions before posting.
