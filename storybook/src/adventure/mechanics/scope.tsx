// Surah Fussilat: signs on the horizons (41:53, "We will show them Our signs
// in the horizons and within themselves"). A telescope stands on the hilltop.
// Turn it, a little at a time, until one of the signs the surah names is in
// the lens: the sun and the moon (41:37), the firm mountains (41:10), the
// still, bare earth that stirs and grows when the rain comes (41:39). Note
// each one; the bare slope turns green once it is noted. Last of all, the
// telescope cannot show the signs "within themselves": that step is a quiet
// reading. Allah is never pictured; the sun and moon are only creations.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as THREE from 'three';
import { ContentLabel } from '@/components/ui';
import { motion } from '@/ark/shared';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { Terrain } from '../terrain';
import type { ScopeTask } from '../types';
import type { Mechanic, MechSave } from './base';

/** Where each telescope points (radians, same sense as the explorer's yaw), shared by the panel and the 3D view. */
const aim: Record<string, number> = {};
const STEP = Math.PI / 18; // 10 degrees
const FIELD = 0.22; // about 13 degrees either side

const doneOf = (task: ScopeTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: task.signs.length + 1 }, (_, i) => i) : s.prog[task.id] ?? []);
const bearing = (task: ScopeTask, i: number) => Math.atan2(task.signs[i].at[0] - task.at[0], task.signs[i].at[1] - task.at[1]);
const diff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const deg = (a: number) => Math.round(((a * 180) / Math.PI + 360) % 360);

export const Scope: Mechanic<ScopeTask> = {
  total: (task) => task.signs.length + 1,
  uses(task, env) {
    if (doneOf(task, env.save).length > task.signs.length) return [];
    return [{ key: `scope:${task.id}`, pos: env.v3(task.at), label: 'Look through the telescope', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const n = task.signs.filter((_, i) => d.includes(i)).length;
    if (n < task.signs.length) return `Signs on the horizon noted: ${n} of ${task.signs.length}`;
    if (!d.includes(task.signs.length)) return 'Every sign on the horizon is noted. Go back to the telescope for the last one.';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    const i = task.signs.findIndex((_, k) => !d.includes(k));
    if (i >= 0) {
      aim[task.id] = bearing(task, i);
      return api.progress(task.id, i);
    }
    api.progress(task.id, task.signs.length);
  },
  View: ScopeView,
  Panel: ScopePanel,
};

function ScopePanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<ScopeTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [a, setA] = useState(() => aim[task.id] ?? 0);
  const turn = (k: number) => {
    const v = a + k * STEP;
    aim[task.id] = v;
    setA(v);
  };
  const left = task.signs.map((_, i) => i).filter((i) => !d.includes(i));
  const inLens = task.signs.map((_, i) => i).find((i) => Math.abs(diff(bearing(task, i), a)) < FIELD);
  const near = left.find((i) => Math.abs(diff(bearing(task, i), a)) < 0.8);
  let what: string;
  if (inLens != null) what = d.includes(inLens) ? `In the lens: ${task.signs[inLens].name}. You have noted this one.` : `In the lens: ${task.signs[inLens].name}.`;
  else if (near != null) what = `Only open horizon here. Something is a little to the ${diff(bearing(task, near), a) > 0 ? 'left' : 'right'}.`;
  else what = 'Only open horizon here. Keep turning.';
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a telescope game written for this app" />
      {left.length ? (
        <>
          <Text style={st.cardText}>{`Turn the telescope until a sign is in the lens. Pointing at ${deg(-a)}°.`}</Text>
          <View style={{ alignSelf: 'center', width: 150, height: 150, borderRadius: 75, borderWidth: 6, borderColor: '#4a3a2a', backgroundColor: inLens != null ? '#d8e8f0' : '#b8c8d8', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
            <Text style={[st.cardText, { fontSize: 13, textAlign: 'center', color: '#2a2a2a' }]}>{inLens != null ? task.signs[inLens].name : '· · ·'}</Text>
          </View>
          <Text style={[st.cardText, { fontSize: 14 }]}>{what}</Text>
          <View style={st.row}>
            <Pressable style={st.btnGhost} onPress={() => turn(1)} accessibilityLabel="Turn left">
              <Text style={st.btnGhostText}>◀ Turn left</Text>
            </Pressable>
            {inLens != null && !d.includes(inLens) && (
              <Pressable
                style={st.btn}
                accessibilityLabel="Note this sign"
                onPress={() => {
                  api.progress(task.id, inLens);
                  api.open({ kind: 'reading', reading: task.signs[inLens].reading });
                }}
              >
                <Text style={st.btnText}>Note this sign</Text>
              </Pressable>
            )}
            <Pressable style={st.btnGhost} onPress={() => turn(-1)} accessibilityLabel="Turn right">
              <Text style={st.btnGhostText}>Turn right ▶</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={st.cardText}>Every sign on the horizon is noted. The surah says there are signs within ourselves too, and no telescope can show those. Lower the telescope and think about them.</Text>
          <Pressable
            style={st.btn}
            accessibilityLabel="Signs within ourselves"
            onPress={() => {
              api.progress(task.id, task.signs.length);
              onClose();
              api.open({ kind: 'reading', reading: task.within });
            }}
          >
            <Text style={st.btnText}>Signs within ourselves</Text>
          </Pressable>
        </>
      )}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Sign({ s, t, noted }: { s: ScopeTask['signs'][number]; t: Terrain; noted: boolean }) {
  const [x, z] = s.at;
  const y = t.floorY(x, z);
  const ground = useRef<THREE.Mesh>(null);
  const g = useRef(noted ? 1 : 0);
  const dry = useMemo(() => new THREE.Color('#a08a68'), []);
  const wet = useMemo(() => new THREE.Color('#6a9a48'), []);
  const sprouts = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (s.shape !== 'slope') return;
    g.current = noted ? (motion.reduced ? 1 : Math.min(1, g.current + dt * 0.25)) : 0;
    (ground.current?.material as THREE.MeshStandardMaterial | undefined)?.color.copy(dry).lerp(wet, g.current);
    if (sprouts.current) sprouts.current.scale.setScalar(Math.max(0.001, g.current));
  });
  if (s.shape === 'sun')
    return (
      <mesh position={[x, 30, z]}>
        <sphereGeometry args={[3, 16, 12]} />
        <meshBasicMaterial color="#fff0b0" toneMapped={false} />
      </mesh>
    );
  if (s.shape === 'moon')
    return (
      <mesh position={[x, 22, z]}>
        <sphereGeometry args={[1.8, 16, 12]} />
        <meshBasicMaterial color="#e8eef8" toneMapped={false} />
      </mesh>
    );
  if (s.shape === 'stars')
    return (
      <group position={[x, 26, z]}>
        {Array.from({ length: 9 }, (_, k) => (
          <mesh key={k} position={[Math.sin(k * 2.3) * 5, Math.cos(k * 1.7) * 3, Math.sin(k * 0.9) * 2]}>
            <sphereGeometry args={[0.35, 6, 5]} />
            <meshBasicMaterial color="#fff8e0" toneMapped={false} />
          </mesh>
        ))}
      </group>
    );
  if (s.shape === 'mountain')
    return (
      <group position={[x, y - 1, z]}>
        <mesh material={M('#8a7a6a', { map: 'stone' })} position-y={7} castShadow>
          <coneGeometry args={[9, 16, 7]} />
        </mesh>
        <mesh material={M('#7a6a5a', { map: 'stone' })} position={[6, 4, 2]}>
          <coneGeometry args={[5, 10, 6]} />
        </mesh>
      </group>
    );
  // The still, bare earth (41:39): it greens once noted.
  return (
    <group position={[x, y + 0.04, z]}>
      <mesh ref={ground} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[6, 24]} />
        <meshStandardMaterial color="#a08a68" roughness={1} />
      </mesh>
      <group ref={sprouts}>
        {Array.from({ length: 24 }, (_, k) => (
          <mesh key={k} material={M('#5a8a3a')} position={[Math.sin(k * 2.4) * (1 + (k % 5)), 0.2, Math.cos(k * 2.4) * (1 + (k % 5))]}>
            <coneGeometry args={[0.12, 0.45, 5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ScopeView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<ScopeTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [x, z] = task.at;
  const y = t.floorY(x, z);
  const barrel = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const b = barrel.current;
    if (!b) return;
    const want = aim[task.id] ?? 0;
    b.rotation.y += diff(want, b.rotation.y) * Math.min(1, dt * 6);
  });
  return (
    <group>
      {task.signs.map((s, i) => (
        <Sign key={i} s={s} t={t} noted={d.includes(i)} />
      ))}
      <group position={[x, y, z]} {...tap(() => act(`scope:${task.id}`))}>
        {[0, 1, 2].map((k) => (
          <mesh key={k} material={M('#6a4a2a')} position={[Math.sin((k * Math.PI * 2) / 3) * 0.25, 0.6, Math.cos((k * Math.PI * 2) / 3) * 0.25]} rotation={[Math.cos((k * Math.PI * 2) / 3) * 0.25, 0, -Math.sin((k * Math.PI * 2) / 3) * 0.25]}>
            <cylinderGeometry args={[0.03, 0.04, 1.3, 5]} />
          </mesh>
        ))}
        <group ref={barrel} position-y={1.25}>
          <mesh material={M('#b08a4a', { metal: 0.6, rough: 0.35 })} rotation-x={Math.PI / 2 - 0.15}>
            <cylinderGeometry args={[0.07, 0.11, 1.1, 10]} />
          </mesh>
        </group>
        {d.length <= task.signs.length && <Halo on={active} />}
      </group>
    </group>
  );
}
