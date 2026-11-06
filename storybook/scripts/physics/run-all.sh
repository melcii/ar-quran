#!/bin/bash
# Every built world: the validator (audit, solids, slopes, edge, footpaths,
# activity spots, live checks) and a real-input walk of every footpath,
# activity spot and building on desktop; then the phone (touch stick) and
# frame-by-frame motion traces on a sample. JOBS worlds at a time (default 3).
cd "$(dirname "$0")"
mkdir -p out
one() {
  W=$1 DEV=desktop timeout 1500 node validate-world.js > out/v-$1-desktop.json 2> out/v-$1-desktop.err
  [ "$1" = ark ] || W=$1 DEV=desktop TOUR_MIN=${TOUR_MIN:-6} timeout 3000 node walk-paths.js > out/w-$1-desktop.json 2> out/w-$1-desktop.err
}
export -f one
echo ${WORLDS:-ark $(seq 1 10) $(seq 12 39)} | tr ' ' '\n' | xargs -P ${JOBS:-3} -I{} bash -c 'one {}'
for w in ${PHONE:-1 7 19 20 39}; do
  W=$w DEV=phone timeout 3000 node walk-paths.js > out/w-$w-phone.json 2> out/w-$w-phone.err
  W=$w DEV=phone timeout 1500 node validate-world.js > out/v-$w-phone.json 2> out/v-$w-phone.err
  W=$w FRAMES=j60 SIZE=480x320 timeout 2400 node motion-trace.js > out/t-$w-j60.json 2> out/t-$w-j60.err
done
W=ark DEV=phone timeout 1500 node validate-world.js > out/v-ark-phone.json 2> out/v-ark-phone.err
echo done
