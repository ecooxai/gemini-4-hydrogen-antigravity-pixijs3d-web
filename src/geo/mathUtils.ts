import { Vector3 } from '@pixi/3d';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function v3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Evaluates a cubic Bezier curve at parameter t in [0, 1]. */
export function cubicBezier3(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, t: number): Vec3 {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    z: uuu * p0.z + 3 * uu * t * p1.z + 3 * u * tt * p2.z + ttt * p3.z,
  };
}

/** Evaluates a Catmull-Rom spline through pts at global t in [0, 1]. */
export function catmullRom3(pts: Vec3[], t: number): Vec3 {
  const n = pts.length;
  if (n === 0) return { x: 0, y: 0, z: 0 };
  if (n === 1) return { ...pts[0] };
  const scaled = clamp(t, 0, 1) * (n - 1);
  const i = Math.min(Math.floor(scaled), n - 2);
  const lt = scaled - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(n - 1, i + 2)];
  const t2 = lt * lt;
  const t3 = t2 * lt;
  const evalComp = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * lt + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return {
    x: evalComp(p0.x, p1.x, p2.x, p3.x),
    y: evalComp(p0.y, p1.y, p2.y, p3.y),
    z: evalComp(p0.z, p1.z, p2.z, p3.z),
  };
}

/** Computes smooth vertex normals from indexed triangle soup. */
export function computeSmoothNormals(positions: Float32Array, indices: Uint16Array | Uint32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const ab = new Vector3();
  const ac = new Vector3();
  const n = new Vector3();

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;
    a.set(positions[i0], positions[i0 + 1], positions[i0 + 2]);
    b.set(positions[i1], positions[i1 + 1], positions[i1 + 2]);
    c.set(positions[i2], positions[i2 + 1], positions[i2 + 2]);
    b.subtract(a, ab);
    c.subtract(a, ac);
    ab.cross(ac, n); // area-weighted face normal
    normals[i0] += n.x;
    normals[i0 + 1] += n.y;
    normals[i0 + 2] += n.z;
    normals[i1] += n.x;
    normals[i1 + 1] += n.y;
    normals[i1 + 2] += n.z;
    normals[i2] += n.x;
    normals[i2 + 1] += n.y;
    normals[i2 + 2] += n.z;
  }

  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
    if (len > 1e-8) {
      normals[i] /= len;
      normals[i + 1] /= len;
      normals[i + 2] /= len;
    } else {
      normals[i] = 0;
      normals[i + 1] = 1;
      normals[i + 2] = 0;
    }
  }
  return normals;
}
