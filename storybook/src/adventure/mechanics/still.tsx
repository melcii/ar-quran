// Surah At-Tariq: the sky that returns (86:11-12, "By the sky which
// returns, and the earth which splits open"). The sun lifts water from the
// sea as vapour, and the sky returns it as fresh rain. On a hot, rocky shore
// with only salt water to drink, build a small sun still that does the same:
// a basin of sea water, a clear cover over it, and a cup to catch the drops.
// Choose where it stands, how the cover slopes and whether its edges are
// sealed; then wait and see what happens. The sun warms the water, vapour
// rises, beads on the cover and runs down into the cup, fresh. Each try that
// does not work shows you why. The shore is a game; sun stills are real.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { StillTask } from '../types';
import type { Mechanic, MechSave } from './base';

const doneOf = (task: StillTask, s: MechSave) => (s.done.includes(task.id) ? [0, 1] : s.prog[task.id] ?? []);
type Setup = { place: number; slope: number; seal: number };
const PLACE = ['in the shade of the rocks', 'in full sun'];
const SLOPE = ['flat', 'gently sloping to the cup', 'sloping away from the cup'];
const SEAL = ['left open at the edges', 'sealed with wet sand'];
/** What happens with a setup: the first thing that goes wrong, or fresh water. */
export function outcome(s: Setup): { ok: boolean; why: string } {
  if (s.place === 0) return { ok: false, why: 'In the shade the water stays cool. A few faint drops form, but almost nothing rises. The sun is what lifts the water.' };
  if (s.seal === 0) return { ok: false, why: 'The water warms and steams, but the vapour slips out at the open edges and blows away. Seal the edges so it stays under the cover.' };
  if (s.slope === 0) return { ok: false, why: 'Drops bead on the flat cover, grow heavy and fall straight back into the salty basin. Slope the cover so they run somewhere.' };
  if (s.slope === 2) return { ok: false, why: 'Drops bead on the cover and run down, but away from the cup, and drip onto the sand. Slope it toward the cup.' };
  return { ok: true, why: 'The sun warms the sea water. Vapour rises, beads on the cover, runs down the slope and drips into the cup.' };
}

export const Still: Mechanic<StillTask> = {
  total: () => 2,
  uses(task, env) {
    if (doneOf(task, env.save).length >= 2) return [];
    return [{ key: `still:${task.id}`, pos: env.v3(task.at), label: 'Build the sun still', reach: 2.6, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= 2) return;
    return d.includes(0) ? 'There is water in the cup: taste it' : 'Build a sun still to get fresh water from the sea';
  },
  solve(task, api) {
    const d = doneOf(task, api.save());
    api.progress(task.id, d.includes(0) ? 1 : 0);
  },
  View: StillView,
  Panel: StillPanel,
};

function Choice({ label, opts, v, set }: { label: string; opts: string[]; v: number; set: (k: number) => void }) {
  return (
    <View style={{ marginVertical: 4 }}>
      <Text style={st.cardText}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {opts.map((o, k) => (
          <Pressable key={k} style={v === k ? st.btn : st.btnGhost} accessibilityLabel={o} onPress={() => set(k)}>
            <Text style={v === k ? st.btnText : st.btnGhostText}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function StillPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<StillTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [s, setS] = useState<Setup>({ place: 0, slope: 0, seal: 0 });
  const [msg, setMsg] = useState('');
  if (d.length >= 2) return null;
  if (d.includes(0))
    return (
      <View style={[st.card, { width } as never, st.cardMid]}>
        <ContentLabel kind="activity" extra="a science game; sun stills are real" />
        <Text style={st.cardTitle}>Water in the cup</Text>
        <Text style={st.cardText}>The cup is filling drop by drop. The basin is still full of salty sea water. What will the water in the cup taste like?</Text>
        <View style={st.row}>
          {['Salty, like the sea', 'Fresh, like rain'].map((o, k) => (
            <Pressable
              key={k}
              style={st.btn}
              accessibilityLabel={o}
              onPress={() => {
                if (k === 0) {
                  api.note(`${task.id}/salty`, 0);
                  setMsg('Taste it: it is fresh! The salt stays behind in the basin. Only the water rose as vapour.');
                }
                api.progress(task.id, 1);
                api.hint('Fresh water from salt water: the salt stays behind, and only the water rises and returns, like rain from the sky.');
                onClose();
              }}
            >
              <Text style={st.btnText}>{o}</Text>
            </Pressable>
          ))}
        </View>
        {!!msg && <Text style={st.cardText}>{msg}</Text>}
      </View>
    );
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a science game; sun stills are real" />
      <Text style={st.cardTitle}>Build the sun still</Text>
      <Text style={st.cardText}>{msg || 'A basin of sea water, a clear cover and a cup to catch the drops. How will you set it up?'}</Text>
      <Choice label="Where will it stand?" opts={PLACE} v={s.place} set={(k) => setS({ ...s, place: k })} />
      <Choice label="How does the cover slope?" opts={SLOPE} v={s.slope} set={(k) => setS({ ...s, slope: k })} />
      <Choice label="The cover's edges:" opts={SEAL} v={s.seal} set={(k) => setS({ ...s, seal: k })} />
      <View style={st.row}>
        <Pressable
          style={st.btn}
          accessibilityLabel="Wait and watch"
          onPress={() => {
            const o = outcome(s);
            if (!o.ok) {
              api.note(`${task.id}/x`, s.place * 100 + s.slope * 10 + s.seal);
              setMsg(`${o.why} Change the setup and try again.`);
              return;
            }
            api.progress(task.id, 0);
            setMsg(o.why);
          }}
        >
          <Text style={st.btnText}>Wait and watch</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StillView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<StillTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [x, z] = task.at;
  const working = d.includes(0);
  return (
    <group position={[x, t.floorY(x, z), z]} {...(d.length < 2 ? tap(() => act(`still:${task.id}`)) : {})}>
      {/* The basin of sea water. */}
      <mesh material={M('#8a8070', { map: 'stone' })} position-y={0.15}>
        <cylinderGeometry args={[0.7, 0.6, 0.3, 16, 1, true]} />
      </mesh>
      <mesh material={M('#3a6a8a', { metal: 0.3, rough: 0.2 })} position-y={0.2} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.66, 16]} />
      </mesh>
      {working && (
        <>
          {/* The clear cover, sloping to the cup, and the cup with fresh water. */}
          <mesh position={[0, 0.5, 0]} rotation-z={0.25}>
            <boxGeometry args={[1.6, 0.03, 1.4]} />
            <meshStandardMaterial color="#d8f0ff" transparent opacity={0.35} />
          </mesh>
          <mesh material={M('#c8a070')} position={[-0.95, 0.15, 0]}>
            <cylinderGeometry args={[0.14, 0.1, 0.3, 10]} />
          </mesh>
          <mesh material={M('#8ac8f0')} position={[-0.95, 0.24 + (d.length >= 2 ? 0.04 : 0), 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.12, 10]} />
          </mesh>
        </>
      )}
      {d.length < 2 && <Halo on={active} />}
    </group>
  );
}
