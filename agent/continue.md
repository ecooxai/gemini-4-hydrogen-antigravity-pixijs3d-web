# Continue Guide for Future Agents

## 1. Read First & Branch Hygiene
- Review `AGENTS.md`, `agent/status.md`, and `task.md` before making changes.
- Before starting new iterations, archive `agent/continue.md` and `agent/status.md` into `agent/archive/` with a date suffix (e.g., `_YYYY-MM-DD`), and create/switch to a new git branch for your work.

## 2. Build & Local Preview
```bash
npm install
npm run build   # Runs tsc --noEmit && vite build -> ./output/
npm run dev     # Vite dev server for interactive inspection
```

## 3. Extending Iterations 18–20 (Optional)
- `CURRENT_ITERATION` (`17`), `TOTAL_ITERATIONS` (`20`), and `CURRENT_SCORE` (`98`) live in `src/state.ts`.
- Character sculpting and accessories live in `src/character/buildYuuka.ts` and `src/geo/sculpt.ts`; procedural textures in `src/textures/proceduralTextures.ts`; lighting and camera presets in `src/scene/buildScene.ts`.
- If editing `src/materials/animeShaderBit.ts`, keep both `gpu` (WGSL) and `gl` (GLSL) blocks synchronized.

## 4. Verifying WebGPU & WebGL2 in Headless Chromium
- Serve `./output` (or run `npm run preview` / `vite preview`) and launch headless Chromium with GPU/Vulkan flags (see `task.md` Linux section):
  ```bash
  __EGL_VENDOR_LIBRARY_FILENAMES=/usr/share/glvnd/egl_vendor.d/10_nvidia.json \
  chromium --headless=new --enable-unsafe-webgpu --ignore-gpu-blocklist \
  --enable-features=Vulkan --use-angle=gl-egl \
  "http://localhost:4173/?backend=webgpu"
  ```
- Test WebGL2 via `?backend=webgl`, and verify responsive 1/2 CSS scaling at viewport widths `< 900px`.
- Use `window.__YUUKA_DEBUG__` (defined in `src/main.ts`) to switch `setCameraPreset('front'|'right'|'back'|'left'|'hero')`, `setBackground(...)`, `setIdleEnabled(...)`, `setPaused(...)`, and inspect `getBackend()` / `getResolution()`.
