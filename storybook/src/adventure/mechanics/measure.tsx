// Surah Hud's Madyan chapter: full measure (11:84-85, "O my people, give full
// measure and weight in justice and do not deprive the people of their due").
// At a grain stall in the market, each buyer asks for some measures of grain.
// Hold "Pour" to fill the wooden measure from the sack; it fills a little
// faster than you expect. Stop at the line. A short measure is refused with
// the verse's reason, and you top it up; a heaped one is levelled off with
// the strickle and the extra goes back into the sack. Last, two measures on
// the counter look the same from outside: fill both with the same scoops and
// find the one with a false raised bottom, which would always give too little.
// Shu'ayb is never shown; the buyers are named baskets, not people.
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { MeasureTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { ver: number };
const fresh = (): Live => ({ ver: 0 });

/** Steps done: one per buyer, then the false-bottom test. */
const doneOf = (task: MeasureTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.buyers.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: MeasureTask, s: MechSave) => {
  const d = doneOf(task, s);
  for (let i = 0; i <= task.buyers.length; i++) if (!d.includes(i)) return i;
  return -1;
};

/** How fast the measure fills while "Pour" is held (full measures per second). */
const RATE = 0.42;
/** A measure counts as full from here up to the brim; above, it is heaped and must be levelled. */
const FULL = 0.97;

export const Measure: Mechanic<MeasureTask> = {
  total: (task) => task.buyers.length + 1,
  uses(task, env) {
    const i = nextOf(task, env.save);
    if (i < 0) return [];
    const label = i < task.buyers.length ? `Measure grain for ${task.buyers[i].label}` : 'Test the two measures on the counter';
    return [{ key: `measure:${task.id}`, pos: env.v3(task.stall), label, reach: 3.2, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const i = nextOf(task, env.save);
    if (i < 0) return;
    const n = Math.min(i, task.buyers.length);
    return i < task.buyers.length ? `Buyers served: ${n} of ${task.buyers.length} · Next: ${task.buyers[i].label}, ${task.buyers[i].want} full measures` : 'All buyers served · Now test the two measures';
  },
  solve(task, api) {
    const i = nextOf(task, api.save());
    if (i >= 0) api.progress(task.id, i);
  },
  View: MeasureView,
  Panel: MeasurePanel,
};

function Vessel({ fill, false: raised = 0, H = 120, label }: { fill: number; false?: number; H?: number; label?: string }) {
  // The inside: `raised` is the height of a false bottom (a fraction of the measure).
  const inner = H * (1 - raised);
  const shown = Math.min(1.12, fill);
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ width: 84, height: H + 14, justifyContent: 'flex-end' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: H, borderWidth: 3, borderTopWidth: 0, borderColor: '#7a5230', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: '#f3e6cc', overflow: 'visible' }}>
          {raised > 0 && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: H * raised, backgroundColor: '#a07848' }} />}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: H * raised, height: Math.min(inner, shown * inner), backgroundColor: '#d8b050' }} />
          {shown > 1 && <View style={{ position: 'absolute', left: 8, right: 8, bottom: H - 1, height: (shown - 1) * inner, backgroundColor: '#d8b050', borderTopLeftRadius: 30, borderTopRightRadius: 30 }} />}
          <View style={{ position: 'absolute', left: -6, right: -6, bottom: H - 2, height: 2, backgroundColor: '#3a7a2a' }} />
        </View>
      </View>
      {!!label && <Text style={[st.cardText, { fontSize: 13 }]}>{label}</Text>}
    </View>
  );
}

function MeasurePanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<MeasureTask>['Panel']>>[0]) {
  const i = nextOf(task, data);
  const buyer = i >= 0 && i < task.buyers.length ? task.buyers[i] : null;
  const fill = useRef(0);
  const given = useRef(0);
  const held = useRef(false);
  const last = useRef(0);
  const [, tick] = useState(0);
  const [msg, setMsg] = useState(
    buyer
      ? `${buyer.label} asks for ${buyer.want} full measures of grain. Hold "Pour" to fill the measure, and let go at the green line. Then give it.`
      : 'Two measures stand on the counter. From outside they look the same. Pour three scoops into each and see what happens.',
  );
  const [test, setTest] = useState<null | [number, number]>(null);
  useEffect(() => {
    last.current = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - last.current) / 1000);
      last.current = now;
      if (held.current) fill.current = Math.min(1.25, fill.current + RATE * dt);
      (globalThis as Record<string, unknown>).__measure = { fill: fill.current, given: given.current, step: i };
      tick((n) => n + 1);
    }, 50);
    return () => clearInterval(id);
  }, [i]);
  if (i < 0) return null;
  const v = fill.current;
  const give = () => {
    if (!buyer) return;
    if (v < FULL) {
      api.note(`${task.id}/x`, i);
      setMsg('That is a short measure: the grain is below the line. Giving it would deprive the buyer of their due (11:85). Top it up to the line.');
      return;
    }
    if (v > 1.03) {
      setMsg('The measure is heaped above the line. Level it off with the strickle first, so it is exactly full.');
      return;
    }
    fill.current = 0;
    given.current += 1;
    if (given.current >= buyer.want) {
      given.current = 0;
      setMsg(`${buyer.label} has ${buyer.want} full measures. Fair and full.`);
      api.progress(task.id, i);
    } else setMsg(`Full measure given: ${given.current} of ${buyer.want}. Pour the next one.`);
  };
  const level = () => {
    if (v <= 1.03) {
      setMsg(v < FULL ? 'Nothing to level: the measure is not full yet.' : 'It is already level and full.');
      return;
    }
    fill.current = 1;
    setMsg('Levelled with the strickle: the extra grain goes back into the sack, and the measure is exactly full.');
  };
  // The last step: two measures, one with a false raised bottom (a third of its depth).
  const RAISED = task.falseBottom;
  const which = task.falseIn;
  const pourBoth = () => {
    const scoops = 0.8; // three scoops: four fifths of a true measure
    setTest([scoops / (which === 0 ? 1 - RAISED : 1), scoops / (which === 1 ? 1 - RAISED : 1)]);
    setMsg('The same three scoops went into each. One is still below its rim, and one is heaped over. Which measure is true?');
  };
  const pick = (k: number) => {
    if (!test) return;
    if (k === which) {
      api.note(`${task.id}/x`, i);
      setMsg('Look again: the same grain heaped up in this one, so it holds less inside. Something takes up room under the grain.');
      return;
    }
    setMsg('Yes. The other measure has a false bottom raised inside it: it always gives too little, however carefully you pour. This true one gives full measure.');
    api.progress(task.id, i);
    if (task.reading) api.open({ kind: 'reading', reading: task.reading });
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a measuring game written for this app" />
      <Text style={st.cardText}>{msg}</Text>
      {buyer ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 22 }}>
            <Vessel fill={v} label={v < FULL ? 'below the line' : v > 1.03 ? 'heaped' : 'full'} />
            <Text style={st.cardText}>{`Given: ${given.current} of ${buyer.want}`}</Text>
          </View>
          <View style={st.row}>
            <Pressable style={st.btnGhost} onPress={onClose}>
              <Text style={st.btnGhostText}>Close</Text>
            </Pressable>
            <Pressable style={st.btnGhost} onPress={level} accessibilityLabel="Level off the measure">
              <Text style={st.btnGhostText}>Level off</Text>
            </Pressable>
            <Pressable style={st.btnGhost} onPress={give} accessibilityLabel="Give the measure to the buyer">
              <Text style={st.btnGhostText}>Give</Text>
            </Pressable>
            <Pressable style={st.btn} accessibilityRole="button" onPressIn={() => (held.current = true)} onPressOut={() => (held.current = false)}>
              <Text style={st.btnText}>Pour (hold)</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 30 }}>
            {[0, 1].map((k) => (
              <Pressable key={k} onPress={() => pick(k)} accessibilityLabel={`Measure ${k ? 'B' : 'A'} is true`} disabled={!test}>
                <Vessel fill={test ? test[k] : 0} false={k === which && test ? RAISED : 0} label={`Measure ${k ? 'B' : 'A'}`} />
              </Pressable>
            ))}
          </View>
          <View style={st.row}>
            <Pressable style={st.btnGhost} onPress={onClose}>
              <Text style={st.btnGhostText}>Close</Text>
            </Pressable>
            {!test && (
              <Pressable style={st.btn} onPress={pourBoth}>
                <Text style={st.btnText}>Pour three scoops into each</Text>
              </Pressable>
            )}
            {test && <Text style={st.cardText}>Tap the true measure.</Text>}
          </View>
        </>
      )}
    </View>
  );
}

function MeasureView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<MeasureTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const [, setVer] = useState(0);
  useFrame(() => setVer((v) => (v === L.ver ? v : L.ver)));
  const d = doneOf(task, data);
  const [x, z] = task.stall;
  const y = t.floorY(x, z);
  const served = task.buyers.filter((_, k) => d.includes(k)).length;
  const all = nextOf(task, data) < 0;
  return (
    <group position={[x, y, z]} {...tap(() => act(`measure:${task.id}`))}>
      {/* The counter, the open sack and the wooden measure on it. */}
      <mesh material={M('#9a6a3e', { map: 'planks' })} position={[0, 0.45, -1.2]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.9, 0.9]} />
      </mesh>
      <mesh material={M('#d8c49a')} position={[-0.8, 1.15, -1.2]} castShadow>
        <cylinderGeometry args={[0.32, 0.38, 0.5, 14]} />
      </mesh>
      <mesh material={M('#d8b050')} position={[-0.8, 1.41, -1.2]}>
        <sphereGeometry args={[0.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[0.2, 0.75].map((dx, k) => (
        <mesh key={k} material={M('#8a5a30')} position={[dx, 1.06, -1.2]} castShadow>
          <cylinderGeometry args={[0.17, 0.15, 0.32, 14, 1, true]} />
        </mesh>
      ))}
      {/* A basket for each buyer along the front; filled ones are heaped with grain. */}
      {task.buyers.map((b, k) => (
        <group key={k} position={[-1.2 + k * 1.2, 0, 0.6]}>
          <mesh material={M(b.color ?? '#b88a50')} position-y={0.22}>
            <cylinderGeometry args={[0.32, 0.24, 0.44, 12]} />
          </mesh>
          {d.includes(k) && (
            <mesh material={M('#d8b050')} position-y={0.44}>
              <sphereGeometry args={[0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          )}
        </group>
      ))}
      {!all && <Halo on={active} />}
      {served === task.buyers.length && all && (
        <mesh position-y={2.2}>
          <torusGeometry args={[0.3, 0.05, 6, 18]} />
          <meshBasicMaterial color="#ffe8a0" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
