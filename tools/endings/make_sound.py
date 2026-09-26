#!/usr/bin/env python3
"""Synthesised sound for an ending film, timed from its shot list (ui/endings/films/<id>.json). No samples.

Each shot lists cues as [name, at] or [name, at, until], in seconds from the shot's start. Ambiences (room, gulls,
city, ...) run to the end of their shot. A run of badges or board rows is [name, at, count, step]: exactly count sounds,
step seconds apart, so the sound matches what the picture shows. The film's "titleSfx" cues play under the title card.
Under the whole film runs a low drone that swells on the title card.
Writes ui/assets/endings/<id>.m4a (AAC, via ffmpeg). Needs numpy.

Run: python3 tools/endings/make_sound.py misalignment
"""
import json
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SR = 44100
TITLE_DUR = 7
rng = np.random.default_rng(11)


def t_axis(n):
    return np.arange(n) / SR


def env(n, a=0.01, r=0.2):
    e = np.ones(n)
    na, nr = min(int(a * SR), n), min(int(r * SR), n)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, cutoff):
    """One-pole low-pass response, applied in the frequency domain (fast without scipy)."""
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(spec / np.sqrt(1 + (f / cutoff) ** 2), len(x))


def bandpass(x, lo, hi):
    return lowpass(x, hi) - lowpass(x, lo)


def noise(n):
    return rng.normal(0, 1, n)


def tone(freq, dur, decay=3.0, gain=0.1):
    n = int(dur * SR)
    t = t_axis(n)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * decay) * env(n, 0.004, 0.05) * gain


def sweep(f0, f1, dur, gain=0.1):
    n = int(dur * SR)
    f = np.geomspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.05, 0.3) * gain


# ---------------------------------------------------------------- the sound library: name -> clip(duration)
def room(d):
    n = int(d * SR)
    b = np.cumsum(noise(n))
    b -= np.convolve(b, np.ones(4410) / 4410, mode="same")
    b /= np.max(np.abs(b)) + 1e-9
    hum = 0.5 * np.sin(2 * np.pi * 60 * t_axis(n)) + 0.25 * np.sin(2 * np.pi * 120 * t_axis(n))
    return (b * 0.14 + hum * 0.035) * env(n, 0.3, 0.3)


def party(d):
    n = int(d * SR)
    chatter = bandpass(noise(n), 300, 2400) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.7 * t_axis(n)) ** 2)
    out = chatter * 0.05 * env(n, 0.4, 1.5)
    out[: int(0.25 * SR)] += bandpass(noise(int(0.25 * SR)), 800, 5000) * np.exp(-np.linspace(0, 12, int(0.25 * SR))) * 0.5  # the cork
    return out


def high_tone(d):
    n = int(d * SR)
    return np.sin(2 * np.pi * 2350 * t_axis(n)) * env(n, 1.5, 1.0) * 0.012


def run(one, count, step):
    """count copies of one(k) (the k-th sound of the run), step seconds apart."""
    clips = [one(k) for k in range(count)]
    out = np.zeros(int((count - 1) * step * SR) + max(len(c) for c in clips))
    for k, clip in enumerate(clips):
        i = int(k * step * SR)
        out[i:i + len(clip)] += clip
    return out


def chimes(count, step):
    """Soft notification chimes: the 'Resolved' badges popping, one per badge."""
    return run(lambda k: tone([784, 988, 1175][k % 3], 0.5, 7, 0.05), count, step)


def flaps(count, step):
    """A departures-board row flipping: a burst of small plastic clacks, one burst per row."""
    def burst(k):
        out = np.zeros(int(0.12 * SR))
        for j in range(4):
            click = bandpass(noise(int(0.012 * SR)), 1200, 6000) * np.exp(-np.linspace(0, 9, int(0.012 * SR))) * 0.16
            i = int(j * 0.024 * SR)
            out[i:i + len(click)] += click
        return out
    return run(burst, count, step)


def chime(d):
    n = int(2.4 * SR)
    t = t_axis(n)
    s = sum(g * np.sin(2 * np.pi * f * t) * np.exp(-t * 2.2) for f, g in ((659.25, 1.0), (987.8, 0.6), (1318.5, 0.3)))
    return s * 0.07 * env(n, 0.004, 0.3)


def tick(d):
    """Two quick clicks, the second 0.09 s after the first."""
    n = int(0.15 * SR)
    first = np.pad(tone(1800, 0.06, 60, 0.3), (0, n - int(0.06 * SR)))
    return first + np.pad(tone(1400, 0.06, 60, 0.2), (int(0.09 * SR), 0))[:n]


def steps(count, step):
    """Someone getting up and leaving: a chair roll, then three footsteps, per person."""
    def leave(k):
        out = np.zeros(int(0.5 * SR))
        roll = lowpass(noise(int(0.18 * SR)), 500) * env(int(0.18 * SR), 0.02, 0.08) * 0.06
        out[: len(roll)] += roll
        for j in range(3):
            f = lowpass(noise(int(0.06 * SR)), 900) * np.exp(-np.linspace(0, 8, int(0.06 * SR))) * 0.12
            i = int((0.2 + j * 0.1) * SR)
            out[i:i + len(f)] += f
        return out
    return run(leave, count, step)


def stamps(count, step):
    """A rubber stamp, again and again."""
    def stamp(k):
        n = int(0.14 * SR)
        t = t_axis(n)
        return (lowpass(noise(n), 700) * np.exp(-t * 40) * 0.5 + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30) * 0.25)
    return run(stamp, count, step)


def backups(offset, until):
    """One soft ping per backup of the model, on the globe's schedule (tools/endings/blender/globe.py, backup_time,
    53 data centres), for clip seconds offset..until. Returned relative to offset."""
    n = 53
    times = [0.4 + 10.5 * (i / n) ** 0.55 - offset for i in range(n)]
    times = [t for t in times if 0 <= t < until - offset]
    out = np.zeros(int((until - offset + 0.5) * SR))
    for k, t in enumerate(times):
        clip = tone([1568, 1760, 2093, 1976][k % 4], 0.3, 10, 0.03)
        i = int(t * SR)
        out[i:i + len(clip)] += clip[: len(out) - i]
    return out


def walkout(d):
    """People leaving over a stretch of time: chairs rolling back and footsteps, irregular, not one sound per person."""
    out = np.zeros(int(d * SR))
    at = 0.1
    while at < d - 0.4:
        roll = lowpass(noise(int(0.18 * SR)), 500) * env(int(0.18 * SR), 0.02, 0.08) * 0.05
        i = int(at * SR)
        out[i:i + len(roll)] += roll[: len(out) - i]
        for j in range(3):
            f = lowpass(noise(int(0.06 * SR)), 900) * np.exp(-np.linspace(0, 8, int(0.06 * SR))) * 0.1
            k = int((at + 0.2 + j * 0.11) * SR)
            out[k:k + len(f)] += f[: len(out) - k]
        at += rng.uniform(0.45, 0.8)
    return out


def pings(count, step):
    """Soft pings, one per new copy, alternating left and right in a mono mix by pitch."""
    return run(lambda k: tone([1568, 1760, 2093, 1976][k % 4], 0.35, 9, 0.035), count, step)


def flare(d):
    """The monitors flaring: a rising shimmer."""
    return sweep(600, 2400, 0.8, 0.04) + sweep(900, 3600, 0.8, 0.02)


def pen(d):
    """A signature: short scratchy strokes."""
    out = np.zeros(int(0.8 * SR))
    at = 0.0
    while at < 0.7:
        n = int(rng.uniform(0.05, 0.12) * SR)
        stroke = bandpass(noise(n), 2500, 8000) * env(n, 0.01, 0.02) * 0.05
        i = int(at * SR)
        out[i:i + n] += stroke[: len(out) - i]
        at += rng.uniform(0.08, 0.16)
    return out


def crickets(d):
    n = int(d * SR)
    t = t_axis(n)
    chirp = np.sin(2 * np.pi * 4400 * t) * (np.sin(2 * np.pi * 30 * t) > 0.3) * (np.sin(2 * np.pi * 1.3 * t) > 0)
    return (chirp * 0.012 + lowpass(noise(n), 300) * 0.03) * env(n, 0.3, 0.3)


def chord(d):
    """A soft sustained chord (A major, low and warm), for good news that is deliberately undramatic."""
    n = int(max(d, 4.0) * SR)
    t = t_axis(n)
    s = sum(g * np.sin(2 * np.pi * f * t) for f, g in ((110, 1.0), (138.6, 0.7), (164.8, 0.6), (220, 0.4), (277.2, 0.25)))
    return s * 0.03 * env(n, 1.2, 1.5)


def sting(d):
    """A news-channel sting: two bright stabs over a low hit."""
    n = int(1.4 * SR)
    t = t_axis(n)
    hit = np.sin(2 * np.pi * 65 * t) * np.exp(-t * 5) * 0.12
    out = hit + np.pad(tone(1046, 0.5, 6, 0.07) + tone(1568, 0.5, 6, 0.04), (0, n - int(0.5 * SR)))
    second = tone(1318, 0.6, 5, 0.07)
    return out + np.pad(second, (int(0.18 * SR), n - int(0.18 * SR) - len(second)))


def gulls(d):
    n = int(d * SR)
    out = bandpass(noise(n), 100, 900) * 0.05  # water and wind
    for at in rng.uniform(0.3, max(0.4, d - 1), 4):
        m = int(0.45 * SR)
        f = 1500 + 500 * np.sin(np.linspace(0, np.pi, m)) ** 2
        cry = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, 0.05, 0.25) * 0.04
        i = int(at * SR)
        out[i:i + m] += cry[: len(out) - i]
    return out


def door(d):
    n = int(1.2 * SR)
    f = np.linspace(180, 90, n)
    groan = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.7 * np.sign(np.sin(2 * np.pi * 23 * t_axis(n))))
    return lowpass(groan, 900) * env(n, 0.05, 0.4) * 0.06


def beeps(d):
    out = room(d) * 0.6
    for k in range(int(d / 0.9)):
        clip = tone(1046, 0.12, 20, 0.05)
        i = int(k * 0.9 * SR)
        out[i:i + len(clip)] += clip[: len(out) - i]
    return out


def hold(d):
    n = int(d * SR)
    t = t_axis(n)
    melody = np.sin(2 * np.pi * (523 + 131 * (np.floor(t * 3) % 3)) * t)
    return bandpass(melody, 300, 3000) * 0.035 * env(n, 0.05, 0.05)   # phone-line hold music, cut off


def fridge(d):
    n = int(d * SR)
    return (np.sin(2 * np.pi * 50 * t_axis(n)) + 0.4 * bandpass(noise(n), 60, 300)) * 0.05 * env(n, 0.1, 0.25)


def flicker(d):
    out = np.zeros(int(1.2 * SR))
    for at in (0.0, 0.35, 0.7, 1.05):   # in step with the lamp in the kitchen plate
        clip = bandpass(noise(int(0.05 * SR)), 1000, 6000) * np.exp(-np.linspace(0, 10, int(0.05 * SR))) * 0.25
        i = int(at * SR)
        out[i:i + len(clip)] += clip
    return out


def notify(d):
    return tone(880, 0.25, 12, 0.08) + np.pad(tone(1320, 0.2, 14, 0.07), (int(0.09 * SR), 0))[: int(0.25 * SR)]


def typing(d):
    out = np.zeros(int(d * SR))
    at = 0.0
    while at < d - 0.05:
        clip = bandpass(noise(int(0.025 * SR)), 1500, 7000) * np.exp(-np.linspace(0, 12, int(0.025 * SR))) * 0.18
        i = int(at * SR)
        out[i:i + len(clip)] += clip[: len(out) - i]
        at += rng.uniform(0.06, 0.14)
    return out


def city(d):
    n = int(d * SR)
    return (bandpass(noise(n), 80, 1200) * 0.07 + np.sin(2 * np.pi * 100 * t_axis(n)) * 0.01) * env(n, 0.3, 0.6)


def powerdown(d):
    """Transformers winding down one by one, like breaths."""
    out = np.zeros(int(d * SR))
    for k in range(int(d / 0.9)):
        clip = sweep(160, 45, 0.9, 0.07)
        i = int(k * 0.9 * SR)
        out[i:i + len(clip)] += clip[: len(out) - i]
    return out


def roomtone(d):
    return room(d) * 0.8


def creak(d):
    n = int(0.4 * SR)
    f = np.linspace(310, 180, n)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.6 * np.sign(np.sin(2 * np.pi * 38 * t_axis(n))))
    return lowpass(s, 1400) * env(n, 0.03, 0.2) * 0.12


def hum(d):
    n = int(d * SR)
    return (np.sin(2 * np.pi * 60 * t_axis(n)) + 0.5 * np.sin(2 * np.pi * 120 * t_axis(n)) + 0.3 * bandpass(noise(n), 200, 1500)) * 0.05 * env(n, 0.2, 0.1)


def clunk(d):
    n = int(0.5 * SR)
    t = t_axis(n)
    return (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 14) + lowpass(noise(n), 800) * np.exp(-t * 30) * 0.8) * 0.5


def fansdown(d):
    n = int(4.5 * SR)
    t = t_axis(n)
    f = np.geomspace(420, 30, n)
    blades = np.sin(2 * np.pi * np.cumsum(f) / SR)
    air = bandpass(noise(n), 200, 2500) * np.linspace(1, 0, n)
    return (blades * 0.05 + air * 0.08) * env(n, 0.02, 1.5)


def wind(d):
    n = int(d * SR)
    return lowpass(noise(n), 400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t_axis(n))) * 0.1 * env(n, 0.6, 0.6)


def emergency(d):
    n = int(d * SR)
    return (room(d) * 0.5 + np.sin(2 * np.pi * 50 * t_axis(n)) * 0.03)


def whir(d):
    n = int(1.6 * SR)
    t = t_axis(n)
    f = 520 + 60 * np.sin(2 * np.pi * 5.5 * t) + np.linspace(80, -40, n)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)) * env(n, 0.3, 0.6) * 0.06


SOUNDS = {"room": room, "party": party, "tone": high_tone, "chime": chime, "tick": tick, "gulls": gulls, "door": door,
          "beeps": beeps, "hold": hold, "fridge": fridge, "flicker": flicker, "notify": notify, "typing": typing, "city": city,
          "powerdown": powerdown, "roomtone": roomtone, "creak": creak, "hum": hum, "clunk": clunk, "fansdown": fansdown,
          "wind": wind, "emergency": emergency, "whir": whir, "sting": sting, "flare": flare, "pen": pen, "crickets": crickets, "chord": chord, "walkout": walkout}
AMBIENT = {"room", "party", "tone", "gulls", "beeps", "city", "roomtone", "wind", "emergency", "fridge", "crickets", "hum"}
RUNS = {"chimes": chimes, "flaps": flaps, "steps": steps, "stamps": stamps, "pings": pings}   # [name, at, count, step]


def drone(d, swell_at):
    n = int(d * SR)
    t = t_axis(n)
    s = sum(np.sin(2 * np.pi * f * t + p) for f, p in ((55, 0), (82.4, 1.1), (110.2, 2.0)))
    gain = np.interp(t, [0, 2, swell_at - 1, swell_at + 1.5, d - 1.2, d], [0, 0.018, 0.028, 0.07, 0.07, 0])
    return s * gain


def build(film_id):
    film = json.loads((ROOT / f"ui/endings/films/{film_id}.json").read_text())
    total = sum(s["dur"] for s in film["shots"]) + film.get("titleDur", TITLE_DUR)
    track = np.zeros(int(total * SR))

    def add(start, clip):
        i = int(start * SR)
        j = min(len(track), i + len(clip))
        if i < len(track):
            track[i:j] += clip[: j - i]

    def cues(sfx, start, shot_dur):
        for cue in sfx:
            name, at = cue[0], cue[1]
            if name in RUNS:
                clip = RUNS[name](cue[2], cue[3])
            elif name == "backups":   # [name, at, clip offset of this shot, clip seconds it runs to]
                clip = backups(cue[2], cue[3])
            else:
                until = cue[2] if len(cue) > 2 else (shot_dur if name in AMBIENT else None)
                clip = SOUNDS[name]((min(until, shot_dur) - at) if until else 2.0)
            add(start + at, clip[: int((shot_dur - at) * SR)])   # nothing spills into the next shot

    start = 0.0
    for shot in film["shots"]:
        cues(shot.get("sfx", []), start, shot["dur"])
        start += shot["dur"]
    title_at = start
    cues(film.get("titleSfx", []), title_at, film.get("titleDur", TITLE_DUR))
    add(0, drone(total, title_at))
    add(title_at + 2.8, chime(2.4) * 0.8)   # Lumen's line
    track = np.tanh(track * 2.6) / np.tanh(2.6)
    pcm = (np.clip(track, -1, 1) * 0.9 * 32767).astype(np.int16)
    out = ROOT / f"ui/assets/endings/{film_id}.m4a"
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "mix.wav"
        with wave.open(str(wav), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "aac", "-b:a", "96k", str(out)], check=True)
    print(f"wrote {out} ({total:.1f} s)")


if __name__ == "__main__":
    for fid in sys.argv[1:] or ["misalignment"]:
        build(fid)
