# Phone layout research (lane gn-phone-redesign, 2026-10-26)

Research behind the phone and iPhone Duo redesign of Game Night AI Lab.

## Reading order

1. `inventory.md`: every screen and overlay in the game, what each holds on desktop, how hard it is on a
   phone, the redesign priority (P1 core loop, P2 management, P3 set pieces), the touch debts (hover rules,
   small drag grips, web fonts), and the device sizes measured in the Xcode 27.1 simulators.
2. `mobile-management-layouts.md`: how phone management and strategy games lay out orientation, navigation,
   HUD, dense panels and event cards, plus Apple's touch, type and foldable guidance. Subagent output with
   its own coverage statement; unverified where marked ⚠️.
3. The layout-system picker built from both (published for the owner, not stored in the repo):
   https://claude.ai/artifact/PEfEyGp2MTWqf1brmadFS3

## Notable catches

- Apple's Duo Tech Talk 111461 says the Duo's inner display ignores an app's supported orientations, so
  the game needs a landscape-shaped layout on the opened Duo whatever the phone layout is.
- On the Duo's inner display, Safari's `screen.width × screen.height` reports the outer display (466 × 678),
  so layout code must read the viewport.
- App Store screenshot thumbnail URLs ("320x480bb") name a bounding box, not the image's shape; the research
  agent downloaded the images to get orientation right.
- The two Duo documents in `~/Desktop/duo-party-games/docs/research/` (`app-store-approval/report.md`,
  `monetization/notes/iphone_duo_market.md`) were read in full; their Duo facts (screenshot sizes 1398 × 2034
  outer and 2007 × 2853 inner, iOS 27.1 SDK needed to fill the inner display) match the simulator.
