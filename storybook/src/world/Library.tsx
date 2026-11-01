// The library hall: all 114 surahs as books shown cover-out on a ring of
// shelves around a domed room. Drag to turn, tap a book to take it down.
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { surahs, toArabicDigits } from '@/content/quran';
import { canvas, noiseField, plasterTexture, toTexture, woodTexture } from '@/three/textures';
import { fonts } from '@/theme';

export const COLS = 19;
export const ROWS = 6;
const R = 4.4;
const ROW_Y = (r: number) => 3.35 - r * 0.56;
const BOOK_W = 0.34;
const BOOK_H = 0.44;
const CELL_W = 200;
const CELL_H = 256;

/** Twenty bays round the hall: bay 0 is the doorway, bays 1 to 19 hold the books. */
const BAYS = COLS + 1;
const bayAngle = (bay: number) => (bay / BAYS) * Math.PI * 2;
/** The look direction that faces the column holding surah n. */
export const yawOfSurah = (n: number) => bayAngle(((n - 1) % COLS) + 1);
const slot = (n: number) => ({ col: (n - 1) % COLS, row: Math.floor((n - 1) / COLS) });

/** One texture with every cover, drawn from the verified surah names. */
function coverAtlas() {
  const [c, ctx] = canvas(CELL_W * COLS, CELL_H * ROWS);
  surahs.forEach((s) => {
    const { col, row } = slot(s.number);
    const x = col * CELL_W;
    const y = row * CELL_H;
    const hue = [150, 25, 205, 345, 95, 265][row];
    ctx.fillStyle = `hsl(${hue}, 24%, 20%)`;
    ctx.fillRect(x, y, CELL_W, CELL_H);
    ctx.strokeStyle = 'rgba(214, 178, 106, 0.85)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 12, y + 12, CELL_W - 24, CELL_H - 24);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 19, y + 19, CELL_W - 38, CELL_H - 38);
    ctx.fillStyle = '#e8cf95';
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    ctx.font = `30px ${fonts.quran}`;
    ctx.fillText(toArabicDigits(s.number), x + CELL_W / 2, y + 62);
    let size = 40;
    ctx.font = `${size}px ${fonts.quran}`;
    while (ctx.measureText(s.nameArabic).width > CELL_W - 44 && size > 22) {
      size -= 2;
      ctx.font = `${size}px ${fonts.quran}`;
    }
    ctx.fillText(s.nameArabic, x + CELL_W / 2, y + 132);
    ctx.direction = 'ltr';
    ctx.fillStyle = '#d9c39a';
    let t = 17;
    ctx.font = `600 ${t}px ${fonts.body}`;
    while (ctx.measureText(s.nameTransliterated).width > CELL_W - 44 && t > 11) {
      t -= 1;
      ctx.font = `600 ${t}px ${fonts.body}`;
    }
    ctx.fillText(s.nameTransliterated, x + CELL_W / 2, y + 182);
    ctx.font = `14px ${fonts.body}`;
    ctx.fillStyle = 'rgba(217, 195, 154, 0.8)';
    ctx.fillText(`${s.number} · ${s.ayahCount} ayahs`, x + CELL_W / 2, y + 212);
  });
  noiseField(ctx, CELL_W * COLS, CELL_H * ROWS, 5, 0.05, 4, '0,0,0', '255,240,210');
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 8;
  return t;
}

function marbleTexture() {
  const [c, ctx] = canvas(1024, 1024);
  ctx.fillStyle = '#d8cdb8';
  ctx.fillRect(0, 0, 1024, 1024);
  // Concentric inlay rings and a star at the centre, in a darker stone.
  ctx.save();
  ctx.translate(512, 512);
  ctx.strokeStyle = 'rgba(92, 70, 48, 0.55)';
  for (const r of [120, 180, 460, 500]) {
    ctx.lineWidth = r > 400 ? 10 : 6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(120, 88, 52, 0.4)';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 60 : 118;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  noiseField(ctx, 1024, 1024, 31, 0.07, 30, '90,70,50', '250,245,230');
  noiseField(ctx, 1024, 1024, 32, 0.05, 3);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** A pointed arch, centred on its base line's middle, `h` tall. */
function archShape(halfW: number, h: number, inset = 0) {
  const w = halfW - inset;
  const spring = h * 0.62;
  const s = new THREE.Shape();
  s.moveTo(-w, -h / 2 + inset);
  s.lineTo(w, -h / 2 + inset);
  s.lineTo(w, -h / 2 + spring);
  s.quadraticCurveTo(w, h / 2 - inset - 0.25, 0, h / 2 - inset);
  s.quadraticCurveTo(-w, h / 2 - inset - 0.25, -w, -h / 2 + spring);
  s.lineTo(-w, -h / 2 + inset);
  return s;
}

function archFrame(halfW: number, h: number, t: number) {
  const outer = archShape(halfW + t, h + t * 2);
  outer.holes.push(archShape(halfW, h) as unknown as THREE.Path);
  return outer;
}

export function Library({
  selected,
  onSelect,
  onDoor,
  look,
  shadows = false,
}: {
  shadows?: boolean;
  selected: number | null;
  onSelect: (n: number) => void;
  onDoor: () => void;
  look: { yaw: number; pitch: number };
}) {
  const atlas = useMemo(() => coverAtlas(), []);
  const wood = useMemo(() => woodTexture(9, '#5a3820', '#2e1a0c', 2), []);
  const plaster = useMemo(() => plasterTexture(), []);
  const marble = useMemo(() => marbleTexture(), []);
  const covers = useMemo(
    () =>
      surahs.map((s) => {
        const { col, row } = slot(s.number);
        const t = atlas.clone();
        t.repeat.set(1 / COLS, 1 / ROWS);
        t.offset.set(col / COLS, 1 - (row + 1) / ROWS);
        t.needsUpdate = true;
        return t;
      }),
    [atlas],
  );
  const bookRefs = useRef<(THREE.Group | null)[]>([]);
  const { camera } = useThree();

  useFrame((_, dt) => {
    // The chosen book slides out of its shelf; the others settle back.
    bookRefs.current.forEach((g, i) => {
      if (!g) return;
      const target = selected === i + 1 ? 0.42 : 0;
      g.position.z += (target - g.position.z) * Math.min(1, dt * 6);
    });
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(0, 1.62, 0);
    const dir = new THREE.Vector3(Math.sin(look.yaw) * Math.cos(look.pitch), Math.sin(look.pitch), -Math.cos(look.yaw) * Math.cos(look.pitch));
    cam.lookAt(cam.position.clone().add(dir));
  });

  const tap = (n: number) => (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8) return;
    e.stopPropagation();
    onSelect(n);
  };

  return (
    <group>
      <hemisphereLight intensity={0.35} color="#ffe9c8" groundColor="#3a2a1c" />
      <pointLight position={[0, 6.4, 0]} intensity={40} distance={14} decay={1.6} color="#ffe2b0" castShadow={shadows} shadow-mapSize={[1024, 1024]} />
      {/* Floor and walls */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[R + 0.6, 96]} />
        <meshPhysicalMaterial map={marble} roughness={0.22} clearcoat={0.6} clearcoatRoughness={0.25} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[R + 0.6, R + 0.6, 4.8, 96, 1, true]} />
        <meshStandardMaterial map={plaster} side={THREE.BackSide} roughness={0.95} />
      </mesh>
      {/* Dome with an open oculus */}
      <mesh position={[0, 4.8, 0]}>
        <sphereGeometry args={[R + 0.6, 64, 24, 0, Math.PI * 2, 0.12, Math.PI / 2 - 0.12]} />
        <meshStandardMaterial map={plaster} side={THREE.BackSide} roughness={0.95} color="#d8c7a8" />
      </mesh>
      <mesh position={[0, 4.8 + (R + 0.6) * Math.cos(0.12) - 0.02, 0]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[(R + 0.6) * Math.sin(0.12), 32]} />
        <meshBasicMaterial color="#fff4dc" />
      </mesh>
      {/* A soft beam of light from the oculus to the floor */}
      <mesh position={[0, 3.3, 0]}>
        <cylinderGeometry args={[0.55, 1.2, 6.6, 32, 1, true]} />
        <meshBasicMaterial color="#ffe7b8" transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Shelves: a column of six books for each of nineteen bays */}
      {Array.from({ length: COLS }, (_, col) => {
        const a = bayAngle(col + 1);
        return (
          <group key={col} rotation-y={-a}>
            <group position={[0, 0, -R]}>
              {Array.from({ length: ROWS }, (_, row) => (
                <mesh key={row} position={[0, ROW_Y(row) - BOOK_H / 2 - 0.03, 0.06]} castShadow receiveShadow>
                  <boxGeometry args={[1.18, 0.04, 0.36]} />
                  <meshStandardMaterial map={wood} roughness={0.6} />
                </mesh>
              ))}
              <mesh position={[0, 1.85, -0.16]} receiveShadow>
                <boxGeometry args={[1.22, 3.7, 0.06]} />
                <meshStandardMaterial map={wood} roughness={0.7} color="#8a6a50" />
              </mesh>
            </group>
            {/* Pillar between bays */}
            <group rotation-y={-Math.PI / BAYS}>
              <mesh position={[0, 2.2, -R + 0.05]} castShadow>
                <cylinderGeometry args={[0.08, 0.1, 4.4, 16]} />
                <meshStandardMaterial map={wood} roughness={0.5} color="#a07850" />
              </mesh>
            </group>
          </group>
        );
      })}
      {surahs.map((s, i) => {
        const { col, row } = slot(s.number);
        const a = bayAngle(col + 1);
        return (
          <group key={s.number} rotation-y={-a}>
            <group position={[0, ROW_Y(row), -R + 0.12]}>
              <group ref={(g) => (bookRefs.current[i] = g)} onClick={tap(s.number)}>
                <mesh castShadow>
                  <boxGeometry args={[BOOK_W, BOOK_H, 0.05]} />
                  <meshStandardMaterial color="#3a2a1c" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0, 0.0251]}>
                  <planeGeometry args={[BOOK_W, BOOK_H]} />
                  <meshStandardMaterial
                    map={covers[i]}
                    roughness={0.55}
                    metalness={0.05}
                    emissive={selected === s.number ? '#a8742a' : '#000000'}
                    emissiveIntensity={selected === s.number ? 0.35 : 0}
                  />
                </mesh>
              </group>
            </group>
          </group>
        );
      })}

      {/* Bay 0: a pointed-arch doorway, lit from the reading room beyond */}
      <group position={[0, 0, -R - 0.5]} onClick={(e) => (e.delta > 8 ? null : (e.stopPropagation(), onDoor()))}>
        <mesh position={[0, 1.25, 0]}>
          <shapeGeometry args={[archShape(0.62, 2.5)]} />
          <meshBasicMaterial color="#ffd49a" />
        </mesh>
        <mesh position={[0, 1.25, 0.02]}>
          <shapeGeometry args={[archFrame(0.62, 2.5, 0.08)]} />
          <meshStandardMaterial map={wood} roughness={0.5} color="#b08860" />
        </mesh>
      </group>
    </group>
  );
}

/** Drag to turn on the spot; the look is held in a plain object the parent owns. */
export function useDragLook(look: { yaw: number; pitch: number }, opts: { pitch: [number, number]; yaw?: [number, number] }) {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    let last: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => (last = { x: e.clientX, y: e.clientY });
    const move = (e: PointerEvent) => {
      if (!last) return;
      // Drag the view like a photo sphere: pull left to turn right.
      look.yaw -= (e.clientX - last.x) * 0.005;
      look.pitch = THREE.MathUtils.clamp(look.pitch + (e.clientY - last.y) * 0.004, opts.pitch[0], opts.pitch[1]);
      if (opts.yaw) look.yaw = THREE.MathUtils.clamp(look.yaw, opts.yaw[0], opts.yaw[1]);
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => (last = null);
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.style.touchAction = 'none';
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [gl, look, opts.pitch, opts.yaw]);
}
