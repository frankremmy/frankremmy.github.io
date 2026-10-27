// Scroll-scrubbed motion for everything after the film. Every element marked [data-s] gets a CSS
// variable --e that runs 0 to 1 as it travels up the screen, so the motion follows the scroll in
// both directions. [data-pin] sections get --e across their pinned length instead. Reduced motion
// pins everything at 1.
//
//   data-s="0.6"  e goes 0 -> 1 between the element's top meeting the bottom of the screen and
//                 travelling 60% of a screen height further up (default 0.55)
//   data-pin      e = how far the section has been scrolled through while its inner part is stuck
//
// onE(el, fn) registers a callback for things CSS can't do (counting numbers, swapping a label).

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const hooks = new WeakMap();
let items = [], calm = false, queued = false;

export function onE(el, fn) { hooks.set(el, fn); }

// Split a heading into words so each can rise on its own share of --e.
export function splitWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  const words = [];
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(w => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.append(w); return; }
        const s = document.createElement('span'); s.className = 'w'; s.textContent = w; words.push(s); frag.append(s);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) walk(n);
  });
  walk(el);
  words.forEach((w, i) => w.style.setProperty('--i', i));
  el.style.setProperty('--n', words.length);
}

function measure() {
  const vh = innerHeight;
  for (const it of items) {
    const r = it.el.getBoundingClientRect();
    let e;
    if (calm) e = 1;
    else if (it.pin) e = clamp(-r.top / Math.max(1, r.height - vh));
    else { if (r.top > vh * 1.2 || r.bottom < -vh * 0.5) continue; e = clamp((vh - r.top) / (vh * it.span)); }
    if (Math.abs(e - it.e) < 0.0005) continue;
    it.e = e;
    it.el.style.setProperty('--e', e.toFixed(4));
    it.fn?.(e);
  }
}
function queue() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; measure(); }); }

// Pick up every [data-s] / [data-pin] on the page. Call again after content changes.
export function refreshScrub() {
  items = [...document.querySelectorAll('[data-s], [data-pin]')].map(el => ({
    el, pin: el.hasAttribute('data-pin'), span: +el.dataset.s || 0.55, e: -1, fn: hooks.get(el)
  }));
  queue();
}

export function initScrub(opts = {}) {
  calm = !!opts.calm;
  document.documentElement.classList.add('scrub');
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  refreshScrub();
}
