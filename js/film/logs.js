// Chapter 03: the logs. The camera pulls back off the desk and five sources light up, each pouring
// a stream of log particles into one SIEM core. The source cards carry how many timeline events
// each one gave up, straight from CASE.events.

import * as THREE from 'three';
import { makeCard } from './label.js';
import { CORE, SOURCES } from './places.js';
import { CASE } from '../content.js';
import { ss, fade } from './util.js';

const PER = 260;

function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export default function logsChapter(world) {
  const { scene, camera } = world;
  const group = new THREE.Group(); scene.add(group);
  const coreGroup = new THREE.Group(); coreGroup.position.copy(CORE); scene.add(coreGroup);
  world.core = coreGroup;

  // The core: a dark ball in a lattice cage, two rings turning.
  const TEAL = new THREE.Color('#3ddc97');
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 3), new THREE.MeshStandardMaterial({ color: 0x0b1116, metalness: 0.6, roughness: 0.3, emissive: TEAL, emissiveIntensity: 0.12 }));
  const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.26, 1)), new THREE.LineBasicMaterial({ color: TEAL.clone().multiplyScalar(1.5), toneMapped: false, transparent: true }));
  const ringMat = new THREE.MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(1.2), toneMapped: false, transparent: true });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.0035, 6, 96), ringMat);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.0025, 6, 96), ringMat);
  ring1.rotation.x = Math.PI / 2.4; ring2.rotation.x = Math.PI / 1.7; ring2.rotation.y = 0.5;
  coreGroup.add(ball, cage, ring1, ring2);
  const coreLight = new THREE.PointLight(TEAL, 0, 3, 1.5); coreGroup.add(coreLight);
  const coreLabel = makeCard({ title: 'SIEM', sub: 'ELK · one index per source', color: '#3ddc97', height: 0.15 });
  coreLabel.position.set(0, 0.66, 0); coreGroup.add(coreLabel);

  // Sources: a small appliance on the desk (or the laptop itself), a card, and a particle stream.
  const counts = {};
  for (const e of CASE.events) counts[e.src] = (counts[e.src] || 0) + 1;
  const tex = dotTexture();
  const box = new THREE.BoxGeometry(0.2, 0.26, 0.14);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x1a1f26, metalness: 0.5, roughness: 0.45 });
  const streams = SOURCES.map((s, i) => {
    const col = new THREE.Color(s.color);
    const from = s.at.clone();
    if (!s.laptop) {
      const unit = new THREE.Mesh(box, boxMat); unit.position.copy(s.at).setY(0.13); unit.castShadow = true; group.add(unit);
      const led = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.012), new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(2), toneMapped: false, transparent: true }));
      led.position.copy(unit.position).add(new THREE.Vector3(0, 0.08, 0.0705)); group.add(led);
      from.setY(0.28);
    }
    const n = counts[s.name] || 0;
    const card = makeCard({ title: s.name, sub: `${s.host} · ${n} event${n === 1 ? '' : 's'}`, color: s.color, height: 0.15 });
    card.position.copy(from).add(new THREE.Vector3(0, s.laptop ? 0.32 : 0.26, 0)); group.add(card);

    // Each particle rides a bezier from the source to the core, pushed sideways by a fixed offset
    // that is zero at both ends, so the stream looks like a loose river that converges.
    const ctrl = from.clone().lerp(CORE, 0.5); ctrl.y += 0.9 + i * 0.08;
    const seeds = Array.from({ length: PER }, () => ({ u: Math.random(), sp: 0.16 + Math.random() * 0.1, off: new THREE.Vector3((Math.random() - 0.5) * 0.22, (Math.random() - 0.5) * 0.16, (Math.random() - 0.5) * 0.22) }));
    const pos = new Float32Array(PER * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.PointsMaterial({ map: tex, color: col.clone().multiplyScalar(1.8), size: 0.06, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; group.add(pts);
    return { from, ctrl, seeds, pos, geo, card, at: 0.3 + i * 0.012 };
  });

  const q = new THREE.Vector3();
  function bez(a, b, c, u, out) { const k = 1 - u; return out.set(0, 0, 0).addScaledVector(a, k * k).addScaledVector(b, 2 * k * u).addScaledVector(c, u * u); }

  return {
    update(p, t, dt) {
      // The core goes once the timeline has its events; the streams and appliances go with it.
      const coreVis = ss(0.285, 0.31, p) * (1 - ss(0.43, 0.46, p));
      fade(coreGroup, coreVis);
      if (coreGroup.visible) {
        cage.rotation.y += dt * 0.25; cage.rotation.x += dt * 0.08;
        ring1.rotation.z += dt * 0.4; ring2.rotation.z -= dt * 0.28;
        const pulse = 1 + Math.sin(t * 2.2) * 0.04;
        ball.scale.setScalar(pulse);
        coreLight.intensity = coreVis * 1.2;
        coreLabel.quaternion.copy(camera.quaternion);
      }
      const vis = ss(0.29, 0.31, p) * (1 - ss(0.42, 0.45, p));
      fade(group, vis);
      if (!group.visible) return;
      for (const s of streams) {
        const on = ss(s.at, s.at + 0.03, p);
        s.card.quaternion.copy(camera.quaternion);
        s.card.material.opacity = on * vis;
        s.card.visible = on > 0.01;
        for (let j = 0; j < PER; j++) {
          const d = s.seeds[j];
          const u = (d.u + t * d.sp) % 1;
          // Before the source switches on, particles sit hidden at the source.
          const uu = j / PER < on ? u : 0;
          bez(s.from, s.ctrl, CORE, uu, q).addScaledVector(d.off, Math.sin(uu * Math.PI));
          s.pos[j * 3] = q.x; s.pos[j * 3 + 1] = uu ? q.y : -10; s.pos[j * 3 + 2] = q.z;
        }
        s.geo.attributes.position.needsUpdate = true;
      }
    }
  };
}
