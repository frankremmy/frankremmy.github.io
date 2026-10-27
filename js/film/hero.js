// The hero is a toy, like the reference's cable: drag to spin the laptop, click it to shut the lid,
// hover the link to see where it really goes. Only live while the film sits on the hero shot, and
// everything springs back as soon as the visitor scrolls on. Nothing here is needed to move on.

import * as THREE from 'three';
import { LINK } from '../screens.js';
import { ss, clamp } from './util.js';

export default function heroChapter(world) {
  const { camera, laptop } = world;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let live = false, spin = 0, vel = 0, drag = null, lid = 1, lidTarget = 1;

  // Pointer events land on the page above the canvas, so listen on the window and skip real controls.
  const busy = e => e.target.closest?.('a, button, input, textarea, select, [role="dialog"], .nav, #term, #intro');
  function hit(e) {
    ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObject(laptop.group, true)[0];
  }
  function overLink(h) {
    if (!h || h.object !== laptop.screen || !h.uv || lid < 0.9) return false;
    const [x, y] = laptop.uvToPx(h.uv);
    return x > LINK.x - 6 && x < LINK.x + LINK.w + 6 && y > LINK.y - 4 && y < LINK.y + LINK.h + 8;
  }

  addEventListener('pointerdown', e => {
    if (!live || busy(e) || !hit(e)) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
  }, { passive: true });
  addEventListener('pointermove', e => {
    if (!live) return;
    if (drag) {
      const dx = e.clientX - drag.x; drag.x = e.clientX; drag.moved += Math.abs(dx);
      vel = dx / innerWidth * 5; spin += vel;
      document.body.style.cursor = 'grabbing';
      return;
    }
    if (busy(e)) return;
    const h = hit(e), link = overLink(h);
    if (link !== world.screenState.hover) world.screenState.hover = link;
    document.body.style.cursor = link ? 'pointer' : h ? 'grab' : '';
  }, { passive: true });
  const end = e => {
    if (!drag) return;
    // A press that barely moved is a click: shut or open the lid.
    if (drag.moved < 6 && e.type === 'pointerup') lidTarget = lidTarget > 0.5 ? 0 : 1;
    drag = null; document.body.style.cursor = '';
  };
  addEventListener('pointerup', end, { passive: true });
  addEventListener('pointercancel', end, { passive: true });

  return {
    update(p, t, dt) {
      const was = live;
      live = p < 0.04;
      if (was && !live) { drag = null; world.screenState.hover = false; document.body.style.cursor = ''; }
      // Leaving the hero: spin settles to zero and the lid opens, whatever the visitor did.
      if (!live) lidTarget = 1;
      if (!drag) { spin += vel; vel *= Math.pow(0.04, dt); }
      const home = live ? 0.6 : 6;
      spin -= spin * clamp(dt * home * (Math.abs(vel) < 0.002 ? 1 : 0.2));
      laptop.group.rotation.y = spin;
      lid += (lidTarget - lid) * (1 - Math.pow(0.002, dt));
      if (Math.abs(lid - laptop.open) > 1e-4) laptop.setOpen(lid);
      // The screen wakes a beat after the lamp during the entrance.
      laptop.setBrightness(0.86 * ss(0.15, 0.6, lid) * ss(0.35, 0.7, world.enterK ?? 1));
    }
  };
}
