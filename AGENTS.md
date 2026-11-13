# AGENTS.md

Workspace instructions for **Hayase Yuuka (Pajama ver.) 3D** — a procedural 3D character viewer built from scratch with **PixiJS v8** (`pixi.js`) and **`@pixi/3d`**.

## Project Purpose & Constraints
- Procedural 3D anime character viewer of **Hayase Yuuka (Pajama ver.)** rendered in the browser.
- Built completely from scratch using procedural geometry, procedural Canvas 2D textures, and custom dual-backend shaders — **no external 3D models, image assets, or network textures**.
- **WebGPU is the primary backend** (`preference: ['webgpu']`), with a **manual WebGL2 fallback modal** if WebGPU is unsupported or fails to initialize. Automatic fallback is intentionally disabled.
- Switching between `webgpu` and `webgl` reloads the page with query parameters (`navigateWithBackend` in `src/main.ts`) so `@pixi/3d` module-level default `TextureSource` instances are cleanly initialized for the target renderer.

## Build & Run Commands
- `npm run dev` — Start Vite development server.
- `npm run build` — Type-check (`tsc --noEmit`) and bundle via Vite into `./output/` (`vite.config.ts` sets `base: './'`, `outDir: 'output'`, `target: 'es2022'`).
- `npm run preview` — Preview the production build locally.

## Architecture & Key Files
- `index.html` & `src/main.ts`:
  - Entry point, renderer initialization (`webgpu` default, manual `webgl` fallback modal), collapsible top-left Settings UI (Backend, Resolution, Orientation, Background, Camera presets `Front`/`Right`/`Back`/`Left`/`3/4` + `Spin`), and bottom-right status badge (`Iter X / 20 • Score: Y/100 • <BACKEND>`).
  - Default resolution is `900x1200` (`480`, `1280`, `1080`, `2k`, `4k` in vertical or landscape). Canvas render resolution matches CSS width/height (`resolution: 1`, `autoDensity: false`), and scales CSS dimensions to **1/2 when `window.innerWidth < 900`**.
  - Exposes `window.__YUUKA_DEBUG__` for automated camera, background, idle, pause, backend, and resolution verification.
- `src/state.ts`:
  - Version/iteration constants (`MODEL_DISPLAY_NAME`, `AGENT_DISPLAY_NAME`, `CURRENT_ITERATION`, `TOTAL_ITERATIONS`, `CURRENT_SCORE`) and `RESOLUTION_MAP` / `getEffectiveResolution`.
- `src/geo/mathUtils.ts` & `src/geo/sculpt.ts`:
  - `Vec3`, Bezier/Catmull-Rom curve math, smooth normal computation, and procedural mesh builders (`buildLoftGeometry`, `buildHairStrandGeometry`, `buildSculptedHeadGeometry`, `buildPillowGeometry`, `buildScallopedCuffGeometry`, `buildHairCapeGeometry`, `buildSweepTubeGeometry`).
- `src/textures/proceduralTextures.ts`:
  - Offscreen Canvas 2D texture generators (`createYuukaFaceTexture`, `createPajamaPatternTexture`, `createHairTexture`, `createPillowTexture`, `createPlushTexture`, `createSkinTexture`).
- `src/materials/animeShaderBit.ts`:
  - Dual **WGSL (`gpu`) + GLSL (`gl`)** `@pixi/3d` `ShaderBit` (`animeRimBit`) providing soft anime rim lighting and wrap-fill across both WebGPU and WebGL2.
- `src/character/buildYuuka.ts`:
  - Full procedural character rig (`buildYuukaCharacter`) and subtle idle breathing/sway animation (`updateYuukaIdle`).
- `src/scene/buildScene.ts`:
  - `View3D` studio lighting (key directional shadow light, rim light, side fill, ambient, hemisphere environment), ACES tone mapping, pedestal disc, `OrbitCamera`, background themes (`lightblue`, `studio`, `night`), and world-anchored model name badge above the halo.

## Conventions
- Keep `node_modules/`, `output/`, `captures/`, and `scratch/` untracked (per `.gitignore`).
- Preserve dual WGSL/GLSL parity whenever editing `src/materials/animeShaderBit.ts`.
