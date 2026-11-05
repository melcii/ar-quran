#!/bin/bash
# Validate every built world on desktop; a sample on the phone profile.
cd "$(dirname "$0")"
mkdir -p out
run() { W=$1 DEV=$2 timeout 1200 node validate-world.js > out/v-$1-$2.json 2> out/v-$1-$2.err; }
list="ark $(seq 1 10) $(seq 12 39)"
set -- $list
while [ $# -gt 0 ]; do
  run $1 desktop & 
  [ -n "$2" ] && run $2 desktop &
  wait
  shift; shift
done
for w in 1 7 20 39 ark; do run $w phone; done
echo done
