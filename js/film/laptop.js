// A plain, unbranded 13-inch laptop built from boxes, in metres. The lid hinges at the back edge;
// the screen is a canvas texture drawn by screens.js.

import * as THREE from 'three';
import { RoundedBoxGeometry } from '../../vendor/addons/RoundedBoxGeometry.js';
import { SW, SH } from '../screens.js';
import { lerp } from './util.js';

export const DIM = { w: 0.304, d: 0.215, base: 0.0115, lid: 0.006, scrW: 0.282, scrH: 0.176, scrY: 0.104 };

export function buildLaptop(renderer) {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x5a5e65, metalness: 0.8, roughness: 0.34 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, metalness: 0.2, roughness: 0.55 });
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x141518, metalness: 0.1, roughness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x060708, metalness: 0.0, roughness: 0.42, envMapIntensity: 0.25 });

  // Base
  const base = new THREE.Mesh(new RoundedBoxGeometry(DIM.w, DIM.base, DIM.d, 4, 0.005), shell);
  base.position.y = DIM.base / 2; base.castShadow = true; base.receiveShadow = true;
  g.add(base);
  const top = DIM.base + 0.0002;

  // Keyboard well and keys
  const well = new THREE.Mesh(new THREE.PlaneGeometry(0.276, 0.104), dark);
  well.rotation.x = -Math.PI / 2; well.position.set(0, top, -0.044); g.add(well);
  const rows = [14, 14, 14, 13, 12, 10], kw = 0.0158, kd = 0.0148, gap = 0.0033;
  const keys = [];
  rows.forEach((n, r) => {
    const z = -0.088 + r * (kd + gap) + (r === 0 ? 0 : 0.003);
    const h = r === 0 ? kd * 0.55 : kd;
    let widths = new Array(n).fill(kw);
    if (r === 3) { widths[0] = kw * 1.7; widths[n - 1] = kw * 2.2; }
    if (r === 4) { widths[0] = kw * 2.3; widths[n - 1] = kw * 2.5; }
    if (r === 5) { widths = [kw, kw, kw, kw * 1.2, kw * 5.6, kw * 1.2, kw, kw, kw, kw]; }
    const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    let x = -total / 2;
    widths.forEach(w => { keys.push([x + w / 2, z + h / 2, w, h]); x += w + gap; });
  });
  const keyGeo = new RoundedBoxGeometry(1, 0.0016, 1, 2, 0.0006);
  const km = new THREE.InstancedMesh(keyGeo, keyMat, keys.length);
  const m4 = new THREE.Matrix4();
  keys.forEach(([x, z, w, h], i) => { m4.makeScale(w, 1, h); m4.setPosition(x, top + 0.0008, z); km.setMatrixAt(i, m4); });
  g.add(km);

  // Trackpad
  const pad = new THREE.Mesh(new RoundedBoxGeometry(0.118, 0.0004, 0.074, 2, 0.003),
    new THREE.MeshStandardMaterial({ color: 0x34373c, metalness: 0.6, roughness: 0.25 }));
  pad.position.set(0, top, 0.058); g.add(pad);

  // Hinge and lid
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.25, 16), dark);
  hinge.rotation.z = Math.PI / 2; hinge.position.set(0, DIM.base + 0.001, -DIM.d / 2 + 0.003); g.add(hinge);
  const pivot = new THREE.Group(); pivot.position.set(0, DIM.base, -DIM.d / 2); g.add(pivot);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(DIM.w, 0.204, DIM.lid, 4, 0.0028), shell);
  lid.position.set(0, 0.102, -DIM.lid / 2); lid.castShadow = true; pivot.add(lid);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(DIM.w - 0.006, 0.198), glass);
  bezel.position.set(0, 0.102, 0.0003); pivot.add(bezel);

  // Screen
  const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const scrMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xffffff });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(DIM.scrW, DIM.scrH), scrMat);
  screen.position.set(0, DIM.scrY, 0.0006); pivot.add(screen);
  // Soft light the screen throws on the keys and the desk.
  const glow = new THREE.PointLight(0xbcd2ff, 0, 0.6, 2); glow.position.set(0, DIM.scrY, 0.06); pivot.add(glow);

  let open = 1;
  const api = {
    group: g, pivot, screen, ctx, tex, glow,
    // o: 0 closed, 1 open at about 108 degrees.
    // Closed leaves about 2 mm at the front edge for the keys.
    setOpen(o) { open = o; pivot.rotation.x = lerp(Math.PI / 2 - 0.009, -0.31, o); },
    get open() { return open; },
    draw(fn) { fn(ctx); tex.needsUpdate = true; },
    // World position of a point on the screen, given canvas pixel coordinates.
    screenPoint(u, v, out = new THREE.Vector3()) {
      out.set((u / SW - 0.5) * DIM.scrW, (0.5 - v / SH) * DIM.scrH, 0.001);
      return screen.localToWorld(out);
    },
    // Canvas pixel coordinates from a raycast uv on the screen.
    uvToPx(uv) { return [uv.x * SW, (1 - uv.y) * SH]; },
    setBrightness(b) { scrMat.color.setScalar(b); glow.intensity = 0.05 * b; }
  };
  api.setOpen(1); api.setBrightness(0.86);
  return api;
}
