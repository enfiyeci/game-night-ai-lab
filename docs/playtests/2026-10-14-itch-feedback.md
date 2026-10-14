# Playtester feedback on the itch.io build (2026-09-27 combined version)

Three players' written feedback, pasted by the owner on 2026-10-14. The build is `main` 17f0192. Quoted as given.

## Player 1

> Amazing work. It captures much of the fun of game dev tycoon (one of my favorites) while giving a solid view of the decisions and tradeoffs AI labs have to make. The depth and polish you achieved are stellar.
>
> What I think works:
> - The gameplay is fun and cohesive
> - The teaching and education are present and feel well integrated
> - The polish, sound, and graphics are great.
>
> What I think could be improved:
> - There could be more on what end game criteria are. For instance, the first game I played, I lost through "being left behind", but that felt abrupt and I couldn't see any indication that I was going to lose.
> - I think there could be more on choosing your starting employees, and funding distribution before the play actually begins.
>
> Overall your game is amazing, though, and I'll definitely be playing it more!

## Player 2

> I spent quite a decent chunk of my time playing the game. Took me 20+ minutes for the first ending.
> There was so much happening, yet I had no way to know which decision was the right one. I wished there was a tutorial to show me what decisions worked out. At times there were so many decisions to make that it overwhelmed me and then there were weeks when nothing happened. Improved pacing (without too much text overload) would be great.
> I did not see any dialogue during the board meetings, especially the one where I was probably kicked out.
> The ending also uses names like Kestrel Labs and Lumen for the model, which wasn't the name I put in. Maybe some way to change that according to the user input would be great.
> Overall, I think there's a lot to improve. What I would be looking forward to is a way this game introduces the decisions to people who may not be as technical.

## Player 3

> I like the idea and the game looks really fun but some mechanics are hard to use / not that well implemented. The compute slider was really confusing, I think it was bugged. I couldn't find a way to free computer to start a new training run an basically got stuck.

## Triage

| # | Issue | Kind |
|---|---|---|
| 1 | "Left behind" loss came with no warning; end-game criteria unclear | design (warnings before fail endings) |
| 2 | Want to choose starting employees and funding split before play | design (new pre-game step) |
| 3 | No way to tell which decisions were right; wants feedback on choices | design |
| 4 | Pacing: bursts of many decisions, then empty weeks; too much text | design |
| 5 | No dialogue shown in board meetings, including the removal vote | likely bug |
| 6 | Ending names "Kestrel Labs" and "Lumen" instead of the player's names | bug |
| 7 | Introduce decisions for non-technical players | design |
| 8 | Compute slider confusing; could not free compute for a new training run (stuck) | likely bug |
