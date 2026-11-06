// Surah Luqman's own play: a gentle voice (31:19, "lower your voice"). Along
// a garden path, animals rest: a dove, a cat, a goat. At each one you have a
// message to pass on, and you speak it at the right loudness: the voice
// needle rises while you hold the button and sinks when you let go. Keep it
// inside the green band for a few moments and the message is heard. Too soft
// and it is not heard; too loud and the animal is startled away, and you
// try again. Each listener is more easily startled than the one before.
// Luqman and his son are not shown; his advice is read from the verified
// verses, not acted out.
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion } from '@/ark/shared';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { VoiceTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { at: number; startled: number; ver: number };
const fresh = (): Live => ({ at: -1, startled: -1, ver: 0 });

const heard = (task: VoiceTask, s: MechSave) => (s.done.includes(task.id) ? task.listeners.map((_, i) => i) : s.prog[task.id] ?? []);

/** Rise per second while held, and fall per second when let go. */
const UP = 0.5;
const DOWN = 0.4;

export const Voice: Mechanic<VoiceTask> = {
  total: (task) => task.listeners.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = heard(task, env.save);
    const i = task.listeners.findIndex((_, j) => !done.includes(j));
    if (i < 0) return [];
    const ls = task.listeners[i];
    return [{ key: `speak:${task.id}:${i}`, pos: env.v3(ls.at), label: `Pass the message to the ${ls.animal}`, reach: 3.4, run: () => {
      L.at = i;
      L.ver++;
      env.api.panel(task);
    } }];
  },
  frame(task, env) {
    const done = heard(task, env.save);
    const i = task.listeners.findIndex((_, j) => !done.includes(j));
    if (i < 0) return;
    return `Messages heard: ${done.length} of ${task.listeners.length} · Next: the ${task.listeners[i].animal} along the path`;
  },
  solve(task, api) {
    const done = heard(task, api.save());
    const i = task.listeners.findIndex((_, j) => !done.includes(j));
    if (i >= 0) api.progress(task.id, i);
  },
  View: VoiceView,
  Panel: VoicePanel,
};

/** The voice meter: hold to speak louder, let go to soften. Keep it in the green band. */
function VoicePanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<VoiceTask>['Panel']>>[0]) {
  const done = heard(task, data);
  const i = task.listeners.findIndex((_, j) => !done.includes(j));
  const ls = task.listeners[Math.max(0, i)];
  const [lo, hi] = ls.band;
  const level = useRef(0);
  const inBand = useRef(0);
  const held = useRef(false);
  const last = useRef(0);
  const finished = useRef(false);
  // After a startle the animal settles for a moment before it listens again.
  const calm = useRef(0);
  const [, tick] = useState(0);
  const [msg, setMsg] = useState(`Hold "Speak" to raise your voice, and let go to soften it. Keep the needle in the green band for ${task.hold} seconds so the ${ls.animal} hears you without being startled.`);
  useEffect(() => {
    last.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - last.current) / 1000);
      last.current = now;
      if (finished.current) return;
      if (now < calm.current) level.current = 0;
      else level.current = Math.max(0, Math.min(1, level.current + (held.current ? UP : -DOWN) * dt));
      const v = level.current;
      if (v > hi + 0.1) {
        level.current = 0;
        inBand.current = 0;
        calm.current = now + 1200;
        api.note(`${task.id}/x`, i);
        setMsg(`Too loud! The ${ls.animal} was startled and moved away. It settles again: try once more, more gently.`);
      } else if (v >= lo && v <= hi) {
        inBand.current += dt;
        if (inBand.current >= task.hold) {
          finished.current = true;
          setMsg(`The ${ls.animal} heard the message, and stayed calm.`);
          api.progress(task.id, i);
          api.open({ kind: 'reading', reading: ls.reading });
        }
      } else inBand.current = Math.max(0, inBand.current - dt * 0.5);
      (globalThis as Record<string, unknown>).__voice = { level: level.current, lo, hi };
      tick((n) => n + 1);
    }, 50);
    return () => clearInterval(id);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const H = 160;
  const v = level.current;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a voice game written for this app" />
      <Text style={st.cardText}>{msg}</Text>
      <View style={{ alignSelf: 'center', width: 60, height: H, borderWidth: 2, borderColor: '#7a5a3a', borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: lo * H, height: (hi - lo) * H, backgroundColor: '#bfe0a0' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: hi * H + 0.1 * H, height: 2, backgroundColor: '#b03a2e' }} />
        <View style={{ position: 'absolute', left: 4, right: 4, bottom: v * H - 3, height: 6, borderRadius: 3, backgroundColor: v >= lo && v <= hi ? '#3a7a2a' : '#7a5a3a' }} />
      </View>
      <Text style={[st.cardText, { textAlign: 'center' }]}>{`Heard: ${Math.min(task.hold, inBand.current).toFixed(1)} of ${task.hold} s`}</Text>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
        <Pressable style={st.btn} accessibilityRole="button" onPressIn={() => (held.current = true)} onPressOut={() => (held.current = false)}>
          <Text style={st.btnText}>Speak (hold)</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Animal({ kind, away }: { kind: VoiceTask['listeners'][number]['animal']; away: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (g.current) g.current.position.y = away ? 0 : motion.reduced ? 0 : Math.abs(Math.sin(s.clock.elapsedTime * 1.2)) * 0.03;
  });
  const body = kind === 'dove' ? '#eef0f2' : kind === 'cat' ? '#c8884a' : '#e8e0d0';
  const s = kind === 'dove' ? 0.35 : kind === 'cat' ? 0.5 : 0.85;
  return (
    <group ref={g} scale={s}>
      <mesh material={M(body)} position-y={0.6} scale={[0.6, 0.55, 1]} castShadow>
        <sphereGeometry args={[0.6, 12, 10]} />
      </mesh>
      <mesh material={M(body)} position={[0, 1, 0.55]} castShadow>
        <sphereGeometry args={[0.32, 12, 10]} />
      </mesh>
      {kind === 'dove' && (
        <mesh material={M('#e0a040')} position={[0, 0.98, 0.88]} rotation-x={Math.PI / 2}>
          <coneGeometry args={[0.07, 0.2, 6]} />
        </mesh>
      )}
      {kind === 'cat' &&
        [-1, 1].map((x) => (
          <mesh key={x} material={M(body)} position={[x * 0.16, 1.3, 0.55]}>
            <coneGeometry args={[0.09, 0.22, 4]} />
          </mesh>
        ))}
      {kind === 'goat' &&
        [-1, 1].map((x) => (
          <group key={x}>
            <mesh material={M('#a89a80')} position={[x * 0.14, 1.32, 0.5]} rotation-x={-0.5}>
              <coneGeometry args={[0.05, 0.3, 5]} />
            </mesh>
            {[-1, 1].map((z) => (
              <mesh key={z} material={M(body)} position={[x * 0.22, 0.2, z * 0.4]}>
                <cylinderGeometry args={[0.07, 0.07, 0.45, 6]} />
              </mesh>
            ))}
          </group>
        ))}
    </group>
  );
}

function VoiceView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<VoiceTask>['View']>>[0]) {
  const done = heard(task, data);
  const next = task.listeners.findIndex((_, j) => !done.includes(j));
  return (
    <group>
      {task.listeners.map((ls, i) => (
        <group key={i} position={[ls.at[0], t.floorY(ls.at[0], ls.at[1]), ls.at[1]]} rotation-y={Math.PI} {...tap(() => act(`speak:${task.id}:${i}`))}>
          <Animal kind={ls.animal} away={false} />
          {done.includes(i) && (
            <mesh position-y={1.8}>
              <torusGeometry args={[0.25, 0.04, 6, 16]} />
              <meshBasicMaterial color="#ffe8a0" toneMapped={false} />
            </mesh>
          )}
          {i === next && <Halo on={active} />}
        </group>
      ))}
    </group>
  );
}
