// Surah Al-Infitar: formed and balanced (82:6-8, "O mankind, what has
// deceived you about your Lord, the Generous, who created you, proportioned
// you and balanced you, and put you together in whatever form He willed?").
// A path through a rocky gorge crosses the stream three times on narrow
// logs. Cross each one: as you walk, you start to tip one way or the other;
// lean the other way to stay upright. Lean too late and you wobble back
// onto the bank to try again. The logs get narrower and springier. Your
// body knows how to balance; this game is a reminder of it. The gorge is a
// game; the recorders of 82:10-12 are never shown.
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { BeamTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: BeamTask, s: MechSave) => (s.done.includes(task.id) ? task.logs.map((_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: BeamTask, d: number[]) => task.logs.findIndex((_, i) => !d.includes(i));
/** Tests read the balance here, as a player reads the meter. */
const peek = globalThis as { __beam?: { tilt: number; pos: number } };

export const Beam: Mechanic<BeamTask> = {
  total: (task) => task.logs.length,
  uses(task, env) {
    const i = nextOf(task, doneOf(task, env.save));
    if (i < 0) return [];
    return [{ key: `beam:${task.id}`, pos: env.v3(task.logs[i].at), label: `Cross ${task.logs[i].name}`, reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (nextOf(task, d) < 0) return;
    return `Logs crossed: ${d.length} of ${task.logs.length}`;
  },
  solve(task, api) {
    const i = nextOf(task, doneOf(task, api.save()));
    if (i >= 0) api.progress(task.id, i);
  },
  View: BeamView,
  Panel: BeamPanel,
};

function BeamPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<BeamTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [, draw] = useState(0);
  const [msg, setMsg] = useState('');
  const [going, setGoing] = useState(false);
  const s = useRef({ tilt: 0, pos: 0, t: 0 });
  useEffect(() => {
    if (!going || i < 0) return;
    const log = task.logs[i];
    const id = setInterval(() => {
      const S = s.current;
      const dt = 0.05;
      S.t += dt;
      // Once you start to tip, you tip further; the log sways you too.
      S.tilt += (S.tilt * 1.1 + log.drift * Math.sin(S.t * 1.3 + i)) * dt;
      if (Math.abs(S.tilt) >= 1) {
        api.note(`${task.id}/x`, i);
        setMsg(`You wobble ${S.tilt > 0 ? 'right' : 'left'} and step back onto the bank. Try again: lean the other way as soon as you start to tip.`);
        S.tilt = 0;
        S.pos = 0;
        setGoing(false);
      } else {
        S.pos = Math.min(1, S.pos + dt / task.secs);
        if (S.pos >= 1) {
          api.progress(task.id, i);
          setGoing(false);
          S.tilt = 0;
          S.pos = 0;
          setMsg(`Across ${log.name}! Your body kept its balance.`);
          if (i + 1 >= task.logs.length) onClose();
        }
      }
      peek.__beam = { tilt: S.tilt, pos: S.pos };
      draw((n) => n + 1);
    }, 50);
    return () => clearInterval(id);
  }, [going, i]);
  if (i < 0) return null;
  const S = s.current;
  const lean = (k: number) => {
    S.tilt += k * 0.3;
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a balancing game written for this app" />
      <Text style={st.cardTitle}>{`Cross ${task.logs[i].name}`}</Text>
      <Text style={st.cardText}>{msg || 'Walk across the log. If you start to tip one way, lean the other way to stay upright.'}</Text>
      <View style={{ alignSelf: 'center', width: 200, height: 18, borderRadius: 9, backgroundColor: '#e8e0d0' }} accessibilityLabel={`Balance: ${S.tilt > 0.15 ? 'tipping right' : S.tilt < -0.15 ? 'tipping left' : 'upright'}`}>
        <View style={{ position: 'absolute', left: 90, width: 20, top: 0, bottom: 0, backgroundColor: '#b8d8a0' }} />
        <View style={{ position: 'absolute', left: 97 + S.tilt * 97, width: 6, top: -3, bottom: -3, borderRadius: 3, backgroundColor: '#3a4a6a' }} />
      </View>
      <View style={{ alignSelf: 'center', width: 200, height: 6, borderRadius: 3, backgroundColor: '#8a6a44', marginTop: 6 }} accessibilityLabel={`Across: ${Math.round(S.pos * 100)} in 100`}>
        <View style={{ width: `${S.pos * 100}%` as never, height: 6, borderRadius: 3, backgroundColor: '#e8c860' }} />
      </View>
      <View style={[st.row, { justifyContent: 'center' }]}>
        <Pressable style={st.btnGhost} accessibilityLabel="Lean left" onPress={() => lean(-1)}>
          <Text style={st.btnGhostText}>◀ Lean left</Text>
        </Pressable>
        {!going && (
          <Pressable
            style={st.btn}
            accessibilityLabel="Start across"
            onPress={() => {
              s.current = { tilt: 0.05 * (i % 2 ? -1 : 1), pos: 0, t: 0 };
              setMsg('');
              setGoing(true);
            }}
          >
            <Text style={st.btnText}>Start across</Text>
          </Pressable>
        )}
        <Pressable style={st.btnGhost} accessibilityLabel="Lean right" onPress={() => lean(1)}>
          <Text style={st.btnGhostText}>Lean right ▶</Text>
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

function BeamView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<BeamTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  return (
    <group>
      {task.logs.map((log, k) => {
        const [x, z] = log.at;
        return (
          <group key={k} position={[x, t.floorY(x, z), z]} {...(k === i ? tap(() => act(`beam:${task.id}`)) : {})}>
            {/* A marker stone at the end of each log; the log itself is in the world's structures. */}
            <mesh material={M(d.includes(k) ? '#e8c860' : '#a89c88', { map: 'stone' })} position-y={0.3}>
              <cylinderGeometry args={[0.3, 0.38, 0.6, 7]} />
            </mesh>
            {k === i && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
