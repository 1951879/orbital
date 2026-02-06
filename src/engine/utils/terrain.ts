
import { TerrainParams } from '../../types';

// --- Fast Simplex Noise Implementation ---
export class SimplexNoise {
  private p: Uint8Array;
  private perm: Uint8Array;
  private permMod12: Uint8Array;
  private grad3: Float32Array;

  constructor(seed: number = 0) {
    const LCG = (s: number) => () => {
      s = Math.imul(1664525, s) + 1013904223 | 0;
      return ((s >>> 0) / 4294967296);
    };
    const random = LCG(seed);

    this.grad3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
      1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
      0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);
    this.p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) this.p[i] = i;
    for (let i = 0; i < 255; i++) {
      const r = i + ~~(random() * (256 - i));
      const aux = this.p[i];
      this.p[i] = this.p[r];
      this.p[r] = aux;
    }

    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  noise3D(xin: number, yin: number, zin: number) {
    const permMod12 = this.permMod12;
    const perm = this.perm;
    const grad3 = this.grad3;
    let n0, n1, n2, n3;
    const F3 = 1.0 / 3.0;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const G3 = 1.0 / 6.0;
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;
    const z0 = zin - Z0;
    let i1, j1, k1;
    let i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
    const t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0.0;
    else {
      const t02 = t0 * t0;
      n0 = t02 * t02 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
    }

    const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
    const t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0.0;
    else {
      const t12 = t1 * t1;
      n1 = t12 * t12 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
    }

    const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
    const t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0.0;
    else {
      const t22 = t2 * t2;
      n2 = t22 * t22 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
    }

    const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
    const t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0.0;
    else {
      const t32 = t3 * t3;
      n3 = t32 * t32 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
    }
    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

// Calculate the height offset (elevation) at a specific 3D coordinate on the unit sphere
export const getTerrainElevation = (
  x: number,
  y: number,
  z: number,
  simplex: SimplexNoise,
  params: TerrainParams
) => {
  // Replicates the noise math from BlueprintSphere exactly
  const baseFreq = 0.012 * params.mountainFrequency;

  // Domain Warping
  const wx = simplex.noise3D(x * 0.005, y * 0.005, z * 0.005) * 20.0;
  const wy = simplex.noise3D(y * 0.005, z * 0.005, x * 0.005) * 20.0;
  const wz = simplex.noise3D(z * 0.005, x * 0.005, y * 0.005) * 20.0;

  let macro = simplex.noise3D((x + wx) * baseFreq, (y + wy) * baseFreq, (z + wz) * baseFreq);
  let mask = macro;
  let ridges = 0;
  let amp = 0.8;
  let freq = 1.8;

  for (let i = 0; i < 4; i++) {
    const nx = (x + wx) * baseFreq * freq;
    const ny = (y + wy) * baseFreq * freq;
    const nz = (z + wz) * baseFreq * freq;

    let n = simplex.noise3D(nx, ny, nz);
    n = 1.0 - Math.abs(n);
    n = n * n;

    ridges += n * amp;
    amp *= 0.5;
    freq *= 2.0;
  }

  const mountainInfluence = Math.max(0, mask + 0.1);
  let finalH = macro + (ridges * 2.0 * mountainInfluence);
  finalH *= 3.5 * params.mountainScale;

  const coverageShift = (0.45 - params.waterLevel) * 15.0;
  let h = finalH + coverageShift;

  // Ocean Floor Smoothing
  if (h < 0) h *= 0.4;

  return h;
};
