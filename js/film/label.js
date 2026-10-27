// Text cards that live in the 3D scene, drawn on a canvas. Returns a plane mesh sized in metres
// with a redraw(opts) for state changes (colour, glow).

import * as THREE from 'three';

const MONO = '"JetBrains Mono", ui-monospace, Consolas, monospace';

export function makeCard({ title, sub = '', color = '#e8eef4', height = 0.05, width = 0, bg = 0.86, size = 46 }) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  x.font = `700 ${size}px ${MONO}`;
  const tw = x.measureText(title).width;
  x.font = `500 ${size * 0.62}px ${MONO}`;
  const sw = sub ? x.measureText(sub).width : 0;
  const W = Math.ceil(width || Math.max(tw, sw) + 96), H = sub ? Math.round(size * 2.9) : Math.round(size * 1.9);
  c.width = W; c.height = H;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * W / H, height), mat);
  mesh.renderOrder = 10;
  let cur = title;
  // A new title must fit the width measured for the first one.
  function redraw({ col = color, glow = 0, strike = false, title: tt = cur } = {}) {
    cur = tt;
    x.clearRect(0, 0, W, H);
    x.fillStyle = `rgba(8,12,18,${bg})`; x.beginPath(); x.roundRect(3, 3, W - 6, H - 6, size * 0.4); x.fill();
    x.lineWidth = 3 + glow * 3; x.strokeStyle = col; x.globalAlpha = 0.45 + glow * 0.55; x.stroke(); x.globalAlpha = 1;
    x.fillStyle = col; x.fillRect(size * 0.55, size * 0.5, size * 0.18, H - size);
    x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    x.font = `700 ${size}px ${MONO}`; x.fillStyle = '#eef3f8';
    x.fillText(cur, size * 1.2, size * 1.3);
    if (strike) { x.fillStyle = col; x.fillRect(size * 1.2, size * 0.95, x.measureText(cur).width, 4); }
    if (sub) { x.font = `500 ${size * 0.62}px ${MONO}`; x.fillStyle = '#8fa0b2'; x.fillText(sub, size * 1.2, size * 2.3); }
    tex.needsUpdate = true;
  }
  redraw();
  mesh.userData.redraw = redraw;
  return mesh;
}

// A thin tube between two points that can grow from a to b (k = 0..1).
export function makeEdge(a, b, { color = '#ff4a3d', radius = 0.004, bend = 0.08, segs = 32 } = {}) {
  const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += a.distanceTo(b) * bend;
  const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
  const geo = new THREE.TubeGeometry(curve, segs, radius, 6, false);
  // No depth write, so the cards (drawn later) cover the ends instead of the line cutting their text.
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  const total = geo.index.count;
  mesh.userData.curve = curve;
  mesh.userData.grow = k => { geo.setDrawRange(0, Math.floor(total * Math.min(1, Math.max(0, k)) / 36) * 36); mesh.visible = k > 0.001; };
  mesh.userData.grow(0);
  return mesh;
}
