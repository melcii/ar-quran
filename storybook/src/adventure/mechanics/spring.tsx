// Surah Sad's own play: reading the land for water. In a dry valley a few
// places could hide water. The board says which signs go together where water
// is close: reeds, damp dark soil, small birds coming down to drink, ferns in
// the shade, and never a white salt crust. Look closely at each place and dig
// only where every sign is there. A dry hole tells you which sign was
// missing. The spring that came for Ayyub when he was told to strike the
// ground (38:42) was Allah's gift; it is read, and Ayyub is not shown.
import { useFrame } from '@react-three/fiber';
import { useState } from 'react';
import { motion } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2, Terrain } from '../terrain';
import type { SpringSign, SpringTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { dug: string[]; ver: number };
const fresh = (): Live => ({ dug: [], ver: 0 });

const found = (task: SpringTask, s: MechSave) => (s.done.includes(task.id) ? task.rounds.map((_, i) => i) : s.prog[task.id] ?? []);
const WORD: Record<SpringSign, string> = { reeds: 'reeds', damp: 'damp dark soil', birds: 'small birds coming down to drink', ferns: 'ferns in the shade', salt: 'a white salt crust' };
const list = (a: string[]) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
/** Does a place have every sign the round needs (and no salt, when the round warns of it)? */
export const good = (need: SpringSign[], signs: SpringSign[]) => need.every((n) => (n === 'salt' ? !signs.includes('salt') : signs.includes(n)));
export const rule = (need: SpringSign[]) => {
  const yes = need.filter((n) => n !== 'salt').map((n) => WORD[n]);
  return `${list(yes)}${need.includes('salt') ? ', but no white salt crust' : ''}`;
};

export const Spring: Mechanic<SpringTask> = {
  total: (task) => task.rounds.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const k = found(task, env.save).length;
    const r = task.rounds[k];
    const out: MechUse[] = [];
    if (!r) return out;
    r.spots.forEach((sp, j) => {
      if (L.dug.includes(`${k}:${j}`)) return;
      out.push({ key: `dig:${task.id}:${k}:${j}`, pos: env.v3(sp.at), label: 'Dig here for water', reach: 1.8, run: () => {
        L.dug.push(`${k}:${j}`);
        L.ver++;
        if (good(r.need, sp.signs)) {
          env.api.progress(task.id, k);
          env.api.open({ kind: 'reading', reading: r.reading });
          return;
        }
        env.api.note(`${task.id}/x`, k);
        const miss = r.need.filter((n) => (n === 'salt' ? sp.signs.includes('salt') : !sp.signs.includes(n)));
        env.api.hint(`A dry hole. ${miss.map((n) => (n === 'salt' ? 'There was a white salt crust here' : `There were no ${WORD[n]}`)).join('; ')}. Look closely at the other places.`);
      } });
    });
    return out;
  },
  frame(task, env) {
    const k = found(task, env.save).length;
    const r = task.rounds[k];
    if (!r) return;
    return `Round ${k + 1} of ${task.rounds.length} · water is close where you find ${rule(r.need)}`;
  },
  View: SpringView,
};

function Signs({ at, signs, t }: { at: P2; signs: SpringSign[]; t: Terrain }) {
  const y = t.floorY(at[0], at[1]);
  return (
    <group position={[at[0], y, at[1]]}>
      <mesh material={M(signs.includes('damp') ? '#4a3a2a' : '#d8c094')} position-y={0.04} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[1.5, 24]} />
      </mesh>
      {signs.includes('salt') && (
        <mesh material={M('#f4f2ea')} position-y={0.06} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.6, 1.3, 20]} />
        </mesh>
      )}
      {signs.includes('reeds') &&
        Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} material={M(i % 2 ? '#7a9a3a' : '#8aa848')} position={[Math.cos(i * 2.3) * 1.1, 0.7, Math.sin(i * 2.3) * 1.1]} rotation-z={Math.sin(i) * 0.12}>
            <cylinderGeometry args={[0.03, 0.05, 1.4, 5]} />
          </mesh>
        ))}
      {signs.includes('ferns') &&
        Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} material={M('#4f8a3a')} position={[Math.cos(i * 1.26 + 0.4) * 0.9, 0.25, Math.sin(i * 1.26 + 0.4) * 0.9]} rotation={[0.5, i * 1.26, 0]} scale={[0.5, 0.2, 1]}>
            <sphereGeometry args={[0.45, 8, 6]} />
          </mesh>
        ))}
      {signs.includes('birds') && <Birds />}
    </group>
  );
}

function Birds() {
  const [g] = useState(() => ({ t: Math.random() * 10 }));
  const [, setN] = useState(0);
  useFrame((_, dt) => {
    g.t += dt;
    if (!motion.reduced) setN((n) => (n + 1) % 30);
  });
  return (
    <group>
      {[0, 1, 2].map((i) => {
        const hop = motion.reduced ? 0 : Math.max(0, Math.sin(g.t * 3 + i * 2)) * 0.12;
        return (
          <group key={i} position={[Math.cos(i * 2.1) * 0.6, 0.1 + hop, Math.sin(i * 2.1) * 0.6]} rotation-y={i * 2}>
            <mesh material={M('#7a5a3a')} scale={[0.7, 0.6, 1]}>
              <sphereGeometry args={[0.1, 8, 6]} />
            </mesh>
            <mesh material={M('#7a5a3a')} position={[0, 0.07, 0.08]}>
              <sphereGeometry args={[0.055, 8, 6]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function SpringView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<SpringTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const done = found(task, data);
  const k = done.length;
  return (
    <group>
      {task.rounds.map((r, ri) =>
        r.spots.map((sp, j) => {
          const y = t.floorY(sp.at[0], sp.at[1]);
          const wet = done.includes(ri) && good(r.need, sp.signs);
          const hole = L.dug.includes(`${ri}:${j}`) || wet;
          return (
            <group key={`${ri}:${j}`} {...tap(() => act(`dig:${task.id}:${ri}:${j}`))}>
              <Signs at={sp.at} signs={sp.signs} t={t} />
              {hole && (
                <mesh material={M(wet ? '#5aa0c8' : '#6a5440', wet ? { rough: 0.15 } : {})} position={[sp.at[0], y + 0.08, sp.at[1]]} rotation-x={-Math.PI / 2}>
                  <circleGeometry args={[wet ? 0.8 : 0.5, 20]} />
                </mesh>
              )}
              {ri === k && !hole && (
                <group position={[sp.at[0], y, sp.at[1]]}>
                  <Halo on={active} />
                </group>
              )}
            </group>
          );
        }),
      )}
      <mesh material={M('#7a5a3a', { map: 'planks' })} position={[task.board[0], t.floorY(task.board[0], task.board[1]) + 1.4, task.board[1]]}>
        <boxGeometry args={[1.8, 1, 0.1]} />
      </mesh>
      <mesh material={M('#5a3e26')} position={[task.board[0], t.floorY(task.board[0], task.board[1]) + 0.6, task.board[1]]}>
        <cylinderGeometry args={[0.06, 0.07, 1.2, 6]} />
      </mesh>
    </group>
  );
}
