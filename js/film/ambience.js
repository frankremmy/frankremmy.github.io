// The room around the desk: a window behind it with rain on the glass and a city out of focus,
// dust turning in the lamp's beam, and a lamp that isn't quite steady. It belongs to the desk, so it
// fades out when the film goes into the dark and comes back for the last chapter.

import * as THREE from 'three';
import { ss, lerp } from './util.js';

const WINDOW_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// Light from a rainy window, falling across the desk behind the laptop: four panes with soft edges,
// the drops and their trails running down the glass showing up as moving shadows with bright rims.
const WINDOW_FS = `
precision highp float;
varying vec2 vUv;
uniform float uTime, uOpacity, uAspect;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 drops(vec2 uv, float t, float size) {
  vec2 a = vec2(uAspect * size, size), g = uv * a;
  float col = floor(g.x), sh = h21(vec2(col, 1.7));
  g.y += t * 0.18 + sh;
  vec2 id = floor(g), st = fract(g) - 0.5;
  float n = h21(id), tt = fract(t * 0.08 + n);
  float y = -sin(tt * 6.283 + sin(tt * 6.283) * 0.5) * 0.4;
  float x = (n - 0.5) * 0.6 + sin(g.y * 5.0) * 0.04;
  vec2 p = st - vec2(x, y);
  float d = length(p * vec2(1.0, 0.8));
  // Only some cells carry a drop, and sizes vary, so it never reads as a grid. Projected light is
  // soft, so the edges are wide.
  float here = step(0.55, h21(id + 11.3)), r = 0.07 + 0.08 * h21(id + 2.9);
  float drop = smoothstep(r, r * 0.25, d) * here;
  float trail = smoothstep(0.06, 0.0, abs(st.x - x)) * smoothstep(-0.02, 0.1, st.y - y) * smoothstep(0.5, 0.0, st.y - y);
  return vec2(drop, trail * here * step(0.35, n));
}
void main() {
  vec2 uv = vUv;
  // Panes: soft outer edge, dark mullion and transom.
  float edge = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x) * smoothstep(0.0, 0.08, uv.y) * smoothstep(1.0, 0.92, uv.y);
  float bars = smoothstep(0.012, 0.03, abs(uv.x - 0.5)) * smoothstep(0.012, 0.03, abs(uv.y - 0.55));
  vec2 d1 = drops(vec2(uv.x, 1.0 - uv.y), uTime, 3.2), d2 = drops(vec2(uv.x, 1.0 - uv.y) * 1.37 + 0.31, uTime * 1.15, 5.3);
  float shade = 1.0 - 0.45 * max(d1.x, d2.x * 0.8) - 0.3 * max(d1.y, d2.y * 0.7);
  float a = edge * bars * shade;
  gl_FragColor = vec4(vec3(0.42, 0.58, 1.0) * a * uOpacity, 1.0);
}`;

const DUST_VS = `
uniform float uTime, uSize;
uniform vec3 uLamp, uDir;
attribute vec3 seed;
varying float vA;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.11 * seed.x + seed.y * 6.0) * 0.06;
  p.y += mod(uTime * 0.008 * seed.z + seed.x, 1.0) * 0.18 - 0.09 + sin(uTime * 0.2 + seed.z * 9.0) * 0.02;
  p.z += cos(uTime * 0.09 * seed.y + seed.z * 6.0) * 0.06;
  // Brightest inside the lamp's cone, a faint glint outside it.
  vec3 v = normalize(p - uLamp);
  float cone = smoothstep(0.80, 0.95, dot(v, uDir));
  vA = cone;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uSize * (0.6 + seed.x * 0.8) / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const DUST_FS = `
uniform float uOpacity;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(1.0, 0.86, 0.66) * 0.9, a * vA * uOpacity);
}`;

const BEAM_VS = `varying float vH; varying vec3 vN, vV;
void main() { vH = uv.y; vec4 w = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-w.xyz); gl_Position = projectionMatrix * w; }`;
const BEAM_FS = `uniform float uOpacity; varying float vH; varying vec3 vN, vV;
void main() { float edge = pow(abs(dot(vN, vV)), 2.2); float a = edge * pow(vH, 1.6) * uOpacity; gl_FragColor = vec4(vec3(1.0, 0.84, 0.62) * a, 1.0); }`;

export default function ambience(world) {
  const { scene, lamp, renderer } = world;
  const group = new THREE.Group(); scene.add(group);

  // The window light: a patch on the desk behind and right of the laptop, skewed as if the window
  // were up and to the right. Additive, so it only ever lifts the wood.
  const W = 1.5, H = 1.0;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.ShaderMaterial({
    vertexShader: WINDOW_VS, fragmentShader: WINDOW_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uAspect: { value: W / H } }
  }));
  win.geometry.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, 0.35, 0, 0, 0));
  win.rotation.x = -Math.PI / 2; win.rotation.z = 0.35; win.position.set(0.55, 0.0015, -0.75); group.add(win);

  // Dust in a loose box around the laptop.
  const N = 420, pos = new Float32Array(N * 3), seed = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    // Seeded along the beam so most of it catches the light.
    const k = Math.random(), r = Math.sqrt(Math.random()) * Math.tan(0.5) * k * 1.1, a = Math.random() * 6.283;
    const q = lamp.position.clone().lerp(lamp.target.position, k), side = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.6, Math.sin(a) * r * 0.8);
    pos[i * 3] = q.x + side.x; pos[i * 3 + 1] = Math.max(0.02, q.y + side.y); pos[i * 3 + 2] = q.z + side.z;
    seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random();
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); dg.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
  const dir = lamp.target.position.clone().sub(lamp.position).normalize();
  const dust = new THREE.Points(dg, new THREE.ShaderMaterial({
    vertexShader: DUST_VS, fragmentShader: DUST_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: 3.2 * renderer.getPixelRatio() }, uLamp: { value: lamp.position.clone() }, uDir: { value: dir }, uOpacity: { value: 1 } }
  }));
  dust.frustumCulled = false; group.add(dust);

  // A faint beam from the lamp, open-ended cone, brighter near the lamp.
  const len = lamp.position.distanceTo(lamp.target.position) * 1.05;
  const beamGeo = new THREE.ConeGeometry(Math.tan(0.5) * len, len, 48, 1, true);
  beamGeo.translate(0, -len / 2, 0);
  const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
    vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: 0.05 } }
  }));
  beam.position.copy(lamp.position);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  group.add(beam);

  // The lamp isn't perfect: a slow breathe and, now and then, a short dip.
  let dip = 0, nextDip = 6;
  return {
    update(p, t, dt) {
      const day = 1 - (world.night || 0), on = world.enterK ?? 1;
      group.visible = day > 0.01;
      win.material.uniforms.uTime.value = t;
      win.material.uniforms.uOpacity.value = 0.16 * day * on;
      dust.material.uniforms.uTime.value = t;
      if (t > nextDip) { dip = 1; nextDip = t + 7 + Math.random() * 12; }
      dip = Math.max(0, dip - dt * 5);
      const flicker = 1 - 0.035 * Math.sin(t * 1.3) * Math.sin(t * 0.7) - 0.22 * dip * Math.abs(Math.sin(t * 60));
      // Lamp switching on during the entrance: a stutter, then steady.
      const sw = on < 0.18 ? 0 : on < 0.24 ? 0.6 : on < 0.28 ? 0.1 : ss(0.28, 0.6, on);
      lamp.intensity *= flicker * sw;
      dust.material.uniforms.uOpacity.value = day * sw * flicker;
      beam.material.uniforms.uOpacity.value = 0.05 * day * sw * flicker;
    }
  };
}
