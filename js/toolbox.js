// Skills as balls in see-through buckets. Verlet circles on one 2D canvas, no physics library.
// Each ball keeps its home colour wherever it lands, so after a shake the strays show. Ball size
// and finish follow Frank's own tiers: P paid work, L lab-proven, A coursework, F early days.

import { BUCKETS } from './content.js';

const TIER = { P: { s: 1, name: 'Paid work' }, L: { s: 0.9, name: 'Lab-proven' }, A: { s: 0.8, name: 'Coursework' }, F: { s: 0.72, name: 'Early days' } };
const G = 1500, DAMP = 0.992, STEP = 1 / 60, ITER = 4, WALL = 4;
const rand = (a, b) => a + Math.random() * (b - a);

export function initToolbox(cv, tip, { calm = false } = {}) {
  const x = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, R = 20, buckets = [], segs = [], balls = [], running = false, visible = false, acc = 0, last = 0, still = 0, paid = false;

  BUCKETS.forEach((b, bi) => b.skills.forEach(([name, tier, note]) => balls.push({ name, tier, note, home: bi, x: 0, y: 0, px: 0, py: 0, r: 10, keep: 0, out: false, hop: rand(2.5, 7.5), lines: null })));

  function layout() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const cols = W < 480 ? 2 : W < 760 ? 3 : 6, rows = Math.ceil(BUCKETS.length / cols);
    const cw = W / cols, rh = H / rows, label = 44;
    buckets = BUCKETS.map((b, i) => {
      const c = i % cols, rI = Math.floor(i / cols);
      const cx = cw * (c + 0.5), y1 = rh * (rI + 1) - label, y0 = rh * rI + Math.max(24, rh * 0.16);
      const wt = cw * 0.42, wb = cw * 0.34;
      return { ...b, cx, y0, y1, wt, wb, n: 0 };
    });
    segs = [];
    for (const b of buckets) {
      segs.push([b.cx - b.wt, b.y0, b.cx - b.wb, b.y1], [b.cx - b.wb, b.y1, b.cx + b.wb, b.y1], [b.cx + b.wb, b.y1, b.cx + b.wt, b.y0]);
    }
    // Size balls so the fullest bucket still holds everything, filled about 60% deep.
    const most = Math.max(...BUCKETS.map(b => b.skills.length)), b0 = buckets[0];
    const area = (b0.wt + b0.wb) * (b0.y1 - b0.y0) * 0.62;
    R = Math.max(12, Math.min(44, Math.sqrt(area / (most * Math.PI * 1.1))));
    for (const b of balls) { b.r = R * TIER[b.tier].s; b.lines = null; }
  }

  // Pack each bucket's balls from the bottom, odd rows offset. drop lifts them up so they fall in.
  function pack(only, drop = 0) {
    for (const bk of buckets.keys()) {
      const list = balls.filter(b => b.home === bk && !b.out && (!only || only(b)));
      const B = buckets[bk];
      let row = 0, col = 0, y = B.y1 - WALL - R;
      list.forEach((b, n) => {
        const t = (y - B.y0) / (B.y1 - B.y0), half = B.wt + (B.wb - B.wt) * t - WALL - R;
        const per = Math.max(1, Math.floor((half * 2) / (R * 2)) + 1);
        if (col >= per) { col = 0; row++; y -= R * 1.75; }
        const off = row % 2 ? R : 0, span = (per - 1) * R * 2;
        b.x = Math.min(B.cx + half, B.cx - span / 2 + col * R * 2 + off) + rand(-0.5, 0.5);
        b.y = y - (drop ? drop + n * 6 : 0);
        b.px = b.x; b.py = b.y; b.keep = drop ? 1.6 : 0;
        col++;
      });
    }
  }

  function bucketAt(px, py) {
    return buckets.findIndex(B => {
      if (py < B.y0 || py > B.y1) return false;
      const t = (py - B.y0) / (B.y1 - B.y0), half = B.wt + (B.wb - B.wt) * t;
      return Math.abs(px - B.cx) < half;
    });
  }

  function step(dt) {
    for (const b of balls) {
      if (b === drag?.b || b.out) continue;
      const vx = (b.x - b.px) * DAMP, vy = (b.y - b.py) * DAMP;
      b.px = b.x; b.py = b.y; b.x += vx; b.y += vy + G * dt * dt;
      if (b.keep > 0) b.keep -= dt;
      if (!calm && !drag && (b.hop -= dt) < 0) { b.hop = rand(2.5, 7.5); b.py = b.y + rand(2, 5); b.px = b.x + rand(-1, 1); }
    }
    for (let it = 0; it < ITER; it++) {
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i]; if (a.out) continue;
        for (let j = i + 1; j < balls.length; j++) {
          const c = balls[j]; if (c.out) continue;
          const dx = c.x - a.x, dy = c.y - a.y, d2 = dx * dx + dy * dy, m = a.r + c.r;
          if (d2 >= m * m || d2 === 0) continue;
          const d = Math.sqrt(d2), k = (m - d) / d / 2;
          const ka = a === drag?.b ? 0 : c === drag?.b ? 2 : 1, kc = c === drag?.b ? 0 : a === drag?.b ? 2 : 1;
          a.x -= dx * k * ka; a.y -= dy * k * ka; c.x += dx * k * kc; c.y += dy * k * kc;
        }
      }
      for (const b of balls) {
        if (b.out || b === drag?.b) continue;
        for (const [x1, y1, x2, y2] of segs) {
          const ex = x2 - x1, ey = y2 - y1, t = Math.max(0, Math.min(1, ((b.x - x1) * ex + (b.y - y1) * ey) / (ex * ex + ey * ey)));
          const qx = x1 + ex * t, qy = y1 + ey * t, dx = b.x - qx, dy = b.y - qy, d = Math.hypot(dx, dy), m = b.r + WALL / 2;
          if (d < m && d > 0) { b.x += dx / d * (m - d); b.y += dy / d * (m - d); }
        }
        // While dropping home, stay inside the home bucket's walls so nothing lands next door.
        if (b.keep > 0) { const B = buckets[b.home], lim = B.wt - WALL - b.r; b.x = Math.max(B.cx - lim, Math.min(B.cx + lim, b.x)); }
        if (b.y > H - b.r - 2) { b.y = H - b.r - 2; }
        if (b.x < b.r) b.x = b.r; if (b.x > W - b.r) b.x = W - b.r;
        if (b.y < -400) b.y = -400;
      }
    }
  }

  // ---------- drawing ----------
  function wrap(b) {
    if (b.lines) return b.lines;
    let fs = Math.max(8, b.r * 0.36);
    const max = b.r * 1.7, words = b.name.replace(/ ([/+]) /g, ' $1 ').split(' ');
    for (; fs >= 7; fs -= 0.5) {
      x.font = `600 ${fs}px "Bricolage Grotesque", system-ui, sans-serif`;
      const lines = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width <= max || !cur) cur = t; else { lines.push(cur); cur = w; } }
      lines.push(cur);
      if (lines.length <= 3 && lines.every(l => x.measureText(l).width <= max) && lines.length * fs * 1.1 < b.r * 1.6) return (b.lines = { lines, fs });
    }
    // Nothing fit: one word per line at the smallest size beats a name running off the ball.
    return (b.lines = { lines: words, fs: Math.max(6, Math.min(7, b.r * 0.32)) });
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function drawBall(b) {
    const col = BUCKETS[b.home].color, a = b.out ? 0.28 : 1;
    x.globalAlpha = a;
    x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    let ink = '#0b0e12';
    if (b.tier === 'P') {
      const g = x.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
      g.addColorStop(0, shade(col, 1.35)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, 0.55));
      x.fillStyle = g; x.fill();
      x.beginPath(); x.arc(b.x, b.y, b.r * 0.78, Math.PI * 1.1, Math.PI * 1.45); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = b.r * 0.1; x.lineCap = 'round'; x.stroke();
    } else if (b.tier === 'L') {
      x.fillStyle = shade(col, 0.85); x.fill();
    } else if (b.tier === 'A') {
      x.fillStyle = 'rgba(11,14,18,.85)'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = col; x.stroke(); ink = col;
    } else {
      x.fillStyle = 'rgba(11,14,18,.6)'; x.fill(); x.setLineDash([3, 3]); x.lineWidth = 1.2; x.strokeStyle = shade(col, 0.7); x.stroke(); x.setLineDash([]); ink = shade(col, 0.85);
    }
    const { lines, fs } = wrap(b);
    x.font = `600 ${fs}px "Bricolage Grotesque", system-ui, sans-serif`; x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => x.fillText(l, b.x, b.y + (i - (lines.length - 1) / 2) * fs * 1.08));
    x.globalAlpha = 1;
  }
  function draw() {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    buckets.forEach(B => B.n = 0);
    for (const b of balls) { if (b.out) continue; const i = bucketAt(b.x, b.y); if (i >= 0) buckets[i].n++; }
    for (const B of buckets) {
      x.beginPath(); x.moveTo(B.cx - B.wt, B.y0); x.lineTo(B.cx - B.wb, B.y1); x.lineTo(B.cx + B.wb, B.y1); x.lineTo(B.cx + B.wt, B.y0);
      x.fillStyle = 'rgba(255,255,255,.035)'; x.fill();
      x.lineWidth = WALL; x.strokeStyle = 'rgba(255,255,255,.16)'; x.lineJoin = 'round'; x.stroke();
      x.beginPath(); x.moveTo(B.cx - B.wt * 0.86, B.y0 + 10); x.lineTo(B.cx - B.wb * 0.86, B.y1 - 10); x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 6; x.stroke();
      x.beginPath(); x.moveTo(B.cx - B.wt - 3, B.y0); x.lineTo(B.cx + B.wt + 3, B.y0); x.strokeStyle = B.color; x.lineWidth = 3; x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      x.font = '650 14px "Bricolage Grotesque", system-ui, sans-serif'; x.fillStyle = '#e8eef4'; x.fillText(B.name, B.cx, B.y1 + 20);
      x.font = '11px "JetBrains Mono", monospace'; x.fillStyle = '#8796a5'; x.fillText(`${B.n} inside`, B.cx, B.y1 + 36);
    }
    for (const b of balls) if (b.out) drawBall(b);
    for (const b of balls) if (!b.out) drawBall(b);
  }

  // ---------- loop ----------
  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.1, (t - last) / 1000 || 0); last = t; acc += dt;
    let n = 0;
    while (acc >= STEP && n < 4) { step(STEP); acc -= STEP; n++; }
    if (acc > STEP) acc = 0;
    let motion = 0; for (const b of balls) if (!b.out) motion += Math.abs(b.x - b.px) + Math.abs(b.y - b.py);
    // Lifted balls ease to a shelf along the top.
    let lifting = false;
    balls.filter(b => b.out).forEach((b, i) => {
      const per = Math.max(1, Math.floor(W / (R * 2.1))), tx = R * 1.1 + (i % per) * R * 2.1, ty = R + 6 + Math.floor(i / per) * R * 2.1;
      b.x += (tx - b.x) * 0.12; b.y += (ty - b.y) * 0.12; if (Math.abs(tx - b.x) + Math.abs(ty - b.y) > 0.5) lifting = true;
    });
    draw();
    still = motion < 0.4 && !drag && !lifting ? still + 1 : 0;
    if (calm && still > 30) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function wake() { if (running || !visible) return; running = true; still = 0; last = performance.now(); requestAnimationFrame(frame); }

  // ---------- input ----------
  let drag = null;
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const hit = (px, py) => { for (let i = balls.length - 1; i >= 0; i--) { const b = balls[i]; if (!b.out && Math.hypot(b.x - px, b.y - py) < b.r) return b; } return null; };
  cv.addEventListener('pointerdown', e => {
    const [px, py] = pos(e), b = hit(px, py); if (!b) return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    drag = { b, ox: b.x - px, oy: b.y - py, sx: px, sy: py, t: performance.now(), vx: 0, vy: 0, lx: px, ly: py };
    hideTip(); wake();
  });
  cv.addEventListener('pointermove', e => {
    const [px, py] = pos(e);
    if (!drag) { cv.style.cursor = hit(px, py) ? 'grab' : 'default'; return; }
    const d = drag; d.vx = d.vx * 0.6 + (px - d.lx) * 0.4; d.vy = d.vy * 0.6 + (py - d.ly) * 0.4; d.lx = px; d.ly = py;
    d.b.x = px + d.ox; d.b.y = py + d.oy; d.b.px = d.b.x; d.b.py = d.b.y; cv.style.cursor = 'grabbing';
  });
  const up = e => {
    if (!drag) return;
    const d = drag, [px, py] = pos(e); drag = null;
    if (Math.hypot(px - d.sx, py - d.sy) < 6 && performance.now() - d.t < 350) showTip(d.b);
    const c = v => Math.max(-40, Math.min(40, v));
    d.b.px = d.b.x - c(d.vx); d.b.py = d.b.y - c(d.vy);
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

  let tipT = 0;
  function showTip(b) {
    const B = BUCKETS[b.home];
    tip.innerHTML = `<b style="color:${B.color}">${b.name}</b><span class="tier">${B.name} · ${TIER[b.tier].name}</span><br>${b.note}`;
    tip.hidden = false;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(W - tw - 8, b.x - tw / 2)) + 'px';
    tip.style.top = Math.max(8, b.y - b.r - th - 10) + 'px';
    clearTimeout(tipT); tipT = setTimeout(hideTip, 5000);
  }
  function hideTip() { tip.hidden = true; }

  // ---------- buttons ----------
  const root = cv.closest('.sec') || document;
  root.querySelector('[data-tb="shake"]')?.addEventListener('click', () => {
    for (const b of balls) if (!b.out) { b.py = b.y + rand(9, 18); b.px = b.x + rand(-5, 5); b.keep = 0; }
    wake();
  });
  root.querySelector('[data-tb="tidy"]')?.addEventListener('click', () => { pack(null, 140); wake(); });
  const paidBtn = root.querySelector('[data-tb="paid"]');
  paidBtn?.addEventListener('click', () => {
    paid = !paid; paidBtn.setAttribute('aria-pressed', String(paid));
    paidBtn.textContent = paid ? 'Put everything back' : 'Only what I\'ve done for pay';
    if (paid) balls.forEach(b => { if (b.tier !== 'P') b.out = true; });
    else { balls.forEach(b => b.out = false); pack(null, 160); }
    wake();
  });

  // ---------- start ----------
  layout(); pack();
  for (let i = 0; i < 150; i++) step(STEP);
  draw();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); else running = false; }).observe(cv);
  new ResizeObserver(() => { const w = W, h = H; layout(); if (Math.abs(w - W) > 1 || Math.abs(h - H) > 1) { pack(b => true); for (let i = 0; i < 120; i++) step(STEP); } draw(); }).observe(cv);
  document.fonts?.ready.then(() => { balls.forEach(b => b.lines = null); draw(); });
  return { shake: () => root.querySelector('[data-tb="shake"]').click() };
}
