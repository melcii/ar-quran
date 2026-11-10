// Surah Az-Zukhruf: gold or good (43:33-35). The street is full of shining
// things: a silver door, silver stairs, a silver couch, gold ornaments. The
// surah says all that is "only the enjoyment of worldly life". Around the
// street are real needs: a dry garden bed, a dark path, a cold night
// shelter, an empty seed store. Pick up something and bring it to a need.
// Gold and silver shine, but they meet none of the needs; each need is met
// only by the plain thing that helps. The street and its needs are a game
// idea based on the ayahs. No one is shown.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { AdornTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { held: number; ver: number };
const fresh = (): Live => ({ held: -1, ver: 0 });

const metOf = (task: AdornTask, s: MechSave) => (s.done.includes(task.id) ? task.needs.map((_, i) => i) : s.prog[task.id] ?? []);
const usedItems = (task: AdornTask, met: number[]) => met.map((j) => task.needs[j].item);

export const Adorn: Mechanic<AdornTask> = {
  total: (task) => task.needs.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const met = metOf(task, env.save);
    const used = usedItems(task, met);
    const out = task.items.flatMap((it, i) =>
      used.includes(i) || L.held === i
        ? []
        : [{ key: `take:${task.id}:${i}`, pos: env.v3(it.at), label: `Pick up the ${it.name}`, reach: 2.4, run: () => {
            L.held = i;
            L.ver++;
          } }],
    );
    if (L.held >= 0) {
      const it = task.items[L.held];
      task.needs.forEach((n, j) => {
        if (met.includes(j)) return;
        out.push({ key: `give:${task.id}:${j}`, pos: env.v3(n.at), label: `Bring the ${it.name} to ${n.name}`, reach: 2.8, run: () => {
          const i = L.held;
          L.held = -1;
          L.ver++;
          if (task.items[i].gold) {
            env.api.note(`${task.id}/x`, i);
            env.api.hint(`The ${task.items[i].name} shines, but it does nothing for ${n.name}. You put it back. "All that is only the enjoyment of worldly life" (43:35).`);
            return;
          }
          if (n.item !== i) {
            env.api.hint(`The ${task.items[i].name} is useful, but not for ${n.name}. You put it back for now.`);
            return;
          }
          env.api.progress(task.id, j);
          env.api.hint(n.done);
        } });
      });
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const met = metOf(task, env.save);
    if (met.length >= task.needs.length) return;
    return `Needs met: ${met.length} of ${task.needs.length}${L.held >= 0 ? ` · carrying the ${task.items[L.held].name}` : ''}`;
  },
  solve(task, api) {
    const met = metOf(task, api.save());
    const j = task.needs.findIndex((_, k) => !met.includes(k));
    if (j >= 0) api.progress(task.id, j);
  },
  View: AdornView,
};

function Shape({ it }: { it: AdornTask['items'][number] }) {
  const shine = it.gold ? M(it.shape === 'ornament' ? '#e8c050' : '#d8dce4', { metal: 0.85, rough: 0.2 }) : null;
  switch (it.shape) {
    case 'door':
      return (
        <mesh material={shine!} position-y={0.9} castShadow>
          <boxGeometry args={[0.9, 1.8, 0.1]} />
        </mesh>
      );
    case 'couch':
      return (
        <group>
          <mesh material={shine!} position-y={0.3} castShadow>
            <boxGeometry args={[1.4, 0.3, 0.6]} />
          </mesh>
          <mesh material={shine!} position={[0, 0.6, -0.25]}>
            <boxGeometry args={[1.4, 0.5, 0.1]} />
          </mesh>
        </group>
      );
    case 'stair':
      return (
        <group>
          {[0, 1, 2].map((k) => (
            <mesh key={k} material={shine!} position={[0, 0.15 + k * 0.3, -k * 0.3]} castShadow>
              <boxGeometry args={[0.9, 0.3, 0.3]} />
            </mesh>
          ))}
        </group>
      );
    case 'ornament':
      return (
        <mesh material={shine!} position-y={0.5} rotation-x={Math.PI / 2} castShadow>
          <torusGeometry args={[0.3, 0.08, 8, 16]} />
        </mesh>
      );
    case 'jar':
      return (
        <mesh material={M('#b8784a')} position-y={0.35} castShadow>
          <cylinderGeometry args={[0.18, 0.24, 0.7, 10]} />
        </mesh>
      );
    case 'lamp':
      return (
        <group>
          <mesh material={M('#a0784a')} position-y={0.12}>
            <cylinderGeometry args={[0.16, 0.2, 0.24, 10]} />
          </mesh>
          <mesh position-y={0.32}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color="#ffd890" toneMapped={false} />
          </mesh>
        </group>
      );
    case 'blanket':
      return (
        <mesh material={M('#8a5a6a')} position-y={0.15} castShadow>
          <boxGeometry args={[0.7, 0.3, 0.5]} />
        </mesh>
      );
    default:
      return (
        <mesh material={M('#c8b088')} position-y={0.3} castShadow>
          <sphereGeometry args={[0.3, 10, 8]} />
        </mesh>
      );
  }
}

function AdornView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<AdornTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const met = metOf(task, data);
  const used = usedItems(task, met);
  const hand = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = hand.current;
    if (!g) return;
    g.position.set(player.pos.x + Math.sin(player.yaw) * 0.5, player.pos.y + 0.5, player.pos.z + Math.cos(player.yaw) * 0.5);
    g.rotation.y = player.yaw;
  });
  return (
    <group>
      {task.items.map((it, i) => {
        if (L.held === i) return null;
        const [x, z] = it.at;
        const y = t.floorY(x, z);
        // A used item stays where it helped.
        const j = met.find((k) => task.needs[k].item === i);
        const [px, pz] = j != null ? [task.needs[j].at[0] + 0.8, task.needs[j].at[1]] : [x, z];
        return (
          <group key={i} position={[px, j != null ? t.floorY(px, pz) : y, pz]} {...(used.includes(i) ? {} : tap(() => act(`take:${task.id}:${i}`)))}>
            <Shape it={it} />
            {!used.includes(i) && L.held < 0 && <Halo on={active} />}
          </group>
        );
      })}
      {task.needs.map((n, j) => {
        const [x, z] = n.at;
        const y = t.floorY(x, z);
        const ok = met.includes(j);
        return (
          <group key={`n${j}`} position={[x, y, z]} {...tap(() => act(`give:${task.id}:${j}`))}>
            <mesh material={M('#6a4a2a')} position-y={0.55}>
              <cylinderGeometry args={[0.05, 0.06, 1.1, 6]} />
            </mesh>
            <mesh material={M(ok ? '#9ac07a' : '#d8c8a8')} position-y={1.15}>
              <boxGeometry args={[0.6, 0.34, 0.05]} />
            </mesh>
            {!ok && L.held >= 0 && <Halo on={active} />}
          </group>
        );
      })}
      <group ref={hand} scale={0.6}>
        {L.held >= 0 && <Shape it={task.items[L.held]} />}
      </group>
    </group>
  );
}
