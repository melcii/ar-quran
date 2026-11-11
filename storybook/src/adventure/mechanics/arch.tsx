// Surah An-Nasr: when the help comes (110:1-3, "When the help of Allah and
// the victory come, and you see the people entering the religion of Allah
// in crowds, then glorify with the praise of your Lord and ask His
// forgiveness. Indeed, He is ever Accepting of repentance"). The village is
// building a stone arch for its new gate. Build it the way masons do: set
// the shaped stones on the wooden frame from both sides in turn, so it
// never leans; the keystone goes in last, at the top; only then can the
// frame come away, and the arch holds itself up. Then, before the
// celebration, stop: glorify Allah with praise and ask His forgiveness.
// The village is a game; arches built this way are real. No battle or
// conquest is shown, and the Prophet, who is addressed, is never shown.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from '../cards';
import { M } from '../kit';
import { Halo, tap } from '../props';
import type { ArchTask } from '../types';
import type { Mechanic, MechSave } from './base';

const all = (task: ArchTask) => task.stones + 3;
const doneOf = (task: ArchTask, s: MechSave) => (s.done.includes(task.id) ? Array.from({ length: all(task) }, (_, i) => i) : s.prog[task.id] ?? []);
/** Stones set on the left and on the right (saved). */
const sides = (task: ArchTask, s: MechSave) => {
  if (s.done.includes(task.id)) return [task.stones / 2, task.stones / 2];
  const v = s.prog[`${task.id}/lr`];
  return v && v.length === 2 ? v : [0, 0];
};
type Phase = 'stones' | 'key' | 'frame' | 'praise';
const phaseOf = (task: ArchTask, d: number[]): Phase => {
  const n = d.filter((k) => k < task.stones).length;
  if (n < task.stones) return 'stones';
  if (!d.includes(task.stones)) return 'key';
  if (!d.includes(task.stones + 1)) return 'frame';
  return 'praise';
};

export const Arch: Mechanic<ArchTask> = {
  total: all,
  uses(task, env) {
    if (doneOf(task, env.save).length >= all(task)) return [];
    return [{ key: `arch:${task.id}`, pos: env.v3(task.at), label: phaseOf(task, doneOf(task, env.save)) === 'praise' ? 'Before the celebration' : 'Build the arch', reach: 3, run: () => env.api.panel(task) }];
  },
  frame(task, env) {
    const d = doneOf(task, env.save);
    if (d.length >= all(task)) return;
    const [l, r] = sides(task, env.save);
    const p = phaseOf(task, d);
    return p === 'stones' ? `Arch stones set: ${l} left, ${r} right, of ${task.stones}` : p === 'key' ? 'Set the keystone at the top' : p === 'frame' ? 'Take away the wooden frame' : 'The arch stands: the village gathers to celebrate';
  },
  solve(task, api) {
    const s = api.save();
    const d = doneOf(task, s);
    const i = Array.from({ length: all(task) }, (_, k) => k).find((k) => !d.includes(k));
    if (i == null) return;
    if (i < task.stones) api.set(`${task.id}/lr`, [Math.ceil((i + 1) / 2), Math.floor((i + 1) / 2)]);
    api.progress(task.id, i);
  },
  View: ArchView,
  Panel: ArchPanel,
};

function ArchPanel({ task, data, api, width, onClose }: Parameters<NonNullable<Mechanic<ArchTask>['Panel']>>[0]) {
  const d = doneOf(task, data);
  const [l, r] = sides(task, data);
  const [msg, setMsg] = useState('');
  if (d.length >= all(task)) return null;
  const p = phaseOf(task, d);
  const btn = (label: string, run: () => void) => (
    <Pressable key={label} style={st.btnGhost} accessibilityLabel={label} onPress={run}>
      <Text style={st.btnGhostText}>{label}</Text>
    </Pressable>
  );
  const half = task.stones / 2;
  const set = (side: 0 | 1) => {
    if (p !== 'stones') {
      api.note(`${task.id}/x`, 10 + side);
      setMsg(p === 'praise' ? 'The arch is finished.' : 'Every side stone is set already. The top needs the keystone.');
      return;
    }
    const mine = side ? r : l;
    const other = side ? l : r;
    if (mine >= half || mine > other) {
      api.note(`${task.id}/lean`, side);
      setMsg(`Another stone on the ${side ? 'right' : 'left'} and the frame would lean and tip. Set the next one on the ${side ? 'left' : 'right'}, so the two sides rise together.`);
      return;
    }
    const nl = side ? l : l + 1;
    const nr = side ? r + 1 : r;
    api.set(`${task.id}/lr`, [nl, nr]);
    api.progress(task.id, nl + nr - 1);
    setMsg(nl + nr < task.stones ? `The ${side ? 'right' : 'left'} side rises a stone higher.` : 'Both sides have reached the top. There is a gap between them, just the shape of the keystone.');
  };
  let body;
  if (p === 'praise')
    body = (
      <View style={{ gap: 6 }}>
        {btn('Glorify Allah with praise, and ask His forgiveness', () => {
          api.progress(task.id, task.stones + 2);
          api.hint('Subhanallah, alhamdulillah, astaghfirullah. Now the celebration can begin.');
          onClose();
        })}
        {btn('Tell everyone how clever we were', () => {
          api.note(`${task.id}/boast`, 0);
          setMsg('The surah says: when help and victory come, glorify your Lord with praise and ask His forgiveness. It was by His help.');
        })}
        {btn('Start the feast straight away', () => {
          api.note(`${task.id}/feast`, 0);
          setMsg('There will be time for the feast. First, the surah says: glorify your Lord with praise, and ask His forgiveness.');
        })}
      </View>
    );
  else
    body = (
      <View style={[st.row, { flexWrap: 'wrap', justifyContent: 'center' }]}>
        {btn('Set a stone on the left', () => set(0))}
        {btn('Set a stone on the right', () => set(1))}
        {btn('Set the keystone', () => {
          if (p !== 'key') {
            api.note(`${task.id}/early`, p === 'stones' ? 0 : 1);
            setMsg(p === 'stones' ? 'The keystone goes in last, at the very top, once both sides have met.' : 'The keystone is already in.');
            return;
          }
          api.progress(task.id, task.stones);
          setMsg('The keystone slides into the gap and locks both sides together.');
        })}
        {btn('Take away the wooden frame', () => {
          if (p !== 'frame') {
            api.note(`${task.id}/frame`, 0);
            setMsg('Not yet! Without the keystone the stones would fall in. The frame stays until the arch is locked.');
            return;
          }
          api.progress(task.id, task.stones + 1);
          setMsg('The frame comes away, and the arch stands on its own. The whole village gathers below it to celebrate.');
        })}
      </View>
    );
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ContentLabel kind="activity" extra="a building game; arches built this way are real" />
      <Text style={st.cardTitle}>{p === 'praise' ? 'Before the celebration' : 'The village arch'}</Text>
      <Text style={st.cardText}>{msg || (p === 'praise' ? 'The arch stands, and everyone is cheering. What comes first?' : 'Set the shaped stones on the wooden frame from both sides in turn. The keystone goes in last; only then can the frame come away.')}</Text>
      {body}
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ArchView({ task, t, data, active, act }: Parameters<NonNullable<Mechanic<ArchTask>['View']>>[0]) {
  const d = doneOf(task, data);
  const [l, r] = sides(task, data);
  const key = d.includes(task.stones);
  const frame = !d.includes(task.stones + 1);
  const finished = d.length >= all(task);
  const [x, z] = task.at;
  const half = task.stones / 2;
  const R = 2;
  const stone = (a: number, k: string, c = '#c8b898') => (
    <mesh key={k} material={M(c, { map: 'stone' })} position={[Math.cos(a) * R, 2.2 + Math.sin(a) * R, 0]} rotation-z={a}>
      <boxGeometry args={[0.55, 0.62, 0.6]} />
    </mesh>
  );
  return (
    <group position={[x, t.floorY(x, z), z]} {...(!finished ? tap(() => act(`arch:${task.id}`)) : {})}>
      {/* Two piers, the voussoirs rising from each side, the keystone, and the wooden frame beneath. */}
      {[-R, R].map((px) => (
        <mesh key={px} material={M('#b8a888', { map: 'stone' })} position={[px, 1.1, 0]} castShadow>
          <boxGeometry args={[0.7, 2.2, 0.7]} />
        </mesh>
      ))}
      {Array.from({ length: l }, (_, k) => stone(Math.PI - ((k + 0.5) / (half + 0.5)) * (Math.PI / 2), `l${k}`))}
      {Array.from({ length: r }, (_, k) => stone(((k + 0.5) / (half + 0.5)) * (Math.PI / 2), `r${k}`))}
      {key && stone(Math.PI / 2, 'key', '#e0d0a8')}
      {frame && (
        <mesh material={M('#8a6a44', { map: 'planks' })} position-y={2.2} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[R - 0.35, R - 0.35, 0.4, 16, 1, false, -Math.PI / 2, Math.PI]} />
        </mesh>
      )}
      {!finished && <Halo on={active} />}
    </group>
  );
}
