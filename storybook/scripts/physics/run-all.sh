#!/bin/bash
# Every built world: the validator (audit, solids, slopes, edge, footpaths,
# activity spots, live checks) and a real-input walk of every footpath and
# activity spot on desktop; then the phone (touch stick) on a sample.
cd "$(dirname "$0")"
mkdir -p out
val() { W=$1 DEV=$2 timeout 1500 node validate-world.js > out/v-$1-$2.json 2> out/v-$1-$2.err; }
walk() { W=$1 DEV=$2 timeout 2400 node walk-paths.js > out/w-$1-$2.json 2> out/w-$1-$2.err; }
list="${WORLDS:-ark $(seq 1 10) $(seq 12 39)}"
set -- $list
while [ $# -gt 0 ]; do
  val $1 desktop &
  [ -n "$2" ] && val $2 desktop &
  wait
  [ "$1" != ark ] && walk $1 desktop &
  [ -n "$2" ] && [ "$2" != ark ] && walk $2 desktop &
  wait
  shift; shift
done
for w in ${PHONE:-1 7 19 20 39}; do walk $w phone; val $w phone; done
val ark phone
echo done
