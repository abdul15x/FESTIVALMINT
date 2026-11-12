import os
import re
import json

AUDIO_DIR = r"f:\paypal hackathon\video-production\audio"
with open(os.path.join(AUDIO_DIR, "durations.json"), "r") as f:
    durations = json.load(f)

scenes = [f"scene{i}" for i in range(1, 9)]

def parse_time(ts_str):
    # Format: HH:MM:SS,mmm or HH:MM:SS.mmm
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
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def format_time_vtt(seconds):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"

current_offset = 0.0
srt_entries = []
vtt_entries = []
counter = 1

for sc in scenes:
    vtt_path = os.path.join(AUDIO_DIR, f"{sc}.vtt")
    dur = durations[sc]
    if os.path.exists(vtt_path):
        with open(vtt_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            # Look for timestamp line
            m = re.match(r"(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})", line)
            if m:
                start_sec = parse_time(m.group(1)) + current_offset
                end_sec = parse_time(m.group(2)) + current_offset
                
                # Next lines are subtitle text
                text_lines = []
                i += 1
                while i < len(lines) and lines[i].strip() and not re.match(r"^\d+$", lines[i].strip()):
                    text_lines.append(lines[i].strip())
                    i += 1
                
                sub_text = " ".join(text_lines)
                if sub_text:
                    srt_entries.append(f"{counter}\n{format_time_srt(start_sec)} --> {format_time_srt(end_sec)}\n{sub_text}\n")
                    vtt_entries.append(f"{counter}\n{format_time_vtt(start_sec)} --> {format_time_vtt(end_sec)}\n{sub_text}\n")
                    counter += 1
            else:
                i += 1
    current_offset += dur

master_srt_path = r"f:\paypal hackathon\video-production\festivalmint-master.srt"
master_vtt_path = r"f:\paypal hackathon\video-production\festivalmint-master.vtt"

with open(master_srt_path, "w", encoding="utf-8") as f:
    f.write("\n".join(srt_entries))

with open(master_vtt_path, "w", encoding="utf-8") as f:
    f.write("WEBVTT\n\n" + "\n".join(vtt_entries))

print(f"Generated master subtitles with {counter-1} entries.")
print(f"Total duration: {current_offset:.2f}s")

