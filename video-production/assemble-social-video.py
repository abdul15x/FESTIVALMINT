import subprocess
import os
import re
import json
import shutil

BASE_DIR = r"f:\paypal hackathon\video-production"
RECORDINGS_DIR = os.path.join(BASE_DIR, "recordings")
SOCIAL_AUDIO_DIR = os.path.join(BASE_DIR, "audio", "social")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
PUBLIC_DIR = r"f:\paypal hackathon\public\video"

with open(os.path.join(SOCIAL_AUDIO_DIR, "durations.json"), "r") as f:
    social_durations = json.load(f)

# Step 1: Build combined social subtitles
parts = ["social_part1_hook", "social_part2_product", "social_part3_paypal", "social_part4_closing"]

def parse_time(ts_str):
    ts_str = ts_str.replace(".", ",")
    parts = ts_str.split(":")
    h = int(parts[0])
    m = int(parts[1])
    s, ms = parts[2].split(",")
    return h * 3600 + m * 60 + int(s) + int(ms) / 1000.0

def format_time_srt(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    if ms >= 1000: ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

offset = 0.0
srt_lines = []
counter = 1

for p in parts:
    vtt_file = os.path.join(SOCIAL_AUDIO_DIR, f"{p}.vtt")
    dur = social_durations[p]
    if os.path.exists(vtt_file):
        with open(vtt_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            m = re.match(r"(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})", line)
            if m:
                s_sec = parse_time(m.group(1)) + offset
                e_sec = parse_time(m.group(2)) + offset
                i += 1
                txt = []
                while i < len(lines) and lines[i].strip() and not re.match(r"^\d+$", lines[i].strip()):
                    txt.append(lines[i].strip())
                    i += 1
                body = " ".join(txt)
                if body:
                    srt_lines.append(f"{counter}\n{format_time_srt(s_sec)} --> {format_time_srt(e_sec)}\n{body}\n")
                    counter += 1
            else:
                i += 1
    offset += dur

social_srt_path = os.path.join(OUTPUT_DIR, "social_master.srt")
with open(social_srt_path, "w", encoding="utf-8") as f:
    f.write("\n".join(srt_lines))

print(f"Generated social subtitles with {counter-1} entries (duration: {offset:.2f}s).")

# Step 2: Mux 4 visual clips reframed to 1080x1920
# Reframe filter:
# [0:v] split [bg][fg];
# [bg] scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=25:5 [blurred];
# [fg] scale=1040:-1,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black@0 [sharp];
# [blurred][sharp] overlay [v]

reframe_filter = (
    "split[bg][fg];"
    "[bg]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:5,eq=brightness=-0.15[blurred];"
    "[fg]scale=1040:585[sharp];"
    "[blurred][sharp]overlay=(W-w)/2:(H-h)/2[v]"
)

social_clips_map = [
    ("social_part1_hook", "scene2.webm"),
    ("social_part2_product", "scene5.webm"),
    ("social_part3_paypal", "scene6.webm"),
    ("social_part4_closing", "scene8.webm"),
]

concat_social_list = os.path.join(OUTPUT_DIR, "concat_social.txt")
with open(concat_social_list, "w") as cl:
    for audio_id, video_file in social_clips_map:
        vid_in = os.path.join(RECORDINGS_DIR, video_file)
        aud_in = os.path.join(SOCIAL_AUDIO_DIR, f"{audio_id}.mp3")
        seg_out = os.path.join(OUTPUT_DIR, f"{audio_id}_vertical.mp4")
        dur = social_durations[audio_id]
        
        print(f"  Rendering vertical segment for {audio_id} ({dur:.2f}s)...")
        cmd = [
            "ffmpeg", "-y",
            "-i", vid_in,
            "-i", aud_in,
            "-t", str(dur),
            "-filter_complex", reframe_filter,
            "-map", "[v]",
            "-map", "1:a",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            seg_out
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        cl.write(f"file '{seg_out.replace('\\', '/')}'\n")

print("\nStep 3: Concatenating vertical clips...")
social_raw_concat = os.path.join(OUTPUT_DIR, "social_raw_concat.mp4")
subprocess.run([
    "ffmpeg", "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concat_social_list,
    "-c", "copy",
    social_raw_concat
], check=True, capture_output=True)

print("\nStep 4: Mixing background track and burning vertical mobile subtitles...")
ambient_wav = os.path.join(ASSETS_DIR, "ambient_bed.wav")
srt_escaped = social_srt_path.replace("\\", "/").replace(":", "\\:")
final_social_9x16 = os.path.join(OUTPUT_DIR, "festivalmint-pitch-social-9x16.mp4")

# Mobile subtitle style: Larger font, centered at bottom of 1080x1920 (MarginV=180)
sub_filter_vertical = f"subtitles='{srt_escaped}':force_style='Fontname=Arial,Fontsize=26,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H000c121e,BackColour=&H99000000,BorderStyle=4,Outline=2,Shadow=0,MarginV=200'"

cmd_social_mix = [
    "ffmpeg", "-y",
    "-i", social_raw_concat,
    "-i", ambient_wav,
    "-filter_complex",
    f"[0:v]{sub_filter_vertical}[v];[1:a]volume=0.10[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=2[a]",
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
    final_social_9x16
]

subprocess.run(cmd_social_mix, check=True, capture_output=True)

# Copy to public folder
pub_social = os.path.join(PUBLIC_DIR, "festivalmint-pitch-social-9x16.mp4")
shutil.copyfile(final_social_9x16, pub_social)

probe = subprocess.run([
    "ffprobe", "-v", "error", "-show_entries", "format=duration,size",
    "-of", "default=noprint_wrappers=1", final_social_9x16
], capture_output=True, text=True, check=True)

print(f"\n Master 9:16 Social Cut completed!")
print(f"Output: {final_social_9x16}")
print(f"Public URL path: /video/festivalmint-pitch-social-9x16.mp4")
print(probe.stdout.strip())

