import {
  Container3D,
  CylinderGeometry,
  Geometry3D,
  Material3D,
  Mesh3D,
  SphereGeometry,
  TorusGeometry,
} from '@pixi/3d';
import { Matrix, Texture } from 'pixi.js';
import {
  buildHairCapeGeometry,
  buildHairStrandGeometry,
  buildLoftGeometry,
  buildPillowGeometry,
  buildScallopedCuffGeometry,
  buildSculptedHeadGeometry,
  buildSweepTubeGeometry,
} from '../geo/sculpt';
import { v3, type Vec3 } from '../geo/mathUtils';
import { animeRimBit } from '../materials/animeShaderBit';
import {
  createHairTexture,
  createPajamaPatternTexture,
  createPillowTexture,
  createPlushTexture,
  createSkinTexture,
  createYuukaFaceTexture,
} from '../textures/proceduralTextures';

export interface YuukaRig {
  root: Container3D;
  body: Container3D;
  torso: Container3D;
  headGroup: Container3D;
  haloGroup: Container3D;
  rightArmGroup: Container3D;
  leftArmGroup: Container3D;
  pillowGroup: Container3D;
  hairBackGroup: Container3D;
  textures: Texture[];
  materials: Material3D[];
}

function makeTubeFromPoints(pts: Vec3[], radii: number[], segs = 22): Geometry3D {
  const n = pts.length - 1;
  return buildSweepTubeGeometry({
    points: pts,
    radius: (t) => {
      const scaled = t * n;
      const idx = Math.min(Math.floor(scaled), n - 1);
      const lt = scaled - idx;
      return radii[idx] * (1 - lt) + radii[idx + 1] * lt;
    },
    radialSegments: segs,
    lengthSegments: 20,
    capStart: true,
    capEnd: true,
  });
}

export function buildYuukaCharacter(): YuukaRig {
  const root = new Container3D({ label: 'yuuka-root' });
  const body = new Container3D({ label: 'yuuka-body', parent: root });

  const faceTex = createYuukaFaceTexture();
  const skinTex = createSkinTexture();
  const pajamaTex = createPajamaPatternTexture();
  const hairTex = createHairTexture();
  const pillowTex = createPillowTexture();
  const plushTex = createPlushTexture();

  // Balanced anime PBR + soft rim materials (avoiding overexposure!)
  const skinMat = new Material3D({
    baseColor: 0xffffff,
    baseColorTexture: skinTex,
    roughness: 0.78,
    metallic: 0.0,
    extraBits: [animeRimBit],
  });
  skinMat.data.rimColor = [1.0, 0.85, 0.82, 0.14];
  skinMat.data.rimPower = 3.0;
  skinMat.data.softWrap = 0.24;

  const faceMat = new Material3D({
    baseColor: 0xffffff,
    baseColorTexture: faceTex,
    roughness: 0.82,
    metallic: 0.0,
    extraBits: [animeRimBit],
  });
  faceMat.data.rimColor = [1.0, 0.85, 0.82, 0.12];
  faceMat.data.rimPower = 3.2;
  faceMat.data.softWrap = 0.28;

  const pajamaMat = new Material3D({
    baseColor: 0xffffff,
    baseColorTexture: pajamaTex,
    uvTransform: new Matrix().scale(2.1, 1.9),
    roughness: 0.88,
    metallic: 0.0,
    doubleSided: true,
    extraBits: [animeRimBit],
  });
  pajamaMat.data.rimColor = [0.76, 0.9, 1.0, 0.18];
  pajamaMat.data.rimPower = 3.0;
  pajamaMat.data.softWrap = 0.04;

  const trimWhiteMat = new Material3D({
    baseColor: 0xf4f8ff,
    roughness: 0.78,
    metallic: 0.0,
    doubleSided: true,
    extraBits: [animeRimBit],
  });
  trimWhiteMat.data.rimColor = [0.8, 0.88, 1.0, 0.14];
  trimWhiteMat.data.rimPower = 3.0;
  trimWhiteMat.data.softWrap = 0.04;

  const hairMat = new Material3D({
    baseColor: 0xffffff,
    baseColorTexture: hairTex,
    roughness: 0.54,
    metallic: 0.06,
    doubleSided: true,
    extraBits: [animeRimBit],
  });
  hairMat.data.rimColor = [0.58, 0.6, 1.0, 0.28];
  hairMat.data.rimPower = 2.6;
  hairMat.data.softWrap = 0.08;

  const plushMat = new Material3D({
    baseColor: 0xffffff,
    baseColorTexture: plushTex,
    uvTransform: new Matrix().scale(3, 3),
    roughness: 0.94,
    metallic: 0.0,
    extraBits: [animeRimBit],
  });
  plushMat.data.rimColor = [0.85, 0.92, 1.0, 0.14];
  plushMat.data.rimPower = 2.6;
  plushMat.data.softWrap = 0.04;

  const pillowMat = new Material3D({
    baseColor: 0xffffff,
    baseColorTexture: pillowTex,
    roughness: 0.9,
    metallic: 0.0,
    doubleSided: true,
    extraBits: [animeRimBit],
  });
  pillowMat.data.rimColor = [0.82, 0.88, 1.0, 0.16];
  pillowMat.data.rimPower = 2.8;
  pillowMat.data.softWrap = 0.04;

  const bowRoseMat = new Material3D({
    baseColor: 0xa64672,
    roughness: 0.62,
    metallic: 0.04,
  });

  const soleMat = new Material3D({
    baseColor: 0xc2cade,
    roughness: 0.85,
  });

  const buttonMat = new Material3D({
    baseColor: 0xd9e8fa,
    roughness: 0.3,
    metallic: 0.18,
  });

  const pipingBlueMat = new Material3D({
    baseColor: 0x7da7cf,
    roughness: 0.72,
    metallic: 0.02,
    doubleSided: true,
  });

  const haloMetalMat = new Material3D({
    baseColor: 0x252b38,
    roughness: 0.34,
    metallic: 0.8,
  });

  const haloGlowMat = new Material3D({
    baseColor: 0x102838,
    emissive: { color: 0x4ae8ff, strength: 2.6 },
    roughness: 0.2,
  });

  const lashMat = new Material3D({
    baseColor: 0x262144,
    roughness: 0.65,
  });

  // =========================================================================
  // 1. LEGS & SLIPPERS (y = 0.00 to 0.78)
  // =========================================================================
  // Right leg (viewer's left, -X): stepped clearly back-left with gentle anime S-curve
  const rightLegGeo = buildLoftGeometry(
    [
      { center: v3(-0.098, 0.055, -0.088), rx: 0.029, rz: 0.032 },
      { center: v3(-0.09, 0.155, -0.078), rx: 0.036, rz: 0.039 },
      { center: v3(-0.078, 0.275, -0.062), rx: 0.047, rz: 0.05 },
      { center: v3(-0.064, 0.425, -0.03), rx: 0.043, rz: 0.046 },
      { center: v3(-0.066, 0.565, -0.018), rx: 0.057, rz: 0.061 },
      { center: v3(-0.068, 0.73, -0.006), rx: 0.068, rz: 0.07 },
    ],
    { radialSegments: 28 },
  );
  new Mesh3D({ geometry: rightLegGeo, material: skinMat, parent: body });

  // Left leg (viewer's right, +X): forward weight-bearing leg stepping near midline
  const leftLegGeo = buildLoftGeometry(
    [
      { center: v3(-0.008, 0.055, 0.054), rx: 0.03, rz: 0.033 },
      { center: v3(0.016, 0.16, 0.046), rx: 0.037, rz: 0.04 },
      { center: v3(0.036, 0.28, 0.032), rx: 0.048, rz: 0.051 },
      { center: v3(0.048, 0.435, 0.024), rx: 0.044, rz: 0.047 },
      { center: v3(0.06, 0.57, 0.012), rx: 0.058, rz: 0.062 },
      { center: v3(0.066, 0.73, 0.002), rx: 0.068, rz: 0.07 },
    ],
    { radialSegments: 28 },
  );
  new Mesh3D({ geometry: leftLegGeo, material: skinMat, parent: body });

  const buildSlipper = (x: number, y: number, z: number, yaw: number) => {
    const slipper = new Container3D({ position: { x, y, z }, rotation: { x: 0, y: yaw, z: 0 }, parent: body });

    const soleGeo = buildLoftGeometry(
      [
        { center: v3(0, 0.002, 0.024), rx: 0.052, rz: 0.094, power: 2.3 },
        { center: v3(0, 0.014, 0.024), rx: 0.055, rz: 0.097, power: 2.3 },
      ],
      { radialSegments: 24 },
    );
    new Mesh3D({ geometry: soleGeo, material: soleMat, parent: slipper });

    const upperGeo = buildLoftGeometry(
      [
        { center: v3(0, 0.012, 0.024), rx: 0.056, rz: 0.098, power: 2.2 },
        { center: v3(0, 0.034, 0.026), rx: 0.058, rz: 0.094, power: 2.1 },
        { center: v3(0, 0.054, 0.034), rx: 0.047, rz: 0.07, power: 2.0 },
        { center: v3(0, 0.064, 0.048), rx: 0.028, rz: 0.038, power: 2.0 },
      ],
      { radialSegments: 24 },
    );
    new Mesh3D({ geometry: upperGeo, material: plushMat, parent: slipper });

    const bow = new Container3D({ position: { x: 0, y: 0.066, z: 0.052 }, rotation: { x: 0.25, y: 0, z: 0 }, parent: slipper });
    new Mesh3D({ geometry: new SphereGeometry({ radius: 0.01 }), material: bowRoseMat, parent: bow });
    for (const s of [-1, 1]) {
      new Mesh3D({
        geometry: new SphereGeometry({ radius: 0.018 }),
        material: bowRoseMat,
        position: { x: s * 0.016, y: 0.002, z: 0 },
        rotation: { x: 0, y: 0, z: s * -0.16 },
        scale: { x: 1.2, y: 0.78, z: 0.62 },
        parent: bow,
      });
    }
  };

  buildSlipper(-0.098, 0.0, -0.09, -0.14);
  buildSlipper(-0.008, 0.0, 0.056, -0.06);

  // =========================================================================
  // 2. TORSO, PAJAMA SHORTS & SHIRT (y = 0.67 to 1.24)
  // =========================================================================
  const torso = new Container3D({ label: 'yuuka-torso', parent: body });

  const shortsBodyGeo = buildLoftGeometry(
    [
      { center: v3(0, 0.74, -0.004), rx: 0.126, rz: 0.096, power: 2.2 },
      { center: v3(0, 0.82, 0.0), rx: 0.142, rz: 0.108, power: 2.2 },
      { center: v3(0, 0.9, 0.0), rx: 0.118, rz: 0.092, power: 2.1 },
    ],
    { radialSegments: 32, uRepeat: 1.2, vRepeat: 0.5 },
  );
  new Mesh3D({ geometry: shortsBodyGeo, material: pajamaMat, parent: torso });

  const shortsLegSpecs = [
    { x: -0.066, z: -0.008, rotX: -0.06, rotZ: -0.02 },
    { x: 0.066, z: 0.006, rotX: 0.04, rotZ: 0.02 },
  ];
  for (const spec of shortsLegSpecs) {
    const legWrap = new Container3D({
      position: { x: spec.x, y: 0.74, z: spec.z },
      rotation: { x: spec.rotX, y: 0, z: spec.rotZ },
      parent: torso,
    });
    const puffGeo = buildLoftGeometry(
      [
        { center: v3(0, -0.062, 0), rx: 0.086, rz: 0.084 },
        { center: v3(0, -0.01, 0), rx: 0.098, rz: 0.094 },
        { center: v3(0, 0.058, 0), rx: 0.082, rz: 0.082 },
      ],
      { radialSegments: 28, uRepeat: 0.8, vRepeat: 0.45 },
    );
    new Mesh3D({ geometry: puffGeo, material: pajamaMat, parent: legWrap });

    const ruffleGeo = buildScallopedCuffGeometry({
      radiusTop: 0.078,
      radiusBottom: 0.092,
      height: 0.04,
      waves: 10,
      scallopDepth: 0.14,
      petalDrop: 0.016,
      radialSegments: 64,
    });
    new Mesh3D({
      geometry: ruffleGeo,
      material: pajamaMat,
      position: { x: 0, y: -0.07, z: 0 },
      parent: legWrap,
    });

    // Crisp white scalloped bottom trim peeking delicately along shorts hem
    const ruffleTrimGeo = buildScallopedCuffGeometry({
      radiusTop: 0.091,
      radiusBottom: 0.094,
      height: 0.012,
      waves: 10,
      scallopDepth: 0.14,
      petalDrop: 0.016,
      radialSegments: 64,
    });
    new Mesh3D({
      geometry: ruffleTrimGeo,
      material: trimWhiteMat,
      position: { x: 0, y: -0.084, z: 0 },
      parent: legWrap,
    });
  }

  // Pajama shirt body (relaxed A-line flare at bottom hem + gentle shoulders)
  const shirtGeo = buildLoftGeometry(
    [
      { center: v3(0, 0.79, 0.004), rx: 0.156, rz: 0.118, power: 2.2, tiltX: 0.03 },
      { center: v3(0, 0.88, 0.004), rx: 0.132, rz: 0.1, power: 2.1 },
      { center: v3(0, 0.98, 0.004), rx: 0.116, rz: 0.091, power: 2.1 },
      { center: v3(0, 1.07, 0.01), rx: 0.123, rz: 0.102, power: 2.1 },
      { center: v3(0, 1.15, 0.002), rx: 0.124, rz: 0.088, power: 2.1 },
      { center: v3(0, 1.205, -0.004), rx: 0.112, rz: 0.068, power: 2.1 },
      { center: v3(0, 1.232, -0.004), rx: 0.064, rz: 0.048, power: 2.0 },
    ],
    { radialSegments: 36, uRepeat: 1.5, vRepeat: 1.0 },
  );
  new Mesh3D({ geometry: shirtGeo, material: pajamaMat, parent: torso });

  // V-neck upper chest & natural anime neck width
  const chestSkinGeo = buildLoftGeometry(
    [
      { center: v3(0, 1.095, 0.08), rx: 0.032, rz: 0.028 },
      { center: v3(0, 1.155, 0.062), rx: 0.046, rz: 0.042 },
      { center: v3(0, 1.21, 0.028), rx: 0.045, rz: 0.042 },
      { center: v3(0, 1.27, 0.008), rx: 0.04, rz: 0.04 },
      { center: v3(0, 1.335, 0.006), rx: 0.038, rz: 0.038 },
    ],
    { radialSegments: 24 },
  );
  new Mesh3D({ geometry: chestSkinGeo, material: skinMat, parent: torso });

  // Two-piece notched white camp collar + subtle pastel-blue piped edge
  for (const s of [-1, 1]) {
    // Upper collar wing spreading over shoulder
    const upperWingGeo = buildHairStrandGeometry({
      points: [
        v3(s * 0.04, 1.228, 0.014),
        v3(s * 0.068, 1.208, 0.046),
        v3(s * 0.072, 1.184, 0.072),
      ],
      width: (t) => 0.014 + 0.008 * t,
      thickness: () => 0.003,
      segments: 10,
      crossSegments: 8,
      normalHint: v3(0, 0.4, 0.9),
    });
    new Mesh3D({ geometry: upperWingGeo, material: trimWhiteMat, parent: torso });

    // Lower V-lapel tapering cleanly down to top shirt button
    const lapelGeo = buildHairStrandGeometry({
      points: [
        v3(s * 0.056, 1.184, 0.078),
        v3(s * 0.044, 1.132, 0.098),
        v3(s * 0.005, 1.072, 0.105),
      ],
      width: (t) => 0.018 * (1 - 0.62 * Math.pow(t, 1.4)),
      thickness: () => 0.003,
      segments: 12,
      crossSegments: 8,
      normalHint: v3(0, 0, 1),
    });
    new Mesh3D({ geometry: lapelGeo, material: trimWhiteMat, parent: torso });

    // Thin periwinkle-blue collar edge trim along outer lapel perimeter
    const collarPipeGeo = buildHairStrandGeometry({
      points: [
        v3(s * 0.052, 1.224, 0.022),
        v3(s * 0.08, 1.196, 0.054),
        v3(s * 0.064, 1.152, 0.088),
        v3(s * 0.011, 1.072, 0.105),
      ],
      width: () => 0.0023,
      thickness: () => 0.002,
      segments: 16,
      crossSegments: 6,
      normalHint: v3(0, 0, 1),
    });
    new Mesh3D({ geometry: collarPipeGeo, material: pipingBlueMat, parent: torso });
  }

  // Back collar fold
  const backCollarGeo = buildHairStrandGeometry({
    points: [
      v3(-0.052, 1.226, 0.02),
      v3(-0.04, 1.236, -0.05),
      v3(0, 1.238, -0.064),
      v3(0.04, 1.236, -0.05),
      v3(0.052, 1.226, 0.02),
    ],
    width: () => 0.016,
    thickness: () => 0.004,
    segments: 16,
    crossSegments: 8,
    normalHint: v3(0, 1, 0),
  });
  new Mesh3D({ geometry: backCollarGeo, material: trimWhiteMat, parent: torso });

  // Center front placket + crisp blue-rimmed pearl buttons
  const placketGeo = buildHairStrandGeometry({
    points: [v3(0, 1.092, 0.104), v3(0, 0.99, 0.098), v3(0, 0.89, 0.105), v3(0, 0.794, 0.118)],
    width: () => 0.013,
    thickness: () => 0.0032,
    segments: 12,
    crossSegments: 6,
    normalHint: v3(0, 0, 1),
  });
  new Mesh3D({ geometry: placketGeo, material: pajamaMat, parent: torso });

  const btnYs = [1.045, 0.97, 0.895, 0.822];
  const btnZs = [0.106, 0.101, 0.107, 0.117];
  const btnRimGeo = new CylinderGeometry({ radiusTop: 0.0085, radiusBottom: 0.0085, height: 0.003, radialSegments: 16 });
  const btnGeo = new CylinderGeometry({ radiusTop: 0.0065, radiusBottom: 0.0065, height: 0.0045, radialSegments: 16 });
  for (let i = 0; i < btnYs.length; i++) {
    new Mesh3D({
      geometry: btnRimGeo,
      material: pipingBlueMat,
      position: { x: 0, y: btnYs[i], z: btnZs[i] },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
      parent: torso,
    });
    new Mesh3D({
      geometry: btnGeo,
      material: buttonMat,
      position: { x: 0, y: btnYs[i], z: btnZs[i] + 0.0008 },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
      parent: torso,
    });
  }

  // Left chest pocket (+X): proud of shirt surface to avoid Z-fighting, rounded bottom + crisp top bar
  const pocket = new Container3D({ position: { x: 0.062, y: 1.028, z: 0.104 }, rotation: { x: -0.04, y: 0.34, z: 0 }, parent: torso });
  const pocketBodyGeo = buildLoftGeometry(
    [
      { center: v3(0, -0.028, 0), rx: 0.02, rz: 0.004, power: 2.5 },
      { center: v3(0, -0.014, 0), rx: 0.027, rz: 0.005, power: 4 },
      { center: v3(0, 0.02, 0), rx: 0.028, rz: 0.005, power: 4 },
    ],
    { radialSegments: 16 },
  );
  new Mesh3D({ geometry: pocketBodyGeo, material: pajamaMat, parent: pocket });
  const pocketTrimGeo = buildLoftGeometry(
    [
      { center: v3(0, 0.019, 0.002), rx: 0.029, rz: 0.005, power: 4 },
      { center: v3(0, 0.026, 0.002), rx: 0.029, rz: 0.005, power: 4 },
    ],
    { radialSegments: 16 },
  );
  new Mesh3D({ geometry: pocketTrimGeo, material: trimWhiteMat, parent: pocket });
  const pocketPipeGeo = buildHairStrandGeometry({
    points: [v3(-0.027, 0.018, 0.006), v3(0.027, 0.018, 0.006)],
    width: () => 0.0018,
    thickness: () => 0.0015,
    segments: 6,
    crossSegments: 6,
    normalHint: v3(0, 0, 1),
  });
  new Mesh3D({ geometry: pocketPipeGeo, material: pipingBlueMat, parent: pocket });

  // =========================================================================
  // 3. HEAD, FACE, HEADBAND (EAR-TO-EAR ARCH), HALO & HAIR
  // =========================================================================
  const headGroup = new Container3D({
    label: 'yuuka-head',
    position: { x: 0, y: 1.388, z: 0.012 },
    rotation: { x: -0.025, y: 0.02, z: -0.048 },
    parent: torso,
  });

  const headGeo = buildSculptedHeadGeometry({ radius: 0.132, widthSegments: 56, heightSegments: 44 });
  new Mesh3D({ geometry: headGeo, material: faceMat, parent: headGroup });

  for (const s of [-1, 1]) {
    new Mesh3D({
      geometry: new SphereGeometry({ radius: 0.021 }),
      material: skinMat,
      position: { x: s * 0.123, y: -0.016, z: -0.012 },
      rotation: { x: 0.1, y: s * 0.35, z: s * -0.15 },
      scale: { x: 0.45, y: 1.0, z: 0.72 },
      parent: headGroup,
    });
  }

  // Cranial hair cap filling upper crown cleanly below headband (zero forehead slit) while leaving V-parting open
  const scalpGeo = new SphereGeometry({ radius: 0.136, widthSegments: 36, heightSegments: 24 });
  new Mesh3D({
    geometry: scalpGeo,
    material: hairMat,
    position: { x: 0, y: 0.038, z: -0.012 },
    scale: { x: 1.0, y: 0.99, z: 0.99 },
    parent: headGroup,
  });

  // Fluffy white spa headband framing cleanly around the crown & temples outside the hairline
  const headbandGroup = new Container3D({ parent: headGroup });
  const bandPts: Vec3[] = [];
  const bandSteps = 18;
  for (let i = 0; i <= bandSteps; i++) {
    const a = -0.1 * Math.PI + (i / bandSteps) * (1.2 * Math.PI);
    bandPts.push({
      x: Math.cos(a) * 0.153,
      y: 0.018 + Math.sin(a) * 0.156,
      z: 0.01 - Math.sin(a) * 0.02,
    });
  }
  const headbandGeo = buildHairStrandGeometry({
    points: bandPts,
    width: (t) => 0.023 + 0.008 * Math.sin(t * Math.PI),
    thickness: (t) => 0.016 + 0.005 * Math.sin(t * Math.PI),
    segments: 32,
    crossSegments: 12,
    normalHint: v3(0, 0, 1),
  });
  new Mesh3D({ geometry: headbandGeo, material: plushMat, parent: headbandGroup });

  // Cute white knotted bunny-ear bow sitting prominently atop the headband
  const headBow = new Container3D({
    position: { x: -0.008, y: 0.18, z: -0.002 },
    rotation: { x: 0.24, y: 0, z: 0.06 },
    parent: headbandGroup,
  });
  new Mesh3D({ geometry: new SphereGeometry({ radius: 0.019 }), material: plushMat, parent: headBow });
  for (const s of [-1, 1]) {
    const earGeo = buildHairStrandGeometry({
      points: [
        v3(0, 0, 0),
        v3(s * 0.038, 0.028, 0.006),
        v3(s * 0.08, 0.044, 0.002),
        v3(s * 0.098, 0.025, -0.004),
      ],
      width: (t) => 0.015 + 0.022 * Math.sin(t * Math.PI),
      thickness: (t) => 0.008 + 0.006 * Math.sin(t * Math.PI),
      segments: 16,
      crossSegments: 10,
      normalHint: v3(0, 0, 1),
    });
    new Mesh3D({ geometry: earGeo, material: plushMat, parent: headBow });
  }

  // Yuuka's floating tech halo
  const haloGroup = new Container3D({
    label: 'yuuka-halo',
    position: { x: 0, y: 0.258, z: -0.008 },
    rotation: { x: 0.15, y: 0, z: -0.04 },
    parent: headGroup,
  });
  const haloOuterGeo = new TorusGeometry({ radius: 0.175, tube: 0.01, radialSegments: 12, tubularSegments: 64 });
  new Mesh3D({
    geometry: haloOuterGeo,
    material: haloMetalMat,
    scale: { x: 1, y: 0.65, z: 1 },
    castShadow: false,
    parent: haloGroup,
  });
  const haloCyanGeo = new TorusGeometry({ radius: 0.166, tube: 0.0042, radialSegments: 10, tubularSegments: 64 });
  new Mesh3D({
    geometry: haloCyanGeo,
    material: haloGlowMat,
    position: { x: 0, y: -0.003, z: 0 },
    castShadow: false,
    parent: haloGroup,
  });

  // =========================================================================
  // 4. HAIR: FULL PARTED FOREHEAD BANGS, HIME LOCKS, AHOGE & SILKY BACK HAIR
  // =========================================================================
  // Lush layered bangs originating smoothly from crown scalp (y ~ 0.145), hugging forehead curve,
  // and parting cleanly into an inverted-V forehead notch (x ~ +0.008..+0.042) showing right brow.
  const frontBangs: { pts: Vec3[]; w: number; th: number }[] = [
    // Far left (-X) sweeping temple/cheek lock
    { pts: [v3(-0.088, 0.128, 0.045), v3(-0.12, 0.064, 0.088), v3(-0.118, -0.018, 0.102), v3(-0.098, -0.072, 0.096)], w: 0.018, th: 0.007 },
    // Outer-left sweeping cheek-framing point
    { pts: [v3(-0.068, 0.142, 0.056), v3(-0.094, 0.086, 0.106), v3(-0.091, 0.022, 0.118), v3(-0.078, -0.024, 0.116)], w: 0.018, th: 0.007 },
    // Mid-left tapered lock dipping gently past brow
    { pts: [v3(-0.044, 0.148, 0.064), v3(-0.062, 0.096, 0.116), v3(-0.056, 0.038, 0.124), v3(-0.044, 0.002, 0.123)], w: 0.0155, th: 0.0062 },
    // Center-left sweeping point curving diagonally between eyes (Yuuka's signature lock!)
    { pts: [v3(-0.02, 0.15, 0.068), v3(-0.028, 0.098, 0.12), v3(-0.018, 0.036, 0.127), v3(0.002, -0.018, 0.125)], w: 0.0145, th: 0.0058 },
    // Fine bridge wisp right beside center-left
    { pts: [v3(-0.002, 0.148, 0.068), v3(-0.005, 0.102, 0.121), v3(0.0, 0.05, 0.126), v3(0.006, 0.012, 0.125)], w: 0.0085, th: 0.0042 },
    // --- Clear single inverted-V forehead parting at x ~ +0.010..+0.042 ---
    // Right-center parted bang sweeping softly right above outer right brow
    { pts: [v3(0.044, 0.146, 0.064), v3(0.058, 0.1, 0.116), v3(0.066, 0.046, 0.12), v3(0.078, 0.008, 0.116)], w: 0.0155, th: 0.0062 },
    // Outer-right sweeping curtain lock
    { pts: [v3(0.068, 0.14, 0.054), v3(0.092, 0.084, 0.106), v3(0.098, 0.02, 0.114), v3(0.094, -0.022, 0.11)], w: 0.018, th: 0.007 },
    // Far right (+X) sweeping temple/cheek lock
    { pts: [v3(0.09, 0.126, 0.042), v3(0.12, 0.06, 0.088), v3(0.118, -0.022, 0.1), v3(0.1, -0.074, 0.094)], w: 0.018, th: 0.007 },
  ];
  for (const b of frontBangs) {
    const geo = buildHairStrandGeometry({
      points: b.pts,
      width: (t) => b.w * (1 - 0.96 * Math.pow(t, 1.55)),
      thickness: (t) => b.th * (1 - 0.8 * t),
      segments: 16,
      crossSegments: 10,
      normalHint: v3(0, 0.25, 0.96),
    });
    new Mesh3D({ geometry: geo, material: hairMat, castShadow: false, parent: headGroup });
  }

  // Prominent curved Ahoge on upper-left (-X) sweeping softly out beside headband
  const ahogeGeo = buildHairStrandGeometry({
    points: [
      v3(-0.055, 0.132, 0.022),
      v3(-0.115, 0.168, 0.02),
      v3(-0.166, 0.168, 0.012),
      v3(-0.184, 0.122, 0.006),
    ],
    width: (t) => 0.013 * (1 - 0.92 * Math.pow(t, 1.5)),
    thickness: (t) => 0.007 * (1 - 0.8 * t),
    segments: 18,
    crossSegments: 8,
    normalHint: v3(0, 0, 1),
  });
  new Mesh3D({ geometry: ahogeGeo, material: hairMat, castShadow: false, parent: headGroup });

  // Side cheek locks (hime locks curving softly toward jaw)
  for (const s of [-1, 1]) {
    const himeGeo = buildHairStrandGeometry({
      points: [
        v3(s * 0.11, 0.075, 0.042),
        v3(s * 0.12, -0.015, 0.062),
        v3(s * 0.11, -0.095, 0.064),
        v3(s * 0.082, -0.155, 0.056),
      ],
      width: (t) => 0.019 * (1 - 0.88 * Math.pow(t, 1.7)),
      thickness: (t) => 0.009 * (1 - 0.75 * t),
      segments: 18,
      crossSegments: 8,
      normalHint: v3(s * 0.5, 0, 0.85),
    });
    new Mesh3D({ geometry: himeGeo, material: hairMat, castShadow: false, parent: headGroup });
  }

  // Continuous silky flowing back-hair cape + integrated soft curved side wisps
  const hairBackGroup = new Container3D({ label: 'yuuka-back-hair', parent: torso });
  const hairCapeGeo = buildHairCapeGeometry({ widthSegs: 44, heightSegs: 28 });
  new Mesh3D({ geometry: hairCapeGeo, material: hairMat, parent: hairBackGroup });

  // Soft layered side-edge silhouette locks tucked gently inside the flowing cape hem (no sharp corner spikes)
  const outerFlairSpecs: { pts: Vec3[]; w: number }[] = [
    { pts: [v3(-0.145, 1.07, -0.068), v3(-0.202, 0.95, -0.056), v3(-0.242, 0.875, -0.038)], w: 0.026 },
    { pts: [v3(-0.132, 0.96, -0.088), v3(-0.184, 0.85, -0.072), v3(-0.215, 0.79, -0.05)], w: 0.022 },
    { pts: [v3(0.145, 1.07, -0.068), v3(0.202, 0.95, -0.056), v3(0.238, 0.872, -0.038)], w: 0.026 },
    { pts: [v3(0.132, 0.96, -0.088), v3(0.184, 0.85, -0.072), v3(0.212, 0.788, -0.05)], w: 0.022 },
  ];
  for (const sp of outerFlairSpecs) {
    const geo = buildHairStrandGeometry({
      points: sp.pts,
      width: (t) => sp.w * (1 - 0.82 * Math.pow(t, 1.65)),
      thickness: (t) => 0.008 * (1 - 0.72 * t),
      segments: 16,
      crossSegments: 8,
      normalHint: v3(0, 0, -1),
    });
    new Mesh3D({ geometry: geo, material: hairMat, parent: hairBackGroup });
  }

  // =========================================================================
  // 5. RIGHT ARM (VIEWER'S LEFT, -X): TRUE BISHOP-SWEPT SLEEVE + RAISED HAND
  // =========================================================================
  const rightArmGroup = new Container3D({ label: 'yuuka-right-arm', parent: torso });

  const rSleeveGeo = buildSweepTubeGeometry({
    points: [v3(-0.098, 1.196, 0.004), v3(-0.158, 1.182, 0.016), v3(-0.222, 1.164, 0.028)],
    radius: (t) => 0.042 + 0.016 * t,
    radialSegments: 44,
    lengthSegments: 14,
    capStart: true,
    capEnd: false,
    modulate: (t, theta) => 1 + (t > 0.72 ? Math.pow((t - 0.72) / 0.28, 1.4) * 0.13 * Math.abs(Math.sin(theta * 4.5)) : 0),
    uRepeat: 0.7,
    vRepeat: 0.45,
  });
  new Mesh3D({ geometry: rSleeveGeo, material: pajamaMat, parent: rightArmGroup });

  // Crisp thin white scalloped piping cuff at right sleeve hem
  const rSleeveTrimGeo = buildSweepTubeGeometry({
    points: [v3(-0.212, 1.167, 0.026), v3(-0.225, 1.163, 0.029)],
    radius: () => 0.0585,
    radialSegments: 44,
    lengthSegments: 4,
    capStart: false,
    capEnd: false,
    modulate: (_t, theta) => 1 + 0.13 * Math.abs(Math.sin(theta * 4.5)),
  });
  new Mesh3D({ geometry: rSleeveTrimGeo, material: trimWhiteMat, parent: rightArmGroup });

  // Seamless continuous right arm spline (shoulder -> elbow -> forearm -> wrist cupping outer headband)
  const rArmGeo = makeTubeFromPoints(
    [
      v3(-0.115, 1.19, 0.008),
      v3(-0.195, 1.168, 0.024),
      v3(-0.28, 1.174, 0.048),
      v3(-0.25, 1.304, 0.07),
      v3(-0.184, 1.404, 0.082),
    ],
    [0.034, 0.03, 0.027, 0.023, 0.018],
    22,
  );
  new Mesh3D({ geometry: rArmGeo, material: skinMat, parent: rightArmGroup });

  const rHand = new Container3D({
    position: { x: -0.178, y: 1.428, z: 0.084 },
    rotation: { x: 0.14, y: 0.28, z: -0.4 },
    parent: rightArmGroup,
  });
  new Mesh3D({
    geometry: new SphereGeometry({ radius: 0.02 }),
    material: skinMat,
    scale: { x: 0.72, y: 1.12, z: 0.52 },
    parent: rHand,
  });
  for (let f = 0; f < 4; f++) {
    const fOff = (f - 1.5) * 0.0078;
    const fingerGeo = makeTubeFromPoints(
      [v3(0, 0.016, fOff), v3(0.012, 0.032, fOff * 1.1), v3(0.022, 0.042, fOff * 0.9)],
      [0.0044, 0.0038, 0.003],
      10,
    );
    new Mesh3D({ geometry: fingerGeo, material: skinMat, parent: rHand });
  }
  const thumbGeo = makeTubeFromPoints(
    [v3(0.008, 0.004, 0.014), v3(0.018, 0.014, 0.02), v3(0.024, 0.024, 0.016)],
    [0.0048, 0.004, 0.0032],
    10,
  );
  new Mesh3D({ geometry: thumbGeo, material: skinMat, parent: rHand });

  // =========================================================================
  // 6. LEFT ARM (VIEWER'S RIGHT, +X) & LARGE PLUMP WHITE PILLOW
  // =========================================================================
  const leftArmGroup = new Container3D({ label: 'yuuka-left-arm', parent: torso });

  // Seamless left sleeve with integrated scalloped opening (Bishop-swept, clear of back hair edge)
  const lSleeveGeo = buildSweepTubeGeometry({
    points: [v3(0.098, 1.19, 0.004), v3(0.148, 1.12, 0.014), v3(0.188, 1.046, 0.022)],
    radius: (t) => 0.042 + 0.017 * t,
    radialSegments: 44,
    lengthSegments: 14,
    capStart: true,
    capEnd: false,
    modulate: (t, theta) => 1 + (t > 0.72 ? Math.pow((t - 0.72) / 0.28, 1.4) * 0.13 * Math.abs(Math.sin(theta * 4.5)) : 0),
    uRepeat: 0.7,
    vRepeat: 0.45,
  });
  new Mesh3D({ geometry: lSleeveGeo, material: pajamaMat, parent: leftArmGroup });

  // Crisp thin white scalloped piping cuff at left sleeve hem
  const lSleeveTrimGeo = buildSweepTubeGeometry({
    points: [v3(0.182, 1.057, 0.021), v3(0.191, 1.041, 0.023)],
    radius: () => 0.0595,
    radialSegments: 44,
    lengthSegments: 4,
    capStart: false,
    capEnd: false,
    modulate: (_t, theta) => 1 + 0.13 * Math.abs(Math.sin(theta * 4.5)),
  });
  new Mesh3D({ geometry: lSleeveTrimGeo, material: trimWhiteMat, parent: leftArmGroup });

  const lArmGeo = makeTubeFromPoints(
    [
      v3(0.115, 1.17, 0.006),
      v3(0.17, 1.05, 0.02),
      v3(0.2, 0.9, 0.032),
      v3(0.214, 0.742, 0.044),
    ],
    [0.033, 0.028, 0.025, 0.02],
    22,
  );
  new Mesh3D({ geometry: lArmGeo, material: skinMat, parent: leftArmGroup });

  const lHand = new Container3D({
    position: { x: 0.216, y: 0.724, z: 0.046 },
    rotation: { x: 0.08, y: -0.22, z: 0.24 },
    parent: leftArmGroup,
  });
  new Mesh3D({
    geometry: new SphereGeometry({ radius: 0.02 }),
    material: skinMat,
    scale: { x: 0.65, y: 1.15, z: 0.52 },
    parent: lHand,
  });
  for (let f = 0; f < 4; f++) {
    const fOff = (f - 1.5) * 0.008;
    const fingerGeo = makeTubeFromPoints(
      [v3(0, -0.012, fOff), v3(0.005, -0.028, fOff), v3(-0.004, -0.038, fOff)],
      [0.0045, 0.0038, 0.003],
      10,
    );
    new Mesh3D({ geometry: fingerGeo, material: skinMat, parent: lHand });
  }

  // Large Plump White Pillow hanging diagonally from its top-left pinched corner gripped inside lHand
  const pillowGroup = new Container3D({
    label: 'yuuka-pillow',
    position: { x: 0.242, y: 0.456, z: 0.028 },
    rotation: { x: 0.07, y: -0.26, z: -0.58 },
    parent: body,
  });
  const pillowGeo = buildPillowGeometry({ width: 0.46, height: 0.49, thickness: 0.162, segX: 34, segY: 36 });
  new Mesh3D({ geometry: pillowGeo, material: pillowMat, parent: pillowGroup });

  return {
    root,
    body,
    torso,
    headGroup,
    haloGroup,
    rightArmGroup,
    leftArmGroup,
    pillowGroup,
    hairBackGroup,
    textures: [faceTex, skinTex, pajamaTex, hairTex, pillowTex, plushTex],
    materials: [
      skinMat,
      faceMat,
      pajamaMat,
      trimWhiteMat,
      hairMat,
      plushMat,
      pillowMat,
      bowRoseMat,
      soleMat,
      buttonMat,
      pipingBlueMat,
      haloMetalMat,
      haloGlowMat,
      lashMat,
    ],
  };
}

export function updateYuukaIdle(rig: YuukaRig, timeSec: number): void {
  const breath = Math.sin(timeSec * 1.8);
  rig.torso.position.y = breath * 0.004;
  rig.headGroup.rotation.x = -0.025 + Math.sin(timeSec * 1.2) * 0.012;
  rig.haloGroup.position.y = 0.255 + Math.sin(timeSec * 2.3) * 0.008;
  rig.haloGroup.rotation.y = Math.sin(timeSec * 0.7) * 0.08;
  rig.pillowGroup.rotation.z = -0.58 + Math.sin(timeSec * 1.4 + 0.5) * 0.015;
}
