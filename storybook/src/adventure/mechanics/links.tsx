// Surah Saba's Dawud chapter: links of even measure (34:10-11, "We made iron
// soft for him: make full coats of mail, and measure the links precisely").
// At a work table, a length of chain mail has a gap in each row. A tray holds
// rings of many sizes; only rings that match the row's links fit. Fit each
// row with rings of exactly the right size: a ring too big leaves the mail
// loose, too small and it will not close. Dawud is not shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { LinksTask } from '../types';
import type { Mechanic, MechSave } from './base';

const rowsDone = (task: LinksTask, s: MechSave) => (s.done.includes(task.id) ? task.rows.map((_, i) => i) : s.prog[task.id] ?? []);

export const Links: Mechanic<LinksTask> = {
  total: (task) => task.rows.length,
  uses(task, env) {
    if (rowsDone(task, env.save).length >= task.rows.length) return [];
    return [{ key: `links:${task.id}`, pos: env.v3(task.table), label: 'Fit rings into the chain mail', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = rowsDone(task, env.save);
    if (d.length < task.rows.length) return `Rows of mail finished: ${d.length} of ${task.rows.length}`;
  },
  solve(task, api) {
    const d = rowsDone(task, api.save());
    const i = task.rows.findIndex((_, j) => !d.includes(j));
    if (i >= 0) api.progress(task.id, i);
  },
  View: LinksView,
  Panel: LinksPanel,
};

function Ring({ size, color = '#7a7a84' }: { size: number; color?: string }) {
  const px = 14 + size * 6;
  return <View style={{ width: px, height: px, borderRadius: px / 2, borderWidth: 4, borderColor: color }} />;
}

function LinksPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<LinksTask>['Panel']>>[0]) {
  const d = rowsDone(task, data);
  const row = task.rows.findIndex((_, j) => !d.includes(j));
  const [placed, setPlaced] = useState(0);
  const [msg, setMsg] = useState('Each row of mail is made of rings of one size, with a gap to fill. Tap rings from the tray that match the row exactly.');
  if (row < 0) return null;
  const r = task.rows[row];
  const pick = (size: number) => {
    if (size > r.size) {
      api.note(`${task.id}/x`, row);
      setMsg('Too big: the mail would hang loose and leave gaps. Measure again.');
      return;
    }
    if (size < r.size) {
      api.note(`${task.id}/x`, row);
      setMsg('Too small: it will not close around its neighbours. Measure again.');
      return;
    }
    const n = placed + 1;
    if (n >= r.gap) {
      setPlaced(0);
      setMsg('The row is closed, every link the same size.');
      api.progress(task.id, row);
    } else {
      setPlaced(n);
      setMsg(`It fits. ${r.gap - n} more for this row.`);
    }
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a measuring game written for this app" />
      <Text style={st.cardText}>{msg}</Text>
      <Text style={[st.cardText, { fontSize: 13 }]}>{`Row ${row + 1} of ${task.rows.length}: rings in this row`}</Text>
      <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {Array.from({ length: 5 }, (_, k) => (
          <Ring key={k} size={r.size} color="#5a5a64" />
        ))}
        {Array.from({ length: r.gap }, (_, k) => (k < placed ? <Ring key={`g${k}`} size={r.size} color="#5a5a64" /> : <View key={`g${k}`} style={{ width: 14 + r.size * 6, height: 14 + r.size * 6, borderRadius: 99, borderWidth: 2, borderStyle: 'dashed', borderColor: '#b8a888' }} />))}
      </View>
      <Text style={[st.cardText, { fontSize: 13 }]}>The tray:</Text>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {task.tray.map((size, k) => (
          <Pressable key={k} onPress={() => pick(size)} accessibilityLabel={`Ring of size ${size}`} style={{ padding: 4 }}>
            <Ring size={size} color="#8a8a96" />
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

function LinksView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<LinksTask>['View']>>[0]) {
  const d = rowsDone(task, data);
  const [x, z] = task.table;
  const y = t.floorY(x, z);
  return (
    <group position={[x, y, z]} {...tap(() => act(`links:${task.id}`))}>
      <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.45} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.9, 1.1]} />
      </mesh>
      {/* The mail on the table: one row of rings for each finished row. */}
      {task.rows.map((_, i) =>
        Array.from({ length: d.includes(i) ? 9 : 5 }, (_, k) => (
          <mesh key={`${i}-${k}`} material={M('#8a8a94', { metal: 0.6, rough: 0.4 })} position={[-0.8 + k * 0.2, 0.92, -0.3 + i * 0.2]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.08, 0.02, 6, 12]} />
          </mesh>
        )),
      )}
      {d.length < task.rows.length && <Halo on={active} />}
    </group>
  );
}
