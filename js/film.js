// The film. The whole scroll is one camera move through one world. Everything on screen is a
// function of p (scroll progress, 0..1) and the clock, so scrolling back plays it in reverse.
// Chapters live in js/film/*.js; each one gets the shared world and returns update(p, t, dt).

import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/addons/RoomEnvironment.js';
import { EffectComposer } from '../vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/addons/postprocessing/OutputPass.js';
import { buildLaptop } from './film/laptop.js';
import { shotAt } from './film/camera.js';
import { clamp, lerp, ss } from './film/util.js';
import heroChapter from './film/hero.js';
import screenChapter from './film/screen.js';
import threadChapter from './film/thread.js';
import treeChapter from './film/tree.js';
import logsChapter from './film/logs.js';
import timelineChapter from './film/timeline.js';
import mapChapter from './film/map.js';
import ambience from './film/ambience.js';

// Order matters only for drawing that depends on another chapter's state.
const CHAPTER_MODULES = [heroChapter, screenChapter, threadChapter, treeChapter, logsChapter, timelineChapter, mapChapter, ambience];

function woodTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const x = c.getContext('2d');
  x.fillStyle = '#2b1e16'; x.fillRect(0, 0, 1024, 1024);
  // Long grain lines with a slow wobble, then fine noise.
  for (let i = 0; i < 520; i++) {
    const y0 = Math.random() * 1024, a = 0.03 + Math.random() * 0.09, w = 0.6 + Math.random() * 2.4;
    x.strokeStyle = Math.random() < 0.5 ? `rgba(14,8,5,${a})` : `rgba(92,64,44,${a})`;
    x.lineWidth = w; x.beginPath();
    const f = 0.004 + Math.random() * 0.006, amp = 2 + Math.random() * 7, ph = Math.random() * 6;
    for (let xx = 0; xx <= 1024; xx += 16) { const y = y0 + Math.sin(xx * f + ph) * amp; xx ? x.lineTo(xx, y) : x.moveTo(xx, y); }
    x.stroke();
  }
  const img = x.getImageData(0, 0, 1024, 1024), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14); t.anisotropy = 8;
  return t;
}

// calm: for reduced motion. The film becomes a set of stills: no easing, the clock stands still, and it
// draws a few frames after each change (so the thread can settle) and then stops.
export async function createFilm(canvas, { visitor = {}, onLost, calm = false } = {}) {
  await Promise.race([document.fonts?.ready, new Promise(r => setTimeout(r, 1500))]);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: /film-p=/.test(location.search) });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); onLost?.(); });

  const scene = new THREE.Scene();
  const BG_DAY = new THREE.Color('#0b0e12'), BG_NIGHT = new THREE.Color('#04060a');
  scene.background = BG_DAY.clone();
  scene.fog = new THREE.Fog(BG_DAY.clone(), 2, 9);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 60);

  // Desk
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.62, metalness: 0.0 }));
  desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);
  // A pool of light: the desk darkens with distance from the laptop, so wide shots never show its edge.
  desk.material.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vDeskXZ;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvDeskXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vDeskXZ;')
      .replace('#include <fog_fragment>', 'gl_FragColor.rgb *= 1.0 - smoothstep(0.5, 3.2, length(vDeskXZ));\n#include <fog_fragment>');
  };

  // Lights: a warm desk lamp, a cool rim from behind, a little sky fill.
  const lamp = new THREE.SpotLight(0xffd6a8, 9, 4, 0.55, 0.85, 1.6);
  lamp.position.set(-0.55, 0.95, 0.4); lamp.target.position.set(0.02, 0, -0.03);
  lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048); lamp.shadow.bias = -0.0004; lamp.shadow.radius = 4;
  scene.add(lamp, lamp.target);
  const rim = new THREE.DirectionalLight(0x7d9cff, 0.9); rim.position.set(0.5, 0.6, -1); scene.add(rim);
  const sky = new THREE.HemisphereLight(0x9fb4ff, 0x1a120c, 0.22); scene.add(sky);

  const laptop = buildLaptop(renderer);
  scene.add(laptop.group);

  // Post: bloom only where the GPU can take it.
  const small = Math.min(innerWidth, innerHeight) < 600;
  let composer = null, bloom = null;
  if (renderer.capabilities.isWebGL2 && !small) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.0, 0.5, 1.05);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // enterK: the entrance, 0 before the intake ticket opens, 1 once the camera has settled.
  const world = { THREE, scene, camera, renderer, laptop, visitor, desk, lamp, rim, sky, enterK: /film-p=/.test(location.search) ? 1 : 0 };
  let enterAt = -1;
  const chapters = [];
  for (const load of CHAPTER_MODULES) chapters.push(await load(world));

  // ---- state ----
  let target = 0, p = 0, visible = true, running = false, last = performance.now(), settle = 0;
  const S = {}, mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    bloom?.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
  }
  resize(); addEventListener('resize', resize);

  function placeCamera(t) {
    shotAt(p, camera.aspect, S);
    mouse.sx += (mouse.x - mouse.sx) * 0.05; mouse.sy += (mouse.y - mouse.sy) * 0.05;
    // The entrance: the camera drifts in from further back and round to the side as the lamp comes on.
    const k = 1 - world.enterK, k3 = k * k * (3 - 2 * k);
    S.d *= 1 + 0.9 * k3;
    const yaw = S.yaw + mouse.sx * 0.04 + Math.sin(t * 0.13) * 0.012 + 0.55 * k3, pitch = S.pitch - mouse.sy * 0.025 + Math.sin(t * 0.17) * 0.006 + 0.12 * k3;
    camera.position.set(S.tx + S.d * Math.cos(pitch) * Math.sin(yaw), S.ty + S.d * Math.sin(pitch), S.tz + S.d * Math.cos(pitch) * Math.cos(yaw));
    camera.lookAt(S.tx, S.ty, S.tz);
    camera.fov = S.fov; camera.near = Math.max(0.005, S.d * 0.05); camera.far = S.d * 12 + 10;
    camera.updateProjectionMatrix();
    // Lens shift: slide the image so the subject sits right of centre.
    camera.projectionMatrix.elements[8] = -S.s * 2;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    // Tight enough that the desk melts into the dark before its edge shows.
    scene.fog.near = S.d * 1.6; scene.fog.far = S.d * 4.5 + 1.5;
  }

  function frame(now) {
    if (!running) return;
    const dt = calm ? 1 / 60 : Math.min(0.05, (now - last) / 1000); last = now;
    const t = calm ? 20 : now / 1000;
    p = calm ? target : p + (target - p) * (1 - Math.pow(0.0008, dt));
    // One bad value would otherwise stick for good, since each frame eases from the last.
    if (!Number.isFinite(p)) p = target;
    if (Math.abs(target - p) < 1e-5) p = target;
    const night = ss(0.235, 0.29, p) * (1 - ss(0.985, 1, p));
    world.night = night;
    scene.background.copy(BG_DAY).lerp(BG_NIGHT, night); scene.fog.color.copy(scene.background);
    lamp.intensity = lerp(9, 1.2, night); sky.intensity = lerp(0.22, 0.08, night); rim.intensity = lerp(0.9, 0.5, night);
    if (bloom) bloom.strength = lerp(0.0, 0.9, night) * (1 - ss(0.93, 0.97, p));
    if (enterAt >= 0 && world.enterK < 1) world.enterK = Math.min(1, calm ? 1 : (now - enterAt) / 4200);
    for (const c of chapters) c.update(p, t, dt);
    placeCamera(t);
    composer ? composer.render(dt) : renderer.render(scene, camera);
    if (calm && --settle <= 0) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function start() { if (running || !visible) return; running = true; last = performance.now(); requestAnimationFrame(frame); }

  return {
    setProgress(v, now = false) { if (!Number.isFinite(v)) return; target = clamp(v); if (now) p = target; settle = 40; start(); },
    setVisible(v) { visible = v; if (v) start(); else running = false; },
    // Called when the intake ticket opens.
    enter() { if (enterAt < 0) { enterAt = performance.now(); settle = 400; start(); } },
    get progress() { return p; },
    world
  };
}

