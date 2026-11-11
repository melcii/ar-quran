// Surah 11, Hud: the Road of the Messengers. One long road runs north from a
// shipyard on the sea cliffs, through seven lands, to a quiet summit. Each
// land is one of the surah's stories, told in the surah's own order, and each
// has its own hands-on chapter:
//  1. Nuh (11:25-49): carry timber up to the ship being built on the hill
//     (11:37-38); a doorway leads to the full Ark adventure (11:37-44).
//  2. Hud and 'Aad (11:50-60): plant the dry terraces of a strong people
//     (11:52, "He will send rain from the sky upon you in showers").
//  3. Salih and Thamud (11:61-68): watch the she-camel graze in peace and
//     come no nearer than a quiet walk (11:64, "do not touch her with harm").
//  4. Ibrahim's guests (11:69-76): set the guest mat quickly and generously
//     (11:69, "he did not delay").
//  5. Lut (11:77-83): leave by night along way-stones without turning back,
//     until morning (11:81).
//  6. Shu'ayb and Madyan (11:84-95): give full measure at a grain stall, and
//     find the measure with a false bottom (11:84-85). The world's core play.
//  7. Musa and Pharaoh (11:96-99): choices at a crossroads before a river city
//     about following a command that is not right-guided (11:97).
// Then the summit: be steadfast, and pray at the two ends of the day
// (11:112-115). No prophet, angel or person is ever shown. No flood, storm,
// destruction or punishment is shown; those passages are readings only.
import * as THREE from 'three';
import { curve, type P2 } from '../terrain';
import type { WorldDef } from '../types';
import { LOOKS, rolling } from './common';

const ROAD: P2[] = curve([
  [0, 92], [-10, 82], [-22, 68], [-6, 58], [18, 50], [12, 36], [-14, 24], [-8, 10], [18, -2], [10, -16], [-14, -28], [-4, -42], [18, -54], [10, -66], [-12, -76], [4, -86], [16, -88],
]);
const pt = ([x, z]: P2) => ({ x, z });

// The lands, south to north.
const NUH: P2 = [-30, 70];
const AAD: P2 = [30, 46];
const THAMUD: P2 = [-28, 22];
const GUESTS: P2 = [30, -4];
const TOWN: P2 = [-36, -26];
const MADYAN: P2 = [30, -54];
const CITY: P2 = [-28, -78];
const SUMMIT: P2 = [20, -88];

const SAND = new THREE.Color('#d8bc8a');
const ROCK = new THREE.Color('#c09070');
const sm = (t: number) => Math.min(1, Math.max(0, t)) ** 2 * (3 - 2 * Math.min(1, Math.max(0, t)));
/** How dry the land is: the high terraces of 'Aad and the rocky valley of Thamud. */
const dry = (x: number, z: number) => Math.max(sm((18 - Math.hypot(x - AAD[0], z - AAD[1])) / 8), sm((16 - Math.hypot(x - THAMUD[0] + 6, z - THAMUD[1])) / 8));

const TERRACES: P2[] = [[34, 40], [38, 48], [30, 54]];

export const W011: WorldDef = {
  surah: 11,
  name: 'The Road of the Messengers',
  theme: 'Seven lands on one road, each a story of a messenger and his people',
  play: 'A road through seven lands, one story in each, in the surah\'s order: carry timber to the ship on the hill, plant the dry terraces of \'Aad, watch the she-camel in peace, set a guest mat without delay, leave by night without turning back, give full measure at the market of Madyan, and choose well at the crossroads before Pharaoh\'s city. Then rest on the summit.',
  seed: 1111,
  ground: {
    radius: 100,
    base: rolling({
      radius: 100,
      amp: 3,
      seed: 11,
      shapes: [
        // The western sea below the shipyard, and the shipyard hill.
        { x: -92, z: 74, r: 34, h: -12 },
        { x: -34, z: 74, r: 12, h: 3.5 },
        // The high terraces of 'Aad.
        { x: 34, z: 46, r: 16, h: 4 },
        // The rocky valley of Thamud.
        { x: -42, z: 22, r: 12, h: 5 },
        // The valley the way-stones climb out of, and the town in its hollow.
        { x: TOWN[0], z: TOWN[1], r: 10, h: -1.2 },
        // The summit.
        { x: SUMMIT[0], z: SUMMIT[1], r: 12, h: 4 },
      ],
      streams: [{ pts: [[-46, -60], [-50, -78], [-58, -96], [-70, -110]], w: 7, depth: 5 }],
    }),
    palette: { lush: '#8aa452', deep: '#5c7c3a', warm: '#c8a864', path: '#dcc49a', sand: '#e6d2a4', rock: '#a8927a' },
    paths: [ROAD],
    tint: (x, z, _y, c) => {
      const k = dry(x, z);
      if (k > 0) c.lerp(x < 0 ? ROCK : SAND, k * 0.8);
    },
    water: -2.8,
    shore: '#e8d6a8',
    flats: [
      { ...pt(NUH), r: 8, paint: '#c8b088' },
      { ...pt(GUESTS), r: 7 },
      { ...pt(MADYAN), r: 10, paint: '#e2cca0' },
      { x: -14, z: -78, r: 7, paint: '#e2d2ae' },
      { ...pt(SUMMIT), r: 5, paint: '#e2d2ae' },
    ],
  },
  look: { ...LOOKS.golden, sunI: 3.1 },
  veg: {
    grass: 1,
    flowers: ['#fff2d8', '#f4d060', '#e8c0e0'],
    trees: [
      { kind: 'pine', area: { x: -22, z: 82, r: 10 }, count: 6 },
      { kind: 'oak', at: [[24, -12], [38, -10], [36, 4], [22, 6]] },
      { kind: 'olive', area: { x: -18, z: 8, r: 8 }, count: 3 },
      { kind: 'palm', area: { x: 40, z: -60, r: 10 }, count: 5 },
      { kind: 'palm', at: [[-40, -66], [-42, -88], [-36, -96]] },
      { kind: 'cypress', at: [[12, -84], [26, -82]] },
    ],
    rocks: [{ x: -42, z: 22, n: 10, big: 1.6, spread: 14 }, { x: 44, z: 30, n: 5, big: 1.1, spread: 10 }, { x: -24, z: -40, n: 6, big: 1.2, spread: 10 }],
    pebbles: 40,
    rim: ['oak', 'pine', 'olive'],
    lush: (x, z) => 0.85 - dry(x, z) * 0.75,
  },
  far: '#7a9a5a',
  mountains: { color: '#9a92b0', height: 1 },
  start: [0, 88],
  startYaw: Math.PI,
  regions: [
    { id: 'nuh', name: 'Chapter 1 · Nuh and the ship', at: NUH },
    { id: 'aad', name: 'Chapter 2 · Hud and \'Aad', at: AAD },
    { id: 'thamud', name: 'Chapter 3 · Salih and Thamud', at: THAMUD },
    { id: 'guests', name: 'Chapter 4 · Ibrahim\'s guests', at: GUESTS },
    { id: 'lut', name: 'Chapter 5 · Lut, leaving by night', at: [-20, -36] },
    { id: 'madyan', name: 'Chapter 6 · Shu\'ayb and Madyan', at: MADYAN },
    { id: 'musa', name: 'Chapter 7 · Musa and Pharaoh', at: [-14, -78] },
    { id: 'summit', name: 'The summit', at: SUMMIT },
  ],
  structures: [
    { type: 'arch', x: 0, z: 84, w: 4, h: 4.2 },
    // 1. The shipyard on the hill: a slipway, timber stacks, a cart.
    { type: 'terrace', ...pt(NUH), w: 12, d: 6, h: 0.35, color: '#a88a64', rot: 0.4 },
    { type: 'stones', x: -20, z: 78, n: 4 },
    { type: 'cart', x: -16, z: 74, rot: 1.1 },
    // 2. 'Aad: tall pillars on the high ground.
    { type: 'columns', x: 40, z: 44, w: 10, n: 4, rot: Math.PI / 2, color: '#d0a880' },
    { type: 'stones', x: 26, z: 56, n: 5 },
    // 3. Thamud: homes carved into the rock.
    { type: 'cliff', x: -44, z: 22, rot: Math.PI / 2, w: 14, h: 8, n: 3, color: '#c8926a' },
    { type: 'well', x: -22, z: 28 },
    // 4. The tent under the oaks, and the guest mat in its shade.
    { type: 'tent', x: 34, z: -8, rot: -0.6, color: '#c8a070' },
    { type: 'rug', x: 28, z: 0, w: 4, d: 3, color: '#a0463a' },
    // 5. The town in the hollow, quiet and dark.
    { type: 'house', x: -40, z: -22, rot: 0.6, w: 5, d: 4, h: 3, accent: '#6a6a7a' },
    { type: 'house', x: -44, z: -30, rot: 1.2, w: 5, d: 4, h: 3, accent: '#5a5a6a' },
    { type: 'house', x: -34, z: -32, rot: 0.2, w: 5, d: 4, h: 3, accent: '#6a5a5a' },
    // 6. The market of Madyan.
    { type: 'stall', x: 30, z: -50, rot: Math.PI, color: '#c8a040' },
    { type: 'stall', x: 38, z: -56, rot: -Math.PI / 2, color: '#3f7f8a' },
    { type: 'stall', x: 24, z: -60, rot: Math.PI / 2, color: '#d8664a' },
    { type: 'festoon', x: 22, z: -52, to: [38, -52], h: 3.6 },
    { type: 'well', x: 32, z: -64 },
    // 7. The crossroads before the river city: its gate and walls.
    { type: 'arch', x: -26, z: -80, rot: Math.PI / 2, w: 5, h: 5.5 },
    { type: 'wall', x: -26, z: -84, to: [-26, -94], h: 4, color: '#d8c49a' },
    { type: 'wall', x: -26, z: -76, to: [-26, -66], h: 4, color: '#d8c49a' },
    { type: 'columns', x: -36, z: -80, w: 8, n: 4, rot: 0, color: '#e2cca0' },
    // The summit: a bench and a prayer mat facing the sunrise.
    { type: 'bench', x: 14, z: -84, rot: Math.PI / 2 },
  ],
  herds: [{ animal: 'goat', at: [-16, 34], r: 6, n: 3 }, { animal: 'sheep', at: [8, 4], r: 6, n: 4 }],
  links: [{ at: [-36, 64], label: 'Play Nuh\'s Ark', href: '/ark', note: 'The Nuh\'s Ark adventure: gather the pairs and supplies, board, and wait out the flood (11:37-44)' }],
  welcome:
    'Welcome to the Road of the Messengers. Surah Hud tells of messengers sent one after another, and of how their peoples answered. Each said, "O my people, worship Allah; you have no god other than Him." Follow the road north through seven lands, one story in each.',
  tasks: [
    // Chapter 1. Nuh.
    {
      id: 'nuh-call',
      kind: 'read',
      region: 'nuh',
      at: [-12, 72],
      marker: 'tablet',
      title: 'Nuh warns his people',
      goal: 'Read the stone at the start of the road',
      intro: 'Chapter 1. The first story is of Nuh (Noah). He called his people for a very long time, and only a few believed.',
      reading: { title: 'A clear warner', refs: [[11, 25], [11, 26]], note: 'Allah sent Nuh to his people. He said: "I am a clear warner to you, that you worship none but Allah. I fear for you the punishment of a painful day."' },
    },
    {
      id: 'nuh-ship',
      kind: 'carry',
      requires: ['nuh-call'],
      region: 'nuh',
      result: 'item',
      title: 'Timber for the ship',
      goal: 'Carry five planks from the timber stack up to the slipway',
      intro: 'Nuh was told to build the ship, under Allah\'s watch and by His instruction. Carry timber up to the slipway on the hill.',
      adaptation: 'Carrying planks is a game idea. The Quran tells that Nuh built the ship and that his people mocked him as they passed (11:37-38); how it was built is not described, and Nuh is not shown.',
      loads: [0, 1, 2, 3, 4].map((k) => ({ from: [-18, 80] as P2, to: [NUH[0] - 4 + k * 2, NUH[1] - 1 + k * 0.8] as P2, item: 'plank' as const, label: 'plank', dest: 'to the slipway' })),
      after: { title: 'Build the ship', refs: [[11, 37], [11, 38]], note: 'Allah said: "Build the ship under Our eyes and Our inspiration." Every time some of his people passed by, they mocked him. He said: "If you mock us, we will mock you just as you mock." The doorway on the hill leads to the Nuh\'s Ark adventure.' },
      outro: 'The ship\'s story goes on in the Ark adventure, through the doorway on the hill. The road continues north to the high land of \'Aad.',
    },
    // Chapter 2. Hud and 'Aad.
    {
      id: 'aad-read',
      kind: 'read',
      requires: ['nuh-ship'],
      region: 'aad',
      at: [22, 44],
      marker: 'tablet',
      title: 'Hud and \'Aad',
      goal: 'Read the stone below the high terraces',
      intro: 'Chapter 2. To the people of \'Aad, Allah sent their brother Hud. They were strong, and their land was high and dry.',
      reading: { title: 'Ask forgiveness, then rain', refs: [[11, 50], [11, 51], [11, 52]], note: 'Hud said: "O my people, worship Allah. I ask no reward from you. Ask forgiveness of your Lord and turn back to Him; He will send rain from the sky upon you in showers and add strength to your strength."' },
    },
    {
      id: 'aad-plant',
      kind: 'points',
      requires: ['aad-read'],
      region: 'aad',
      style: 'plant',
      verb: 'Plant',
      title: 'The dry terraces',
      goal: 'Plant a seedling on each of the three dry terraces',
      intro: 'The terraces are bare and dry. Plant a seedling on each one, and read what Hud told his people.',
      adaptation: 'Planting is a game idea linked to the rain promised in 11:52. The Quran does not say the people of \'Aad farmed these terraces; the land is only a picture.',
      points: [
        { at: TERRACES[0], label: 'the lowest terrace', reading: { title: 'What they answered', refs: [[11, 53], [11, 54]], note: 'They said: "O Hud, you have not brought us clear proof, and we will not leave our gods on your word."' } },
        { at: TERRACES[1], label: 'the middle terrace', reading: { title: 'I rely on Allah', refs: [[11, 56]], note: 'Hud said: "I have relied on Allah, my Lord and your Lord. There is no creature that He does not hold by its forelock. My Lord is on a straight path."' } },
        { at: TERRACES[2], label: 'the top terrace', reading: { title: 'Hud was saved', refs: [[11, 58], [11, 59]], note: 'When Our command came, We saved Hud and those who believed with him, by mercy from Us. That was \'Aad: they denied the signs of their Lord and followed the command of every stubborn tyrant. What happened to them is not shown here.' } },
      ],
      outro: 'Three seedlings on the dry terraces. The road goes on to the rocky valley of Thamud.',
    },
    // Chapter 3. Salih and Thamud.
    {
      id: 'thamud-read',
      kind: 'read',
      requires: ['aad-plant'],
      region: 'thamud',
      at: [-18, 18],
      marker: 'tablet',
      title: 'Salih and Thamud',
      goal: 'Read the stone at the mouth of the rocky valley',
      intro: 'Chapter 3. To Thamud, Allah sent their brother Salih.',
      reading: { title: 'He made you from the earth', refs: [[11, 61]], note: 'Salih said: "O my people, worship Allah. He made you from the earth and settled you in it. So ask His forgiveness and turn back to Him. My Lord is near and answers."' },
    },
    {
      id: 'thamud-camel',
      kind: 'observe',
      requires: ['thamud-read'],
      region: 'thamud',
      secs: 6,
      title: 'The she-camel',
      goal: 'Come near the she-camel at a walk and watch her graze in peace',
      intro: 'Salih told his people that the she-camel was a sign: let her eat freely on Allah\'s earth, and do not harm her. Walk near quietly, keep still, and watch. Running would startle her.',
      adaptation: 'The camel here only stands for the she-camel of the story; she is not a model of it. Watching quietly is a game idea about respecting a sign of Allah.',
      subjects: [{ at: [-34, 30], r: 6, animal: 'camel', n: 1, label: 'the she-camel', note: 'Journal: she grazes slowly and freely. No one is to touch her with harm.', reading: { title: 'The she-camel of Allah', refs: [[11, 64]], note: 'Salih said: "O my people, this is the she-camel of Allah, a sign for you. Let her eat on Allah\'s earth and do not touch her with harm." The next ayahs tell that they killed her and were punished; that is not shown.' } }],
      outro: 'The road leaves the rocks and goes on to the oak grove, where a tent stands in the shade.',
    },
    // Chapter 4. Ibrahim's guests.
    {
      id: 'guests',
      kind: 'carry',
      requires: ['thamud-camel'],
      region: 'guests',
      result: 'item',
      title: 'Without delay',
      goal: 'Set water, bread, dates and a dish on the guest mat',
      intro: 'Chapter 4. Messengers came to Ibrahim with good news. He greeted them with peace and did not delay in bringing them food. Set the guest mat quickly: bring each thing from the tent.',
      adaptation: 'The Quran says Ibrahim brought a roasted calf without delay (11:69). Setting a mat with water, bread, dates and a covered dish is a game idea about generous welcome. Ibrahim, his wife and the guests (who were angels) are not shown.',
      loads: [
        { from: [36, -6], to: [27, -0.6], item: 'water', label: 'jug of water', dest: 'to the guest mat', lift: 0.05 },
        { from: [36, -6], to: [28.4, 0.8], item: 'bread', label: 'bread', dest: 'to the guest mat', lift: 0.05 },
        { from: [36, -6], to: [29.4, -0.4], item: 'dates', label: 'dates', dest: 'to the guest mat', lift: 0.05 },
        { from: [36, -6], to: [27.8, -1.2], item: 'pot', label: 'covered dish', dest: 'to the guest mat', lift: 0.05 },
      ],
      after: { title: 'Good news', refs: [[11, 69], [11, 71]], note: 'Our messengers came to Ibrahim with good news. They said "Peace," and he said "Peace," and he did not delay in bringing a roasted calf. Then his wife was given the good news of Ishaq, and after Ishaq, Ya\'qub.' },
    },
    {
      id: 'guests-read',
      kind: 'read',
      requires: ['guests'],
      region: 'guests',
      at: [22, -10],
      marker: 'lantern',
      title: 'Ibrahim, gentle and kind',
      goal: 'Read at the lantern under the oaks',
      reading: { title: 'Forbearing and tender-hearted', refs: [[11, 73], [11, 75]], note: 'They said: "The mercy of Allah and His blessings are upon you, people of the house." Ibrahim was forbearing, tender-hearted and always turning to Allah.' },
      outro: 'The road goes down into a valley. Night is falling over the quiet town in the hollow.',
    },
    // Chapter 5. Lut.
    {
      id: 'lut-read',
      kind: 'read',
      requires: ['guests-read'],
      region: 'lut',
      at: [-26, -24],
      marker: 'lantern',
      title: 'Lut',
      goal: 'Read at the lantern above the town',
      intro: 'Chapter 5. The messengers came to Lut, whose people did shameful things and would not stop. They told him to leave by night.',
      reading: { title: 'Leave in part of the night', refs: [[11, 81]], note: 'The messengers said: "O Lut, we are messengers of your Lord; they will not reach you. Set out with your family in part of the night, and let none of you look back. Their appointed time is the morning. Is not the morning near?"' },
    },
    {
      id: 'lut-leave',
      kind: 'dawn',
      requires: ['lut-read'],
      region: 'lut',
      title: 'Before the morning',
      goal: 'Light the way-stones out of the valley without turning back',
      intro: 'It is night. Way-stones lead up out of the valley, away from the town. Light each one and keep going forward. If you walk back toward the town, the last stone goes dark.',
      adaptation: 'The way-stones and the sky turning to morning are game ideas about the instruction in 11:81. Lut and his family are not shown, and nothing that happened to the town is shown.',
      town: TOWN,
      slack: 6,
      stones: [[-20, -32], [-10, -38], [-2, -44], [8, -48], [16, -52]],
      after: { title: 'The morning came', refs: [[11, 82], [11, 83]], note: 'When Our command came, the town was overturned, as these ayahs tell. It is not shown here. The road goes on to the market of Madyan.' },
    },
    // Chapter 6. Shu'ayb and Madyan: the world's core play.
    {
      id: 'madyan-read',
      kind: 'read',
      requires: ['lut-leave'],
      region: 'madyan',
      at: [20, -46],
      marker: 'sign',
      title: 'Shu\'ayb and Madyan',
      goal: 'Read the sign at the edge of the market',
      intro: 'Chapter 6. To Madyan, Allah sent their brother Shu\'ayb. The people traded, and some gave short measure.',
      reading: { title: 'Full measure', refs: [[11, 84], [11, 85]], note: 'Shu\'ayb said: "O my people, worship Allah. Do not give short measure or weight. Give full measure and weight in justice, and do not take from people what is theirs, and do not spread corruption in the land."' },
    },
    {
      id: 'measure',
      kind: 'measure',
      requires: ['madyan-read'],
      region: 'madyan',
      title: 'The grain stall',
      goal: 'Give each buyer full measures of grain, then find the false measure',
      intro: 'At the grain stall, three buyers have brought baskets. Pour each measure up to the line and give it: never short. Then test the two measures on the counter.',
      adaptation: 'The stall, buyers, measures and the false bottom are game ideas about 11:84-85. Shu\'ayb is not shown, and no buyer is a person from the story.',
      stall: [30, -56],
      buyers: [
        { label: 'the blue basket', want: 2, color: '#3f6f9a' },
        { label: 'the red basket', want: 3, color: '#a04a3a' },
        { label: 'the yellow basket', want: 1, color: '#c8a040' },
      ],
      falseBottom: 0.3,
      falseIn: 1,
      after: { title: 'What remains with Allah is better', refs: [[11, 86], [11, 88]], note: 'Shu\'ayb said: "What remains from Allah is better for you, if you believe." And: "I only want to set things right as far as I can. My success is only through Allah. On Him I rely, and to Him I turn."' },
    },
    // Chapter 7. Musa and Pharaoh.
    {
      id: 'musa',
      kind: 'choice',
      requires: ['measure'],
      region: 'musa',
      at: [-14, -78],
      back: [0, -70],
      marker: 'sign',
      title: 'The crossroads',
      goal: 'Answer the situations at the crossroads before the city gate',
      intro: 'Chapter 7. Allah sent Musa with signs and clear authority to Pharaoh and his chiefs. But they followed the command of Pharaoh, and his command was not right-guided. At this crossroads, think about whom you follow.',
      adaptation: 'The situations are everyday ones written for this game, not events from the surah. Musa and Pharaoh are not shown.',
      scenes: [
        {
          text: 'A loud, famous older child tells everyone to leave the marked path and cross the old rotten bridge. Everyone is following. What do you do?',
          options: [
            { text: 'Follow: everyone else is going.', ok: false, reply: 'Many people following a command does not make it right. Pharaoh\'s people followed his command, and it was not right-guided (11:97).' },
            { text: 'Stay on the marked path, and warn the others gently.', ok: true, reply: 'A command is not right just because it is loud or popular. Look at whether it is true and good.' },
          ],
        },
        {
          text: 'A friend says, "We have always done it this way, so it must be right," about leaving rubbish by the well.',
          options: [
            { text: 'Clean it up, and suggest a better way.', ok: true, reply: 'Doing something for a long time does not make it right. The messengers\' peoples often said "our fathers did this" (11:62, 11:87).' },
            { text: 'Leave it: it is how things are done here.', ok: false, reply: 'Think again: is it good just because it is old?' },
          ],
        },
        {
          text: 'You made a mistake in a game and someone kindly shows you. You feel embarrassed.',
          options: [
            { text: 'Say thank you and put it right.', ok: true, reply: 'Turning back from a mistake is a good deed. Good deeds wipe away bad ones (11:114).' },
            { text: 'Pretend you were right all along.', ok: false, reply: 'Pride keeps a mistake going. Try once more.' },
          ],
        },
      ],
      reading: { title: 'Not right-guided', refs: [[11, 96], [11, 97]], note: 'We sent Musa with Our signs and a clear authority to Pharaoh and his chiefs. But they followed the command of Pharaoh, and the command of Pharaoh was not right-guided.' },
    },
    // The summit.
    {
      id: 'stories',
      kind: 'read',
      requires: ['musa'],
      region: 'summit',
      at: [10, -82],
      marker: 'lantern',
      title: 'The stories of the towns',
      goal: 'Read at the lantern on the way up the summit',
      reading: { title: 'To make your heart firm', refs: [[11, 100], [11, 120]], note: 'These are some of the stories of the towns that We tell you. And all that We tell you of the stories of the messengers is to make your heart firm. In them the truth has come to you, and a lesson and a reminder for the believers.' },
    },
    {
      id: 'steadfast',
      kind: 'stand',
      requires: ['stories'],
      region: 'summit',
      at: [20, -88],
      r: 1.6,
      secs: 5,
      style: 'rug',
      face: [40, -88],
      label: 'the prayer mat facing the sunrise',
      title: 'Be steadfast',
      goal: 'Stand still on the mat on the summit, facing the sunrise',
      intro: 'At the top of the road is a quiet place facing the sunrise. Stand still for a moment and look back at the seven lands.',
      adaptation: 'Standing on the summit is a moment of quiet in the game, not a prayer the game asks you to perform.',
      reading: { title: 'Remain on the right course', refs: [[11, 112], [11, 114], [11, 115]], note: 'So remain on the right course as you have been commanded. Establish prayer at the two ends of the day and in some hours of the night. Good deeds do away with bad deeds; that is a reminder for those who remember. And be patient: Allah does not let the reward of those who do good be lost.' },
    },
  ],
  finale: {
    title: 'The Road of the Messengers',
    body: [
      'You walked the road through seven lands: the ship on the hill, the dry terraces, the she-camel, the guest mat, the night road, the honest measure, and the crossroads.',
      'Each messenger said the same thing to his people: worship Allah alone. Surah Hud tells their stories to make hearts firm, and asks us to remain steadfast and patient.',
    ],
    ref: [11, 112],
    questions: ['Which messenger\'s story did you like best, and why?', 'Where in your day can you give "full measure"?', 'What helps you keep going on the right path when others do not?'],
  },
  notes: [
    'No prophet, angel or person is shown, in any form. Allah is never pictured.',
    'The flood, the destruction of \'Aad, Thamud and the town of Lut, and the drowning of Pharaoh\'s people are readings only. Nothing of them is shown or played.',
    'The full Ark adventure (11:37-44) is reached through the doorway in Chapter 1.',
    'Every chapter\'s activity is a game idea, labelled as such; the ayahs are the verified text.',
  ],
};
