#!/usr/bin/env python3
"""Cut the Gallery page's full-screen background montage (vehicles, manufacturing, testing, team) from the
team's own footage + a few photos (slow push-in). Output: public/media/gallery-reel-{1080,720}.mp4 + poster.

Needs an ffmpeg binary: pass its path as argv[1] (e.g. node_modules/ffmpeg-static/ffmpeg.exe) or have ffmpeg on PATH.
Usage: python scripts/build_montage.py [path/to/ffmpeg]
"""
import os, shutil, subprocess, sys, tempfile

APP = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GAL = os.path.join(APP, "..", "Meckartans_Gallery")
OUT = os.path.join(APP, "public", "media")
FF = sys.argv[1] if len(sys.argv) > 1 else (shutil.which("ffmpeg") or "ffmpeg")
W, H, FPS, XF = 1920, 1080, 30, 0.5  # output size, frame rate, crossfade seconds

# (kind, source, start, duration)  -- video segments play at real speed; photos get a slow push-in.
SEGMENTS = [
    ("video", "MK12B/video/VID_20221201_180508.mp4", 0.6, 2.4),          # driver close-up, 4K
    ("photo", "FMAEBuggyINTERNSHIP2019/IMG-20190719-WA0011.jpg", 0, 2.6),  # placeholder, replaced below by id lookup
    ("video", "MK12B/video/VID_20221201_175536.mp4", 2.4, 2.6),          # close drift, 4K
    ("photo", "FMAEBuggyINTERNSHIP2019/IMG-20190715-WA0004.jpg", 0, 2.6),
    ("video", "Videos/GO KART/VID_20190816_160529.mp4", 36.0, 4.0),      # demo run in front of the crowd
    ("video", "Videos/GO KART/VID_20231015_154826.mp4", 0.0, 2.6),       # road test, 4K
    ("photo", "Buggy/MKX01/IMG_20220514_183841.jpg", 0, 2.6),            # team group with MKX01
    ("video", "MK12B/Testing video/Autocross/VID_20230107_190612.mp4", 25.0, 4.0),  # night testing
]


def run(args):
    r = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", *args], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr)


def main():
    # Resolve the two fabrication photos by the inventory (grinding sparks, welding glare).
    import json
    inv = {i["id"]: i["src"] for i in json.load(open(os.path.join(APP, "scripts", "inventory.json")))}
    SEGMENTS[1] = ("photo", inv[21], 0, 2.6)
    SEGMENTS[3] = ("photo", inv[18], 0, 2.6)

    norm = f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,fps={FPS},format=yuv420p"
    grade = "eq=contrast=1.08:saturation=0.82:brightness=-0.02"
    tmp = tempfile.mkdtemp()
    parts = []
    for i, (kind, src, start, dur) in enumerate(SEGMENTS):
        out = os.path.join(tmp, f"p{i}.mp4")
        path = os.path.join(GAL, src)
        if kind == "video":
            run(["-ss", str(start), "-t", str(dur), "-i", path, "-an", "-vf", f"{norm},{grade}",
                 "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", out])
        else:
            frames = int(dur * FPS)
            # upscale first so zoompan's integer pixel steps stay smooth, then push in 8%
            zp = (f"scale={W*2}:{H*2}:force_original_aspect_ratio=increase,crop={W*2}:{H*2},"
                  f"zoompan=z='1+0.08*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS},"
                  f"setsar=1,format=yuv420p,{grade}")
            run(["-loop", "1", "-t", str(dur), "-i", path, "-vf", zp, "-frames:v", str(frames),
                 "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", out])
        parts.append((out, dur))
        print("segment", i, kind, src.split("/")[-1][:40])

    # Chain crossfades
    inputs, chain, last, t = [], [], "0:v", 0.0
    for i, (p, _) in enumerate(parts):
        inputs += ["-i", p]
    for i in range(1, len(parts)):
        t += parts[i - 1][1] - XF
        lbl = f"x{i}"
        chain.append(f"[{last}][{i}:v]xfade=transition=fade:duration={XF}:offset={t:.3f}[{lbl}]")
        last = lbl
    total = sum(d for _, d in parts) - XF * (len(parts) - 1)
    chain.append(f"[{last}]fade=t=in:st=0:d=0.6,fade=t=out:st={total - 0.6:.3f}:d=0.6[v]")
    master = os.path.join(tmp, "master.mp4")
    run([*inputs, "-filter_complex", ";".join(chain), "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "slow",
         "-crf", "14", master])

    os.makedirs(OUT, exist_ok=True)
    common = ["-an", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart"]
    run(["-i", master, "-vf", "scale=1920:1080", "-crf", "30", "-maxrate", "2300k", "-bufsize", "4600k", *common,
         os.path.join(OUT, "gallery-reel-1080.mp4")])
    run(["-i", master, "-vf", "scale=1280:720", "-crf", "31", "-maxrate", "1000k", "-bufsize", "2000k", *common,
         os.path.join(OUT, "gallery-reel-720.mp4")])
    run(["-ss", "6", "-i", master, "-frames:v", "1", "-q:v", "5", os.path.join(OUT, "gallery-reel-poster.jpg")])
    shutil.rmtree(tmp, ignore_errors=True)
    for f in ("gallery-reel-1080.mp4", "gallery-reel-720.mp4", "gallery-reel-poster.jpg"):
        print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB")
    print(f"duration {total:.1f}s")


if __name__ == "__main__":
    main()
