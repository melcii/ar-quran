// Surah Ibrahim's own play: growing the good tree of the parable (14:24-26).
// Find firm ground (loose sand gives a tree no stability), carry water to
// the roots, choose good words to raise the branches, then gather fruit
// season after season ("it produces its fruit all the time") and leave it
// for travellers at the valley's resting place (14:37). A loose-rooted
// sapling on the sand blows over when the wind comes, for comparison. The
// tree is a picture of the parable made for this game, not a real tree from
// Ibrahim's life, and the words are examples written for this app.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion, player } from '@/ark/shared';
import { st } from '../cards';
import { Item, M } from '../kit';
import { Halo, tap } from '../props';
import type { GrowTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { carry: 'water' | 'fruit' | null; fall: number };

const stageOf = (task: GrowTask, data: MechSave) => (data.done.includes(task.id) ? 2 + task.waters + task.seasons.length : (data.prog[task.id] ?? []).length);
const spotOf = (task: GrowTask, data: MechSave) => task.spots[(data.prog[`${task.id}/spot`] ?? [])[0] ?? task.spots.findIndex((s) => s.firm)];

export const Grow: Mechanic<GrowTask> = {
  total: (task) => 2 + task.waters + task.seasons.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, () => ({ carry: null, fall: 0 }));
    const n = env.prog.length;
    const W = task.waters;
    if (n === 0)
      return task.spots.map((sp, i) => ({ key: `plant:${task.id}:${i}`, pos: env.v3(sp.at), label: `Plant the seedling: ${sp.label}`, reach: 2.8, run: () => {
        if (!sp.firm) {
          env.api.note(`${task.id}/x`, i);
          env.api.hint(sp.why);
          if ((env.save.prog[`${task.id}/x`] ?? []).length === 0) env.api.open({ kind: 'reading', reading: task.readings.loose });
          return;
        }
        env.api.set(`${task.id}/spot`, [i]);
        env.api.progress(task.id, 0);
        env.api.open({ kind: 'reading', reading: task.readings.firm });
      } }));
    const tree = env.v3(spotOf(task, env.save).at);
    if (n <= W) {
      if (L.carry !== 'water')
        return [{ key: `fill:${task.id}`, pos: env.v3(task.spring), label: 'Fill the jug at the spring', reach: 3, run: () => {
          L.carry = 'water';
          env.api.hint('Carry the water to the young tree.');
        } }];
      return [{ key: `water:${task.id}`, pos: tree, label: 'Water the roots', reach: 3, run: () => {
        L.carry = null;
        env.api.progress(task.id, n);
        env.api.hint(n < W ? 'The roots reach a little deeper.' : 'The roots are deep and firm now.');
      } }];
    }
    if (n === W + 1) return [{ key: `words:${task.id}`, pos: tree, label: 'Choose good words for the branches', reach: 3.2, run: () => env.api.panel(task) }];
    const k = n - W - 2;
    const season = task.seasons[k];
    if (!season) return [];
    if (L.carry !== 'fruit')
      return [{ key: `pick:${task.id}`, pos: tree, label: `Gather the ${season.fruit} (${season.label})`, reach: 3.2, run: () => {
        L.carry = 'fruit';
        if (k === 0) env.api.open({ kind: 'reading', reading: task.readings.fruit });
        env.api.hint('Carry the fruit to the resting place for travellers.');
      } }];
    return [{ key: `give:${task.id}`, pos: env.v3(task.share), label: 'Leave the fruit for travellers', reach: 3, run: () => {
      L.carry = null;
      env.api.progress(task.id, n);
      if (k + 1 < task.seasons.length) env.api.hint(`The season turns. Soon the tree will have fruit again.`);
    } }];
  },
  frame(task, env) {
    const n = env.prog.length;
    const W = task.waters;
    if (n === 0) return 'Find firm ground for the seedling';
    if (n <= W) return `Roots watered: ${n - 1} of ${W} · carry water from the spring`;
    if (n === W + 1) return 'The roots are firm. Now the branches.';
    const k = n - W - 2;
    if (task.seasons[k]) return `Season ${k + 1} of ${task.seasons.length}: ${task.seasons[k].label}`;
  },
  solve(task, api) {
    api.progress(task.id, task.waters + 1);
  },
  View: GrowView,
  Panel: WordsPanel,
};

function GrowView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<GrowTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, () => ({ carry: null, fall: 0 }));
  const n = stageOf(task, data);
  const W = task.waters;
  const planted = n > 0;
  const tried = data.prog[`${task.id}/x`] ?? [];
  const sp = spotOf(task, data);
  const roots = Math.min(W, Math.max(0, n - 1));
  const branches = n > W + 1;
  const k = n - W - 2;
  const season = task.seasons[Math.min(task.seasons.length - 1, Math.max(0, k))];
  const showFruit = branches && (k < task.seasons.length ? L.carry !== 'fruit' : true);
  const trunkH = planted ? 0.7 + roots * 0.35 + (branches ? 1.6 : 0) : 0;
  const crown = planted ? 0.5 + roots * 0.15 + (branches ? 1.5 : 0) : 0;
  const held = useRef<THREE.Group>(null);
  const loose = useRef<THREE.Group>(null);
  useFrame((stt, dt) => {
    const h = held.current;
    if (h) {
      h.visible = !!L.carry;
      h.position.set(player.pos.x + Math.sin(player.yaw) * 0.45, player.pos.y + 0.55, player.pos.z + Math.cos(player.yaw) * 0.45);
      h.rotation.y = player.yaw;
    }
    const g = loose.current;
    if (g) {
      // The loose sapling sways, and once the good tree has its branches the wind takes it over.
      if (branches) L.fall = Math.min(1.45, L.fall + dt * (motion.reduced ? 3 : 0.8));
      g.rotation.z = L.fall + (L.fall < 1.4 && !motion.reduced ? Math.sin(stt.clock.elapsedTime * 3) * 0.12 : 0);
    }
  });
  const [lx, lz] = task.loose;
  const [sx, sz] = task.share;
  const given = Math.max(0, Math.min(task.seasons.length, k));
  return (
    <group>
      {!planted &&
        task.spots.map((s, i) => (
          <group key={i} position={[s.at[0], t.floorY(s.at[0], s.at[1]), s.at[1]]} {...tap(() => act(`plant:${task.id}:${i}`))}>
            <mesh material={M(s.firm ? '#7a6a4a' : '#e2cf9c', { rough: 1 })} position-y={0.03} receiveShadow>
              <cylinderGeometry args={[1.1, 1.2, 0.06, 20]} />
            </mesh>
            <mesh material={M('#6a4428')} position-y={0.45}>
              <cylinderGeometry args={[0.04, 0.05, 0.9, 5]} />
            </mesh>
            {tried.includes(i) && (
              <mesh material={M('#c8b480', { rough: 1 })} position={[0.4, 0.1, 0]} rotation-z={1.3}>
                <cylinderGeometry args={[0.03, 0.04, 0.6, 5]} />
              </mesh>
            )}
            <Halo on={active} />
          </group>
        ))}
      {planted && (
        <group position={[sp.at[0], t.floorY(sp.at[0], sp.at[1]), sp.at[1]]} {...tap(() => act(n <= W ? `water:${task.id}` : n === W + 1 ? `words:${task.id}` : `pick:${task.id}`))}>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            const len = 0.5 + roots * 0.45;
            return (
              <mesh key={i} material={M('#6a4a30')} position={[Math.cos(a) * len * 0.5, 0.05, Math.sin(a) * len * 0.5]} rotation={[0, -a, Math.PI / 2]}>
                <cylinderGeometry args={[0.05, 0.1, len, 5]} />
              </mesh>
            );
          })}
          <mesh material={M('#7a5432')} position-y={trunkH / 2} castShadow>
            <cylinderGeometry args={[0.1 + roots * 0.04 + (branches ? 0.1 : 0), 0.18 + roots * 0.05 + (branches ? 0.12 : 0), trunkH, 8]} />
          </mesh>
          {branches &&
            [0, 2.1, 4.2].map((a, i) => (
              <mesh key={i} material={M('#7a5432')} position={[Math.cos(a) * 0.5, trunkH * 0.85, Math.sin(a) * 0.5]} rotation={[Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7]} castShadow>
                <cylinderGeometry args={[0.06, 0.1, 1.4, 6]} />
              </mesh>
            ))}
          <mesh material={M(branches ? '#4f8a34' : '#6aa040')} position-y={trunkH + crown * 0.55} scale={[crown, crown * 0.8, crown]} castShadow>
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
          {showFruit &&
            Array.from({ length: 9 }, (_, i) => {
              const a = i * 2.4;
              const y = trunkH + crown * (0.2 + (i % 3) * 0.3);
              return (
                <mesh key={i} material={M(season.color)} position={[Math.cos(a) * crown * 0.92, y, Math.sin(a) * crown * 0.92]}>
                  <sphereGeometry args={[0.13, 8, 6]} />
                </mesh>
              );
            })}
          <Halo on={active && n > 0} />
        </group>
      )}
      <group position={[lx, t.floorY(lx, lz), lz]}>
        <group ref={loose}>
          <mesh material={M('#9a7a52')} position-y={0.7}>
            <cylinderGeometry args={[0.05, 0.08, 1.4, 5]} />
          </mesh>
          <mesh material={M('#9aa050')} position-y={1.5} scale={[0.5, 0.4, 0.5]}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
        </group>
      </group>
      <group position={[task.spring[0], t.floorY(task.spring[0], task.spring[1]), task.spring[1]]} {...tap(() => act(`fill:${task.id}`))}>
        <mesh material={M('#a89a80', { map: 'stone' })} position-y={0.25} receiveShadow castShadow>
          <cylinderGeometry args={[1.1, 1.2, 0.5, 16, 1, true]} />
        </mesh>
        <mesh material={M('#5a9aa8', { rough: 0.1 })} position-y={0.4} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[1.05, 20]} />
        </mesh>
      </group>
      <group position={[sx, t.floorY(sx, sz), sz]} {...tap(() => act(`give:${task.id}`))}>
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={0.45} castShadow>
          <boxGeometry args={[1.8, 0.1, 0.9]} />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} material={M('#6a4428')} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.1, 0.4, 0.8]} />
          </mesh>
        ))}
        {task.seasons.slice(0, given).map((s, i) => (
          <mesh key={i} material={M(s.color)} position={[-0.5 + i * 0.5, 0.62, 0]}>
            <sphereGeometry args={[0.2, 10, 8]} />
          </mesh>
        ))}
      </group>
      <group ref={held} scale={0.7}>
        {L.carry === 'water' && <Item kind="water" />}
        {L.carry === 'fruit' && <Item kind="fruit" color={season.color} />}
      </group>
    </group>
  );
}

function WordsPanel({ task, data, api, width, portrait, onClose }: Parameters<NonNullable<Mechanic<GrowTask>['Panel']>>[0]) {
  const [picked, setPicked] = useState<number[]>([]);
  const [why, setWhy] = useState('');
  const good = task.words.map((w, i) => (w.good ? i : -1)).filter((i) => i >= 0);
  const all = good.every((i) => picked.includes(i));
  void data;
  return (
    <View style={[st.card, { width } as never, st.cardTall]}>
      <ScrollView style={{ maxHeight: portrait ? 520 : 440 }} contentContainerStyle={{ gap: 8 }}>
        <ContentLabel kind="activity" extra="example words written for this app" />
        <Text style={st.cardText}>The parable compares a good word to a good tree. Choose the words that would make this tree's branches grow: true, kind and helpful words. Leave out the rest.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {task.words.map((w, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              style={[st.tile, picked.includes(i) && st.tileDone]}
              onPress={() => {
                setWhy(w.why);
                if (w.good && !picked.includes(i)) setPicked([...picked, i]);
              }}
            >
              <Text style={st.tileText}>{w.text}</Text>
            </Pressable>
          ))}
        </View>
        {why ? <Text style={st.small}>{why}</Text> : null}
      </ScrollView>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
        {all && (
          <Pressable
            style={st.btn}
            accessibilityRole="button"
            onPress={() => {
              api.progress(task.id, task.waters + 1);
              onClose();
              api.say('The branches rise toward the sky. A strong wind blows across the valley: the young tree on the sand, with no roots to hold it, is blown over. The good tree stands firm.');
            }}
          >
            <Text style={st.btnText}>Let the branches grow</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
