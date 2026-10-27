// The red thread. One end is pinned to the link in the email; scrolling pulls the other end out
// toward the camera and on to the first node of the process tree. A Verlet rope gives it a little
// sag that tightens as you pull.

import * as THREE from 'three';
import { LINK } from '../screens.js';
import { TREE } from './places.js';
import { clamp, lerp, ss, fade } from './util.js';

const N = 36, RAD = 0.0011, SIDES = 6;

export default function threadChapter(world) {
  const { scene, laptop } = world;
  const pts = Array.from({ length: N }, () => ({ p: new THREE.Vector3(), o: new THREE.Vector3() }));

  // Tube geometry rewritten in place every frame.
  const pos = new Float32Array(N * SIDES * 3), idx = [];
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < SIDES; j++) {
    const a = i * SIDES + j, b = i * SIDES + (j + 1) % SIDES, c = a + SIDES, d = b + SIDES;
    idx.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3b2e').multiplyScalar(1.6), toneMapped: false, transparent: true });
  const rope = new THREE.Mesh(geo, mat); rope.frustumCulled = false;
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff6a5c').multiplyScalar(2), toneMapped: false, transparent: true }));
  const group = new THREE.Group(); group.add(rope, bead); scene.add(group);

  const anchor = new THREE.Vector3(), tip = new THREE.Vector3(), c1 = new THREE.Vector3(), tmp = new THREE.Vector3();
  const T = new THREE.Vector3(), Nn = new THREE.Vector3(), B = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  let alive = false;

  function bezier(a, b, c, u, out) {
    const k = 1 - u;
    return out.set(0, 0, 0).addScaledVector(a, k * k).addScaledVector(b, 2 * k * u).addScaledVector(c, u * u);
  }

  function writeTube() {
    for (let i = 0; i < N; i++) {
      const prev = pts[Math.max(0, i - 1)].p, next = pts[Math.min(N - 1, i + 1)].p;
      T.subVectors(next, prev).normalize();
      Nn.crossVectors(T, Math.abs(T.y) > 0.95 ? tmp.set(1, 0, 0) : UP).normalize();
      B.crossVectors(T, Nn);
      for (let j = 0; j < SIDES; j++) {
        const a = j / SIDES * Math.PI * 2, o = (i * SIDES + j) * 3, P = pts[i].p;
        pos[o] = P.x + (Nn.x * Math.cos(a) + B.x * Math.sin(a)) * RAD;
        pos[o + 1] = P.y + (Nn.y * Math.cos(a) + B.y * Math.sin(a)) * RAD;
        pos[o + 2] = P.z + (Nn.z * Math.cos(a) + B.z * Math.sin(a)) * RAD;
      }
    }
    geo.attributes.position.needsUpdate = true;
  }

  return {
    update(p, t, dt) {
      const vis = ss(0.05, 0.065, p) * (1 - ss(0.25, 0.29, p));
      fade(group, vis);
      if (!vis) { alive = false; return; }
      laptop.group.updateMatrixWorld(true);
      laptop.screenPoint(LINK.x + LINK.w * 0.55, LINK.y + 30, anchor);
      // The pull: out toward the camera, then up and back to the payload's node.
      const u = ss(0.055, 0.175, p);
      c1.copy(anchor).add(tmp.set(0.22, 0.12, 0.42));
      bezier(tmp.copy(anchor).add(new THREE.Vector3(0, 0, 0.01)), c1, TREE.pdf, u, tip);
      const len = anchor.distanceTo(tip) * lerp(1.1, 1.0, ss(0.07, 0.15, p)) + 0.002;
      const seg = len / (N - 1);
      if (!alive) { for (let i = 0; i < N; i++) { const k = i / (N - 1); pts[i].p.lerpVectors(anchor, tip, k); pts[i].o.copy(pts[i].p); } alive = true; }
      // Verlet with a fixed small step; the ends are pinned.
      const h = clamp(dt, 0.001, 0.033);
      for (const q of pts) { tmp.subVectors(q.p, q.o).multiplyScalar(0.96); q.o.copy(q.p); q.p.add(tmp); q.p.y -= 1.6 * h * h; }
      for (let it = 0; it < 24; it++) {
        pts[0].p.copy(anchor); pts[N - 1].p.copy(tip);
        for (let i = 0; i < N - 1; i++) {
          const a = pts[i].p, b = pts[i + 1].p; tmp.subVectors(b, a);
          const d = tmp.length() || 1e-6, k = (d - seg) / d * 0.5;
          if (i > 0) a.addScaledVector(tmp, k);
          if (i < N - 2) b.addScaledVector(tmp, -k);
        }
        for (let i = 1; i < N - 1; i++) {
          const q = pts[i].p;
          if (q.y < 0.002) q.y = 0.002;
          // Stay in front of the open lid (it leans back about 18 degrees from the hinge).
          if (q.y < 0.218) { const zf = -0.1075 - (q.y - 0.0115) * 0.32 + 0.004; if (q.z < zf && q.z > zf - 0.03) q.z = zf; }
        }
      }
      writeTube();
      bead.position.copy(tip);
      bead.scale.setScalar(1 + Math.sin(t * 5) * 0.15 * (1 - u));
    }
  };
}
