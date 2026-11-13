# Project Status

- **Model / Agent**: Gemini 4 Hydrogen × Antigravity
- **Goal**: `$goal_score = 98/100` (from `task.md`)
- **Current Progress**: **Achieved** at **Iteration 17 / 20** — **Score: 98/100** (`src/state.ts`)
- **Build Target**: `./output/` via `npm run build` (`tsc --noEmit && vite build`)

## Verified Checks
- **WebGPU Primary Rendering**: Verified clean initialization and rendering on WebGPU (`?backend=webgpu`), plus manual fallback modal when WebGPU is unavailable (never auto-falls back).
- **WebGL2 Backend**: Verified parity across WebGL2 (`?backend=webgl`) with dual WGSL/GLSL `animeRimBit` shader (`src/materials/animeShaderBit.ts`).
- **Responsive Sizing**: Verified `900x1200` default render resolution matching CSS width/height on desktop (`>=900px`) and 1/2 CSS scaling when `window.innerWidth < 900`.
- **Multi-View & Lighting Checks**: Verified `front`, `right`, `back`, `left`, and `hero` (3/4) camera presets, studio/night background themes, and pedestal shadow grounding (`captures/iter_01`–`iter_17`, `captures/final_studio_hero.png`, `captures/final_webgl_front.png`).

## Showcase Assets (`showcase/`)
- `showcase/gemini-4-hydrogen_antigravity_pixijs3d-web_front_showcase.png`
- `showcase/gemini-4-hydrogen_antigravity_pixijs3d-web_4views_showcase.png`
- `showcase/gemini-4-hydrogen_antigravity_pixijs3d-web_showcase_4x5_1000p_60s.mp4`
