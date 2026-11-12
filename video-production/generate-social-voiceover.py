import subprocess
import json
import os
import time

SOCIAL_CLIPS = [
    {
        "id": "social_part1_hook",
        "text": "Finding sponsorship shouldn't be the hardest part of organizing an event. Organizers spend weeks sending cold emails, while brands struggle to find relevant campus partnerships. What if sponsorship discovery was powered by AI?"
    },
    {
        "id": "social_part2_product",
        "text": "Meet FESTIVALMINT. An intelligent sponsorship marketplace connecting event organizers with brand partners. With Google Gemini, organizers create structured sponsorship tiers, while brands discover high-fit university events with transparent compatibility scores."
    },
    {
        "id": "social_part3_paypal",
        "text": "Once a sponsor chooses a package, they lock their commitment and complete checkout instantly through our integrated PayPal Sandbox flow. After the event, every deliverable is verified with an audit-ready proof ledger."
    },
    {
        "id": "social_part4_closing",
        "text": "FESTIVALMINT. Great events deserve the right sponsors. Built for the PayPal AI Hackathon."
    }
]

output_dir = r"f:\paypal hackathon\video-production\audio\social"
os.makedirs(output_dir, exist_ok=True)

durations = {}

for s in SOCIAL_CLIPS:
    mp3_path = os.path.join(output_dir, f"{s['id']}.mp3")
    vtt_path = os.path.join(output_dir, f"{s['id']}.vtt")
    
    cmd = [
        "uvx", "edge-tts",
        "--voice", "en-US-BrianNeural",
        "--text", s["text"],
        "--write-media", mp3_path,
        "--write-subtitles", vtt_path
    ]
    subprocess.run(cmd, check=True)
    
    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", mp3_path
    ], capture_output=True, text=True, check=True)
    dur = float(probe.stdout.strip())
    durations[s["id"]] = dur
    print(f"  {s['id']} OK: {dur:.2f}s")
    time.sleep(0.5)

with open(os.path.join(output_dir, "durations.json"), "w") as f:
    json.dump(durations, f, indent=2)

total = sum(durations.values())
print(f"\nSocial audio total: {total:.2f}s")

