// The Admin Studio's 3D world editor. It draws the world with the game's own
// land, sky, trees, rocks and buildings (so the art direction is exactly the
// game's), lets staff select pieces in 3D and move, turn and resize them
// with gizmos or numbers, duplicate, hide and recolour them, add pieces from
// the library, move the player's start, show the collision space, and run
// the game's own collision checks. Every change is a draft edit (undo, redo,
// autosave); nothing reaches players until it is reviewed and published.
import { OrbitControls, TransformControls } from '@react-three/drei';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as THREE from 'three';
import type { Structure, StructureType } from '@/adventure/kit';
import { StructureView } from '@/adventure/kit';
import { placeLand } from '@/adventure/land';
import { FarLand, GroundMesh, Lighting, Mountains, Sky, StillWater, Trees, type Placed, type SceneQuality } from '@/adventure/Scenery';
import { makeSpace } from '@/adventure/space';
import { makeTerrain, type Terrain } from '@/adventure/terrain';
import type { WorldDef } from '@/adventure/types';
import { WORLDS } from '@/adventure/worlds';
import { rockGeometry } from '@/ark/Scenery';
import { stoneTexture } from '@/ark/paint';
import { ColliderView } from '@/physics/DebugView';
import { loadPhysics, physicsReady, type Space } from '@/physics/space';
import { validateSpace, type Report } from '@/physics/validate';
import { SoftShapes } from '@/three/soft';
import { useStudio } from './context';
import { quranIndex } from './facts';
import { applyOverlay, validateOverlay, type Overlay, type PlacedEdit } from './overlay';
import { has, recordTest, fileBug } from './session';
import { Btn, C, Note, Pill, s } from './ui';
import { useDraft } from './useDraft';

const Q: SceneQuality = { grass: 0, segments: 160, shadows: false, shadowMap: 1024 };
const deg = (r: number) => Math.round((r * 180) / Math.PI);
const rad = (d: number) => (d * Math.PI) / 180;

/** The asset library: pieces the game already knows how to draw, in its own style. */
export const LIBRARY: { cat: string; items: { type: StructureType | 'rock'; label: string; w?: number; d?: number; h?: number }[] }[] = [
  { cat: 'Rocks and mountains', items: [{ type: 'rock', label: 'Rock' }, { type: 'cliff', label: 'Cliff face', w: 8, d: 4, h: 5 }, { type: 'stones', label: 'Stone pile' }] },
  { cat: 'Buildings', items: [{ type: 'house', label: 'House' }, { type: 'dome', label: 'Domed house' }, { type: 'tower', label: 'Tower', w: 3, d: 3 }, { type: 'columns', label: 'Columns' }, { type: 'terrace', label: 'Terrace' }, { type: 'wall', label: 'Wall' }] },
  { cat: 'Doors and gates', items: [{ type: 'gate', label: 'Gate' }, { type: 'arch', label: 'Arch' }] },
  { cat: 'Bridges and paths', items: [{ type: 'bridge', label: 'Bridge' }, { type: 'dock', label: 'Dock' }] },
  { cat: 'Water features', items: [{ type: 'well', label: 'Well' }, { type: 'pool', label: 'Pool' }] },
  { cat: 'Furniture', items: [{ type: 'table', label: 'Table' }, { type: 'bench', label: 'Bench' }, { type: 'bed', label: 'Bed' }, { type: 'rug', label: 'Rug' }] },
  { cat: 'Market and camp', items: [{ type: 'stall', label: 'Market stall' }, { type: 'tent', label: 'Tent' }, { type: 'cart', label: 'Cart' }, { type: 'pen', label: 'Animal pen' }, { type: 'fence', label: 'Fence' }] },
  { cat: 'Decorations', items: [{ type: 'festoon', label: 'Lantern string' }, { type: 'boat', label: 'Boat' }] },
];
/** Colours that belong to the worlds' palette (earth, clay, sea, olive, sand, plaster). */
export const COLORS = ['#ecd8b6', '#d6c4a2', '#c9a77a', '#b0603a', '#8a5a34', '#5a3a22', '#3f8a8c', '#6f8f6a', '#9a8f80', '#e2cf9c', '#c59b44', '#f4efe4'];
const SEGMENTS = new Set(['wall', 'fence', 'bridge', 'dock', 'festoon']);

type Sel = { kind: 'structure'; id: string } | { kind: 'rock'; key: string } | { kind: 'tree'; key: string } | { kind: 'start' } | null;
type Entry = { id: string; base: number | null; s: Structure; hidden: boolean };

/** Every structure with its edits applied, hidden ones included, keyed s<index> or a<index> (added). */
function entries(base: WorldDef, doc: Overlay): Entry[] {
  const set = doc.set ?? {};
  const out: Entry[] = base.structures.map((st, i) => {
    const e: any = { ...st };
    for (const [k, v] of Object.entries(set)) {
      const m = k.match(new RegExp(`^structures\\.${i}\\.([a-z]+)$`, 'i'));
      if (m) e[m[1]] = v;
    }
    return { id: `s${i}`, base: i, s: e, hidden: !!e.hidden };
  });
  (doc.add?.structures ?? []).forEach((st, i) => out.push({ id: `a${i}`, base: null, s: st, hidden: !!(st as any).hidden }));
  return out;
}

function useLand(def: WorldDef) {
  return useMemo(() => {
    const t = makeTerrain(def.ground);
    const placed = placeLand(def, t, () => false);
    return { t, placed };
  }, [def]);
}

function RockMesh({ k, t, selected, onSelect, objRef }: { k: Placed['rocks'][number]; t: Terrain; selected: boolean; onSelect: () => void; objRef?: (o: THREE.Object3D | null) => void }) {
  const geo = useMemo(() => rockGeometry(k.v + 1), [k.v]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, map: stoneTexture(), roughness: 0.92, color: selected ? '#ffe9a8' : '#ffffff', emissive: selected ? '#6a4a00' : '#000000' }), [selected]);
  return (
    <mesh
      ref={objRef as any}
      geometry={geo}
      material={mat}
      position={[k.x, t.y(k.x, k.z) + k.s * k.sy * 0.15, k.z]}
      rotation={[0, k.rot, 0]}
      scale={[k.s, k.s * k.sy, k.s]}
      onClick={(e: ThreeEvent<MouseEvent>) => (e.stopPropagation(), onSelect())}
      userData={{ editorKey: k.key }}
    />
  );
}

export default function WorldEditor({ n }: { n: number }) {
  const base = WORLDS[n];
  const { who } = useStudio();
  const scope = `surah:${n}`;
  const ed = useDraft(scope);
  const canEdit = has(who, 'world_editor');
  const def = useMemo(() => applyOverlay(base, ed.doc).def, [base, ed.doc]);
  const { t, placed } = useLand(def);
  const list = useMemo(() => entries(base, ed.doc), [base, ed.doc]);
  const [sel, setSel] = useState<Sel>(null);
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  const [show, setShow] = useState({ colliders: false, spawn: true, paths: false, edge: true, hidden: true });
  const [obj, setObj] = useState<THREE.Object3D | null>(null);
  const orbit = useRef<any>(null);
  const [phys, setPhys] = useState(!!physicsReady());
  const [report, setReport] = useState<Report | null>(null);
  const [msg, setMsg] = useState<{ tone: 'good' | 'bad' | 'warn'; text: string } | null>(null);
  useEffect(() => {
    if (!phys) loadPhysics().then(() => setPhys(true));
  }, [phys]);
  const space = useMemo<Space | null>(() => (phys ? makeSpace(physicsReady()!, t) : null), [phys, t]);
  const problems = useMemo(() => validateOverlay(base, ed.doc, quranIndex), [base, ed.doc]);
  const errors = problems.filter((p) => p.level === 'error');
  // An edit invalidates the last collision test.
  useEffect(() => setReport(null), [ed.doc]);

  /* ---- edits ---- */
  const setStruct = (en: Entry, patch: Partial<Structure> & { hidden?: boolean }) =>
    ed.change((d) => {
      if (en.base == null) {
        const i = Number(en.id.slice(1));
        const adds = (d.add?.structures ?? []).slice();
        adds[i] = { ...adds[i], ...patch } as Structure;
        return { ...d, add: { ...(d.add ?? {}), structures: adds } };
      }
      const set = { ...(d.set ?? {}) };
      const orig: any = base.structures[en.base];
      for (const [k, v] of Object.entries(patch)) {
        const key = `structures.${en.base}.${k}`;
        if (JSON.stringify(orig[k]) === JSON.stringify(v) || (k === 'hidden' && !v && orig.hidden == null)) delete set[key];
        else set[key] = v as any;
      }
      return { ...d, set };
    });
  const setPlaced = (kind: 'rocks' | 'trees', key: string, patch: PlacedEdit | null) =>
    ed.change((d) => {
      if (key.startsWith('add:')) {
        const i = Number(key.slice(4));
        const adds = (d.add?.rocks ?? []).slice();
        if (patch?.hidden) adds.splice(i, 1);
        else adds[i] = { ...adds[i], ...(patch as any) };
        return { ...d, add: { ...(d.add ?? {}), rocks: adds } };
      }
      const m = { ...(d.place?.[kind] ?? {}) };
      if (patch == null) delete m[key];
      else m[key] = { ...(m[key] ?? {}), ...patch };
      return { ...d, place: { ...(d.place ?? {}), [kind]: m } };
    });
  const setStart = (x: number, z: number) => ed.setField('start', [+x.toFixed(2), +z.toFixed(2)], base.start);

  const selEntry = sel?.kind === 'structure' ? list.find((e) => e.id === sel.id) : undefined;
  const selRock = sel?.kind === 'rock' ? placed.rocks.find((r) => r.key === sel.key) : undefined;
  const selTree = sel?.kind === 'tree' ? placed.trees.find((r: any) => r.key === sel.key) : undefined;

  /** Gizmo finished a drag: write the object's new transform into the draft. */
  const commit = () => {
    if (!obj || !sel) return;
    const p = obj.position;
    const x = +p.x.toFixed(2);
    const z = +p.z.toFixed(2);
    if (sel.kind === 'start') return setStart(x, z);
    if (sel.kind === 'rock' && selRock) {
      const sc = +(obj.scale.x).toFixed(2);
      return setPlaced('rocks', sel.key, { x, z, rot: +obj.rotation.y.toFixed(3), s: Math.min(6, Math.max(0.1, sc)) });
    }
    if (sel.kind === 'tree' && selTree) return setPlaced('trees', sel.key, { x, z, s: +Math.min(3, Math.max(0.3, obj.scale.x * (selTree as any).size)).toFixed(2) });
    if (selEntry) {
      const st = selEntry.s;
      const patch: any = { x, z };
      if (SEGMENTS.has(st.type) && st.to) patch.to = [+(st.to[0] + x - st.x).toFixed(2), +(st.to[1] + z - st.z).toFixed(2)];
      if (!SEGMENTS.has(st.type)) patch.rot = +obj.rotation.y.toFixed(3);
      if (mode === 'scale') {
        patch.w = +((st.w ?? 6) * obj.scale.x).toFixed(2);
        patch.d = +((st.d ?? 5) * obj.scale.z).toFixed(2);
        if (st.h != null || obj.scale.y !== 1) patch.h = +((st.h ?? 3) * obj.scale.y).toFixed(2);
      }
      // The group sits at height 0; a vertical drag lifts the piece above its ground height.
      if (Math.abs(p.y) > 0.05 && mode === 'translate') patch.y = +((st.y ?? t.y(st.x, st.z)) + p.y).toFixed(2);
      setStruct(selEntry, patch);
    }
  };

  const duplicate = () => {
    if (selEntry) ed.change((d) => ({ ...d, add: { ...(d.add ?? {}), structures: [...(d.add?.structures ?? []), { ...selEntry.s, hidden: undefined, x: selEntry.s.x + 3, z: selEntry.s.z + 3, ...(selEntry.s.to ? { to: [selEntry.s.to[0] + 3, selEntry.s.to[1] + 3] as [number, number] } : {}) } as Structure] } }));
    if (selRock) ed.change((d) => ({ ...d, add: { ...(d.add ?? {}), rocks: [...(d.add?.rocks ?? []), { x: selRock.x + 2, z: selRock.z + 2, s: selRock.s, rot: selRock.rot }] } }));
  };
  const hideSel = () => {
    if (selEntry) (selEntry.base == null ? ed.change((d) => ({ ...d, add: { ...(d.add ?? {}), structures: (d.add?.structures ?? []).filter((_, i) => `a${i}` !== selEntry.id) } })) : setStruct(selEntry, { hidden: true }));
    if (sel?.kind === 'rock') setPlaced('rocks', sel.key, { hidden: true });
    if (sel?.kind === 'tree') setPlaced('trees', sel.key, { hidden: true });
    setSel(null);
  };
  const focus = (): [number, number] => {
    const tg = orbit.current?.target as THREE.Vector3 | undefined;
    return tg ? [+tg.x.toFixed(1), +tg.z.toFixed(1)] : [def.start[0], def.start[1] - 8];
  };
  const addAsset = (it: (typeof LIBRARY)[number]['items'][number]) => {
    const [x, z] = focus();
    if (it.type === 'rock') {
      ed.change((d) => ({ ...d, add: { ...(d.add ?? {}), rocks: [...(d.add?.rocks ?? []), { x, z, s: 1.2, rot: 0 }] } }));
      setSel({ kind: 'rock', key: `add:${ed.doc.add?.rocks?.length ?? 0}` });
      return;
    }
    const st: Structure = { type: it.type, x, z, rot: 0, ...(it.w ? { w: it.w } : {}), ...(it.d ? { d: it.d } : {}), ...(it.h ? { h: it.h } : {}), ...(SEGMENTS.has(it.type) ? { to: [x + 6, z] as [number, number] } : {}) };
    ed.change((d) => ({ ...d, add: { ...(d.add ?? {}), structures: [...(d.add?.structures ?? []), st] } }));
    setSel({ kind: 'structure', id: `a${ed.doc.add?.structures?.length ?? 0}` });
  };

  /* ---- checks ---- */
  const runCollision = async () => {
    if (!space) return;
    const spawn = space.findOpen(def.start[0], def.start[1], 0.35);
    const zones = def.tasks.flatMap((tk: any) => [
      ...(tk.at && Array.isArray(tk.at) ? [{ key: tk.id, x: tk.at[0], z: tk.at[1], reach: 3 }] : []),
      ...((tk.points ?? []) as any[]).map((p, i) => ({ key: `${tk.id}#${i}`, x: p.at[0], z: p.at[1], reach: 2.5 })),
    ]);
    const r = validateSpace(space, { spawn: (spawn ?? def.start) as [number, number], radius: t.radius, paths: (def.ground.paths ?? []) as [number, number][][], zones });
    setReport(r);
    const sum = `spawn ${r.spawn.ok ? 'ok' : 'blocked'}; solids entered ${r.solids.entered.length}/${r.solids.tested}; climbable cliffs ${r.slopes.climbs.length}; edge escapes ${r.edge.escaped.length}; paths stuck ${r.paths.stuck.length}/${r.paths.tested}; unreachable spots ${r.zones.unreachable.length}/${r.zones.tested}`;
    try {
      await recordTest({ scope, kind: 'collision', ok: r.ok, summary: `World editor draft: ${sum}`, report: { ...r, source: 'world editor (terrain, buildings, rocks, trees; activity props are checked in the full play-test run)' } });
      setMsg({ tone: r.ok ? 'good' : 'bad', text: `${r.ok ? 'Collision test passed' : 'Collision test found problems'} and was recorded: ${sum}` });
    } catch (e: any) {
      setMsg({ tone: r.ok ? 'good' : 'bad', text: `${r.ok ? 'Passed' : 'Problems'}: ${sum} (not recorded: ${e.message})` });
    }
  };
  const reportBug = async () => {
    try {
      const id = await fileBug({
        surah: n,
        title: `World editor: ${sel ? `problem at ${selEntry?.s.type ?? sel.kind}` : 'world problem'}`,
        object: selEntry ? `${selEntry.s.type} ${selEntry.id}` : sel?.kind === 'rock' ? `rock ${sel.key}` : '',
        scene: def.name,
        category: report && !report.ok ? 'collision' : 'other',
        severity: 'medium',
        device: { ua: navigator.userAgent, screen: `${screen.width}x${screen.height}` },
        diagnostics: { draftEdits: Object.keys(ed.doc.set ?? {}).length, selection: sel, lastCollisionTest: report },
      } as any);
      setMsg({ tone: 'good', text: `Bug ${id} filed with the current selection and the last collision test attached.` });
    } catch (e: any) {
      setMsg({ tone: 'bad', text: e.message });
    }
  };

  // Test hook for the studio's browser tests (staff page only).
  useEffect(() => {
    (globalThis as any).__studioEditor = { list, placed, sel, select: setSel, commitAt: (x: number, z: number) => obj && (obj.position.set(x, t.y(x, z), z), commit()), runCollision, doc: ed.doc, state: ed.state };
  });

  const selLabel = selEntry ? `${selEntry.s.type}${selEntry.base == null ? ' (added)' : ''}` : sel?.kind === 'rock' ? `rock${sel.key.startsWith('add:') ? ' (added)' : ''}` : sel?.kind === 'tree' ? `${(selTree as any)?.kind ?? ''} tree` : sel?.kind === 'start' ? 'player start' : '';
  const num = (label: string, v: number, set: (x: number) => void, testID?: string) => (
    <View style={{ width: 86 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput testID={testID} editable={canEdit} defaultValue={String(v)} key={`${label}${v}`} onEndEditing={(e) => Number.isFinite(+e.nativeEvent.text) && set(+e.nativeEvent.text)} onSubmitEditing={(e) => Number.isFinite(+e.nativeEvent.text) && set(+e.nativeEvent.text)} style={s.input} keyboardType="numeric" />
    </View>
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row', minHeight: '100%' as any }}>
      <View style={{ flex: 1, backgroundColor: '#9fb7c9' }}>
        <Canvas camera={{ fov: 50, near: 0.1, far: 3000, position: [0, def.ground.radius * 0.85, def.ground.radius * 0.7] }} onPointerMissed={() => setSel(null)} style={{ position: 'absolute', inset: 0 } as never}>
          <SoftShapes />
          <Sky look={def.look} />
          <Lighting q={Q} look={def.look} />
          <GroundMesh t={t} q={Q} />
          <Trees t={t} placed={placed} q={Q} />
          {t.water != null && <StillWater t={t} look={def.look} />}
          <FarLand t={t} tint={def.far} />
          <Mountains color={def.mountains?.color} height={def.mountains?.height} seed={def.seed} />
          {placed.rocks.map((k) => (
            <RockMesh key={k.key} k={k} t={t} selected={sel?.kind === 'rock' && sel.key === k.key} onSelect={() => setSel({ kind: 'rock', key: k.key! })} objRef={sel?.kind === 'rock' && sel.key === k.key ? setObj : undefined} />
          ))}
          {/* Trees are picked by an invisible post around the trunk. */}
          {placed.trees
            .filter((k: any) => Math.hypot(k.x, k.z) < t.radius)
            .map((k: any) => (
              <mesh key={k.key} ref={sel?.kind === 'tree' && sel.key === k.key ? (setObj as any) : undefined} position={[k.x, t.y(k.x, k.z) + 1.5, k.z]} onClick={(e) => (e.stopPropagation(), setSel({ kind: 'tree', key: k.key }))}>
                <cylinderGeometry args={[0.6 * k.size, 0.6 * k.size, 3, 8]} />
                <meshBasicMaterial color="#ffd36a" transparent opacity={sel?.kind === 'tree' && sel.key === k.key ? 0.45 : 0} depthWrite={false} />
              </mesh>
            ))}
          {list.map((en) =>
            en.hidden && !show.hidden ? null : (
              <group
                key={en.id}
                ref={sel?.kind === 'structure' && sel.id === en.id ? (setObj as any) : undefined}
                position={[en.s.x, 0, en.s.z]}
                rotation={[0, SEGMENTS.has(en.s.type) ? 0 : en.s.rot ?? 0, 0]}
                onClick={(e) => (e.stopPropagation(), setSel({ kind: 'structure', id: en.id }))}
              >
                {/* Drawn at the origin of this group so the gizmo moves it as one piece. */}
                <group position={[-en.s.x, 0, -en.s.z]} rotation={[0, 0, 0]}>
                  <group visible={!en.hidden}>
                    <StructureView s={{ ...en.s, rot: SEGMENTS.has(en.s.type) ? en.s.rot : 0, x: en.s.x, z: en.s.z }} t={t} isOn={() => false} />
                  </group>
                  {en.hidden ? (
                    <mesh position={[en.s.x, t.y(en.s.x, en.s.z) + 1, en.s.z]}>
                      <boxGeometry args={[en.s.w ?? 3, 2, en.s.d ?? 3]} />
                      <meshBasicMaterial color="#888" wireframe />
                    </mesh>
                  ) : null}
                  {sel?.kind === 'structure' && sel.id === en.id ? (
                    <mesh position={[en.s.x, t.y(en.s.x, en.s.z) + 0.05, en.s.z]} rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[Math.max(en.s.w ?? 3, en.s.d ?? 3) * 0.6, Math.max(en.s.w ?? 3, en.s.d ?? 3) * 0.6 + 0.3, 48]} />
                      <meshBasicMaterial color="#ffd36a" />
                    </mesh>
                  ) : null}
                </group>
              </group>
            ),
          )}
          {show.spawn ? (
            <group ref={sel?.kind === 'start' ? (setObj as any) : undefined} position={[def.start[0], t.y(def.start[0], def.start[1]), def.start[1]]} onClick={(e) => (e.stopPropagation(), setSel({ kind: 'start' }))}>
              <mesh position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.35, 1.1, 6, 12]} />
                <meshStandardMaterial color="#4fd1c5" emissive="#0b5" emissiveIntensity={0.4} />
              </mesh>
              <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.6, 0.85, 32]} />
                <meshBasicMaterial color="#4fd1c5" />
              </mesh>
            </group>
          ) : null}
          {show.edge ? (
            <mesh position={[0, (t.water ?? 0) + 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[t.radius - 0.15, t.radius + 0.15, 128]} />
              <meshBasicMaterial color="#ff5a5a" transparent opacity={0.8} />
            </mesh>
          ) : null}
          {show.paths
            ? (def.ground.paths ?? []).map((p: any, i: number) => (
                <line key={i}>
                  <bufferGeometry attach="geometry" onUpdate={(g) => g.setFromPoints((p as [number, number][]).map(([x, z]) => new THREE.Vector3(x, t.y(x, z) + 0.3, z)))} />
                  <lineBasicMaterial attach="material" color="#ffef5a" />
                </line>
              ))
            : null}
          {show.colliders && space ? <ColliderView space={space} spawn={def.start} /> : null}
          {obj && sel && canEdit ? (
            <TransformControls object={obj} mode={sel.kind === 'start' || sel.kind === 'tree' ? (mode === 'scale' && sel.kind === 'tree' ? 'scale' : 'translate') : mode} showY={sel.kind === 'structure' && mode !== 'rotate'} showX={mode !== 'rotate'} showZ={mode !== 'rotate'} onMouseUp={commit} />
          ) : null}
          <OrbitControls ref={orbit} makeDefault target={[0, 0, 0]} maxPolarAngle={1.45} />
        </Canvas>
        <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6, flexWrap: 'wrap', maxWidth: 640 }}>
          {(['translate', 'rotate', 'scale'] as const).map((m) => (
            <Btn key={m} small label={{ translate: 'Move (W)', rotate: 'Turn (E)', scale: 'Resize (R)' }[m]} kind={mode === m ? 'primary' : 'plain'} onPress={() => setMode(m)} testID={`mode-${m}`} />
          ))}
          {(Object.keys(show) as (keyof typeof show)[]).map((k) => (
            <Btn key={k} small label={`${show[k] ? '☑' : '☐'} ${{ colliders: 'Collision shapes', spawn: 'Player start', paths: 'Paths', edge: 'World edge', hidden: 'Hidden pieces' }[k]}`} onPress={() => setShow({ ...show, [k]: !show[k] })} testID={`show-${k}`} />
          ))}
        </View>
      </View>

      <ScrollView style={{ width: 340, maxWidth: 340, backgroundColor: C.panel, borderLeftWidth: 1, borderColor: C.line }} contentContainerStyle={{ padding: 14, paddingBottom: 60 }}>
        <Text style={s.h2}>{def.name}</Text>
        <Text style={[s.small, { marginBottom: 8 }]} testID="editor-state">
          {{ loading: 'Loading…', saved: ed.hasDraft ? 'Draft saved' : 'No draft yet', unsaved: 'Unsaved (autosaving)', saving: 'Saving…', error: `Not saved: ${ed.error}`, conflict: 'Someone else saved; reload' }[ed.state]}
        </Text>
        {!canEdit ? <Note tone="warn">You can look around, but only World Editors can change the world.</Note> : null}
        <View style={[s.row, { marginBottom: 10 }]}>
          <Btn small label="Undo" onPress={ed.undo} disabled={!ed.canUndo} testID="w-undo" />
          <Btn small label="Redo" onPress={ed.redo} disabled={!ed.canRedo} testID="w-redo" />
          <Btn small label="Save now" onPress={ed.save} disabled={ed.state !== 'unsaved'} testID="w-save" />
          <Btn small label="Play test" onPress={() => window.open(`/adventure/${n}?studio=draft`, '_blank')} />
        </View>

        <Text style={s.h3}>Selected</Text>
        {!sel ? <Text style={[s.small, { marginBottom: 10 }]}>Click a building, rock, tree or the player start in the world.</Text> : null}
        {sel ? (
          <View style={{ marginBottom: 12 }} testID="selection">
            <View style={[s.row, { marginBottom: 6 }]}>
              <Pill text={selLabel} tone="accent" />
              {selEntry?.hidden ? <Pill text="hidden" tone="warn" /> : null}
            </View>
            {sel.kind === 'start' ? (
              <View style={s.row}>
                {num('x', def.start[0], (v) => setStart(v, def.start[1]), 'num-x')}
                {num('z', def.start[1], (v) => setStart(def.start[0], v), 'num-z')}
              </View>
            ) : null}
            {selRock ? (
              <View style={s.row}>
                {num('x', +selRock.x.toFixed(2), (v) => setPlaced('rocks', sel!.kind === 'rock' ? sel.key : '', { x: v, z: selRock.z }), 'num-x')}
                {num('z', +selRock.z.toFixed(2), (v) => setPlaced('rocks', (sel as any).key, { x: selRock.x, z: v }), 'num-z')}
                {num('turn °', deg(selRock.rot), (v) => setPlaced('rocks', (sel as any).key, { rot: rad(v) }))}
                {num('size', +selRock.s.toFixed(2), (v) => setPlaced('rocks', (sel as any).key, { s: v }))}
              </View>
            ) : null}
            {selTree ? (
              <View style={s.row}>
                {num('x', +selTree.x.toFixed(2), (v) => setPlaced('trees', (sel as any).key, { x: v, z: selTree.z }))}
                {num('z', +selTree.z.toFixed(2), (v) => setPlaced('trees', (sel as any).key, { x: selTree.x, z: v }))}
                {num('size', +(selTree as any).size.toFixed(2), (v) => setPlaced('trees', (sel as any).key, { s: v }))}
              </View>
            ) : null}
            {selEntry ? (
              <View>
                <View style={s.row}>
                  {num('x', selEntry.s.x, (v) => setStruct(selEntry, { x: v, ...(selEntry.s.to ? { to: [selEntry.s.to[0] + v - selEntry.s.x, selEntry.s.to[1]] as [number, number] } : {}) }), 'num-x')}
                  {num('z', selEntry.s.z, (v) => setStruct(selEntry, { z: v, ...(selEntry.s.to ? { to: [selEntry.s.to[0], selEntry.s.to[1] + v - selEntry.s.z] as [number, number] } : {}) }), 'num-z')}
                  {num('height y', selEntry.s.y ?? +t.y(selEntry.s.x, selEntry.s.z).toFixed(2), (v) => setStruct(selEntry, { y: v }))}
                  {!SEGMENTS.has(selEntry.s.type) ? num('turn °', deg(selEntry.s.rot ?? 0), (v) => setStruct(selEntry, { rot: rad(v) })) : null}
                  {num('width', selEntry.s.w ?? 6, (v) => setStruct(selEntry, { w: v }))}
                  {num('depth', selEntry.s.d ?? 5, (v) => setStruct(selEntry, { d: v }))}
                </View>
                <Text style={[s.label, { marginTop: 4 }]}>Colour (world palette)</Text>
                <View style={[s.row, { gap: 4 }]}>
                  {COLORS.map((c) => (
                    <Pressable key={c} onPress={() => canEdit && setStruct(selEntry, { color: c })} accessibilityLabel={`Colour ${c}`} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, borderWidth: selEntry.s.color === c ? 3 : 1, borderColor: selEntry.s.color === c ? C.ink : C.line }} />
                  ))}
                </View>
              </View>
            ) : null}
            <View style={[s.row, { marginTop: 10 }]}>
              {selEntry || selRock ? <Btn small label="Duplicate" onPress={duplicate} disabled={!canEdit} testID="duplicate" /> : null}
              {selEntry?.hidden ? <Btn small label="Show again" onPress={() => setStruct(selEntry, { hidden: false })} disabled={!canEdit} /> : null}
              {sel.kind !== 'start' && !selEntry?.hidden ? <Btn small kind="danger" label={selEntry?.base == null && selEntry ? 'Delete' : 'Hide (delete)'} onPress={hideSel} disabled={!canEdit} testID="hide" /> : null}
            </View>
          </View>
        ) : null}

        <Text style={s.h3}>Asset library</Text>
        <Text style={[s.small, { marginBottom: 6 }]}>Pieces the game draws in its own style. New pieces appear where the camera looks.</Text>
        {LIBRARY.map((c) => (
          <View key={c.cat} style={{ marginBottom: 6 }}>
            <Text style={s.label}>{c.cat}</Text>
            <View style={[s.row, { gap: 4 }]}>
              {c.items.map((it) => (
                <Btn key={it.label} small label={it.label} onPress={() => addAsset(it)} disabled={!canEdit} testID={`add-${it.type}`} />
              ))}
            </View>
          </View>
        ))}
        <Text style={[s.small, { marginBottom: 12 }]}>Trees can be moved, resized and hidden; adding new trees and animals needs developer work for now.</Text>

        <Text style={s.h3}>Checks</Text>
        <View style={[s.row, { marginBottom: 6 }]}>
          <Btn small kind="primary" label="Run collision test" onPress={runCollision} disabled={!space} testID="collision-test" />
          <Btn small label="Report a bug here" onPress={reportBug} />
        </View>
        {report ? (
          <View style={{ marginBottom: 8 }} testID="collision-report">
            <Pill text={report.ok ? 'collision test passed' : 'collision problems'} tone={report.ok ? 'good' : 'bad'} />
            <Text style={s.small}>Start: {report.spawn.ok ? 'open ground' : 'blocked'}</Text>
            <Text style={s.small}>Solids walked into: {report.solids.entered.length} of {report.solids.tested}</Text>
            <Text style={s.small}>Cliffs that could be climbed: {report.slopes.climbs.length}</Text>
            <Text style={s.small}>Ways off the world's edge: {report.edge.escaped.length}</Text>
            <Text style={s.small}>Paths blocked: {report.paths.stuck.length} of {report.paths.tested}</Text>
            <Text style={s.small}>Activity spots out of reach: {report.zones.unreachable.length} of {report.zones.tested}</Text>
            {report.solids.entered.slice(0, 4).map((e, i) => (
              <Text key={i} style={[s.small, { color: C.bad }]}>walked into {e.tag} at {e.x}, {e.z}</Text>
            ))}
            {report.zones.unreachable.slice(0, 4).map((e, i) => (
              <Text key={i} style={[s.small, { color: C.bad }]}>cannot reach {e.key} at {e.x}, {e.z}</Text>
            ))}
          </View>
        ) : (
          <Text style={[s.small, { marginBottom: 8 }]}>The test uses the game's own physics (Rapier) on this draft. Run it after changes; reviewers see the result.</Text>
        )}
        {errors.map((p, i) => (
          <Text key={i} style={[s.small, { color: C.bad }]}>
            {p.key}: {p.message}
          </Text>
        ))}
        {msg ? <Note tone={msg.tone}>{msg.text}</Note> : null}
        <Text style={[s.small, { marginTop: 8 }]}>Submit the draft for review from the surah's Story tab or Versions tab. The game's activity props (lanterns, animals) are checked in the full play test.</Text>
      </ScrollView>
    </View>
  );
}
