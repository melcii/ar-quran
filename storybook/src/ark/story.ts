// Words for the Ark slice, kept in three clearly separate kinds:
//  - Quran: the verified Arabic and the Saheeh International translation,
//    read from the app's dataset by reference (never typed or generated here);
//  - narration: short educational lines written for children, labelled so;
//  - activity notes: say plainly which parts are game ideas, not the Quran.
// All of it is a draft that needs qualified scholarly review before release.
import { getVerse } from '@/content/quran';
import type { BeastKind } from './land';
import type { SupplyKind } from './Ark';

export type Ref = [number, number];
export type Reading = { id: string; title: string; refs: Ref[]; note: string };

/** Reading lanterns placed in the valley and in the ark. */
export const READINGS: Reading[] = [
  { id: 'r1', title: 'Do not be distressed', refs: [[11, 36]], note: 'Allah comforted Nuh (peace be upon him) when few people believed.' },
  { id: 'r2', title: 'Build the ship', refs: [[11, 37], [54, 13]], note: 'The ship was built of planks and nails, under Allah’s watch and guidance.' },
  { id: 'r3', title: 'Two of each kind', refs: [[11, 40]], note: 'Allah commanded that a pair of each kind be carried on the ship.' },
  { id: 'r4', title: 'In the name of Allah', refs: [[11, 41]], note: 'Boarding the ship began with the name of Allah.' },
];
export const AFTER: Reading = { id: 'r5', title: 'The water subsides', refs: [[11, 44]], note: 'Then the rain was held back, the water went down, and the ship came to rest on Al-Judiyy.' };
export const REFLECT_REF: Ref = [11, 49];

export function verse([s, a]: Ref) {
  const v = getVerse(s, a);
  return { ref: `${s}:${a}`, surah: s, ayah: a, arabic: v?.arabic_text ?? null, translation: v?.translation_text ?? null, source: v ? `${v.text_source} · ${v.translation_source}` : 'Not available' };
}

export const NAMES: Record<BeastKind, [string, string]> = {
  giraffe: ['giraffe', 'giraffes'],
  elephant: ['elephant', 'elephants'],
  camel: ['camel', 'camels'],
  sheep: ['sheep', 'sheep'],
  horse: ['horse', 'horses'],
};
export const SUPPLY_NAMES: Record<SupplyKind, string> = { grain: 'sack of grain', hay: 'bale of hay', water: 'jar of water' };

/** Narration lines, written for this game. Not Quran text. */
export const NARRATION = {
  welcome:
    'Welcome to the valley of the ark. This is a picture made for learning, not an exact view of the real place. The Quran tells us that Allah commanded Nuh (peace be upon him) to build a ship. Out of respect, no prophet is shown in this game. Follow the path to the ark.',
  ark: 'The Quran says the ship was made of planks and nails. Its shape and size here are an artist’s idea.',
  animals:
    'The Quran says a pair of each kind was carried. It does not tell us which animals, or how they came aboard, so this part is a game: find each pair, then lead them to the pad with their picture.',
  giraffe: 'Try the giraffes first: tap one to lead the pair, or press and drag a giraffe onto its pad.',
  supplies: 'Supplies are a game idea too: the Quran does not list what was stored. Carry the grain, hay and water from the cart to the store inside the ark.',
  ready: 'Everything is aboard. Go inside the ark.',
  rain: 'The rain begins and the water rises. You are safe inside. Read the lantern by the door while you wait.',
  calm: 'The rain stops and the water grows calm. Read what the Quran says came next.',
};

export const REFLECTION = {
  title: 'Patience and trust',
  body: [
    'Nuh (peace be upon him) kept building the ship even when people made fun of him (11:38), and he trusted that Allah’s promise is true.',
    'At the end of the story, Allah says to the Prophet Muhammad (peace be upon him):',
  ],
  questions: ['When did you keep going with something good, even when it was hard?', 'What helps you trust that doing the right thing is worth it?'],
};

/* ------------------------------- saving ------------------------------- */

export type Save = {
  v: 1;
  found: string[];
  boarded: BeastKind[];
  stored: SupplyKind[];
  read: string[];
  arrived: boolean;
  flood: 0 | 1 | 2; // 0 not yet, 1 under way, 2 calm again
  reflected: boolean;
  pos?: [number, number, number];
};
const KEY = 'quran-adventure.ark-slice.v1';
export const fresh = (): Save => ({ v: 1, found: [], boarded: [], stored: [], read: [], arrived: false, flood: 0, reflected: false });

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw) as Save;
    return s && s.v === 1 ? { ...fresh(), ...s } : fresh();
  } catch {
    return fresh();
  }
}
export function save(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private window: progress just isn't kept */
  }
}
export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
