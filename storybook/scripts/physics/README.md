# Physics checks

Serve a web build (`npx expo export -p web`, then any static server on port 8090), then:

- `W=7 DEV=desktop node validate-world.js` — runs the world's validator (spawn, every solid pushed from eight sides, slopes, the edge) and live checks (never inside a solid, never under the floor, camera never inside a solid, explorer scale constant, walk cycle never plays while standing, Return to safe ground keeps progress). `W=ark` for the Ark. `DEV=phone` emulates a Pixel 7.
- `node ark-checks.js` — giraffes board through the doorway under the lintel along a clear path, ramp rails hold, the door is shut while the ramp is raised, the floor lifts with the flood.
- `./run-all.sh` — every built world on desktop and a sample on phone; results in `out/`.

Open any world with `?debug=colliders` to see the colliders (orange), water and edge cells (blue), the spawn (white) and every walker's capsule.
