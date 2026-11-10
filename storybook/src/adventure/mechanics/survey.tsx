// Surah Ad-Dukhan: what they left behind (44:25-27, "How much they left
// behind of gardens and springs, and crops and noble sites, and comfort
// wherein they were amused"). A quiet, empty valley at dawn. Walk through it
// and count what was left: each garden, spring, field, fine building and
// place of ease gets a small flag when counted. Then, at the ledger stone,
// write down how many of each you found. It is a survey, not a scene: no
// one is shown, and nothing of the drowning is pictured (44:24, read only).
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { Terrain } from '../terrain';
import type { SurveyTask } from '../types';
import type { Mechanic, MechSave } from './base';

const all = (task: SurveyTask) => task.things.length + task.cats.length;
const doneOf = (task: SurveyTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
const counted = (task: SurveyTask, d: number[]) => task.things.map((_, i) => i).filter((i) => d.includes(i));
const howMany = (task: SurveyTask, c: number) => task.things.filter((th) => th.cat === c).length;

export const Survey: Mechanic<SurveyTask> = {
  total: all,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const out = task.things.flatMap((th, i) =>
      d.includes(i)
        ? []
        : [{ key: `count:${task.id}:${i}`, pos: env.v3(th.at), label: `Count this: ${task.cats[th.cat].name.toLowerCase()}`, reach: 3.2, run: () => env.api.progress(task.id, i) }],
    );
    if (counted(task, d).length === task.things.length && d.length < all(task))
      out.push({ key: `ledger:${task.id}`, pos: env.v3(task.ledger), label: 'Write the ledger', reach: 2.8, run: () => env.api.panel(task) });
    return out;
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const n = counted(task, d).length;
    if (n < task.things.length) return `Things counted: ${n} of ${task.things.length}`;
    if (d.length < all(task)) return 'You have walked the whole valley. Go to the ledger stone and write what you counted.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: all(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: SurveyView,
  Panel: SurveyPanel,
};

function SurveyPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<SurveyTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const c = task.cats.findIndex((_, k) => !d.includes(task.things.length + k));
  const [msg, setMsg] = useState('Write down how many of each you counted in the valley.');
  if (c < 0) return null;
  const n = howMany(task, c);
  const opts = [n - 1, n, n + 1, n + 2].filter((v) => v > 0).sort((a, b) => ((a * 7 + c) % 5) - ((b * 7 + c) % 5));
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a survey game written for this app" />
      <Text style={st.cardText}>{msg}</Text>
      <Text style={st.cardTitle}>{`${task.cats[c].name}: how many?`}</Text>
      <View style={st.row}>
        {opts.map((v) => (
          <Pressable
            key={v}
            style={st.btnGhost}
            accessibilityLabel={`${v} ${task.cats[c].name}`}
            onPress={() => {
              if (v !== n) {
                api.note(`${task.id}/x`, c);
                setMsg(`Not quite. Look back over the valley: the flags you left show what you counted. (${task.cats[c].name})`);
                return;
              }
              api.progress(task.id, task.things.length + c);
              setMsg(`${n} ${task.cats[c].name.toLowerCase()}: written in the ledger.`);
              if (c + 1 >= task.cats.length) onClose();
            }}
          >
            <Text style={st.btnGhostText}>{String(v)}</Text>
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

function Thing({ shape, x, z, t, i }: { shape: SurveyTask['cats'][number]['shape']; x: number; z: number; t: Terrain; i: number }) {
  const y = t.floorY(x, z);
  if (shape === 'garden')
    return (
      <group position={[x, y, z]}>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} position={[Math.sin(k * 1.6 + i) * 1.4, 0, Math.cos(k * 1.6 + i) * 1.4]}>
            <mesh material={M('#6a4a2a')} position-y={0.6}>
              <cylinderGeometry args={[0.08, 0.1, 1.2, 6]} />
            </mesh>
            <mesh material={M('#5a8a3a')} position-y={1.5} castShadow>
              <sphereGeometry args={[0.6, 10, 8]} />
            </mesh>
          </group>
        ))}
      </group>
    );
  if (shape === 'spring')
    return (
      <group position={[x, y + 0.03, z]}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[1.1, 1.45, 20]} />
          <meshStandardMaterial color="#b8a888" />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
          <circleGeometry args={[1.1, 20]} />
          <meshStandardMaterial color="#5a9ab8" roughness={0.15} metalness={0.2} />
        </mesh>
      </group>
    );
  if (shape === 'crop')
    return (
      <group position={[x, y, z]}>
        {[-1, 0, 1].map((r) => (
          <mesh key={r} material={M('#d8b860')} position={[r * 0.8, 0.25, 0]} castShadow>
            <boxGeometry args={[0.45, 0.5, 3]} />
          </mesh>
        ))}
      </group>
    );
  if (shape === 'site')
    return (
      <group position={[x, y, z]}>
        <mesh material={M('#e0d0b0', { map: 'stone' })} position-y={0.2} receiveShadow>
          <boxGeometry args={[3, 0.4, 2]} />
        </mesh>
        {[-1.2, -0.4, 0.4, 1.2].map((cx) => (
          <mesh key={cx} material={M('#e8dcc4', { map: 'stone' })} position={[cx, 1.4, -0.6]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 2.2, 10]} />
          </mesh>
        ))}
        <mesh material={M('#e0d0b0', { map: 'stone' })} position={[0, 2.6, -0.6]}>
          <boxGeometry args={[3, 0.25, 0.5]} />
        </mesh>
      </group>
    );
  // comfort: a canopy with cushions, left empty
  return (
    <group position={[x, y, z]}>
      {[-0.9, 0.9].map((cx) =>
        [-0.6, 0.6].map((cz) => (
          <mesh key={`${cx}${cz}`} material={M('#8a6a44')} position={[cx, 0.9, cz]}>
            <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
          </mesh>
        )),
      )}
      <mesh material={M('#c86a5a', { side: 2 })} position-y={1.82}>
        <boxGeometry args={[2, 0.05, 1.4]} />
      </mesh>
      {[-0.5, 0, 0.5].map((cx) => (
        <mesh key={cx} material={M('#d8a85a')} position={[cx, 0.12, 0]}>
          <boxGeometry args={[0.42, 0.24, 0.42]} />
        </mesh>
      ))}
    </group>
  );
}

function SurveyView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<SurveyTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [lx, lz] = task.ledger;
  const all3 = counted(task, d).length === task.things.length;
  return (
    <group>
      {task.things.map((th, i) => {
        const [x, z] = th.at;
        const y = t.floorY(x, z);
        const on = d.includes(i);
        return (
          <group key={i} {...tap(() => act(`count:${task.id}:${i}`))}>
            <Thing shape={task.cats[th.cat].shape} x={x} z={z} t={t} i={i} />
            <group position={[x + 1.8, y, z + 1.2]}>
              {on ? (
                <>
                  <mesh material={M('#6a4a2a')} position-y={0.5}>
                    <cylinderGeometry args={[0.025, 0.025, 1, 5]} />
                  </mesh>
                  <mesh material={M('#e8d4a8', { side: 2 })} position={[0.16, 0.88, 0]}>
                    <planeGeometry args={[0.3, 0.2]} />
                  </mesh>
                </>
              ) : (
                <Halo on={active} />
              )}
            </group>
          </group>
        );
      })}
      <group position={[lx, t.floorY(lx, lz), lz]} {...tap(() => act(`ledger:${task.id}`))}>
        <mesh material={M('#b8a888', { map: 'stone' })} position-y={0.55} rotation-x={-0.25} castShadow>
          <boxGeometry args={[1.3, 1.1, 0.3]} />
        </mesh>
        {all3 && d.length < all(task) && <Halo on={active} />}
      </group>
    </group>
  );
}
