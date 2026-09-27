# Film specs for the Blender stills

Each `<set-group>-<film>.json` says which rendered stills replace which shots of one film, in the format
`tools/endings/film_stills.py` reads: `python3 tools/endings/film_stills.py <film> tools/endings/specs/<file>.json`.
Run a spec only after its stills exist in `ui/assets/endings/stills/` (a screen's centre comes from its still's json).
`world-*` came from the city/desert sets (branch ea-world, merged), `halls-*` from Washington/Geneva/stage (branch
ea-halls, not merged yet; ov-news and qt-briefing were being restaged when work stopped, so their entries may change).
