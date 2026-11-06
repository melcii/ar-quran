// The composed worlds of the longer surahs: each one is a list of landmarks
// and hands-on activities in content/worlds/compose.json, built from the
// shared pieces (pieces.tsx) and activity templates (acts.tsx).
import type { ComponentType } from 'react';
import spec from '@content/worlds/compose.json';
import type { SceneProps } from '../index';
import { stopNamed } from '../index';
import { NightLight } from '../common';
import { beside, type P3 } from '../kit';
import { Activity, quoteOf, type ActSpec } from './acts';
import { PIECES } from './pieces';

type Place = { area: string; piece: string; dx?: number; dz?: number; r: number; s: number; o: Record<string, unknown> };
type World = { setting: string; night?: boolean; concept: string; places: Place[]; acts: ActSpec[] };
const WORLDS = (spec as unknown as { worlds: Record<string, World> }).worlds;

/** Pieces drawn up in the sky or at the horizon sit at the stop itself. */
const SKY = new Set(['disc', 'horizon', 'constellation', 'shootingStars', 'birds', 'cloud']);

function makeScene(n: number, w: World): ComponentType<SceneProps> {
  function Composed({ land, stops, complete, hint }: SceneProps) {
    return (
      <group>
        {w.night && <NightLight />}
        {w.places.map((pl, i) => {
          const st = stopNamed(stops, pl.area);
          const Piece = PIECES[pl.piece];
          if (!st || !Piece) return null;
          const hasAct = w.acts.some((a) => a.area === pl.area);
          const dx = pl.dx ?? (hasAct ? -7 : 6.5);
          const dz = pl.dz ?? -5.5;
          const p: P3 = SKY.has(pl.piece) && pl.piece !== 'cloud' && pl.piece !== 'birds' ? [st.pos.x + dx, st.pos.y, st.pos.z + dz] : beside(land, st.pos, dx, dz);
          return <Piece key={i} land={land} at={st.pos} p={p} r={pl.r} s={pl.s} o={pl.o} />;
        })}
        {w.acts.map((a, i) => {
          const st = stopNamed(stops, a.area);
          if (!st) return null;
          return <Activity key={a.name} land={land} at={st.pos} a={a} prefix={`${n}-${i}-`} hint={hint} done={() => (complete(a.name), hint(quoteOf(a.quote)))} />;
        })}
      </group>
    );
  }
  Composed.displayName = `Composed${n}`;
  return Composed;
}

/** One scene per composed surah. */
export const COMPOSED: Record<number, ComponentType<SceneProps>> = Object.fromEntries(Object.entries(WORLDS).map(([k, w]) => [Number(k), makeScene(Number(k), w)]));
