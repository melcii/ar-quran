// Surah Al-Isra's own play: the town of good conduct at night. Each street
// holds one of the guidelines of 17:23-37 as something to do with your
// hands, and its lamp lights when it is done: carry an old neighbour's
// basket home (17:23-24), take bread to a relative, a poor family and a
// traveller (17:26), close the taps left running (17:26-27, no waste), fill
// a measure right to the line without spilling (17:35), and walk the long
// street calmly, not strutting or racing (17:37). The Night Journey (17:1) is
// read only; nothing of it is shown. The neighbours are not shown either:
// their doors and lamps stand for them.
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion, player } from '@/ark/shared';
import { st } from '../cards';
import { Item, M } from '../kit';
import { Halo, tap } from '../props';
import type { StreetsTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { carry: number | null; drop: number; walk: number; ran: boolean };
const fresh = (): Live => ({ carry: null, drop: 0, walk: -1, ran: false });

/** Which taps are closed, per street. */
const closed = (task: StreetsTask, s: MechSave, i: number) => s.prog[`${task.id}/t${i}`] ?? [];

export const Streets: Mechanic<StreetsTask> = {
  total: (task) => task.streets.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const out = [];
    for (const [i, s] of task.streets.entries()) {
      if (env.prog.includes(i)) continue;
      if (s.act === 'carry') {
        if (L.carry !== i)
          out.push({ key: `take:${task.id}:${i}`, pos: env.v3(s.from), label: `Pick up the ${s.what}`, reach: 2.8, run: () => {
            L.carry = i;
            L.drop = 0;
            env.api.hint(s.to.length > 1 ? `Take one to each door with a lamp waiting (${s.to.length}).` : 'Carry it to the door with the waiting lamp.');
          } });
        else
          out.push({ key: `drop:${task.id}:${i}`, pos: env.v3(s.to[L.drop]), label: `Leave the ${s.what} at this door`, reach: 2.8, run: () => {
            L.drop++;
            if (L.drop >= s.to.length) {
              L.carry = null;
              env.api.progress(task.id, i);
              env.api.say(s.done);
              env.api.open({ kind: 'reading', reading: s.reading });
            } else env.api.hint(`One left at the door. ${s.to.length - L.drop} more to go.`);
          } });
      }
      if (s.act === 'taps') {
        const shut = closed(task, env.save, i);
        s.taps.forEach((p, j) => {
          if (shut.includes(j)) return;
          out.push({ key: `tap:${task.id}:${i}:${j}`, pos: env.v3(p), label: 'Close the running tap', reach: 2.6, run: () => {
            env.api.note(`${task.id}/t${i}`, j);
            if (shut.length + 1 >= s.taps.length) {
              env.api.progress(task.id, i);
              env.api.say(s.done);
              env.api.open({ kind: 'reading', reading: s.reading });
            } else env.api.hint(`Closed. ${s.taps.length - shut.length - 1} still running on this street.`);
          } });
        });
      }
      if (s.act === 'measure') out.push({ key: `measure:${task.id}:${i}`, pos: env.v3(s.at), label: 'Fill the measure at the grain stall', reach: 3, run: () => env.api.panel(task) });
      if (s.act === 'calm') {
        if (L.walk !== i) out.push({ key: `calm:${task.id}:${i}`, pos: env.v3(s.from), label: 'Start down the long street', reach: 2.8, run: () => {
          L.walk = i;
          L.ran = false;
          env.api.hint('Walk to the lamp at the far end, calmly. No running.');
        } });
        else out.push({ key: `go:${task.id}:${i}`, pos: env.v3(s.to), label: 'The lamp at the end of the street', reach: 0, run: () => undefined });
      }
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    if (L.walk >= 0) {
      const s = task.streets[L.walk];
      if (s.act === 'calm') {
        if (player.speed > 5) {
          L.walk = -1;
          env.tell(`${task.id}ran`, 'That was running. On this street, walk calmly: go back to the start and try again.', 3);
        } else if (Math.hypot(s.to[0] - env.pp.x, s.to[1] - env.pp.z) < 2.5) {
          const i = L.walk;
          L.walk = -1;
          env.api.progress(task.id, i);
          env.api.say(s.done);
          env.api.open({ kind: 'reading', reading: s.reading });
        } else return 'Walking calmly down the long street';
      }
    }
    return `Lamps lit: ${env.prog.length} of ${task.streets.length}`;
  },
  solve(task, api) {
    const i = task.streets.findIndex((s) => s.act === 'measure');
    if (i >= 0) api.progress(task.id, i);
  },
  View: StreetsView,
  Panel: MeasurePanel,
};

function Lamp({ x, z, y, on }: { x: number; z: number; y: number; on: boolean }) {
  return (
    <group position={[x, y, z]}>
      <mesh material={M('#3a2a1e')} position-y={1.4}>
        <cylinderGeometry args={[0.06, 0.08, 2.8, 6]} />
      </mesh>
      <mesh material={M(on ? '#ffe2a0' : '#6a6050', { emissive: on ? '#ffb850' : undefined, ei: on ? 3 : 0 })} position-y={2.95}>
        <octahedronGeometry args={[0.3, 0]} />
      </mesh>
      {on && <pointLight position-y={3} intensity={6} distance={10} color="#ffc070" />}
    </group>
  );
}

function Running({ x, z, y }: { x: number; z: number; y: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((stt) => {
    if (ref.current && !motion.reduced) ref.current.scale.y = 0.9 + Math.sin(stt.clock.elapsedTime * 20) * 0.1;
  });
  return (
    <mesh ref={ref} position={[x + 0.25, y + 0.45, z]}>
      <cylinderGeometry args={[0.03, 0.05, 0.9, 6]} />
      <meshStandardMaterial color="#9ad0ff" transparent opacity={0.7} />
    </mesh>
  );
}

function StreetsView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<StreetsTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const prog = data.done.includes(task.id) ? task.streets.map((_, i) => i) : data.prog[task.id] ?? [];
  const held = useRef<THREE.Group>(null);
  const [carry, setCarry] = useState<number | null>(null);
  useFrame(() => {
    if (L.carry !== carry) setCarry(L.carry);
    const h = held.current;
    if (!h) return;
    h.visible = L.carry != null;
    h.position.set(player.pos.x + Math.sin(player.yaw) * 0.45, player.pos.y + 0.55, player.pos.z + Math.cos(player.yaw) * 0.45);
    h.rotation.y = player.yaw;
  });
  const y = (p: [number, number]) => t.floorY(p[0], p[1]);
  const carried = carry != null ? task.streets[carry] : null;
  return (
    <group>
      {task.streets.map((s, i) => {
        const lit = prog.includes(i);
        return (
          <group key={i}>
            <Lamp x={s.lamp[0]} z={s.lamp[1]} y={y(s.lamp)} on={lit} />
            {s.act === 'carry' && !lit && (
              <group position={[s.from[0], y(s.from), s.from[1]]} {...tap(() => act(`take:${task.id}:${i}`))}>
                {carry !== i && <Item kind={s.item} />}
                {carry !== i && <Halo on={active} />}
              </group>
            )}
            {s.act === 'carry' &&
              s.to.map((p, j) => (
                <group key={j} position={[p[0], y(p), p[1]]} {...tap(() => act(`drop:${task.id}:${i}`))}>
                  <mesh material={M(lit || (carry === i && j < L.drop) ? '#ffe2a0' : '#8a7a60', { emissive: lit || (carry === i && j < L.drop) ? '#ffb850' : undefined, ei: 2 })} position-y={0.25}>
                    <cylinderGeometry args={[0.18, 0.2, 0.4, 8]} />
                  </mesh>
                  {carry === i && j === L.drop && <Halo on={active} />}
                </group>
              ))}
            {s.act === 'taps' &&
              s.taps.map((p, j) => {
                const shut = lit || closed(task, data, i).includes(j);
                return (
                  <group key={j} position={[p[0], y(p), p[1]]} {...tap(() => act(`tap:${task.id}:${i}:${j}`))}>
                    <mesh material={M('#9a9488', { map: 'stone' })} position-y={0.5}>
                      <boxGeometry args={[0.5, 1, 0.4]} />
                    </mesh>
                    <mesh material={M('#b08a40', { metal: 0.6 })} position={[0.25, 0.95, 0]} rotation-z={Math.PI / 2}>
                      <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
                    </mesh>
                    {!shut && <Running x={0} z={0} y={0} />}
                    {!shut && <Halo on={active} />}
                  </group>
                );
              })}
            {s.act === 'measure' && (
              <group position={[s.at[0], y(s.at), s.at[1]]} {...tap(() => act(`measure:${task.id}:${i}`))}>
                <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.5}>
                  <boxGeometry args={[1.8, 1, 0.9]} />
                </mesh>
                <mesh material={M('#e2c066')} position={[-0.4, 1.15, 0]}>
                  <coneGeometry args={[0.4, 0.4, 10]} />
                </mesh>
                <mesh material={M('#7a5a3a')} position={[0.45, 1.15, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 0.3, 12, 1, true]} />
                </mesh>
                {!lit && <Halo on={active} />}
              </group>
            )}
            {s.act === 'calm' && (
              <group position={[s.from[0], y(s.from), s.from[1]]} {...tap(() => act(`calm:${task.id}:${i}`))}>
                <mesh material={M('#c8b490', { map: 'stone' })} position-y={0.04}>
                  <cylinderGeometry args={[1, 1, 0.08, 18]} />
                </mesh>
                {!lit && <Halo on={active} />}
              </group>
            )}
          </group>
        );
      })}
      <group ref={held} scale={0.7}>
        {carried && carried.act === 'carry' && <Item kind={carried.item} />}
      </group>
    </group>
  );
}

/** Fill speed of the measure, per second held. */
const RATE = 0.3;

/** Pour grain while holding the button; let go right at the line. Over the line spills, and that is waste. */
function MeasurePanel({ task, api, width, onClose }: Parameters<NonNullable<Mechanic<StreetsTask>['Panel']>>[0]) {
  const i = task.streets.findIndex((s) => s.act === 'measure');
  const s = task.streets[i];
  const [lvl, setLvlState] = useState(0);
  const level = useRef(0);
  const setLvl = (f: number | ((v: number) => number)) => {
    level.current = typeof f === 'function' ? f(level.current) : f;
    setLvlState(level.current);
  };
  const [pour, setPour] = useState(false);
  const [msg, setMsg] = useState('Press and hold Pour to fill the measure. Let go when the grain reaches the line: a full measure, with nothing spilled.');
  // The level follows the time held (not timer ticks), so a slow device pours at the same speed.
  const from = useRef({ t: 0, v: 0 });
  const now = () => Math.min(1.15, from.current.v + ((performance.now() - from.current.t) / 1000) * RATE);
  useEffect(() => {
    if (!pour) return;
    const id = setInterval(() => setLvl(now()), 50);
    return () => clearInterval(id);
  }, [pour]); // eslint-disable-line react-hooks/exhaustive-deps
  const start = () => {
    from.current = { t: performance.now(), v: level.current };
    setPour(true);
  };
  const stop = () => {
    if (from.current.t === 0) return;
    setPour(false);
    const lvl = now();
    from.current = { t: 0, v: lvl };
    setLvl(lvl);
    if (lvl > 1.02) {
      setMsg('It spilled over the top, and the grain on the ground is wasted. Empty it and try again.');
    } else if (lvl < 0.95) setMsg(`Not full yet: that would be a short measure. Pour a little more.`);
    else {
      setMsg('A full measure, right to the line, and nothing spilled.');
      api.progress(task.id, i);
      api.say(s.done);
      api.open({ kind: 'reading', reading: s.reading });
    }
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a measuring game written for this app" />
      <Text style={st.cardText}>{msg}</Text>
      <View style={{ alignSelf: 'center', width: 90, height: 140, borderWidth: 3, borderTopWidth: 0, borderColor: '#7a5a3a', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, justifyContent: 'flex-end', overflow: 'visible' }}>
        <View style={{ position: 'absolute', left: -8, right: -8, bottom: 140 * 0.97, borderTopWidth: 2, borderColor: '#b03a2e' }} />
        <View style={{ height: Math.min(1, lvl) * 140, backgroundColor: '#e2c066', borderBottomLeftRadius: 7, borderBottomRightRadius: 7 }} />
        {lvl > 1 && <View style={{ position: 'absolute', right: -24, bottom: 0, width: 20, height: (lvl - 1) * 300, backgroundColor: '#e2c066', borderRadius: 6 }} />}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={() => { from.current = { t: 0, v: 0 }; setLvl(0); }}>
          <Text style={st.btnGhostText}>Empty it</Text>
        </Pressable>
        <Pressable style={st.btn} accessibilityRole="button" onPressIn={start} onPressOut={stop}>
          <Text style={st.btnText}>Pour (hold)</Text>
        </Pressable>
      </View>
    </View>
  );
}
