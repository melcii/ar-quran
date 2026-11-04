#!/usr/bin/env python3
"""Writes content/worlds/compose.json: the composed worlds of the longer surahs.

Each world lists landmarks ("places": a piece from src/world/scenes/compose/
pieces.tsx at a designed area) and hands-on activities ("acts": a template from
acts.tsx). Pieces show land, water, sky, plants, animals and things people
make; never a person, a prophet, an angel, Allah or the unseen. Run
scripts/apply-compose.py afterwards to update the design records.
"""
import json, pathlib

def P(area, piece, dx=None, dz=None, r=0.0, s=1.0, **o):
    d = {"area": area, "piece": piece, "r": r, "s": s, "o": o}
    if dx is not None: d["dx"] = dx
    if dz is not None: d["dz"] = dz
    return d

def A(name, ref, area, mech, quote, desc, **k):
    return {"name": name, "ref": ref, "area": area, "mech": mech, "quote": quote, "desc": desc, **k}

FAR = dict(dx=-16, dz=-20)

W = {}
W[2] = dict(setting="meadow", concept="A green valley of guidance: an orchard where hidden things are found by name (2:31), a meadow of cows (2:67), great foundation stones (2:127), a river to cross (2:249) and a field where one seed grows seven spikes (2:261).",
  places=[P("Garden of Names", "orchard", -7, -5), P("Meadow of the Cow", "herd", 6, -5, kinds=["cow", "cow", "cow"]), P("Foundations of the House", "foundations", -7, -6),
          P("River Crossing", "river", 6, -6, r=1.4), P("Field of Seven Spikes", "grain", -7, -5)],
  acts=[A("Find the names", "2:31", "Garden of Names", "tap", "2:31", "Find five glowing things hidden in the orchard.", n=5),
        A("Lay the foundations", "2:127", "Foundations of the House", "carry", "2:127", "Carry four great stones to the foundations.", item="block", n=4),
        A("Plant the seed of charity", "2:261", "Field of Seven Spikes", "plant", "2:261", "Plant three seeds; each one grows seven spikes of grain.", grow="grain", n=3)])
W[3] = dict(setting="morning", concept="A sanctuary in morning light: a small chamber with fruit in a lit niche, no one shown (3:37), a courtyard of pillars bound by one rope (3:103), a rooftop where a sundial marks the turning of night and day (3:190) and a distant gateway (3:96).",
  places=[P("The Prayer Chamber", "chamber", 6, -5, fruit=True), P("Courtyard of the Rope", "rope", -7, -5), P("Rooftop of Night and Day", "sundial", 6, -5), P("Gate to Bakkah", "arch", 4, -16, s=1.4)],
  acts=[A("Hold the rope together", "3:103", "Courtyard of the Rope", "carry", "3:103", "Carry four stones to the circle so the pillars stand together.", item="stone", n=4, label="together")])
W[4] = dict(setting="morning", concept="A village of trusts and justice: a square with one fountain from which channels run (4:1), houses waiting for what was lent to come back (4:58), a lane of neighbours (4:36) and tall scales (4:135).",
  places=[P("Square of One Soul", "spring", 6, -5), P("House of Trusts", "village", -8, -6, n=3), P("Neighbours' Lane", "village", 7, -7, n=4), P("Scales of Justice", "scale", 6, -5, s=1.6)],
  acts=[A("Return the trusts", "4:58", "House of Trusts", "carry", "4:58", "Carry four chests back to the house they belong to.", item="chest", n=4, label="trusts")])
W[5] = dict(setting="garden", concept="A hall of promises (5:1), an olive grove where a crow scratches the ground (5:31), one lantern that lights a whole hall (5:32) and a long table under an arch, spread and empty (5:114).",
  places=[P("Hall of Contracts", "hall", 7, -7), P("Grove of the Crow", "olives", -7, -6), P("Grove of the Crow", "crow", 3, -3), P("Lantern of One Life", "lantern", 5, -5), P("Arch of the Table", "table", -6, -5)],
  acts=[A("Help each other", "5:2", "Hall of Contracts", "carry", "5:2", "Carry baskets of food to the hall to share.", item="basket", n=4, label="share", dx=-1, dz=1)])
W[6] = dict(setting="dawn", concept="A night of signs turning to dawn: a ridge where a bright star sets (6:76), a plain where the moon rises (6:77), an overlook at sunrise (6:78), a valley where seeds split and sprout (6:95) and date palms with low clusters (6:99).",
  places=[P("Ridge of the Star", "mountain", **FAR), P("Ridge of the Star", "constellation", 0, 0, one=True), P("Moon Rise Plain", "disc", 0, 0, color="#f2eee0", radius=5),
          P("Sunrise Overlook", "horizon", 0, 0), P("Valley of Seeds", "grain", -7, -5), P("Palm Clusters", "palms", 6, -6, dates=True, n=5)],
  acts=[A("Split the seed", "6:95", "Valley of Seeds", "plant", "6:95", "Plant three seeds and watch each split and sprout.", grow="shoot", n=3)])
W[7] = dict(setting="mountain", concept="The heights: a garden with one tree (7:19), timbers of a ship on a hill (7:64), wide windy plains (7:65), homes carved in cliffs (7:74), a market where weights must be fair (7:85) and a calm shore (7:138).",
  places=[P("Garden of the Tree", "tree", 6, -6), P("Hill of the Ship", "ark", 9, -10, ridge=True), P("Plains of 'Aad", "wind", 0, -4), P("Carved Cliffs", "carved", 2, -12),
          P("Market of Madyan", "market", -8, -6), P("Seashore", "sea", 8, -8)],
  acts=[A("Fair weights", "7:85", "Market of Madyan", "carry", "7:85", "Carry the brass weights to the scale, giving full measure.", item="weight", n=4, label="full measure")])
W[8] = dict(setting="wind", concept="A field where rain falls and the sand grows firm (8:11), a circle of stones that glows (8:2) and a green hill of peace (8:61).",
  places=[P("Circle of Hearts", "stones", 6, -5, glow=True), P("Hill of Peace", "mountain", 14, -16, color="#7aa055", h=6, n=2)],
  acts=[A("Walk on firm ground", "8:11", "Field of Rain", "rain", "8:11", "Carry rain clouds over the dry sand; the ground turns firm and green.", n=3)])
W[9] = dict(setting="desert-dusk", concept="A small empty cave in the hills (9:40), a simple mosque on firm foundations (9:108-109) and a circle of stones for learning (9:122).",
  places=[P("Cave of Two", "cave", 9, -12), P("Mosque of Righteousness", "mosque", -8, -7), P("Circle of Learning", "stones", 6, -5, n=7)],
  acts=[A("Firm foundations", "9:109", "Mosque of Righteousness", "carry", "9:109", "Carry four foundation stones to build on firm ground.", item="block", n=4)])
W[10] = dict(setting="sea", concept="A terrace of the moon's phases for counting the months (10:5), a ship at sea (10:22), a garden in the rain (10:24) and a doorway to Yunus's story (10:98).",
  places=[P("Moon Phase Terrace", "moons", -7, -6), P("Storm at Sea", "ships", 8, -9), P("Garden of Rain", "orchard", 6, -6), P("Garden of Rain", "cloud", 6, -6, rain=True, w=8),
          P("Doorway of Yunus", "arch", 6, -6)],
  acts=[A("Count the months", "10:5", "Moon Phase Terrace", "order", "10:5", "Lay five numbered stones in order, counting as the moon does.", n=5)])
W[13] = dict(setting="storm", concept="The valley of thunder: rivers running between mountains (13:3), neighbouring plots growing different fruits from one water (13:4), a ridge and a rocky hall under thunder clouds (13:12-13) and a pool where foam drifts away (13:17).",
  places=[P("Rivers between Mountains", "mountain", **FAR), P("Rivers between Mountains", "river", 6, -6), P("Neighbouring Plots", "orchard", -8, -6), P("Lightning Ridge", "mountain", 14, -16, h=7),
          P("Thunder Hall", "cave", 9, -12), P("Thunder Hall", "cloud", 0, -10, dark=0.7, w=14, h=12), P("Foam Pool", "spring", 6, -5)],
  acts=[A("One water, many fruits", "13:4", "Neighbouring Plots", "plant", "13:4", "Plant three young trees side by side; they grow from the same water.", grow="tree", n=3)])
W[14] = dict(setting="orchard", concept="A good tree with deep roots and high branches (14:24), an uprooted tree lying loose (14:26), a dry valley (14:37) and a river with sailing boats (14:32).",
  places=[P("The Good Tree", "tree", -7, -6, roots=True), P("Uprooted Tree", "fallen", 6, -5, n=1), P("Uncultivated Valley", "mountain", 12, -14, color="#c8a878", h=6), P("River of Ships", "ships", 8, -8, n=2)],
  acts=[A("Good words grow", "14:24", "The Good Tree", "plant", "14:24", "Plant three saplings; each grows into a firm tree.", grow="tree", n=3, item="sapling")])
W[15] = dict(setting="stars", night=True, concept="A rocky tract under the stars: constellations (15:16), firm mountains (15:19), winds carrying pollen to flowers (15:22) and empty homes carved in the cliffs (15:82).",
  places=[P("Sky of Constellations", "constellation", 0, 0), P("Firm Mountains", "mountain", **FAR), P("Fertilizing Winds", "wind", 0, -4), P("Carved Homes", "carved", 2, -12)],
  acts=[A("Find the constellations", "15:16", "Sky of Constellations", "tap", "15:16", "Find five bright stars low over the rocks.", item="star", n=5),
        A("Carry the pollen", "15:22", "Fertilizing Winds", "plant", "15:22", "Carry pollen to three bare beds; they flower.", grow="flowers", n=3)])
W[17] = dict(setting="light", night=True, concept="A path of lamps through the night (17:1: nothing of the journey is depicted), two signs, the sun and the moon (17:12), a family courtyard (17:23) and a market with honest scales (17:35).",
  places=[P("Path of Lamps", "lamps", 5, -3, n=6), P("Two Signs", "sunMoon", 6, -5), P("Courtyard of Parents", "house", 6, -5), P("Full Measure Market", "market", -8, -6)],
  acts=[A("Honest measure", "17:35", "Full Measure Market", "carry", "17:35", "Carry the weights to the scale and give full measure.", item="weight", n=4, label="full measure")])
W[19] = dict(setting="dawn", concept="A quiet chamber (19:11), a tall palm in a remote place (19:23) with a stream below it (19:24) and ripe dates (19:25), and a mountain slope (19:52). No one is shown.",
  places=[P("Prayer Chamber", "chamber", 6, -5), P("The Palm Tree", "palms", 6, -6, n=1, dates=True), P("The Stream", "river", 6, -6, r=0.4), P("Ripe Dates", "palms", -7, -6, n=3, dates=True), P("The Mount", "mountain", **FAR)],
  acts=[A("The palm and the stream", "19:24-26", "Ripe Dates", "tap", "19:25", "Find five ripe dates fallen under the palms.", item="fruit", n=5)])
W[20] = dict(setting="night", night=True, concept="A fire glowing far across a dark valley (20:10), a pair of sandals left at the valley's edge (20:12, an adaptation), a chest in the reeds (20:39), a dry path between walls of water (20:77) and an empty camp (20:88). Musa and every person are never shown; no idol is pictured.",
  places=[P("The Distant Fire", "fire", 6, -16, s=1.4), P("Valley of Tuwa", "sandals", 2.5, -1.5), P("The River and the Chest", "chest", 6, -6), P("Dry Path Through the Sea", "seaPath", 9, -6), P("Camp of the Calf", "tents", -8, -6)],
  acts=[A("Follow the firelight", "20:10", "The Distant Fire", "order", "20:10", "Lay five numbered stepping stones toward the distant fire.", n=5)])
W[21] = dict(setting="sea", concept="Rooms of signs: a spring (21:30), an empty ring of stones where the fire was made cool (21:69; no fire or person is shown), mountains with birds (21:79), a sail full of wind (21:81) and a dark sea at night (21:87).",
  places=[P("Joined Heavens and Earth", "spring", 6, -5), P("Room of the Cool Fire", "stones", 6, -5, n=6), P("Room of Mountains and Birds", "mountain", **FAR), P("Room of Mountains and Birds", "birds", 0, -6),
          P("Room of the Wind", "ships", 8, -8), P("Room of the Darknesses", "sea", 7, -7, color="#16324a")],
  acts=[A("The orbits", "21:33", "Joined Heavens and Earth", "tap", "21:33", "Find four bright lights floating over the spring.", item="star", n=4)])
W[22] = dict(setting="dawn", concept="Roads from far mountain passes with camels (22:27), simple foundations (22:26), dry fields that turn green as rain falls (22:63) and a slope where plants stir (22:5).",
  places=[P("Roads from Every Pass", "mountain", **FAR), P("Roads from Every Pass", "herd", 6, -6, kinds=["camel", "camel", "camel"]), P("Foundations of the House", "foundations", 6, -6), P("Stages of Growth", "shoot", 5, -4)],
  acts=[A("Rain on the hills", "22:63", "Greening Fields", "rain", "22:63", "Carry rain clouds over three dry fields; they turn green.", n=3),
        A("Pack for the journey", "22:27-28", "Roads from Every Pass", "carry", "22:27", "Pack four sacks for the journey.", item="sack", n=4, dx=-12)])
W[23] = dict(setting="orchard", concept="Terraces of the successful believers: a quiet stepped terrace (23:2-3), rain held in great basins (23:18), palms and vines (23:19), a great olive tree (23:20) and an empty shipyard (23:27).",
  places=[P("Terrace of Humble Prayer", "steps", 6, -3), P("Terrace of Turning from Idle Talk", "stones", 6, -5), P("Measured Rain Reservoir", "bowls", -8, -6), P("Palms and Vines", "palms", 6, -6), P("Palms and Vines", "vine", -6, -5),
          P("Olive Tree of Sinai", "olives", 6, -6, n=1), P("Shipyard", "ark", 7, -7, frame=True)],
  acts=[A("Fill the reservoir", "23:18", "Measured Rain Reservoir", "carry", "23:18", "Carry four jars of rain water to the basins.", item="jar", n=4)])
W[24] = dict(setting="light", night=True, concept="Doors that open after greeting (24:27), a glass lamp in a niche like a bright star (24:35), a blessed olive grove (24:35), a mirage plain (24:39), a dark sea (24:40) and birds with spread wings (24:41).",
  places=[P("Doors of Permission", "village", 7, -7, n=2, lit=True), P("The Lamp in the Niche", "niche", 7, -8), P("Blessed Olive Grove", "olives", 6, -6), P("Mirage Plain", "dunes", 10, -12),
          P("Sea of Darknesses", "sea", 7, -7, color="#16324a"), P("Birds with Spread Wings", "birds", 0, -6, h=7)],
  acts=[A("Layers of light", "24:35", "The Lamp in the Niche", "carry", "24:35", "Carry three lamps to the niche: light upon light.", item="lamp", n=3, label="the niche", dx=-2)])
W[25] = dict(setting="morning", concept="A sundial field where shadows move with the sun (25:45), winds driving clouds (25:48), two waters side by side with a barrier (25:53), the sun and the moon (25:61) and a gentle path (25:63).",
  places=[P("Field of Shadows", "sundial", 6, -5), P("Winds of Good Tidings", "wind", -4, -6), P("Two Seas and a Barrier", "twoSeas", 6, -5), P("Sky Lamp", "sunMoon", 6, -5), P("Path of Gentle Walking", "steps", 5, -3)],
  acts=[A("Bring the rain", "25:48", "Winds of Good Tidings", "rain", "25:48", "Carry rain clouds over three dry fields.", n=3)])
W[26] = dict(setting="sea", concept="Seven shores: towering walls of water either side of a path (26:63), a meadow of many noble kinds (26:7), rock-cut homes, empty (26:149) and a thicket by a market with scales (26:176-183).",
  places=[P("Towering Waves", "seaPath", 9, -6), P("Earth of Noble Kinds", "orchard", -8, -6), P("Homes in the Mountains", "carved", 2, -12), P("Thicket of Madyan", "olives", -7, -7), P("Thicket of Madyan", "market", 9, -9)],
  acts=[A("Noble kinds", "26:7", "Earth of Noble Kinds", "plant", "26:7", "Plant three beds; each blooms with a different kind.", grow="flowers", n=3),
        A("Full measure", "26:181-183", "Thicket of Madyan", "carry", "26:181", "Carry the weights to the scale and give full measure.", item="weight", n=4, label="full measure", dx=-12)])
W[28] = dict(setting="desert-dusk", concept="Reeds and calm water (28:7), the well of Madyan with flocks waiting (28:23), a tree's shade (28:24), a fire seen from the road (28:29) and a treasure house sinking into the ground (28:81).",
  places=[P("The River", "river", 6, -6, r=1.2), P("Well of Madyan", "well", -6, -5), P("Well of Madyan", "herd", -8, -9, kinds=["sheep", "sheep", "goat", "sheep"]), P("The Shade", "tree", 6, -5, shade=True),
          P("Fire on the Mount", "mountain", **FAR), P("Fire on the Mount", "fire", 8, -14), P("Swallowed Treasure House", "sunken", 8, -8)],
  acts=[A("Water the flock", "28:23-24", "Well of Madyan", "carry", "28:24", "Carry four jars from the well to the trough for the waiting flocks.", item="jar", n=4, label="trough")])
W[29] = dict(setting="garden", concept="A huge, fine spider's web (29:41), a road through many landscapes (29:20) and an ark resting on a ridge as a sign (29:15).",
  places=[P("The Spider's Web", "web", 6, -5), P("Road of Reflection", "steps", 5, -3, n=10), P("Road of Reflection", "mountain", **FAR), P("Ark on the Ridge", "ark", 10, -12, ridge=True)],
  acts=[A("Observe creation", "29:20", "Road of Reflection", "tap", "29:20", "Find five glowing things along the road.", n=5, dx=-8)])
W[30] = dict(setting="creation", concept="A market of many languages (30:22), a harbour with ships on good winds (30:46), clouds that spread and break into rain (30:48) and bare land returning to green (30:50).",
  places=[P("Market of Languages", "market", 7, -6), P("Harbour of Winds", "ships", -10, -10, n=2), P("Spreading Clouds", "cloud", 0, -8, rain=True, w=12)],
  acts=[A("Wind and rain", "30:48-50", "Earth Revived", "rain", "30:50", "Carry rain clouds over the bare land; it turns green.", n=3)])
W[31] = dict(setting="garden", concept="A great rock with a tiny seed beside it (31:16), a path for walking gently (31:19) and a shore with trees and a pen (31:27).",
  places=[P("The Rock and the Mustard Seed", "rockSeed", -7, -5), P("Path of Moderate Pace", "steps", 5, -3), P("Sea of Ink", "sea", 8, -8), P("Sea of Ink", "pen", 4, -4), P("Sea of Ink", "olives", -8, -6)],
  acts=[A("Find the seed", "31:16", "The Rock and the Mustard Seed", "tap", "31:16", "Find three tiny seeds hidden around the rock.", item="seed", n=3)])
W[32] = dict(setting="night", night=True, concept="A riverbank of clay (32:7), a village with lamps at night (32:16) and dry land receiving water (32:27).",
  places=[P("Clay Bank", "clay", 6, -5), P("Night Prayer Village", "village", 7, -7, lit=True)],
  acts=[A("Water the plain", "32:27", "Barren Land", "rain", "32:27", "Carry rain clouds to the dry plain.", n=3)])
W[33] = dict(setting="wind", concept="Wind sweeping through empty tents (33:9) and mountains that stand for the trust (33:72, symbolic).",
  places=[P("The Windy Plain", "tents", 7, -7, windy=True), P("The Windy Plain", "wind", 0, -4), P("Mountains of the Trust", "mountain", **FAR, snow=True)],
  acts=[A("Qualities wall", "33:35", "Mountains of the Trust", "carry", "33:35", "Carry five stones to build a wall of good qualities.", item="stone", n=5)])
W[34] = dict(setting="orchard", concept="Hills that echo with praise and birds (34:10), a glowing spring of copper (34:12), great basins (34:13), gardens on both sides of a dam (34:15) and a broken one where the trees fell (34:16).",
  places=[P("Mountains of Praise", "mountain", **FAR), P("Mountains of Praise", "birds", 0, -6), P("Copper Spring", "copper", 6, -5), P("Great Bowls", "bowls", -8, -6), P("Gardens of Saba", "dam", 0, -14), P("Flood of the Dam", "fallen", 6, -5)],
  acts=[A("Work in gratitude", "34:13", "Great Bowls", "carry", "34:13", "Carry four jars to fill the great basins.", item="jar", n=4)])
W[35] = dict(setting="morning", concept="Mountains streaked white, red and black (35:27), orchards in many colours (35:27) and two seas, fresh and salt, with pearls (35:12).",
  places=[P("Streaked Mountains", "streaked", 12, -14), P("Orchards of Many Colours", "orchard", -8, -6), P("Two Seas", "twoSeas", -7, -5)],
  acts=[A("Colour hunt", "35:27-28", "Orchards of Many Colours", "tap", "35:27", "Find five fruits fallen in the orchard.", item="fruit", n=5),
        A("Pearl diving", "35:12", "Two Seas", "tap", "35:12", "Find four pearls by the two seas.", item="pearl", n=4)])
W[36] = dict(setting="moon", night=True, concept="Dead earth that bursts with grain (36:33), palms and springs (36:34), the moon's phases (36:39), a laden ship (36:41) and a green tree with a fire (36:80).",
  places=[P("Dead Earth Alive", "grain", 6, -5), P("Gardens and Springs", "palms", 6, -6), P("Gardens and Springs", "spring", -6, -5), P("Phases of the Moon", "moons", -7, -6), P("Laden Ship", "ships", 8, -8, cargo=True),
          P("Green Tree Fire", "tree", 6, -6), P("Green Tree Fire", "fire", 4, -3)],
  acts=[A("Moon phases", "36:39", "Phases of the Moon", "order", "36:39", "Lay five numbered stones in order, as the moon passes through its stages.", n=5),
        A("Pairs", "36:36", "Dead Earth Alive", "pairs", "36:36", "Bring the animals to their pens in pairs.", kinds=["sheep", "camel", "cow"], dx=-12)])
W[37] = dict(setting="sea", concept="A sky adorned with stars (37:6), an open shore (37:145) and a gourd vine over a shady spot (37:146).",
  places=[P("Adorned Sky", "constellation", 0, 0), P("Open Shore", "sea", 7, -7)],
  acts=[A("Grow the vine", "37:146", "Gourd Vine", "plant", "37:146", "Plant three cuttings; a gourd vine grows over each.", grow="vine", n=3)])
W[38] = dict(setting="mountain", concept="Hills that echo at sunrise (38:18), birds gathering (38:19) and a cool spring (38:42).",
  places=[P("Hills of Praise", "mountain", **FAR), P("Assembled Birds", "birds", 0, -6), P("Cool Spring", "spring", 6, -5)],
  acts=[A("Gather the birds", "38:19", "Assembled Birds", "carry", "38:19", "Bring four birds to gather together.", item="animal:bird", n=4, label="assembled")])
W[39] = dict(setting="wind", concept="Rain running underground into springs (39:21), crops that grow, turn yellow and dry (39:21) and a soft light on the horizon (39:73; nothing of Paradise is pictured).",
  places=[P("Rain to Springs", "spring", 6, -5), P("Fading Crops", "grain", 6, -5, dry=True), P("Gates of Light", "horizon", 0, 0)],
  acts=[A("Water cycle", "39:21", "Rain to Springs", "rain", "39:21", "Carry rain clouds over the fields.", n=3, dx=-12)])
W[40] = dict(setting="desert-dusk", concept="A brick tower that stops far short of the sky (40:36-37) and a simple house (40:28). No one is shown.",
  places=[P("Unfinished Tower", "tower", 8, -9), P("House of the Believer", "house", 6, -5), P("House of the Believer", "herd", -8, -6, kinds=["camel", "horse", "sheep", "sheep"])],
  acts=[A("The grazing animals", "40:79", "House of the Believer", "pairs", "40:79", "Bring the animals to their pens in pairs.", kinds=["camel", "horse", "sheep"], dx=-12)])
W[41] = dict(setting="wind", concept="A sky of drifting mist (41:11), a still dry plain (41:39) that stirs and sprouts when rain falls (41:39).",
  places=[P("Heaven as Smoke", "cloud", 0, -8, w=16, h=12, dark=0.2), P("Stilled Earth", "grain", 6, -5, dry=True)],
  acts=[A("Rain and growth", "41:39", "Quivering Growth", "rain", "41:39", "Carry rain clouds to the still earth; it stirs and grows.", n=3)])
W[42] = dict(setting="sea", concept="A harbour of ships like mountains (42:32), ships lying still when the wind stops (42:33) and a circle of seats for deciding together (42:38).",
  places=[P("Harbour of Mountain Ships", "ships", 9, -12, big=True), P("Stilled Wind", "ships", 8, -9, still=True, n=2), P("Council Circle", "council", -7, -5)],
  acts=[A("Decide together", "42:38", "Council Circle", "carry", "42:38", "Carry baskets to the circle to share what was provided.", item="basket", n=4, label="share")])
W[43] = dict(setting="meadow", concept="Roads across the earth (43:10), rain in measure reviving dead land (43:11), and ships and animals to ride (43:12).",
  places=[P("Roads of Guidance", "steps", 5, -3, n=10), P("Ships and Mounts", "ships", 9, -10), P("Ships and Mounts", "herd", -8, -6, kinds=["camel", "horse", "camel"])],
  acts=[A("Rain in measure", "43:11", "Rain in Measure", "rain", "43:11", "Carry rain clouds to revive the dead land.", n=3)])
W[44] = dict(setting="night", night=True, concept="A calm blessed night (44:3), a sea lying still (44:24) and gardens and springs left behind (44:25).",
  places=[P("Blessed Night", "constellation", 0, 0), P("Blessed Night", "disc", 0, 0, color="#f2eee0", radius=5), P("The Still Sea", "sea", 7, -7), P("Left-behind Gardens", "orchard", 6, -6), P("Left-behind Gardens", "spring", -6, -5)],
  acts=[A("Gardens and springs", "44:25", "Left-behind Gardens", "tap", "44:25", "Find four fruits still lying in the empty gardens.", item="fruit", n=4, dx=-8)])
W[45] = dict(setting="sea", concept="Ships sailing (45:12) and a wide view of sky and land, with birds and grazing animals (45:13).",
  places=[P("Sea of Ships", "ships", 8, -9, n=2), P("Everything Subjected", "horizon", 0, 0), P("Everything Subjected", "birds", 0, -6), P("Everything Subjected", "herd", -8, -6)],
  acts=[A("Winds", "45:5", "Everything Subjected", "rain", "45:5", "Carry rain clouds to the dry land.", n=3)])
W[46] = dict(setting="dunes", concept="Wind-curved dunes (46:21), a cloud approaching the valleys (46:24) and a quiet night valley with standing stones (46:29; nothing unseen is shown).",
  places=[P("Dunes of Al-Ahqaf", "dunes", 8, -10), P("The Approaching Cloud", "cloud", 0, -10, w=14, h=11, dark=0.6), P("Listening Valley", "stones", 6, -5, n=6)],
  acts=[A("Kindness to parents", "46:15", "Dunes of Al-Ahqaf", "carry", "46:15", "Carry water jars home for your parents.", item="jar", n=3, label="for parents", dx=-12)])
W[47] = dict(setting="garden", concept="A reading stand with the ayah that describes rivers (47:15; the rivers themselves are not pictured), a quiet garden and stepping stones for steady feet (47:7).",
  places=[P("Rivers Described", "lectern", 3, -3), P("Rivers Described", "orchard", -8, -7), P("Rivers Described", "spring", 7, -9)],
  acts=[A("Good deeds", "47:7", "Rivers Described", "order", "47:7", "Lay five numbered stones in order: feet planted firmly.", n=5, dx=-9)])
W[48] = dict(setting="meadow", concept="A single tree on a plain, no one shown (48:18), and a shoot growing strong on its stalk (48:29).",
  places=[P("The Tree", "tree", 6, -6), P("Growing Shoot", "shoot", -5, -4)],
  acts=[A("Grow the shoot", "48:29", "Growing Shoot", "plant", "48:29", "Plant three seeds; each sends out a shoot that grows strong.", grow="shoot", n=3)])
W[50] = dict(setting="orchard", concept="A sky without rifts (50:6), mountains and beautiful plants (50:7), blessed rain over grain (50:9) and lofty palms with layered fruit (50:10).",
  places=[P("Sky Without Rifts", "horizon", 0, 0), P("Mountains and Beautiful Kinds", "mountain", **FAR), P("Mountains and Beautiful Kinds", "orchard", 6, -6), P("Blessed Rain", "cloud", 0, -8, rain=True), P("Lofty Palms", "palms", 6, -6, dates=True, n=5)],
  acts=[A("Harvest", "50:9-11", "Blessed Rain", "plant", "50:9", "Plant three seeds of grain; the rain makes them grow.", grow="grain", n=3)])
W[51] = dict(setting="wind", concept="Winds scattering dust (51:1), clouds heavy with water (51:2), ships sailing easily (51:3) and a wide sky (51:47).",
  places=[P("Scattering Winds", "wind", 0, -4), P("Laden Clouds", "cloud", 0, -8, dark=0.5, w=12), P("Easy Ships", "ships", 8, -9), P("Expanding Heaven", "horizon", 0, 0)],
  acts=[A("Pairs", "51:49", "Scattering Winds", "pairs", "51:49", "Bring the animals to their pens in pairs.", kinds=["sheep", "goat", "camel"])])
W[52] = dict(setting="mountain", concept="A lone mountain (52:1), an open scroll on a stone (52:3) and a high sky (52:5).",
  places=[P("The Mount", "mountain", 12, -16, n=1, h=12, snow=True), P("Parchment Spread Open", "scroll", 6, -4), P("Raised Heaven", "birds", 0, -6)],
  acts=[A("Oaths path", "52:1-6", "The Mount", "order", "52:1", "Lay six numbered stones in order, one for each of the first six ayahs.", n=6, dx=-9)])
W[53] = dict(setting="stars", night=True, concept="A star setting (53:1), a valley of sunshine and soft rain, standing for joy and tears (53:43; no faces) and the bright star Sirius (53:49).",
  places=[P("Descending Star", "constellation", 0, 0, one=True, seed=5), P("Laughter and Tears", "cloud", 0, -8, rain=True, w=8), P("Sirius", "mountain", **FAR)],
  acts=[A("Find Sirius", "53:49", "Sirius", "tap", "53:49", "Find the brightest star low over the hills.", item="star", n=1)])
W[54] = dict(setting="moon", night=True, concept="A full moon over the plain (54:1; the splitting itself is not pictured), pouring rain (54:11), springs bursting from the earth (54:12), a vessel of planks being built (54:13) and palms uprooted by the wind (54:20).",
  places=[P("Split Moon", "disc", 0, 0, color="#f2eee0", radius=6), P("Gates of Rain", "cloud", 0, -8, rain=True, dark=0.6, w=12), P("Springs Bursting", "spring", 6, -5), P("Vessel of Planks", "ark", 8, -9, frame=True), P("Uprooted Palms", "fallen", 6, -5)],
  acts=[A("Planks and nails", "54:13", "Vessel of Planks", "carry", "54:13", "Carry four planks to the vessel being built.", item="plank", n=4)])
W[56] = dict(setting="meadow", concept="A field where seeds are planted (56:63), rain falling into a well (56:69) and a tree with a fire for travellers (56:72).",
  places=[P("Water from the Clouds", "well", -6, -5), P("Water from the Clouds", "cloud", 0, -8, rain=True), P("Tree of Fire", "tree", 6, -6), P("Tree of Fire", "fire", 3.5, -3)],
  acts=[A("Who grows it?", "56:63-64", "Field of Seeds", "plant", "56:64", "Plant three seeds and watch them grow.", grow="grain", n=3),
        A("Fresh water", "56:68-70", "Water from the Clouds", "carry", "56:68", "Carry three jars of fresh water.", item="jar", n=3, label="fresh water")])
W[57] = dict(setting="garden", concept="A field that grows and turns yellow (57:20), a forge with iron (57:25) and earth returning to life (57:17).",
  places=[P("Passing Field", "grain", 6, -5, dry=True), P("The Forge", "forge", -7, -6)],
  acts=[A("Iron to the forge", "57:25", "The Forge", "carry", "57:25", "Carry four bars of iron to the forge.", item="iron", n=4),
        A("Revived earth", "57:17", "Revived Earth", "rain", "57:17", "Carry rain clouds to bring the earth back to life.", n=3)])
W[58] = dict(setting="morning", concept="An open hall where room is made for others (58:11), with seats in a circle and houses around.",
  places=[P("The Hall", "hall", -9, -8), P("The Hall", "council", 8, -10), P("The Hall", "village", -10, -18, n=3)],
  acts=[A("Make space", "58:11", "The Hall", "carry", "58:11", "Carry six cushions to make room in the circle.", item="seed", n=6, label="make room")])
W[59] = dict(setting="mountain", concept="A great mountain, humbled (59:21), and a reading stand with the ayahs of Allah's names (59:22-24; the names are read from the verified text, not drawn in the sky).",
  places=[P("Humbled Mountain", "mountain", 12, -16, n=1, h=12, snow=True), P("Names of Allah", "lectern", 3, -3)],
  acts=[A("Prefer others", "59:9", "Names of Allah", "carry", "59:9", "Carry four baskets to give to others first.", item="basket", n=4, label="for others", dx=-11)])
W[60] = dict(setting="garden", concept="A bridge over a stream for fair dealings (60:8) and a garden of hope (60:7).",
  places=[P("Bridge of Kindness", "bridge", -7, -6), P("Hope of Affection", "orchard", 6, -6)],
  acts=[A("Fair trade", "60:8", "Bridge of Kindness", "carry", "60:8", "Carry three baskets across, dealing fairly.", item="basket", n=3, label="fairly")])
W[61] = dict(setting="morning", concept="A wall of tightly joined stones (61:4).",
  places=[P("Firm Structure", "wall", -7, -7), P("Firm Structure", "village", 10, -14, n=3)],
  acts=[A("Build together", "61:4", "Firm Structure", "carry", "61:4", "Carry six stones to build one firm wall.", item="block", n=6)])
W[62] = dict(setting="morning", concept="Market stalls shut for the Friday prayer (62:9) and reopened afterwards (62:10).",
  places=[P("Market", "market", -8, -6, closed=True), P("Market", "mosque", 9, -12), P("After Prayer", "market", -8, -6)],
  acts=[A("Seek bounty", "62:10", "After Prayer", "carry", "62:10", "After the prayer, carry four baskets to the open stalls.", item="basket", n=4)])
W[63] = dict(setting="orchard", concept="Baskets of harvest to share before the time runs out (63:10).",
  places=[P("Harvest Baskets", "baskets", -6, -4), P("Harvest Baskets", "village", -9, -12, n=3), P("Harvest Baskets", "orchard", 9, -14)],
  acts=[A("Share now", "63:10", "Harvest Baskets", "carry", "63:10", "Carry four baskets to share now.", item="basket", n=4, label="share")])
W[64] = dict(setting="mountain", concept="A path of steps up a slope, where effort counts (64:16).",
  places=[P("Path of Effort", "steps", -4, -3, n=10, rise=0.12), P("Path of Effort", "mountain", **FAR)],
  acts=[A("Do your best", "64:16", "Path of Effort", "order", "64:16", "Lay six numbered stones in order, one step at a time.", n=6)])
W[65] = dict(setting="dunes", concept="A spring appearing in a dry place (65:3).",
  places=[P("Unexpected Spring", "spring", -6, -5), P("Unexpected Spring", "dunes", 10, -12), P("Unexpected Spring", "palms", -9, -10, n=3)],
  acts=[A("Find the spring", "65:2-3", "Unexpected Spring", "tap", "65:3", "Find three hidden springs of water in the dry land.", item="jar", n=3)])
W[66] = dict(setting="garden", concept="A palace room (66:11) and a quiet sanctuary with fruit in a lit niche (66:12). No one is shown.",
  places=[P("Palace Room", "chamber", 6, -5, color="#e8d8f0"), P("Sanctuary", "chamber", 6, -5, fruit=True)],
  acts=[A("Sincere repentance", "66:8", "Sanctuary", "plant", "66:8", "Plant three beds as a fresh start; they bloom.", grow="flowers", n=3, dx=-12)])
W[67] = dict(setting="morning", concept="A sky without flaw to look at again and again (67:3-4), slopes to walk (67:15) and birds with outspread wings (67:19).",
  places=[P("Seven Layers", "horizon", 0, 0), P("Look Again", "birds", 0, -6), P("Tame Earth", "steps", 5, -3, rise=0.1), P("Tame Earth", "mountain", **FAR), P("Outspread Wings", "birds", 0, -4, h=6)],
  acts=[A("Bird watch", "67:19", "Outspread Wings", "tap", "67:19", "Find five birds resting on the ground.", item="animal:bird", n=5),
        A("Walk the slopes", "67:15", "Tame Earth", "order", "67:15", "Lay five numbered stones up the slope.", n=5, dx=-9)])
W[68] = dict(setting="sea", concept="A pen and inkwell (68:1), a garden ready to harvest at dawn (68:17) and a garden that looks reaped (68:20).",
  places=[P("Pen", "pen", 4, -3), P("Garden at Dawn", "orchard", 6, -6), P("Ruined Garden", "fallen", 6, -5), P("Ruined Garden", "grain", -6, -5, dry=True)],
  acts=[A("Share the harvest", "68:17-24", "Garden at Dawn", "carry", "68:17", "Carry four baskets from the garden to share.", item="basket", n=4, label="share", dx=-12)])
W[69] = dict(setting="wind", concept="A windswept valley (69:6) with hollow palm trunks lying fallen (69:7).",
  places=[P("Windy Valley", "wind", 0, -4), P("Windy Valley", "mountain", **FAR), P("Hollow Trunks", "fallen", 6, -5, n=4)],
  acts=[A("Remember and listen", "69:12", "Windy Valley", "order", "69:12", "Lay five numbered stones in order through the valley.", n=5)])
W[70] = dict(setting="dawn", concept="Garden steps rising gently and a quiet place of steady prayer (70:23); nothing unseen is shown.",
  places=[P("Stairways", "steps", -4, -3, n=10, rise=0.1), P("Stairways", "stones", 7, -8), P("Stairways", "lamps", 4, -2, n=4)],
  acts=[A("Steady prayer", "70:23", "Stairways", "order", "70:23", "Lay five numbered stones in order, steady and constant.", n=5, dx=2)])
W[72] = dict(setting="stars", night=True, concept="A still desert under the stars (72:1) and shooting stars across the sky (72:8). Nothing unseen is shown.",
  places=[P("Listening Night", "dunes", 9, -11), P("Listening Night", "stones", 6, -5, n=6), P("Guarded Sky", "shootingStars", 0, 0)],
  acts=[A("Shooting stars", "72:8", "Guarded Sky", "tap", "72:8", "Find four bright stars low in the sky.", item="star", n=4)])
W[73] = dict(setting="night", night=True, concept="A dial of the night hours (73:2-4) and a reading stand for slow, measured recitation (73:4).",
  places=[P("Night Dial", "dial", 6, -5), P("Measured Recitation", "lectern", 3, -3), P("Measured Recitation", "village", -9, -12, lit=True, n=3)],
  acts=[A("Divide the night", "73:2-4", "Night Dial", "order", "73:4", "Lay four numbered stones in order, dividing the night.", n=4, dx=-9)])
W[74] = dict(setting="dawn", concept="Sunrise over a home (74:2) and a washing place with clean cloth (74:4).",
  places=[P("Dawn Rising", "house", 6, -5), P("Dawn Rising", "horizon", 0, 0), P("Purify Clothing", "basin", 5, -4)],
  acts=[A("Morning routine", "74:3-7", "Purify Clothing", "carry", "74:4", "Carry three jars of clean water to the washing place.", item="jar", n=3, label="wash", dx=-11)])
W[75] = dict(setting="garden", concept="A pattern of fingertip whorls in light on a stone (75:4).",
  places=[P("Fingertips", "fingerprint", 6, -5), P("Fingertips", "stones", -8, -7, n=6)],
  acts=[A("Fingerprint", "75:4", "Fingertips", "tap", "75:4", "Find four glowing whorls around the stone.", n=4, dx=-10)])
W[76] = dict(setting="morning", concept="An open doorway where food is shared (76:8).",
  places=[P("The Doorway", "house", -8, -6), P("The Doorway", "orchard", 9, -14)],
  acts=[A("Share the meal", "76:8-9", "The Doorway", "carry", "76:8", "Carry three loaves to the open door to share.", item="bread", n=3, label="to share")])
W[77] = dict(setting="wind", concept="Winds in gusts (77:1), the earth that holds (77:25) and mountains with sweet water (77:27).",
  places=[P("Gusts", "wind", 0, -4), P("Earth a Container", "clay", 6, -5), P("Mountains and Sweet Water", "mountain", **FAR), P("Mountains and Sweet Water", "spring", -6, -5)],
  acts=[A("Wind and water", "77:27", "Mountains and Sweet Water", "carry", "77:27", "Carry three jars of sweet water down from the spring.", item="jar", n=3, label="sweet water")])

out = pathlib.Path(__file__).resolve().parent.parent / "content/worlds/compose.json"
out.write_text(json.dumps({"note": "Composed worlds for the longer surahs (pieces and hands-on activities). Written by scripts/compose-specs.py; no person, prophet, angel, Allah or unseen reality is shown.", "worlds": {str(k): v for k, v in sorted(W.items())}}, ensure_ascii=False, indent=1) + "\n")
print(len(W), "worlds")
