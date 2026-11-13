export const MODEL_DISPLAY_NAME = 'Gemini 4 Hydrogen';
export const AGENT_DISPLAY_NAME = 'Antigravity';
export const CURRENT_ITERATION = 17;
export const TOTAL_ITERATIONS = 20;
export const CURRENT_SCORE = 98;

export type BackendKind = 'webgpu' | 'webgl';
export type ResolutionKey = '900x1200' | '480' | '1280' | '1080' | '2k' | '4k';
export type OrientationKind = 'vertical' | 'landscape';
export type BackgroundKind = 'lightblue' | 'studio' | 'night';
export type CameraPreset = 'front' | 'right' | 'back' | 'left' | 'hero';

export const RESOLUTION_MAP: Record<ResolutionKey, [number, number]> = {
  '900x1200': [900, 1200],
  '480': [480, 640],
  '1280': [720, 1280],
  '1080': [1080, 1920],
  '2k': [1440, 2560],
  '4k': [2160, 3840],
};

export function getEffectiveResolution(resKey: ResolutionKey, orient: OrientationKind): { width: number; height: number } {
  const [w, h] = RESOLUTION_MAP[resKey];
  if (orient === 'landscape') {
    return { width: Math.max(w, h), height: Math.min(w, h) };
  }
  return { width: Math.min(w, h), height: Math.max(w, h) };
}
