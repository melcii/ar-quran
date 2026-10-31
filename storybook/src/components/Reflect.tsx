// The reflection question and the optional ordering activity at the end of a
// story. Both are learning activities written by the editors, never scripture.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatRef } from '@/content/quran';
import type { OrderingActivity, Story } from '@/content/types';
import { colors, fonts } from '@/theme';
import { Body, Button, Card, ContentLabel, Row } from './ui';

export function Reflect({ story }: { story: Story }) {
  if (!story.reflection) return null;
  return (
    <View style={{ gap: 14 }}>
      <Card style={styles.activity}>
        <ContentLabel kind="activity" />
        <Text style={styles.question}>{story.reflection.question}</Text>
        {story.reflection.prompts.map((p) => (
          <Body key={p}>• {p}</Body>
        ))}
        <Text style={styles.small}>You can think about this quietly or talk about it with someone at home.</Text>
      </Card>
      {story.activity && <OrderActivity activity={story.activity} />}
    </View>
  );
}

function shuffle<T>(items: T[], seed: number) {
  const a = [...items];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function OrderActivity({ activity }: { activity: OrderingActivity }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const cards = useMemo(() => shuffle(activity.events, 7), [activity]);
  const done = picked.length === activity.events.length;

  const pick = (id: string) => {
    const expected = activity.events[picked.length];
    if (id === expected.id) {
      setPicked((p) => [...p, id]);
      setMessage(picked.length + 1 === activity.events.length ? 'You followed the order of the verses. Well explored!' : null);
    } else {
      setMessage(`Let's explore the passage again: what comes next? Try reading ${formatRef(expected.reference)}.`);
    }
  };

  if (!open)
    return <Button kind="secondary" label="Optional activity: put the events in order" onPress={() => setOpen(true)} style={{ alignSelf: 'flex-start' }} />;

  return (
    <Card style={styles.activity}>
      <ContentLabel kind="activity" extra="optional" />
      <Body>{activity.instructions}</Body>
      <View style={{ gap: 8 }}>
        {cards.map((e) => {
          const pos = picked.indexOf(e.id);
          return (
            <Button
              key={e.id}
              kind={pos >= 0 ? 'primary' : 'secondary'}
              label={`${pos >= 0 ? `${pos + 1}. ` : ''}${e.text}`}
              disabled={pos >= 0}
              onPress={() => pick(e.id)}
              style={{ justifyContent: 'flex-start' }}
            />
          );
        })}
      </View>
      {message && <Body style={{ color: done ? colors.greenDeep : colors.inkSoft }}>{message}</Body>}
      <Row>
        <Button
          small
          kind="quiet"
          label="Start again"
          onPress={() => {
            setPicked([]);
            setMessage(null);
          }}
        />
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  activity: { backgroundColor: colors.activity, borderColor: colors.activityBorder, borderWidth: 1.5 },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  question: { fontFamily: fonts.display, fontSize: 22, lineHeight: 30, color: colors.ink },
});
