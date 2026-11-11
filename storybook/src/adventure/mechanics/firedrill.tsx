// Surah Al-Waqi'ah: the fire you kindle (56:71-72, "Have you seen the fire
// that you kindle? Is it you who produced its tree, or are We the
// producer?"). In a stone fire ring lies a bow drill: a wooden board, a
// spindle and a bow, all from trees. Draw the bow back and forth with
// steady strokes, not too fast and not too slow, until the dust in the
// notch smokes and makes an ember. Then tip the ember into a nest of dry
// grass and blow on it gently, a few soft breaths with pauses between, until
// it bursts into flame. The bow drill is a real way of making fire; here it
// is only a game, and fire is only ever lit with a grown-up.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion } from '@/ark/shared';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { FiredrillTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: FiredrillTask, s: MechSave) => (s.done.includes(task.id) ? [0, 1] : s.prog[task.id] ?? []);
const FAST = 220; // ms: quicker strokes than this slip
const SLOW = 900; // ms: slower than this and the heat fades
const BREATHS = 3;

export const Firedrill: Mechanic<FiredrillTask> = {
  total: () => 2,
  uses(task, env) {
    if (doneOf(task, env.save).length >= 2) return [];
    return [{ key: `fire:${task.id}`, pos: env.v3(task.at), label: 'Kneel at the fire ring', reach: 2.4, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (!d.includes(0)) return 'Make an ember with the bow drill';
    if (!d.includes(1)) return 'Blow the ember into a flame, gently';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    api.progress(task.id, d.includes(0) ? 1 : 0);
  },
  View: FiredrillView,
  Panel: FiredrillPanel,
};

function FiredrillPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<FiredrillTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [heat, setHeat] = useState(0);
  const [msg, setMsg] = useState('');
  const last = useRef(0);
  const side = useRef(0);
  const breaths = useRef<number[]>([]);
  const [b, setB] = useState(0);
  if (!d.includes(0)) {
    const stroke = (s: number) => {
      const now = Date.now();
      const gap = now - last.current;
      if (s === side.current && last.current) {
        setMsg('Push, then pull: one stroke each way.');
        return;
      }
      side.current = s;
      last.current = now;
      if (gap < FAST) {
        api.note(`${task.id}/fast`, 1);
        setMsg('Too fast: the spindle slips and jumps out of the notch. Slow, steady strokes.');
        setHeat((h) => Math.max(0, h - 6));
        return;
      }
      if (gap > SLOW) {
        setMsg(heat > 0 ? 'Too slow: the wood cools between strokes. Keep a steady rhythm.' : 'Good. Keep going, steady.');
        setHeat((h) => Math.max(0, h - 4) + 4);
        return;
      }
      const h = heat + 9;
      setHeat(Math.min(100, h));
      setMsg(h < 40 ? 'The spindle squeaks and warms.' : h < 80 ? 'Dark dust gathers in the notch, and a thread of smoke rises.' : 'Smoke curls up thickly...');
      if (h >= 100) {
        api.progress(task.id, 0);
        setMsg('A tiny glowing ember sits in the dust. Now tip it into the grass nest and blow on it gently.');
      }
    };
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ContentLabel kind="activity" extra="a fire-making game; real fire only with a grown-up" />
        <Text style={st.cardTitle}>The bow drill</Text>
        <Text style={st.cardText}>{msg || 'Draw the bow back and forth: push, pull, push, pull, at a steady pace. Not too fast, not too slow.'}</Text>
        <View style={{ height: 14, borderRadius: 7, backgroundColor: '#e8dcc8', overflow: 'hidden' }}>
          <View style={{ width: `${heat}%`, height: 14, backgroundColor: heat < 50 ? '#c8a060' : heat < 85 ? '#d87a3a' : '#e84a2a' }} />
        </View>
        <View style={st.row}>
          <Pressable style={st.btn} accessibilityLabel="Push the bow" onPress={() => stroke(0)}>
            <Text style={st.btnText}>Push ▶</Text>
          </Pressable>
          <Pressable style={st.btn} accessibilityLabel="Pull the bow" onPress={() => stroke(1)}>
            <Text style={st.btnText}>◀ Pull</Text>
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
  if (d.includes(1)) return null;
  const blow = () => {
    const now = Date.now();
    const prev = breaths.current[breaths.current.length - 1] ?? 0;
    if (prev && now - prev < 600) {
      api.note(`${task.id}/hard`, 1);
      breaths.current = [];
      setB(0);
      setMsg('Too quick and too hard: the ember almost went out. Wait a moment between soft breaths, and start again.');
      return;
    }
    breaths.current.push(now);
    const n = breaths.current.length;
    setB(n);
    if (n >= BREATHS) {
      api.progress(task.id, 1);
      onClose();
      return;
    }
    setMsg(n === 1 ? 'The ember glows brighter in the grass.' : 'Smoke pours out of the nest...');
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a fire-making game; real fire only with a grown-up" />
      <Text style={st.cardTitle}>The grass nest</Text>
      <Text style={st.cardText}>{msg || 'Hold the nest up and blow on the ember: one soft breath, wait, another soft breath.'}</Text>
      <Text style={[st.cardText, { fontSize: 14 }]}>{`Soft breaths: ${b} of ${BREATHS}`}</Text>
      <View style={st.row}>
        <Pressable style={st.btn} accessibilityLabel="Blow gently" onPress={blow}>
          <Text style={st.btnText}>Blow gently</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FiredrillView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<FiredrillTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const lit = d.includes(1);
  const flame = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    const k = motion.reduced ? 1 : 1 + Math.sin(s.clock.elapsedTime * 11) * 0.08 + Math.sin(s.clock.elapsedTime * 7.3) * 0.06;
    if (flame.current) flame.current.scale.set(1, k, 1);
    if (light.current) light.current.intensity = lit ? 10 * k : d.includes(0) ? 1.5 : 0;
  });
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} {...tap(() => act(`fire:${task.id}`))}>
      {Array.from({ length: 9 }, (_, k) => (
        <mesh key={k} material={M('#8a8478', { map: 'stone' })} position={[Math.cos((k / 9) * Math.PI * 2) * 0.75, 0.12, Math.sin((k / 9) * Math.PI * 2) * 0.75]} castShadow>
          <dodecahedronGeometry args={[0.2]} />
        </mesh>
      ))}
      {/* The bow drill: board, spindle and bow */}
      <group position={[1.4, 0, 0.3]}>
        <mesh material={M('#a07a4a')} position-y={0.05}>
          <boxGeometry args={[0.7, 0.06, 0.16]} />
        </mesh>
        <mesh material={M('#8a6a3a')} position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
        </mesh>
        <mesh material={M('#7a5a32')} position={[0.1, 0.3, 0.2]} rotation-z={Math.PI / 2}>
          <torusGeometry args={[0.3, 0.02, 5, 12, Math.PI]} />
        </mesh>
      </group>
      {lit && (
        <>
          {[0, 1, 2].map((k) => (
            <mesh key={k} material={M('#6a4a2a')} position={[0, 0.12, 0]} rotation={[0.3, (k * Math.PI) / 3, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
            </mesh>
          ))}
          <group ref={flame} position-y={0.15}>
            <mesh position-y={0.3}>
              <coneGeometry args={[0.22, 0.65, 10]} />
              <meshBasicMaterial color="#ffb040" toneMapped={false} transparent opacity={0.9} />
            </mesh>
            <mesh position-y={0.24}>
              <coneGeometry args={[0.12, 0.4, 8]} />
              <meshBasicMaterial color="#fff0a0" toneMapped={false} />
            </mesh>
          </group>
        </>
      )}
      <pointLight ref={light} position-y={0.8} color="#ffb060" distance={9} intensity={0} />
      {!lit && <Halo on={active} />}
    </group>
  );
}
