import math
import struct
import wave
import os

SAMPLE_RATE = 44100
DURATION_SEC = 160  # ~2m 40s

# Chord progression: Am -> F -> C -> G (frequencies in Hz)
CHORDS = [
    [220.0, 261.63, 329.63, 440.0],  # A minor (A3, C4, E4, A4)
    [174.61, 220.0, 261.63, 349.23],  # F major (F3, A3, C4, F4)
    [261.63, 329.63, 392.0, 523.25],  # C major (C4, E4, G4, C5)
    [196.0, 246.94, 293.66, 392.0],  # G major (G3, B3, D4, G4)
]
CHORD_DURATION = 6.0  # seconds per chord

output_path = r"f:\paypal hackathon\video-production\assets\ambient_bed.wav"
os.makedirs(os.path.dirname(output_path), exist_ok=True)

total_samples = int(SAMPLE_RATE * DURATION_SEC)
audio_data = bytearray()

print("Synthesizing ambient tech startup soundtrack...")

for i in range(total_samples):
    t = i / SAMPLE_RATE
    
    # Global fade in (first 3s) and fade out (last 5s)
    env = 1.0
    if t < 3.0:
        env = t / 3.0
    elif t > (DURATION_SEC - 5.0):
        env = (DURATION_SEC - t) / 5.0
        
    chord_idx = int((t / CHORD_DURATION) % len(CHORDS))
    current_chord = CHORDS[chord_idx]
    
    # Next chord for smooth crossfade between chords
    chord_progress = (t % CHORD_DURATION) / CHORD_DURATION
    fade_window = 0.8
    crossfade = 0.0
    if chord_progress > (1.0 - fade_window):
        crossfade = (chord_progress - (1.0 - fade_window)) / fade_window
    next_chord = CHORDS[(chord_idx + 1) % len(CHORDS)]
    
    # Generate pad sound (warm filtered saw/sine harmonics)
    val_l = 0.0
    val_r = 0.0
    
    # Sub-bass pulse (soft warm sine at 55Hz or 65Hz)
    bass_freq = current_chord[0] / 2.0
    bass = math.sin(2.0 * math.pi * bass_freq * t) * 0.28
    
    # Pad voices with subtle detuning and stereo panning
    for idx, freq in enumerate(current_chord):
        # primary sine + gentle harmonic
        phase_l = 2.0 * math.pi * freq * (1.0 + 0.0015 * math.sin(t * 0.5 + idx)) * t
        phase_r = 2.0 * math.pi * freq * (1.0 - 0.0015 * math.cos(t * 0.5 + idx)) * t
        
        sig_l = math.sin(phase_l) * 0.12 + math.sin(phase_l * 2) * 0.03
        sig_r = math.sin(phase_r) * 0.12 + math.sin(phase_r * 2) * 0.03
        
        val_l += sig_l * (1.0 - crossfade)
        val_r += sig_r * (1.0 - crossfade)
        
    # Crossfade into next chord
    if crossfade > 0:
        for idx, freq in enumerate(next_chord):
            phase_l = 2.0 * math.pi * freq * (1.0 + 0.0015 * math.sin(t * 0.5 + idx)) * t
            phase_r = 2.0 * math.pi * freq * (1.0 - 0.0015 * math.cos(t * 0.5 + idx)) * t
            
            sig_l = math.sin(phase_l) * 0.12 + math.sin(phase_l * 2) * 0.03
            sig_r = math.sin(phase_r) * 0.12 + math.sin(phase_r * 2) * 0.03
            
            val_l += sig_l * crossfade
            val_r += sig_r * crossfade

    # Subtle rhythmic tech pulse (gentle pluck high frequency)
    pulse_t = t * 2.0  # 120 bpm eighth notes
    pulse_idx = int(pulse_t) % 4
    pulse_env = math.exp(-6.0 * (pulse_t % 1.0))
    pulse_note = current_chord[pulse_idx % len(current_chord)] * 2.0
    pulse_sig = math.sin(2.0 * math.pi * pulse_note * t) * 0.04 * pulse_env
    
    total_l = (val_l + bass + pulse_sig * 0.8) * env * 0.65
    total_r = (val_r + bass + pulse_sig * 1.2) * env * 0.65
    
    # Clamp
    total_l = max(-0.95, min(0.95, total_l))
    total_r = max(-0.95, min(0.95, total_r))
    
    sample_l = int(total_l * 32767.0)
    sample_r = int(total_r * 32767.0)
    
    audio_data.extend(struct.pack('<hh', sample_l, sample_r))

with wave.open(output_path, 'wb') as wav_file:
    wav_file.setnchannels(2)
    wav_file.setsampwidth(2)
    wav_file.setframerate(SAMPLE_RATE)
    wav_file.writeframes(audio_data)

print(f"Generated soundtrack: {output_path} ({DURATION_SEC}s)")

