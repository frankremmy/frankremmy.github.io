// The one camera move. Shots are look-at point, yaw, pitch, distance, field of view and a sideways
// lens shift (s, a fraction of the screen width) that leaves the left half free for captions.
// Keys pin shots to scroll progress; a repeated shot is a hold.

import { pchip } from './util.js';

export const SHOT = {
  // No caption on the opening shot, so the laptop sits in the middle.
  hero:   { t: [0.0, 0.07, -0.02], yaw: 0.5, pitch: 0.3, d: 1.05, fov: 30, s: 0.0 },
  screen: { t: [0.0, 0.12, -0.115], yaw: 0.06, pitch: 0.1, d: 0.64, fov: 30, s: 0.17 },
  tree:   { t: [0.08, 0.31, -0.3], yaw: -0.1, pitch: 0.1, d: 1.5, fov: 32, s: 0.2 },
  logs:   { t: [0.15, 1.0, -1.5], yaw: 0.12, pitch: 0.42, d: 7.2, fov: 34, s: 0.18 },
  land:   { t: [0.0, 0.62, -0.7], yaw: 0.1, pitch: 0.22, d: 5.6, fov: 34, s: 0.16 },
  twist:  { t: [-1.95, 0.55, -0.55], yaw: 0.04, pitch: 0.12, d: 2.4, fov: 32, s: 0.2 },
  map:    { t: [0.1, 1.5, -2.0], yaw: -0.38, pitch: 0.42, d: 6.6, fov: 34, s: 0.18 },
  map2:   { t: [0.1, 1.5, -2.0], yaw: 0.08, pitch: 0.36, d: 6.2, fov: 34, s: 0.18 },
  govern: { t: [0.1, 1.5, -2.0], yaw: 0.55, pitch: 0.5, d: 7.6, fov: 34, s: 0.18 },
  you:    { t: [0.0, 0.12, -0.115], yaw: -0.22, pitch: 0.14, d: 0.72, fov: 30, s: 0.17 },
  dive:   { t: [0.0, 0.12, -0.115], yaw: 0.0, pitch: 0.04, d: 0.06, fov: 30, s: 0.0 }
};

export const KEYS = [
  [0, 'hero'], [0.035, 'hero'], [0.09, 'screen'], [0.125, 'screen'], [0.18, 'tree'], [0.23, 'tree'],
  [0.315, 'logs'], [0.36, 'logs'], [0.42, 'land'], [0.465, 'twist'], [0.535, 'twist'], [0.6, 'map'],
  [0.7, 'map2'], [0.77, 'govern'], [0.825, 'govern'], [0.88, 'you'], [0.915, 'you'], [0.985, 'dive'], [1, 'dive']
];

const xs = KEYS.map(k => k[0]);
const curve = f => pchip(xs, KEYS.map(k => f(SHOT[k[1]])));
const C = {
  tx: curve(s => s.t[0]), ty: curve(s => s.t[1]), tz: curve(s => s.t[2]), yaw: curve(s => s.yaw),
  pitch: curve(s => s.pitch), ld: curve(s => Math.log(s.d)), fov: curve(s => s.fov), s: curve(s => s.s)
};

// Fill `out` with the camera state at progress p. Narrow screens get no lens shift and pull back so
// the subject still fits above the caption.
export function shotAt(p, aspect, out) {
  const narrow = aspect < 1;
  out.tx = C.tx(p); out.ty = C.ty(p); out.tz = C.tz(p);
  out.yaw = C.yaw(p); out.pitch = C.pitch(p);
  out.d = Math.exp(C.ld(p)) * (narrow ? 1.55 / Math.max(0.5, aspect) * 0.62 : 1);
  out.fov = C.fov(p) * (narrow ? 1.15 : 1);
  out.s = narrow ? 0 : C.s(p);
  // Phones lift the subject above the captions, but the opening shot has none, so it stays centred.
  if (narrow) out.ty -= out.d * 0.12 * Math.min(1, Math.max(0, (p - 0.02) / 0.04));
  return out;
}
