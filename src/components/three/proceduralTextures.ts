import * as THREE from 'three';

function createCanvas(size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(canvas: HTMLCanvasElement, repeatX: number, repeatY: number, isColor = true): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Warm Natural Oak Hardwood Plank Texture + Subtle Grain Bump Map */
export function createOakFloorTextures() {
  const [cCanvas, ctx] = createCanvas(512);
  const [bCanvas, bctx] = createCanvas(512);

  ctx.fillStyle = '#c89e72';
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, 512, 512);

  const plankCount = 8;
  const plankH = 512 / plankCount;
  const tones = ['#c89e72', '#bf9366', '#cfa77c', '#b98b5e', '#c59b6f', '#d2ab82', '#be9063', '#c99f74'];

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    ctx.fillStyle = tones[i % tones.length];
    ctx.fillRect(0, y, 512, plankH);

    // Subtle wood grain fibers
    for (let g = 0; g < 26; g++) {
      const gy = y + Math.random() * plankH;
      ctx.strokeStyle = g % 2 === 0 ? 'rgba(110, 68, 34, 0.14)' : 'rgba(255, 232, 200, 0.12)';
      ctx.lineWidth = 1 + Math.random() * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(170, gy + (Math.random() - 0.5) * 4, 340, gy + (Math.random() - 0.5) * 4, 512, gy);
      ctx.stroke();

      bctx.strokeStyle = g % 2 === 0 ? 'rgba(60, 60, 60, 0.25)' : 'rgba(190, 190, 190, 0.2)';
      bctx.lineWidth = 1;
      bctx.beginPath();
      bctx.moveTo(0, gy);
      bctx.lineTo(512, gy);
      bctx.stroke();
    }

    // Plank horizontal groove seam
    ctx.fillStyle = 'rgba(72, 46, 24, 0.35)';
    ctx.fillRect(0, y, 512, 2);
    bctx.fillStyle = '#202020';
    bctx.fillRect(0, y, 512, 3);

    // Staggered vertical plank end joint
    const jointX = ((i * 197 + 90) % 440) + 36;
    ctx.fillStyle = 'rgba(72, 46, 24, 0.28)';
    ctx.fillRect(jointX, y, 2, plankH);
    bctx.fillStyle = '#252525';
    bctx.fillRect(jointX, y, 2, plankH);
  }

  return {
    map: finalizeTexture(cCanvas, 3.5, 3.5, true),
    bumpMap: finalizeTexture(bCanvas, 3.5, 3.5, false)
  };
}

/** Luxury White Carrara Marble Floor Texture */
export function createMarbleFloorTextures() {
  const [cCanvas, ctx] = createCanvas(512);
  const [bCanvas, bctx] = createCanvas(512);

  ctx.fillStyle = '#eef0f2';
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#909090';
  bctx.fillRect(0, 0, 512, 512);

  // Soft marble mineral clouds
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 60 + Math.random() * 120;
    const g = ctx.createRadialGradient(x, y, 5, x, y, r);
    g.addColorStop(0, 'rgba(175, 182, 192, 0.14)');
    g.addColorStop(1, 'rgba(175, 182, 192, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  }

  // Delicate diagonal marble veins
  for (let v = 0; v < 14; v++) {
    ctx.strokeStyle = v % 3 === 0 ? 'rgba(120, 128, 140, 0.28)' : 'rgba(165, 172, 182, 0.2)';
    ctx.lineWidth = 1 + Math.random() * 2.2;
    ctx.beginPath();
    let vx = Math.random() * 512;
    let vy = 0;
    ctx.moveTo(vx, vy);
    for (let step = 0; step < 6; step++) {
      vx += (Math.random() - 0.35) * 90;
      vy += 90;
      ctx.lineTo(vx, vy);
    }
    ctx.stroke();
  }

  // Large tile grout grid (2x2)
  ctx.strokeStyle = 'rgba(140, 148, 158, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 254, 254);
  ctx.strokeRect(257, 1, 254, 254);
  ctx.strokeRect(1, 257, 254, 254);
  ctx.strokeRect(257, 257, 254, 254);

  bctx.strokeStyle = '#303030';
  bctx.lineWidth = 2;
  bctx.strokeRect(1, 1, 254, 254);
  bctx.strokeRect(257, 1, 254, 254);
  bctx.strokeRect(1, 257, 254, 254);
  bctx.strokeRect(257, 257, 254, 254);

  return {
    map: finalizeTexture(cCanvas, 3, 3, true),
    bumpMap: finalizeTexture(bCanvas, 3, 3, false)
  };
}

/** Modern Warm Terrazzo Stone Texture */
export function createTerrazzoFloorTextures() {
  const [cCanvas, ctx] = createCanvas(512);
  const [bCanvas, bctx] = createCanvas(512);

  ctx.fillStyle = '#ddd6cc';
  ctx.fillRect(0, 0, 512, 512);
  bctx.fillStyle = '#858585';
  bctx.fillRect(0, 0, 512, 512);

  const chipColors = ['#b08968', '#6b705c', '#e5989b', '#a5a58d', '#5c5552', '#f7f3ee'];
  for (let i = 0; i < 240; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    const sz = 4 + Math.random() * 11;
    ctx.fillStyle = chipColors[i % chipColors.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + sz, cy + (Math.random() - 0.5) * sz);
    ctx.lineTo(cx + sz * 0.5, cy + sz);
    ctx.closePath();
    ctx.fill();

    bctx.fillStyle = '#a0a0a0';
    bctx.fillRect(cx, cy, sz * 0.6, sz * 0.6);
  }

  return {
    map: finalizeTexture(cCanvas, 3.2, 3.2, true),
    bumpMap: finalizeTexture(bCanvas, 3.2, 3.2, false)
  };
}

/** Soft Woven Matte Fabric Texture (for Rug, Sofa & Curtains) */
export function createFabricTexture(baseHex = '#f5efe6') {
  const [canvas, ctx] = createCanvas(256);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, y, 256, 2);
  }
  for (let x = 0; x < 256; x += 4) {
    ctx.fillStyle = x % 8 === 0 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.035)';
    ctx.fillRect(x, 0, 2, 256);
  }
  return finalizeTexture(canvas, 4, 4, true);
}
