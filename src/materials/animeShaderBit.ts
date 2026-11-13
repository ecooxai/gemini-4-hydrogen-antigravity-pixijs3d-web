import type { ShaderBit } from '@pixi/3d';

/**
 * Dual-backend (WGSL + GLSL) soft anime rim + subtle wrap-fill ShaderBit.
 * Gives skin, hair, and pastel pajama fabric a warm 3A anime-figure sheen.
 */
export const animeRimBit: ShaderBit = {
  name: 'animeRim',
  bindings: {
    material: {
      rimColor: 'vec4<f32>',
      rimPower: 'f32',
      softWrap: 'f32',
    },
  },
  gpu: {
    fragment: {
      lobePostLighting: /* wgsl */ `{
        let ndv = max(dot(normal, viewDir), 0.0);
        let rim = pow(1.0 - ndv, max(material.rimPower, 1.0));
        finalColor += material.rimColor.rgb * rim * material.rimColor.a;
        finalColor += albedo * material.softWrap * (0.72 + 0.28 * (1.0 - ndv));
      }`,
    },
  },
  gl: {
    fragment: {
      lobePostLighting: /* glsl */ `{
        float ndv = max(dot(normal, viewDir), 0.0);
        float rim = pow(1.0 - ndv, max(material.rimPower, 1.0));
        finalColor += material.rimColor.rgb * rim * material.rimColor.a;
        finalColor += albedo * material.softWrap * (0.72 + 0.28 * (1.0 - ndv));
      }`,
    },
  },
};
