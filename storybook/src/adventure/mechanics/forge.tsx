// Surah Al-Hadid (Iron): the village forge (57:25, "We sent down iron,
// wherein is great might and benefits for people"). At the forge, make three
// useful things for the village: a nail, a door hinge and a hoe blade. Pump
// the bellows to heat the iron, and watch its colour: dull and dark is too
// cold to shape (it may crack), glowing red to orange is the working heat,
// and white with sparks is burning (the piece is spoiled). Strike while it
// is at working heat; each blow cools it a little, so heat it again when it
// dulls. Real smiths work this way. The forge and its tools are a game idea.
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion } from '@/ark/shared';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ForgeTask } from '../types';
import type { Mechanic, MechSave } from './base';

const HEAT = 34; // per second at the bellows
const COOL = 7; // per second in the air
const LOW = 45; // below: too cold to shape
const HIGH = 88; // above: burning
const doneOf = (task: ForgeTask, s: MechSave) => (s.done.includes(task.id) ? task.items.map((_, i) => i) : s.prog[task.id] ?? []);
/** The glow of the iron now, for the 3D forge. */
const glow: Record<string, number> = {};

export const Forge: Mechanic<ForgeTask> = {
  total: (task) => task.items.length,
  uses(task, env) {
    if (doneOf(task, env.save).length >= task.items.length) return [];
    return [{ key: `forge:${task.id}`, pos: env.v3(task.at), label: 'Work at the forge', reach: 3, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length < task.items.length) return `Made at the forge: ${d.length} of ${task.items.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.items.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: ForgeView,
  Panel: ForgePanel,
};

const colour = (h: number) => (h < 25 ? '#3a3a3e' : h < LOW ? '#7a2a1a' : h < 70 ? '#d84a1a' : h < HIGH ? '#f08a2a' : '#fff4c8');
const words = (h: number) => (h < 25 ? 'dark and cold' : h < LOW ? 'dull red: still too cold to shape' : h < HIGH ? 'glowing: working heat' : 'white and sparking: too hot!');

function ForgePanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<ForgeTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = task.items.findIndex((_, k) => !d.includes(k));
  const [h, setH] = useState(0);
  const [shape, setShape] = useState(0);
  const [msg, setMsg] = useState('');
  const temp = useRef(0);
  const pumping = useRef(false);
  const last = useRef(0);
  useEffect(() => {
    last.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - last.current) / 1000);
      last.current = now;
      temp.current = Math.max(0, Math.min(100, temp.current + (pumping.current ? HEAT : -COOL) * dt));
      glow[task.id] = temp.current;
      (globalThis as Record<string, unknown>).__forge = { heat: temp.current };
      setH(temp.current);
    }, 80);
    return () => clearInterval(id);
  }, [task.id]);
  if (i < 0) return null;
  const it = task.items[i];
  const strike = () => {
    const t = temp.current;
    if (t >= HIGH) {
      api.note(`${task.id}/burnt`, i);
      setShape(0);
      temp.current = 50;
      setMsg(`Too hot: the iron was burning and sparking, and the ${it.name} is spoiled. Start this piece again, and stop pumping when it glows orange.`);
      return;
    }
    if (t < LOW) {
      api.note(`${task.id}/cold`, i);
      setMsg('Clang! The iron is too cold to move, and it could crack. Heat it at the bellows first.');
      return;
    }
    temp.current = Math.max(0, t - 9);
    const s = shape + 1;
    setShape(s);
    if (s >= it.strikes) {
      api.progress(task.id, i);
      setShape(0);
      temp.current = 0;
      setMsg(`The ${it.name} is done: ${it.use}`);
      if (d.length + 1 >= task.items.length) onClose();
      return;
    }
    setMsg(`Good blow. The ${it.name} takes shape (${s} of ${it.strikes}).`);
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a forge game written for this app" />
      <Text style={st.cardTitle}>{`Make the ${it.name}`}</Text>
      <Text style={st.cardText}>{msg || 'Pump the bellows to heat the iron, then strike it on the anvil while it glows. Stop pumping before it goes white.'}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 70, height: 26, borderRadius: 6, backgroundColor: colour(h), borderWidth: 1, borderColor: '#5a4a3a' }} />
        <Text style={[st.cardText, { fontSize: 14, flex: 1 }]}>{`The iron is ${words(h)}`}</Text>
      </View>
      <Text style={[st.cardText, { fontSize: 13 }]}>{`Shaped: ${shape} of ${it.strikes}`}</Text>
      <View style={st.row}>
        <Pressable
          style={st.btnGhost}
          accessibilityLabel="Pump the bellows"
          onPressIn={() => (pumping.current = true)}
          onPressOut={() => (pumping.current = false)}
        >
          <Text style={st.btnGhostText}>Pump the bellows (hold)</Text>
        </Pressable>
        <Pressable style={st.btn} accessibilityLabel="Strike" onPress={strike}>
          <Text style={st.btnText}>Strike</Text>
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

function ForgeView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<ForgeTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const coal = useRef<THREE.MeshBasicMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const c = useRef(new THREE.Color());
  useFrame((s) => {
    const g = glow[task.id] ?? 0;
    const k = 0.4 + g / 100 + (motion.reduced ? 0 : Math.sin(s.clock.elapsedTime * 6) * 0.05);
    coal.current?.color.copy(c.current.set('#ff6a20').multiplyScalar(Math.max(0.3, k)));
    if (light.current) light.current.intensity = 3 + g * 0.12;
  });
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} {...tap(() => act(`forge:${task.id}`))}>
      {/* The hearth */}
      <mesh material={M('#8a7a6a', { map: 'stone' })} position-y={0.45} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.9, 1.1]} />
      </mesh>
      <mesh position-y={0.92}>
        <boxGeometry args={[0.9, 0.06, 0.7]} />
        <meshBasicMaterial ref={coal} color="#ff6a20" toneMapped={false} />
      </mesh>
      <pointLight ref={light} position-y={1.4} color="#ff8a40" distance={8} intensity={3} />
      {/* The bellows */}
      <mesh material={M('#7a5232')} position={[-1.1, 0.5, 0]} rotation-z={0.3}>
        <boxGeometry args={[0.7, 0.18, 0.5]} />
      </mesh>
      {/* The anvil on its stump */}
      <group position={[1.5, 0, 0.2]}>
        <mesh material={M('#6a4a2a')} position-y={0.3}>
          <cylinderGeometry args={[0.3, 0.34, 0.6, 10]} />
        </mesh>
        <mesh material={M('#4a4a50', { metal: 0.7, rough: 0.35 })} position-y={0.72}>
          <boxGeometry args={[0.7, 0.24, 0.28]} />
        </mesh>
      </group>
      {/* What has been made so far hangs on the rack */}
      {task.items.map((_, k) =>
        d.includes(k) ? (
          <mesh key={k} material={M('#4a4a52', { metal: 0.7, rough: 0.4 })} position={[-0.4 + k * 0.4, 1.3, -0.62]}>
            <boxGeometry args={[0.08, 0.36, 0.04]} />
          </mesh>
        ) : null,
      )}
      {d.length < task.items.length && <Halo on={active} />}
    </group>
  );
}
