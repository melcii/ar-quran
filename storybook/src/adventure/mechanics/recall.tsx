// Surah Al-Qamar: the refrain to remember (54:17, 22, 32, 40, "And We have
// certainly made the Quran easy for remembrance, so is there any who will
// remember?"). Four standing stones line the path, one for each people the
// surah tells of: the people of Nuh, 'Ad, Thamud and the people of Lut. At
// each stone, read its passage, then put the refrain back together from its
// pieces. The first time most of it is shown; at each stone after that, more
// is left for you to remember, until at the last stone you say it all. The
// pieces are the English meaning, split at natural pauses; the Arabic is
// shown whole in the reading and is never split or changed. Nothing of the
// punishments is shown.
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { RecallTask } from '../types';
import type { Mechanic, MechSave } from './base';

const all = (task: RecallTask) => task.stones.length * 2;
const doneOf = (task: RecallTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const nextStone = (task: RecallTask, d: number[]) => task.stones.findIndex((_, k) => !d.includes(k * 2) || !d.includes(k * 2 + 1));

export const Recall: Mechanic<RecallTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const k = nextStone(task, d);
    if (k < 0) return [];
    const s = task.stones[k];
    if (!d.includes(k * 2))
      return [{ key: `stone:${task.id}:${k}`, pos: env.v3(s.at), label: `Read the stone: ${s.label}`, reach: 2.6, run: () => {
        env.api.progress(task.id, k * 2);
        env.api.open({ kind: 'reading', reading: s.reading });
      } }];
    return [{ key: `refrain:${task.id}:${k}`, pos: env.v3(s.at), label: 'Remember the refrain', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const k = nextStone(task, d);
    if (k < 0) return;
    return `Stones: ${k} of ${task.stones.length} remembered · ${d.includes(k * 2) ? 'now remember the refrain at this stone' : `walk to the stone: ${task.stones[k].label}`}`;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, j) => j).find((j) => !d.includes(j));
    if (i != null) api.progress(task.id, i);
  },
  View: RecallView,
  Panel: RecallPanel,
};

function RecallPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<RecallTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const k = nextStone(task, d);
  const hide = k >= 0 ? Math.min(task.pieces.length, task.stones[k].hide) : 0;
  // The last `hide` pieces are left for you; the rest are shown in place.
  const first = task.pieces.length - hide;
  const [got, setGot] = useState(first);
  const [msg, setMsg] = useState('Tap the missing pieces in order.');
  const tray = useMemo(() => {
    const idx = Array.from({ length: hide }, (_, j) => first + j);
    return idx.map((v, j) => ({ v, o: (v * 7 + j * 3 + k * 5) % 11 })).sort((a, b) => a.o - b.o).map((x) => x.v);
  }, [hide, first, k]);
  if (k < 0) return null;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a memory game; the pieces are the English meaning" />
      <Text style={st.cardTitle}>{`The refrain (${task.ref[0]}:${task.ref[1]})`}</Text>
      <Text style={[st.cardText, { fontSize: 18, lineHeight: 28 }]}>
        {task.pieces.map((p, j) => (j < got ? `${p} ` : '____ ')).join('')}
      </Text>
      <Text style={[st.cardText, { fontSize: 14 }]}>{msg}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tray
          .filter((v) => v >= got)
          .map((v) => (
            <Pressable
              key={v}
              style={st.btnGhost}
              accessibilityLabel={`Piece: ${task.pieces[v]}`}
              onPress={() => {
                if (v !== got) {
                  api.note(`${task.id}/x`, k * 10 + v);
                  setMsg('Not that piece yet: say the refrain to yourself from the start.');
                  return;
                }
                const g = got + 1;
                setGot(g);
                setMsg(g < task.pieces.length ? 'Yes. Next?' : 'You remembered it all.');
                if (g >= task.pieces.length) {
                  api.progress(task.id, k * 2 + 1);
                  onClose();
                }
              }}
            >
              <Text style={st.btnGhostText}>{task.pieces[v]}</Text>
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

function RecallView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<RecallTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const k = nextStone(task, d);
  return (
    <group>
      {task.stones.map((s, i) => {
        const [x, z] = s.at;
        const y = t.floorY(x, z);
        const done = d.includes(i * 2 + 1);
        return (
          <group key={i} position={[x, y, z]} {...tap(() => act(d.includes(i * 2) ? `refrain:${task.id}:${i}` : `stone:${task.id}:${i}`))}>
            <mesh material={M('#a8a090', { map: 'stone' })} position-y={1.1} castShadow>
              <boxGeometry args={[1, 2.2, 0.4]} />
            </mesh>
            {[0.5, 0.25, 0, -0.25].map((dy, j) => (
              <mesh key={j} material={M(done ? '#e8c860' : '#7a7468', done ? { emissive: '#e8c860', ei: 0.3 } : {})} position={[0, 1.4 + dy, 0.21]}>
                <boxGeometry args={[0.7 - j * 0.08, 0.05, 0.02]} />
              </mesh>
            ))}
            {i === k && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
