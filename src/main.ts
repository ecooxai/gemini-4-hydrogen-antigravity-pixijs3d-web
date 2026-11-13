import { Application, isWebGPUSupported } from 'pixi.js';
import { createScene, type SceneController } from './scene/buildScene';
import {
  CURRENT_ITERATION,
  CURRENT_SCORE,
  TOTAL_ITERATIONS,
  getEffectiveResolution,
  type BackendKind,
  type BackgroundKind,
  type CameraPreset,
  type OrientationKind,
  type ResolutionKey,
} from './state';

declare global {
  interface Window {
    __YUUKA_DEBUG__?: {
      setCameraPreset: (preset: CameraPreset) => void;
      setBackground: (bg: BackgroundKind) => void;
      setIdleEnabled: (idle: boolean) => void;
      setPaused: (paused: boolean) => void;
      getBackend: () => string;
      getResolution: () => { width: number; height: number; cssWidth: string; cssHeight: string };
    };
  }
}

(async () => {
  const viewportWrap = document.getElementById('viewport-wrap') as HTMLDivElement;
  const settingsToggle = document.getElementById('settings-toggle') as HTMLButtonElement;
  const settingsBody = document.getElementById('settings-body') as HTMLDivElement;
  const settingsArrow = document.getElementById('settings-arrow') as HTMLSpanElement;
  const backendSelect = document.getElementById('backend-select') as HTMLSelectElement;
  const resSelect = document.getElementById('res-select') as HTMLSelectElement;
  const orientSelect = document.getElementById('orient-select') as HTMLSelectElement;
  const bgSelect = document.getElementById('bg-select') as HTMLSelectElement;
  const turntableBtn = document.getElementById('turntable-btn') as HTMLButtonElement;
  const camBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-cam]'));
  const statusBadge = document.getElementById('status-badge') as HTMLDivElement;
  const webgpuModal = document.getElementById('webgpu-modal') as HTMLDivElement;
  const webgpuErrorMsg = document.getElementById('webgpu-error-msg') as HTMLParagraphElement;
  const fallbackWebglBtn = document.getElementById('fallback-webgl-btn') as HTMLButtonElement;
  const retryWebgpuBtn = document.getElementById('retry-webgpu-btn') as HTMLButtonElement;

  const params = new URLSearchParams(window.location.search);
  const queryBackend = params.get('backend');
  let activeBackend: BackendKind =
    queryBackend === 'webgl' ? 'webgl' : queryBackend === 'webgpu' ? 'webgpu' : 'webgpu';
  const queryRes = params.get('res') as ResolutionKey | null;
  let activeResKey: ResolutionKey =
    queryRes && ['900x1200', '480', '1280', '1080', '2k', '4k'].includes(queryRes) ? queryRes : '900x1200';
  let activeOrient: OrientationKind = params.get('orient') === 'landscape' ? 'landscape' : 'vertical';
  const queryBg = params.get('bg') as BackgroundKind | null;
  let activeBg: BackgroundKind =
    queryBg && ['lightblue', 'studio', 'night'].includes(queryBg) ? queryBg : 'lightblue';
  const queryCam = params.get('cam') as CameraPreset | null;
  let activePreset: CameraPreset =
    queryCam && ['front', 'right', 'back', 'left', 'hero'].includes(queryCam) ? queryCam : 'front';
  let spinOn = params.get('spin') === '1';

  backendSelect.value = activeBackend;
  resSelect.value = activeResKey;
  orientSelect.value = activeOrient;
  bgSelect.value = activeBg;
  turntableBtn.classList.toggle('active', spinOn);
  for (const b of camBtns) {
    b.classList.toggle('active', b.dataset.cam === activePreset);
  }

  const navigateWithBackend = (targetBackend: BackendKind) => {
    // Switching between WebGL2 and WebGPU requires a clean page load so @pixi/3d's
    // module-level default TextureSources aren't left destroyed by the previous renderer.
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('backend', targetBackend);
    nextUrl.searchParams.set('res', activeResKey);
    nextUrl.searchParams.set('orient', activeOrient);
    nextUrl.searchParams.set('bg', activeBg);
    nextUrl.searchParams.set('cam', activePreset);
    nextUrl.searchParams.set('spin', spinOn ? '1' : '0');
    window.location.assign(nextUrl.toString());
  };

  let app: Application | null = null;
  let scene: SceneController | null = null;

  const updateStatusBadge = (backendLabel: string) => {
    statusBadge.textContent = `Iter ${CURRENT_ITERATION} / ${TOTAL_ITERATIONS} • Score: ${CURRENT_SCORE}/100 • ${backendLabel.toUpperCase()}`;
  };

  const applyCanvasSizing = () => {
    const { width, height } = getEffectiveResolution(activeResKey, activeOrient);
    const halfScale = window.innerWidth < 900;
    const cssW = halfScale ? Math.round(width / 2) : width;
    const cssH = halfScale ? Math.round(height / 2) : height;
    if (app && app.renderer) {
      if (app.screen.width !== width || app.screen.height !== height) {
        app.renderer.resize(width, height, 1);
      }
      app.canvas.style.width = `${cssW}px`;
      app.canvas.style.height = `${cssH}px`;
    }
    viewportWrap.style.width = `${cssW}px`;
    viewportWrap.style.height = `${cssH}px`;
  };

  const destroyCurrentApp = () => {
    if (app) {
      app.ticker.stop();
    }
    if (scene) {
      scene.destroy();
      scene = null;
    }
    if (app) {
      app.destroy({ removeView: true }, { children: true });
      app = null;
    }
  };

  const initRenderer = async (backend: BackendKind) => {
    activeBackend = backend;
    backendSelect.value = backend;
    webgpuModal.classList.remove('visible');
    destroyCurrentApp();

    const { width, height } = getEffectiveResolution(activeResKey, activeOrient);
    applyCanvasSizing();

    if (backend === 'webgpu') {
      const supported = await isWebGPUSupported();
      if (!supported) {
        updateStatusBadge('WebGPU Unavailable');
        webgpuErrorMsg.textContent =
          'WebGPU is not supported or no adapter was found in this browser. Automatic fallback to WebGL is disabled—click below to switch to WebGL2.';
        webgpuModal.classList.add('visible');
        return;
      }
    }

    const nextApp = new Application();
    try {
      await nextApp.init({
        width,
        height,
        resolution: 1,
        autoDensity: false,
        antialias: true,
        backgroundColor: 0xcde8ff,
        // Array form prevents PixiJS from silently falling back to another backend
        preference: [backend],
      });
    } catch (err) {
      if (backend === 'webgpu') {
        updateStatusBadge('WebGPU Error');
        webgpuErrorMsg.textContent = `WebGPU initialization failed (${
          err instanceof Error ? err.message : String(err)
        }). Automatic fallback is disabled—click below to switch to WebGL2.`;
        webgpuModal.classList.add('visible');
        return;
      }
      throw err;
    }

    app = nextApp;
    viewportWrap.prepend(app.canvas);
    applyCanvasSizing();

    scene = createScene(app);
    scene.setBackground(activeBg);
    scene.setCameraPreset(activePreset);
    scene.setSpinEnabled(spinOn);
    updateStatusBadge(app.renderer.name);

    window.__YUUKA_DEBUG__ = {
      setCameraPreset: (preset) => {
        activePreset = preset;
        scene?.setCameraPreset(preset);
      },
      setBackground: (bg) => {
        activeBg = bg;
        scene?.setBackground(bg);
      },
      setIdleEnabled: (idle) => scene?.setIdleEnabled(idle),
      setPaused: (paused) => {
        if (!app) return;
        if (paused) {
          app.ticker.update(performance.now());
          app.ticker.stop();
        } else {
          app.ticker.start();
        }
      },
      getBackend: () => app?.renderer?.name ?? 'none',
      getResolution: () => ({
        width: app?.screen.width ?? 0,
        height: app?.screen.height ?? 0,
        cssWidth: app?.canvas.style.width ?? '0px',
        cssHeight: app?.canvas.style.height ?? '0px',
      }),
    };
  };

  // UI Listeners
  settingsToggle.addEventListener('click', () => {
    const collapsed = settingsBody.classList.toggle('collapsed');
    settingsArrow.textContent = collapsed ? '▾' : '▴';
  });

  backendSelect.addEventListener('change', () => {
    navigateWithBackend(backendSelect.value as BackendKind);
  });

  resSelect.addEventListener('change', () => {
    activeResKey = resSelect.value as ResolutionKey;
    applyCanvasSizing();
  });

  orientSelect.addEventListener('change', () => {
    activeOrient = orientSelect.value as OrientationKind;
    applyCanvasSizing();
  });

  bgSelect.addEventListener('change', () => {
    activeBg = bgSelect.value as BackgroundKind;
    scene?.setBackground(activeBg);
  });

  for (const btn of camBtns) {
    btn.addEventListener('click', () => {
      for (const b of camBtns) b.classList.remove('active');
      btn.classList.add('active');
      activePreset = btn.dataset.cam as CameraPreset;
      scene?.setCameraPreset(activePreset);
    });
  }

  turntableBtn.addEventListener('click', () => {
    spinOn = !spinOn;
    turntableBtn.classList.toggle('active', spinOn);
    scene?.setSpinEnabled(spinOn);
  });

  fallbackWebglBtn.addEventListener('click', () => {
    navigateWithBackend('webgl');
  });

  retryWebgpuBtn.addEventListener('click', () => {
    navigateWithBackend('webgpu');
  });

  window.addEventListener('resize', applyCanvasSizing);

  await initRenderer(activeBackend);
})();
