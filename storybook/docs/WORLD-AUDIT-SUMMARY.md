# World audit, all 114 surahs: final report (2026-11-17)

Brief: "Complete world logic, gameplay and bug fix update". Branch `claude/project-thread-12i5j5` (pull request against the all-114 branch). No new worlds and no style change were made. The 3D look, character dressing room, Quran text, rooms, library and activities are unchanged except where a fix is listed below.

Everything below was checked by scripts in headless Chromium and in Node. **Nothing was played by a person or on a real phone, and nothing has had a scholar's review.** Every world is therefore *Awaiting Content Review*, and the best technical status any world has is *Verified (automated)*.

## Result in one table

| Technical status | Worlds |
|---|---|
| Verified (automated): fast validator, browser validator on desktop, and play-through where run, all pass | 109 |
| Retested: passes, but a minor item is still open (a boulder right beside an activity spot) | 3 (12 Yusuf, 18 Al-Kahf, 30 Ar-Rum) |
| Issue Found: the play-through bot could not do one activity itself and marked it done | 2 (10 Yunus: the voyage; 28 Al-Qasas: the chest on the river) |
| Content | all 114 Awaiting Content Review |

Plus Nuh's Ark (inside Surah Hud): every check passes, including each animal kind boarded on its own.

## What was checked

1. **Fast validator, all 114** (`npm run worlds:validate`): 0 errors, 5 warnings (spawn 0.6-0.7 m from a solid in 2 and 94; boulders beside spots in 12, 18, 30). Checks spawn, every solid from 8 sides, slopes, the edge, every footpath both ways, walking reachability of every activity from the start through story doors, scenery on spots, rocks without colliders, herds, task order and loops, ayah refs, wording that makes the player a prophet or depicts anyone, and adaptation notes.
2. **Browser validator, all 114 on desktop + 5 on phone emulation (1, 3, 19, 20, 27) + the Ark**: drawn parts without colliders, live walking into the nearest solids, camera from 8 angles, explorer scale every frame, Return to safe ground. All pass.
3. **Play-throughs of 12 priority worlds** (19 Maryam, 3, 12 Yusuf, 18 Al-Kahf, 20 Ta-Ha, 11 Hud, 27, 9, 28, 64, 6, 10): every activity through the game's own actions, a walking route checked before each move, leave and come back halfway, reload, Leave this world. 10 pass fully; 10 and 28 as above.
4. **Ark**: giraffes under the lintel (top of body 5.51 m, lintel 5.9 m), ramp rails, door while the ramp is up, floor lifting with the flood, and each kind (giraffe, elephant, camel, horse, sheep) called from where it grazes and boarded on its own: no animal inside a solid, mates never through each other, size constant, pairs end in the same stall.

## Bugs found and fixed (root cause, fix)

- **Walking through rocks (112 of 114 worlds and the Ark meadow).** Rocks 0.3-0.7 m tall had no collider (only size mattered). Every rock taller than 0.28 m is solid now.
- **Explorer seeming to disappear or be cut open (camera).** With a wall behind and a roof above, the camera could sit 0.25 m from the head, inside the figure. Below 1.2 m it now blends to a view from just above the head.
- **Maryam: explorer walking off on their own.** Pointing reached only 40 m, so tapping the niche, pavilion or palm made the explorer walk across the grove. Pointing now reaches the whole grove.
- **Ta-Ha: the dry path through the sea could not be walked** (a row of round hills with 8 m dips; only the old test's teleport reached it). Now a level causeway. One cairn hill was too steep: widened.
- **Ark animals:** elephants got stuck for minutes on the way to their pad (the route finder treated every animal as 0.3 m wide and did not know about the cart); giraffes walked through each other from pad to ramp; camels and sheep brushed the sheep pen corner in the hold; earlier, stuck animals turned into "ghosts" and passed through solids. Now routes fit each animal's size and see the cart, animals stay solid until the ramp, pairs board single file, the aisle is centred.
- **Navigation:** the world list skipped Surah Hud and showed the Ark in its place; the Ark now sits under Hud. Leaving the Ark from a saved link went home; it now returns to Surah Hud.
- **Spawns:** 28 started in the river shallows, 64 outside the world edge, 84 against a house wall. Moved.
- **Paths:** 6 crossed the bridge on a slant and caught on the water's edge; 28 ran along the river bank edge. Re-drawn.
- **Al-Kahf:** the four stories had no labels. Now four named parts (cave, two gardens, Musa where two seas meet, the barrier), shown as you enter, with the activity list per part.
- **Order:** An-Naml read Musa and the fire (27:7-14) last, after Sulayman. Now first, in surah order. Al-Kahf's Musa reading carried 18:109; removed (kept in the full reader).
- **Missing adaptation notes** on game-only activities in 9, 13, 16: added.
- **Tests that hid bugs:** the play-through teleported everywhere, so unreachable places passed. It now checks a walking route before every move, resumes halfway and leaves the world.

Dev tools added: `?debug=colliders,nav,triggers,paths` (or `all`) overlays, `npm run worlds:validate`, `npm run worlds:report`.

## Story logic checks asked for in the brief

- **Yusuf:** chapters in Quran order (dream 12:4-6 → well → house in Egypt → prison → king's dream → storehouse years → brothers → forgiveness → shirt). The player is never Yusuf (waters travellers' camels, a townsperson at the storehouse, helps pack goods, carries the shirt as a helper), each labelled as a game idea.
- **Maryam:** sanctuary and palm areas reachable on foot, open in story order; movement, camera and pointing fixed; desktop and phone checks pass.
- **Al-Kahf:** four distinct, connected, labelled parts.
- **Nuh's Ark:** see Ark above. Rain and the flood stage are tied to boarding as before (not changed).
- **Uniqueness:** no world's mechanic was changed or merged.

## Needs a scholar's review

- Paraphrased words of messengers (check against the cited ayahs): 11 (Nuh, Hud, Salih; "O my people, worship Allah" 11:50, 61, 84; the she-camel 11:64), 12 (Yusuf; the two young men), 19 (Ibrahim), 20 (Musa and Harun), 27 (Sulayman twice), 34 (Dawud), 71 (Nuh).
- 6: the star, moon and sun (6:74-79), reasoning with his people or reflecting, as the commentators discuss.
- 10: the fish account read from 21:87-88 (labelled Al-Anbiya); a doorway to the Ark from Yunus (10:71-73).
- 12: "a little for sowing" (12:48) is interpretive; the short reading of 12:21-33 for young readers.
- 18: the player mends the wall (18:77; in the ayah it is al-Khidr), labelled as an adaptation; 18:109 moved out of the Musa reading.
- 19: one reading joins 19:48 and 19:96.
- 27: new reading order (Musa first).
- 3: the windy climb pushes the explorer back during gusts (3:200, patience); a child may read it as a bug.

## Not done, and limits

- **Multiplayer and accounts:** not built in the game code (the Supabase backend is parked), so nothing to verify; every world is solo.
- **Real devices and people:** no world was played on a real phone or tablet, or by a person. Phone emulation covered 5 worlds only.
- **Play-throughs:** 12 of 114 worlds; the other 102 had the fast validator (which checks every activity can be walked to) and the browser validator, not a full play.
- **10 Yunus and 28 Al-Qasas:** the voyage and the river chest need a person to play them; after leaving Yunus halfway the explorer came back 7.4 m away (the boat had moved on).
- **Minor:** boulders right beside a spot in 12, 18, 30 (spots still reachable); spawns 0.6-0.7 m from a solid in 2 and 94.
- The status board (`status-114.md`) was not regenerated: the recipes changed, so its recorded test hashes are now stale until it is re-run.

The full per-surah report is docs/WORLD-AUDIT.md (npm run worlds:report).

---
