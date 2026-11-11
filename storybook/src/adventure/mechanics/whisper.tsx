// Surah An-Nas: the one who whispers and withdraws (114:1-6, "Say: I seek
// refuge in the Lord of people, the King of people, the God of people, from
// the evil of the retreating whisperer, who whispers in the hearts of
// people, from among jinn and people"). You are taking a letter across the
// village to your grandmother. At a few places on the way, a thought comes
// that is not a good one: "go the long way and play instead", "read the
// letter, no one will know". No whisperer is ever shown: only a grey mist
// gathering at that spot. Seek refuge in the Lord of people and walk on,
// and the mist draws back. Listen to it, and it thickens. Then deliver the
// letter. The village is a game; jinn and the whisperer are never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { WhisperTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: WhisperTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.stops.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
/** How thick the mist is at each stop (saved): grows when you listen, gone when you seek refuge. */
const mistOf = (task: WhisperTask, s: MechSave) => {
  const v = s.prog[`${task.id}/mist`];
  return v && v.length === task.stops.length ? v : task.stops.map(() => 1);
};
const at: Record<string, number> = {};

export const Whisper: Mechanic<WhisperTask> = {
  total: (task) => task.stops.length + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(task.stops.length)) return [];
    const out = task.stops.flatMap((s, i) => (d.includes(i) ? [] : [{ key: `stop:${task.id}:${i}`, pos: env.v3(s.at), label: 'A thought comes…', reach: 2.4, run: () => { at[task.id] = i; env.api.panel(task); } }]));
    out.push({ key: `deliver:${task.id}`, pos: env.v3(task.end), label: 'Give Grandmother the letter', reach: 2.4, run: () => {
      const left = task.stops.filter((_, i) => !d.includes(i)).length;
      if (left) {
        env.api.note(`${task.id}/early`, left);
        env.api.hint('You are here, but something on the way is still unsettled. Go back to the grey mist and turn from it.');
        return;
      }
      env.api.progress(task.id, task.stops.length);
      env.api.hint('Grandmother opens the letter, sealed just as it was sent, and smiles.');
    } });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(task.stops.length)) return;
    const turned = d.filter((k) => k < task.stops.length).length;
    return `Taking the letter to Grandmother · grey mists turned from: ${turned} of ${task.stops.length}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: task.stops.length + 1 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: WhisperView,
  Panel: WhisperPanel,
};

function WhisperPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<WhisperTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = at[task.id] ?? task.stops.findIndex((_, k) => !d.includes(k));
  const mist = mistOf(task, data);
  const [msg, setMsg] = useState('');
  if (i < 0 || d.includes(i)) return null;
  const S = task.stops[i];
  const opts: [string, () => void][] = [
    ['I seek refuge in the Lord of people. Walk on', () => {
      const m = mist.slice();
      m[i] = 0;
      api.set(`${task.id}/mist`, m);
      api.progress(task.id, i);
      api.hint('The thought draws back like mist in the sun, and you walk on with the letter.');
      onClose();
    }],
    ['Listen to it a little longer', () => {
      const m = mist.slice();
      m[i] = Math.min(3, m[i] + 1);
      api.set(`${task.id}/mist`, m);
      api.note(`${task.id}/listen`, i);
      setMsg('The longer you listen, the thicker the mist gathers, and the more reasonable it starts to sound. The surah teaches what to do: seek refuge in the Lord of people.');
    }],
    ['Do what it says', () => {
      api.note(`${task.id}/x`, i);
      setMsg('That would not be good, and you know it. Turn from it: seek refuge in the Lord of people, and walk on.');
    }],
  ];
  const order = [i % 3, (i + 1) % 3, (i + 2) % 3].map((k) => opts[k]);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a choices game written for this app; no whisperer or jinn is shown" />
      <Text style={st.cardTitle}>A thought comes</Text>
      <Text style={st.cardText}>{`“${S.says}”`}</Text>
      {!!msg && <Text style={st.cardText}>{msg}</Text>}
      <View style={{ gap: 6 }}>
        {order.map(([label, run]) => (
          <Pressable key={label} style={st.btnGhost} accessibilityLabel={label} onPress={run}>
            <Text style={st.btnGhostText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function WhisperView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<WhisperTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const mist = mistOf(task, data);
  const delivered = d.includes(task.stops.length);
  const [ex, ez] = task.end;
  return (
    <group>
      {task.stops.map((s, i) => {
        if (d.includes(i)) return null;
        const [x, z] = s.at;
        const m = mist[i];
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...tap(() => act(`stop:${task.id}:${i}`))}>
            {/* Only a soft grey mist: no figure. It thickens if you listen. */}
            {[0, 1, 2, 3].map((k) => (
              <mesh key={k} material={M('#b8b8c0', { rough: 1 })} position={[Math.cos(k * 1.6) * 0.6, 0.5 + (k % 2) * 0.3, Math.sin(k * 1.6) * 0.6]} scale={0.5 + m * 0.35}>
                <sphereGeometry args={[0.5, 8, 6]} />
              </mesh>
            ))}
            <Halo on={active} />
          </group>
        );
      })}
      <group position={[ex, t.floorY(ex, ez), ez]} {...(!delivered ? tap(() => act(`deliver:${task.id}`)) : {})}>
        <mesh material={M(delivered ? '#ffe0a0' : '#8a7a6a', delivered ? { emissive: '#c89030' } : {})} position-y={1.9}>
          <sphereGeometry args={[0.1, 8, 6]} />
        </mesh>
        {!delivered && <Halo on={active} />}
      </group>
    </group>
  );
}
