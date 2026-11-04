// Bespoke scenery for surahs whose own world has been built. Each scene adds
// landmarks beside the shared path, placed at the designed areas (the
// lanterns), so the walk, lanterns, progress and portals stay the same system.
// Rules: no prophet, person or representation of Allah; unseen things are
// never pictured; events are suggested by the land, not acted out.
import type { ComponentType } from 'react';
import type * as THREE from 'three';
import type { Quality } from '../quality';
import type { Land } from '../terrain';
import type { Passage } from '../SurahWorld';
import { AdiyatScene } from './Adiyat';
import { AbasaScene } from './Abasa';
import { AlaScene } from './Ala';
import { InfitarScene } from './Infitar';
import { InshiqaqScene } from './Inshiqaq';
import { MutaffifinScene } from './Mutaffifin';
import { NabaScene } from './Naba';
import { NaziatScene } from './Naziat';
import { TakwirScene } from './Takwir';
import { AlaqScene } from './Alaq';
import { BaladScene } from './Balad';
import { BurujScene } from './Buruj';
import { FajrScene } from './Fajr';
import { GhashiyahScene } from './Ghashiyah';
import { LaylScene } from './Layl';
import { ShamsScene } from './Shams';
import { TariqScene } from './Tariq';
import { AsrScene } from './Asr';
import { BayyinahScene } from './Bayyinah';
import { DuhaScene } from './Duha';
import { QadrScene } from './Qadr';
import { SharhScene } from './Sharh';
import { TinScene } from './Tin';
import { HumazahScene } from './Humazah';
import { QariahScene } from './Qariah';
import { TakathurScene } from './Takathur';
import { ZalzalahScene } from './Zalzalah';
import { FalaqScene } from './Falaq';
import { KafirunScene } from './Kafirun';
import { KawtharScene } from './Kawthar';
import { MasadScene } from './Masad';
import { MaunScene } from './Maun';
import { NasScene } from './Nas';
import { NasrScene } from './Nasr';
import { QurayshScene } from './Quraysh';
import { FilScene } from './Fil';
import { IkhlasScene } from './Ikhlas';
import { KahfScene } from './Kahf';
import { HujuratScene } from './Hujurat';
import { NamlScene } from './Naml';
import { RahmanScene } from './Rahman';
import { YusufScene } from './Yusuf';
import { FatihaScene } from './Fatiha';
import { HudScene } from './Hud';
import { NahlScene } from './Nahl';
import { NuhScene } from './Nuh';
import { COMPOSED } from './compose/Composed';

export type Stop = { p: Passage; pos: THREE.Vector3 };
export type SceneProps = {
  land: Land;
  stops: Stop[];
  quality: Quality;
  /** Finish one of the design's activities, by its name (for "find" activities played in the scene). */
  complete: (activity: string) => void;
  hint: (text: string) => void;
};

export const SCENES: Record<number, ComponentType<SceneProps>> = {
  ...COMPOSED,
  1: FatihaScene,
  11: HudScene,
  16: NahlScene,
  71: NuhScene,
  12: YusufScene,
  18: KahfScene,
  27: NamlScene,
  49: HujuratScene,
  55: RahmanScene,
  78: NabaScene,
  79: NaziatScene,
  80: AbasaScene,
  81: TakwirScene,
  82: InfitarScene,
  83: MutaffifinScene,
  84: InshiqaqScene,
  85: BurujScene,
  86: TariqScene,
  87: AlaScene,
  88: GhashiyahScene,
  89: FajrScene,
  90: BaladScene,
  91: ShamsScene,
  92: LaylScene,
  93: DuhaScene,
  94: SharhScene,
  95: TinScene,
  96: AlaqScene,
  97: QadrScene,
  98: BayyinahScene,
  99: ZalzalahScene,
  100: AdiyatScene,
  101: QariahScene,
  102: TakathurScene,
  103: AsrScene,
  104: HumazahScene,
  105: FilScene,
  106: QurayshScene,
  107: MaunScene,
  108: KawtharScene,
  109: KafirunScene,
  110: NasrScene,
  111: MasadScene,
  112: IkhlasScene,
  113: FalaqScene,
  114: NasScene,
};

/** The stop for a designed area, by its name in the design record. */
export const stopNamed = (stops: Stop[], name: string) => stops.find((s) => s.p.area?.name === name);
