// Chapters 03 to 04: the timeline and the twist. The events that matter drop out of the core onto a
// rail in time order while a playhead sweeps along. Then the playhead runs back past the email,
// and two AuthLog lines from 40 minutes earlier light up. The attacker was already inside.

import * as THREE from 'three';
import { makeCard, makeEdge } from './label.js';
import { CORE, TIMELINE, SOURCES } from './places.js';
import { CASE } from '../content.js';
import { ss, lerp, backOut, fade } from './util.js';

const TWIST_RED = '#ff5a47';

export default function timelineChapter(world) {
  const { scene, camera } = world;
  const group = new THREE.Group(); scene.add(group);
  const { y, z, x0, x1 } = TIMELINE;
  const ev = CASE.events, n = ev.length;
  const colOf = Object.fromEntries(SOURCES.map(s => [s.name, s.color]));
  const slotX = i => lerp(x0, x1, i / (n - 1));
  const firstLater = ev.findIndex(e => !e.twist);

  // The rail, a tick per event and a stem from each tick to its card.
  const rail = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 0.3, 0.004, 0.004), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5b6b7c'), transparent: true }));
  rail.position.set((x0 + x1) / 2, y, z); group.add(rail);
  const tickGeo = new THREE.SphereGeometry(0.011, 12, 8);
  const cards = ev.map((e, i) => {
    const up = i % 2 === 0, col = e.twist ? TWIST_RED : colOf[e.src] || '#9aa8b6';
    const slot = new THREE.Vector3(slotX(i), y + (up ? 0.15 : -0.15), z);
    const card = makeCard({ title: `${e.t}  ${e.src}`, sub: e.what, color: col, height: 0.062 });
    const tick = new THREE.Mesh(tickGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(e.twist ? 2.2 : 1.3), toneMapped: false, transparent: true }));
    tick.position.set(slot.x, y, z);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.0025, 0.1, 0.0025), new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true }));
    stem.position.set(slot.x, y + (up ? 0.06 : -0.06), z);
    group.add(card, tick, stem);
    // Later events land during chapter 03; the two AuthLog lines only turn up when the playhead goes back.
    const k = i - firstLater;
    const at = e.twist ? 0.492 + (1 - i) * 0.008 : 0.372 + k * 0.0042;
    return { e, card, tick, stem, slot, at, from: CORE.clone() };
  });

  // Playhead: a bright bar with the time it's on.
  const head = new THREE.Group(); group.add(head);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.46, 0.003), new THREE.MeshBasicMaterial({ color: new THREE.Color('#dfe8f2'), toneMapped: false, transparent: true }));
  head.add(bar); head.position.set(slotX(firstLater), y, z + 0.01);
  let headTime = '';
  const headCard = makeCard({ title: '14:36:09', color: '#e8eef4', height: 0.05 });
  headCard.position.set(0, 0.29, 0); head.add(headCard);

  // The gap: an arc from the first AuthLog line over to the email, with the number on it.
  const a = cards[0].slot.clone().setY(y + 0.24), b = cards[firstLater].slot.clone().setY(y + 0.24);
  const gap = makeEdge(a, b, { color: new THREE.Color(TWIST_RED).multiplyScalar(1.8), radius: 0.003, bend: 0.5 });
  group.add(gap);
  const gapCard = makeCard({ title: '40 minutes earlier', sub: 'before the phishing email landed', color: TWIST_RED, height: 0.07 });
  gapCard.position.copy(a).lerp(b, 0.5).add(new THREE.Vector3(0, 0.3, 0)); group.add(gapCard);

  const tmp = new THREE.Vector3();
  return {
    update(p, t) {
      const vis = ss(0.37, 0.385, p) * (1 - ss(0.56, 0.6, p));
      fade(group, vis);
      if (!group.visible) return;
      for (const c of cards) {
        const k = ss(c.at, c.at + 0.018, p);
        const on = k > 0.001;
        c.card.visible = c.tick.visible = c.stem.visible = on;
        if (!on) continue;
        // Fly out of the core along a lifted arc, then settle on the slot.
        tmp.copy(c.from).lerp(c.slot, k); tmp.y += Math.sin(k * Math.PI) * 0.35;
        c.card.position.copy(tmp);
        c.card.scale.setScalar(0.5 + 0.5 * backOut(k));
        c.card.quaternion.copy(camera.quaternion);
        c.card.material.opacity = vis * k;
        c.stem.material.opacity = c.tick.material.opacity = vis * ss(0.7, 1, k);
        if (c.e.twist) {
          const g = 0.5 + 0.5 * Math.sin(t * 4 + c.slot.x * 5);
          c.tick.scale.setScalar(1 + g * 0.5 * ss(0.5, 1, k));
        }
      }
      // Forward sweep with the landing cards, then the run back for the twist.
      const fwd = ss(0.372, 0.44, p), back = ss(0.468, 0.5, p);
      const hx = lerp(lerp(slotX(firstLater), x1, fwd), x0 - 0.2, back);
      head.position.x = hx;
      // Once it has made its point the playhead steps aside for the cards.
      fade(head, vis * (1 - 0.8 * ss(0.505, 0.52, p)));
      headCard.quaternion.copy(camera.quaternion);
      const near = cards.reduce((m, c) => Math.abs(c.slot.x - hx) < Math.abs(m.slot.x - hx) ? c : m, cards[0]);
      const label = hx < x0 + 0.01 ? '13:55:22' : near.e.t;
      if (label !== headTime) { headTime = label; headCard.userData.redraw({ col: back > 0.5 ? TWIST_RED : '#e8eef4', title: label }); }
      gap.userData.grow(ss(0.502, 0.52, p));
      gapCard.visible = p > 0.508;
      gapCard.material.opacity = vis * ss(0.508, 0.52, p);
      gapCard.quaternion.copy(camera.quaternion);
    }
  };
}

