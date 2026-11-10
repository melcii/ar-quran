// Surah Qaf: life given to dead earth (50:9-11, "We sent down blessed rain
// from the sky and made grow thereby gardens and grain ... and lofty palm
// trees ... and We have given life thereby to a dead land. Thus is the
// coming forth"). Three glass-sided growing boxes stand in a garden shed, so
// you can see under the soil. Sow each seed at its own depth (tiny seeds
// just under the surface, bigger seeds deeper: about two or three times
// their own size, the gardener's rule), then water
// the boxes and wait, day by day, and watch roots go down and shoots come
// up out of the dry earth. The boxes are a game idea; the growing is real.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion } from '@/ark/shared';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { RootboxTask } from '../types';
import type { Mechanic, MechSave } from './base';

const DEPTH = ['Near the top', 'In the middle', 'Deep down'];
/** Watered today, before the night passes (shared by the panel and the boxes). */
const wet: Record<string, boolean> = {};

const all = (task: RootboxTask) => task.seeds.length + task.days;
const doneOf = (task: RootboxTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const sown = (task: RootboxTask, d: number[]) => task.seeds.map((_, i) => i).filter((i) => d.includes(i)).length;
const days = (task: RootboxTask, d: number[]) => Array.from({ length: task.days }, (_, k) => k).filter((k) => d.includes(task.seeds.length + k)).length;

export const Rootbox: Mechanic<RootboxTask> = {
  total: all,
  uses(task, env) {
    if (doneOf(task, env.save).length >= all(task)) return [];
    return [{ key: `box:${task.id}`, pos: env.v3(task.at), label: 'Tend the growing boxes', reach: 3, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const s = sown(task, d);
    if (s < task.seeds.length) return `Seeds sown: ${s} of ${task.seeds.length}`;
    const k = days(task, d);
    if (k < task.days) return `Day ${k + 1} of ${task.days}: water the boxes, then wait for tomorrow`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: RootboxView,
  Panel: RootboxPanel,
};

function RootboxPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<RootboxTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const s = sown(task, d);
  const k = days(task, d);
  const [msg, setMsg] = useState('');
  const [, setW] = useState(0);
  if (s < task.seeds.length) {
    const seed = task.seeds[s];
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ContentLabel kind="activity" extra="a growing game written for this app" />
        <Text style={st.cardTitle}>{`Sow the ${seed.name}`}</Text>
        <Text style={st.cardText}>{msg || `${seed.why} How deep should it go?`}</Text>
        <View style={st.row}>
          {DEPTH.map((name, i) => (
            <Pressable
              key={i}
              style={st.btnGhost}
              accessibilityLabel={`Sow the ${seed.name}: ${name}`}
              onPress={() => {
                if (i + 1 !== seed.depth) {
                  api.note(`${task.id}/x`, s * 3 + i);
                  setMsg(i + 1 < seed.depth ? `Too shallow: near the top it would dry out before its roots took hold. ${seed.why}` : `Too deep: its shoot would run out of strength before it reached the light. ${seed.why}`);
                  return;
                }
                api.progress(task.id, s);
                setMsg('');
              }}
            >
              <Text style={st.btnGhostText}>{name}</Text>
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
  if (k >= task.days) return null;
  const isWet = !!wet[task.id];
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a growing game written for this app" />
      <Text style={st.cardTitle}>{`Day ${k + 1} of ${task.days}`}</Text>
      <Text style={st.cardText}>{msg || (isWet ? 'The soil is dark and damp. Now wait for tomorrow.' : 'The soil in the boxes is dry and pale. Water it first.')}</Text>
      <View style={st.row}>
        <Pressable
          style={isWet ? st.btnGhost : st.btn}
          accessibilityLabel="Water the boxes"
          onPress={() => {
            wet[task.id] = true;
            setMsg('You pour water from the rain barrel. The soil darkens.');
            setW((v) => v + 1);
          }}
        >
          <Text style={isWet ? st.btnGhostText : st.btnText}>Water the boxes</Text>
        </Pressable>
        <Pressable
          style={isWet ? st.btn : st.btnGhost}
          accessibilityLabel="Wait for tomorrow"
          onPress={() => {
            if (!wet[task.id]) {
              api.note(`${task.id}/dry`, k);
              setMsg('Without water the seeds will not grow. Water the boxes before the night.');
              return;
            }
            wet[task.id] = false;
            api.progress(task.id, task.seeds.length + k);
            setMsg(k + 1 < task.days ? 'A night passes. Look at the boxes: something has changed under the soil and above it.' : '');
            if (k + 1 >= task.days) onClose();
          }}
        >
          <Text style={isWet ? st.btnText : st.btnGhostText}>Wait for tomorrow</Text>
        </Pressable>
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Box({ task, i, x, sownHere, grown }: { task: RootboxTask; i: number; x: number; sownHere: boolean; grown: number }) {
  const seed = task.seeds[i];
  const H = 0.9; // soil height in the box
  const sy = 0.1 + H - (seed.depth / 3.4) * H; // where the seed lies
  const g = useRef(grown);
  const root = useRef<THREE.Mesh>(null);
  const shoot = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    g.current += (grown - g.current) * Math.min(1, dt * (motion.reduced ? 10 : 0.8));
    const k = g.current;
    if (root.current) {
      root.current.scale.y = Math.max(0.01, k);
      root.current.position.y = sy - (0.35 * k) / 2;
    }
    const sh = shoot.current;
    if (sh) {
      // The shoot reaches the surface after the first day, then rises above it.
      const up = Math.max(0, k * 1.6 - 0.4);
      sh.scale.set(1, Math.max(0.01, up), 1);
      sh.visible = up > 0.02;
    }
  });
  return (
    <group position-x={x}>
      {/* Glass box with soil, so you can see under the ground. */}
      <mesh position-y={0.1 + H / 2}>
        <boxGeometry args={[0.8, H, 0.5]} />
        <meshStandardMaterial color="#d8e8f0" transparent opacity={0.25} />
      </mesh>
      <mesh material={M('#6a4a30')} position-y={0.1 + H / 2 - 0.02}>
        <boxGeometry args={[0.74, H - 0.06, 0.44]} />
      </mesh>
      <mesh material={M('#5a3a22')} position-y={0.05}>
        <boxGeometry args={[0.86, 0.1, 0.56]} />
      </mesh>
      {sownHere && (
        <>
          <mesh material={M('#e8d4a0')} position={[0, sy, 0.23]}>
            <sphereGeometry args={[seed.depth === 3 ? 0.06 : 0.04, 8, 6]} />
          </mesh>
          <mesh ref={root} material={M('#f0e8d0')} position={[0, sy, 0.23]}>
            <cylinderGeometry args={[0.008, 0.012, 0.35, 5]} />
          </mesh>
          <group ref={shoot} position={[0, 0.1 + H - 0.04, 0]}>
            <mesh material={M('#6a9a3a')} position-y={0.3}>
              <cylinderGeometry args={[0.012, 0.018, 0.6, 5]} />
            </mesh>
            {seed.depth === 3 &&
              [-1, 1].map((s) => (
                <mesh key={s} material={M('#5a8a3a')} position={[s * 0.07, 0.58, 0]} scale={[1, 0.4, 0.7]}>
                  <sphereGeometry args={[0.08, 8, 6]} />
                </mesh>
              ))}
            {seed.depth !== 3 && (
              <mesh material={M('#5a8a3a')} position={[0.03, 0.5, 0]} rotation-z={-0.25}>
                <coneGeometry args={[0.015, 0.5, 4]} />
              </mesh>
            )}
          </group>
        </>
      )}
    </group>
  );
}

function RootboxView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<RootboxTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const s = sown(task, d);
  const grown = days(task, d) / task.days;
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} {...tap(() => act(`box:${task.id}`))}>
      <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.4} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.8, 1]} />
      </mesh>
      <group position-y={0.8}>
        {task.seeds.map((_, i) => (
          <Box key={i} task={task} i={i} x={(i - (task.seeds.length - 1) / 2) * 1} sownHere={i < s} grown={grown} />
        ))}
      </group>
      {/* The rain barrel */}
      <mesh material={M('#7a5232', { map: 'planks' })} position={[2.1, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.34, 1, 12]} />
      </mesh>
      {d.length < all(task) && <Halo on={active} />}
    </group>
  );
}
