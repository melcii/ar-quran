// Visual presets for the walkable world of each surah. The choice of preset
// per surah lives in content/worlds/surah-worlds.json with the reason for it.
import worldsData from '@content/worlds/surah-worlds.json';

export type SettingName =
  | 'garden' | 'opening' | 'sea' | 'storm' | 'meadow' | 'cave' | 'light' | 'dunes' | 'wind' | 'mountain'
  | 'stars' | 'moon' | 'creation' | 'dawn' | 'sun' | 'night' | 'morning' | 'orchard' | 'desert-dusk';

export type SurahWorldInfo = {
  surah: number;
  setting: SettingName;
  basis: string;
  references: string[];
  story?: string;
  review_status: string;
};

export const surahWorlds = worldsData.worlds as SurahWorldInfo[];
export const worldFor = (n: number) => surahWorlds[n - 1];

type Terrain = 'garden' | 'dunes' | 'hills' | 'mountains' | 'shore' | 'valley';
type Vegetation = { palms: number; trees: number; olives: number; flowers: number; grass: number; rocks: number };

export type Preset = {
  /** Sun height above the horizon in degrees (negative = below) and its compass bearing. */
  sun: [elevation: number, azimuth: number];
  night: boolean;
  stars: boolean;
  moon: boolean;
  turbidity: number;
  rayleigh: number;
  fog: string;
  fogDensity: number;
  terrain: Terrain;
  ground: [string, string];
  water: 'none' | 'pool' | 'sea' | 'rivers';
  veg: Vegetation;
  clouds: number;
  particles: 'none' | 'dust' | 'motes' | 'fireflies' | 'rain' | 'sand';
  lamps: boolean;
  exposure: number;
};

const veg = (v: Partial<Vegetation>): Vegetation => ({ palms: 0, trees: 0, olives: 0, flowers: 0, grass: 0, rocks: 12, ...v });

const base: Preset = {
  sun: [28, 200], night: false, stars: false, moon: false, turbidity: 3.5, rayleigh: 1.8,
  fog: '#cfd6cf', fogDensity: 0.01, terrain: 'garden', ground: ['#6f8240', '#55703a'], water: 'pool',
  veg: veg({ palms: 26, trees: 28, olives: 8, flowers: 420, grass: 2600 }), clouds: 0.3, particles: 'motes', lamps: false, exposure: 0.9,
};

export const PRESETS: Record<SettingName, Preset> = {
  garden: base,
  opening: { ...base, sun: [6, 110], turbidity: 4, rayleigh: 2.2, fog: '#e6d2b4', veg: veg({ palms: 12, trees: 8, flowers: 320, grass: 2000 }), exposure: 0.95 },
  sea: { ...base, sun: [14, 160], terrain: 'shore', water: 'sea', ground: ['#cdb48a', '#b39c70'], fog: '#cfdbe0', fogDensity: 0.008, veg: veg({ palms: 14, rocks: 20 }), particles: 'none', clouds: 0.5 },
  storm: { ...base, sun: [10, 210], turbidity: 18, rayleigh: 0.6, fog: '#5d6670', fogDensity: 0.03, terrain: 'hills', ground: ['#4f5a3c', '#3f4a30'], water: 'none', veg: veg({ trees: 16, grass: 1600 }), clouds: 1, particles: 'rain', exposure: 0.55 },
  meadow: { ...base, sun: [34, 150], terrain: 'hills', water: 'rivers', veg: veg({ trees: 16, flowers: 700, grass: 2600 }), particles: 'motes' },
  cave: { ...base, sun: [8, 250], terrain: 'valley', ground: ['#7d6a52', '#5e503e'], fog: '#bfa98c', water: 'none', veg: veg({ palms: 4, rocks: 60 }), particles: 'dust', clouds: 0.1 },
  light: { ...base, sun: [-3, 240], night: true, stars: true, turbidity: 2, rayleigh: 3, fog: '#2a2436', fogDensity: 0.016, water: 'pool', veg: veg({ palms: 10, olives: 6, flowers: 120, grass: 900 }), particles: 'fireflies', lamps: true, exposure: 0.8 },
  dunes: { ...base, sun: [18, 230], turbidity: 10, rayleigh: 1, terrain: 'dunes', ground: ['#d3a96a', '#c08f52'], fog: '#e2c49a', water: 'none', veg: veg({ rocks: 8 }), particles: 'sand', clouds: 0.05 },
  wind: { ...base, sun: [22, 200], terrain: 'hills', ground: ['#9a8f60', '#7a7a48'], water: 'none', veg: veg({ trees: 6, grass: 3200 }), particles: 'dust', clouds: 0.8 },
  mountain: { ...base, sun: [20, 120], terrain: 'mountains', ground: ['#7a6e5a', '#5f6650'], fog: '#c8cdd0', water: 'none', veg: veg({ trees: 10, grass: 1200, rocks: 50 }), clouds: 0.6 },
  stars: { ...base, sun: [-14, 200], night: true, stars: true, turbidity: 1, rayleigh: 0.2, fog: '#0b1020', fogDensity: 0.01, terrain: 'dunes', ground: ['#3a3446', '#2a2636'], water: 'none', veg: veg({ rocks: 10 }), particles: 'none', clouds: 0, exposure: 0.7 },
  moon: { ...base, sun: [-12, 200], night: true, stars: true, moon: true, turbidity: 1, rayleigh: 0.3, fog: '#16203a', fogDensity: 0.01, terrain: 'dunes', ground: ['#4a4a5e', '#36364a'], water: 'none', veg: veg({ palms: 6, rocks: 12 }), particles: 'none', clouds: 0.1, exposure: 0.75 },
  creation: { ...base, sun: [30, 140], terrain: 'shore', water: 'sea', ground: ['#7f8a4a', '#5f7a3a'], veg: veg({ palms: 26, trees: 14, olives: 6, flowers: 600, grass: 2600 }), particles: 'motes', clouds: 0.4 },
  dawn: { ...base, sun: [2, 100], turbidity: 3, rayleigh: 3, fog: '#e7b994', fogDensity: 0.014, terrain: 'hills', water: 'none', veg: veg({ palms: 10, grass: 1400 }), particles: 'dust', exposure: 1 },
  sun: { ...base, sun: [55, 180], turbidity: 8, rayleigh: 0.8, terrain: 'dunes', ground: ['#d6b47c', '#c49a60'], fog: '#ead7b5', water: 'none', veg: veg({ palms: 8, rocks: 10 }), particles: 'none', clouds: 0.1 },
  night: { ...base, sun: [-10, 200], night: true, stars: true, moon: false, turbidity: 1, rayleigh: 0.2, fog: '#0d1322', fogDensity: 0.012, ground: ['#36384a', '#2a3030'], veg: veg({ palms: 12, grass: 900 }), particles: 'fireflies', exposure: 0.7 },
  morning: { ...base, sun: [38, 120], turbidity: 4, rayleigh: 1.6, veg: veg({ palms: 14, trees: 12, flowers: 300, grass: 2200 }) },
  orchard: { ...base, sun: [30, 170], terrain: 'hills', water: 'none', veg: veg({ trees: 30, olives: 30, grass: 2400, flowers: 200 }) },
  'desert-dusk': { ...base, sun: [1, 260], turbidity: 12, rayleigh: 2.4, terrain: 'valley', ground: ['#b48a5c', '#8e6a44'], fog: '#c98f62', fogDensity: 0.016, water: 'none', veg: veg({ rocks: 40 }), particles: 'sand', clouds: 0.2 },
};
