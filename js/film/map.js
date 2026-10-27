// Chapters 05 and 06: the map and the fix. The hosts from the write-up become a network graph and
// the attack path burns red one hop at a time, in the order the logs put it: BloodHound's burst of
// LDAP binds, the blocked ESC1 request, the one that worked, the share, the DACL edit, RDP into the
// DC. Every hop's source host is the one the write-up names. Then two control rings close around
// the graph and the red goes teal, with the lessons from the write-up pinned to the hosts.

import * as THREE from 'three';
import { makeCard, makeEdge } from './label.js';
import { MAP } from './places.js';
import { ss, lerp, backOut, fade } from './util.js';

const RED = new THREE.Color('#ff5a47'), TEAL = new THREE.Color('#3ddc97'), IDLE = new THREE.Color('#8796a5'), AMBER = new THREE.Color('#ffb020');

const NODES = {
  atk:   { title: '34.30.110.62', sub: 'attacker · outside', at: 0.592 },
  dmz:   { title: 'cabalssh', sub: 'DMZ · in since 13:55', at: 0.592 },
  ws:    { title: 'ByteRider', sub: 'workstation · foothold 14:37', at: 0.6 },
  dc:    { title: 'dc01', sub: '1,200 LDAP binds · 15:10', at: 0.62 },
  ca:    { title: 'ADCS', sub: 'ESC1 denied 15:14 · issued 15:15', at: 0.645 },
  share: { title: 'CabalFiles', sub: 'share on dc01 · enforcer · 15:18', at: 0.665 },
  da:    { title: 'Domain Admins', sub: 'enforcer added · 15:33', at: 0.69 }
};
// The network as it stood, drawn faint.
const LINKS = [['atk', 'dmz'], ['atk', 'ws'], ['dmz', 'ws'], ['ws', 'dc'], ['dmz', 'dc'], ['dc', 'ca'], ['dc', 'share'], ['ws', 'share'], ['dc', 'da'], ['dmz', 'ca']];
// The attack path, in log order. `deny` is the request the EDR stopped.
const PATH = [
  { a: 'atk', b: 'dmz', at: 0.588 },
  { a: 'atk', b: 'ws', at: 0.596 },
  { a: 'dmz', b: 'ca', at: 0.632, deny: true },
  { a: 'dmz', b: 'ca', at: 0.645, bend: -0.25 },
  { a: 'atk', b: 'share', at: 0.66, bend: 0.3 },
  { a: 'ws', b: 'da', at: 0.685 },
  { a: 'dmz', b: 'dc', at: 0.7, bend: -0.2 }
];
// What closes each hole: the write-up's lessons learned, plus LDAP signing for the unsigned binds.
const CONTROLS = {
  atk: 'Alert on mail from odd relays', ws: 'No SSH keys on desktops', dc: 'Enforce LDAP signing',
  ca: 'Audit templates, watch every issuance', da: 'Script Block Logging on'
};

export default function mapChapter(world) {
  const { scene, camera } = world;
  const group = new THREE.Group(); group.position.copy(MAP.centre); scene.add(group);
  const nodeGeo = new THREE.IcosahedronGeometry(0.075, 3), haloGeo = new THREE.RingGeometry(0.1, 0.112, 48);
  const nodes = {};
  for (const [k, d] of Object.entries(NODES)) {
    const pos = MAP.nodes[k];
    const mat = new THREE.MeshBasicMaterial({ color: IDLE.clone(), toneMapped: false, transparent: true });
    const ball = new THREE.Mesh(k === 'da' ? new THREE.OctahedronGeometry(0.1) : nodeGeo, mat);
    ball.position.copy(pos);
    const halo = new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: IDLE.clone(), toneMapped: false, transparent: true, side: THREE.DoubleSide }));
    halo.position.copy(pos);
    const card = makeCard({ title: d.title, sub: d.sub, color: '#8796a5', height: 0.13 });
    card.position.copy(pos).add(new THREE.Vector3(0, 0.19, 0));
    const ctl = CONTROLS[k] ? makeCard({ title: CONTROLS[k], color: '#3ddc97', height: 0.1 }) : new THREE.Object3D();
    ctl.position.copy(pos).add(new THREE.Vector3(0, -0.17, 0));
    group.add(ball, halo, card, ctl);
    nodes[k] = { ...d, ball, halo, card, ctl, hot: 0, lastCol: '' };
  }
  const faint = LINKS.map(([a, b]) => {
    const e = makeEdge(MAP.nodes[a], MAP.nodes[b], { color: new THREE.Color('#4a5866'), radius: 0.003, bend: 0.06 });
    e.userData.grow(1); group.add(e); return e;
  });
  const path = PATH.map(s => {
    const col = s.deny ? AMBER.clone().multiplyScalar(1.6) : RED.clone().multiplyScalar(1.6);
    const mesh = makeEdge(MAP.nodes[s.a], MAP.nodes[s.b], { color: col, radius: 0.007, bend: s.bend ?? 0.18 });
    group.add(mesh); return { ...s, mesh };
  });

  // BloodHound: 1,200 binds, drawn as a swarm of dots falling into the DC from every side. The
  // write-up gives the client IP but not the host, so the swarm has no source.
  const BURST = 90;
  const burst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ color: RED.clone().multiplyScalar(2), toneMapped: false, transparent: true }), BURST);
  burst.frustumCulled = false; group.add(burst);
  const seeds = Array.from({ length: BURST }, () => [Math.random(), new THREE.Vector3().randomDirection().multiplyScalar(0.5 + Math.random() * 0.4)]);

  // The EDR block: a shield flash on the CA.
  const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), new THREE.MeshBasicMaterial({ color: AMBER.clone().multiplyScalar(1.5), toneMapped: false, transparent: true, opacity: 0, depthWrite: false, wireframe: true }));
  shield.position.copy(MAP.nodes.ca); group.add(shield);
  const deniedCard = makeCard({ title: 'Blocked by EDR', sub: '4888 · template Administrator', color: '#ffb020', height: 0.11 });
  deniedCard.position.copy(MAP.nodes.ca).add(new THREE.Vector3(0.42, 0.05, 0)); group.add(deniedCard);

  // Governance: two rings close around the whole graph.
  const rings = [['ISO 27001 · Annex A', 1.55, 0.35], ['NIST CSF 2.0', 1.75, -0.45]].map(([name, r, tilt], i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 6, 160), new THREE.MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(1.4), toneMapped: false, transparent: true }));
    ring.rotation.set(Math.PI / 2 + tilt, 0, i * 0.6);
    const label = makeCard({ title: name, color: '#3ddc97', height: 0.14 });
    // Labels sit outside the graph, top left and bottom right, clear of the host cards.
    label.position.set(i ? 1.35 : -1.0, i ? -1.05 : 1.2, 0.2);
    group.add(ring, label); return { ring, label, r };
  });

  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), col = new THREE.Color();
  return {
    update(p, t) {
      const vis = ss(0.575, 0.6, p) * (1 - ss(0.835, 0.865, p));
      fade(group, vis);
      if (!group.visible) return;
      const fix = ss(0.765, 0.8, p);
      group.rotation.y = Math.sin(t * 0.1) * 0.05;

      for (const s of path) {
        const k = ss(s.at, s.at + 0.012, p);
        s.mesh.userData.grow(k);
        // The denied request flares and dies back.
        if (s.deny) s.mesh.material.opacity = vis * (1 - ss(s.at + 0.012, s.at + 0.022, p) * 0.75);
        else s.mesh.material.color.copy(RED).lerp(TEAL, fix).multiplyScalar(1.6);
      }
      for (const [k, n] of Object.entries(nodes)) {
        const hot = ss(n.at, n.at + 0.01, p);
        col.copy(IDLE).lerp(k === 'dmz' && p < 0.62 ? AMBER : RED, hot).lerp(TEAL, fix * hot);
        n.ball.material.color.copy(col).multiplyScalar(1 + hot * 0.8);
        n.halo.material.color.copy(col).multiplyScalar(1.3);
        n.halo.scale.setScalar(1 + hot * (0.15 + 0.1 * Math.sin(t * 3)));
        n.halo.quaternion.copy(camera.quaternion);
        n.card.quaternion.copy(camera.quaternion);
        n.card.material.opacity = vis * lerp(0.55, 1, hot);
        const key = (hot > 0.5 ? (fix > 0.5 ? 't' : 'r') : 'i');
        if (key !== n.lastCol) { n.lastCol = key; n.card.userData.redraw({ col: key === 't' ? '#3ddc97' : key === 'r' ? (k === 'dmz' && p < 0.62 ? '#ffb020' : '#ff5a47') : '#8796a5', glow: key === 'i' ? 0 : 0.6 }); }
        const c = ss(0.78 + Object.keys(NODES).indexOf(k) * 0.004, 0.795 + Object.keys(NODES).indexOf(k) * 0.004, p);
        n.ctl.visible = c > 0.01 && !!n.ctl.material; if (n.ctl.material) n.ctl.material.opacity = vis * c;
        n.ctl.scale.setScalar(0.7 + 0.3 * backOut(c));
        n.ctl.quaternion.copy(camera.quaternion);
      }
      for (const f of faint) f.material.opacity = vis * 0.6;

      const b = ss(0.612, 0.618, p) * (1 - ss(0.628, 0.636, p));
      burst.visible = b > 0.01;
      if (burst.visible) {
        seeds.forEach(([u0, dir], i) => {
          const u = (u0 + t * 1.2) % 1;
          v.copy(dir).multiplyScalar(1 - u).add(MAP.nodes.dc);
          burst.setMatrixAt(i, m4.makeTranslation(v.x, v.y, v.z));
        });
        burst.instanceMatrix.needsUpdate = true; burst.material.opacity = vis * b;
      }

      const sh = ss(0.64, 0.644, p) * (1 - ss(0.65, 0.66, p));
      shield.visible = sh > 0.01; shield.material.opacity = sh * 0.7; shield.scale.setScalar(0.8 + sh * 0.4);
      shield.rotation.y = t * 0.6;
      const dn = ss(0.642, 0.648, p) * (1 - ss(0.672, 0.68, p));
      deniedCard.visible = dn > 0.01; deniedCard.material.opacity = vis * dn; deniedCard.quaternion.copy(camera.quaternion);

      for (const [i, r] of rings.entries()) {
        const k = ss(0.752 + i * 0.01, 0.775 + i * 0.01, p);
        r.ring.visible = r.label.visible = k > 0.01;
        r.ring.scale.setScalar(lerp(2.2, 1, backOut(k)));
        r.ring.material.opacity = vis * k;
        r.ring.rotation.z += 0.002 * (i ? -1 : 1);
        r.label.material.opacity = vis * ss(0.6, 1, k);
        r.label.quaternion.copy(camera.quaternion);
      }
    }
  };
}
