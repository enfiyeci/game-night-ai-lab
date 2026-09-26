# How games treat buttons that do nothing on fake websites

Short memo, 2026-09-26, for the full-page feed mockup (`docs/design/mockups/K2-feed-fullpage.html`).
A research subagent gathered the examples; the two strongest were then re-read in full by the
orchestrator. Everything else is the subagent's report and is marked as such.

## Verified by reading the source in full

- **Football Manager 2024, Social Feed.** The manual describes no way to post, like, reply or
  share. What it does describe: Follow on a game object, a Manage dialog for followed accounts
  with Social Content and News tick-boxes and a frequency drop-down (Minimal, Normal or
  Extensive), a pen icon for finer news types, a settings icon on each message that says why it
  arrived, and opening a news story in a pop-out panel. That is the manual's account, not a
  full list of the game's controls. Source: SIGames manual, "Inbox and News",
  https://community.sports-interactive.com/sigames-manual/football-manager-2024/inbox-and-news-r4956/
- **GTA V (and The Ballad of Gay Tony), Bleeter.** A Twitter parody the player reads on the phone
  and computer; posts come from hundreds of named characters and brands. ⚠️ The wiki page does
  not say whether the player gets post or like controls, so the subagent's claim that there are
  none is not confirmed by this source. Source: https://gta.fandom.com/wiki/Bleeter

## From the subagent's report (not re-read here)

- **Watch Dogs, Profiler "Talk Feed":** a read-only feed of chatter; every real button nearby does
  something. (Subagent read the wiki page in full.)
- **Orwell:** only extractable text is highlighted; everything else is inert. ⚠️ read as a summary.
- **Neurocracy:** would-be dead links open small preview pop-ups. ⚠️ read as a summary.
- **Hypnospace Outlaw:** the opposite approach; nearly every control is a small working toy.
  ⚠️ read as a summary.
- **Bury Me, My Love; Emily Is Away; Cyberpunk 2077 apartment mail:** only the controls the story
  needs are built at all. ⚠️ summaries or search snippets only.
- **Usability research on disabled controls (Nielsen):** clickable dead buttons frustrate users
  most; hidden ones make users think the feature does not exist; greyed-out with an explanation
  is the usual advice. ⚠️ read as a summary.
- No verified example was found of a dead button that answers with a scripted joke.

## Options drawn from this (shown to the owner as a live switcher)

- **A Scenery:** looks exactly like the site; dead controls never react (no hover, no pointer).
- **B Joke replies:** dead controls answer with a one-line joke from the comms advisor. No
  verified precedent; risk of going stale over a long run.
- **C Small things work:** like, bookmark, follow and the Following tab work for show; the rest
  as in A. Closest to Football Manager's Follow control.
- **D Stripped down:** remove what has no job (composer, action buttons, search), closest to
  what the Football Manager manual describes. Loses the faithful-copy look the owner asked for.
- **Recommended, C + B:** C for the cheap controls, B's jokes for the rest. **Owner picked C + B
  (2026-09-26);** the mockup now shows only that behaviour.
