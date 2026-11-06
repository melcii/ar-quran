// Surah Yusuf's own play: the storehouse years. Each good year a field
// ripens; cut it, carry the harvest to the storehouse and decide how much
// the household eats and how the rest is kept. Then seven hard years come,
// and each one the town is given what it needs from the store. If the store
// runs short, the good years are planned again. What is left at the end is
// the seed for the year of rain (12:47-49). The numbers, the spoiling rule
// and the town's needs are a game written for this app.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { player } from '@/ark/shared';
import { st } from '../cards';
import { Item, M } from '../kit';
import { Halo, tap } from '../props';
import type { GranaryTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

const GOOD = 7;
const HARD = 7;

type Live = { cut: number };

/** What is in the store after the years done so far. */
export function granary(task: GranaryTask, data: MechSave) {
  const prog = data.prog[task.id] ?? [];
  const eat = data.prog[`${task.id}/eat`] ?? [];
  const ear = data.prog[`${task.id}/ear`] ?? [];
  const good = prog.filter((i) => i < GOOD).length;
  const hard = prog.filter((i) => i >= GOOD && i < GOOD + HARD).length;
  let e = 0;
  let l = 0;
  for (let y = 0; y < good; y++) {
    e *= 1 - task.loss.ear;
    l *= 1 - task.loss.loose;
    const keep = task.harvest - (eat[y] ?? task.eatMin);
    if (ear[y] === 0) l += keep;
    else e += keep;
  }
  for (let k = 0; k < hard; k++) {
    e *= 1 - task.loss.ear;
    l *= 1 - task.loss.loose;
    const fromL = Math.min(l, task.need);
    l -= fromL;
    e = Math.max(0, e - (task.need - fromL));
  }
  return { ear: e, loose: l, total: e + l, good, hard, sown: prog.includes(GOOD + HARD) };
}

/** What a hard year would leave, before giving out (one more year of spoiling). */
function nextYear(task: GranaryTask, s: { ear: number; loose: number }) {
  return { ear: s.ear * (1 - task.loss.ear), loose: s.loose * (1 - task.loss.loose) };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function restart(task: GranaryTask, api: Parameters<NonNullable<Mechanic<GranaryTask>['solve']>>[1]) {
  api.set(task.id, []);
  api.set(`${task.id}/eat`, []);
  api.set(`${task.id}/ear`, []);
}

export const Granary: Mechanic<GranaryTask> = {
  total: () => GOOD + HARD + 1,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, () => ({ cut: -1 }));
    const g = granary(task, env.save);
    if (g.good < GOOD) {
      const y = g.good;
      if (L.cut !== y)
        return [{ key: `cut:${task.id}`, pos: env.v3(task.fields[y]), label: `Cut the harvest of good year ${y + 1}`, reach: 3.4, run: () => {
          L.cut = y;
          if (y === 0) env.api.open({ kind: 'reading', reading: task.readings.good });
          env.api.hint(`${task.harvest} measures of grain, still in the ear. Carry them to the storehouse.`);
        } }];
      return [{ key: `store:${task.id}`, pos: env.v3(task.store), label: `Store the harvest of good year ${y + 1}`, reach: 3.6, run: () => env.api.panel(task) }];
    }
    if (g.hard < HARD)
      return [{ key: `hard:${task.id}`, pos: env.v3(task.store), label: `Open the storehouse: hard year ${g.hard + 1}`, reach: 3.6, run: () => {
        if (g.hard === 0 && !(env.save.prog[`${task.id}/h`] ?? []).includes(0)) {
          env.api.note(`${task.id}/h`, 0);
          env.api.open({ kind: 'reading', reading: task.readings.hard });
          env.api.hint('When you have read this, use the storehouse again to give out the first hard year.');
        } else env.api.panel(task);
      } }];
    if (!g.sown)
      return [{ key: `sow:${task.id}`, pos: env.v3(task.sow), label: 'Sow the seed you kept', reach: 3.6, run: () => {
        env.api.progress(task.id, GOOD + HARD);
        env.api.open({ kind: 'reading', reading: task.readings.rain });
      } }];
    return [];
  },
  frame(task, env) {
    const g = granary(task, env.save);
    if (g.sown) return;
    const store = `In store: ${r1(g.total)} measures (in the ear ${r1(g.ear)}, threshed ${r1(g.loose)})`;
    if (g.good < GOOD) return `Good year ${g.good + 1} of ${GOOD} · ${store}`;
    if (g.hard < HARD) return `Hard year ${g.hard + 1} of ${HARD} · the town needs ${task.need} a year · ${store}`;
    return `The hard years are over · ${store} · sow the seed`;
  },
  solve(task, api) {
    const s = api.save();
    const g = granary(task, s);
    if (g.good < GOOD) {
      api.set(`${task.id}/eat`, [...(s.prog[`${task.id}/eat`] ?? []).slice(0, g.good), task.eatMin]);
      api.set(`${task.id}/ear`, [...(s.prog[`${task.id}/ear`] ?? []).slice(0, g.good), 1]);
      api.progress(task.id, g.good);
    } else if (g.hard < HARD) api.progress(task.id, GOOD + g.hard);
  },
  View: GranaryView,
  Panel: GranaryPanel,
};

/* ------------------------------- the world ------------------------------- */

function GranaryView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<GranaryTask>['View']>>[0]) {
  const g = granary(task, data);
  const done = data.done.includes(task.id);
  const L = live<Live>(game, task.id, () => ({ cut: -1 }));
  const held = useRef<THREE.Group>(null);
  useFrame(() => {
    const h = held.current;
    if (!h) return;
    h.visible = L.cut === g.good && g.good < GOOD;
    h.position.set(player.pos.x + Math.sin(player.yaw) * 0.45, player.pos.y + 0.55, player.pos.z + Math.cos(player.yaw) * 0.45);
    h.rotation.y = player.yaw;
  });
  // Field strips: ripe, cut, growing, or dry in the hard years; green again once sown.
  const fieldColor = (i: number) => {
    if (g.sown || done) return '#7aa83e';
    if (g.good >= GOOD) return '#b89a64';
    if (i < g.good || (i === g.good && L.cut === i)) return '#c8b47a';
    if (i === g.good) return '#e8c048';
    return '#9ab44a';
  };
  // The store: sheaves (in the ear) stand in rows, threshed sacks sit beside them.
  const sheaves = Math.min(60, Math.round(g.ear));
  const sacks = Math.min(40, Math.round(g.loose));
  const [sx, sz] = task.store;
  const y0 = t.floorY(sx, sz);
  const sheafGeo = useMemo(() => new THREE.CylinderGeometry(0.16, 0.24, 0.9, 7), []);
  const sackGeo = useMemo(() => new THREE.SphereGeometry(0.3, 8, 6), []);
  const sheafMat = useMemo(() => M('#e2c066'), []);
  const sackMat = useMemo(() => M('#a88a5a', { rough: 1 }), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const ref2 = useRef<THREE.InstancedMesh>(null);
  useFrame(() => {
    const m = new THREE.Matrix4();
    const a = ref.current;
    if (a) {
      a.count = sheaves;
      for (let i = 0; i < sheaves; i++) {
        const row = Math.floor(i / 10);
        const col = i % 10;
        m.makeTranslation(sx - 8 + col * 0.48, y0 + 0.45 + Math.floor(row / 3) * 0.9, sz + 0.6 + (row % 3) * 0.5);
        a.setMatrixAt(i, m);
      }
      a.instanceMatrix.needsUpdate = true;
    }
    const b = ref2.current;
    if (b) {
      b.count = sacks;
      for (let i = 0; i < sacks; i++) {
        m.makeTranslation(sx + 4 + (i % 4) * 0.55, y0 + 0.28 + Math.floor(i / 12) * 0.5, sz + 0.6 + (Math.floor(i / 4) % 3) * 0.55);
        b.setMatrixAt(i, m);
      }
      b.instanceMatrix.needsUpdate = true;
    }
  });
  const next = g.good < GOOD ? (L.cut === g.good ? 'store' : 'field') : g.hard < HARD ? 'store' : !g.sown ? 'sow' : '';
  return (
    <group>
      {task.fields.map(([x, z], i) => (
        <group key={i} position={[x, t.floorY(x, z), z]} {...tap(() => act(i === g.good && L.cut !== i ? `cut:${task.id}` : ''))}>
          <mesh material={M(fieldColor(i), { rough: 1 })} position-y={0.12} receiveShadow castShadow>
            <boxGeometry args={[5, 0.24 + (fieldColor(i) === '#e8c048' ? 0.5 : 0), 2.6]} />
          </mesh>
          {i === g.good && next === 'field' && <Halo on={active} />}
        </group>
      ))}
      <instancedMesh ref={ref} args={[sheafGeo, sheafMat, 60]} castShadow frustumCulled={false} />
      <instancedMesh ref={ref2} args={[sackGeo, sackMat, 40]} castShadow frustumCulled={false} />
      <group position={[sx, y0, sz]} {...tap(() => act(next === 'store' ? (g.good < GOOD ? `store:${task.id}` : `hard:${task.id}`) : ''))}>
        {/* A tally board by the storehouse door. */}
        <mesh material={M('#6a4428')} position={[1.6, 0.7, 0.4]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 1.4, 6]} />
        </mesh>
        <mesh material={M('#c8a46a', { map: 'planks' })} position={[1.6, 1.35, 0.42]} castShadow>
          <boxGeometry args={[1, 0.6, 0.08]} />
        </mesh>
        {next === 'store' && <Halo on={active} />}
      </group>
      <group position={[task.sow[0], t.floorY(task.sow[0], task.sow[1]), task.sow[1]]} {...tap(() => act(next === 'sow' ? `sow:${task.id}` : ''))}>
        {next === 'sow' && <Halo on={active} />}
      </group>
      <group ref={held} scale={0.7}>
        <Item kind="hay" color="#e2c066" />
      </group>
    </group>
  );
}

/* ------------------------------- the panel ------------------------------- */

function GranaryPanel({ task, data, api, width, portrait, onClose }: Parameters<NonNullable<Mechanic<GranaryTask>['Panel']>>[0]) {
  const g = granary(task, data);
  const [eat, setEat] = useState(task.eatMin + 1);
  const [ear, setEar] = useState(true);
  const [msg, setMsg] = useState('');
  if (g.good < GOOD) {
    const keep = task.harvest - eat;
    const y = g.good;
    const store = () => {
      api.set(`${task.id}/eat`, [...(data.prog[`${task.id}/eat`] ?? []).slice(0, y), eat]);
      api.set(`${task.id}/ear`, [...(data.prog[`${task.id}/ear`] ?? []).slice(0, y), ear ? 1 : 0]);
      api.progress(task.id, y);
      onClose();
      api.hint(y + 1 < GOOD ? `Stored. Next year's field is ripening.` : 'The seven good years are over. The hard years are coming.');
    };
    return (
      <View style={[st.card, { width } as never, st.cardTall]}>
        <ScrollView style={{ maxHeight: portrait ? 540 : 470 }} contentContainerStyle={{ gap: 8 }}>
          <ContentLabel kind="activity" extra="a planning game written for this app; the numbers are made up" />
          <Text style={st.cardTitle}>Good year {y + 1} of {GOOD}</Text>
          <Text style={st.cardText}>
            The harvest: {task.harvest} measures. In the store already: {r1(g.total)}. Seven hard years will come after these, and each one the town will need {task.need} measures.
          </Text>
          <Text style={[st.tileText, { fontWeight: '700' }]}>How much does the household eat this year?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable style={pm} onPress={() => setEat(Math.max(task.eatMin, eat - 1))} accessibilityLabel="Eat less">
              <Text style={st.btnGhostText}>−</Text>
            </Pressable>
            <Text style={st.cardText}>
              eat {eat}, store {keep}
            </Text>
            <Pressable style={pm} onPress={() => setEat(Math.min(task.harvest, eat + 1))} accessibilityLabel="Eat more">
              <Text style={st.btnGhostText}>+</Text>
            </Pressable>
          </View>
          <Text style={[st.tileText, { fontWeight: '700' }]}>How is it kept?</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Pressable style={[st.tile, ear && st.tilePick]} onPress={() => setEar(true)} accessibilityRole="button">
              <Text style={st.tileText}>Leave it in the ear</Text>
              <Text style={st.small}>Loses about {Math.round(task.loss.ear * 100)} in 100 a year in this game.</Text>
            </Pressable>
            <Pressable style={[st.tile, !ear && st.tilePick]} onPress={() => setEar(false)} accessibilityRole="button">
              <Text style={st.tileText}>Thresh it now</Text>
              <Text style={st.small}>Loses about {Math.round(task.loss.loose * 100)} in 100 a year in this game.</Text>
            </Pressable>
          </View>
          <Text style={st.small}>
            Game rule, simplified: grain left in its ear keeps far better in store than loose grain. The advice to leave it in its spikes, eating only a little, is in ayah 12:47.
          </Text>
        </ScrollView>
        <View style={st.row}>
          <Pressable style={st.btnGhost} onPress={onClose}>
            <Text style={st.btnGhostText}>Close</Text>
          </Pressable>
          <Pressable style={st.btn} onPress={store} accessibilityRole="button">
            <Text style={st.btnText}>Put it in the storehouse</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const k = g.hard;
  const n = nextYear(task, g);
  const have = n.ear + n.loose;
  const last = k === HARD - 1;
  const short = have < task.need - 1e-6;
  const noSeed = last && !short && have - task.need < task.seed - 1e-6;
  const give = () => {
    api.progress(task.id, GOOD + k);
    onClose();
    api.hint(last ? `The seven hard years are over, and ${r1(have - task.need)} measures are left for seed.` : `Year ${k + 1} given out. ${r1(have - task.need)} measures left in store.`);
  };
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a planning game written for this app; the numbers are made up" />
      <Text style={st.cardTitle}>Hard year {k + 1} of {HARD}</Text>
      <Text style={st.cardText}>
        Nothing grew this year. The town needs {task.need} measures. In the store, after another year of keeping: {r1(have)} (in the ear {r1(n.ear)}, threshed {r1(n.loose)}).
      </Text>
      {short && <Text style={st.cardText}>The store has run short. In this game the good years can be planned again: eat only a little, and keep the grain in its ear.</Text>}
      {noSeed && <Text style={st.cardText}>This is the last hard year, and giving it out would leave less than {task.seed} measures to sow. Plan the good years again so a little is left over (12:48).</Text>}
      {msg ? <Text style={st.small}>{msg}</Text> : null}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
        {short || noSeed ? (
          <Pressable
            style={st.btn}
            accessibilityRole="button"
            onPress={() => {
              restart(task, api);
              setMsg('');
              onClose();
              api.say('The years begin again. The first field is ripening. This time, think about how much will be needed in the hard years before deciding how much to eat.');
            }}
          >
            <Text style={st.btnText}>Plan the good years again</Text>
          </Pressable>
        ) : (
          <Pressable style={st.btn} onPress={give} accessibilityRole="button">
            <Text style={st.btnText}>Give out {task.need} measures</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const pm = { borderWidth: 1, borderColor: '#cbb894', borderRadius: 999, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' } as const;
