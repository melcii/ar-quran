// Surah Al-Mujadilah (She Who Disputes): listening fully. The surah opens
// "Allah has heard the speech of the one who argues with you concerning her
// husband and directs her complaint to Allah; and Allah hears your
// dialogue" (58:1). In a quiet hall of the game's own, people from the
// village come one at a time with something on their mind. Listen to the
// end without interrupting: the words appear as they are spoken, then fade.
// Then say back what you heard: only an accurate repeat, not a bigger or a
// smaller one, shows you really listened. The speakers and their worries
// are fictional and no one is shown; the woman of 58:1 is never portrayed.
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ListenTask } from '../types';
import type { Mechanic, MechSave } from './base';

const WORD = 170; // ms per word
const doneOf = (task: ListenTask, s: MechSave) => (s.done.includes(task.id) ? task.speakers.map((_, i) => i) : s.prog[task.id] ?? []);

export const Listen: Mechanic<ListenTask> = {
  total: (task) => task.speakers.length,
  uses(task, env) {
    if (doneOf(task, env.save).length >= task.speakers.length) return [];
    return [{ key: `listen:${task.id}`, pos: env.v3(task.at), label: 'Sit and listen', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length < task.speakers.length) return `People heard fully: ${d.length} of ${task.speakers.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.speakers.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: ListenView,
  Panel: ListenPanel,
};

function ListenPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<ListenTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = task.speakers.findIndex((_, k) => !d.includes(k));
  const sp = task.speakers[Math.max(0, i)];
  const words = sp.words.split(' ');
  const [n, setN] = useState(0);
  const [faded, setFaded] = useState(false);
  const [msg, setMsg] = useState('');
  const t0 = useRef(performance.now());
  useEffect(() => {
    t0.current = performance.now();
    setN(0);
    setFaded(false);
    setMsg('');
    const id = setInterval(() => {
      const k = Math.floor((performance.now() - t0.current) / WORD);
      setN(Math.min(words.length, k));
      if (k > words.length + 8) setFaded(true);
    }, 60);
    return () => clearInterval(id);
  }, [i, words.length]);
  if (i < 0) return null;
  const finished = n >= words.length;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a listening game; the speakers are fictional" />
      <Text style={st.cardTitle}>{sp.name}</Text>
      <Text style={[st.cardText, { minHeight: 72, fontStyle: 'italic', opacity: faded ? 0.15 : 1 }]}>{faded ? '(the words have faded: what did they say?)' : `“${words.slice(0, n).join(' ')}${finished ? '”' : ' …'}`}</Text>
      {!!msg && <Text style={[st.cardText, { fontSize: 14 }]}>{msg}</Text>}
      {!faded && (
        <View style={st.row}>
          <Pressable
            style={st.btnGhost}
            accessibilityLabel="Answer now"
            onPress={() => {
              api.note(`${task.id}/interrupt`, i);
              setMsg(finished ? 'Wait a moment longer: let them finish, and let the words settle.' : 'You interrupted. Let them finish speaking before you answer.');
            }}
          >
            <Text style={st.btnGhostText}>Answer now</Text>
          </Pressable>
        </View>
      )}
      {faded && (
        <View style={{ gap: 6 }}>
          <Text style={[st.cardText, { fontSize: 14 }]}>Say back what you heard:</Text>
          {sp.repeats.map((r, k) => (
            <Pressable
              key={k}
              style={[st.btnGhost, { alignSelf: 'stretch' }]}
              accessibilityLabel={`Repeat ${k + 1}`}
              onPress={() => {
                if (!r.ok) {
                  api.note(`${task.id}/x`, i * 10 + k);
                  setMsg(r.why);
                  return;
                }
                api.progress(task.id, i);
                setMsg(r.why);
                if (d.length + 1 >= task.speakers.length) onClose();
              }}
            >
              <Text style={[st.btnGhostText, { fontSize: 14 }]}>{`“${r.text}”`}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ListenView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<ListenTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} {...tap(() => act(`listen:${task.id}`))}>
      {/* Two cushions facing each other: one for you, one left for whoever comes. */}
      {[-0.9, 0.9].map((dz) => (
        <mesh key={dz} material={M('#a85a4a')} position={[0, 0.12, dz]}>
          <boxGeometry args={[0.7, 0.24, 0.7]} />
        </mesh>
      ))}
      <mesh material={M('#c8a870')} position-y={0.02}>
        <boxGeometry args={[1.6, 0.04, 3]} />
      </mesh>
      {task.speakers.map((_, k) => (
        <mesh key={k} position={[-0.6 + k * 0.4, 0.06, -1.6]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshBasicMaterial color={d.includes(k) ? '#ffe090' : '#6a6050'} toneMapped={false} />
        </mesh>
      ))}
      {d.length < task.speakers.length && <Halo on={active} />}
    </group>
  );
}
