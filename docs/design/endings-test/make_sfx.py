#!/usr/bin/env python3
"""Synthesised sound for the 'quiet takeover' ending test. No samples: every sound is generated.

Writes sfx-blender.wav (12 s timeline) and sfx-browser.wav (14 s timeline) next to this script.
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
HERE = Path(__file__).resolve().parent
rng = np.random.default_rng(7)


def t_axis(n):
    return np.arange(n) / SR


def env(n, a=0.01, r=0.2):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lowpass(x, cutoff):
    # one-pole low-pass
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def add(track, start, clip, gain=1.0):
    i = int(start * SR)
    j = min(len(track), i + len(clip))
    if i < len(track):
        track[i:j] += clip[: j - i] * gain


def room_tone(dur):
    n = int(dur * SR)
    brown = np.cumsum(rng.normal(0, 1, n))
    brown -= np.convolve(brown, np.ones(4410) / 4410, mode="same")  # remove drift
    brown /= np.max(np.abs(brown)) + 1e-9
    t = t_axis(n)
    hum = 0.5 * np.sin(2 * np.pi * 60 * t) + 0.25 * np.sin(2 * np.pi * 120 * t) + 0.12 * np.sin(2 * np.pi * 180 * t)
    return brown * 0.18, hum * 0.05


def footsteps(count=4, gap=0.32):
    out = np.zeros(int((count * gap + 0.3) * SR))
    for k in range(count):
        n = int(0.09 * SR)
        click = lowpass(rng.normal(0, 1, n), 900) * np.exp(-np.linspace(0, 9, n))
        add(out, k * gap, click, 0.9 * (1 - k * 0.18))
    return out


def creak():
    n = int(0.35 * SR)
    t = t_axis(n)
    f = np.linspace(310, 180, n)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.6 * np.sign(np.sin(2 * np.pi * 38 * t)))
    return lowpass(s, 1400) * env(n, 0.03, 0.2) * 0.25


def power_down(dur):
    n = int(dur * SR)
    f = np.geomspace(240, 48, n)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR)
    return s * env(n, 0.4, 1.2) * 0.12


def whir(dur):
    n = int(dur * SR)
    t = t_axis(n)
    f = 520 + 60 * np.sin(2 * np.pi * 5.5 * t) + np.linspace(80, -40, n)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    s += 0.4 * lowpass(rng.normal(0, 1, n), 2500)
    return s * env(n, 0.5, 0.8) * 0.09


def chime():
    n = int(3.2 * SR)
    t = t_axis(n)
    s = np.zeros(n)
    for f, g in ((523.25, 1.0), (659.25, 0.8), (783.99, 0.7), (1046.5, 0.35)):
        s += g * np.sin(2 * np.pi * f * t) * np.exp(-t * 1.6)
    sub = np.sin(2 * np.pi * 45 * t) * np.exp(-t * 2.2)
    return (s * 0.11 + sub * 0.35) * env(n, 0.005, 0.4)


def drone(dur):
    n = int(dur * SR)
    t = t_axis(n)
    s = sum(np.sin(2 * np.pi * f * t + p) for f, p in ((55, 0), (82.4, 1.1), (110.2, 2.0), (164.8, 0.5)))
    s *= 1 + 0.15 * np.sin(2 * np.pi * 0.3 * t)
    return s * env(n, 1.2, 0.8) * 0.06


def build(dur, leaves, ceo_at, bot_from, bot_to, sync_at, title_at, dim_from, dim_to, out_name):
    n = int(dur * SR)
    track = np.zeros(n)
    brown, hum = room_tone(dur)
    # the room gets quieter as people leave; the servers get louder in the silence
    room_gain = np.interp(t_axis(n), [0, dim_from, dim_to, dur], [1.0, 1.0, 0.35, 0.3])
    hum_gain = np.interp(t_axis(n), [0, dim_to, dur], [0.8, 1.2, 1.6])
    track += brown * room_gain + hum * hum_gain
    for k, t0 in enumerate(leaves):
        add(track, t0, creak(), 0.8)
        add(track, t0 + 0.2, footsteps(4 - (k % 2)), 0.5)
    add(track, ceo_at, creak(), 1.0)
    add(track, ceo_at + 0.25, footsteps(5, 0.3), 0.7)
    add(track, dim_from + 0.3, power_down(dim_to - dim_from), 1.0)
    add(track, bot_from, whir(bot_to - bot_from + 0.6), 1.0)
    add(track, sync_at, chime(), 1.0)
    add(track, title_at - 0.6, drone(dur - title_at + 0.6), 1.0)
    track = np.tanh(track * 1.4) / np.tanh(1.4)
    fade = int(0.4 * SR)
    track[-fade:] *= np.linspace(1, 0, fade)
    pcm = (np.clip(track, -1, 1) * 0.85 * 32767).astype(np.int16)
    with wave.open(str(HERE / out_name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", out_name)


# Blender cut (12 s): staff leave from 2.2 s every 0.7 s, CEO at 7.4 s, Lumen 8.0-10.6 s, screens flare 11.1 s
build(12.0, [2.2 + i * 0.7 for i in range(7)], 7.4, 8.0, 10.6, 11.1, 10.9, 1.5, 7.5, "sfx-blender.wav")
# Browser cut (14 s): staff from 2.2 s every 0.7 s, CEO 7.2 s, Lumen 8.0-11.0 s, flare 11.2 s, title 12.0 s
build(14.0, [2.2 + i * 0.7 for i in range(7)], 7.2, 8.0, 11.0, 11.2, 12.0, 1.5, 7.5, "sfx-browser.wav")
