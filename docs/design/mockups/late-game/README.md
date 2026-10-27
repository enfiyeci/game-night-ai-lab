# Late-game mockups (lane gn-late-game, 2026-10-27)

Design only; nothing here is loaded by the game. The picker page is `picker/index.html` (published at
https://claude.ai/artifact/7txBkceGHqTDX6vyZrak6E); its captures are `picker/img/*.jpg`.

- `frames.js` draws each frame into the running game; `mockup.css` holds only the new elements, in the game's tokens.
- `map.js` draws the world board as a contested hex map (M1, M2) from `worldmap.js`, a hex grid built from Natural
  Earth 110m countries (public domain, world-atlas 2.0.2); the nine regions are this lane's grouping.
- Desktop frames: serve the repo on 127.0.0.1 (queue 256, `Cache-Control: no-store`), open
  `index.html?scenario=summit&seed=4&notitle&paused` and run, through `tools/cdp-shot.mjs`:
  `const m = await import('/docs/design/mockups/late-game/frames.js?' + Date.now()); return await m.frame('B-board');`
- Phone frames (`ph-*`) run on the phone-redesign build 8209268 with `&layout=phone&insets=L,T,R,B` at iPhone
  874 × 402 (`62,0,62,21`), Duo open 951 × 669 (`0,0,0,20`) and Duo closed 678 × 466 (`82,0,0,20`), importing
  `frames.js` from the repo's server (it must send `Access-Control-Allow-Origin`).
- Every number, model name and advisor line on the frames is a stand-in, not sim output. Today's look is drawn; new
  dialogs use the release reveal's frame, which the IP fix C3 will put on every dialog.
