# Ending animation test: "A quiet takeover", made two ways (2026-09-25)

The owner asked for a distinct, cinematic animation per ending, with sound. This folder holds the
first test: one ending built in the browser and in Blender, published for comparison as the
private artifact "Ending animation test" (https://claude.ai/artifact/AEVXJKRCekoaAh6fZ9LTd2).

| File | What it is |
|---|---|
| `blender_quiet_takeover.py` | Blender 5.2 script: builds a small 3D office in the K2 palette, animates it (staff leave, lights dim, Lumen robot floats to the CEO chair, monitors flare) and renders PNG frames. Run: `/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P blender_quiet_takeover.py -- <out_dir>` (add `preview` for four stills), then `ffmpeg -framerate 24 -i <out_dir>/f_%04d.png -c:v libx264 -pix_fmt yuv420p out.mp4`. About 0.5 s per frame on an M4 Pro. |
| `make_sfx.py` | Synthesised sound (room tone, server hum, creaks and footsteps, power-down sweep, robot whir, chime, drone). Writes `sfx-blender.wav` (12 s) and `sfx-browser.wav` (14 s). Needs numpy. |
| `blender-quiet-takeover-sfx.mp4` | The rendered Blender cut with sound, 1280×800, 12 s, about 2 MB. |
| `build_browser.py` + `office-era4.svg` | The browser cut: the real era-4 office SVG animated with one 14 s CSS timeline (`?t=<s>` freezes a frame). |
| `gen/gen_office_with_sitters.py` | A copy of the UI lane's `tools/office/gen_office.py` with each sitter wrapped in `<g class="sitter">`, so people can leave without their desks. The UI lane should adopt this change. |
| `sfx-browser.m4a` | Sound for the browser cut. |
| `build_compare.py` | Builds the comparison artifact page. |

Endings screen after the animation: the owner asked for "a mix"; the mockup is
`docs/design/mockups/K2-side-options.html#nmix` (N1 truth scale + N2 redacted headlines + N4 Lumen note).
