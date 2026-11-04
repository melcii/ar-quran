# Quran Storybook

An interactive, illustrated companion to the stories of the Quran for children aged 5 to 12. Children explore painted
scenes, tap objects to discover what the verses say, and open the original ayahs at any moment. The Quran text itself
is never changed, generated or paraphrased: the app only frames it.

"Quran Storybook" is a working title. The name and taglines live in `src/brand.ts` and `app.json`.

This is a prototype. The sample story has **not** been reviewed by a scholar yet, and the app says so on screen.

## The 3D world of the whole Quran (web)

On the web the whole app is one 3D world (`src/world/`). There are three places, joined by doorways and a short fade:

- **The reading room.** The Quran rests on a rehal. Any of the 114 surahs can be opened and read page by page. The
  pages are laid out from the verified Arabic (`pages.ts`): words are split only at the spaces already in the text,
  each ayah ends with its number, and the first page of a surah carries its name and the basmalah (none for At-Tawbah,
  and for Al-Fatihah it is ayah 1). Pages turn as a bending leaf with both faces drawn (`Book.tsx`, `useReader.ts`).
  There is ayah jump, previous and next surah, three Arabic sizes, bookmarks, and the Saheeh International
  translation of the ayahs on the open spread in a side panel labelled as a translation. The camera frames the pages
  in the part of the screen the controls leave free, so nothing is drawn over the Arabic. Arrow keys turn pages (left
  is the next page, as in an Arabic book). These are the app's own pages, not a copy of a printed mushaf layout.
- **The library.** A domed hall with all 114 surahs on the shelves in order (`Library.tsx`). Search by number or name,
  take a book down to see its details and progress, then read it or walk its world.
- **A world for every surah.** Each surah has a walkable landscape (`SurahWorld.tsx`) built from one of 19 symbolic
  settings: sea, cave, light, dunes, wind, night, stars, moon, storm, dawn, orchard and others, with the default a quiet
  garden. The choice for each surah, the reason and the ayahs it draws on are in `content/worlds/surah-worlds.json`;
  87 surahs use the garden, which takes nothing from the surah. Lanterns along the path hold the surah's passages in
  order (up to 12, all ayahs covered); opening one shows the verified Arabic and translation and can open the book at
  that ayah. Doorways lead back to the library, on to the next surah, and, in Yunus, Al-Anbiya and As-Saffat, to the
  Yunus story (`/yunus`, the earlier cinematic story). The "about this place" note marks every setting as an artistic
  choice, not a scene of events and not reviewed yet.

Graphics: physical sky, CC0 HDRI image lighting from Poly Haven (bundled through `@pmndrs/assets`), shadows, a water
shader with waves, fresnel and sun glint, noise terrain, instanced palms, trees, olives, rocks, swaying grass tufts and
flowers, fireflies, dust, sand and rain, fog per setting, and on medium and high quality bloom, vignette and ACES tone
mapping. Quality is low, medium or high, or auto, which starts from the device and steps down if frames drop.

Rules the worlds follow: no prophet or person is shown, nothing represents Allah, no event is staged as if it
happened there, and the scripture is only ever the stored text. The journal lists bookmarks and progress (surahs
opened, worlds visited, lanterns found); settings cover ambience and effects volume, quiet mode, reduced motion,
quality, Arabic size and the translation panel. There is no background music, and recitation is off until a licensed
recording is added (`content/audio/recitations.json`, `licensed: false`).

Limits, honestly:

- **Web only for now.** The native app still opens the 2D screens (`WorldApp.tsx`). The same scene should run on
  phones through `expo-gl` and `@react-three/fiber/native`, but that has not been built or tested on a device.
- **Tested only in a software-rendered browser** (headless Chromium with SwiftShader), at desktop and phone sizes.
  Frame rates on real phones and GPUs are unmeasured.
- **The worlds are symbolic, not story scenes.** Only Yunus has a story world. Dedicated, reviewed experiences for
  surahs such as Al-Fil, Yusuf and Al-Kahf are not built.
- **Every surah has a world design, but only on paper.** `content/worlds/designs/` holds one draft design record per
  surah (114), each area tied to an ayah and checked against the translation. None is built as its own playable
  world yet, and none is reviewed. Each surah's plaque in the library shows its five stages: verified text, approved
  content, world designed, playable world, tested.
- **The world system now reads those designs.** In each surah's world the lanterns are its planned places, in ayah
  order; each opens the place's description (labelled as art) with the verified ayah it comes from. The design's
  activities appear as labelled activity cards, progress is saved per place and activity, and finding every place
  unlocks a closing reflection (the draft summary and learning goals). The scenery itself is still the shared
  symbolic setting, and the activities are cards, not yet playable mini-games.
- **All 114 surahs have their own world (first versions).** 46 have a hand-built scene: Al-Fatihah (1), Hud (11, the ark), Yusuf (12), An-Nahl (16), Al-Kahf (18), An-Naml (27), Al-Hujurat (49), Ar-Rahman (55), Nuh (71), and all of Juz' Amma (78 to 114). The other 68 are *composed* worlds: each lists its own landmarks at its designed places and its hands-on activities in `content/worlds/compose.json` (written by `scripts/compose-specs.py`, applied to the design records by `scripts/apply-compose.py`), drawn from a shared library of about 70 rounded pieces (`src/world/scenes/compose/pieces.tsx`) and seven activity templates (`compose/acts.tsx`: carry, sort, plant, bring rain, lay stones in order, bring pairs, find). When an activity is finished, the hint quotes the verified translation of its ayah. Only Al-Baqarah (2) and Ta-Ha (20) of these 68 have been checked on screen so far; the rest are written but unchecked. Each has
  its own scenery placed at its designed places (`src/world/scenes/`) and two playable reading games from
  `src/world/ActivityGame.tsx`: put the ayahs in order, match each place to its ayah, or put the places in order. Some activities are played in the scene itself. Hands-on ones use `src/world/scenes/drag.tsx`: drag a thing (or tap it, then tap the glowing spot) to where it belongs. Lay the seven stones and water the garden (Al-Fatihah), fit the ark's planks and bring the animals aboard in pairs before the rain (Hud), follow the bee and bring the flock home (An-Nahl), carry the sheaves to the granaries (Yusuf), mend the wall and close the pass with iron (Al-Kahf), plant the garden (Ar-Rahman), bring rain to the dry fields and set the sun and moon (Nuh). Others are tapped: find the hoopoe (An-Naml), level the balance and find pearl and coral (Ar-Rahman), mend the bridge (Al-Hujurat), light the lanterns (Al-Falaq), set the table (Al-Ma'un), plant the seedlings (Az-Zalzalah), clear the path (Ash-Sharh) and fill the measure (Al-Mutaffifin). The games use only the
  verified text. Where a surah describes the Day of Judgement, the Fire, the Garden or the unseen, those are never pictured: the scenes show only the everyday things the surah points to (moths, wool, food, the sky, the mountains). Every scene's boxes, rocks, cones and cylinders are softened at load time (`src/three/soft.ts`) for a rounded storybook look. These worlds were checked only in headless Chromium with software WebGL, not on phones or real GPUs.
- **No Arabic vocabulary yet.** It needs a verified word-by-word source; nothing is generated by the app.
- **Nothing has had scholarly review**: not the worlds, not the story, not the explanations.
- All 3D shapes are made in code. The look is stylised, not photoreal.

## Nuh's Ark: the new-look vertical slice (`/ark`, web)

A single playable slice built to test the new art direction (organic, painterly, no blocks) before any other world is
redone. Code in `src/ark/`; open it at `/ark` or from the reading room's "Nuh's Ark: new-look preview" button.

- **Look.** A sculpted valley (`land.ts`, `Scenery.tsx`): rolling hills with painterly vertex colour and a brush
  texture, a river, a ring of hills and distant mountains, a lilac-to-peach sky with a low warm sun, haze, puffy
  clouds and birds. Trees have curved, tapering bark trunks and branches with leafy canopies (lumpy blobs plus
  alpha leaf cards), in green, autumn orange and blossom pink. Sculpted rock outcrops, wind-blown grass tufts that
  part around the explorer, flower drifts, painted contact shade under trees and rocks, soft shadows, and on medium
  and high quality bloom, ACES tone mapping, a warm grade, vignette and (high) ambient occlusion. Every texture is
  drawn in code (`paint.ts`); no outside assets.
- **Explorer.** A made-up modern child explorer (`Child.tsx`) with a backpack and a small lantern, walking and running
  with a procedural walk cycle. Third-person camera with smooth follow and free orbit: drag to look, wheel or pinch to
  zoom, W A S D or the arrow keys (Shift to hurry), an on-screen stick, and tap the ground to walk there. E or the
  action button uses what is in reach; tapping a far object walks to it first.
- **Animals.** Pairs of giraffes, elephants, camels, sheep and horses (`Beasts.tsx`), each with jointed legs in a
  four-beat walk, a bobbing body, a neck and head that follow the stride, swishing tails, flicking ears, an
  elephant's trunk, and grazing when still. Walk near one to find it; when both of a pair are found, tap one to lead
  them, or press and drag one onto its pad. On the right pad the pair walks up the ramp into its stall; at a wrong
  pad a gentle hint names the picture. The giraffes are the suggested first pair.
- **The ark.** A plank hull with raised bow and stern, ribs, a long deck house with round windows and a pitched roof,
  a ramp that swings shut as the door, and a hold you can walk through (`Ark.tsx`): stalls with gates that close
  behind each pair, a store, and lamps. Inside, the walls above waist height are cut away so the camera can see in.
- **Activities.** Explore the valley; find and identify the pairs; lead or drag them to their pads; carry grain, hay
  and water from the cart to the store; then go inside. The rain begins, the ramp closes, the water rises from the
  river and the ark floats; then the rain stops and the water grows calm.
- **Quran and narration, kept apart.** Four reading lanterns (start, by the ark, at the boarding area, inside) show
  the verified Arabic and the Saheeh International translation of Hud 11:36, 11:37 with Al-Qamar 54:13, 11:40 and
  11:41, each labelled, with a short labelled explanation. After the flood, 11:44 is shown, then a reflection on
  patience and trust with 11:49. Narration cards are labelled as written for the game and can be read aloud with the
  device voice. Recitation plays only when a licensed source is configured. All of it is a draft for scholarly review.
- **Saved and gentle.** Progress (found animals, pairs aboard, supplies stored, lanterns read, the flood, the
  reflection, where you stood) is saved in the browser. A calm-motion toggle stops camera easing, bobbing and
  rocking. Sounds are synthesized and natural only: wind, river, birds, rain, footsteps on grass and wood, soft
  animal calls, the door's creak and thud. No music. No prophet is shown.

Limits: checked only in headless Chromium with software WebGL (slow there, so frame rates on real GPUs and phones are
unmeasured); web only, phones fall back to the text screens; the animals are procedural models, not artist-made
assets, so they read as stylised toys more than the reference games' hand-sculpted creatures.

## Run it

Requires Node 22 or newer.

```sh
cd storybook
npm install
npm run validate     # check the Quran dataset and stories
npx expo start       # then press i (iOS simulator), a (Android) or w (web)
```

On a phone, install **Expo Go** and scan the QR code that `npx expo start` prints. For a static web build:
`npm run export:web` writes `dist/`, which any static host can serve (with fallback to `index.html`).

Other checks: `npm run typecheck`.

## What is in the MVP

| Area | Status |
|---|---|
| 3D book on the web: reading room, rehal, opening the Quran, choosing the passage, page-to-world transition, 5 explorable 3D scenes with tappable objects, return into the book, reading panel with "continue reading" | Done (web only) |
| Sound in the 3D book: generated ambience and effects, quiet mode, separate volumes. No music | Done |
| Explore (2D home): welcome scene, Explore a Story, story of the day, continue where you left off, collections, browse by prophet / theme / surah, recently explored, optional daily verse | Done |
| Stories library: search, browse by prophet, theme, surah, length and age; candidate topics shown as "being researched" | Done |
| Sample story, Yunus: intro screen and 7 scenes (5 illustrated scenes, the original verses, reflection) | Done, **unreviewed draft** |
| Interactive objects: 9 hotspots across 4 scenes, each with an animation and a sourced explanation | Done |
| Quran reader: all 114 surahs, KFGQPC Hafs Arabic, Saheeh International translation, ayah numbers, basmalah, search by name or `37:142`, text size, translation toggle, distraction-free mode, links to stories | Done |
| Recitation: play, pause, replay, previous / next ayah, play a passage or a whole surah, speed, volume, "unavailable" state | Done (streams Mishary Alafasy from EveryAyah; licence to confirm) |
| Explanation narration: listen / stop with the device voice, with the full text on screen as the caption | Done (no human recording yet) |
| Bookmarks and progress: per-ayah and per-passage bookmarks, scenes seen, stories finished, recently read | Done, stored on the device only |
| My Journey: progress, saved verses, recently read. No points, streaks or rankings | Done |
| Parents & Learning, behind a grown-up check: review status, sources, stated vs not stated details, reviewers, revision history, attribution, reading and listening settings, reduced motion, privacy and progress controls, report a concern | Done |
| Optional activity: put the events in the order of the verses, with gentle feedback | Done |
| Content validation: checksums, 114 / 6,236 counts, comparison against independent copies, reference checks, quote checks, review gate | Done (`npm run validate`, also in CI) |

## Not done yet, and what needs configuring

- **Scholarly review.** No story is approved. A qualified scholar or Islamic educator must review `content/stories/yunus/`
  (explanations, hotspots, pictures and the editorial record) before release. The validator blocks `published` without
  a named approving reviewer.
- **Recitation licence.** Audio streams from EveryAyah, which states no licence. Confirm rights with the reciter or host,
  or replace the URL template in `content/audio/recitations.json` with licensed audio. Offline download of recitations
  is not built and waits on this.
- **Translation licence.** Saheeh International is copyrighted. QuranEnc permits verbatim republication with credit;
  get written permission from the publisher before a commercial release.
- **Human narration.** No narration has been recorded. Add files and set `audio_asset` on each scene; the device voice
  is a stand-in.
- **Artwork.** The illustrations are original vector paintings made in code. A professional illustrator could replace
  them; keep the same keys so stories don't change.
- **Privacy policy and consent.** The app collects no personal data, but a full privacy policy and any consent flow
  required by law (COPPA, GDPR-K) must be written and reviewed before store release.
- **More stories.** Only Yunus exists. Other topics are listed as "being researched".
- **Interface languages and more translations.** English only for now.
- **Store builds.** Not set up. Use EAS (`npx eas-cli build`) when ready; the bundle id is `org.erguvan.quranstorybook`.
- **3D on phones and tablets.** The native app shows the 2D experience; see "The 3D world of the whole Quran" above.
- **Scholarly review of the surah worlds.** Every entry in `content/worlds/surah-worlds.json` is `unreviewed`.
- **Real paper sounds and recorded ambience.** The sounds are generated stand-ins; recorded, licensed sounds would be
  better.
- No backend, database or account system exists, and none is needed for this prototype.

## Project structure

```
storybook/
  app.json                  Expo config (name, icons, bundle ids)
  content/
    quran/                  Read-only Quran dataset (generated, never edited by hand)
      arabic-hafs.json        114 arrays of ayah strings, KFGQPC Hafs Uthmani with waqf marks
      translation-en-saheeh.json
      surahs.json             names, meanings, ayah counts
      manifest.json           sources, licences, checksums
    stories/<id>/
      story.json            the story, its scenes and interactive objects
      editorial.json        the editorial record for review
    library.json            categories and candidate topics
    audio/recitations.json  recitation source and licence status
  scripts/
    import-quran.mjs        builds content/quran from pinned npm packages
    validate-content.mjs    checks the dataset and every story
  src/
    app/                    screens (Expo Router): 3D home, tabs, story intro and player, surah reader
    components/             UI, scripture panel, illustration and hotspots, parental gate
    content/                types (the content model), Quran access, story registry
    illustrations/          original scene paintings (react-native-svg)
    three/                  the 3D book: room and rehal, story world, camera rig, sound, page textures
    state/                  bookmarks / progress / settings, recitation player, narration
    brand.ts, theme.ts
```

## Where the Quran text comes from

Tanzil.net and api.quran.com could not be reached from the build environment, so the text is imported from npm
packages that redistribute published texts, pinned to exact versions in `package.json`:

- **Arabic:** the King Fahd Glorious Quran Printing Complex (KFGQPC) *Uthmanic Hafs v3.0* text, from
  `@quran.ws/text` (which records the SHA-256 of the KFGQPC release it was built from). It is rendered with its waqf
  marks exactly as the package produces it.
- **Cross-check:** every ayah's letters are compared with an independent copy of the KFGQPC text from QuranEnc
  (`quran-json`). All 6,236 match. Ayah counts are compared with `quran-meta`.
- **Translation:** Saheeh International, from `quran-db`, compared verse by verse with the QuranEnc copy in
  `quran-json` (which strips punctuation at the ends; otherwise all verses match).
- **Font:** Amiri Quran (SIL OFL), which covers every character in the text. The KFGQPC font is not bundled because
  its licence does not allow redistribution without permission.

`npm run import:quran` regenerates the files and refuses to write anything if a check fails. The files are frozen at
runtime, so app code cannot change them.

To switch to a direct Tanzil or Quran.com download later, change `scripts/import-quran.mjs` to read that source and
keep the cross-checks; the rest of the app doesn't change.

## Content model

Defined in `src/content/types.ts`:

- **Story**: id, slug, title, description, figure, recommended_age, estimated_duration_minutes, cover_art,
  category_ids, quran_references, publication_status, editorial_review_status, learning_objectives, scenes,
  reflection, activity.
- **StoryScene**: id, story_id, scene_number, kind (`scene`, `verses`, `reflect`), title, illustration_asset,
  illustration_alt, educational_narration, audio_asset, linked_ayah_references, featured_ayah_references,
  interactive_elements, source_notes.
- **InteractiveElement**: id, scene_id, object_name, position (fractions of the painting), animation_asset,
  explanatory_text, supporting_source (an ayah reference or a source id).
- **QuranVerse**: surah_number, surah_name, ayah_number, arabic_text, translation_text, translation_source,
  text_source, text_version. Built at runtime from the read-only dataset.
- **EditorialRecord**: story_id, title, quran_references, translation_id, children_explanation_summary,
  stated_in_quran, not_specified_or_inferred, supplementary_sources (SourceReference), reviewers, revision_history.
- **SourceReference**: id, story_id, source_type, source_reference, supporting_claim, reviewer_status.
- Bookmarks and progress are stored separately, on the device (`src/state/AppState.tsx`).

Stories refer to the Quran only by reference, such as `"37:139-148"`. Story files may not contain Arabic script; the
validator rejects them if they do, so scripture can only ever come from the dataset.

## Adding a reviewed story

1. Create `content/stories/<id>/story.json` and `editorial.json`, following `yunus/` as the example. Start with
   `"publication_status": "prototype"` and `"editorial_review_status": "draft"`.
2. Write the editorial record first: the Quran references, what the verses state, what they don't, and any other
   source used (tafsir, hadith, history), each with its source.
3. Write scenes and hotspots only from what the record supports. When quoting the translation inside an explanation,
   use the form `'exact words' (37:140)`; the validator checks the words really appear in that ayah.
4. Add new paintings to `src/illustrations/` and register their keys in `src/illustrations/index.tsx`, with source and
   licence. Never depict Allah or a prophet in any form.
5. Register the story in `src/content/stories.ts` and run `npm run validate`.
6. A qualified reviewer reviews the record and the screens. Add them to `reviewers` with their decision and date, add a
   line to `revision_history`, and set `editorial_review_status` to `approved`. Only then set
   `publication_status` to `published`.

Reviewers and parents can report a concern from the Parents area; it opens an issue in this repository.
