// Surah Al-Adiyat: the chargers (100:1-5, "By the chargers, panting, striking
// sparks, raiding at dawn, raising dust"; 100:6, "Indeed man is ungrateful
// to his Lord"). At a horse paddock at dawn, a horse is worked round the
// ring at its four paces. Watch which hooves strike the ground on each beat
// and name the pace: the walk is four even beats, one foot at a time; the
// trot is two beats, diagonal pairs together; the canter is three beats and
// a lift; the gallop is four quick beats and a moment with every hoof off
// the ground. Then the horse that gave everything is cared for: walked
// until its breathing slows, given water and rubbed down. The paddock is a
// game; horses' gaits are real. No raid or battle is shown.
import { useFrame } from '@react-three/fiber';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { GaitsTask } from '../types';
import type { Mechanic, MechSave } from './base';

type Gait = GaitsTask['runs'][number];
type Foot = 'LF' | 'RF' | 'LH' | 'RH';
/** Which hooves strike on each beat; an empty beat is the moment all four are off the ground. */
export const BEATS: Record<Gait, Foot[][]> = {
  walk: [['LH'], ['LF'], ['RH'], ['RF']],
  trot: [['LH', 'RF'], ['RH', 'LF']],
  canter: [['LH'], ['RH', 'LF'], ['RF'], []],
  gallop: [['LH'], ['RH'], ['LF'], ['RF'], []],
};
const BEAT_MS: Record<Gait, number> = { walk: 520, trot: 380, canter: 300, gallop: 200 };
const SPEED: Record<Gait, number> = { walk: 0.25, trot: 0.5, canter: 0.75, gallop: 1.1 };
const NAMES: Gait[] = ['walk', 'trot', 'canter', 'gallop'];
const CARE = ['Walk it until its breathing slows', 'Give it water', 'Rub it down with straw'];
const doneOf = (task: GaitsTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.runs.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
const runOf = (task: GaitsTask, d: number[]) => task.runs.findIndex((_, i) => !d.includes(i));

export const Gaits: Mechanic<GaitsTask> = {
  total: (task) => task.runs.length + 1,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(task.runs.length)) return [];
    const r = runOf(task, d);
    return [{ key: `rail:${task.id}`, pos: env.v3(task.at), label: r >= 0 ? 'Watch the hooves' : 'Care for the horse', reach: 2.8, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(task.runs.length)) return;
    const r = runOf(task, d);
    return r >= 0 ? `Paces named: ${d.length} of ${task.runs.length}` : 'The horse has run its paces: care for it';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = Array.from({ length: task.runs.length + 1 }, (_, k) => k).find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: GaitsView,
  Panel: GaitsPanel,
};

/** Four hooves, seen from above, lit as they strike. */
function Hooves({ gait }: { gait: Gait }) {
  const [b, setB] = useState(0);
  useEffect(() => {
    setB(0);
    const id = setInterval(() => setB((k) => k + 1), BEAT_MS[gait]);
    return () => clearInterval(id);
  }, [gait]);
  const seq = BEATS[gait];
  const down = seq[b % seq.length];
  const hoof = (f: Foot, label: string) => (
    <View key={f} style={{ width: 92, alignItems: 'center', gap: 2 }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: down.includes(f) ? '#c87a2a' : '#e8dcc0', borderWidth: 2, borderColor: '#6a4a2a' }} />
      <Text style={{ fontSize: 11, color: '#4a3a2a' }}>{label}</Text>
    </View>
  );
  return (
    <View style={{ alignSelf: 'center', alignItems: 'center', gap: 6, padding: 8, backgroundColor: '#f4ead2', borderRadius: 8 }}>
      <View style={{ flexDirection: 'row' }}>{[hoof('LF', 'left front'), hoof('RF', 'right front')]}</View>
      <View style={{ flexDirection: 'row' }}>{[hoof('LH', 'left hind'), hoof('RH', 'right hind')]}</View>
      <Text style={{ fontSize: 12, color: '#4a3a2a' }}>{down.length ? `Beat ${(b % seq.length) + 1}` : 'All four hooves off the ground'}</Text>
    </View>
  );
}

function GaitsPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<GaitsTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const r = runOf(task, d);
  const [msg, setMsg] = useState('');
  const [care, setCare] = useState<number[]>([]);
  if (d.includes(task.runs.length)) return null;
  const frame = (title: string, text: string, body: ReactElement) => (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a horse-paddock game; horses' paces are real" />
      <Text style={st.cardTitle}>{title}</Text>
      <Text style={st.cardText}>{msg || text}</Text>
      {body}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
  if (r < 0)
    return frame(
      'Care for the horse',
      'The horse is hot and blowing after its run. It gave everything it had: look after it.',
      <View style={{ gap: 6 }}>
        {CARE.map((c, k) => (
          <Pressable key={c} style={care.includes(k) ? st.btn : st.btnGhost} accessibilityLabel={c} onPress={() => {
            if (care.includes(k)) return;
            if (k > 0 && !care.includes(0)) {
              api.note(`${task.id}/hot`, k);
              setMsg('It is still hot and blowing hard. First walk it quietly round until its breathing slows.');
              return;
            }
            const next = [...care, k];
            setCare(next);
            setMsg(['Round the ring at a quiet walk: its breathing slows and its sides stop heaving.', 'It drinks long from the bucket.', 'You rub the sweat off its coat with a twist of straw.'][k]);
            if (next.length === CARE.length) {
              api.progress(task.id, task.runs.length);
              api.hint('The horse is cool, watered and rubbed down, and it nuzzles your shoulder.');
              onClose();
            }
          }}>
            <Text style={care.includes(k) ? st.btnText : st.btnGhostText}>{c}</Text>
          </Pressable>
        ))}
      </View>,
    );
  const g = task.runs[r];
  return frame(
    'Watch the hooves',
    'The horse goes round the ring. Watch which hooves strike the ground on each beat. Which pace is it?',
    <>
      <Hooves gait={g} />
      <View style={[st.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {NAMES.map((n) => (
          <Pressable key={n} style={st.btnGhost} accessibilityLabel={`It is a ${n}`} onPress={() => {
            if (n !== g) {
              api.note(`${task.id}/x`, r * 10 + NAMES.indexOf(n));
              const beats = BEATS[g].filter((b) => b.length).length;
              setMsg(`Not a ${n}. Count again: ${beats} beat${beats > 1 ? 's' : ''}, ${BEATS[g].some((b) => b.length === 2) ? 'with two hooves together' : 'one hoof at a time'}${BEATS[g].some((b) => !b.length) ? ', and a moment with every hoof in the air' : ''}.`);
              return;
            }
            api.progress(task.id, r);
            setMsg(r + 1 < task.runs.length ? `Yes, a ${n}. The rider changes pace.` : `Yes, a ${n}. The run is over: the horse is hot and blowing.`);
          }}>
            <Text style={st.btnGhostText}>{`It is a ${n}`}</Text>
          </Pressable>
        ))}
      </View>
    </>,
  );
}

function GaitsView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<GaitsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const r = runOf(task, d);
  const all = d.includes(task.runs.length);
  const g: Gait = r >= 0 ? task.runs[r] : 'walk';
  const [cx, cz] = task.ring;
  const horse = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Mesh | null)[]>([]);
  const a = useRef(0);
  useFrame((_, dt) => {
    const h = horse.current;
    if (!h) return;
    const sp = all ? 0 : SPEED[g] * (r < 0 ? 0.3 : 1);
    a.current += dt * sp;
    const R = 5;
    const x = cx + Math.cos(a.current) * R;
    const z = cz + Math.sin(a.current) * R;
    h.position.set(x, t.floorY(x, z), z);
    h.rotation.y = -a.current;
    const seq = BEATS[g];
    const beat = Math.floor((performance.now() / BEAT_MS[g]) % seq.length);
    const ft: Foot[] = ['LF', 'RF', 'LH', 'RH'];
    legs.current.forEach((m, k) => {
      if (m) m.position.y = sp && !seq[beat].includes(ft[k]) ? 0.5 : 0.4;
    });
  });
  const [x, z] = task.at;
  return (
    <group>
      <group ref={horse}>
        <mesh material={M('#7a4a2a')} position-y={1.1} castShadow>
          <boxGeometry args={[0.5, 0.55, 1.5]} />
        </mesh>
        <mesh material={M('#7a4a2a')} position={[0, 1.55, 0.85]} rotation-x={-0.6}>
          <boxGeometry args={[0.3, 0.7, 0.32]} />
        </mesh>
        <mesh material={M('#3a2a1a')} position={[0, 1.2, -0.85]} rotation-x={0.5}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
        </mesh>
        {[[-0.18, 0.6], [0.18, 0.6], [-0.18, -0.6], [0.18, -0.6]].map(([lx, lz], k) => (
          <mesh key={k} ref={(m) => { legs.current[k] = m; }} material={M('#5a3a1a')} position={[lx, 0.4, lz]}>
            <boxGeometry args={[0.12, 0.8, 0.12]} />
          </mesh>
        ))}
      </group>
      <group position={[x, t.floorY(x, z), z]} {...(!all ? tap(() => act(`rail:${task.id}`)) : {})}>
        <mesh material={M('#8a6a44')} position-y={0.6}>
          <boxGeometry args={[1.6, 0.1, 0.1]} />
        </mesh>
        {[-0.75, 0.75].map((px) => (
          <mesh key={px} material={M('#6a4a2a')} position={[px, 0.5, 0]}>
            <boxGeometry args={[0.12, 1, 0.12]} />
          </mesh>
        ))}
        {!all && <Halo on={active} />}
      </group>
    </group>
  );
}
