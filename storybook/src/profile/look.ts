// How an explorer looks: every choice in the dressing room. The figure is the
// same rounded, hand-made explorer the worlds already use; these choices only
// change its colours, clothes and small things it carries. The default is the
// original explorer exactly.

export type Build = 'little' | 'middle' | 'older';
export type Hair = 'short' | 'curly' | 'long' | 'bun' | 'braids' | 'shaved';
export type Face = 'round' | 'soft' | 'freckles' | 'bright';
export type Top = 'shirt' | 'tunic' | 'dress';
export type Pattern = 'plain' | 'stripes' | 'checks' | 'dots';
export type Bottom = 'trousers' | 'skirt';
export type Outer = 'none' | 'vest' | 'jacket' | 'raincoat';
export type Head = 'none' | 'hijab' | 'scarf' | 'sunhat' | 'cap' | 'woolhat';
export type Shoes = 'boots' | 'shoes' | 'sandboots' | 'wellies';
export type Pack = 'backpack' | 'satchel' | 'none';

export type Look = {
  build: Build;
  skin: string;
  hair: Hair;
  hairColor: string;
  eyes: string;
  face: Face;
  top: Top;
  topColor: string;
  pattern: Pattern;
  bottom: Bottom;
  bottomColor: string;
  outer: Outer;
  outerColor: string;
  head: Head;
  headColor: string;
  shoes: Shoes;
  shoesColor: string;
  pack: Pack;
  packColor: string;
  glasses: boolean;
  hairClip: boolean;
};

export const DEFAULT_LOOK: Look = {
  build: 'middle',
  skin: '#c98c62',
  hair: 'short',
  hairColor: '#3a2618',
  eyes: '#241812',
  face: 'round',
  top: 'shirt',
  topColor: '#3f8a8c',
  pattern: 'plain',
  bottom: 'trousers',
  bottomColor: '#6a5a48',
  outer: 'vest',
  outerColor: '#d9a55a',
  head: 'none',
  headColor: '#b0603a',
  shoes: 'boots',
  shoesColor: '#5a3a26',
  pack: 'backpack',
  packColor: '#b0603a',
  glasses: false,
  hairClip: false,
};

/** Colours drawn from the worlds' own palette: earth, clay, sea, olive, sand. */
export const SKIN = ['#f1d0b0', '#e6b88e', '#d6a077', '#c98c62', '#a8714a', '#8a5a3a', '#6a4028', '#4e2e1c'];
export const HAIR_COLORS = ['#1e140e', '#3a2618', '#5a3a22', '#7a4e2a', '#a8703a', '#c89a5a', '#8a3a22', '#6a6a6a'];
export const EYES = ['#241812', '#4a2e1a', '#6a4a2a', '#3a5a3a', '#3a5a7a', '#5a5a52'];
export const CLOTH = ['#3f8a8c', '#2f6a8a', '#5a7a3a', '#8a9a4a', '#d9a55a', '#c86a3a', '#b0603a', '#8a3a4a', '#6a4a7a', '#e8dcc0', '#6a5a48', '#3a3a42'];

export type Opt<T extends string> = { id: T; label: string };
export const BUILDS: Opt<Build>[] = [
  { id: 'little', label: 'Little explorer' },
  { id: 'middle', label: 'Explorer' },
  { id: 'older', label: 'Older explorer' },
];
export const HAIRS: Opt<Hair>[] = [
  { id: 'short', label: 'Short' },
  { id: 'curly', label: 'Curly' },
  { id: 'long', label: 'Long' },
  { id: 'bun', label: 'Bun' },
  { id: 'braids', label: 'Two braids' },
  { id: 'shaved', label: 'Very short' },
];
export const FACES: Opt<Face>[] = [
  { id: 'round', label: 'Round cheeks' },
  { id: 'soft', label: 'Soft smile' },
  { id: 'freckles', label: 'Freckles' },
  { id: 'bright', label: 'Bright eyes' },
];
export const TOPS: Opt<Top>[] = [
  { id: 'shirt', label: 'Shirt' },
  { id: 'tunic', label: 'Long tunic' },
  { id: 'dress', label: 'Long dress' },
];
export const PATTERNS: Opt<Pattern>[] = [
  { id: 'plain', label: 'Plain' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'checks', label: 'Checks' },
  { id: 'dots', label: 'Dots' },
];
export const BOTTOMS: Opt<Bottom>[] = [
  { id: 'trousers', label: 'Trousers' },
  { id: 'skirt', label: 'Long skirt' },
];
export const OUTERS: Opt<Outer>[] = [
  { id: 'none', label: 'None' },
  { id: 'vest', label: 'Explorer vest' },
  { id: 'jacket', label: 'Jacket' },
  { id: 'raincoat', label: 'Raincoat' },
];
export const HEADS: Opt<Head>[] = [
  { id: 'none', label: 'None' },
  { id: 'hijab', label: 'Hijab' },
  { id: 'scarf', label: 'Neck scarf' },
  { id: 'sunhat', label: 'Sun hat' },
  { id: 'cap', label: 'Cap' },
  { id: 'woolhat', label: 'Wool hat' },
];
export const SHOES: Opt<Shoes>[] = [
  { id: 'boots', label: 'Walking boots' },
  { id: 'shoes', label: 'Shoes' },
  { id: 'sandboots', label: 'Desert boots' },
  { id: 'wellies', label: 'Rain boots' },
];
export const PACKS: Opt<Pack>[] = [
  { id: 'backpack', label: 'Explorer backpack' },
  { id: 'satchel', label: 'Small bag' },
  { id: 'none', label: 'None' },
];

/** Ready-made explorers to start from. Made-up children, not anyone from the stories. */
export const PRESETS: { name: string; look: Look }[] = [
  { name: 'Trail explorer', look: DEFAULT_LOOK },
  { name: 'Desert walker', look: { ...DEFAULT_LOOK, skin: '#a8714a', hair: 'curly', hairColor: '#1e140e', top: 'tunic', topColor: '#e8dcc0', outer: 'none', head: 'sunhat', headColor: '#c89a5a', shoes: 'sandboots', shoesColor: '#a8703a', bottomColor: '#8a9a4a' } },
  { name: 'Rainy coast', look: { ...DEFAULT_LOOK, build: 'little', skin: '#f1d0b0', hair: 'braids', hairColor: '#a8703a', outer: 'raincoat', outerColor: '#d9a55a', topColor: '#2f6a8a', shoes: 'wellies', shoesColor: '#2f6a8a', eyes: '#3a5a7a' } },
  { name: 'Forest notebook', look: { ...DEFAULT_LOOK, build: 'older', skin: '#6a4028', hair: 'shaved', topColor: '#5a7a3a', pattern: 'checks', outer: 'jacket', outerColor: '#6a5a48', glasses: true, pack: 'satchel', packColor: '#7a4e2a' } },
  { name: 'Hijab and long dress', look: { ...DEFAULT_LOOK, skin: '#d6a077', top: 'dress', topColor: '#6a4a7a', pattern: 'dots', outer: 'none', head: 'hijab', headColor: '#e8dcc0', shoes: 'shoes', shoesColor: '#3a3a42', bottom: 'skirt', bottomColor: '#6a4a7a' } },
  { name: 'Hill climber', look: { ...DEFAULT_LOOK, build: 'older', skin: '#8a5a3a', hair: 'bun', hairColor: '#1e140e', top: 'shirt', topColor: '#c86a3a', pattern: 'stripes', outer: 'vest', outerColor: '#5a7a3a', head: 'scarf', headColor: '#d9a55a', hairClip: true } },
];

const pick = <T,>(v: unknown, ok: readonly T[], d: T): T => (ok.includes(v as T) ? (v as T) : d);
const color = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : d);

/** Read a saved look safely: anything unknown falls back to the default. */
export function cleanLook(raw: unknown): Look {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_LOOK;
  const ids = <T extends string>(o: Opt<T>[]) => o.map((x) => x.id);
  return {
    build: pick(r.build, ids(BUILDS), d.build),
    skin: color(r.skin, d.skin),
    hair: pick(r.hair, ids(HAIRS), d.hair),
    hairColor: color(r.hairColor, d.hairColor),
    eyes: color(r.eyes, d.eyes),
    face: pick(r.face, ids(FACES), d.face),
    top: pick(r.top, ids(TOPS), d.top),
    topColor: color(r.topColor, d.topColor),
    pattern: pick(r.pattern, ids(PATTERNS), d.pattern),
    bottom: pick(r.bottom, ids(BOTTOMS), d.bottom),
    bottomColor: color(r.bottomColor, d.bottomColor),
    outer: pick(r.outer, ids(OUTERS), d.outer),
    outerColor: color(r.outerColor, d.outerColor),
    head: pick(r.head, ids(HEADS), d.head),
    headColor: color(r.headColor, d.headColor),
    shoes: pick(r.shoes, ids(SHOES), d.shoes),
    shoesColor: color(r.shoesColor, d.shoesColor),
    pack: pick(r.pack, ids(PACKS), d.pack),
    packColor: color(r.packColor, d.packColor),
    glasses: r.glasses === true,
    hairClip: r.hairClip === true,
  };
}
