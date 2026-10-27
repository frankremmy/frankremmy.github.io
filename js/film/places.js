// Where things sit in the world, in metres. The laptop is at the origin, screen facing +z.
import * as THREE from 'three';
const v = (x, y, z) => new THREE.Vector3(x, y, z);

// The process tree floats just behind and above the laptop.
export const TREE = {
  explorer: v(-0.19, 0.35, -0.34),
  pdf: v(0.0, 0.47, -0.34),
  svc: v(0.21, 0.38, -0.34),
  lsass: v(0.38, 0.28, -0.34),
  c2: v(0.33, 0.6, -0.5)
};

// The SIEM core, the timeline under it, and the network around it.
export const CORE = v(0, 1.35, -1.9);
export const TIMELINE = { y: 0.42, z: -0.5, x0: -2.25, x1: 2.25 };

// Log sources for chapter 03. Sysmon comes off the laptop itself; the rest are boxes on the desk.
export const SOURCES = [
  { name: 'Windows', host: 'ByteRider · dc01 · ADCS', color: '#4aa8ff', at: v(-1.75, 0, -1.15) },
  { name: 'AuthLog', host: 'cabalssh', color: '#3ddc97', at: v(-1.25, 0, -3.35) },
  { name: 'Sysmon', host: 'ByteRider', color: '#ff5a47', at: v(0, 0.2, -0.12), laptop: true },
  { name: 'EmailProxy', host: 'mail relay', color: '#b48cff', at: v(1.3, 0, -3.3) },
  { name: 'HTTPProxy', host: 'web proxy', color: '#ffb020', at: v(1.9, 0, -1.0) }
];

// The network for chapters 05 and 06, relative to its centre. The share sits on the DC.
export const MAP = {
  centre: v(0.1, 1.5, -2.0),
  nodes: {
    atk: v(-1.25, 0.75, 0.15), dmz: v(-0.75, -0.1, 0.35), ws: v(-0.2, -0.65, 0.55),
    dc: v(0.55, 0.0, 0.0), share: v(1.0, -0.55, 0.3), ca: v(0.2, 0.75, -0.4), da: v(1.2, 0.6, -0.2)
  }
};
