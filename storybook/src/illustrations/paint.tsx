// Small helpers for the hand-painted look: soft irregular washes, layered
// waves and a paper grain, all drawn as SVG so they stay crisp at any size.
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

export const VB_W = 1000;
export const VB_H = 700;

/** Deterministic pseudo-random numbers so a painting looks the same every time. */
export function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** A smooth closed blob around (cx, cy), like a single watercolor wash. */
export function blob(cx: number, cy: number, rx: number, ry: number, seed: number, wobble = 0.18, points = 9) {
  const rnd = seeded(seed);
  const pts = Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2;
    const k = 1 + (rnd() - 0.5) * 2 * wobble;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  let d = '';
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % points];
    const m = mid(p, q);
    if (i === 0) {
      const start = mid(pts[points - 1], p);
      d += `M${start[0].toFixed(1)},${start[1].toFixed(1)} `;
    }
    d += `Q${p[0].toFixed(1)},${p[1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)} `;
  });
  return d + 'Z';
}

/** A band of water from a wavy top edge down to `bottom`. */
export function waveBand(y: number, amp: number, length: number, phase: number, bottom = VB_H, seed = 1, from = -200, to = VB_W + 200) {
  const rnd = seeded(seed);
  let d = `M${from},${bottom} L${from},${y}`;
  for (let x = from; x < to; x += length) {
    const a = amp * (0.7 + rnd() * 0.6);
    const cx = x + length / 2;
    const cy = y + (Math.sin((x / length) * Math.PI + phase) > 0 ? -a : a);
    d += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${(x + length).toFixed(1)},${y.toFixed(1)}`;
  }
  return d + ` L${to},${bottom} Z`;
}

/**
 * Lays out every layer with the same viewBox and crop, so hotspots line up.
 * Layers that drift sideways use `bleed` so their edges never show.
 */
export function Layer({ children, style, bleed }: { children: ReactNode; style?: object; bleed?: boolean }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, bleed && { left: -60, right: -60 }, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice">
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Fine paper grain laid over the whole painting. */
export function PaperGrain({ opacity = 0.18 }: { opacity?: number }) {
  return (
    <Layer>
      <Defs>
        <Pattern id="grain" width="9" height="9" patternUnits="userSpaceOnUse">
          <Circle cx="1.5" cy="2" r="0.7" fill="#5a4630" opacity={0.35} />
          <Circle cx="6" cy="5.5" r="0.5" fill="#5a4630" opacity={0.25} />
          <Circle cx="3.5" cy="7.5" r="0.4" fill="#ffffff" opacity={0.5} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#grain)" opacity={opacity} />
    </Layer>
  );
}

/** A looping 0→1→0 value for ambient motion; stays still when motion is off. */
export function useLoop(duration: number, motion: boolean, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!motion) {
      v.stopAnimation();
      v.setValue(0.5);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [motion, duration, delay, v]);
  return v;
}

/** A one-shot 0→1 value each time `trigger` changes (a tap on a hotspot). */
export function usePulse(trigger: number | undefined, duration = 1400, motion = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!trigger) return;
    v.setValue(0);
    if (!motion) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [trigger, duration, motion, v]);
  return v;
}

/** 0 → 1 → 0 bell curve of a pulse value, for "do something and settle back". */
export const bell = (v: Animated.Value, amount: number) =>
  v.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, amount, 0] });

export type IllustrationProps = {
  motion: boolean;
  /** Last tap time per animation key, e.g. { ripple: 1730000000000 }. */
  pulses: Record<string, number>;
};

export function Frame({ children, background }: { children: ReactNode; background: string }) {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: background, overflow: 'hidden' }]}>{children}</View>;
}
