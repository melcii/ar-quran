// Surah Fatir's own play: the shade atlas (35:27-28, "fruits of varying
// colors ... in the mountains are tracts, white and red of varying shades and
// [some] extremely black ... and grazing livestock are various colors
// similarly"). Gather stones from the banded cliff, fruits from the orchard
// and wool from the shearing pen, and lay each row of the atlas table from
// the lightest at the left end to the darkest at the right. A row in the
// right order is read; a row out of order sends the misplaced things back.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2 } from '../terrain';
import type { ShadesTask } from '../types';
import { live, type Mechanic, type MechSave, type MechUse } from './base';

type Live = { carry: [number, number] | null; slots: (number | null)[][]; ver: number };
const fresh = (task: ShadesTask) => (): Live => ({ carry: null, slots: task.rows.map((r) => r.items.map(() => null)), ver: 0 });

const rowsDone = (task: ShadesTask, s: MechSave) => (s.done.includes(task.id) ? task.rows.map((_, i) => i) : s.prog[task.id] ?? []);
/** Item indices of a row from lightest to darkest. */
export const order = (task: ShadesTask, r: number) => task.rows[r].items.map((_, i) => i).sort((a, b) => task.rows[r].items[b].light - task.rows[r].items[a].light);
export const slotAt = (task: ShadesTask, r: number, k: number): P2 => {
  const n = task.rows[r].items.length;
  return [task.table[0] + (k - (n - 1) / 2) * 1.6, task.table[1] + (r - (task.rows.length - 1) / 2) * 2.4];
};

export const Shades: Mechanic<ShadesTask> = {
  total: (task) => task.rows.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const done = rowsDone(task, env.save);
    const out: MechUse[] = [];
    if (L.carry == null) {
      task.rows.forEach((row, r) => {
        if (done.includes(r)) return;
        row.items.forEach((it, i) => {
          if (L.slots[r].includes(i)) return;
          out.push({ key: `take:${task.id}:${r}:${i}`, pos: env.v3(it.at), label: `Pick up the ${it.label}`, reach: 1.6, run: () => {
            L.carry = [r, i];
            L.ver++;
          } });
        });
      });
      return out;
    }
    const [r, i] = L.carry;
    const it = task.rows[r].items[i];
    L.slots[r].forEach((v, k) => {
      if (v != null) return;
      out.push({ key: `place:${task.id}:${r}:${k}`, pos: env.v3(slotAt(task, r, k)), label: `Put the ${it.label} in place ${k + 1} of the ${task.rows[r].name} row`, reach: 1.3, run: () => {
        L.slots[r][k] = i;
        L.carry = null;
        L.ver++;
        if (L.slots[r].some((x) => x == null)) return;
        const want = order(task, r);
        const wrong = L.slots[r].map((x, kk) => (x === want[kk] ? -1 : kk)).filter((kk) => kk >= 0);
        if (!wrong.length) {
          env.api.progress(task.id, r);
          env.api.open({ kind: 'reading', reading: task.rows[r].reading });
          return;
        }
        env.api.note(`${task.id}/x`, r);
        wrong.forEach((kk) => (L.slots[r][kk] = null));
        env.api.hint(`Not quite: ${wrong.length} of the ${task.rows[r].name} ${wrong.length === 1 ? 'was' : 'were'} out of order and went back. Lightest at the left end, darkest at the right.`);
      } });
    });
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh(task));
    const done = rowsDone(task, env.save);
    if (done.length >= task.rows.length) return;
    const c = L.carry ? ` · carrying the ${task.rows[L.carry[0]].items[L.carry[1]].label}: put it in the ${task.rows[L.carry[0]].name} row` : '';
    return `Atlas rows in order, lightest to darkest: ${done.length} of ${task.rows.length}${c}`;
  },
  View: ShadesView,
};

function Thing({ shape, color }: { shape: 'stone' | 'fruit' | 'wool'; color: string }) {
  if (shape === 'stone')
    return (
      <mesh material={M(color, { rough: 0.9 })} position-y={0.22} castShadow>
        <dodecahedronGeometry args={[0.24, 0]} />
      </mesh>
    );
  if (shape === 'fruit')
    return (
      <group position-y={0.22}>
        <mesh material={M(color, { rough: 0.5 })} castShadow>
          <sphereGeometry args={[0.2, 14, 10]} />
        </mesh>
        <mesh material={M('#5a4a2a')} position-y={0.22}>
          <cylinderGeometry args={[0.015, 0.015, 0.1, 5]} />
        </mesh>
      </group>
    );
  return (
    <mesh material={M(color, { rough: 1 })} position-y={0.2} rotation-x={Math.PI / 2} castShadow>
      <torusGeometry args={[0.16, 0.09, 8, 16]} />
    </mesh>
  );
}

function ShadesView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<ShadesTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh(task));
  const [, setVer] = useState(0);
  const done = rowsDone(task, data);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const [tx, tz] = task.table;
  const ty = t.floorY(tx, tz);
  const w = Math.max(...task.rows.map((r) => r.items.length)) * 1.6 + 0.6;
  const d = task.rows.length * 2.4;
  return (
    <group>
      {/* The atlas: a long low table with a light end and a dark end. */}
      {task.rows.map((_, r) => (
        <mesh key={`b${r}`} material={M('#9a7a52', { map: 'planks' })} position={[tx, ty + 0.25, slotAt(task, r, 0)[1]]} receiveShadow castShadow>
          <boxGeometry args={[w, 0.5, 0.9]} />
        </mesh>
      ))}
      <mesh material={M('#f4ecd8')} position={[tx - w / 2 - 0.2, ty + 0.5, tz]}>
        <boxGeometry args={[0.3, 1, d]} />
      </mesh>
      <mesh material={M('#2a2622')} position={[tx + w / 2 + 0.2, ty + 0.5, tz]}>
        <boxGeometry args={[0.3, 1, d]} />
      </mesh>
      {task.rows.map((row, r) =>
        row.items.map((_, k) => {
          const [sx, sz] = slotAt(task, r, k);
          const shown = done.includes(r) ? order(task, r)[k] : L.slots[r][k];
          const it = shown != null ? row.items[shown] : null;
          return (
            <group key={`${r}:${k}`} position={[sx, ty + 0.5, sz]} {...tap(() => act(`place:${task.id}:${r}:${k}`))}>
              <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
                <ringGeometry args={[0.3, 0.36, 20]} />
                <meshBasicMaterial color={done.includes(r) ? '#ffe7a0' : '#e8dcc0'} toneMapped={false} />
              </mesh>
              {it && <Thing shape={row.shape} color={it.color} />}
              {!it && L.carry?.[0] === r && <Halo on={active} />}
            </group>
          );
        }),
      )}
      {/* Where the things are found: each one where it belongs. */}
      {task.rows.map((row, r) =>
        row.items.map((it, i) => {
          if (done.includes(r) || L.slots[r].includes(i) || (L.carry?.[0] === r && L.carry[1] === i)) return null;
          return (
            <group key={`s${r}:${i}`} position={[it.at[0], t.floorY(it.at[0], it.at[1]), it.at[1]]} {...tap(() => act(`take:${task.id}:${r}:${i}`))}>
              <Thing shape={row.shape} color={it.color} />
              {L.carry == null && <Halo on={active} />}
            </group>
          );
        }),
      )}
      <Held task={task} L={L} />
    </group>
  );
}

function Held({ task, L }: { task: ShadesTask; L: Live }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const h = g.current;
    if (!h) return;
    h.visible = !!L.carry;
    h.position.set(player.pos.x + Math.sin(player.yaw) * 0.55, player.pos.y + 0.55, player.pos.z + Math.cos(player.yaw) * 0.55);
  });
  const row = L.carry ? task.rows[L.carry[0]] : null;
  const it = L.carry && row ? row.items[L.carry[1]] : null;
  return <group ref={g}>{row && it && <Thing shape={row.shape} color={it.color} />}</group>;
}
