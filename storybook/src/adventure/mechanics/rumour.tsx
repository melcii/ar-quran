// Surah Al-Hujurat: check before you pass it on (49:6, "if there comes to
// you a disobedient one with information, investigate, lest you harm a
// people out of ignorance and become regretful over what you have done").
// A rumour runs through the village, made of several claims. Each claim can
// be checked at its source: look in the oven, at the cart, in the pen. Then
// at the notice board, mark each claim true or not true. A claim you have
// not checked cannot be passed on. The village and the rumour are a game
// idea written for this app; no one is shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { RumourTask } from '../types';
import type { Mechanic, MechSave } from './base';

const all = (task: RumourTask) => task.claims.length * 2;
const doneOf = (task: RumourTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);

export const Rumour: Mechanic<RumourTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return [];
    const out = task.claims.flatMap((c, i) =>
      d.includes(i)
        ? []
        : [{ key: `check:${task.id}:${i}`, pos: env.v3(c.at), label: c.look, reach: 2.6, run: () => {
            env.api.progress(task.id, i);
            env.api.hint(c.seen);
          } }],
    );
    out.push({ key: `board:${task.id}`, pos: env.v3(task.board), label: 'Mark the claims on the notice board', reach: 2.8, run: () => env.api.panel(task) });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const checked = task.claims.filter((_, i) => d.includes(i)).length;
    const marked = task.claims.filter((_, i) => d.includes(task.claims.length + i)).length;
    return `Claims checked: ${checked} of ${task.claims.length} · marked on the board: ${marked}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: RumourView,
  Panel: RumourPanel,
};

function RumourPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<RumourTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const n = task.claims.length;
  const [msg, setMsg] = useState('Mark each claim. Only pass on what you have checked for yourself.');
  const mark = (i: number, said: boolean) => {
    if (!d.includes(i)) {
      api.note(`${task.id}/x`, i);
      setMsg('You have not checked that claim yet. "Investigate, lest you harm people out of ignorance" (49:6). Go and look first.');
      return;
    }
    if (said !== task.claims[i].true) {
      api.note(`${task.id}/x`, n + i);
      setMsg(`That is not what you found when you looked: ${task.claims[i].seen}`);
      return;
    }
    api.progress(task.id, n + i);
    const left = task.claims.filter((_, k) => k !== i && !d.includes(n + k)).length;
    setMsg(left ? 'Marked. Next claim?' : 'Every claim is marked.');
    if (!left) onClose();
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a rumour game written for this app" />
      <Text style={[st.cardText, { fontSize: 14 }]}>{msg}</Text>
      {task.claims.map((c, i) => (
        <View key={i} style={{ gap: 4, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eadfc8' }}>
          <Text style={[st.cardText, { fontSize: 14, lineHeight: 20 }]}>{`${d.includes(n + i) ? (c.true ? '✓ True: ' : '✗ Not true: ') : d.includes(i) ? '' : '(not checked) '}“${c.text}”`}</Text>
          {!d.includes(n + i) && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={st.btnGhost} accessibilityLabel={`Claim ${i + 1} is true`} onPress={() => mark(i, true)}>
                <Text style={st.btnGhostText}>True</Text>
              </Pressable>
              <Pressable style={st.btnGhost} accessibilityLabel={`Claim ${i + 1} is not true`} onPress={() => mark(i, false)}>
                <Text style={st.btnGhostText}>Not true</Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function RumourView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<RumourTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const n = task.claims.length;
  const [bx, bz] = task.board;
  return (
    <group>
      {task.claims.map((c, i) => {
        if (d.includes(i)) return null;
        const [x, z] = c.at;
        const y = t.floorY(x, z);
        // A small "?" sign marks each source not yet checked.
        return (
          <group key={i} position={[x, y, z]} {...tap(() => act(`check:${task.id}:${i}`))}>
            <mesh material={M('#6a4a2a')} position-y={0.5}>
              <cylinderGeometry args={[0.04, 0.05, 1, 6]} />
            </mesh>
            <mesh material={M('#f0d070', { emissive: '#ffd890', ei: 0.3 })} position-y={1.1}>
              <torusGeometry args={[0.14, 0.05, 6, 12, Math.PI * 1.4]} />
            </mesh>
            <mesh material={M('#f0d070', { emissive: '#ffd890', ei: 0.3 })} position-y={0.86}>
              <sphereGeometry args={[0.05, 6, 5]} />
            </mesh>
            <Halo on={active} />
          </group>
        );
      })}
      <group position={[bx, t.floorY(bx, bz), bz]} {...tap(() => act(`board:${task.id}`))}>
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={1.25} castShadow>
          <boxGeometry args={[1.8, 1.1, 0.1]} />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <mesh key={x} material={M('#5a3a22')} position={[x, 0.6, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 1.2, 6]} />
          </mesh>
        ))}
        {task.claims.map((c, i) => (
          <mesh key={i} material={M(d.includes(n + i) ? (c.true ? '#d8ecc8' : '#f0d0c8') : '#f0e2c0')} position={[-0.6 + (i % 3) * 0.6, 1.5 - Math.floor(i / 3) * 0.45, 0.06]}>
            <boxGeometry args={[0.46, 0.32, 0.02]} />
          </mesh>
        ))}
        {d.length < all(task) && <Halo on={active} />}
      </group>
    </group>
  );
}
