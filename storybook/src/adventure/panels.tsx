// Panels for the decision games: answering situations honestly, sharing the
// stores by need, weighing fairly at a balance, and making promises. Every
// one is labelled as an activity written for this app; Quran text appears
// only through the verified readings that open afterwards.
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ContentLabel } from '@/components/ui';
import { st } from './cards';
import type { ChoiceTask, PromiseTask, ShareTask, WeighTask } from './types';

type Base = { width: string | number; portrait: boolean; onClose: () => void };

/* ------------------------------- choices ------------------------------- */

export function ChoiceCard({ task, from, width, portrait, onClose, onScene, onWrong }: Base & { task: ChoiceTask; from: number; onScene: (i: number) => void; onWrong: () => void }) {
  const [i, setI] = useState(from);
  const [picked, setPicked] = useState<number | null>(null);
  const scene = task.scenes[Math.min(i, task.scenes.length - 1)];
  const opt = picked != null ? scene.options[picked] : null;
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ScrollView style={{ maxHeight: portrait ? 470 : 420 }} contentContainerStyle={{ gap: 10 }}>
        <ContentLabel kind="activity" extra={`a situation written for this game · ${i + 1} of ${task.scenes.length}`} />
        <Text style={st.cardText}>{scene.text}</Text>
        {scene.options.map((o, k) => (
          <Pressable
            key={k}
            disabled={picked != null}
            onPress={() => setPicked(k)}
            style={[st.tile, picked === k && (o.ok ? st.tileDone : st.tileWrong)]}
            accessibilityRole="button"
          >
            <Text style={st.tileText}>{o.text}</Text>
          </Pressable>
        ))}
        {opt && (
          <>
            <ContentLabel kind="explanation" />
            <Text style={st.cardText}>{opt.reply}</Text>
          </>
        )}
      </ScrollView>
      <View style={st.row}>
        {!opt && (
          <Pressable style={st.btnGhost} onPress={onClose}>
            <Text style={st.btnGhostText}>Not now</Text>
          </Pressable>
        )}
        {opt && !opt.ok && (
          <Pressable style={st.btn} onPress={onWrong} accessibilityRole="button">
            <Text style={st.btnText}>Walk back and think again</Text>
          </Pressable>
        )}
        {opt && opt.ok && (
          <Pressable
            style={st.btn}
            accessibilityRole="button"
            onPress={() => {
              onScene(i);
              if (i + 1 >= task.scenes.length) return;
              setI(i + 1);
              setPicked(null);
            }}
          >
            <Text style={st.btnText}>{i + 1 >= task.scenes.length ? 'Go on' : 'Next'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ------------------------------- sharing by need ------------------------------- */

export function ShareCard({ task, width, portrait, onClose, onSolved }: Base & { task: ShareTask; onSolved: () => void }) {
  const [give, setGive] = useState<number[][]>(() => task.homes.map(() => task.goods.map(() => 0)));
  const [checked, setChecked] = useState(false);
  const left = task.goods.map((g, gi) => g.n - give.reduce((s, h) => s + h[gi], 0));
  const verdict = task.homes.map((h, hi) =>
    task.goods.map((g, gi) => {
      const want = h.needs[g.id] ?? 0;
      return give[hi][gi] - want;
    }),
  );
  const allRight = verdict.every((v) => v.every((d) => d === 0));
  const bump = (hi: number, gi: number, d: number) => {
    setChecked(false);
    setGive((cur) => cur.map((row, r) => (r !== hi ? row : row.map((v, c) => (c !== gi ? v : Math.max(0, v + (d > 0 && left[gi] <= 0 ? 0 : d)))))));
  };
  const even = () => {
    setChecked(false);
    setGive(task.homes.map((_, hi) => task.goods.map((g) => Math.floor(g.n / task.homes.length) + (hi < g.n % task.homes.length ? 1 : 0))));
  };
  return (
    <View style={[st.card, { width } as never, st.cardTall]}>
      <ScrollView style={{ maxHeight: portrait ? 540 : 480 }} contentContainerStyle={{ gap: 8 }}>
        <ContentLabel kind="activity" extra="a sharing game written for this app" />
        <Text style={st.cardText}>{task.prompt}</Text>
        <Text style={st.small}>
          In the store: {task.goods.map((g, gi) => `${left[gi]} ${g.label}`).join(' · ')}
        </Text>
        {task.homes.map((h, hi) => (
          <View key={h.label} style={[st.tile, checked && (verdict[hi].every((d) => d === 0) ? st.tileDone : st.tileWrong)]}>
            <Text style={[st.tileText, { fontWeight: '700' }]}>{h.label}</Text>
            <Text style={st.small}>{h.sign}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {task.goods.map((g, gi) => (
                <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Pressable style={pm} onPress={() => bump(hi, gi, -1)} accessibilityLabel={`Less ${g.label} for ${h.label}`}>
                    <Text style={st.btnGhostText}>−</Text>
                  </Pressable>
                  <Text style={st.tileText}>
                    {give[hi][gi]} {g.label}
                  </Text>
                  <Pressable style={pm} onPress={() => bump(hi, gi, 1)} accessibilityLabel={`More ${g.label} for ${h.label}`}>
                    <Text style={st.btnGhostText}>+</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            {checked && !verdict[hi].every((d) => d === 0) && (
              <Text style={st.small}>
                {verdict[hi]
                  .map((d, gi) => (d < 0 ? `needs ${-d} more ${unit(task.goods[gi].label, -d)}` : d > 0 ? `has ${d} more ${unit(task.goods[gi].label, d)} than it needs` : ''))
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            )}
          </View>
        ))}
        {checked && allRight && <Text style={st.cardText}>Every household has what it needs, and nothing is wasted. Fair did not mean the same for everyone.</Text>}
      </ScrollView>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={even}>
          <Text style={st.btnGhostText}>Split it all evenly</Text>
        </Pressable>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
        {checked && allRight ? (
          <Pressable style={st.btn} onPress={onSolved} accessibilityRole="button">
            <Text style={st.btnText}>Carry it to the homes</Text>
          </Pressable>
        ) : (
          <Pressable style={st.btn} onPress={() => setChecked(true)} accessibilityRole="button">
            <Text style={st.btnText}>Check</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const pm = { borderWidth: 1, borderColor: '#cbb894', borderRadius: 999, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' } as const;

/* ------------------------------- the balance ------------------------------- */

export function WeighCard({ task, width, portrait, onClose, onSolved }: Base & { task: WeighTask; onSolved: () => void }) {
  const [o, setO] = useState(0);
  const [on, setOn] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const order = task.orders[Math.min(o, task.orders.length - 1)];
  const mass = on.reduce((s, i) => s + task.weights[i].mass, 0);
  const marked = on.reduce((s, i) => s + task.weights[i].marked, 0);
  const tilt = Math.max(-1, Math.min(1, (mass - order.want) / 3));
  const level = Math.abs(mass - order.want) < 0.001;
  const shaved = on.some((i) => task.weights[i].mass !== task.weights[i].marked);
  const toggle = (i: number) => {
    setNote('');
    setOn((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  };
  const hand = () => {
    if (!level) {
      setNote(mass < order.want ? `The goods side is still lower: the weights come to less than ${order.want}. Your customer would get too little.` : 'The weights side is heavier now: you would be giving more than was asked. Generous, but this time weigh exactly.');
      return;
    }
    if (o + 1 >= task.orders.length) {
      onSolved();
      return;
    }
    setO(o + 1);
    setOn([]);
    setNote('Weighed fairly. Next order.');
  };
  const beam = useMemo(() => ({ transform: [{ rotate: `${tilt * 12}deg` }] }), [tilt]);
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ScrollView style={{ maxHeight: portrait ? 480 : 420 }} contentContainerStyle={{ gap: 10 }}>
        <ContentLabel kind="activity" extra={`a market game written for this app · order ${o + 1} of ${task.orders.length}`} />
        <Text style={st.cardText}>
          Weigh out {order.goods}: {order.want} measures. Put weights on the pan until the balance hangs level.
        </Text>
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View style={[{ width: 240, height: 6, backgroundColor: '#b08a40', borderRadius: 3, flexDirection: 'row', justifyContent: 'space-between' }, beam]}>
            <Text style={[st.small, { marginTop: 10 }]}>goods: {order.want}</Text>
            <Text style={[st.small, { marginTop: 10 }]}>weights: {marked}</Text>
          </View>
          <Text style={[st.small, { marginTop: 26 }]}>{level ? 'Level' : mass > order.want ? 'Tipping toward the weights' : 'Tipping toward the goods'}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {task.weights.map((w, i) => (
            <Pressable key={i} onPress={() => toggle(i)} style={[st.tile, on.includes(i) && st.tilePick]} accessibilityRole="button" accessibilityState={{ selected: on.includes(i) }}>
              <Text style={st.tileText}>{w.label}</Text>
              <Text style={st.small}>marked {w.marked}</Text>
            </Pressable>
          ))}
        </View>
        {shaved && !level && Math.abs(marked - order.want) < 0.001 && (
          <Text style={st.cardText}>The marks add up to {order.want}, but the balance is not level. One of these weights has been shaved: it says more than it really weighs. Leave it in the box.</Text>
        )}
        {!!note && <Text style={st.cardText}>{note}</Text>}
      </ScrollView>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Close</Text>
        </Pressable>
        <Pressable style={st.btn} onPress={hand} accessibilityRole="button">
          <Text style={st.btnText}>Hand it over</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ------------------------------- promises ------------------------------- */

export function VowCard({ task, width, portrait, onClose, onAccept }: Base & { task: PromiseTask; onAccept: () => void }) {
  return (
    <View style={[st.card, { width } as never, st.cardMid]}>
      <ScrollView style={{ maxHeight: portrait ? 470 : 420 }} contentContainerStyle={{ gap: 10 }}>
        <ContentLabel kind="activity" extra="promises written for this game" />
        <Text style={st.cardText}>Notes are pinned to the board, each asking for help. If you promise, a candle is lit for each one. Keep each promise at its place before its candle burns down.</Text>
        {task.promises.map((p) => (
          <View key={p.label} style={st.tile}>
            <Text style={st.tileText}>I promise to {p.label}.</Text>
          </View>
        ))}
        <Text style={st.small}>A promise kept late still counts, but try to keep every one in time.</Text>
      </ScrollView>
      <View style={st.row}>
        <Pressable style={st.btnGhost} onPress={onClose}>
          <Text style={st.btnGhostText}>Not yet</Text>
        </Pressable>
        <Pressable style={st.btn} onPress={onAccept} accessibilityRole="button">
          <Text style={st.btnText}>I promise</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** "1 more blanket", "2 more blankets". */
function unit(label: string, n: number) {
  return n === 1 && label.endsWith('s') ? label.slice(0, -1) : label;
}
