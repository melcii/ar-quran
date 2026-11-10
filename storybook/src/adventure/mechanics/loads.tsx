// Surah At-Talaq: no soul is burdened beyond what it was given (65:7, "Let
// a man of wealth spend from his wealth, and he whose provision is
// restricted, let him spend from what Allah has given him. Allah does not
// charge a soul except with what He has given it. Allah will bring about,
// after hardship, ease"). A family is moving to a new house over the hill,
// and everything they own waits in the yard: a chest, sacks, jars, bedding.
// Four carriers stand ready, each able to take only so much: a big cart, a
// small cart, a donkey and a handcart. Share the load so that every parcel
// goes and no carrier takes more than it can. Then lead them over the hill
// (uphill first, then down: after hardship, ease). The family and the move
// are a game idea; no one is shown. The surah's rulings on divorce are not
// played; they are for grown-ups and scholars.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type * as THREE from 'three';
import { player } from '@/ark/shared';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { LoadsTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: LoadsTask, s: MechSave) => (s.done.includes(task.id) ? [0, 1] : s.prog[task.id] ?? []);
/** Which cart each parcel is on (-1: still in the yard). */
const planOf = (task: LoadsTask, s: MechSave) => {
  const p = s.prog[`${task.id}/plan`];
  return p && p.length === task.parcels.length ? p : task.parcels.map(() => -1);
};
const loadOf = (task: LoadsTask, plan: number[], c: number) => plan.reduce((a, on, i) => a + (on === c ? task.parcels[i].w : 0), 0);
/** A plan the solver uses: heaviest parcels first, each on the cart with most room left. */
function fit(task: LoadsTask): number[] | null {
  const order = task.parcels.map((_, i) => i).sort((a, b) => task.parcels[b].w - task.parcels[a].w);
  const plan = task.parcels.map(() => -1);
  const go = (k: number): boolean => {
    if (k >= order.length) return true;
    const i = order[k];
    for (let c = 0; c < task.carts.length; c++) {
      if (loadOf(task, plan, c) + task.parcels[i].w > task.carts[c].cap) continue;
      plan[i] = c;
      if (go(k + 1)) return true;
      plan[i] = -1;
    }
    return false;
  };
  return go(0) ? plan : null;
}

export const Loads: Mechanic<LoadsTask> = {
  total: () => 2,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (!d.includes(0)) return [{ key: `load:${task.id}`, pos: env.v3(task.at), label: 'Share out the load', reach: 3.2, run: () => env.api.panel(task) }];
    if (!d.includes(1))
      return [{ key: `arrive:${task.id}`, pos: env.v3(task.to), label: 'Unload at the new house', reach: 3.4, run: () => {
        env.api.progress(task.id, 1);
      } }];
    return [];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (!d.includes(0)) {
      const plan = planOf(task, env.save);
      return `Parcels loaded: ${plan.filter((c) => c >= 0).length} of ${task.parcels.length}`;
    }
    if (!d.includes(1)) return 'Lead the carriers over the hill to the new house: uphill first, then down.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    if (!d.includes(0)) {
      const plan = fit(task);
      if (plan) api.set(`${task.id}/plan`, plan);
      api.progress(task.id, 0);
    } else api.progress(task.id, 1);
  },
  View: LoadsView,
  Panel: LoadsPanel,
};

function LoadsPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<LoadsTask>['Panel']>>[0]) {
  const [plan, setPlan] = useState<number[]>(planOf(task, data));
  const [pick, setPick] = useState(-1);
  const [msg, setMsg] = useState('');
  const save = (p: number[]) => {
    setPlan(p);
    api.set(`${task.id}/plan`, p);
  };
  const left = task.parcels.map((_, i) => i).filter((i) => plan[i] < 0);
  return (
    <View style={[st.card, { width } as never, st.cardTall]}>
      <ContentLabel kind="activity" extra="a sharing-the-load game written for this app" />
      <Text style={st.cardTitle}>Share out the load</Text>
      <Text style={[st.cardText, { fontSize: 14 }]}>{msg || (pick >= 0 ? `Which carrier takes the ${task.parcels[pick].name} (${task.parcels[pick].w})?` : 'Tap a parcel, then the carrier that will take it. Every parcel must go, and no carrier may take more than it can.')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {left.map((i) => (
          <Pressable key={i} style={pick === i ? st.btn : st.btnGhost} accessibilityLabel={`Parcel: ${task.parcels[i].name}`} onPress={() => { setPick(i); setMsg(''); }}>
            <Text style={pick === i ? st.btnText : st.btnGhostText}>{`${task.parcels[i].name} (${task.parcels[i].w})`}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ gap: 6 }}>
        {task.carts.map((c, k) => {
          const load = loadOf(task, plan, k);
          return (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable
                style={[st.btnGhost, { minWidth: 150 }]}
                accessibilityLabel={`Carrier: ${c.name}`}
                onPress={() => {
                  if (pick < 0) return;
                  const w = task.parcels[pick].w;
                  if (load + w > c.cap) {
                    api.note(`${task.id}/x`, k * 100 + pick);
                    setMsg(`The ${c.name} can take ${c.cap}, and already has ${load}. The ${task.parcels[pick].name} (${w}) would be too much for it.`);
                    return;
                  }
                  const p = plan.slice();
                  p[pick] = k;
                  save(p);
                  setPick(-1);
                  setMsg('');
                }}
              >
                <Text style={st.btnGhostText}>{`${c.name}: ${load} of ${c.cap}`}</Text>
              </Pressable>
              <Text style={[st.cardText, { fontSize: 12, flex: 1 }]} numberOfLines={2}>
                {task.parcels.map((pp, i) => (plan[i] === k ? pp.name : null)).filter(Boolean).join(', ')}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={st.row}>
        <Pressable style={st.btnGhost} accessibilityLabel="Unload everything" onPress={() => { save(task.parcels.map(() => -1)); setPick(-1); setMsg('Everything is back in the yard.'); }}>
          <Text style={st.btnGhostText}>Start again</Text>
        </Pressable>
        <Pressable
          style={left.length ? st.btnGhost : st.btn}
          accessibilityLabel="Set off"
          onPress={() => {
            if (left.length) {
              setMsg(`There are still ${left.length} parcels in the yard. Everything must go.`);
              return;
            }
            api.progress(task.id, 0);
            api.hint('Everyone is loaded, and no one carries more than they can. Lead them up the hill to the new house.');
            onClose();
          }}
        >
          <Text style={left.length ? st.btnGhostText : st.btnText}>Set off</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LoadsView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<LoadsTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const plan = planOf(task, data);
  const arrived = d.includes(1);
  const following = d.includes(0) && !arrived;
  const [x, z] = arrived ? task.to : task.at;
  const g = useRef<THREE.Group>(null);
  // Once loaded, the carriers follow a few steps behind you over the hill.
  useFrame((_, dt) => {
    const o = g.current;
    if (!o || !following) return;
    const tx = player.pos.x - Math.sin(player.yaw) * 4;
    const tz = player.pos.z - Math.cos(player.yaw) * 4;
    const k = Math.min(1, dt * 1.5);
    o.position.x += (tx - o.position.x) * k;
    o.position.z += (tz - o.position.z) * k;
    o.position.y = t.floorY(o.position.x, o.position.z);
    o.rotation.y = player.yaw;
  });
  return (
    <group>
      <group ref={g} position={[x, t.floorY(x, z), z]} {...(!d.includes(0) ? tap(() => act(`load:${task.id}`)) : {})}>
        {/* The carriers in a row, each with what it carries stacked on it. */}
        {task.carts.map((c, k) => {
          const px = (k - (task.carts.length - 1) / 2) * 1.8;
          const size = 0.5 + c.cap * 0.07;
          return (
            <group key={k} position={[px, 0, 0]}>
              <mesh material={M(k === 2 ? '#8a7a6a' : '#8a6a44', k === 2 ? {} : { map: 'planks' })} position-y={0.45} castShadow>
                <boxGeometry args={[size, 0.3, 1.2]} />
              </mesh>
              {k !== 2 &&
                [-1, 1].map((s) => (
                  <mesh key={s} material={M('#5a4030')} position={[(s * size) / 2, 0.3, 0]} rotation-z={Math.PI / 2}>
                    <cylinderGeometry args={[0.3, 0.3, 0.08, 10]} />
                  </mesh>
                ))}
              {task.parcels.map((pp, i) => (plan[i] === k ? i : -1))
                .filter((i) => i >= 0)
                .map((i, j) => (
                  <mesh key={i} material={M(['#a8784a', '#d8c8a0', '#b86a4a', '#8a6a8a'][i % 4])} position={[0, 0.7 + j * 0.24, 0]} castShadow>
                    <boxGeometry args={[size * 0.7, 0.2, 0.8]} />
                  </mesh>
                ))}
            </group>
          );
        })}
        {/* Parcels still in the yard. */}
        {!d.includes(0) &&
          task.parcels.map((pp, i) =>
            plan[i] >= 0 ? null : (
              <mesh key={`y${i}`} material={M(['#a8784a', '#d8c8a0', '#b86a4a', '#8a6a8a'][i % 4])} position={[-3 + (i % 5) * 1.5, 0.15 + pp.w * 0.03, 2 + Math.floor(i / 5) * 1.2]} castShadow>
                <boxGeometry args={[0.4 + pp.w * 0.08, 0.3 + pp.w * 0.06, 0.5]} />
              </mesh>
            ),
          )}
        {!d.includes(0) && <Halo on={active} />}
      </group>
      {d.includes(0) && !arrived && (
        <group position={[task.to[0], t.floorY(...task.to), task.to[1]]} {...tap(() => act(`arrive:${task.id}`))}>
          <Halo on={active} />
        </group>
      )}
    </group>
  );
}
