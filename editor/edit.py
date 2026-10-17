#!/usr/bin/env python3
"""Free automatic editor for Steady with Nora videos (replaces the CapCut steps).

Usage:
  python3 editor/edit.py videos/video-01.md clips/video-01 [--music music.mp3] [--out out.mp4]

The clips folder holds the Flow downloads named 01.mp4 ... 09.mp4 (one per scene).
Optional screen recordings go in <clips>/overlays/NN.mp4 (NN = scene number); they
fill the frame while Nora keeps talking in a small window.

What it does: 1080x1920 30 fps, trims dead air at the start and end of every block
(but keeps the video over 61 s), a punch-in zoom halfway through each block, the
scene's on-screen text in the top third, word captions with numbers and CAPS words
in terracotta, a small "AI creator" tag, optional music ducked under the voice,
loudness at -14 LUFS, plus a cover image.
"""
import argparse, json, os, re, subprocess, sys, tempfile

W, H, FPS = 1080, 1920, 30
MIN_TOTAL = 61.0
PAD = 0.15
FONT = "Inter"
TERRACOTTA = "&H003A56C0"  # ASS colours are &HAABBGGRR
WHITE, BLACK, CHARCOAL, CREAM = "&H00FFFFFF", "&H00000000", "&H002B2B2B", "&H00E6EFF4"


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        sys.exit(f"command failed: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r


def duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", path])
    return float(json.loads(r.stdout)["format"]["duration"])


def has_audio(path):
    r = run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", path])
    return bool(r.stdout.strip())


def parse_script(md_path):
    text = open(md_path, encoding="utf-8").read()
    scenes = []
    for block in re.split(r"^### Scene ", text, flags=re.M)[1:]:
        line = re.search(r'\*\*Line\*\* \([^)]*\): "(.*)"', block)
        onscreen = re.search(r"\*\*On-screen text:\*\* `([^`]*)`", block)
        scenes.append({"line": line.group(1), "text": onscreen.group(1) if onscreen else ""})
    hook = re.search(r"\*\*Big text on the first frame[^`]*`([^`]*)`", text)
    return scenes, (hook.group(1) if hook else "")


def speech_bounds(path, dur):
    """First and last moment of speech, from ffmpeg silencedetect."""
    if not has_audio(path):
        return 0.0, dur
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "silencedetect=noise=-35dB:d=0.25",
                        "-f", "null", "-"], capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    first, last = 0.0, dur
    if starts and starts[0] <= 0.05 and ends:
        first = ends[0]
    if starts and (len(ends) < len(starts) or ends[-1] >= dur - 0.05):
        last = starts[-1]
    if last - first < 1.0:
        return 0.0, dur
    return max(0.0, first - PAD), min(dur, last + PAD)


def plan_trims(clips):
    """Trim dead air, then give some back evenly if the total would fall under MIN_TOTAL."""
    plans = []
    for c in clips:
        d = duration(c)
        s, e = speech_bounds(c, d)
        plans.append({"path": c, "dur": d, "start": s, "end": e, "speech": (s, e)})
    total = sum(p["end"] - p["start"] for p in plans)
    full = sum(p["dur"] for p in plans)
    if total < MIN_TOTAL:
        need = min(MIN_TOTAL, full) - total
        removed = full - total
        k = need / removed if removed else 0
        for p in plans:
            head, tail = p["start"], p["dur"] - p["end"]
            p["start"] -= head * k
            p["end"] += tail * k
    return plans


def ass_time(t):
    h, rem = divmod(max(t, 0), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def esc(s):
    return s.replace("{", "(").replace("}", ")").replace("\\", "/")


def word_style(word, highlight):
    clean = re.sub(r"[^\w$']", "", word)
    if re.search(r"\d", word) or (clean.isupper() and len(clean) > 1) or clean.lower() in highlight:
        return "{\\c" + TERRACOTTA + "&}" + esc(word) + "{\\c" + WHITE + "&}"
    return esc(word)


def build_ass(plans, scenes, hook, path):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{FONT},86,{WHITE},{WHITE},{BLACK},{BLACK},-1,0,0,0,100,100,0,0,1,7,0,5,80,80,0,1
Style: Top,{FONT},58,{CHARCOAL},{CHARCOAL},{CREAM},{CREAM},-1,0,0,0,100,100,0,0,3,18,0,8,90,90,110,1
Style: Hook,{FONT},92,{WHITE},{WHITE},{BLACK},{BLACK},-1,0,0,0,100,100,0,0,1,8,0,8,70,70,100,1
Style: Tag,{FONT},34,{WHITE},{WHITE},{BLACK},{BLACK},0,0,0,0,100,100,0,0,1,3,0,1,50,50,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    t0 = 0.0
    for i, (p, sc) in enumerate(zip(plans, scenes)):
        seg = p["end"] - p["start"]
        if i == 0 and hook:
            ev.append(f"Dialogue: 2,{ass_time(0)},{ass_time(min(3.0, seg))},Hook,,0,0,0,,{esc(hook)}")
            top_start = min(3.0, seg)
        else:
            top_start = 0.0
        if sc["text"]:
            ev.append(f"Dialogue: 1,{ass_time(t0 + top_start)},{ass_time(t0 + seg)},Top,,0,0,0,,{esc(sc['text'])}")
        # spoken captions: chunks of up to 3 words, timed by character length across the speech
        s0, e0 = p["speech"]
        speak_from = (s0 + (PAD if s0 > 0 else 0)) - p["start"]
        speak_to = (e0 - (PAD if e0 < p["dur"] else 0)) - p["start"]
        words = sc["line"].split()
        chunks = [words[j:j + 3] for j in range(0, len(words), 3)]
        weights = [sum(len(w) + 1 for w in c) for c in chunks]
        tot = sum(weights) or 1
        highlight = {w.lower().strip(".,!?") for w in sc["text"].split() if w.isupper() and len(w) > 1}
        cur = speak_from
        for c, wgt in zip(chunks, weights):
            nxt = cur + (speak_to - speak_from) * wgt / tot
            txt = " ".join(word_style(w, highlight) for w in c)
            ev.append(f"Dialogue: 0,{ass_time(t0 + cur)},{ass_time(t0 + nxt)},Cap,,0,0,0,,{{\\pos({W // 2},{int(H * 0.66)})}}{txt}")
            cur = nxt
        t0 += seg
    ev.append(f"Dialogue: 3,{ass_time(0)},{ass_time(t0)},Tag,,0,0,0,,AI creator · @steadywithnora")
    open(path, "w", encoding="utf-8").write(head + "\n".join(ev) + "\n")
    return t0


def render_block(p, overlay, out):
    seg = p["end"] - p["start"]
    half = seg / 2
    base = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},setsar=1")
    # punch-in zoom for the second half of the block
    zoom = (f"{base},split[a][b];[a]trim=0:{half:.3f},setpts=PTS-STARTPTS[a1];"
            f"[b]trim={half:.3f},setpts=PTS-STARTPTS,scale={int(W * 1.1)}:{int(H * 1.1)},crop={W}:{H}[b1];"
            f"[a1][b1]concat=n=2:v=1:a=0")
    inputs = ["-ss", f"{p['start']:.3f}", "-t", f"{seg:.3f}", "-i", p["path"]]
    if overlay:
        inputs += ["-stream_loop", "-1", "-t", f"{seg:.3f}", "-i", overlay]
        vf = (f"[0:v]{base},scale=360:640,pad=372:652:6:6:color=0xF4EFE6[pip];"
              f"[1:v]{base}[bg];[bg][pip]overlay=W-w-40:H-h-170[v]")
    else:
        vf = f"[0:v]{zoom}[v]"
    if has_audio(p["path"]):
        af = ["-map", "0:a", "-c:a", "aac", "-ar", "48000", "-ac", "2"]
    else:
        inputs += ["-f", "lavfi", "-t", f"{seg:.3f}", "-i", "anullsrc=r=48000:cl=stereo"]
        af = ["-map", f"{2 if overlay else 1}:a", "-c:a", "aac"]
    run(["ffmpeg", "-y", "-hide_banner", *inputs, "-filter_complex", vf, "-map", "[v]", *af,
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-t", f"{seg:.3f}", out])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("clips")
    ap.add_argument("--music")
    ap.add_argument("--out")
    a = ap.parse_args()

    scenes, hook = parse_script(a.script)
    clips = [os.path.join(a.clips, f"{i + 1:02d}.mp4") for i in range(len(scenes))]
    missing = [c for c in clips if not os.path.exists(c)]
    if missing:
        sys.exit("missing clips: " + ", ".join(missing))
    out = a.out or os.path.join(a.clips, "final.mp4")
    plans = plan_trims(clips)

    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        for i, p in enumerate(plans):
            ov = os.path.join(a.clips, "overlays", f"{i + 1:02d}.mp4")
            part = os.path.join(tmp, f"p{i:02d}.mp4")
            render_block(p, ov if os.path.exists(ov) else None, part)
            parts.append(part)
        lst = os.path.join(tmp, "list.txt")
        open(lst, "w").write("".join(f"file '{x}'\n" for x in parts))
        joined = os.path.join(tmp, "joined.mp4")
        run(["ffmpeg", "-y", "-hide_banner", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", joined])
        ass = os.path.join(tmp, "subs.ass")
        total = build_ass(plans, scenes, hook, ass)

        cmd = ["ffmpeg", "-y", "-hide_banner", "-i", joined]
        if a.music:
            cmd += ["-stream_loop", "-1", "-i", a.music]
            afc = ("[1:a]volume=0.12,afade=t=out:st=%.2f:d=1.5[m];[0:a][m]amix=inputs=2:duration=first:normalize=0,"
                   "loudnorm=I=-14:TP=-1.5:LRA=11[a]" % max(total - 1.5, 0))
        else:
            afc = "[0:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]"
        fc = f"[0:v]ass={ass}[v];{afc}"
        run(cmd + ["-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium",
                   "-crf", "19", "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                   "-movflags", "+faststart", "-t", f"{total:.3f}", out])
        cover = os.path.splitext(out)[0] + "-cover.jpg"
        run(["ffmpeg", "-y", "-hide_banner", "-ss", "0.8", "-i", out, "-frames:v", "1", "-q:v", "2", cover])

    final = duration(out)
    print(f"done: {out} ({final:.1f} s){'  WARNING: under 60 s' if final < 60 else ''}")
    print(f"cover: {cover}")


if __name__ == "__main__":
    main()
