// Draws a story illustration and, optionally, its tappable objects. Hotspot
// positions are fractions of the painting, mapped through the same "cover"
// crop the painting uses, so they stay on their object at any screen size.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import type { InteractiveElement } from '@/content/types';
import { illustrations, VB_H, VB_W } from '@/illustrations';
import { colors, fonts } from '@/theme';

type Props = {
  name: string;
  alt: string;
  motion: boolean;
  pulses?: Record<string, number>;
  elements?: InteractiveElement[];
  found?: string[];
  onTapElement?: (el: InteractiveElement) => void;
  style?: StyleProp<ViewStyle>;
  showArtTag?: boolean;
};

export function Illustration({ name, alt, motion, pulses = {}, elements = [], found = [], onTapElement, style, showArtTag = true }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const entry = illustrations[name];
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const scale = Math.max(size.w / VB_W, size.h / VB_H);
  const ox = (size.w - VB_W * scale) / 2;
  const oy = (size.h - VB_H * scale) / 2;

  return (
    <View style={[styles.wrap, style]} onLayout={onLayout}>
      <View style={StyleSheet.absoluteFill} accessible accessibilityRole="image" accessibilityLabel={alt}>
        {entry ? (
          <entry.component motion={motion} pulses={pulses} />
        ) : (
          <View style={styles.missing}>
            <Text style={styles.missingText}>Illustration unavailable</Text>
          </View>
        )}
      </View>
      {size.w > 0 &&
        elements.map((el) => {
          const r = Math.max(26, el.position.radius * VB_W * scale);
          const cx = ox + el.position.x * VB_W * scale;
          const cy = oy + el.position.y * VB_H * scale;
          if (cx < 0 || cy < 0 || cx > size.w || cy > size.h) return null;
          return (
            <Hotspot
              key={el.id}
              left={cx - r}
              top={cy - r}
              size={r * 2}
              label={el.object_name}
              found={found.includes(el.id)}
              motion={motion}
              onPress={() => onTapElement?.(el)}
            />
          );
        })}
      {showArtTag && (
        <View style={styles.artTag} pointerEvents="none">
          <Text style={styles.artTagText}>Artist's illustration</Text>
        </View>
      )}
    </View>
  );
}

function Hotspot({ left, top, size, label, found, motion, onPress }: { left: number; top: number; size: number; label: string; found: boolean; motion: boolean; onPress: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!motion || found) {
      pulse.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [motion, found, pulse]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Explore: ${label}`}
      accessibilityHint="Shows something to discover about this part of the picture"
      onPress={onPress}
      style={[styles.hotspot, { left, top, width: size, height: size, borderRadius: size / 2 }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            borderRadius: size / 2,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          },
        ]}
      />
      <View style={[styles.dot, found && styles.dotFound]}>
        <Text style={styles.dotText}>{found ? '✓' : '?'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.paperDeep },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontFamily: fonts.body, color: colors.inkSoft },
  hotspot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 3, borderColor: '#FFF6DD' },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 246, 221, 0.92)',
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFound: { backgroundColor: 'rgba(214, 230, 205, 0.95)', borderColor: colors.greenDeep },
  dotText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, lineHeight: 18 },
  artTag: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'rgba(255,251,242,0.8)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  artTagText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },
});
