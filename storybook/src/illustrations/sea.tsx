// Sea scenes for the story of Yunus. Original artwork. No person is ever drawn.
import { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { bell, blob, Frame, Layer, PaperGrain, useLoop, usePulse, VB_H, VB_W, waveBand, type IllustrationProps } from './paint';

function Clouds({ seed, color, y, motion }: { seed: number; color: string; y: number; motion: boolean }) {
  const drift = useLoop(14000, motion);
  return (
    <Layer bleed style={{ transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] }) }] }}>
      <G opacity={0.75}>
        <Path d={blob(220, y, 130, 26, seed)} fill={color} />
        <Path d={blob(300, y + 14, 90, 18, seed + 3)} fill={color} opacity={0.7} />
        <Path d={blob(760, y - 40, 110, 20, seed + 7)} fill={color} />
        <Path d={blob(840, y - 28, 70, 14, seed + 9)} fill={color} opacity={0.6} />
      </G>
    </Layer>
  );
}

function Waves({ y, colors, motion, pulse, seed }: { y: number; colors: string[]; motion: boolean; pulse?: number; seed: number }) {
  const sway = useLoop(4200, motion);
  const sway2 = useLoop(5600, motion, 600);
  const ripple = usePulse(pulse, 1600, motion);
  return (
    <>
      <Layer bleed style={{ transform: [{ translateX: sway.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] }) }] }}>
        <Path d={waveBand(y, 7, 90, 0, VB_H, seed)} fill={colors[0]} opacity={0.85} />
      </Layer>
      <Layer
        bleed
        style={{
          transform: [
            { translateX: sway2.interpolate({ inputRange: [0, 1], outputRange: [14, -14] }) },
            { translateY: bell(ripple, -10) },
          ],
        }}
      >
        <Path d={waveBand(y + 60, 9, 120, 1, VB_H, seed + 1)} fill={colors[1]} opacity={0.8} />
      </Layer>
      <Layer
        bleed
        style={{
          transform: [
            { translateX: sway.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] }) },
            { translateY: bell(ripple, -18) },
          ],
        }}
      >
        <Path d={waveBand(y + 140, 12, 150, 2, VB_H, seed + 2)} fill={colors[2]} opacity={0.85} />
        <G opacity={0.35}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Path key={i} d={`M${80 + i * 160},${y + 190 + (i % 2) * 30} q30,-8 60,0`} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />
          ))}
        </G>
      </Layer>
    </>
  );
}

export function SeaDawn({ motion, pulses }: IllustrationProps) {
  const glow = usePulse(pulses.glow, 1800, motion);
  return (
    <Frame background="#F3E3C8">
      <Layer>
        <Defs>
          <LinearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#BFD8E2" />
            <Stop offset="0.55" stopColor="#F4E1C1" />
            <Stop offset="1" stopColor="#F2CFA6" />
          </LinearGradient>
          <RadialGradient id="sd-sun" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#FFF4D6" stopOpacity="1" />
            <Stop offset="0.45" stopColor="#F6D58E" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#F2C27A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#sd-sky)" />
        <Ellipse cx="740" cy="300" rx="170" ry="170" fill="url(#sd-sun)" />
        <Ellipse cx="740" cy="318" rx="46" ry="46" fill="#FBE7B5" />
      </Layer>
      <Layer style={{ opacity: glow.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.9, 0] }) }}>
        <Ellipse cx="740" cy="310" rx="230" ry="230" fill="#FFF3CF" opacity={0.6} />
      </Layer>
      <Clouds seed={11} color="#FFF7EA" y={150} motion={motion} />
      <Layer>
        <Path d={waveBand(352, 2, 200, 0, VB_H, 4)} fill="#A9C9CF" />
        <Path d={blob(740, 372, 120, 10, 5, 0.3)} fill="#FBE7B5" opacity={0.7} />
      </Layer>
      <Waves y={400} colors={['#8DB7C0', '#6E9FAE', '#547F93']} motion={motion} pulse={pulses.ripple} seed={20} />
      <PaperGrain />
    </Frame>
  );
}

export function SeaShip({ motion, pulses }: IllustrationProps) {
  const bob = useLoop(3000, motion);
  const tap = usePulse(pulses.bob, 1600, motion);
  return (
    <Frame background="#DCE8E6">
      <Layer>
        <Defs>
          <LinearGradient id="ss-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#9EC2D2" />
            <Stop offset="0.7" stopColor="#E7EEE6" />
            <Stop offset="1" stopColor="#F1E6CF" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#ss-sky)" />
        <Path d={blob(820, 120, 60, 60, 2, 0.05)} fill="#FFF6DD" opacity={0.65} />
      </Layer>
      <Clouds seed={31} color="#FFFFFF" y={170} motion={motion} />
      <Layer>
        <Path d={waveBand(340, 2, 220, 0, VB_H, 8)} fill="#93B9C4" />
      </Layer>
      {/* The ship: small and far away. The Quran does not describe it. */}
      <Layer
        style={{
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) },
            { rotate: bell(tap, 0.06).interpolate({ inputRange: [0, 1], outputRange: ['0rad', '1rad'] }) },
          ],
        }}
      >
        <G>
          <Path d="M610,330 L720,330 Q706,352 676,354 L648,354 Q620,350 610,330 Z" fill="#7A5A44" />
          <Path d="M613,331 L717,331" stroke="#5E4434" strokeWidth={2} />
          <Path d="M664,330 L664,236" stroke="#5E4434" strokeWidth={3} />
          <Path d="M667,242 Q706,276 700,318 L667,318 Z" fill="#F5ECD9" />
          <Path d="M661,248 Q634,280 640,318 L661,318 Z" fill="#EADCC0" />
          <Path d="M664,236 l14,6 l-14,5 z" fill="#C2704E" />
          <Ellipse cx="665" cy="358" rx="70" ry="5" fill="#5E8597" opacity={0.35} />
        </G>
      </Layer>
      <Waves y={380} colors={['#7FAEB9', '#5F93A4', '#46768A']} motion={motion} pulse={pulses.ripple} seed={40} />
      <PaperGrain />
    </Frame>
  );
}

export function DeepFish({ motion, pulses }: IllustrationProps) {
  const swim = useLoop(7000, motion);
  const glide = usePulse(pulses.glide, 2200, motion);
  const rise = usePulse(pulses.bubbles, 2600, motion);
  const rays = useLoop(6000, motion);
  return (
    <Frame background="#1F4A5E">
      <Layer>
        <Defs>
          <LinearGradient id="df-water" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4F8EA1" />
            <Stop offset="0.5" stopColor="#245468" />
            <Stop offset="1" stopColor="#0F2B3B" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#df-water)" />
      </Layer>
      <Layer style={{ opacity: rays.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] }) }}>
        <G opacity={0.5}>
          <Path d="M180,0 L260,0 L420,700 L250,700 Z" fill="#BFE3E6" opacity={0.18} />
          <Path d="M430,0 L480,0 L600,700 L470,700 Z" fill="#BFE3E6" opacity={0.14} />
          <Path d="M650,0 L720,0 L860,700 L700,700 Z" fill="#BFE3E6" opacity={0.12} />
        </G>
      </Layer>
      <Layer>
        <Path d={blob(500, 760, 700, 120, 9, 0.12)} fill="#0C2230" opacity={0.9} />
        <Path d={blob(160, 700, 220, 70, 12, 0.2)} fill="#173847" opacity={0.8} />
      </Layer>
      {/* The great fish: a soft shadow, not a real animal design. */}
      <Layer
        bleed
        style={{
          transform: [
            { translateX: swim.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] }) },
            { translateX: glide.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -40, 0] }) },
            { translateY: swim.interpolate({ inputRange: [0, 1], outputRange: [5, -5] }) },
          ],
        }}
      >
        <G opacity={0.92}>
          <Path
            d="M180,390 Q300,250 560,268 Q760,282 820,370 Q760,450 560,470 Q320,488 180,390 Z"
            fill="#0E2735"
          />
          <Path d="M800,372 Q880,300 930,288 Q900,372 930,456 Q880,444 800,372 Z" fill="#0E2735" />
          <Path d="M240,380 Q380,330 600,334" stroke="#2D5568" strokeWidth={5} fill="none" opacity={0.6} strokeLinecap="round" />
          <Path d="M470,276 Q520,220 600,240 Q560,262 540,276 Z" fill="#0E2735" />
        </G>
      </Layer>
      <Layer
        style={{
          transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [0, -120] }) }],
          opacity: rise.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0.25, 1, 0.8, 0.25] }),
        }}
      >
        <G>
          {[
            [150, 600, 8],
            [176, 560, 5],
            [140, 520, 6],
            [200, 500, 4],
            [165, 470, 7],
          ].map(([x, y, r], i) => (
            <Ellipse key={i} cx={x} cy={y} rx={r} ry={r} fill="none" stroke="#CDEBEE" strokeWidth={2} />
          ))}
        </G>
      </Layer>
      <PaperGrain opacity={0.12} />
    </Frame>
  );
}

export function NightSea({ motion, pulses }: IllustrationProps) {
  const twinkle = useLoop(2600, motion);
  const stars = Array.from({ length: 46 }, (_, i) => {
    const x = (i * 211) % VB_W;
    const y = 20 + ((i * 97) % 300);
    return { x, y, r: 1 + (i % 3) * 0.7 };
  });
  return (
    <Frame background="#141E33">
      <Layer>
        <Defs>
          <LinearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0E1528" />
            <Stop offset="1" stopColor="#25324D" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#ns-sky)" />
      </Layer>
      <Layer style={{ opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }}>
        {stars.filter((_, i) => i % 2 === 0).map((s, i) => (
          <Ellipse key={i} cx={s.x} cy={s.y} rx={s.r} ry={s.r} fill="#F4EBD0" />
        ))}
      </Layer>
      <Layer style={{ opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] }) }}>
        {stars.filter((_, i) => i % 2 === 1).map((s, i) => (
          <Ellipse key={i} cx={s.x} cy={s.y} rx={s.r} ry={s.r} fill="#F4EBD0" />
        ))}
      </Layer>
      <Layer>
        <Path d={waveBand(380, 2, 220, 0, VB_H, 3)} fill="#1B2A44" />
      </Layer>
      <Waves y={420} colors={['#1A2C45', '#15253B', '#0F1C2E']} motion={motion} pulse={pulses.ripple} seed={60} />
      <PaperGrain opacity={0.1} />
    </Frame>
  );
}
