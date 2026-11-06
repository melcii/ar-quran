// Quality tiers for the 3D world. 'auto' picks a tier from the device and the
// world steps down a tier if the frame rate stays low.
export type QualityTier = 'low' | 'medium' | 'high';
export type Quality = {
  tier: QualityTier;
  dpr: [number, number];
  shadows: boolean;
  shadowMap: number;
  terrainSegments: number;
  /** Multiplier on plant and particle counts. */
  vegetation: number;
  post: boolean;
};

export const QUALITY: Record<QualityTier, Quality> = {
  low: { tier: 'low', dpr: [0.75, 1], shadows: false, shadowMap: 512, terrainSegments: 90, vegetation: 0.35, post: false },
  medium: { tier: 'medium', dpr: [1, 1.5], shadows: true, shadowMap: 1024, terrainSegments: 140, vegetation: 0.7, post: true },
  high: { tier: 'high', dpr: [1, 2], shadows: true, shadowMap: 2048, terrainSegments: 200, vegetation: 1, post: true },
};

export function guessTier(): QualityTier {
  if (typeof navigator === 'undefined') return 'medium';
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 500;
  if (cores <= 4 || mem <= 2) return 'low';
  if (small || cores <= 6 || mem <= 4) return 'medium';
  return 'high';
}

export const lowerTier = (t: QualityTier): QualityTier => (t === 'high' ? 'medium' : 'low');
