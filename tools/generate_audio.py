/t#!/usr/bin/env python3
"""generate_audio.py — the 8bit Sleep deterministic chiptune audio pipeline.

Every music loop and SFX is synthesized procedurally in pure stdlib Python:
square/triangle oscillators, NES-style 15-bit LFSR noise, linear ADSR-ish
envelopes. Output is 22050 Hz mono unsigned 8-bit PCM WAV (~22 KB/s, well
under the 500 KB budget) written to assets/audio/<name>.wav.

Fixed LFSR seeds make every run byte-identical. Loops are seamless by
construction: all event times snap to an integer samples-per-beat grid and
every envelope releases to zero before the final sample.

Metadata goes to assets/_src/build_audio.json; the orchestrator registers it
in the manifest afterwards (this script never touches the manifest files).

Usage: python3 tools/generate_audio.py
"""

import json
import math
import os
import wave

SAMPLE_RATE = 22050
SEED = 0x8B17
CENTER = 128          # u8 PCM silence
PEAK_TARGET = 0.76    # normalize to 76% of full scale (~byte 224, no clipping)
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(REPO_ROOT, 'assets', 'audio')
BUILD_JSON_PATH = os.path.join(REPO_ROOT, 'assets', '_src', 'build_audio.json')


def midi_to_hz(midi):
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def osc_square(phase, duty=0.5):
    return 1.0 if phase % 1.0 < duty else -1.0


def osc_triangle(phase, _duty=0.5):
    p = phase % 1.0
    return 4.0 * p - 1.0 if p < 0.5 else 3.0 - 4.0 * p


OSCILLATORS = {'square': osc_square, 'triangle': osc_triangle}


class Lfsr:
    """15-bit NES-style linear feedback shift register for noise voices."""

    def __init__(self, seed=SEED):
        self.reg = (seed & 0x7FFF) or 1

    def clock(self):
        fb = (self.reg ^ (self.reg >> 1)) & 1
        self.reg = (self.reg >> 1) | (fb << 14)

    def value(self, hold):
        """Sample-and-hold output in [-1, 1]; clocks `hold` times per sample."""
        out = 1.0 if self.reg & 1 else -1.0
        for _ in range(hold):
            self.clock()
        return out


def adsr(t, dur, attack, decay, sustain, release):
    """Linear ADSR-ish envelope (seconds); hits exactly 0 at t == dur.

    Callers must keep attack + decay + release <= dur so stages never overlap.
    """
    if t < 0.0 or t >= dur:
        return 0.0
    if t < attack:
        return t / attack if attack > 0 else 1.0
    if t < attack + decay:
        frac = (t - attack) / decay if decay > 0 else 1.0
        return 1.0 - (1.0 - sustain) * frac
    rel_start = dur - release
    if t < rel_start:
        return sustain
    if release <= 0:
        return 0.0
    return sustain * (1.0 - (t - rel_start) / release)


def render_note(buf, start_s, dur_s, midi, vol, wave='square', duty=0.5,
                env=(0.005, 0.05, 0.7, 0.08), midi_end=None, detune=0.0):
    """Mix one pitched note into float buffer `buf` (times in seconds).

    `midi_end` glides the pitch (linear in Hz), `detune` scales the frequency
    (stack two detuned calls for a thicker chorus voice).
    """
    osc = OSCILLATORS[wave]
    f0 = midi_to_hz(midi) * (1.0 + detune)
    f1 = midi_to_hz(midi_end if midi_end is not None else midi) * (1.0 + detune)
    start = int(round(start_s * SAMPLE_RATE))
    count = int(round(dur_s * SAMPLE_RATE))
    phase = 0.0
    for i in range(count):
        freq = f0 + (f1 - f0) * (i / count)
        phase += freq / SAMPLE_RATE
        buf[start + i] += osc(phase, duty) * vol * adsr(i / SAMPLE_RATE, dur_s, *env)


def render_noise(buf, start_s, dur_s, vol, hold=3, decay_pow=1.0, lfsr=None):
    """Mix an LFSR noise burst with a power-decay envelope into `buf`."""
    lfsr = lfsr or Lfsr()
    start = int(round(start_s * SAMPLE_RATE))
    count = int(round(dur_s * SAMPLE_RATE))
    for i in range(count):
        env = (1.0 - i / count) ** decay_pow
        buf[start + i] += lfsr.value(hold) * vol * env


class Sequencer:
    """Beat-grid scheduler: every event snaps to integer sample positions."""

    def __init__(self, bpm, total_beats):
        self.spb = int(round(SAMPLE_RATE * 60.0 / bpm))
        self.buf = [0.0] * (self.spb * total_beats)
        self.lfsr = Lfsr(SEED)

    def seconds(self, beats):
        return beats * self.spb / SAMPLE_RATE

    def note(self, beat, dur_beats, midi, vol, **kw):
        render_note(self.buf, self.seconds(beat), self.seconds(dur_beats),
                    midi, vol, **kw)

    def hat(self, beat, vol=0.09, dur_s=0.035, hold=2):
        render_noise(self.buf, self.seconds(beat), dur_s, vol, hold=hold,
                     lfsr=self.lfsr)


def to_u8(buf, peak_target=PEAK_TARGET):
    """Normalize the mix to `peak_target` of full scale, return u8 PCM bytes."""
    peak = max((abs(v) for v in buf), default=0.0) or 1.0
    scale = (127.0 * peak_target) / peak
    return bytes(max(0, min(255, int(round(CENTER + v * scale)))) for v in buf)


def write_wav(path, buf):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(1)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(to_u8(buf))


# --- music_day: "day calm" — 8 bars of 3/4 in C major, 106 BPM, 13.58 s ----
DAY_BPM = 106
DAY_BEATS = 24
DAY_LEAD = [  # triangle melody — (beat, dur_beats, midi)
    (0, 1, 72), (1, 0.5, 71), (1.5, 0.5, 72), (2, 1, 76),
    (3, 1.5, 74), (4.5, 0.5, 72), (5, 1, 69),
    (6, 1, 67), (7, 0.5, 69), (7.5, 0.5, 67), (8, 1, 64),
    (9, 1, 65), (10, 1, 64), (11, 1, 62),
    (12, 1, 64), (13, 1, 67), (14, 1, 72),
    (15, 1.5, 69), (16.5, 0.5, 67), (17, 1, 64),
    (18, 1, 65), (19, 1, 64), (20, 1, 62),
    (21, 3, 60),
]
DAY_BASS = [  # square bass, chord roots: C G Am G | C Am G C
    (0, 1, 48), (1, 1, 43), (2, 1, 48),
    (3, 1, 43), (4, 1, 50), (5, 1, 43),
    (6, 1, 45), (7, 1, 52), (8, 1, 45),
    (9, 1, 43), (10, 1, 50), (11, 1, 43),
    (12, 1, 48), (13, 1, 43), (14, 1, 48),
    (15, 1, 45), (16, 1, 52), (17, 1, 45),
    (18, 1, 43), (19, 1, 50), (20, 1, 47),
    (21, 3, 48),
]


def build_day():
    seq = Sequencer(DAY_BPM, DAY_BEATS)
    for beat, dur, midi in DAY_LEAD:
        seq.note(beat, dur, midi, 0.50, wave='triangle',
                 env=(0.008, 0.06, 0.72, min(0.12, seq.seconds(dur) * 0.35)))
    for beat, dur, midi in DAY_BASS:
        seq.note(beat, dur, midi, 0.34, wave='square', duty=0.5,
                 env=(0.006, 0.05, 0.66, min(0.09, seq.seconds(dur) * 0.3)))
    for beat in range(DAY_BEATS):
        seq.hat(beat, vol=0.09 if beat % 3 == 0 else 0.055)
    return seq.buf


# --- music_night: "night lullaby" — 4 bars of 4/4, 70 BPM, 13.71 s ---------
NIGHT_BPM = 70
NIGHT_BEATS = 16
NIGHT_BARS = [(0, 48, False), (4, 45, True), (8, 41, False), (12, 43, False)]  # C Am F G
NIGHT_ARP = [12, 16, 19, 24, 19, 16, 12, 16]  # 8th-note chord tones above root
NIGHT_MELODY = [  # soft 25% square, sparse music-box line
    (0, 2, 76), (2, 2, 74), (4, 4, 72),
    (8, 2, 69), (10, 2, 72), (12, 2, 71), (14, 1, 74),
]


def build_night():
    seq = Sequencer(NIGHT_BPM, NIGHT_BEATS)
    for bar_start, root, minor in NIGHT_BARS:
        offsets = [(15 if minor and o == 16 else o) for o in NIGHT_ARP]
        for i, off in enumerate(offsets):
            seq.note(bar_start + i * 0.5, 0.5, root + off, 0.30,
                     wave='triangle', env=(0.004, 0.22, 0.30, 0.10))
        seq.note(bar_start, 4, root, 0.20, wave='triangle',
                 env=(0.03, 0.3, 0.5, 0.5))
    for beat, dur, midi in NIGHT_MELODY:
        seq.note(beat, dur, midi, 0.20, wave='square', duty=0.25,
                 env=(0.02, 0.15, 0.6, min(0.3, seq.seconds(dur) * 0.35)))
    return seq.buf


# --- sfx: one-shots ---------------------------------------------------------
DEATH_PHRASE = [  # D-minor descent, last note sags and lingers
    (0.00, 0.30, 60, None), (0.28, 0.30, 57, None),
    (0.56, 0.30, 53, None), (0.84, 0.66, 50, 49.6),
]
VICTORY_RUN = [72, 76, 79, 84, 88, 91, 96]  # C-major arpeggio run up to C7
VICTORY_CHORD = [(72, 0.5, 0.24), (76, 0.25, 0.19), (79, 0.25, 0.19)]
CHEST_ARP = [72, 76, 79, 84]
CHEST_SPARKLE = [(0.32, 0.18, 100), (0.46, 0.30, 103)]  # E7, G7 triangle


def build_damage():
    """~0.25 s hit: noise burst + square blip falling 220 Hz -> ~80 Hz."""
    buf = [0.0] * int(round(0.25 * SAMPLE_RATE))
    render_noise(buf, 0.0, 0.12, 0.85, hold=2, decay_pow=2.0)
    render_note(buf, 0.0, 0.25, 57.0, 0.65, wave='square', duty=0.5,
                env=(0.002, 0.09, 0.20, 0.05), midi_end=39.5)
    return buf


def build_death():
    """~1.5 s sting: detuned square pair descending in D minor, ends low."""
    buf = [0.0] * int(round(1.5 * SAMPLE_RATE))
    for start, dur, midi, midi_end in DEATH_PHRASE:
        for det in (-0.006, 0.006):
            render_note(buf, start, dur, midi, 0.30, wave='square', duty=0.5,
                        env=(0.004, 0.06, 0.72, min(0.22, dur * 0.35)),
                        midi_end=midi_end, detune=det)
    return buf


def build_victory():
    """~2 s fanfare: bright run, then a held 3-voice C-major chord."""
    buf = [0.0] * int(round(2.0 * SAMPLE_RATE))
    for i, midi in enumerate(VICTORY_RUN):
        render_note(buf, i * 0.105, 0.115, midi, 0.30, wave='square',
                    duty=0.25, env=(0.004, 0.03, 0.8, 0.05))
    for midi, duty, vol in VICTORY_CHORD:
        render_note(buf, 0.75, 1.22, midi, vol, wave='square', duty=duty,
                    env=(0.005, 0.10, 0.75, 0.30))
    return buf


def build_chest():
    """~0.8 s jingle: quick square arpeggio + high triangle sparkle."""
    buf = [0.0] * int(round(0.8 * SAMPLE_RATE))
    for i, midi in enumerate(CHEST_ARP):
        render_note(buf, i * 0.08, 0.09, midi, 0.30, wave='square', duty=0.25,
                    env=(0.003, 0.02, 0.8, 0.04))
    for start, dur, midi in CHEST_SPARKLE:
        render_note(buf, start, dur, midi, 0.28, wave='triangle',
                    env=(0.004, 0.06, 0.5, min(0.2, dur * 0.5)))
    return buf


# --- verification -----------------------------------------------------------
def verify_file(path, loop):
    """Read a WAV back and measure size/duration/peak/RMS (+ loop seam)."""
    with wave.open(path, 'rb') as wav:
        raw = wav.readframes(wav.getnframes())
    dev = [b - CENTER for b in raw]
    row = {
        'file': os.path.basename(path), 'frames': len(raw),
        'kb': os.path.getsize(path) / 1024.0, 'dur': len(raw) / SAMPLE_RATE,
        'peak': max(abs(v) for v in dev), 'byte_max': max(raw),
        'rms': math.sqrt(sum(v * v for v in dev) / len(raw)),
        'loop': loop, 'seam': None,
    }
    if loop:
        head = sum(raw[:64]) / 64
        tail = sum(raw[-64:]) / 64
        row['seam'] = abs(head - tail)
    return row


def check_rows(rows):
    ok = True
    for r in rows:
        bad = []
        if r['kb'] >= 500:
            bad.append('size>=500KB')
        if r['peak'] > 102 or r['byte_max'] > 230:
            bad.append('clipping')
        if r['rms'] < 2.0:
            bad.append('silence')
        if r['loop'] and (r['seam'] is None or r['seam'] > 24):
            bad.append('loop-seam')
        if bad:
            ok = False
            print(f"FAIL {r['file']}: {', '.join(bad)}")
    return ok


def print_table(rows):
    print(f"{'file':<18}{'KB':>8}{'dur_s':>8}{'peak':>6}{'bmax':>6}"
          f"{'RMS':>8}{'seam':>8}")
    for r in rows:
        seam = f"{r['seam']:.2f}" if r['seam'] is not None else '-'
        print(f"{r['file']:<18}{r['kb']:>8.1f}{r['dur']:>8.3f}{r['peak']:>6}"
              f"{r['byte_max']:>6}{r['rms']:>8.2f}{seam:>8}")


BUILDERS = [
    ('music_day', build_day, True),
    ('music_night', build_night, True),
    ('sfx_damage', build_damage, False),
    ('sfx_death', build_death, False),
    ('sfx_victory', build_victory, False),
    ('sfx_chest', build_chest, False),
]


def main():
    rows, audio_meta = [], {}
    for name, builder, loop in BUILDERS:
        path = os.path.join(AUDIO_DIR, f'{name}.wav')
        write_wav(path, builder())
        row = verify_file(path, loop)
        rows.append(row)
        audio_meta[name] = {'path': f'audio/{name}.wav',
                            'durationSec': row['dur'], 'loop': loop}
    print_table(rows)
    os.makedirs(os.path.dirname(BUILD_JSON_PATH), exist_ok=True)
    with open(BUILD_JSON_PATH, 'w', encoding='utf-8') as fh:
        json.dump({'audio': audio_meta}, fh, indent=1, sort_keys=True)
        fh.write('\n')
    print(f'wrote {BUILD_JSON_PATH}')
    if not check_rows(rows):
        raise SystemExit('verification failed — see table above')


if __name__ == '__main__':
    main()
