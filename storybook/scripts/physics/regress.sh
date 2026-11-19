#!/bin/bash
# Browser regression for the world audit: the live validator on every world
# (desktop), full play-throughs (walk-reachability, save/resume, leaving the
# world) on PLAY worlds, the phone validator on PHONE worlds, then the Ark.
# Serve the web build on :8090 first. Results in out/.
cd "$(dirname "$0")"
mkdir -p out
v() { W=$1 DEV=${2:-desktop} timeout 1500 node validate-world.js > out/v-$1-${2:-desktop}.json 2> out/v-$1-${2:-desktop}.err; }
p() { W=$1 timeout 4000 node play-world.js > out/p-$1.json 2> out/p-$1.err; }
export -f v p
echo ${WORLDS:-$(seq 1 114)} | tr ' ' '\n' | xargs -P ${JOBS:-2} -I{} bash -c 'v {}'
for w in ${PHONE:-1 3 19 20 27}; do v $w phone; done
node ark-checks.js > out/ark-checks.json 2> out/ark-checks.err
v ark desktop

echo done > out/regress.done
