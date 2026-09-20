#!/usr/bin/env python3
"""Turn five portrait keyframes into the 20-second, five-chapter resume reel.

Requires ffmpeg on PATH. Each chapter is four seconds, with 8-frame transitions
centered on the chapter boundary. Sources are generated with the built-in
imagegen tool; this script only animates and encodes the video.
"""
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
FPS = 24
WIDTH, HEIGHT = 1600, 900
FRAMES = [100, 104, 104, 104, 100]
OUTPUT = ROOT / "img/theme-portrait-reel.mp4"


def run(args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def main():
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg must be installed to render the reel.")
    sources = [ROOT / f"img/theme-face-{i:02d}.png" for i in range(1, 6)]
    missing = [str(path) for path in sources if not path.is_file()]
    if missing:
        raise SystemExit("Missing keyframes: " + ", ".join(missing))

    with tempfile.TemporaryDirectory(prefix="resume-portrait-reel-") as work:
        clips = []
        for i, (source, frames) in enumerate(zip(sources, FRAMES)):
            destination = Path(work) / f"scene-{i + 1}.mp4"
            # A restrained dolly and lateral drift preserve the face and leave
            # the left side clear for live, translated webpage typography.
            progress = f"on/{frames - 1}"
            ease = f"(1-cos(PI*{progress}))/2"
            zoom = f"1.02+0.065*{ease}" if i % 2 == 0 else f"1.085-0.065*{ease}"
            drift = f"{10 if i % 2 == 0 else -10}*sin(PI*{progress})"
            filters = (
                "scale=3200:1800:force_original_aspect_ratio=increase,crop=3200:1800,"
                f"zoompan=z='{zoom}':x='(iw-iw/zoom)*0.73+{drift}':"
                f"y='(ih-ih/zoom)*0.34':d={frames}:s={WIDTH}x{HEIGHT}:fps={FPS},"
                "setsar=1,format=yuv420p"
            )
            run(["-i", str(source), "-vf", filters, "-frames:v", str(frames),
                 "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "17",
                 "-g", "12", "-keyint_min", "12", "-sc_threshold", "0", "-bf", "0",
                 str(destination)])
            clips.append(destination)
            print(f"Rendered scene {i + 1}/5", flush=True)

        inputs = [value for clip in clips for value in ["-i", str(clip)]]
        transitions = []
        previous = "0:v"
        for i in range(1, 5):
            output = f"x{i}"
            transition = "smoothleft" if i % 2 else "smoothright"
            transitions.append(
                f"[{previous}][{i}:v]xfade=transition={transition}:duration={8/FPS:.8f}:"
                f"offset={4*i-4/FPS:.8f}[{output}]"
            )
            previous = output
        transitions.append(f"[{previous}]format=yuv420p[out]")
        run([*inputs, "-filter_complex_threads", "1", "-filter_complex", ";".join(transitions),
             "-map", "[out]", "-frames:v", "480", "-r", str(FPS), "-an",
             "-c:v", "libx264", "-preset", "slow", "-crf", "20",
             "-g", "12", "-keyint_min", "12", "-sc_threshold", "0", "-bf", "0",
             "-movflags", "+faststart", "-metadata", "title=Minwoo Kim — Five Core Themes",
             "-metadata", "comment=AI-created portrait scenes with camera motion; not documentary footage.",
             str(OUTPUT)])
    print(f"Saved {OUTPUT} ({OUTPUT.stat().st_size / 1024 / 1024:.1f} MiB)")


if __name__ == "__main__":
    main()
