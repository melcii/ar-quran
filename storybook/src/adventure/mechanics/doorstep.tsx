// Surah Al-Insan: giving and wanting nothing back (76:8-9, "And they give
// food, in spite of love for it, to the needy, the orphan and the captive,
// saying, 'We feed you only for the face of Allah. We wish from you neither
// reward nor thanks'"). In a hill town at evening, a pantry table holds the
// day's food, your own favourite honey cakes among it. Three doors are
// waiting: a poor family's, an orphan's house and the hatch of the prison
// yard. Pack each parcel with what that house asked for, give from what you
// love rather than what you would throw away, leave it on the step, knock,
// and slip away before the door opens, so no one thanks you. The town is a
// game idea; no one behind the doors is shown.
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { DoorstepTask } from '../types';
import { live, type Mechanic, type MechSave } from './base';

type Live = { carry: number; knock: number; at: number; told: boolean };
const fresh = (): Live => ({ carry: -1, knock: -1, at: 0, told: false });
const doneOf = (task: DoorstepTask, s: MechSave) => (s.done.includes(task.id) ? task.doors.map((_, i) => i) : s.prog[task.id] ?? []);
const nextOf = (task: DoorstepTask, d: number[]) => task.doors.findIndex((_, i) => !d.includes(i));
/** The live state, readable by the panel (which has no game handle). */
const lives: Record<string, Live> = {};
const L = (game: { mech: Record<string, unknown> }, id: string) => (lives[id] = live<Live>(game as never, id, fresh));

export const Doorstep: Mechanic<DoorstepTask> = {
  total: (task) => task.doors.length,
  uses(task, env) {
    const d = doneOf(task, env.save);
    const i = nextOf(task, d);
    if (i < 0) return [];
    const S = L(env.game, task.id);
    if (S.knock >= 0) return [];
    if (S.carry < 0) return [{ key: `pantry:${task.id}`, pos: env.v3(task.pantry), label: `Pack a parcel for ${task.doors[i].who}`, reach: 2.6, run: () => env.api.panel(task) }];
    const door = task.doors[S.carry];
    return [{ key: `knock:${task.id}`, pos: env.v3(door.at), label: 'Leave the parcel and knock', reach: 2.4, run: () => {
      S.knock = S.carry;
      S.at = env.game.clock;
      S.told = false;
      env.api.hint('Knock, knock. Now slip away quietly before the door opens.');
    } }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    const i = nextOf(task, d);
    if (i < 0) return;
    const S = L(env.game, task.id);
    if (S.knock >= 0) {
      const door = task.doors[S.knock];
      const far = Math.hypot(env.pp.x - door.at[0], env.pp.z - door.at[1]) > task.away;
      const left = task.secs - (env.game.clock - S.at);
      if (left > 0) return `Slip away before the door opens: ${Math.ceil(left)} s · ${far ? 'far enough' : 'still too close'}`;
      if (!far) {
        if (!S.told) {
          S.told = true;
          env.api.note(`${task.id}/linger`, S.knock);
          env.api.hint('Footsteps behind the door! If you wait here, they will come out to thank you. Step away: you want nothing back.');
        }
        return 'Footsteps behind the door: step away';
      }
      env.api.progress(task.id, S.knock);
      env.api.hint(`The door opens a little. The parcel is taken in, and there is no one there to thank.`);
      S.knock = -1;
      S.carry = -1;
      return;
    }
    if (S.carry >= 0) return `Carry the parcel to ${task.doors[S.carry].who} · parcels given: ${d.length} of ${task.doors.length}`;
    return `Parcels given: ${d.length} of ${task.doors.length}`;
  },
  solve(task, api) {
    const i = nextOf(task, doneOf(task, api.save()));
    if (i >= 0) api.progress(task.id, i);
  },
  View: DoorstepView,
  Panel: DoorstepPanel,
};

function DoorstepPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<DoorstepTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const i = nextOf(task, d);
  const [msg, setMsg] = useState('');
  if (i < 0) return null;
  const door = task.doors[i];
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a giving game written for this app" />
      <Text style={st.cardTitle}>{`A parcel for ${door.who}`}</Text>
      <Text style={st.cardText}>{msg || `The note on the pantry wall says ${door.who} asked for ${door.wants}. What will you pack?`}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {task.foods.map((f, k) => (
          <Pressable
            key={k}
            style={st.btnGhost}
            accessibilityLabel={`Pack: ${f}`}
            onPress={() => {
              if (!f.includes(door.wants) && !door.wants.includes(f)) {
                api.note(`${task.id}/x`, i * 10 + k);
                setMsg(/stale|old|bruised/.test(f) ? `Would you want the ${f} yourself? Give from what you love, not what you would throw away.` : `${door.who} asked for ${door.wants}, not ${f}.`);
                return;
              }
              const S = lives[task.id];
              if (S) S.carry = i;
              onClose();
            }}
          >
            <Text style={st.btnGhostText}>{f}</Text>
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

function DoorstepView({ task, t, data, game, active, act }: Parameters<NonNullable<Mechanic<DoorstepTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const left = nextOf(task, d) >= 0;
  const S = L(game, task.id);
  // The parcel being carried or left is live state: redraw when it changes.
  const [, bump] = useState(0);
  const was = useRef('');
  useFrame(() => {
    const k = `${S.carry}/${S.knock}`;
    if (k !== was.current) {
      was.current = k;
      bump((n) => n + 1);
    }
  });
  const [px, pz] = task.pantry;
  return (
    <group>
      <group position={[px, t.floorY(px, pz), pz]} {...(left ? tap(() => act(`pantry:${task.id}`)) : {})}>
        <mesh material={M('#8a6a44')} position-y={0.4} castShadow>
          <boxGeometry args={[1.8, 0.8, 0.8]} />
        </mesh>
        {['#d8a860', '#f2ead8', '#c8783a', '#8a5a3a'].map((c, k) => (
          <mesh key={k} material={M(c)} position={[-0.6 + k * 0.4, 0.92, 0]}>
            <sphereGeometry args={[0.14, 8, 6]} />
          </mesh>
        ))}
        {left && S.carry < 0 && <Halo on={active} />}
      </group>
      {task.doors.map((door, i) => {
        const [x, z] = door.at;
        const given = d.includes(i);
        return (
          <group key={i} position={[x, t.floorY(x, z), z]} {...(S.carry === i && S.knock < 0 ? tap(() => act(`knock:${task.id}`)) : {})}>
            {/* The doorstep, with the parcel left on it. */}
            <mesh material={M('#a89c88', { map: 'stone' })} position-y={0.08}>
              <boxGeometry args={[1.4, 0.16, 0.8]} />
            </mesh>
            {S.knock === i && (
              <mesh material={M('#c8a070')} position-y={0.32}>
                <boxGeometry args={[0.4, 0.3, 0.3]} />
              </mesh>
            )}
            {given && <pointLight position={[0, 1.2, 0]} color="#ffd890" intensity={1.4} distance={4} />}
            {S.carry === i && S.knock < 0 && <Halo on={active} />}
          </group>
        );
      })}
    </group>
  );
}
