#!/usr/bin/env node
/**
 * PawVerse 3D Autonomous Asset Generation & Download Pipeline
 *
 * Priority 1: Meshy AI / Tripo3D Official API (requires MESHY_API_KEY or TRIPO_API_KEY in env / .env)
 * Priority 2: Verified Open-Source Rigged & Animated GLB Fallback (Three.js Xbot + Khronos Fox)
 *
 * Outputs:
 *   - public/models/avatar.glb  (Target height in app: 1.65m)
 *   - public/models/pet.glb     (Target height in app: 0.65m)
 *   - public/models/manifest.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const MODELS_DIR = path.join(ROOT_DIR, 'public', 'models');

// Load simple .env if present
function loadDotEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

loadDotEnv();

const MESHY_API_KEY = process.env.MESHY_API_KEY || '';
const TRIPO_API_KEY = process.env.TRIPO_API_KEY || '';

const TARGETS = [
  {
    key: 'avatar',
    filename: 'avatar.glb',
    prompt: 'stylish friendly young metaverse human avatar wearing casual streetwear hoodie and sneakers, standing A-pose, clean topology, PBR textures',
    fallbackUrl: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb',
    fallbackSource: 'Three.js Official Examples (Mixamo Xbot Rigged Humanoid, MIT)'
  },
  {
    key: 'pet',
    filename: 'pet.glb',
    prompt: 'adorable golden shiba inu puppy dog standing happily, realistic fluffy fur texture, game-ready clean 3D model, PBR materials',
    fallbackUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb',
    fallbackSource: 'Khronos glTF Sample Assets (Rigged Animated Fox/Shiba Pet, CC-BY 4.0)'
  }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  const arrBuf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrBuf));
  return arrBuf.byteLength;
}

/** Inspect glTF 2.0 binary JSON chunk to log meshes, skins, and animation clips */
function inspectGlbMetadata(filePath) {
  const buf = fs.readFileSync(filePath);
  const magic = buf.subarray(0, 4).toString('ascii');
  if (magic !== 'glTF') return { valid: false, meshes: 0, skins: 0, animations: [] };
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.subarray(20, 20 + jsonLen).toString('utf8');
  const json = JSON.parse(jsonStr);
  return {
    valid: true,
    meshes: (json.meshes || []).length,
    skins: (json.skins || []).length,
    animations: (json.animations || []).map((a, idx) => a.name || `clip_${idx}`)
  };
}

/** Priority 1A: Meshy AI Text-to-3D Official API v2 */
async function generateWithMeshy(prompt, destPath) {
  console.log(`  [Meshy AI] Creating text-to-3d task...`);
  const createRes = await fetch('https://api.meshy.ai/openapi/v2/text-to-3d', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MESHY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mode: 'preview',
      prompt,
      art_style: 'realistic',
      should_remesh: true
    })
  });
  if (!createRes.ok) {
    throw new Error(`Meshy create failed: HTTP ${createRes.status} ${await createRes.text()}`);
  }
  const { result: taskId } = await createRes.json();
  console.log(`  [Meshy AI] Task ID: ${taskId} — polling until SUCCEEDED...`);

  for (let attempt = 1; attempt <= 60; attempt++) {
    await sleep(5000);
    const pollRes = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${MESHY_API_KEY}` }
    });
    if (!pollRes.ok) throw new Error(`Meshy poll failed: HTTP ${pollRes.status}`);
    const task = await pollRes.json();
    console.log(`  [Meshy AI] Poll #${attempt}: status=${task.status}, progress=${task.progress ?? 0}%`);
    if (task.status === 'SUCCEEDED' && task.model_urls?.glb) {
      const size = await downloadFile(task.model_urls.glb, destPath);
      return { provider: 'Meshy AI Official API', taskId, size };
    }
    if (task.status === 'FAILED' || task.status === 'EXPIRED') {
      throw new Error(`Meshy task ${task.status}: ${task.task_error?.message || 'unknown error'}`);
    }
  }
  throw new Error('Meshy AI generation timed out');
}

/** Priority 1B: Tripo3D Official OpenAPI v2 */
async function generateWithTripo(prompt, destPath) {
  console.log(`  [Tripo3D] Creating text_to_model task...`);
  const createRes = await fetch('https://api.tripo3d.ai/v2/openapi/task', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TRIPO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'text_to_model',
      prompt
    })
  });
  if (!createRes.ok) {
    throw new Error(`Tripo3D create failed: HTTP ${createRes.status} ${await createRes.text()}`);
  }
  const created = await createRes.json();
  const taskId = created.data?.task_id;
  if (!taskId) throw new Error('Tripo3D response missing task_id');
  console.log(`  [Tripo3D] Task ID: ${taskId} — polling until success...`);

  for (let attempt = 1; attempt <= 60; attempt++) {
    await sleep(5000);
    const pollRes = await fetch(`https://api.tripo3d.ai/v2/openapi/task/${taskId}`, {
      headers: { Authorization: `Bearer ${TRIPO_API_KEY}` }
    });
    if (!pollRes.ok) throw new Error(`Tripo3D poll failed: HTTP ${pollRes.status}`);
    const polled = await pollRes.json();
    const status = polled.data?.status;
    console.log(`  [Tripo3D] Poll #${attempt}: status=${status}, progress=${polled.data?.progress ?? 0}%`);
    const modelUrl = polled.data?.output?.pbr_model || polled.data?.output?.model;
    if (status === 'success' && modelUrl) {
      const size = await downloadFile(modelUrl, destPath);
      return { provider: 'Tripo3D Official API', taskId, size };
    }
    if (status === 'failed' || status === 'cancelled') {
      throw new Error(`Tripo3D task ${status}`);
    }
  }
  throw new Error('Tripo3D generation timed out');
}

async function main() {
  fs.mkdirSync(MODELS_DIR, { recursive: true });

  console.log('==============================================================');
  console.log(' PawVerse 3D Asset Generation & Auto-Integration Pipeline');
  console.log('==============================================================');
  console.log(`MESHY_API_KEY : ${MESHY_API_KEY ? 'CONFIGURED' : 'NOT SET'}`);
  console.log(`TRIPO_API_KEY : ${TRIPO_API_KEY ? 'CONFIGURED' : 'NOT SET'}`);

  const report = {
    generatedAt: new Date().toISOString(),
    blockers: [],
    assets: {}
  };

  if (!MESHY_API_KEY && !TRIPO_API_KEY) {
    const note =
      'MESHY_API_KEY / TRIPO_API_KEY 환경변수가 설정되지 않았습니다. Meshy AI 및 Tripo3D 웹 포털은 계정 로그인과 크레딧/API 키 인증이 필수이므로, 우선순위 2(오픈소스 리깅·애니메이션 내장 고퀄리티 .glb 자동 확보) 폴백 파이프라인으로 전환합니다.';
    console.log(`\n[Priority 1 Skipped] ${note}\n`);
    report.blockers.push(note);
  }

  for (const target of TARGETS) {
    const destPath = path.join(MODELS_DIR, target.filename);
    console.log(`\n▶ Processing [${target.key}] -> public/models/${target.filename}`);

    let result = null;

    // Priority 1: Meshy AI or Tripo3D API
    if (MESHY_API_KEY) {
      try {
        result = await generateWithMeshy(target.prompt, destPath);
      } catch (err) {
        const msg = `Meshy AI API 실패 (${target.key}): ${err.message}`;
        console.warn(`  ! ${msg}`);
        report.blockers.push(msg);
      }
    }
    if (!result && TRIPO_API_KEY) {
      try {
        result = await generateWithTripo(target.prompt, destPath);
      } catch (err) {
        const msg = `Tripo3D API 실패 (${target.key}): ${err.message}`;
        console.warn(`  ! ${msg}`);
        report.blockers.push(msg);
      }
    }

    // Priority 2: Verified Open-Source Rigged & Animated GLB Fallback
    if (!result) {
      console.log(`  [Priority 2 Fallback] Downloading rigged animated GLB: ${target.fallbackSource}`);
      const size = await downloadFile(target.fallbackUrl, destPath);
      result = { provider: target.fallbackSource, sourceUrl: target.fallbackUrl, size };
    }

    const meta = inspectGlbMetadata(destPath);
    console.log(
      `  ✓ Saved ${target.filename} (${(result.size / 1024).toFixed(1)} KB) | meshes=${meta.meshes}, skins=${meta.skins}, animations=[${meta.animations.join(', ')}]`
    );

    report.assets[target.key] = {
      file: `public/models/${target.filename}`,
      url: `./models/${target.filename}`,
      sizeBytes: result.size,
      provider: result.provider,
      ...meta
    };
  }

  const manifestPath = path.join(MODELS_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n✓ Manifest written to public/models/manifest.json`);
  console.log('==============================================================');
}

main().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
