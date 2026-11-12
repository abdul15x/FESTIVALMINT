import subprocess
import json
import os
import time

SCENES = [
    {
        "id": "scene1",
        "title": "The Hook",
        "text": "Every great event starts with an idea. But turning that idea into reality takes resources, partnerships, and financial support. For many organizers, finding the right sponsors is one of the biggest challenges."
    },
    {
        "id": "scene2",
        "title": "The Problem",
        "text": "Organizers often spend countless hours researching companies, preparing sponsorship proposals, and sending outreach messages without knowing whether those sponsors are actually relevant to their events. Meanwhile, businesses struggle to discover events that genuinely match their audience and objectives. What if sponsorship discovery could be smarter?"
    },
    {
        "id": "scene3",
        "title": "Introduce FESTIVALMINT",
        "text": "Introducing FESTIVALMINT, an AI-powered sponsorship marketplace that brings event organizers and potential sponsors together in one connected experience."
    },
    {
        "id": "scene4",
        "title": "Organizer Experience & Packages",
        "text": "With FESTIVALMINT, organizers can manage their events and create sponsorship opportunities that fit their goals. Our Gemini-powered AI helps generate sponsorship package suggestions, including potential benefits, requirements, and pricing guidance. Organizers remain in control, choosing what to offer and what each sponsorship opportunity is worth."
    },
    {
        "id": "scene5",
        "title": "AI Matching & Outreach",
        "text": "FESTIVALMINT uses Google Gemini to help connect organizers and sponsors through intelligent matching. Organizers can discover potential sponsors, while businesses can explore events that align with their interests and objectives. It also helps prepare personalized sponsorship outreach, making the partnership process more efficient."
    },
    {
        "id": "scene6",
        "title": "Proposals & PayPal Checkout",
        "text": "Once a sponsor finds the right opportunity, they can review its benefits, submit a proposal, and proceed through our integrated PayPal checkout. PayPal Sandbox allows us to demonstrate the sponsorship payment journey securely without processing real money."
    },
    {
        "id": "scene7",
        "title": "Deliverables & Fulfillment",
        "text": "And the journey doesn't end at payment. FESTIVALMINT helps organize sponsorship commitments, track deliverables, and manage partnership progress in one place."
    },
    {
        "id": "scene8",
        "title": "Technology & Closing",
        "text": "Powered by Google Gemini, integrated with the PayPal Developer Platform, and built with modern web technologies, FESTIVALMINT brings intelligent sponsorship discovery and digital payments together. Because great events deserve more than just an idea. They deserve the right partners."
    }
]

output_dir = r"f:\paypal hackathon\video-production\audio"
os.makedirs(output_dir, exist_ok=True)

durations = {}

VOICES = ["en-US-BrianNeural", "en-US-ChristopherNeural", "en-US-GuyNeural", "en-US-AndrewNeural"]

for s in SCENES:
    mp3_path = os.path.join(output_dir, f"{s['id']}.mp3")
    vtt_path = os.path.join(output_dir, f"{s['id']}.vtt")
    
    success = False
    for voice in VOICES:
        for attempt in range(3):
            try:
                print(f"Generating voice for {s['id']} using {voice} (attempt {attempt+1})...")
                cmd = [
                    "uvx", "edge-tts",
                    "--voice", voice,
                    "--text", s["text"],
                    "--write-media", mp3_path,
                    "--write-subtitles", vtt_path
                ]
                res = subprocess.run(cmd, capture_output=True, text=True)
                if res.returncode == 0 and os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 1000:
                    success = True
                    break
                print(f"  Attempt failed: {res.stderr.strip()[:100]}")
                time.sleep(1.5)
            except Exception as e:
                print(f"  Error: {e}")
                time.sleep(1.5)
        if success:
            break
            
    if not success:
        raise RuntimeError(f"Failed to generate audio for {s['id']}")
        
    probe = subprocess.run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", mp3_path
    ], capture_output=True, text=True, check=True)
    dur = float(probe.stdout.strip())
    durations[s["id"]] = dur
    print(f"  --> {s['id']} OK ({dur:.2f}s)")
    time.sleep(0.5)

with open(os.path.join(output_dir, "durations.json"), "w") as f:
    json.dump(durations, f, indent=2)

print("\nAll audio generated successfully!")
total = sum(durations.values())
print(f"Total voiceover duration: {total:.2f}s ({int(total//60)}m {int(total%60)}s)")
