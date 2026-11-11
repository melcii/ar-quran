// Surah Al-Kafirun: to you your religion, and to me mine (109:1-6, "Say: O
// disbelievers, I do not worship what you worship, nor do you worship what
// I worship ... For you is your religion, and for me is my religion"). Two
// families share a courtyard in an old town, and their neighbour worships
// differently. Through the day the neighbour asks for many things. Help
// gladly in everyday kindness: carrying a heavy jar, minding the bread,
// sharing a meal. But when asked to join in worship, even "just once, and
// then we will come to yours", say no clearly, and politely. Rudeness is
// never the answer. The courtyard is a game; the Prophet, who is told to
// "say" this in the surah, is never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { CourtyardTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: CourtyardTask, s: MechSave) => (s.done.includes(task.id) ? task.asks.map((_, i) => i) : s.prog[task.id] ?? []);

export const Courtyard: Mechanic<CourtyardTask> = {
  total: (task) => task.asks.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.asks.length) return [];
    return [{ key: `neighbour:${task.id}`, pos: env.v3(task.at), label: 'Answer your neighbour', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= task.asks.length) return;
    return `Answered your neighbour: ${d.length} of ${task.asks.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.asks.findIndex((_, k) => !d.includes(k));
    if (i >= 0) api.progress(task.id, i);
  },
  View: CourtyardView,
  Panel: CourtyardPanel,
};

function CourtyardPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<CourtyardTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = task.asks.findIndex((_, k) => !d.includes(k));
  const [msg, setMsg] = useState('');
  if (i < 0) return null;
  const A = task.asks[i];
  const answer = (kind: 'yes' | 'no' | 'rude') => {
    if (kind === 'rude') {
      api.note(`${task.id}/rude`, i);
      setMsg('That would hurt them, and it is not the way. You can say no, or yes, kindly.');
      return;
    }
    if ((kind === 'yes') !== A.ok) {
      api.note(`${task.id}/x`, i);
      setMsg(A.ok ? 'This is ordinary neighbourly help, nothing to do with worship. Help them gladly.' : 'This is worship. “I do not worship what you worship.” Say no, clearly and kindly.');
      return;
    }
    api.progress(task.id, i);
    setMsg('');
    const left = task.asks.length - d.length - 1;
    api.hint(left ? (A.ok ? 'Your neighbour smiles: “What would we do without you?”' : 'Your neighbour nods: “Fair enough. To each their own.”') : 'For you is your religion, and for me is mine: and the two families are still good neighbours.');
    if (!left) onClose();
  };
  const opts: [string, 'yes' | 'no' | 'rude'][] = [[A.yes, 'yes'], [A.no, 'no'], [A.rude, 'rude']];
  const order = [i % 3, (i + 1) % 3, (i + 2) % 3].map((k) => opts[k]);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a neighbours game written for this app" />
      <Text style={st.cardTitle}>Your neighbour asks</Text>
      <Text style={st.cardText}>{`“${A.text}”`}</Text>
      {!!msg && <Text style={st.cardText}>{msg}</Text>}
      <View style={{ gap: 6 }}>
        {order.map(([label, kind]) => (
          <Pressable key={kind} style={st.btnGhost} accessibilityLabel={label} onPress={() => answer(kind)}>
            <Text style={st.btnGhostText}>{label}</Text>
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

function CourtyardView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<CourtyardTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const all = d.length >= task.asks.length;
  const [x, z] = task.at;
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!all ? tap(() => act(`neighbour:${task.id}`)) : {})}>
      {/* The low wall between the two halves of the courtyard, with a gap to talk across. */}
      {[-1.3, 1.3].map((px) => (
        <mesh key={px} material={M('#d8c8a8', { map: 'stone' })} position={[px, 0.4, 0]}>
          <boxGeometry args={[1.6, 0.8, 0.3]} />
        </mesh>
      ))}
      {/* A potted plant on each side; one more flower opens on each with every answer. */}
      {[-1.3, 1.3].map((px) => (
        <group key={`p${px}`} position={[px, 0.8, 0]}>
          <mesh material={M('#b86a3a')} position-y={0.12}>
            <cylinderGeometry args={[0.14, 0.1, 0.24, 8]} />
          </mesh>
          {d.map((k) => (
            <mesh key={k} material={M(px < 0 ? '#e85a7a' : '#f0c040')} position={[Math.cos(k * 2) * 0.1, 0.32 + k * 0.03, Math.sin(k * 2) * 0.1]}>
              <sphereGeometry args={[0.05, 6, 5]} />
            </mesh>
          ))}
        </group>
      ))}
      {!all && <Halo on={active} />}
    </group>
  );
}
