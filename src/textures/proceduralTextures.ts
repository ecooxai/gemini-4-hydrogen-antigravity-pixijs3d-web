import { Texture } from 'pixi.js';

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create 2D context');
  return [canvas, ctx];
}

function toTexture(canvas: HTMLCanvasElement, repeat = false): Texture {
  const tex = Texture.from(canvas);
  if (repeat) {
    tex.source.style.addressMode = 'repeat';
    tex.source.style.update();
  }
  return tex;
}

/**
 * Draws a crisp anime face texture (1024x1024) mapped to `buildSculptedHeadGeometry` UVs:
 * u = 0.5 is front center (+Z), v = 0 is top of head, v = 1 is chin.
 */
export function createYuukaFaceTexture(): Texture {
  const W = 1024;
  const H = 1024;
  const [canvas, ctx] = makeCanvas(W, H);

  // Warm ivory-peach anime skin base (bright enough to match soft illustration under ACES)
  ctx.fillStyle = '#fde2d6';
  ctx.fillRect(0, 0, W, H);

  // Soft forehead/jaw peach gradient for subtle anime facial depth (avoid dark chin)
  const skinGrad = ctx.createLinearGradient(0, H * 0.25, 0, H * 0.94);
  skinGrad.addColorStop(0, 'rgba(255, 240, 232, 0.35)');
  skinGrad.addColorStop(0.7, 'rgba(253, 224, 212, 0.12)');
  skinGrad.addColorStop(1, 'rgba(238, 198, 184, 0.16)');
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, W, H);

  const cx = W * 0.5;
  const eyeY = H * 0.535;
  const eyeOffsetX = W * 0.052;

  // Soft rose-peach cheek blush + delicate anime hatch lines (scaled ~0.55x horizontally for 2:1 sphere UV)
  for (const side of [-1, 1]) {
    const bx = cx + side * (eyeOffsetX + W * 0.008);
    const by = eyeY + H * 0.078;
    const blush = ctx.createRadialGradient(bx, by, 3, bx, by, 44);
    blush.addColorStop(0, 'rgba(248, 128, 142, 0.52)');
    blush.addColorStop(0.65, 'rgba(248, 154, 166, 0.22)');
    blush.addColorStop(1, 'rgba(248, 170, 180, 0.0)');
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.ellipse(bx, by, 38, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(234, 108, 124, 0.42)';
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    for (let k = -2; k <= 2; k++) {
      const hx = bx + k * 5.6;
      ctx.beginPath();
      ctx.moveTo(hx - 1.2, by - 7);
      ctx.lineTo(hx + 1.4, by + 7);
      ctx.stroke();
    }
  }

  // Expressive large round anime eyes with luminous blue-violet lower crescent (2:1 sphere UV compensated)
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeOffsetX;
    const ey = eyeY;
    const ew = 41;
    const eh = 66;

    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(side * 0.02);

    // Sclera (graceful arched upper lid for sweet sleepy-cute Blue Archive expression)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-ew, 2);
    ctx.bezierCurveTo(-ew * 0.56, -eh * 0.76, ew * 0.56, -eh * 0.76, ew, 3);
    ctx.bezierCurveTo(ew * 0.68, eh * 0.9, -ew * 0.68, eh * 0.9, -ew, 2);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Soft periwinkle eyelid shadow across upper sclera
    const scleraShadow = ctx.createLinearGradient(0, -eh * 0.7, 0, eh * 0.22);
    scleraShadow.addColorStop(0, 'rgba(176, 172, 224, 0.32)');
    scleraShadow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = scleraShadow;
    ctx.fillRect(-ew, -eh, ew * 2, eh * 1.25);

    // Rich violet-indigo iris (tall luminous anime oval)
    const irisX = -side * 1.2;
    const irisY = 6;
    const irisRx = 28.5;
    const irisRy = 49;
    const irisGrad = ctx.createLinearGradient(0, irisY - irisRy, 0, irisY + irisRy);
    irisGrad.addColorStop(0, '#201658');
    irisGrad.addColorStop(0.36, '#4b46b8');
    irisGrad.addColorStop(0.72, '#898cf5');
    irisGrad.addColorStop(1, '#dcd9ff');

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, irisRx, irisRy, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#221c50';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Inner bright crescent glow near lower iris
    const lowerGlow = ctx.createRadialGradient(irisX, irisY + 18, 1, irisX, irisY + 18, 21);
    lowerGlow.addColorStop(0, 'rgba(238, 242, 255, 0.98)');
    lowerGlow.addColorStop(0.55, 'rgba(174, 178, 255, 0.6)');
    lowerGlow.addColorStop(1, 'rgba(130, 125, 235, 0)');
    ctx.fillStyle = lowerGlow;
    ctx.beginPath();
    ctx.ellipse(irisX, irisY + 18, 18, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#18133a';
    ctx.beginPath();
    ctx.ellipse(irisX, irisY - 1, 8.2, 16.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular anime highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(irisX - 8.5, irisY - 15, 6.6, 9.4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(irisX + 8.5, irisY + 13, 3.4, 5.6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 214, 240, 0.94)';
    ctx.beginPath();
    ctx.ellipse(irisX + 9.2, irisY - 10, 2.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Thick arched upper eyelash curve with gentle outer wing
    ctx.strokeStyle = '#221d44';
    ctx.lineCap = 'round';
    ctx.lineWidth = 8.4;
    ctx.beginPath();
    ctx.moveTo(-ew * 1.04, 1);
    ctx.bezierCurveTo(-ew * 0.5, -eh * 0.8, ew * 0.5, -eh * 0.8, ew * 1.06, 2);
    ctx.stroke();

    // Outer lash flick
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(side * ew * 0.96, 1);
    ctx.lineTo(side * (ew * 1.18), -8);
    ctx.stroke();

    // Delicate double-eyelid crease
    ctx.strokeStyle = 'rgba(145, 98, 92, 0.56)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-ew * 0.66, -eh * 0.72);
    ctx.quadraticCurveTo(0, -eh * 0.94, ew * 0.72, -eh * 0.66);
    ctx.stroke();

    // Lower lash accent
    ctx.strokeStyle = 'rgba(62, 54, 96, 0.48)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-ew * 0.44, eh * 0.78);
    ctx.quadraticCurveTo(0, eh * 0.88, ew * 0.44, eh * 0.78);
    ctx.stroke();

    // Thin gentle arched eyebrow
    ctx.strokeStyle = '#2c2658';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-ew * 0.66, -eh * 1.0);
    ctx.quadraticCurveTo(0, -eh * 1.18, ew * 0.7, -eh * 0.96);
    ctx.stroke();

    ctx.restore();
  }

  // Subtle anime nose shadow dot
  ctx.fillStyle = 'rgba(202, 138, 126, 0.72)';
  ctx.beginPath();
  ctx.ellipse(cx + 0.8, eyeY + H * 0.082, 1.9, 3.8, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Delicate cute tiny curved pouty mouth matching Yuuka's expression
  const mouthY = eyeY + H * 0.136;
  ctx.fillStyle = '#da828a';
  ctx.beginPath();
  ctx.ellipse(cx, mouthY + 1.0, 4.2, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#82464f';
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(cx - 5.6, mouthY);
  ctx.quadraticCurveTo(cx, mouthY - 3.8, cx + 5.6, mouthY);
  ctx.stroke();

  return toTexture(canvas, false);
}

/**
 * Draws a cute crisp white-outlined cat face icon used on Yuuka's pajama shirt and shorts.
 */
function drawCatPrint(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Soft pastel pink inner ears
  ctx.fillStyle = '#f8c3d8';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * size * 0.26, -size * 0.34);
    ctx.lineTo(s * size * 0.56, -size * 0.68);
    ctx.lineTo(s * size * 0.62, -size * 0.22);
    ctx.closePath();
    ctx.fill();
  }

  // Crisp thick white outline + subtle light fill
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = 'rgba(224, 244, 255, 0.38)';
  ctx.lineWidth = Math.max(5, size * 0.105);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(-size * 0.62, -size * 0.18);
  ctx.lineTo(-size * 0.62, -size * 0.72);
  ctx.quadraticCurveTo(-size * 0.58, -size * 0.78, -size * 0.52, -size * 0.72);
  ctx.lineTo(-size * 0.22, -size * 0.42);
  ctx.quadraticCurveTo(0, -size * 0.46, size * 0.22, -size * 0.42);
  ctx.lineTo(size * 0.52, -size * 0.72);
  ctx.quadraticCurveTo(size * 0.58, -size * 0.78, size * 0.62, -size * 0.72);
  ctx.lineTo(size * 0.62, -size * 0.18);
  ctx.bezierCurveTo(size * 0.84, size * 0.05, size * 0.72, size * 0.58, 0, size * 0.58);
  ctx.bezierCurveTo(-size * 0.72, size * 0.58, -size * 0.84, size * 0.05, -size * 0.62, -size * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cute dot eyes & tiny pink nose
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-size * 0.24, size * 0.05, size * 0.072, 0, Math.PI * 2);
  ctx.arc(size * 0.24, size * 0.05, size * 0.072, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f8bed6';
  ctx.beginPath();
  ctx.ellipse(0, size * 0.16, size * 0.08, size * 0.058, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Tileable 1024x1024 pastel sky-blue pajama fabric texture with bold cute white cat prints.
 */
export function createPajamaPatternTexture(): Texture {
  const S = 1024;
  const [canvas, ctx] = makeCanvas(S, S);

  // Airy pastel baby-blue cotton base matching Yuuka's pajamas under ACES lighting
  ctx.fillStyle = '#b4e1fc';
  ctx.fillRect(0, 0, S, S);

  // Subtle fabric weave
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let y = 0; y < S; y += 6) {
    ctx.fillRect(0, y, S, 2);
  }
  ctx.fillStyle = 'rgba(110, 175, 225, 0.08)';
  for (let x = 0; x < S; x += 6) {
    ctx.fillRect(x, 0, 2, S);
  }

  const placements = [
    { x: 160, y: 170, s: 112, a: -0.18 },
    { x: 520, y: 130, s: 105, a: 0.22 },
    { x: 860, y: 210, s: 114, a: -0.12 },
    { x: 340, y: 470, s: 118, a: 0.15 },
    { x: 720, y: 500, s: 108, a: -0.24 },
    { x: 130, y: 780, s: 110, a: 0.2 },
    { x: 520, y: 820, s: 115, a: -0.08 },
    { x: 890, y: 810, s: 106, a: 0.25 },
  ];

  for (const p of placements) {
    for (const ox of [-S, 0, S]) {
      for (const oy of [-S, 0, S]) {
        const px = p.x + ox;
        const py = p.y + oy;
        if (px > -160 && px < S + 160 && py > -160 && py < S + 160) {
          drawCatPrint(ctx, px, py, p.s, p.a);
        }
      }
    }
  }

  return toTexture(canvas, true);
}

/**
 * Silky indigo-violet hair texture (512x512).
 */
export function createHairTexture(): Texture {
  const W = 512;
  const H = 512;
  const [canvas, ctx] = makeCanvas(W, H);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#534f98');
  grad.addColorStop(0.5, '#433f82');
  grad.addColorStop(1, '#312d62');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 240; i++) {
    const x = (i / 240) * W;
    const bright = i % 3 === 0;
    ctx.strokeStyle = bright ? 'rgba(145, 140, 222, 0.09)' : 'rgba(26, 22, 58, 0.07)';
    ctx.lineWidth = 1.5 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + ((i % 5) - 2) * 3, H);
    ctx.stroke();
  }

  const shine = ctx.createLinearGradient(0, H * 0.16, 0, H * 0.34);
  shine.addColorStop(0, 'rgba(185, 182, 248, 0)');
  shine.addColorStop(0.5, 'rgba(192, 190, 255, 0.2)');
  shine.addColorStop(1, 'rgba(185, 182, 248, 0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, H * 0.16, W, H * 0.2);

  return toTexture(canvas, true);
}

/**
 * Crisp plush white cotton pillow texture with soft cool-lavender seam/fold shading.
 */
export function createPillowTexture(): Texture {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);

  const grad = ctx.createRadialGradient(S * 0.42, S * 0.44, 30, S * 0.5, S * 0.5, S * 0.72);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.65, '#f0f4fc');
  grad.addColorStop(1, '#c4d0e8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  return toTexture(canvas, false);
}

/**
 * Soft plush white terry/fleece texture for headband and slippers.
 */
export function createPlushTexture(): Texture {
  const S = 256;
  const [canvas, ctx] = makeCanvas(S, S);
  ctx.fillStyle = '#f8faff';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) {
    const x = (i * 73) % S;
    const y = (i * 137) % S;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(205, 216, 240, 0.32)' : 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(canvas, true);
}

/**
 * Soft anime skin shading texture (512x512) adding subtle peach-rose knee/joint warmth.
 */
export function createSkinTexture(): Texture {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);

  ctx.fillStyle = '#fde0d4';
  ctx.fillRect(0, 0, S, S);

  // Subtle vertical knee/joint peach-rose tint around middle v ~ 0.48
  const kneeGlow = ctx.createRadialGradient(S * 0.25, S * 0.48, 8, S * 0.25, S * 0.48, S * 0.16);
  kneeGlow.addColorStop(0, 'rgba(242, 160, 152, 0.38)');
  kneeGlow.addColorStop(1, 'rgba(253, 224, 212, 0)');
  ctx.fillStyle = kneeGlow;
  ctx.fillRect(0, 0, S, S);

  // Delicate shin/forearm highlight along front seam u ~ 0.25
  const shinHi = ctx.createLinearGradient(S * 0.16, 0, S * 0.34, 0);
  shinHi.addColorStop(0, 'rgba(255, 245, 240, 0)');
  shinHi.addColorStop(0.5, 'rgba(255, 248, 244, 0.26)');
  shinHi.addColorStop(1, 'rgba(255, 245, 240, 0)');
  ctx.fillStyle = shinHi;
  ctx.fillRect(0, 0, S, S);

  return toTexture(canvas, false);
}
