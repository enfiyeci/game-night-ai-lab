# How the picker mockups were made

`mock.js` and `mock.css` draw each direction's screen over the running game (no game code changed). Serve the repo
root with `/mock/` mapped to this folder, then run `node tools/cdp-shot.mjs <jobs.json>` with one job per frame, for
example:

```json
{ "base": "http://127.0.0.1:PORT/", "jobs": [
  { "url": "index.html?seed=4&scenario=midEra3&paused&m=a1#event-blacklistAppeal", "wait": 5000,
    "script": "await (await import('/mock/mock.js')).apply('A1')", "after": 700, "out": "/abs/A1.png" }
]}
```

Frames: `A1` (event card, `#event-blacklistAppeal`), `A2` (pricing night, `#raise`), `B1`, `C1`, `D1` (plain
`midEra3`). Reference pictures: Railroad Tycoon II and Offworld Trading Company from their Steam store pages, Scaling
Laws from its itch.io page. The published page is https://claude.ai/artifact/Em9bCTwGkcimHCfgEBTnoE.
