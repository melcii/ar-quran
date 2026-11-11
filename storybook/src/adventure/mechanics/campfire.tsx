// Surah Quraysh: the winter and summer journeys (106:1-4, "For the
// accustomed security of Quraysh: their accustomed security in the caravan
// of winter and summer. Let them worship the Lord of this House, who fed
// them against hunger and made them safe from fear"). At a caravan camp in
// the hills, first plan the year's two journeys on the map table: in
// winter the caravan goes south, where it is warm; in summer it goes north,
// where it is cooler. Then the caravan camps for the night. Keep the four
// fires around the camp burning until dawn, adding wood as each burns low:
// fire keeps the cold and the night animals away, and the camels calm. The
// camp is a game; the winter and summer journeys are read only. The House
// is never shown.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { CampfireTask } from '../types';
import type { Look } from '../Scenery';
import { live, type Mechanic, type MechSave } from './base';
import { dawnLook } from './dawn';

type Live = { fuel: number[]; t: number; out: boolean };
const doneOf = (task: CampfireTask, s: MechSave) => (s.done.includes(task.id) ? [0, 1, 2] : s.prog[task.id] ?? []);
const lives: Record<string, Live> = {};
const L = (game: { mech: Record<string, unknown> }, task: CampfireTask) => (lives[task.id] = live<Live>(game as never, task.id, () => ({ fuel: task.fires.map((_, k) => 1 - k * 0.2), t: 0, out: false })));
const ROADS = ['South, to the warm lands of Yemen', 'North, to the cool lands of Sham'];

export const Campfire: Mechanic<CampfireTask> = {
  total: () => 3,
  uses(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(2)) return [];
    if (!(d.includes(0) && d.includes(1))) return [{ key: `map:${task.id}`, pos: env.v3(task.at), label: 'Plan the journeys', reach: 2.6, run: () => env.api.panel(task) }];
    const S = L(env.game, task);
    return task.fires.map((f, k) => ({ key: `fire:${task.id}:${k}`, pos: env.v3(f), label: S.fuel[k] <= 0 ? 'Relight the fire' : 'Add wood to the fire', reach: 2.2, run: () => {
      if (S.fuel[k] > 0.6) {
        env.api.note(`${task.id}/waste`, k);
        env.api.hint('This fire is still burning well. Save the wood for one that is burning low.');
        return;
      }
      S.fuel[k] = 1;
    } }));
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.includes(2) || !(d.includes(0) && d.includes(1))) return d.includes(2) ? undefined : 'Plan the winter and summer journeys at the map table';
    const S = L(env.game, task);
    let out = -1;
    S.fuel.forEach((f, k) => {
      S.fuel[k] = Math.max(0, f - env.dt / task.burn);
      if (S.fuel[k] <= 0) out = k;
    });
    if (out >= 0) {
      if (!S.out) {
        env.api.note(`${task.id}/out`, out);
        env.api.hint('A fire has gone out! In the dark the camels stamp and shy. Relight it.');
      }
      S.out = true;
      return `A fire is out: relight it · the night ${Math.round((100 * S.t) / task.secs)}% through`;
    }
    S.out = false;
    S.t += env.dt;
    if (S.t >= task.secs) {
      env.api.progress(task.id, 2);
      env.api.hint('The first grey light of dawn. The fires kept the whole camp safe through the night.');
      return;
    }
    const low = S.fuel.map((f, k) => (f < 0.35 ? k + 1 : 0)).filter(Boolean);
    return `Keep the fires burning till dawn: the night ${Math.round((100 * S.t) / task.secs)}% through${low.length ? ` · burning low: fire ${low.join(', ')}` : ''}`;
  },
  look(task, data) {
    const d = doneOf(task, data);
    if (data.done.includes(task.id) || !(d.includes(0) && d.includes(1))) return undefined;
    return { ...dawnLook(0.05), stars: 1 } as Look;
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = [0, 1, 2].find((k) => !d.includes(k));
    if (i != null) api.progress(task.id, i);
  },
  View: CampfireView,
  Panel: CampfirePanel,
};

function CampfirePanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<CampfireTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [msg, setMsg] = useState('');
  const s = [0, 1].find((k) => !d.includes(k));
  if (s == null) return null;
  const season = s === 0 ? 'winter' : 'summer';
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a caravan game; the two seasonal journeys are read in the surah" />
      <Text style={st.cardTitle}>{`The ${season} caravan`}</Text>
      <Text style={st.cardText}>{msg || (s === 0 ? 'Winter: snow is on the northern passes and the nights are bitter. Which road will the winter caravan take?' : 'Summer: the south is burning hot and the wells there run low. Which road will the summer caravan take?')}</Text>
      <View style={{ gap: 6 }}>
        {ROADS.map((r, k) => (
          <Pressable key={r} style={st.btnGhost} accessibilityLabel={r} onPress={() => {
            if (k !== s) {
              api.note(`${task.id}/x`, s * 10 + k);
              setMsg(s === 0 ? 'North in winter? The passes are under snow and the camels would freeze. Go where it is warm.' : 'South in summer? The heat would wear out the camels and the wells run dry. Go where it is cooler.');
              return;
            }
            api.progress(task.id, s);
            setMsg(s === 0 ? 'South for the winter, where it is warm. Now the summer caravan.' : '');
            if (s === 1) {
              api.hint('South in winter, north in summer. Now the caravan camps for the night: keep the four fires burning till dawn.');
              onClose();
            }
          }}>
            <Text style={st.btnGhostText}>{r}</Text>
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

function CampfireView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<CampfireTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const planned = d.includes(0) && d.includes(1);
  const night = planned && !d.includes(2);
  const S = L(game, task);
  const flames = useRef<(THREE.Mesh | null)[]>([]);
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  useFrame(({ clock }) => {
    task.fires.forEach((_, k) => {
      const f = night ? S.fuel[k] : 0.5;
      const m = flames.current[k];
      if (m) {
        const s = 0.15 + f * (0.85 + Math.sin(clock.elapsedTime * 9 + k) * 0.08);
        m.scale.set(s, s, s);
        m.visible = f > 0;
      }
      const l = lights.current[k];
      if (l) l.intensity = f * 2.2;
    });
  });
  const [x, z] = task.at;
  return (
    <group>
      <group position={[x, t.floorY(x, z), z]} {...(!planned ? tap(() => act(`map:${task.id}`)) : {})}>
        {/* The map table with its two roads marked. */}
        <mesh material={M('#7a5a3a')} position-y={0.7}>
          <boxGeometry args={[1.4, 0.08, 0.9]} />
        </mesh>
        <mesh material={M('#e8d8b0')} position-y={0.75} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.2, 0.75]} />
        </mesh>
        <mesh material={M('#6a4a2a')} position-y={0.35}>
          <boxGeometry args={[0.12, 0.7, 0.12]} />
        </mesh>
        {!planned && <Halo on={active} />}
      </group>
      {task.fires.map((f, k) => (
        <group key={k} position={[f[0], t.floorY(f[0], f[1]), f[1]]} {...(night ? tap(() => act(`fire:${task.id}:${k}`)) : {})}>
          {[0, 1, 2, 3, 4].map((q) => (
            <mesh key={q} material={M('#8a8478', { map: 'stone' })} position={[Math.cos((q / 5) * Math.PI * 2) * 0.45, 0.08, Math.sin((q / 5) * Math.PI * 2) * 0.45]}>
              <sphereGeometry args={[0.13, 6, 5]} />
            </mesh>
          ))}
          <mesh ref={(m) => { flames.current[k] = m; }} material={M('#ffa040', { emissive: '#ff7020', ei: 1.6 })} position-y={0.35}>
            <coneGeometry args={[0.3, 0.8, 8]} />
          </mesh>
          <pointLight ref={(l) => { lights.current[k] = l; }} position-y={0.8} color="#ffa860" distance={7} intensity={1} />
          {night && <Halo on={active} />}
        </group>
      ))}
    </group>
  );
}
