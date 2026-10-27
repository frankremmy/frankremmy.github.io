// Chapter 02: the click. The thread lands on the fake PDF, its parent shows up, it phones home, and
// the tree grows down to the credential store. Every card is a log line from the write-up.

import * as THREE from 'three';
import { makeCard, makeEdge } from './label.js';
import { TREE } from './places.js';
import { ss, backOut, fade } from './util.js';

const RED = '#ff5a47', AMBER = '#ffb020', GREY = '#9aa8b6';

export default function treeChapter(world) {
  const { scene, camera } = world;
  const group = new THREE.Group(); scene.add(group);
  const H = 0.03;
  const nodes = {
    pdf: { at: 0.162, card: makeCard({ title: 'redactedforsecurity.pdf.exe', sub: 'Sysmon 1 · 14:37:50', color: RED, height: H }) },
    explorer: { at: 0.174, card: makeCard({ title: 'explorer.exe', sub: 'parent · a double-click', color: GREY, height: H }) },
    c2: { at: 0.186, card: makeCard({ title: '35.239.148.19:8080', sub: 'Sysmon 3 · 14:37:51 · C2', color: AMBER, height: H }) },
    svc: { at: 0.2, card: makeCard({ title: '\\\\.\\pipe\\mlmmkw', sub: '4697 · 14:38:22 · SYSTEM', color: RED, height: H }) },
    lsass: { at: 0.214, card: makeCard({ title: 'lsass.exe', sub: '4663 · 14:38:28 · memory read', color: RED, height: H }) }
  };
  for (const [k, n] of Object.entries(nodes)) { n.card.position.copy(TREE[k]); group.add(n.card); }
  const edges = [
    { a: 'explorer', b: 'pdf', at: 0.172, col: GREY },
    { a: 'pdf', b: 'c2', at: 0.184, col: AMBER },
    { a: 'pdf', b: 'svc', at: 0.198, col: RED },
    { a: 'svc', b: 'lsass', at: 0.212, col: RED }
  ].map(e => { e.mesh = makeEdge(TREE[e.a], TREE[e.b], { color: new THREE.Color(e.col).multiplyScalar(1.4), radius: 0.0016, bend: 0.12 }); group.add(e.mesh); return e; });

  // The beacon: small pulses running from the payload to the C2 address, once a second-ish.
  const beaconCurve = edges[1].mesh.userData.curve;
  const pulses = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.005, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(AMBER).multiplyScalar(2.2), toneMapped: false, transparent: true }));
    group.add(m); return m;
  });

  return {
    update(p, t) {
      const vis = 1 - ss(0.25, 0.29, p);
      fade(group, vis * ss(0.155, 0.162, p));
      if (!group.visible) return;
      for (const n of Object.values(nodes)) {
        const k = ss(n.at, n.at + 0.01, p);
        n.card.visible = k > 0.001;
        n.card.scale.setScalar(0.6 + 0.4 * backOut(k));
        n.card.material.opacity = k * vis;
        n.card.quaternion.copy(camera.quaternion);
      }
      for (const e of edges) e.mesh.userData.grow(ss(e.at, e.at + 0.012, p));
      const on = ss(0.196, 0.2, p);
      pulses.forEach((m, i) => {
        const u = ((t * 0.8 + i / pulses.length) % 1);
        m.visible = on > 0; m.position.copy(beaconCurve.getPoint(u)); m.material.opacity = on * vis * Math.sin(u * Math.PI);
      });
    }
  };
}
