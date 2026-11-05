# Physics checks

Serve a web build (`npx expo export -p web`, then any static server on port 8090), then:

- `W=7 DEV=desktop node validate-world.js` — the world's validator and live checks:
  - the missing-collider audit (every drawn part that stands on the ground taller than a step must have a collider under it; tree trunks are checked from where they were placed);
  - spawn, every solid pushed from eight sides, slopes, the edge;
  - every footpath walked end to end with the controller, both ways;
  - every activity spot open now has walkable ground within reach;
  - live: never inside a solid, never under the floor, camera never inside a solid, explorer scale constant, walk cycle never plays while standing, Return to safe ground keeps progress.
  `W=ark` for the Ark. `DEV=phone` emulates a Pixel 7.
- `W=19 DEV=phone node walk-paths.js` — walks every footpath and goes to every open activity spot with real input: the keyboard on desktop, real touch on the on-screen walking stick on the phone. Checks every frame for solids, sinking or floating, scale, the camera, jumps and getting stuck, and that the action button appears at each spot.
- `WORLDS="1 19 ark" node audit-worlds.js` — just the missing-collider audit, quickly, with each gap named by the nearest structure or activity.
- `node ark-checks.js` — giraffes board through the doorway under the lintel along a clear path, ramp rails hold, the door is shut while the ramp is raised, the floor lifts with the flood.
- `./run-all.sh` — all of the above for every built world on desktop and a sample on phone; results in `out/`.

Open any world with `?debug=colliders` to see the colliders: hand-made ones orange, ones read from drawn parts (activity props, rocks, gaps in structures) cyan, water and edge cells blue, the spawn white and every walker's capsule.

How drawn parts get colliders (src/physics/sceneSolids.ts, PropSolids.tsx): twice a second the parts drawn under the world's props group are read; any part standing on the ground taller than 0.55 m that no hand-made collider already holds becomes an upright circle or box. Plants, glows and flat marks are skipped; a group can opt out with `userData.noSolid`. A new world gets this for free; run the audit to confirm it.
