#!/usr/bin/env python3
"""Updates the design records and settings from content/worlds/compose.json."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
C = json.loads((root / "content/worlds/compose.json").read_text())["worlds"]
LBL = "artistic educational adaptation, not an event in the Quran"
TEST = "not tested yet: written and type-checked, not yet checked on screen"
sw_path = root / "content/worlds/surah-worlds.json"
sw = json.loads(sw_path.read_text())
for k, w in C.items():
    n = int(k)
    p = root / f"content/worlds/designs/{n:03d}.json"
    d = json.loads(p.read_text())
    d["environment_concept"] = w["concept"]
    for a in w["acts"]:
        found = next((x for x in d["activities"] if x["name"] == a["name"]), None)
        if found:
            found.update(kind="find", description=a["desc"], reference=a["ref"])
        else:
            d["activities"].append({"name": a["name"], "reference": a["ref"], "kind": "find", "description": a["desc"], "label": LBL})
    pieces = sorted({pl["piece"] for pl in w["places"]})
    d["status"]["playable_environment"] = f"first version built: a composed world ({', '.join(pieces)}) with {len(w['acts'])} hands-on activit{'y' if len(w['acts']) == 1 else 'ies'} in the scene"
    d["status"]["testing"] = TEST
    d["status"]["built_in"] = "content/worlds/compose.json, src/world/scenes/compose/, src/world/scenes/drag.tsx"
    d["status"]["tested_by"] = "automated screenshots of the scene and the in-scene activities"
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n")
    refs = sorted({a["reference"] for a in d["areas"] if any(pl["area"] == a["name"] for pl in w["places"] + w["acts"])} | {a["ref"] for a in w["acts"]}, key=lambda r: [int(x) for x in r.split(":")[1].split("-")[0:1]])
    for e in sw["worlds"]:
        if e["surah"] == n:
            e["setting"] = w["setting"]
            e["basis"] = w["concept"]
            e["references"] = refs
sw_path.write_text(json.dumps(sw, ensure_ascii=False, indent=1) + "\n")
print("updated", len(C))
