// Surah Al-Mu'minun's own play: one day in a home, keeping what comes due
// (23:1-11). The home has four open rooms around a courtyard, dim and dull
// at first. A day clock runs, and things come due at their own times while
// you are busy with others: a neighbour's parcel is left in your care and
// must be kept safe and handed back unopened when they knock (23:8, trusts);
// you promised to water the window plant when the bell rings, not before
// and not long after (23:8, promises); the prayer corner must be cleared and
// ready by the chime (23:2, 23:9); and something from the jar is given to
// the giving box (23:4). Miss a time and it comes round again. Each room
// comes alive when its quality is kept. The neighbour and the family are not
// shown: the door, the knock and the bell stand for them.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, player } from '@/ark/shared';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { P2 } from '../terrain';
import type { HomeRoom, HomeTask } from '../types';
import { live, type Mechanic, type MechEnv, type MechSave } from './base';

type Hand = 'parcel' | 'toy' | 'water' | 'gift' | null;
type Live = {
  clock: number;
  hand: Hand;
  toy: number;
  toys: number[];
  /** Where the parcel is: by the door, carried, on the shelf, carried back. */
  trust: 'door' | 'hand' | 'shelf' | 'back';
  shelvedAt: number;
  knocked: boolean;
  chimeAt: number;
  bellAt: number;
  rang: boolean;
  droop: boolean;
  ver: number;
};
const fresh = (): Live => ({ clock: 0, hand: null, toy: -1, toys: [], trust: 'door', shelvedAt: -1, knocked: false, chimeAt: -1, bellAt: -1, rang: false, droop: false, ver: 0 });

const kept = (task: HomeTask, s: MechSave) => (s.done.includes(task.id) ? task.rooms.map((_, i) => i) : s.prog[task.id] ?? []);

const secs = (n: number) => `${Math.max(0, Math.ceil(n))} s`;

function keep(task: HomeTask, env: MechEnv, i: number) {
  const r = task.rooms[i];
  env.api.progress(task.id, i);
  env.api.say(r.done);
  env.api.open({ kind: 'reading', reading: r.reading });
}

export const Home: Mechanic<HomeTask> = {
  total: (task) => task.rooms.length,
  uses(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = kept(task, env.save);
    const out = [];
    const id = task.id;
    const touch = () => L.ver++;
    const full = L.hand != null;
    for (const [i, r] of task.rooms.entries()) {
      if (done.includes(i)) continue;
      if (r.act === 'trust') {
        if (L.trust === 'door' && !full)
          out.push({ key: `parcel:${id}`, pos: env.v3(r.door), label: "Take the neighbour's parcel to keep safe", reach: 2.6, run: () => {
            L.trust = 'hand';
            L.hand = 'parcel';
            touch();
            env.api.hint('A neighbour left this in your care. Keep it somewhere safe until they come back for it.');
          } });
        if (L.trust === 'hand')
          out.push({ key: `shelf:${id}`, pos: env.v3(r.shelf), label: 'Put the parcel on the high shelf', reach: 2.6, run: () => {
            L.trust = 'shelf';
            L.hand = null;
            L.shelvedAt = L.clock;
            touch();
            env.api.hint('Safe on the high shelf. Listen for the knock.');
          } });
        if (L.trust === 'shelf' && L.knocked && !full)
          out.push({ key: `shelf:${id}`, pos: env.v3(r.shelf), label: 'Take the parcel down', reach: 2.6, run: () => {
            L.trust = 'back';
            L.hand = 'parcel';
            touch();
          } });
        if (L.trust === 'back')
          out.push({ key: `return:${id}`, pos: env.v3(r.door), label: 'Give the parcel back, just as it was', reach: 2.6, run: () => {
            L.hand = null;
            touch();
            keep(task, env, i);
          } });
      }
      if (r.act === 'prayer') {
        if (!full)
          r.toys.forEach((p, j) => {
            if (L.toys.includes(j)) return;
            out.push({ key: `toy:${id}:${j}`, pos: env.v3(p), label: 'Pick up the toy', reach: 2.2, run: () => {
              L.hand = 'toy';
              L.toy = j;
              touch();
            } });
          });
        if (L.hand === 'toy')
          out.push({ key: `toybox:${id}`, pos: env.v3(r.box), label: 'Put the toy in the toy box', reach: 2.4, run: () => {
            L.toys.push(L.toy);
            L.hand = null;
            touch();
            env.api.hint(L.toys.length < r.toys.length ? `${r.toys.length - L.toys.length} more on the prayer rug.` : 'The prayer corner is clear and ready for the chime.');
          } });
      }
      if (r.act === 'promise') {
        if (!full)
          out.push({ key: `fill:${id}`, pos: env.v3(r.tap), label: 'Fill the watering can', reach: 2.4, run: () => {
            L.hand = 'water';
            touch();
          } });
        if (L.hand === 'water')
          out.push({ key: `water:${id}`, pos: env.v3(r.plant), label: 'Water the window plant', reach: 2.4, run: () => {
            if (!L.rang) {
              env.api.note(`${id}/x`, 0);
              env.api.hint('Not yet: the promise was to water it when the bell rings. Keep the can, or do something else until then.');
              return;
            }
            L.hand = null;
            L.droop = false;
            touch();
            keep(task, env, i);
          } });
      }
      if (r.act === 'give') {
        if (!full)
          out.push({ key: `jar:${id}`, pos: env.v3(r.jar), label: 'Take some from the jar to give', reach: 2.4, run: () => {
            L.hand = 'gift';
            touch();
          } });
        if (L.hand === 'gift')
          out.push({ key: `give:${id}`, pos: env.v3(r.box), label: 'Put it in the giving box', reach: 2.4, run: () => {
            L.hand = null;
            touch();
            keep(task, env, i);
          } });
      }
    }
    return out;
  },
  frame(task, env) {
    const L = live<Live>(env.game, task.id, fresh);
    const done = kept(task, env.save);
    L.clock += env.dt;
    const soon: string[] = [];
    for (const [i, r] of task.rooms.entries()) {
      if (done.includes(i)) continue;
      if (r.act === 'prayer') {
        if (L.chimeAt < 0) L.chimeAt = r.chime;
        if (L.clock >= L.chimeAt) {
          if (L.toys.length >= r.toys.length) keep(task, env, i);
          else {
            L.chimeAt = L.clock + r.again;
            env.api.note(`${task.id}/m`, 0);
            env.api.hint(`The chime for prayer, and the prayer corner is not ready: toys are still on the rug. Clear it before the next chime, in ${r.again} seconds.`);
          }
          L.ver++;
        } else soon.push(`prayer chime in ${secs(L.chimeAt - L.clock)}`);
      }
      if (r.act === 'promise') {
        if (L.bellAt < 0) L.bellAt = r.bell;
        if (!L.rang && L.clock >= L.bellAt) {
          L.rang = true;
          L.ver++;
          env.api.hint('The bell! Time to keep your promise: water the window plant.');
        }
        if (L.rang && L.clock > L.bellAt + r.window) {
          L.rang = false;
          L.droop = true;
          L.bellAt = L.clock + r.again;
          L.ver++;
          env.api.note(`${task.id}/m`, 1);
          env.api.hint(`The bell rang and the promise was missed: the plant is drooping. The bell will ring again in ${r.again} seconds.`);
        }
        soon.push(L.rang ? `the bell is ringing: water the plant within ${secs(L.bellAt + r.window - L.clock)}` : `watering bell in ${secs(L.bellAt - L.clock)}`);
      }
      if (r.act === 'trust' && L.trust === 'shelf' && !L.knocked) {
        if (L.clock >= L.shelvedAt + r.knock) {
          L.knocked = true;
          L.ver++;
          env.api.hint('A knock at the door: the neighbour has come back for the parcel.');
        } else soon.push('a knock, some time soon');
      }
      if (r.act === 'trust' && L.knocked) soon.push('the neighbour is waiting at the door');
    }
    const hand = { parcel: "Carrying the neighbour's parcel", toy: 'Carrying a toy', water: 'Carrying the watering can', gift: 'Carrying something to give' }[L.hand ?? 'parcel'];
    const head = `Kept: ${done.length} of ${task.rooms.length}`;
    return [L.hand ? hand : head, soon.length ? `Coming up: ${soon.join(' · ')}` : ''].filter(Boolean).join(' · ');
  },
  View: HomeView,
};

const ROOM = 6;

function Room({ r, y, on }: { r: HomeRoom; y: number; on: boolean }) {
  const [x, z] = r.at;
  return (
    <group position={[x, y, z]}>
      <mesh material={M(on ? '#e8c890' : '#8a8478', { map: 'planks' })} position-y={0.06} receiveShadow>
        <boxGeometry args={[ROOM, 0.12, ROOM]} />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} material={M(on ? '#f0e4cc' : '#9a948a', { map: 'stone' })} position={[(sx * ROOM) / 2, 1.3, (sz * ROOM) / 2]} castShadow>
            <boxGeometry args={[0.35, 2.6, 0.35]} />
          </mesh>
        )),
      )}
      {/* A low back wall, so each room reads as a room. */}
      <mesh material={M(on ? '#f0e4cc' : '#9a948a', { map: 'stone' })} position={[0, 0.5, -ROOM / 2]} castShadow>
        <boxGeometry args={[ROOM, 1, 0.25]} />
      </mesh>
      {on && (
        <>
          <pointLight position={[0, 2.4, 0]} intensity={10} distance={9} color="#ffd8a0" />
          {[-1, 1].map((s) => (
            <group key={s} position={[s * (ROOM / 2 - 0.6), 0.12, -ROOM / 2 + 0.6]}>
              <mesh material={M('#b0603a')} position-y={0.2}>
                <cylinderGeometry args={[0.22, 0.16, 0.4, 10]} />
              </mesh>
              <mesh material={M('#5a9a3a')} position-y={0.6}>
                <sphereGeometry args={[0.32, 10, 8]} />
              </mesh>
              <mesh material={M('#f4c0d0')} position={[0.15, 0.8, 0.1]}>
                <sphereGeometry args={[0.09, 8, 6]} />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
}

const at = (t: Parameters<NonNullable<Mechanic<HomeTask>['View']>>[0]['t'], p: P2, dy = 0): [number, number, number] => [p[0], t.floorY(p[0], p[1]) + dy, p[1]];

function HomeView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<HomeTask>['View']>>[0]) {
  const L = live<Live>(game, task.id, fresh);
  const done = kept(task, data);
  const [, setVer] = useState(0);
  const held = useRef<THREE.Group>(null);
  const plant = useRef<THREE.Group>(null);
  useFrame((st) => {
    setVer((v) => (v === L.ver ? v : L.ver));
    const h = held.current;
    if (h) {
      h.visible = L.hand != null;
      h.position.set(player.pos.x + Math.sin(player.yaw) * 0.45, player.pos.y + 0.6, player.pos.z + Math.cos(player.yaw) * 0.45);
      h.rotation.y = player.yaw;
    }
    if (plant.current) plant.current.rotation.z = L.droop ? 0.7 : motion.reduced ? 0 : Math.sin(st.clock.elapsedTime) * 0.04;
  });
  const id = task.id;
  return (
    <group>
      {task.rooms.map((r, i) => {
        const on = done.includes(i);
        return (
          <group key={i}>
            <Room r={r} y={t.floorY(r.at[0], r.at[1])} on={on} />
            {r.act === 'trust' && (
              <>
                <group position={at(t, r.door)} {...tap(() => act(L.trust === 'door' ? `parcel:${id}` : `return:${id}`))}>
                  {[-0.8, 0.8].map((s) => (
                    <mesh key={s} material={M('#e0d4bc', { map: 'stone' })} position={[s, 1.3, 0]} castShadow>
                      <boxGeometry args={[0.3, 2.6, 0.4]} />
                    </mesh>
                  ))}
                  <mesh material={M('#e0d4bc', { map: 'stone' })} position-y={2.7}>
                    <boxGeometry args={[1.9, 0.3, 0.4]} />
                  </mesh>
                  <mesh material={M('#6a4a2e', { map: 'planks' })} position={[0, 1.2, -0.1]}>
                    <boxGeometry args={[1.3, 2.4, 0.08]} />
                  </mesh>
                  {L.trust === 'door' && (
                    <mesh material={M('#c8a46a')} position={[0.4, 0.2, 0.5]} castShadow>
                      <boxGeometry args={[0.45, 0.35, 0.35]} />
                    </mesh>
                  )}
                  {!on && (L.trust === 'door' || L.trust === 'back') && <Halo on={active} />}
                </group>
                <group position={at(t, r.shelf)} {...tap(() => act(`shelf:${id}`))}>
                  <mesh material={M('#7a5232', { map: 'planks' })} position-y={1.1} castShadow>
                    <boxGeometry args={[1.4, 2.2, 0.4]} />
                  </mesh>
                  <mesh material={M('#8a6242', { map: 'planks' })} position={[0, 2.25, 0.1]}>
                    <boxGeometry args={[1.6, 0.08, 0.6]} />
                  </mesh>
                  {L.trust === 'shelf' && (
                    <mesh material={M('#c8a46a')} position={[0, 2.47, 0.1]}>
                      <boxGeometry args={[0.45, 0.35, 0.35]} />
                    </mesh>
                  )}
                  {!on && (L.trust === 'hand' || (L.trust === 'shelf' && L.knocked)) && <Halo on={active} />}
                </group>
              </>
            )}
            {r.act === 'prayer' && (
              <>
                <mesh material={M(on ? '#a83a2e' : '#7a4a3e', { rough: 1 })} position={at(t, r.at, 0.14)}>
                  <boxGeometry args={[1.2, 0.03, 2]} />
                </mesh>
                {r.toys.map((p, j) =>
                  L.toys.includes(j) || (L.hand === 'toy' && L.toy === j) ? null : (
                    <group key={j} position={at(t, p, 0.2)} {...tap(() => act(`toy:${id}:${j}`))}>
                      <mesh material={M(['#e0a030', '#4a8ad0', '#d05050', '#60b060'][j % 4])} castShadow>
                        {j % 2 ? <sphereGeometry args={[0.18, 10, 8]} /> : <boxGeometry args={[0.3, 0.3, 0.3]} />}
                      </mesh>
                      <Halo on={active} />
                    </group>
                  ),
                )}
                <group position={at(t, r.box)} {...tap(() => act(`toybox:${id}`))}>
                  <mesh material={M('#9a6a3a', { map: 'planks' })} position-y={0.3} castShadow>
                    <boxGeometry args={[0.9, 0.6, 0.6]} />
                  </mesh>
                  {L.hand === 'toy' && <Halo on={active} />}
                </group>
              </>
            )}
            {r.act === 'promise' && (
              <>
                <group position={at(t, r.plant)} {...tap(() => act(`water:${id}`))}>
                  <mesh material={M('#e0d4bc', { map: 'stone' })} position-y={0.45}>
                    <boxGeometry args={[1.4, 0.9, 0.5]} />
                  </mesh>
                  <mesh material={M('#b0603a')} position-y={1.1}>
                    <cylinderGeometry args={[0.25, 0.18, 0.4, 10]} />
                  </mesh>
                  <group ref={plant} position-y={1.3}>
                    <mesh material={M(on ? '#4f9a34' : '#7a8a4a')} position-y={0.35}>
                      <coneGeometry args={[0.35, 0.8, 8]} />
                    </mesh>
                    {on && (
                      <mesh material={M('#ffd0e0')} position-y={0.8}>
                        <sphereGeometry args={[0.13, 8, 6]} />
                      </mesh>
                    )}
                  </group>
                  {L.hand === 'water' && !on && <Halo on={active} />}
                </group>
                <group position={at(t, r.tap)} {...tap(() => act(`fill:${id}`))}>
                  <mesh material={M('#8a8a90', { metal: 0.5 })} position-y={0.6}>
                    <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
                  </mesh>
                  <mesh material={M('#a0a0a8', { metal: 0.6 })} position={[0, 1.15, 0.15]} rotation-x={Math.PI / 2}>
                    <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
                  </mesh>
                  {L.hand == null && !on && <Halo on={active} />}
                </group>
                {/* The bell by the window: it glows while it rings. */}
                <mesh material={M(L.rang ? '#ffd870' : '#a08040', { metal: 0.5, emissive: L.rang ? '#ffb000' : undefined, ei: 2 })} position={at(t, r.plant, 2.4)}>
                  <coneGeometry args={[0.18, 0.3, 10]} />
                </mesh>
              </>
            )}
            {r.act === 'give' && (
              <>
                <group position={at(t, r.jar)} {...tap(() => act(`jar:${id}`))}>
                  <mesh material={M('#c0805a')} position-y={0.4} castShadow>
                    <sphereGeometry args={[0.4, 12, 10]} />
                  </mesh>
                  {L.hand == null && !on && <Halo on={active} />}
                </group>
                <group position={at(t, r.box)} {...tap(() => act(`give:${id}`))}>
                  <mesh material={M('#6a8a5a', { map: 'planks' })} position-y={0.45} castShadow>
                    <boxGeometry args={[0.7, 0.9, 0.5]} />
                  </mesh>
                  <mesh material={M('#2a2a22')} position={[0, 0.91, 0]}>
                    <boxGeometry args={[0.4, 0.02, 0.06]} />
                  </mesh>
                  {L.hand === 'gift' && <Halo on={active} />}
                </group>
              </>
            )}
          </group>
        );
      })}
      <group ref={held} scale={0.7}>
        {L.hand === 'parcel' && (
          <mesh material={M('#c8a46a')}>
            <boxGeometry args={[0.45, 0.35, 0.35]} />
          </mesh>
        )}
        {L.hand === 'toy' && (
          <mesh material={M('#e0a030')}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
          </mesh>
        )}
        {L.hand === 'water' && (
          <mesh material={M('#6a8a9a', { metal: 0.4 })}>
            <cylinderGeometry args={[0.18, 0.2, 0.35, 10]} />
          </mesh>
        )}
        {L.hand === 'gift' && (
          <mesh material={M('#e8d080')}>
            <sphereGeometry args={[0.18, 8, 6]} />
          </mesh>
        )}
      </group>
    </group>
  );
}
