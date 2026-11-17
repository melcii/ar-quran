#!/bin/bash
cd "$(dirname "$0")"
for w in ${PLAY:-19 3 12 18 20 11 27 9 28 64 6 10}; do W=$w timeout 4000 node play-world.js > out/p-$w.json 2> out/p-$w.err; done
echo done > out/play.done
