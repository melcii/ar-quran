// Surah At-Tin: the fig and the olive (95:1-4, "By the fig and the olive,
// and Mount Sinai, and this secure city: We have created man in the best
// form"). In an olive grove on a terraced hillside, the harvest is in and
// the old stone press stands ready. Make the oil the way it has long been
// made: turn the millstone until the olives are a paste, spread the paste
// on woven mats and stack them, tighten the press a little at a time,
// waiting for the oil to run before tightening again, then let the jar
// settle: the oil floats up on the watery juice. Skim the top. The grove is
// a game; pressing olives this way is real. Musa and Mount Sinai are read
// only, never shown.
import { type ReactElement, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { OilpressTask } from '../types';
import type { Mechanic, MechSave } from './base';

const STAGES = 4; // milled, mats stacked, pressed, skimmed
const doneOf = (task: OilpressTask, s: MechSave) => (s.done.includes(task.id) ? [0, 1, 2, 3] : s.prog[task.id] ?? []);

export const Oilpress: Mechanic<OilpressTask> = {
  total: () => STAGES,
  uses(task, env) {
    if (doneOf(task, env.save).length >= STAGES) return [];
    return [{ key: `press:${task.id}`, pos: env.v3(task.at), label: 'Work the olive press', reach: 3, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= STAGES) return;
    return ['Turn the millstone to crush the olives', 'Spread the paste on the mats', 'Tighten the press, a little at a time', 'Let the jar settle, then skim the oil'][d.length];
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    if (d.length < STAGES) api.progress(task.id, d.length);
  },
  View: OilpressView,
  Panel: OilpressPanel,
};

function OilpressPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<OilpressTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const stage = d.length;
  const [n, setN] = useState(0);
  const [msg, setMsg] = useState('');
  const [since, setSince] = useState(0); // when the last tightening (or the jar filling) happened
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    setN(0);
    setSince(Date.now());
  }, [stage]);
  if (stage >= STAGES) return null;
  const wait = (now - since) / 1000;
  const next = (m: string) => {
    api.progress(task.id, stage);
    setMsg(m);
  };
  let body: ReactElement;
  if (stage === 0)
    body = (
      <Pressable style={st.btn} accessibilityLabel="Turn the millstone" onPress={() => {
        const k = n + 1;
        setN(k);
        if (k >= task.turns) next('The olives are crushed to a thick, dark paste.');
        else setMsg(`Round and round: ${k} of ${task.turns} turns. The olives are breaking up.`);
      }}>
        <Text style={st.btnText}>Turn the millstone</Text>
      </Pressable>
    );
  else if (stage === 1)
    body = (
      <Pressable style={st.btn} accessibilityLabel="Spread paste on a mat" onPress={() => {
        const k = n + 1;
        setN(k);
        if (k >= task.mats) next('The mats are stacked under the press, each spread with paste.');
        else setMsg(`${k} of ${task.mats} mats spread and stacked.`);
      }}>
        <Text style={st.btnText}>Spread paste on a mat</Text>
      </Pressable>
    );
  else if (stage === 2)
    body = (
      <>
        <Text style={[st.cardText, { textAlign: 'center' }]}>{n === 0 ? 'Nothing is running yet.' : wait < 1.5 ? 'Oil and juice are running fast from the mats…' : 'The flow has slowed to a trickle.'}</Text>
        <Pressable style={st.btn} accessibilityLabel="Tighten the press" onPress={() => {
          if (n > 0 && wait < 1.5) {
            api.note(`${task.id}/x`, n);
            setMsg('The mats bulge and paste squeezes out of the sides. Wait for the oil to run before you tighten again.');
            return;
          }
          const k = n + 1;
          setN(k);
          setSince(Date.now());
          if (k >= task.presses) next('The last of the juice runs into the jar: oil and water together, cloudy and golden.');
          else setMsg(`You tighten the press a turn (${k} of ${task.presses}). Oil and juice run down into the jar.`);
        }}>
          <Text style={st.btnText}>Tighten the press</Text>
        </Pressable>
      </>
    );
  else {
    const settled = wait >= task.settle;
    body = (
      <>
        <Text style={[st.cardText, { textAlign: 'center' }]}>{settled ? 'The jar has settled: a golden layer of oil floats on top of the dark, watery juice.' : 'The jar is still cloudy, oil and juice mixed together…'}</Text>
        <View style={st.row}>
          <Pressable style={st.btn} accessibilityLabel="Skim the top layer" onPress={() => {
            if (!settled) {
              api.note(`${task.id}/early`, 0);
              setMsg('It is still all mixed: you would skim off juice with the oil. Wait for the jar to settle.');
              return;
            }
            next('You skim off the clear golden oil from the top. The juice stays below.');
            api.hint('Fresh olive oil, pressed from the olives of the grove.');
            onClose();
          }}>
            <Text style={st.btnText}>Skim the top layer</Text>
          </Pressable>
          <Pressable style={st.btnGhost} accessibilityLabel="Pour from the bottom" onPress={() => {
            api.note(`${task.id}/bottom`, 0);
            setMsg('From the bottom comes the dark, bitter juice, not oil. Oil is lighter than water: it floats on top.');
          }}>
            <Text style={st.btnGhostText}>Pour from the bottom</Text>
          </Pressable>
        </View>
      </>
    );
  }
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="an olive-pressing game; this way of pressing is real" />
      <Text style={st.cardTitle}>{['Crush the olives', 'Spread the mats', 'Press the mats', 'Settle and skim'][stage]}</Text>
      <Text style={st.cardText}>{msg || ['Turn the heavy millstone round the basin to crush the olives.', 'Spread the paste on woven mats and stack them under the press.', 'Tighten the press a little at a time. Wait for the oil to run before you tighten again.', 'Let the jar stand until it settles, then take the oil.'][stage]}</Text>
      {body}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function OilpressView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<OilpressTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const done = d.length >= STAGES;
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!done ? tap(() => act(`press:${task.id}`)) : {})}>
      {/* The round crushing basin and its upright millstone. */}
      <mesh material={M('#9a9488', { map: 'stone' })} position-y={0.35} castShadow>
        <cylinderGeometry args={[1.2, 1.3, 0.7, 18]} />
      </mesh>
      <mesh material={M('#8a8478', { map: 'stone' })} position={[0.4, 1.05, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.6, 0.6, 0.35, 16]} />
      </mesh>
      {d.includes(0) && (
        <mesh material={M('#3a3a1a')} position-y={0.72} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.05, 18]} />
        </mesh>
      )}
      {/* The press frame and its stack of mats. */}
      <group position={[2.6, 0, 0]}>
        {[-0.6, 0.6].map((px) => (
          <mesh key={px} material={M('#6a4a2a')} position={[px, 1.1, 0]}>
            <boxGeometry args={[0.18, 2.2, 0.18]} />
          </mesh>
        ))}
        <mesh material={M('#6a4a2a')} position-y={2.15}>
          <boxGeometry args={[1.5, 0.2, 0.3]} />
        </mesh>
        {d.includes(1) && [0, 1, 2, 3].map((k) => (
          <mesh key={k} material={M('#a8884a')} position-y={0.25 + k * (d.includes(2) ? 0.08 : 0.14)}>
            <cylinderGeometry args={[0.45, 0.45, 0.06, 14]} />
          </mesh>
        ))}
      </group>
      {/* The jar, golden once the oil is skimmed. */}
      <mesh material={M(done ? '#c8a830' : '#b86a3a')} position={[2.6, 0.35, 1.2]}>
        <cylinderGeometry args={[0.32, 0.25, 0.7, 12]} />
      </mesh>
      {!done && <Halo on={active} />}
    </group>
  );
}
