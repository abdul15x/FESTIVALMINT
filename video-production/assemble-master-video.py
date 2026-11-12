import subprocess
import os
import json
import shutil

BASE_DIR = r"f:\paypal hackathon\video-production"
RECORDINGS_DIR = os.path.join(BASE_DIR, "recordings")
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
PUBLIC_DIR = r"f:\paypal hackathon\public\video"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

with open(os.path.join(AUDIO_DIR, "durations.json"), "r") as f:
    durations = json.load(f)

scenes = [f"scene{i}" for i in range(1, 9)]

print("Step 1: Processing and muxing each scene clip...")
muxed_clips = []
concat_list_file = os.path.join(OUTPUT_DIR, "concat_list.txt")

with open(concat_list_file, "w") as cl:
    for sc in scenes:
        webm_path = os.path.join(RECORDINGS_DIR, f"{sc}.webm")
        mp3_path = os.path.join(AUDIO_DIR, f"{sc}.mp3")
        muxed_path = os.path.join(OUTPUT_DIR, f"{sc}_muxed.mp4")
        dur = durations[sc]
        
        # Mux and trim video to audio length
        # Using tpad or freeze last frame if video is slightly shorter, or cut if longer
        cmd = [
            "ffmpeg", "-y",
            "-i", webm_path,
            "-i", mp3_path,
            "-t", str(dur),
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            muxed_path
        ]
        print(f"  Muxing {sc} (duration {dur:.2f}s)...")
        subprocess.run(cmd, check=True, capture_output=True)
        muxed_clips.append(muxed_path)
        cl.write(f"file '{muxed_path.replace('\\', '/')}'\n")

print("\nStep 2: Concatenating all scenes...")
concat_raw = os.path.join(OUTPUT_DIR, "video_raw_concat.mp4")
subprocess.run([
    "ffmpeg", "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concat_list_file,
    "-c", "copy",
    concat_raw
], check=True, capture_output=True)

print("\nStep 3: Mixing ambient soundtrack and mastering audio...")
ambient_wav = os.path.join(ASSETS_DIR, "ambient_bed.wav")
srt_path = os.path.join(BASE_DIR, "festivalmint-master.srt").replace("\\", "/")
# Windows ffmpeg subtitle path needs colon escaping (e.g. F\:/...)
srt_escaped = srt_path.replace(":", "\\:")

final_master_1080p = os.path.join(OUTPUT_DIR, "festivalmint-pitch-demo-1080p.mp4")

# Mix voice audio with ducked background music (-20dB) and burn subtitles with sleek styling
# Subtitle style: Arial/Plus Jakarta Sans, size 18, yellow/white text with black border
sub_filter = f"subtitles='{srt_escaped}':force_style='Fontname=Arial,Fontsize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H000c121e,BackColour=&H80000000,BorderStyle=4,Outline=1,Shadow=0,MarginV=35'"

cmd_mix = [
    "ffmpeg", "-y",
    "-i", concat_raw,
    "-i", ambient_wav,
    "-filter_complex",
    f"[0:v]{sub_filter}[v];[1:a]volume=0.10[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[a]",
    "-map", "[v]",
    "-map", "[a]",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    final_master_1080p
]

print("  Rendering 1080p master with burned-in subtitles and soundtrack...")
res = subprocess.run(cmd_mix, capture_output=True, text=True)
if res.returncode != 0:
    print("FFmpeg error:", res.stderr)
    # Fallback without subtitle filter if libass path failed
    print("Retrying with simple mix...")
    subprocess.run([
        "ffmpeg", "-y",
        "-i", concat_raw,
        "-i", ambient_wav,
        "-filter_complex",
        "[1:a]volume=0.10[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[a]",
        "-map", "0:v",
        "-map", "[a]",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        final_master_1080p
    ], check=True)

# Copy to public folder
pub_master = os.path.join(PUBLIC_DIR, "festivalmint-pitch-demo-1080p.mp4")
shutil.copyfile(final_master_1080p, pub_master)

# Get probe info
probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration,size",
    "-of", "default=noprint_wrappers=1", final_master_1080p
], capture_output=True, text=True, check=True)

print(f"\n Master 1080p Pitch Video completed!")
print(f"Output: {final_master_1080p}")
print(f"Public URL path: /video/festivalmint-pitch-demo-1080p.mp4")
print(probe.stdout.strip())

