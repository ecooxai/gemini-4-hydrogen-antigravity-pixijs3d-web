import {
  AmbientLight,
  CylinderGeometry,
  DirectionalLight,
  Material3D,
  Mesh3D,
  Vector3,
  View3D,
  type Hemisphere,
} from '@pixi/3d';
import { OrbitCamera } from '@pixi/3d/extras';
import { Application, Container, Graphics, Point, Text } from 'pixi.js';
import { buildYuukaCharacter, updateYuukaIdle, type YuukaRig } from '../character/buildYuuka';
import { MODEL_DISPLAY_NAME, type BackgroundKind, type CameraPreset } from '../state';

export interface SceneController {
  view3d: View3D;
  rig: YuukaRig;
  setCameraPreset: (preset: CameraPreset) => void;
  setBackground: (bg: BackgroundKind) => void;
  setSpinEnabled: (spin: boolean) => void;
  setIdleEnabled: (idle: boolean) => void;
  getBackendName: () => string;
  destroy: () => void;
}

const TARGET = { x: 0, y: 0.89, z: 0 };

const PRESET_POSITIONS: Record<CameraPreset, { x: number; y: number; z: number }> = {
  front: { x: 0, y: 0.94, z: 3.18 },
  right: { x: 3.18, y: 0.94, z: 0 },
  back: { x: 0, y: 0.94, z: -3.18 },
  left: { x: -3.18, y: 0.94, z: 0 },
  hero: { x: 0.95, y: 1.05, z: 3.0 },
};

const BG_THEMES: Record<BackgroundKind, { env: Hemisphere; bgColor: number; floorColor: number }> = {
  lightblue: {
    env: { skyColor: 0xd9ecff, groundColor: 0x7e94b4, intensity: 0.58 },
    bgColor: 0xcde8ff,
    floorColor: 0xb7d8f6,
  },
  studio: {
    env: { skyColor: 0xe6f2ff, groundColor: 0x8ea2be, intensity: 0.62 },
    bgColor: 0xdfeeff,
    floorColor: 0xcde2fa,
  },
  night: {
    env: { skyColor: 0x5c72a0, groundColor: 0x242a40, intensity: 0.55 },
    bgColor: 0x1c2540,
    floorColor: 0x263252,
  },
};

export function createScene(app: Application): SceneController {
  const initialTheme = BG_THEMES.lightblue;

  const view3d = new View3D({
    autoResize: true,
    shadowQuality: 'medium',
    shadowFilter: 'pcf',
    environment: { ...initialTheme.env },
    background: initialTheme.bgColor,
    toneMapping: 'aces',
    exposure: 0.96,
  });
  app.stage.addChild(view3d);

  // Soft studio lighting rig (balanced to avoid overexposure)
  const keyLight = new DirectionalLight({
    color: 0xfff7ef,
    intensity: 1.38,
    castShadow: true,
    position: { x: 2.2, y: 3.6, z: 3.0 },
  });
  keyLight.lookAt(TARGET);
  view3d.root.addChild(keyLight);

  const rimLight = new DirectionalLight({
    color: 0xb4dcff,
    intensity: 0.72,
    castShadow: false,
    position: { x: -2.0, y: 2.2, z: -2.4 },
  });
  rimLight.lookAt(TARGET);
  view3d.root.addChild(rimLight);

  const sideFill = new DirectionalLight({
    color: 0xe2ecff,
    intensity: 0.52,
    castShadow: false,
    position: { x: 2.4, y: 1.2, z: -1.4 },
  });
  sideFill.lookAt(TARGET);
  view3d.root.addChild(sideFill);

  const ambient = new AmbientLight({ color: 0xf0f5ff, intensity: 0.22 });
  view3d.root.addChild(ambient);

  // Subtle soft studio pedestal disc for grounding shadows
  const floorMat = new Material3D({
    baseColor: initialTheme.floorColor,
    roughness: 0.92,
    metallic: 0.0,
  });
  const floorDisc = new Mesh3D({
    geometry: new CylinderGeometry({ radiusTop: 0.72, radiusBottom: 0.76, height: 0.024, radialSegments: 48 }),
    material: floorMat,
    position: { x: 0, y: -0.012, z: 0 },
    castShadow: false,
    receiveShadow: true,
  });
  view3d.root.addChild(floorDisc);

  // Build Yuuka character
  const rig = buildYuukaCharacter();
  view3d.root.addChild(rig.root);

  // Camera setup
  view3d.camera.fov = 38;
  view3d.camera.near = 0.08;
  view3d.camera.far = 40;

  let orbit: OrbitCamera | null = null;
  let spinEnabled = false;
  let idleEnabled = true;

  const bindOrbit = (pos: { x: number; y: number; z: number }) => {
    if (orbit) {
      orbit.destroy();
      orbit = null;
    }
    view3d.camera.position.set(pos.x, pos.y, pos.z);
    view3d.camera.lookAt(TARGET);
    orbit = new OrbitCamera({
      view: view3d,
      target: TARGET,
      enableDamping: true,
      dampingFactor: 0.09,
      minDistance: 0.9,
      maxDistance: 6.5,
      maxPolarAngle: Math.PI * 0.54,
      autoRotate: spinEnabled,
      autoRotateSpeed: 1.4,
      autoUpdate: false,
    });
  };

  bindOrbit(PRESET_POSITIONS.front);

  // World-anchored model name badge directly above Yuuka's halo
  const labelContainer = new Container();
  const labelText = new Text({
    text: MODEL_DISPLAY_NAME,
    style: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 16,
      fontWeight: '700',
      fill: 0x1d2b4f,
      letterSpacing: 0.4,
    },
  });
  labelText.anchor.set(0.5, 0.5);

  const padX = 14;
  const padY = 6;
  const pillW = Math.ceil(labelText.width + padX * 2);
  const pillH = Math.ceil(labelText.height + padY * 2);
  const pillBg = new Graphics()
    .roundRect(-pillW / 2, -pillH / 2, pillW, pillH, pillH / 2)
    .fill({ color: 0xffffff, alpha: 0.82 })
    .stroke({ width: 1.5, color: 0x6ea6ea, alpha: 0.75 });
  labelContainer.addChild(pillBg, labelText);
  app.stage.addChild(labelContainer);

  const worldAnchor = new Vector3();
  const screenPt = new Point();
  let elapsed = 0;

  const onTick = (ticker: { deltaMS: number }) => {
    elapsed += ticker.deltaMS / 1000;
    if (idleEnabled) {
      updateYuukaIdle(rig, elapsed);
    }
    if (orbit) {
      orbit.update(ticker as never);
    }

    // Position model name cleanly above the halo in screen space
    rig.headGroup.toGlobal(worldAnchor.set(0, 0.43, 0), worldAnchor);
    const pt = view3d.worldToScreen(worldAnchor, screenPt);
    if (pt) {
      labelContainer.visible = true;
      const marginX = pillW / 2 + 10;
      const marginY = pillH / 2 + 10;
      labelContainer.position.set(
        Math.max(marginX, Math.min(app.screen.width - marginX, pt.x)),
        Math.max(marginY, Math.min(app.screen.height - marginY, pt.y)),
      );
    } else {
      labelContainer.visible = false;
    }
  };

  app.ticker.add(onTick);

  return {
    view3d,
    rig,
    setCameraPreset: (preset) => {
      bindOrbit(PRESET_POSITIONS[preset]);
    },
    setBackground: (bg) => {
      const theme = BG_THEMES[bg];
      view3d.environment = { ...theme.env };
      view3d.background = theme.bgColor;
      floorMat.baseColor = theme.floorColor;
      document.body.style.background = `#${theme.bgColor.toString(16).padStart(6, '0')}`;
    },
    setSpinEnabled: (spin) => {
      spinEnabled = spin;
      if (orbit) {
        orbit.autoRotate = spin;
      }
    },
    setIdleEnabled: (idle) => {
      idleEnabled = idle;
      if (!idle) {
        updateYuukaIdle(rig, 0);
      }
    },
    getBackendName: () => app.renderer.name,
    destroy: () => {
      app.ticker.remove(onTick);
      if (orbit) orbit.destroy();
      for (const tex of rig.textures) tex.destroy(true);
      for (const mat of rig.materials) mat.destroy();
      floorMat.destroy();
      view3d.destroy({ children: true });
      labelContainer.destroy({ children: true });
    },
  };
}
