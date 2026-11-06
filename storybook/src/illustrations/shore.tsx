// Shore scenes for the story of Yunus. Original artwork. No person is ever drawn.
import { Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { bell, blob, Frame, Layer, PaperGrain, useLoop, usePulse, VB_H, VB_W, waveBand, type IllustrationProps } from './paint';

function GourdVine({ x, y, scale = 1, dark = false }: { x: number; y: number; scale?: number; dark?: boolean }) {
  const leaf = dark ? '#3E5A45' : '#6F8F6A';
  const leaf2 = dark ? '#2F4636' : '#4E6B4B';
  const leafAt = (lx: number, ly: number, r: number, seed: number, rot: number) => (
    <G key={seed} transform={`translate(${lx},${ly}) rotate(${rot})`}>
      <Path d={blob(0, 0, r, r * 0.8, seed, 0.22, 7)} fill={seed % 2 ? leaf : leaf2} />
      <Path d={`M0,0 L${r * 0.7},0 M0,0 L${r * 0.45},${-r * 0.45} M0,0 L${r * 0.45},${r * 0.45}`} stroke="#DDE8D3" strokeWidth={1.6} opacity={0.5} />
    </G>
  );
  return (
    <G transform={`translate(${x},${y}) scale(${scale})`}>
      <Path d="M-150,10 Q-90,-40 -20,-20 Q40,0 90,-50 Q130,-90 170,-60" stroke={leaf2} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M-60,-25 q-10,-30 10,-40 q14,-6 10,10" stroke={leaf2} strokeWidth={2.5} fill="none" />
      <Path d="M110,-70 q10,-26 30,-22 q12,4 0,14" stroke={leaf2} strokeWidth={2.5} fill="none" />
      {leafAt(-130, -10, 34, 3, -20)}
      {leafAt(-80, -45, 40, 4, -60)}
      {leafAt(-20, -40, 46, 5, -100)}
      {leafAt(40, -30, 42, 6, -40)}
      {leafAt(95, -80, 38, 7, -110)}
      {leafAt(150, -70, 30, 8, -10)}
      {!dark && (
        <>
          <Ellipse cx={10} cy={-8} rx={9} ry={9} fill="#E9C46A" />
          <Ellipse cx={125} cy={-50} rx={7} ry={7} fill="#E9C46A" />
        </>
      )}
    </G>
  );
}

export function ShoreGourd({ motion, pulses }: IllustrationProps) {
  const grow = usePulse(pulses.grow, 2000, motion);
  const glow = usePulse(pulses.glow, 1800, motion);
  const sway = useLoop(3800, motion);
  return (
    <Frame background="#F4E6CB">
      <Layer>
        <Defs>
          <LinearGradient id="sg-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#A9CEDC" />
            <Stop offset="0.6" stopColor="#F3E8D2" />
            <Stop offset="1" stopColor="#F2DDB8" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#sg-sky)" />
        <Path d={blob(200, 130, 120, 22, 41)} fill="#FFFFFF" opacity={0.7} />
        <Path d={blob(620, 90, 90, 16, 42)} fill="#FFFFFF" opacity={0.6} />
        {/* Distant hills inland */}
        <Path d="M480,330 Q600,250 720,300 Q820,240 1000,290 L1000,400 L480,400 Z" fill="#B9C6A4" opacity={0.8} />
        <Path d="M560,360 Q700,300 820,340 Q900,310 1000,330 L1000,420 L560,420 Z" fill="#9DB08C" opacity={0.85} />
        {/* The sea, on the left */}
        <Path d="M0,330 L520,330 Q480,420 360,470 Q200,520 0,520 Z" fill="#7FAEB9" />
        <Path d="M0,380 L460,380 Q420,440 320,480 Q180,520 0,530 Z" fill="#6497A7" opacity={0.8} />
      </Layer>
      <Layer bleed style={{ transform: [{ translateX: sway.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] }) }] }}>
        <Path d="M0,470 Q160,452 300,470 Q380,480 420,470" stroke="#FFFFFF" strokeWidth={4} fill="none" opacity={0.55} strokeLinecap="round" />
      </Layer>
      <Layer>
        {/* The open shore */}
        <Path d="M0,520 Q200,520 360,470 Q480,420 560,400 Q760,370 1000,400 L1000,700 L0,700 Z" fill="#E7CFA0" />
        <Path d={blob(260, 600, 260, 50, 51, 0.15)} fill="#DDBF89" opacity={0.6} />
        <Path d={blob(760, 520, 240, 40, 52, 0.15)} fill="#EED9AF" opacity={0.7} />
        {/* A path leading inland */}
        <Path d="M640,700 Q700,560 800,470 Q850,430 900,410" stroke="#CFAE76" strokeWidth={26} fill="none" strokeLinecap="round" opacity={0.75} />
      </Layer>
      <Layer style={{ opacity: glow.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.8, 0] }) }}>
        <Ellipse cx={870} cy={410} rx={90} ry={50} fill="#FFF3CF" />
      </Layer>
      <Layer
        style={{
          opacity: grow.interpolate({ inputRange: [0, 0.01, 1], outputRange: [1, 0.15, 1] }),
          transform: [
            { translateY: grow.interpolate({ inputRange: [0, 0.01, 1], outputRange: [0, 36, 0] }) },
            { translateX: bell(grow, 4) },
          ],
        }}
      >
        <GourdVine x={600} y={500} />
      </Layer>
      <PaperGrain />
    </Frame>
  );
}

export function ReflectDusk({ motion }: IllustrationProps) {
  const shimmer = useLoop(5000, motion);
  return (
    <Frame background="#E9B98F">
      <Layer>
        <Defs>
          <LinearGradient id="rd-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#52608A" />
            <Stop offset="0.45" stopColor="#D79A7B" />
            <Stop offset="0.75" stopColor="#F2CB8C" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#rd-sky)" />
        <Path d={waveBand(400, 2, 200, 0, VB_H, 7)} fill="#7C8FA6" />
        <Path d={waveBand(440, 5, 160, 1, VB_H, 9)} fill="#64788F" />
      </Layer>
      <Layer style={{ opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }) }}>
        <Path d={blob(520, 420, 160, 8, 3, 0.3)} fill="#F6D59A" />
      </Layer>
      <Layer>
        <Path d="M0,560 Q300,520 600,540 Q820,555 1000,520 L1000,700 L0,700 Z" fill="#C9A273" />
        <Path d={blob(300, 640, 300, 50, 4)} fill="#B38D60" opacity={0.6} />
        <GourdVine x={760} y={600} scale={0.6} dark />
      </Layer>
      <PaperGrain />
    </Frame>
  );
}

export function VersesPaper(_: IllustrationProps) {
  return (
    <Frame background="#F7F1E3">
      <Layer>
        <Rect x="0" y="0" width={VB_W} height={VB_H} fill="#F7F1E3" />
        <Path d={blob(200, 160, 260, 120, 61, 0.25)} fill="#EFE4CC" opacity={0.7} />
        <Path d={blob(820, 560, 280, 140, 62, 0.25)} fill="#EADFC6" opacity={0.6} />
        <Rect x="40" y="40" width={VB_W - 80} height={VB_H - 80} fill="none" stroke="#D9C9A3" strokeWidth={3} rx={24} />
      </Layer>
      <PaperGrain />
    </Frame>
  );
}
