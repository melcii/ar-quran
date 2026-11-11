// Surah An-Naml's hoopoe chapter: the roll call of the birds (27:20, "He
// took attendance of the birds and said, 'Why do I not see the hoopoe?'").
// Birds sit on perches around the clearing, each a different kind. Walk to
// each perch and tick its bird off the list; then say which bird on the list
// is missing. When you name the hoopoe, it flies in to its empty perch with
// its news (27:22). Sulayman is never shown; the birds are only birds.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion } from '@/ark/shared';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { RollcallTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { ver: number; landed: number };
const fresh = (): Live => ({ ver: 0, landed: -1 });

/** Steps: one per bird present, then naming the missing one. */
const doneOf = (task: RollcallTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.birds.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
const present = (task: RollcallTask) => task.birds.map((b, i) => i).filter((i) => i !== task.missing);

export const Rollcall: Mechanic<RollcallTask> = {
  total: (task) => task.birds.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const out = present(task)
      .filter((i) => !d.includes(i))
      .map((i) => ({ key: `bird:${task.id}:${i}`, pos: env.v3(task.birds[i].at), label: `Tick the ${task.birds[i].name} off the list`, reach: 2.6, run: () => env.api.progress(task.id, i) }));
    if (present(task).every((i) => d.includes(i)) && !d.includes(task.missing))
      out.push({ key: `list:${task.id}`, pos: env.v3(task.board), label: 'Who is missing?', reach: 2.8, run: () => env.api.panel(task) });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const n = present(task).filter((i) => d.includes(i)).length;
    if (n < present(task).length) return `Birds ticked off: ${n} of ${present(task).length}`;
    if (!d.includes(task.missing)) return 'Every perch is checked. Go to the list board: who is missing?';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    present(task).forEach((i) => d.includes(i) || api.progress(task.id, i));
    api.progress(task.id, task.missing);
  },
  View: RollcallView,
  Panel: RollcallPanel,
};

function RollcallPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<RollcallTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [msg, setMsg] = useState('Every perch has been checked. Which bird on the list did you not find?');
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a roll call written for this app" />
      <Text style={st.cardText}>{msg}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {task.birds.map((b, i) => (
          <Pressable
            key={i}
            accessibilityLabel={`The ${b.name} is missing`}
            style={[st.btnGhost, { borderColor: b.color }]}
            onPress={() => {
              if (i !== task.missing) {
                api.note(`${task.id}/x`, i);
                setMsg(`The ${b.name} is on its perch: you ticked it off. Look at the list again.`);
                return;
              }
              api.progress(task.id, i);
              onClose();
            }}
          >
            <Text style={st.btnGhostText}>{`${d.includes(i) ? '✓ ' : ''}${b.name}`}</Text>
          </Pressable>
        ))}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Bird({ color, crest, ticked }: { color: string; crest: boolean; ticked: boolean }) {
  return (
    <group>
      <mesh material={M(color)} position-y={0.22} scale={[0.6, 0.55, 1]} castShadow>
        <sphereGeometry args={[0.24, 12, 10]} />
      </mesh>
      <mesh material={M(color)} position={[0, 0.42, 0.18]}>
        <sphereGeometry args={[0.13, 12, 10]} />
      </mesh>
      <mesh material={M('#3a2a1a')} position={[0, 0.42, 0.33]} rotation-x={Math.PI / 2}>
        <coneGeometry args={[0.025, crest ? 0.2 : 0.1, 6]} />
      </mesh>
      {crest &&
        [-0.06, 0, 0.06].map((x, k) => (
          <mesh key={k} material={M('#e09a40')} position={[x, 0.58, 0.12 - k * 0.02]} rotation-x={-0.5}>
            <coneGeometry args={[0.03, 0.16, 5]} />
          </mesh>
        ))}
      {ticked && (
        <mesh position-y={0.85}>
          <torusGeometry args={[0.12, 0.025, 6, 14]} />
          <meshBasicMaterial color="#ffe8a0" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Perch({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh material={M('#7a5232')} position-y={0.6}>
        <cylinderGeometry args={[0.05, 0.07, 1.2, 6]} />
      </mesh>
      <mesh material={M('#7a5232')} position-y={1.2} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
      </mesh>
    </group>
  );
}

function RollcallView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<RollcallTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const d = doneOf(task, data);
  const found = d.includes(task.missing);
  const fly = useRef<THREE.Group>(null);
  const t0 = useRef(-1);
  const [mx, mz] = task.birds[task.missing].at;
  const my = t.floorY(mx, mz) + 1.2;
  useFrame((s) => {
    const g = fly.current;
    if (!g) return;
    g.visible = found;
    if (!found) return;
    if (t0.current < 0) t0.current = s.clock.elapsedTime;
    // The hoopoe flies in from high over the trees and lands on its perch.
    const k = motion.reduced ? 1 : Math.min(1, (s.clock.elapsedTime - t0.current) / 4);
    const e = 1 - (1 - k) ** 3;
    g.position.set(mx + (1 - e) * 18, my + (1 - e) * 10 + Math.sin(k * Math.PI) * 1.5, mz - (1 - e) * 12);
  });
  const [bx, bz] = task.board;
  return (
    <group>
      {task.birds.map((b, i) => {
        const [x, z] = b.at;
        const y = t.floorY(x, z);
        return (
          <group key={i} {...tap(() => act(`bird:${task.id}:${i}`))}>
            <Perch x={x} y={y} z={z} />
            {i !== task.missing && (
              <group position={[x, y + 1.2, z]}>
                <Bird color={b.color} crest={false} ticked={d.includes(i)} />
              </group>
            )}
            {i !== task.missing && !d.includes(i) && (
              <group position={[x, y, z]}>
                <Halo on={active} />
              </group>
            )}
          </group>
        );
      })}
      <group ref={fly}>
        <Bird color={task.birds[task.missing].color} crest ticked={false} />
      </group>
      <group position={[bx, t.floorY(bx, bz), bz]} {...tap(() => act(`list:${task.id}`))}>
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={1.1} castShadow>
          <boxGeometry args={[1.4, 1.1, 0.1]} />
        </mesh>
        <mesh material={M('#6a4a2a')} position-y={0.4}>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 6]} />
        </mesh>
        {present(task).every((i) => d.includes(i)) && !found && <Halo on={active} />}
      </group>
    </group>
  );
}
