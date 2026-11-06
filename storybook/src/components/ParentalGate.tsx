// A simple grown-up check before the parent area: multiply two numbers written
// in words. It keeps young children out without collecting anything.
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '@/theme';
import { Body, Button, Card, Heading, Row } from './ui';

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

export function ParentalGate({ onPass }: { onPass: () => void }) {
  const [seed, setSeed] = useState(() => Math.random());
  const { a, b } = useMemo(() => ({ a: 3 + Math.floor(seed * 7), b: 3 + Math.floor(((seed * 1000) % 1) * 7) }), [seed]);
  const [entry, setEntry] = useState('');
  const [wrong, setWrong] = useState(false);

  const press = (d: string) => {
    setWrong(false);
    setEntry((e) => (e.length < 3 ? e + d : e));
  };
  const submit = () => {
    if (Number(entry) === a * b) onPass();
    else {
      setWrong(true);
      setEntry('');
      setSeed(Math.random());
    }
  };

  return (
    <Card style={styles.card}>
      <Heading>For grown-ups</Heading>
      <Body muted>To open the parent area, please answer:</Body>
      <Text style={styles.question} accessibilityLiveRegion="polite">
        What is {WORDS[a]} times {WORDS[b]}?
      </Text>
      <Text style={styles.entry} accessibilityLabel={`Your answer: ${entry || 'empty'}`}>
        {entry || ' '}
      </Text>
      {wrong && <Body style={{ color: colors.terracotta }}>That's not quite right. Here is a new question.</Body>}
      <View style={styles.pad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={k === '⌫' ? 'Delete' : k === 'OK' ? 'Submit answer' : k}
            onPress={() => (k === '⌫' ? setEntry((e) => e.slice(0, -1)) : k === 'OK' ? submit() : press(k))}
            style={({ pressed }) => [styles.key, k === 'OK' && styles.ok, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.keyText, k === 'OK' && { color: '#FFFBF2' }]}>{k}</Text>
          </Pressable>
        ))}
      </View>
      <Row>
        <Button label="New question" kind="quiet" small onPress={() => { setSeed(Math.random()); setEntry(''); }} />
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { maxWidth: 420, width: '100%', alignSelf: 'center', gap: 10 },
  question: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  entry: {
    fontFamily: fonts.bodyBold,
    fontSize: 28,
    textAlign: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius.sm,
    paddingVertical: 8,
    color: colors.ink,
  },
  pad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  key: {
    width: '30%',
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.paperDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ok: { backgroundColor: colors.greenDeep },
  keyText: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.ink },
});
