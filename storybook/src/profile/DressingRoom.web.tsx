// The dressing room: a warm plastered room with a plank floor, a rug, a tall
// mirror and a rail of clothes, built from the same kit and light as the
// worlds. The child turns and zooms their explorer, tries clothes, hair,
// headwear and bags, previews how it moves, picks a nickname and saves it.
// Adding or removing explorers on the device is behind the grown-up check.
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { router } from 'expo-router';
import { ToneMappingMode } from 'postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import * as THREE from 'three';
import { ParentalGate } from '@/components/ParentalGate';
import { M } from '@/adventure/kit';
import { SoftShapes } from '@/three/soft';
import { colors, fonts } from '@/theme';
import { Explorer, type Anim } from './Explorer';
import * as L from './look';
import { MAX_PROFILES, profiles, suggestNick, useProfiles, type Profile } from './store';

function Room() {
  const rail = useMemo(() => ['#3f8a8c', '#d9a55a', '#8a3a4a', '#5a7a3a', '#e8dcc0', '#2f6a8a'], []);
  return (
    <group>
      {/* Floor and walls. */}
      <mesh material={M('#a07a52', { map: 'planks' })} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[12, 12]} />
      </mesh>
      <mesh material={M('#ead9b8')} position={[0, 2.5, -3]} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
      </mesh>
      <mesh material={M('#e4d0ac')} position={[-4, 2.5, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
      </mesh>
      <mesh material={M('#e4d0ac')} position={[4, 2.5, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <boxGeometry args={[12, 5, 0.2]} />
      </mesh>
      {/* Round rug under the explorer. */}
      <mesh material={M('#b0603a')} rotation-x={-Math.PI / 2} position-y={0.01} receiveShadow>
        <circleGeometry args={[1.2, 40]} />
      </mesh>
      <mesh material={M('#d9a55a')} rotation-x={-Math.PI / 2} position-y={0.015}>
        <ringGeometry args={[0.85, 0.95, 40]} />
      </mesh>
      {/* A tall mirror in a wooden frame. */}
      <group position={[-2.2, 0, -2.75]}>
        <mesh material={M('#7a4e2a', { map: 'planks' })} position-y={1.2} castShadow>
          <boxGeometry args={[1.1, 2.3, 0.12]} />
        </mesh>
        <mesh position={[0, 1.2, 0.07]}>
          <planeGeometry args={[0.9, 2.05]} />
          <meshStandardMaterial color="#cfe0e4" metalness={0.8} roughness={0.12} />
        </mesh>
      </group>
      {/* Window with soft daylight and curtains. */}
      <group position={[1.4, 2.4, -2.88]}>
        <mesh>
          <planeGeometry args={[1.6, 1.4]} />
          <meshBasicMaterial color="#fff2d0" toneMapped={false} />
        </mesh>
        <mesh material={M('#7a4e2a')} position-y={0.75}>
          <boxGeometry args={[2.3, 0.1, 0.12]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={M('#3f8a8c')} position={[s * 1.0, -0.15, 0.08]}>
            <boxGeometry args={[0.32, 1.8, 0.06]} />
          </mesh>
        ))}
      </group>
      {/* A rail of clothes. */}
      <group position={[2.9, 0, -1.2]} rotation-y={-Math.PI / 2}>
        {[-0.9, 0.9].map((x) => (
          <mesh key={x} material={M('#6a4a2e')} position={[x, 0.9, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 1.8, 8]} />
          </mesh>
        ))}
        <mesh material={M('#6a4a2e')} position-y={1.75} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 1.9, 8]} />
        </mesh>
        {rail.map((c, i) => (
          <mesh key={i} material={M(c)} position={[-0.7 + i * 0.28, 1.32, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.5, 4, 8]} />
          </mesh>
        ))}
      </group>
      {/* A potted olive and a low bench. */}
      <group position={[-3.1, 0, 0.6]}>
        <mesh material={M('#b0603a')} position-y={0.25}>
          <cylinderGeometry args={[0.25, 0.2, 0.5, 14]} />
        </mesh>
        <mesh material={M('#6a8a4a')} position-y={0.95}>
          <sphereGeometry args={[0.45, 14, 10]} />
        </mesh>
      </group>
      <mesh material={M('#8a6a44', { map: 'planks' })} position={[0, 0.22, -2.3]} castShadow>
        <boxGeometry args={[1.6, 0.44, 0.5]} />
      </mesh>
    </group>
  );
}

type Tab = 'ready' | 'body' | 'hair' | 'face' | 'clothes' | 'head' | 'feet' | 'bags' | 'name';
const TABS: [Tab, string][] = [
  ['ready', 'Ready-made'],
  ['body', 'Body'],
  ['hair', 'Hair'],
  ['face', 'Face'],
  ['clothes', 'Clothes'],
  ['head', 'Headwear'],
  ['feet', 'Shoes'],
  ['bags', 'Bags & glasses'],
  ['name', 'Nickname'],
];
const ANIMS: [Anim, string][] = [
  ['idle', 'Stand'],
  ['walk', 'Walk'],
  ['run', 'Run'],
  ['turn', 'Turn'],
  ['wave', 'Wave'],
  ['point', 'Point'],
  ['pickup', 'Pick up'],
  ['carry', 'Carry'],
  ['place', 'Put down'],
  ['guide', 'Lead an animal'],
  ['interact', 'Open a door'],
  ['cheer', 'Celebrate'],
  ['sit', 'Sit'],
];

function Chips<T extends string>({ opts, value, on }: { opts: L.Opt<T>[]; value: T; on: (v: T) => void }) {
  return (
    <View style={st.wrap}>
      {opts.map((o) => (
        <Pressable key={o.id} accessibilityRole="button" accessibilityState={{ selected: o.id === value }} onPress={() => on(o.id)} style={[st.chip, o.id === value && st.chipOn]}>
          <Text style={[st.chipText, o.id === value && st.chipTextOn]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Swatches({ label, list, value, on }: { label: string; list: string[]; value: string; on: (v: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.label}>{label}</Text>
      <View style={st.wrap}>
        {list.map((c) => (
          <Pressable key={c} accessibilityRole="button" accessibilityLabel={`${label} ${c}`} accessibilityState={{ selected: c === value }} onPress={() => on(c)} style={[st.sw, { backgroundColor: c }, c === value && st.swOn]} />
        ))}
      </View>
    </View>
  );
}

function Explorers({ onClose }: { onClose: () => void }) {
  const book = useProfiles();
  const [gate, setGate] = useState<null | { why: 'add' } | { why: 'remove'; id: string }>(null);
  const [passed, setPassed] = useState(false);
  const play = (p: Profile) => {
    if (profiles.switchTo(p.id)) globalThis.location?.reload();
    else onClose();
  };
  const doAdd = () => {
    const id = profiles.add(suggestNick());
    if (id && profiles.switchTo(id)) globalThis.location?.reload();
  };
  if (gate && !passed)
    return (
      <View style={{ gap: 10 }}>
        <ParentalGate
          onPass={() => {
            setPassed(true);
            if (gate.why === 'add') doAdd();
          }}
        />
        <Pressable onPress={() => setGate(null)} style={st.ghost}>
          <Text style={st.ghostText}>Back</Text>
        </Pressable>
      </View>
    );
  if (gate?.why === 'remove' && passed) {
    const p = book.list.find((x) => x.id === gate.id);
    return (
      <View style={{ gap: 10 }}>
        <Text style={st.h2}>Remove {p?.nickname}?</Text>
        <Text style={st.small}>This deletes this explorer's look and all their saves on this device: worlds, journal, bookmarks and settings. It cannot be undone.</Text>
        <View style={st.wrap}>
          <Pressable
            style={st.danger}
            onPress={() => {
              profiles.remove(gate.id);
              setGate(null);
              setPassed(false);
            }}
          >
            <Text style={st.btnText}>Remove</Text>
          </Pressable>
          <Pressable onPress={() => (setGate(null), setPassed(false))} style={st.ghost}>
            <Text style={st.ghostText}>Keep</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <Text style={st.h2}>Who is exploring?</Text>
      <Text style={st.small}>Each explorer has their own look, worlds, journal, bookmarks and settings on this device. Only a nickname is kept, never a real name.</Text>
      {book.list.map((p) => (
        <View key={p.id} style={[st.row, p.id === book.active && st.rowOn]}>
          <View style={[st.dot, { backgroundColor: p.look.topColor }]} />
          <Text style={[st.name, { flex: 1 }]}>{p.nickname}</Text>
          {p.id === book.active ? (
            <Text style={st.small}>Playing now</Text>
          ) : (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel={`Play as ${p.nickname}`} onPress={() => play(p)} style={st.btnSm}>
                <Text style={st.btnText}>Play as</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p.nickname}`} onPress={() => (setPassed(false), setGate({ why: 'remove', id: p.id }))} style={st.ghostSm}>
                <Text style={st.ghostText}>Remove</Text>
              </Pressable>
            </>
          )}
        </View>
      ))}
      {book.list.length < MAX_PROFILES ? (
        <Pressable accessibilityRole="button" onPress={() => (setPassed(false), setGate({ why: 'add' }))} style={st.ghost}>
          <Text style={st.ghostText}>+ New explorer (grown-up check)</Text>
        </Pressable>
      ) : (
        <Text style={st.small}>This device has room for {MAX_PROFILES} explorers.</Text>
      )}
      <Pressable onPress={onClose} style={st.ghost}>
        <Text style={st.ghostText}>Back to the dressing room</Text>
      </Pressable>
    </View>
  );
}

export default function DressingRoom() {
  const me = profiles.active();
  const [look, setLook] = useState<L.Look>(me.look);
  const [nick, setNick] = useState(me.nickname);
  const [tab, setTab] = useState<Tab>('ready');
  const [who, setWho] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [anim, setAnimState] = useState<Anim>('idle');
  const animRef = useRef<Anim>('idle');
  const turn = useRef<THREE.Group>(null);
  const controls = useRef<{ object: THREE.Camera; target: THREE.Vector3; update: () => void } | null>(null);
  const { width, height } = useWindowDimensions();
  const wide = width >= 820;
  const set = (p: Partial<L.Look>) => {
    setLook((l) => ({ ...l, ...p }));
    setSaved(null);
  };
  const setAnim = (a: Anim) => {
    animRef.current = a;
    setAnimState(a);
  };
  const dirty = JSON.stringify(look) !== JSON.stringify(me.look) || nick !== me.nickname;
  const save = () => {
    profiles.update(me.id, { look, nickname: nick });
    const p = profiles.active();
    setNick(p.nickname);
    setSaved(`Saved for ${p.nickname}. Your explorer will look like this in every world.`);
  };
  const zoom = (k: number) => {
    const c = controls.current;
    if (!c) return;
    const d = c.object.position.clone().sub(c.target);
    const len = Math.min(4.5, Math.max(1.3, d.length() * k));
    c.object.position.copy(c.target).add(d.setLength(len));
    c.update();
  };
  const spin = (a: number) => {
    if (turn.current) turn.current.rotation.y += a;
  };
  useEffect(() => {
    (globalThis as Record<string, unknown>).__dress = {
      look: () => look,
      anim: () => animRef.current,
      turn: () => turn.current?.rotation.y ?? 0,
      dist: () => (controls.current ? controls.current.object.position.distanceTo(controls.current.target) : -1),
    };
  });
  const scene = (
    <View style={wide ? { flex: 1 } : { height: Math.max(300, height * 0.5) }}>
      <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 40, position: [0.9, 1.25, 3.9] }} style={{ position: 'absolute', inset: 0 } as never}>
        <SoftShapes />
        <color attach="background" args={['#e9d9b8']} />
        <hemisphereLight args={['#fff4dc', '#8a6a44', 0.9]} />
        <directionalLight position={[2.5, 4, 3]} intensity={2.2} color="#ffe2b0" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} shadow-normalBias={0.03} />
        <pointLight position={[1.4, 2.4, -2]} intensity={6} distance={6} color="#ffe8c0" />
        <Room />
        <group ref={turn}>
          <Explorer look={look} anim={animRef} />
        </group>
        <OrbitControls ref={controls as never} target={[0, 0.75, 0]} enablePan={false} minDistance={1.3} maxDistance={4.5} minPolarAngle={0.5} maxPolarAngle={1.62} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.5} luminanceThreshold={1.05} luminanceSmoothing={0.25} />
          <Vignette offset={0.32} darkness={0.35} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Canvas>
      <View style={st.overlay} pointerEvents="box-none">
        <View style={st.wrap}>
          {(
            [
              ['⟲ Turn', () => spin(-Math.PI / 4)],
              ['Turn ⟳', () => spin(Math.PI / 4)],
              ['Zoom in', () => zoom(0.8)],
              ['Zoom out', () => zoom(1.25)],
            ] as [string, () => void][]
          ).map(([t, f]) => (
            <Pressable key={t} accessibilityRole="button" onPress={f} style={st.tool}>
              <Text style={st.toolText}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.wrap}>
          {ANIMS.map(([a, t]) => (
            <Pressable key={a} accessibilityRole="button" accessibilityLabel={`Preview: ${t}`} accessibilityState={{ selected: a === anim }} onPress={() => setAnim(a)} style={[st.tool, a === anim && st.toolOn]}>
              <Text style={[st.toolText, a === anim && { color: '#fff' }]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
  const body = (() => {
    if (who) return <Explorers onClose={() => setWho(false)} />;
    switch (tab) {
      case 'ready':
        return (
          <View style={{ gap: 8 }}>
            <Text style={st.small}>Start from a ready-made explorer, then change anything you like.</Text>
            <View style={st.wrap}>
              {L.PRESETS.map((p) => (
                <Pressable key={p.name} accessibilityRole="button" onPress={() => set(p.look)} style={st.chip}>
                  <Text style={st.chipText}>{p.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      case 'body':
        return (
          <View style={{ gap: 10 }}>
            <Chips opts={L.BUILDS} value={look.build} on={(build) => set({ build })} />
            <Swatches label="Skin tone" list={L.SKIN} value={look.skin} on={(skin) => set({ skin })} />
          </View>
        );
      case 'hair':
        return (
          <View style={{ gap: 10 }}>
            <Chips opts={L.HAIRS} value={look.hair} on={(hair) => set({ hair })} />
            <Swatches label="Hair colour" list={L.HAIR_COLORS} value={look.hairColor} on={(hairColor) => set({ hairColor })} />
            {look.head === 'hijab' && <Text style={st.small}>The hijab covers the hair.</Text>}
          </View>
        );
      case 'face':
        return (
          <View style={{ gap: 10 }}>
            <Text style={st.small}>Face shape</Text>
            <Chips opts={L.FACE_SHAPES} value={look.faceShape} on={(faceShape) => set({ faceShape })} />
            <Text style={st.small}>Eyes</Text>
            <Chips opts={L.EYE_SHAPES} value={look.eyeShape} on={(eyeShape) => set({ eyeShape })} />
            <Swatches label="Eye colour" list={L.EYES} value={look.eyes} on={(eyes) => set({ eyes })} />
            <Text style={st.small}>Eyebrows</Text>
            <Chips opts={L.BROWS} value={look.brows} on={(brows) => set({ brows })} />
            <View style={st.wrap}>
              {(
                [
                  ['freckles', 'Freckles'],
                  ['blush', 'Rosy cheeks'],
                ] as const
              ).map(([k, t]) => (
                <Pressable key={k} accessibilityRole="switch" accessibilityState={{ checked: look[k] }} onPress={() => set({ [k]: !look[k] })} style={[st.chip, look[k] && st.chipOn]}>
                  <Text style={[st.chipText, look[k] && st.chipTextOn]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      case 'clothes':
        return (
          <View style={{ gap: 10 }}>
            <Chips opts={L.TOPS} value={look.top} on={(top) => set({ top })} />
            <Swatches label="Top colour" list={L.CLOTH} value={look.topColor} on={(topColor) => set({ topColor })} />
            <Chips opts={L.PATTERNS} value={look.pattern} on={(pattern) => set({ pattern })} />
            <Chips opts={L.BOTTOMS} value={look.bottom} on={(bottom) => set({ bottom })} />
            <Swatches label="Trousers or skirt colour" list={L.CLOTH} value={look.bottomColor} on={(bottomColor) => set({ bottomColor })} />
            <Text style={st.label}>Outer layer</Text>
            <Chips opts={L.OUTERS} value={look.outer} on={(outer) => set({ outer })} />
            {look.outer !== 'none' && <Swatches label="Outer layer colour" list={L.CLOTH} value={look.outerColor} on={(outerColor) => set({ outerColor })} />}
          </View>
        );
      case 'head':
        return (
          <View style={{ gap: 10 }}>
            <Chips opts={L.HEADS} value={look.head} on={(head) => set({ head })} />
            {look.head !== 'none' && <Swatches label="Colour" list={L.CLOTH} value={look.headColor} on={(headColor) => set({ headColor })} />}
          </View>
        );
      case 'feet':
        return (
          <View style={{ gap: 10 }}>
            <Chips opts={L.SHOES} value={look.shoes} on={(shoes) => set({ shoes })} />
            <Swatches label="Colour" list={L.CLOTH} value={look.shoesColor} on={(shoesColor) => set({ shoesColor })} />
          </View>
        );
      case 'bags':
        return (
          <View style={{ gap: 10 }}>
            <Chips opts={L.PACKS} value={look.pack} on={(pack) => set({ pack })} />
            {look.pack !== 'none' && <Swatches label="Bag colour" list={L.CLOTH} value={look.packColor} on={(packColor) => set({ packColor })} />}
            <View style={st.wrap}>
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: look.glasses }} onPress={() => set({ glasses: !look.glasses })} style={[st.chip, look.glasses && st.chipOn]}>
                <Text style={[st.chipText, look.glasses && st.chipTextOn]}>Glasses</Text>
              </Pressable>
              <Pressable accessibilityRole="switch" accessibilityState={{ checked: look.hairClip }} onPress={() => set({ hairClip: !look.hairClip })} style={[st.chip, look.hairClip && st.chipOn]}>
                <Text style={[st.chipText, look.hairClip && st.chipTextOn]}>Hair clip</Text>
              </Pressable>
            </View>
          </View>
        );
      case 'name':
        return (
          <View style={{ gap: 8 }}>
            <Text style={st.small}>Pick a nickname, not your real name. Letters and numbers, up to 16.</Text>
            <TextInput accessibilityLabel="Nickname" value={nick} onChangeText={(t) => (setNick(t.slice(0, 16)), setSaved(null))} maxLength={16} style={st.input} />
            <Pressable accessibilityRole="button" onPress={() => (setNick(suggestNick()), setSaved(null))} style={st.chip}>
              <Text style={st.chipText}>Make one up for me</Text>
            </Pressable>
          </View>
        );
    }
  })();
  const panel = (
    <View style={[st.panel, wide ? { width: 400 } : { flex: 1 }]}>
      <View style={st.head}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/adventure' as never))} style={st.ghostSm}>
          <Text style={st.ghostText}>‹ Back</Text>
        </Pressable>
        <Text style={[st.h1, { flex: 1 }]}>Dressing room</Text>
        <Pressable accessibilityRole="button" onPress={() => setWho((w) => !w)} style={st.ghostSm}>
          <Text style={st.ghostText}>{who ? 'Dress up' : 'Explorers'}</Text>
        </Pressable>
      </View>
      {!who && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }} style={{ flexGrow: 0 }}>
          {TABS.map(([k, t]) => (
            <Pressable key={k} accessibilityRole="tab" accessibilityState={{ selected: k === tab }} onPress={() => setTab(k)} style={[st.tab, k === tab && st.tabOn]}>
              <Text style={[st.tabText, k === tab && { color: '#fff' }]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
        {body}
      </ScrollView>
      {!who && (
        <View style={{ gap: 6 }}>
          {!!saved && <Text style={[st.small, { color: colors.greenDeep }]}>{saved}</Text>}
          <View style={st.wrap}>
            <Pressable accessibilityRole="button" disabled={!dirty} onPress={save} style={[st.btn, !dirty && { opacity: 0.5 }]}>
              <Text style={st.btnText}>{dirty ? `Save ${nick || 'explorer'}` : 'Saved'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => (setLook(me.look), setNick(me.nickname), setSaved(null))} style={st.ghost}>
              <Text style={st.ghostText}>Undo changes</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
  return <View style={[st.root, { flexDirection: wide ? 'row' : 'column' }]}>{wide ? [<View key="s" style={{ flex: 1 }}>{scene}</View>, <View key="p">{panel}</View>] : [<View key="s">{scene}</View>, <View key="p" style={{ flex: 1 }}>{panel}</View>]}</View>;
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  overlay: { position: 'absolute', left: 8, right: 8, bottom: 8, gap: 6 },
  panel: { padding: 14, gap: 8, backgroundColor: colors.card, borderLeftWidth: 1, borderColor: colors.line, height: '100%' as never },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  h1: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  chipOn: { backgroundColor: colors.greenDeep, borderColor: colors.greenDeep },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  chipTextOn: { color: '#fff' },
  sw: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  swOn: { borderColor: colors.ink, transform: [{ scale: 1.15 }] },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: colors.paperDeep },
  tabOn: { backgroundColor: colors.terracotta },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  tool: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(255,251,242,0.92)', borderWidth: 1, borderColor: colors.line },
  toolOn: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
  toolText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  btn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 20, backgroundColor: colors.terracotta },
  btnSm: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.terracotta },
  danger: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 20, backgroundColor: '#9a3a2a' },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
  ghost: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.line, alignSelf: 'flex-start' },
  ghostSm: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  ghostText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.line },
  rowOn: { borderColor: colors.green, backgroundColor: colors.explanation },
  dot: { width: 22, height: 22, borderRadius: 11 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 10, fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, backgroundColor: '#fff' },
});
