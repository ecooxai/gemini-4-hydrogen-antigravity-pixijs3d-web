import { Geometry3D } from '@pixi/3d';
import { catmullRom3, computeSmoothNormals, lerp, type Vec3 } from './mathUtils';

export interface LoftRing {
  center: Vec3;
  rx: number;
  rz: number;
  /** Optional local X-axis / Z-axis tilt around center (radians). */
  tiltX?: number;
  tiltZ?: number;
  /** Superellipse exponent (2 = ellipse, >2 = squircle). Default 2. */
  power?: number;
  /** Optional radial modulation function given angle theta in [0, 2*PI). */
  modulate?: (theta: number) => number;
  /** Optional vertical Y-offset modulation function given angle theta in [0, 2*PI). */
  offsetY?: (theta: number) => number;
}

export interface LoftOptions {
  radialSegments?: number;
  capStart?: boolean;
  capEnd?: boolean;
  uRepeat?: number;
  vRepeat?: number;
}

/**
 * Builds a smooth lofted 3D surface from ordered cross-section rings.
 * Rings generally progress from bottom (-Y) to top (+Y) or root to tip.
 */
export function buildLoftGeometry(rings: LoftRing[], options: LoftOptions = {}): Geometry3D {
  const segs = options.radialSegments ?? 28;
  const capStart = options.capStart ?? true;
  const capEnd = options.capEnd ?? true;
  const uRepeat = options.uRepeat ?? 1;
  const vRepeat = options.vRepeat ?? 1;

  const ringCount = rings.length;
  const cols = segs + 1;

  const posList: number[] = [];
  const uvList: number[] = [];
  const idxList: number[] = [];

  for (let r = 0; r < ringCount; r++) {
    const ring = rings[r];
    const v = (r / Math.max(1, ringCount - 1)) * vRepeat;
    const p = ring.power ?? 2;
    const cosTx = Math.cos(ring.tiltX ?? 0);
    const sinTx = Math.sin(ring.tiltX ?? 0);
    const cosTz = Math.cos(ring.tiltZ ?? 0);
    const sinTz = Math.sin(ring.tiltZ ?? 0);

    for (let s = 0; s <= segs; s++) {
      const uFrac = s / segs;
      const theta = uFrac * Math.PI * 2;
      const ct = Math.cos(theta);
      const st = Math.sin(theta);

      let lx: number;
      let lz: number;
      if (p === 2) {
        lx = ring.rx * ct;
        lz = ring.rz * st;
      } else {
        const exp = 2 / p;
        lx = ring.rx * Math.sign(ct) * Math.pow(Math.abs(ct), exp);
        lz = ring.rz * Math.sign(st) * Math.pow(Math.abs(st), exp);
      }

      if (ring.modulate) {
        const m = ring.modulate(theta);
        lx *= m;
        lz *= m;
      }

      const ly = ring.offsetY ? ring.offsetY(theta) : 0;

      // Apply tiltX then tiltZ around local ring origin
      const y1 = ly * cosTx - lz * sinTx;
      const z1 = ly * sinTx + lz * cosTx;
      const x2 = lx * cosTz - y1 * sinTz;
      const y2 = lx * sinTz + y1 * cosTz;

      posList.push(ring.center.x + x2, ring.center.y + y2, ring.center.z + z1);
      uvList.push(uFrac * uRepeat, v);
    }
  }

  for (let r = 0; r < ringCount - 1; r++) {
    for (let s = 0; s < segs; s++) {
      const a = r * cols + s;
      const b = a + 1;
      const c = (r + 1) * cols + s;
      const d = c + 1;
      // Counter-clockwise when viewed from outside (+radial)
      idxList.push(a, c, b, b, c, d);
    }
  }

  if (capStart && ringCount > 0) {
    const first = rings[0];
    const centerIdx = posList.length / 3;
    posList.push(first.center.x, first.center.y, first.center.z);
    uvList.push(0.5 * uRepeat, 0);
    for (let s = 0; s < segs; s++) {
      idxList.push(centerIdx, s, s + 1);
    }
  }

  if (capEnd && ringCount > 0) {
    const last = rings[ringCount - 1];
    const base = (ringCount - 1) * cols;
    const centerIdx = posList.length / 3;
    posList.push(last.center.x, last.center.y, last.center.z);
    uvList.push(0.5 * uRepeat, vRepeat);
    for (let s = 0; s < segs; s++) {
      idxList.push(centerIdx, base + s + 1, base + s);
    }
  }

  const positions = new Float32Array(posList);
  const uvs = new Float32Array(uvList);
  const indices = positions.length / 3 > 65535 ? new Uint32Array(idxList) : new Uint16Array(idxList);
  const normals = computeSmoothNormals(positions, indices);

  return new Geometry3D({ positions, normals, uvs, indices });
}

export interface StrandOptions {
  /** Control points along the center spine of the hair strand/ribbon. */
  points: Vec3[];
  /** Number of lengthwise subdivisions. */
  segments?: number;
  /** Cross-section resolution around the diamond/lens shape (4 = crisp diamond lock, 8 = smooth bevel). */
  crossSegments?: number;
  /** Half-width function for t in [0, 1]. */
  width: (t: number) => number;
  /** Half-thickness function for t in [0, 1]. */
  thickness: (t: number) => number;
  /** Optional twist angle in radians along t. */
  twist?: (t: number) => number;
  /** Upward / outward reference hint so ribbons face cleanly. */
  normalHint?: Vec3;
}

/**
 * Sweeps a tapered sculpted ribbon/hair-lock along a Catmull-Rom curve.
 * Uses a lens/diamond cross-section with a subtle center ridge for anime hair crispness.
 */
export function buildHairStrandGeometry(opts: StrandOptions): Geometry3D {
  const segs = opts.segments ?? 20;
  const cSegs = opts.crossSegments ?? 8;
  const cols = cSegs + 1;
  const hint = opts.normalHint ?? { x: 0, y: 0, z: 1 };

  const posList: number[] = [];
  const uvList: number[] = [];
  const idxList: number[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = catmullRom3(opts.points, t);
    const pNext = catmullRom3(opts.points, Math.min(1, t + 0.01));
    const pPrev = catmullRom3(opts.points, Math.max(0, t - 0.01));
    let tx = pNext.x - pPrev.x;
    let ty = pNext.y - pPrev.y;
    let tz = pNext.z - pPrev.z;
    const tLen = Math.hypot(tx, ty, tz) || 1;
    tx /= tLen;
    ty /= tLen;
    tz /= tLen;

    // Binormal = normalize(tangent x hint), fallback if parallel
    let bx = ty * hint.z - tz * hint.y;
    let by = tz * hint.x - tx * hint.z;
    let bz = tx * hint.y - ty * hint.x;
    let bLen = Math.hypot(bx, by, bz);
    if (bLen < 1e-4) {
      bx = ty * 0 - tz * 1;
      by = tz * 0 - tx * 0;
      bz = tx * 1 - ty * 0;
      bLen = Math.hypot(bx, by, bz) || 1;
    }
    bx /= bLen;
    by /= bLen;
    bz /= bLen;

    // Normal = binormal x tangent
    const nx = by * tz - bz * ty;
    const ny = bz * tx - bx * tz;
    const nz = bx * ty - by * tx;

    const twist = opts.twist ? opts.twist(t) : 0;
    const ct = Math.cos(twist);
    const st = Math.sin(twist);
    // Rotated basis vectors in the cross-section plane
    const ux = bx * ct + nx * st;
    const uy = by * ct + ny * st;
    const uz = bz * ct + nz * st;
    const vx = -bx * st + nx * ct;
    const vy = -by * st + ny * ct;
    const vz = -bz * st + nz * ct;

    const w = Math.max(0.0005, opts.width(t));
    const th = Math.max(0.0005, opts.thickness(t));

    for (let j = 0; j <= cSegs; j++) {
      const a = (j / cSegs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      // Slight pinched lens cross-section (sharp edges, gentle crest at front/back)
      const rx = ca * w;
      const ry = Math.sign(sa) * Math.pow(Math.abs(sa), 0.78) * th;

      posList.push(p.x + ux * rx + vx * ry, p.y + uy * rx + vy * ry, p.z + uz * rx + vz * ry);
      uvList.push(j / cSegs, t);
    }
  }

  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < cSegs; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = (i + 1) * cols + j;
      const d = c + 1;
      idxList.push(a, c, b, b, c, d);
    }
  }

  const positions = new Float32Array(posList);
  const uvs = new Float32Array(uvList);
  const indices = new Uint16Array(idxList);
  const normals = computeSmoothNormals(positions, indices);
  return new Geometry3D({ positions, normals, uvs, indices });
}

export interface HeadSculptOptions {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
}

/**
 * Builds a sculpted anime head geometry with tapered jaw/chin, subtle cheek fullness,
 * slightly flattened face plane, tiny sculpted anime nose tip, and clean front-facing UVs.
 */
export function buildSculptedHeadGeometry(opts: HeadSculptOptions = {}): Geometry3D {
  const R = opts.radius ?? 0.138;
  const wSegs = opts.widthSegments ?? 56;
  const hSegs = opts.heightSegments ?? 44;

  const cols = wSegs + 1;
  const vertCount = (hSegs + 1) * cols;
  const positions = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const indices = new Uint16Array(hSegs * wSegs * 6);

  for (let iy = 0, v = 0; iy <= hSegs; iy++) {
    const phi = (iy / hSegs) * Math.PI; // 0 = top (+Y), PI = bottom (-Y)
    const sinP = Math.sin(phi);
    const cosP = Math.cos(phi);

    for (let ix = 0; ix <= wSegs; ix++, v++) {
      // theta = 0 at +Z (front of face), +PI/2 at +X, -PI/2 at -X, +-PI at -Z (back)
      const uFrac = ix / wSegs;
      const theta = (uFrac - 0.5) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      let x = R * sinP * sinT;
      let y = R * cosP * 1.07; // slightly taller oval
      let z = R * sinP * cosT;

      // Sculpt anime face proportions
      const yn = y / R; // roughly [-1.07, +1.07]
      const frontMask = Math.max(0, cosT);

      // Taper jaw and chin smoothly below eye level (graceful delicate anime jawline & soft V-chin)
      if (yn < 0.04) {
        const jawT = Math.min(1, (0.04 - yn) / 1.11);
        const taper = 1 - 0.36 * Math.pow(jawT, 1.4);
        x *= taper;
        z *= 1 - 0.26 * Math.pow(jawT, 1.48);
        z += frontMask * 0.008 * Math.sin(jawT * Math.PI);
        // Gentle chin lift so the jawline ends cleanly
        if (jawT > 0.6) {
          y += 0.017 * Math.pow((jawT - 0.6) / 0.4, 1.35);
        }
      }

      // Soft rounded anime cheek fullness around yn in [-0.36, -0.04]
      const cheekY = Math.exp(-Math.pow((yn + 0.18) / 0.22, 2));
      const cheekSide = Math.exp(-Math.pow((Math.abs(theta) - 0.62) / 0.42, 2));
      const cheekBulge = 0.011 * cheekY * cheekSide;
      x += Math.sign(x) * cheekBulge;
      z += frontMask * cheekBulge * 0.55;

      // Slightly flatten front eye/forehead plane so anime eyes sit cleanly
      if (frontMask > 0.35 && yn > -0.35 && yn < 0.55) {
        const flatMask = Math.pow((frontMask - 0.35) / 0.65, 1.3);
        z -= flatMask * 0.011;
      }

      // Delicate anime nose bump centered at theta=0, yn=-0.16
      const noseTheta = Math.exp(-Math.pow(theta / 0.12, 2));
      const noseY = Math.exp(-Math.pow((yn + 0.16) / 0.12, 2));
      z += noseTheta * noseY * 0.011;

      // Back cranium fullness so side/back profiles look natural
      if (cosT < 0) {
        z += cosT * 0.018 * sinP;
      }

      positions.set([x, y, z], v * 3);

      // Cylindrical/planar hybrid UV for crisp front face painting
      const u = 0.5 + theta / (Math.PI * 2);
      const vCoord = iy / hSegs;
      uvs.set([u, vCoord], v * 2);
    }
  }

  for (let iy = 0, i = 0; iy < hSegs; iy++) {
    for (let ix = 0; ix < wSegs; ix++) {
      const a = iy * cols + ix;
      const b = a + cols;
      const c = a + 1;
      const d = b + 1;
      indices.set([a, b, c, c, b, d], i);
      i += 6;
    }
  }

  const normals = computeSmoothNormals(positions, indices);
  return new Geometry3D({ positions, normals, uvs, indices });
}

export interface PillowOptions {
  width?: number;
  height?: number;
  thickness?: number;
  segX?: number;
  segY?: number;
}

/**
 * Builds a plump 3D pillow held from its top-left corner (local (-w/2, +h/2)),
 * with gravity sag, radial fabric folds radiating from the pinched corner, and sewn edge flange.
 */
export function buildPillowGeometry(opts: PillowOptions = {}): Geometry3D {
  const W = opts.width ?? 0.52;
  const H = opts.height ?? 0.56;
  const T = opts.thickness ?? 0.14;
  const nx = opts.segX ?? 34;
  const ny = opts.segY ?? 36;

  // Build closed double-sided cushion by mapping a grid on front & back connected along perimeter
  const cols = nx + 1;
  const rows = ny + 1;
  const halfVerts = cols * rows;
  const totalVerts = halfVerts * 2;
  const positions = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint16Array(nx * ny * 12);

  // Pinched corner in normalized [-1, 1] coords: (-1, +1) -> top-left in local pillow space
  const pinchU = -0.92;
  const pinchV = 0.94;

  for (let side = 0; side < 2; side++) {
    const signZ = side === 0 ? 1 : -1;
    const vOffset = side * halfVerts;

    for (let iy = 0; iy <= ny; iy++) {
      const v01 = iy / ny; // 0 = bottom, 1 = top
      const vNorm = v01 * 2 - 1; // [-1, 1]

      for (let ix = 0; ix <= nx; ix++) {
        const u01 = ix / nx; // 0 = left, 1 = right
        const uNorm = u01 * 2 - 1; // [-1, 1]

        // Distance from edge (0 on border, 1 in center)
        const edgeX = 1 - Math.pow(Math.abs(uNorm), 2.4);
        const edgeY = 1 - Math.pow(Math.abs(vNorm), 2.4);
        const puff = Math.max(0, edgeX * edgeY);

        // Distance & angle from the pinched hand-held corner
        const du = uNorm - pinchU;
        const dv = vNorm - pinchV;
        const distPinch = Math.hypot(du, dv);
        const anglePinch = Math.atan2(dv, du);

        // Pinched corner pulls inward sharply at hand grip and radiates realistic cloth folds
        const pinchFactor = Math.exp(-distPinch * 3.8);
        const foldWave =
          (Math.sin(anglePinch * 6.0 + distPinch * 3.4) * 0.028 +
            Math.cos(anglePinch * 11.0 - distPinch * 2.4) * 0.011) *
          Math.exp(-distPinch * 0.9) *
          (1 - pinchFactor * 0.65);

        // Soft rounded corners + natural weighted gravity sag from lifted top-left peak
        const cornerRound = 1 - 0.18 * Math.pow(Math.abs(uNorm * vNorm), 2.2);
        const droop = Math.max(0, (1 - v01) * 0.038) + Math.max(0, u01 * (1 - v01)) * 0.032;

        let x = uNorm * W * 0.5 * cornerRound * (1 - 0.26 * pinchFactor) + (uNorm > 0 ? 0.014 * (1 - v01) : 0);
        let y = vNorm * H * 0.5 * cornerRound * (1 - 0.08 * pinchFactor) - droop;

        const isBorder = ix === 0 || ix === nx || iy === 0 || iy === ny;
        const borderFlare = isBorder ? 0 : 1;

        // Plump soft cushion Z bulge + crisp sewn outer flange seam + radial pinch creases
        const baseZ = Math.pow(puff, 0.52) * (T * 0.52) * (1 - 0.88 * pinchFactor) * borderFlare;
        const z = signZ * (baseZ + foldWave * (side === 0 ? 1 : -0.75) + (isBorder ? 0.0025 : 0));

        const edgePinch = 1 - 0.045 * (1 - Math.abs(uNorm * vNorm));
        x *= edgePinch;
        y *= edgePinch;

        const idx = vOffset + iy * cols + ix;
        positions.set([x, y, z], idx * 3);
        uvs.set([u01, v01], idx * 2);
      }
    }
  }

  let ptr = 0;
  // Front (+Z) triangles
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = iy * cols + ix;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.set([a, b, c, b, d, c], ptr);
      ptr += 6;
    }
  }
  // Back (-Z) triangles (reversed winding)
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = halfVerts + iy * cols + ix;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.set([a, c, b, b, c, d], ptr);
      ptr += 6;
    }
  }

  const normals = computeSmoothNormals(positions, indices);
  return new Geometry3D({ positions, normals, uvs, indices });
}

/**
 * Builds a scalloped/ruffled ring cuff (for pajama sleeve cuffs & pajama shorts hems).
 */
export function buildScallopedCuffGeometry(opts: {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  waves: number;
  scallopDepth: number;
  petalDrop?: number;
  thickness?: number;
  radialSegments?: number;
}): Geometry3D {
  const segs = opts.radialSegments ?? 64;
  const th = opts.thickness ?? 0.008;
  const drop = opts.petalDrop ?? opts.height * 0.32;
  const rings: LoftRing[] = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // 0 = bottom (scalloped), 1 = top
    const baseY = (t - 0.5) * opts.height;
    const r = lerp(opts.radiusBottom, opts.radiusTop, t);
    const waveWeight = Math.pow(1 - t, 1.35);
    rings.push({
      center: { x: 0, y: baseY, z: 0 },
      rx: r,
      rz: r,
      modulate: (theta) => {
        const petal = Math.pow(Math.abs(Math.sin((theta * opts.waves) / 2)), 0.72);
        return 1 + opts.scallopDepth * petal * waveWeight + (i === 0 ? th * 0.2 : 0);
      },
      offsetY: (theta) => {
        const petal = Math.pow(Math.abs(Math.sin((theta * opts.waves) / 2)), 0.72);
        return -drop * petal * waveWeight;
      },
    });
  }
  return buildLoftGeometry(rings, { radialSegments: segs, capStart: false, capEnd: false });
}

/**
 * Builds a continuous curved anime back-hair sheet/mantle with layered lock tips at the bottom,
 * eliminating gaps while keeping a natural multi-strand silhouette from front, side, and back.
 */
export function buildHairCapeGeometry(opts: {
  widthSegs?: number;
  heightSegs?: number;
}): Geometry3D {
  const nx = opts.widthSegs ?? 44;
  const ny = opts.heightSegs ?? 28;
  const cols = nx + 1;
  const rows = ny + 1;

  // Build front & back faces of a thick tapered hair sheet
  const halfVerts = cols * rows;
  const positions = new Float32Array(halfVerts * 2 * 3);
  const uvs = new Float32Array(halfVerts * 2 * 2);
  const indices = new Uint16Array(nx * ny * 12);

  for (let side = 0; side < 2; side++) {
    const signThick = side === 0 ? 1 : -1; // 0 = outer (-Z), 1 = inner (+Z)
    const vOff = side * halfVerts;

    for (let iy = 0; iy <= ny; iy++) {
      const v01 = iy / ny; // 0 = crown/top, 1 = bottom tips
      for (let ix = 0; ix <= nx; ix++) {
        const u01 = ix / nx; // 0 = left (-X), 1 = right (+X)
        const s = (u01 - 0.5) * 2; // [-1, +1]

        // Wrap smoothly behind the cranial dome and shoulders, flaring wider below sleeve height
        const wrapAngle = s * Math.PI * (0.40 + 0.105 * Math.pow(v01, 1.3));
        const crownBlend = Math.sin(Math.min(1, v01 / 0.24) * (Math.PI * 0.5));
        const flareWidth = 0.124 * (0.9 + 0.1 * crownBlend) + 0.176 * Math.pow(v01, 1.32);
        const x = Math.sin(wrapAngle) * flareWidth + s * 0.028 * Math.pow(v01, 1.65);

        // Smooth organic layered anime lock-tip profile (broad graceful locks flaring at bottom)
        const lockWave =
          0.58 * Math.pow(Math.sin(s * Math.PI * 2.1) ** 2, 0.85) +
          0.42 * Math.pow(Math.cos(s * Math.PI * 3.1) ** 2, 0.9);
        const edgeLift = Math.pow(Math.abs(s), 1.55) * 0.145;
        const bottomY = 0.71 + edgeLift + lockWave * 0.038;
        const topY = 1.505 - Math.pow(Math.abs(s), 1.85) * 0.088;
        const y = lerp(topY, bottomY, v01);

        // Smooth S-curve cranial slope nested cleanly inside scalp crown without ridge or pinhole seam
        const crownCurveT = Math.min(1, v01 / 0.24);
        const crownSmooth = 0.5 - 0.5 * Math.cos(crownCurveT * Math.PI);
        const apexTuck = lerp(0.116, 0.144, crownSmooth);
        const backCurve = -Math.cos(wrapAngle) * (apexTuck + 0.01 * Math.sin(v01 * Math.PI));
        const shoulderPush = -0.024 * Math.sin(Math.min(1, v01 * 1.25) * Math.PI);
        const tipLiftZ = 0.028 * Math.pow(v01, 2.0);
        const halfThickness = 0.013 * (1 - 0.82 * Math.pow(v01, 1.5)) * (1 - 0.35 * Math.abs(s));

        // Outward normal direction for thickness offset
        const nxDir = Math.sin(wrapAngle);
        const nzDir = -Math.cos(wrapAngle);
        const z = backCurve + shoulderPush + tipLiftZ;

        const px = x + signThick * nxDir * halfThickness;
        const pz = z + signThick * nzDir * halfThickness;

        const idx = vOff + iy * cols + ix;
        positions.set([px, y, pz], idx * 3);
        uvs.set([u01 * 2.0, v01], idx * 2);
      }
    }
  }

  let ptr = 0;
  // Outer face (-Z): ix goes -X -> +X, iy goes +Y -> -Y
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = iy * cols + ix;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      // (b-a) is +X, (c-a) is -Y. +X x -Y = -Z (outward back!)
      indices.set([a, b, c, b, d, c], ptr);
      ptr += 6;
    }
  }
  // Inner face (+Z)
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const a = halfVerts + iy * cols + ix;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.set([a, c, b, b, c, d], ptr);
      ptr += 6;
    }
  }

  const normals = computeSmoothNormals(positions, indices);
  return new Geometry3D({ positions, normals, uvs, indices });
}

/**
 * Sweeps a circular/scalloped tube along a 3D spine using parallel-transport (Bishop) frames,
 * guaranteeing that sleeves and limbs NEVER collapse or pancake regardless of 3D orientation.
 */
export function buildSweepTubeGeometry(opts: {
  points: Vec3[];
  radius: (t: number) => number;
  radialSegments?: number;
  lengthSegments?: number;
  capStart?: boolean;
  capEnd?: boolean;
  modulate?: (t: number, theta: number) => number;
  uRepeat?: number;
  vRepeat?: number;
}): Geometry3D {
  const segs = opts.lengthSegments ?? 18;
  const rSegs = opts.radialSegments ?? 36;
  const cols = rSegs + 1;
  const capStart = opts.capStart ?? true;
  const capEnd = opts.capEnd ?? false;
  const uRepeat = opts.uRepeat ?? 1;
  const vRepeat = opts.vRepeat ?? 1;

  const posList: number[] = [];
  const uvList: number[] = [];
  const idxList: number[] = [];

  const centers: Vec3[] = [];
  const tangents: Vec3[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    centers.push(catmullRom3(opts.points, t));
    const pN = catmullRom3(opts.points, Math.min(1, t + 0.01));
    const pP = catmullRom3(opts.points, Math.max(0, t - 0.01));
    const dx = pN.x - pP.x;
    const dy = pN.y - pP.y;
    const dz = pN.z - pP.z;
    const len = Math.hypot(dx, dy, dz) || 1;
    tangents.push({ x: dx / len, y: dy / len, z: dz / len });
  }

  // Initial normal perpendicular to tangent[0]
  const t0 = tangents[0];
  let ref = Math.abs(t0.z) < 0.85 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  let nx = t0.y * ref.z - t0.z * ref.y;
  let ny = t0.z * ref.x - t0.x * ref.z;
  let nz = t0.x * ref.y - t0.y * ref.x;
  const nLen0 = Math.hypot(nx, ny, nz) || 1;
  nx /= nLen0;
  ny /= nLen0;
  nz /= nLen0;

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ti = tangents[i];
    if (i > 0) {
      // Project previous normal orthogonal to ti (parallel transport)
      const dot = nx * ti.x + ny * ti.y + nz * ti.z;
      nx -= dot * ti.x;
      ny -= dot * ti.y;
      nz -= dot * ti.z;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
    }
    // Binormal = tangent x normal
    const bx = ti.y * nz - ti.z * ny;
    const by = ti.z * nx - ti.x * nz;
    const bz = ti.x * ny - ti.y * nx;

    const c = centers[i];
    const baseR = opts.radius(t);

    for (let j = 0; j <= rSegs; j++) {
      const uFrac = j / rSegs;
      const theta = uFrac * Math.PI * 2;
      const mod = opts.modulate ? opts.modulate(t, theta) : 1;
      const r = baseR * mod;
      const ct = Math.cos(theta);
      const st = Math.sin(theta);

      posList.push(
        c.x + (nx * ct + bx * st) * r,
        c.y + (ny * ct + by * st) * r,
        c.z + (nz * ct + bz * st) * r,
      );
      uvList.push(uFrac * uRepeat, t * vRepeat);
    }
  }

  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < rSegs; j++) {
      const a = i * cols + j;
      const b = a + 1;
      const c = (i + 1) * cols + j;
      const d = c + 1;
      // (c-a) is +T, (b-a) is +theta (+B at theta=0). +T x +B = -N? Wait: T x B = T x (T x N) = -N (inward!).
      // So (b-a) x (c-a) = +B x +T = +N (outward!).
      idxList.push(a, b, c, b, d, c);
    }
  }

  if (capStart) {
    const c0 = centers[0];
    const cIdx = posList.length / 3;
    posList.push(c0.x, c0.y, c0.z);
    uvList.push(0.5 * uRepeat, 0);
    for (let j = 0; j < rSegs; j++) {
      idxList.push(cIdx, j + 1, j);
    }
  }
  if (capEnd) {
    const c1 = centers[segs];
    const base = segs * cols;
    const cIdx = posList.length / 3;
    posList.push(c1.x, c1.y, c1.z);
    uvList.push(0.5 * uRepeat, vRepeat);
    for (let j = 0; j < rSegs; j++) {
      idxList.push(cIdx, base + j, base + j + 1);
    }
  }

  const positions = new Float32Array(posList);
  const uvs = new Float32Array(uvList);
  const indices = new Uint16Array(idxList);
  const normals = computeSmoothNormals(positions, indices);
  return new Geometry3D({ positions, normals, uvs, indices });
}


