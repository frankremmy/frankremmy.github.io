// Page controller: intake ticket, the reader guess, captions on scroll, and every section after the
// film. The 3D film is loaded on top of this; if it can't run, the page still reads top to bottom.

import { PERSON, PERSONAS, CHAPTERS, CASES, ALSO, BUCKETS, WONT_CLAIM, PATH, WITNESSES, CREDS, RANKS, POSTS, FLAG_HINTS } from './content.js';
import { scanVisitor, ticketLines, store } from './visitor.js';
import { initScrub, refreshScrub, onE, splitWords } from './scrub.js';
import { initChrome } from './chrome.js';

const $ = s => document.querySelector(s);
const html = document.documentElement;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const calm = html.classList.contains('calm');
const touch = matchMedia('(hover: none) and (pointer: coarse)').matches;

// Contact details still to come from Frank. Empty means the button is hidden, never faked.
const CONTACT = { email: '', cv: '' };

// Flags for the hunt, stored as SHA-256 so view-source doesn't hand them over.
const FLAG_HASHES = [
  '9c2a8d2c170dde293efec3b104f9b53bbb24fd9255850c5feaa7de5d29104346',
  '4aee4c93548a062d32508b29620c727b6811e1932e9b6b95c60a9b179b7d1b41',
  '725a886ef468b721d140646ab8669db6b2e686cda05055d1981e24c7ddef2812',
  '027d685fe0b54f0bb6f4baae91cfaed9e9be4bc34ec971af5c2675a6a27044df',
  '17e8662d108dfe2405fb419648a63313a3af5e6edfb14ede16e1497f8572635a'
];

let V = null, persona = 'default', film = null, sound = null, chrome = null;

// ---------- sound ----------
// Browsers only allow audio after a click, tap or key. The first one anywhere starts the room tone,
// unless the visitor has muted it. The speaker button in the header mutes and unmutes, and the
// choice is remembered on this device. Scrolling alone stays silent.
let muted = store.get('fr-muted') === '1', soundLoad = null;
function loadSound() {
  soundLoad ??= import('./sound.js')
    .then(m => { sound = m.startSound({ muted }); lastP = -1; onScroll(); })
    .catch(e => { console.warn('sound', e); soundLoad = null; });
  return soundLoad;
}
function paintMute() {
  const b = $('#snd-btn'); if (!b) return;
  b.setAttribute('aria-pressed', String(muted));
  b.title = muted ? 'Sound is off. Turn it on' : 'Mute the sound';
}
function setupSound() {
  paintMute();
  $('#snd-btn')?.addEventListener('click', () => {
    muted = !muted; store.set('fr-muted', muted ? '1' : '0'); paintMute();
    if (sound) sound.setMuted(muted); else if (!muted) loadSound();
  });
  const go = e => {
    // A first press on the speaker button is the visitor choosing; let its click decide.
    if (e.target?.closest?.('#snd-btn')) return;
    ['pointerdown', 'keydown', 'touchstart'].forEach(t => removeEventListener(t, go, true));
    if (!muted) loadSound();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach(t => addEventListener(t, go, { capture: true, passive: true }));
}

// ---------- GPU name for the ticket, read from a throwaway context ----------
function gpuName() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
  } catch { return ''; }
}
function webglOK() {
  try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
}

// ---------- intake ticket ----------
// Every visit opens on the ticket, first time or not. A click or a key cuts it short, but nothing
// on screen says so. When the lids part, the film's entrance starts.
let introOpened = null;
const introDone = new Promise(r => { introOpened = r; });
async function intake(v) {
  const intro = $('#intro');
  if (html.classList.contains('no-intro')) { intro.classList.add('gone'); introOpened(); return; }
  let done = false;
  const open = () => {
    if (done) return; done = true;
    intro.classList.add('open');
    introOpened();
    setTimeout(() => intro.classList.add('gone'), 1000);
  };
  addEventListener('keydown', function k() { open(); removeEventListener('keydown', k); });
  intro.addEventListener('click', open);
  setTimeout(open, 11000);

  $('#tk-title').textContent = `Alert #${v.ticketNo} · new visitor · severity: low`;
  const body = $('#tk-body');
  const lines = [...ticketLines(v),
    '',
    `Assigned  <b>Frank</b> · status: <span class="ok">investigating</span>`,
    `Reader    <span class="guess">probably ${esc(PERSONAS[persona].label.toLowerCase())}</span> (${esc(v.why.slice(0, 2).join(', '))})`,
    '',
    '<span class="dim">Read in your browser. None of it left this page. Opening the case.</span>'];
  // Reduced motion: the whole ticket at once, a moment to read it, then open.
  if (calm) { body.innerHTML = lines.join('\n'); setTimeout(open, 3800); return; }
  const t0 = performance.now(); let shown = '';
  // Paced against the clock: 14 ms a character, 220 ms between lines, so a slow frame catches up.
  const plan = []; let at = 300;
  for (const l of lines) { const plain = l.replace(/<[^>]+>/g, ''); plan.push([at, l, plain.length]); at += plain.length * 14 + 220; }
  await new Promise(res => {
    const step = () => {
      if (done) return res();
      const t = performance.now() - t0; let out = '';
      for (const [s, l, n] of plan) {
        if (t < s) break;
        const k = Math.min(n, Math.floor((t - s) / 14));
        out += (k >= n ? l : partial(l, k)) + '\n';
      }
      if (out !== shown) { body.innerHTML = out; shown = out; }
      if (t < at) requestAnimationFrame(step); else res();
    };
    step();
  });
  setTimeout(open, 900);
}
// First k visible characters of a line that may contain tags.
function partial(l, k) {
  let out = '', n = 0, i = 0;
  const open = [];
  while (i < l.length && n < k) {
    if (l[i] === '<') {
      const j = l.indexOf('>', i), tag = l.slice(i, j + 1);
      if (tag[1] === '/') open.pop(); else open.push(tag.match(/^<(\w+)/)[1]);
      out += tag; i = j + 1; continue;
    }
    if (l[i] === '&') { const j = l.indexOf(';', i); out += l.slice(i, j + 1); i = j + 1; n++; continue; }
    out += l[i++]; n++;
  }
  return out + open.reverse().map(t => `</${t}>`).join('');
}

// ---------- persona ----------
const pick = p => p[persona] || (persona === 'skim' && p.recruiter) || p.default;

// Facts never change per reader; order and depth do.
function orderSections() {
  const main = $('.after'), ids = { recruiter: ['cases', 'creds', 'path', 'witnesses', 'skills', 'arena', 'writing', 'contact'],
    manager: ['cases', 'path', 'witnesses', 'skills', 'creds', 'arena', 'writing', 'contact'],
    engineer: ['cases', 'arena', 'skills', 'writing', 'path', 'creds', 'witnesses', 'contact'],
    skim: ['cases', 'creds', 'witnesses', 'path', 'skills', 'arena', 'writing', 'contact'],
    default: ['cases', 'skills', 'path', 'witnesses', 'arena', 'writing', 'creds', 'contact'] }[persona];
  ids.forEach((id, i) => {
    const sec = document.getElementById(id), k = sec.querySelector('.k');
    main.appendChild(sec);
    k.textContent = k.textContent.replace(/^\d+/, String(8 + i).padStart(2, '0'));
  });
}

// ---------- captions ----------
const CAPS = [];
function renderCaptions() {
  // No hero block: the film opens on the laptop alone, and the first words arrive with the hook.
  const box = $('#caps');
  const youTitle = 'This is <b>your machine.</b>';
  const parts = [];
  for (const c of CHAPTERS) {
    if (!c.p) continue;
    const h = c.counter ? `<span class="count" data-count="${c.counter}">${c.counter}</span>` : `<h2>${c.h || (c.id === 'you' ? youTitle : '')}</h2>`;
    parts.push(`<div class="cap" id="cap-${c.id}" data-in="${c.in}" data-out="${c.out}" data-at="${c.at}">
      <p class="k">${esc(c.k)}</p>${h}<p>${esc(pick(c.p))}</p>
      ${c.play ? `<button type="button" class="play" data-open-triage>${esc(c.play)} →</button>` : ''}</div>`);
  }
  box.innerHTML = parts.join('');
  CAPS.length = 0;
  box.querySelectorAll('.cap').forEach(el => CAPS.push({ el, a: +el.dataset.in, b: +el.dataset.out, count: el.querySelector('[data-count]'), at: +(el.dataset.at || 0) }));
  lastP = -1; onScroll();
}
function filmRange() { const top = $('#top'); return [top.offsetTop, top.offsetHeight - innerHeight]; }
export function goTo(p) {
  const [y0, h] = filmRange();
  scrollTo({ top: y0 + p * h, behavior: calm ? 'auto' : 'smooth' });
}
export function goToChapter(id) {
  const c = CHAPTERS.find(c => c.id === id || c.rail.toLowerCase() === id);
  if (!c) return false;
  if (c.id === 'cases') document.getElementById('cases').scrollIntoView({ behavior: 'smooth' }); else goTo(c.at);
  return true;
}

let lastP = -1, calmAt = -1;
// Where each chapter's still is taken in calm mode: late in the chapter, once everything has landed.
const STILLS = { 'cap-hook': 0.1, 'cap-click': 0.228, 'cap-logs': 0.36, 'cap-twist': 0.535, 'cap-map': 0.712, 'cap-govern': 0.825, 'cap-you': 0.905 };
function onScroll() {
  const [y0, h] = filmRange();
  const p = clamp((scrollY - y0) / h);
  if (html.classList.contains('nofilm')) {
    for (const c of CAPS) { c.el.style.cssText = ''; if (c.count) c.count.textContent = c.count.dataset.count; }
    return;
  }
  if (p === lastP) return; lastP = p;
  // Calm mode shows each chapter as a still: the film jumps to the shot of whichever caption is up.
  if (calm) { const c = [...CAPS].reverse().find(c => p >= c.a - 0.014); const snap = STILLS[c?.el.id] ?? 0; if (snap !== calmAt) { calmAt = snap; film?.setProgress(snap, true); } }
  else film?.setProgress(p);
  sound?.progress(p);
  $('.film-in').style.setProperty('--scrim', ss(0.02, 0.05, p));
  const W = 0.014;
  for (const c of CAPS) {
    const k = ss(0, 1, (p - c.a + W) / W) * (1 - ss(0, 1, (p - c.b) / W));
    const y = calm ? 0 : (1 - k) * (p < c.a + W ? 22 : -22);
    c.el.style.opacity = k;
    c.el.style.transform = innerWidth > 760 ? `translateY(calc(-50% + ${y}px))` : `translateY(${y}px)`;
    c.el.style.pointerEvents = k > 0.5 ? 'auto' : 'none';
    if (c.count) c.count.textContent = Math.round(+c.count.dataset.count * (calm ? 1 : ss(c.a, c.at, p)));
  }
  const veil = ss(0.95, 0.99, p);
  $('#veil').style.opacity = veil;
}

// ---------- sections ----------
// Everything below the film is scrubbed by scroll (see scrub.js): it moves only while you scroll,
// and scrolling back plays it backwards. CSS does the motion off --e; the hooks here do the bits
// CSS can't, like counting.
const easeOut = e => 1 - Math.pow(1 - e, 3);
const CHAIN = ['Evidence logged', 'Hash recorded', 'Timeline built', 'Findings mapped', 'Sealed'];
function renderCases() {
  $('#cases-list').innerHTML = CASES.map((c, i) => `<details class="case" data-s="0.75" style="--k:${i}">
    <summary><span class="rule" aria-hidden="true"></span><div class="bigw"><span class="big" data-up="${esc(c.big)}">${esc(c.big)}</span><span class="unit">${esc(c.unit)}</span></div>
      <div class="ttl"><h3>${esc(c.t)}</h3><span class="m">${esc(c.m)}</span>
      <span class="trail" aria-hidden="true">${CHAIN.map((s, k) => `<i style="--i:${k}">${s}</i>`).join('')}</span></div>
      <span class="plus" aria-hidden="true">+</span></summary>
    <div class="body"><div class="desc"><p>${esc(c.p)}</p><div class="tools">${c.tools.map(t => `<span>${esc(t)}</span>`).join('')}</div>
      ${c.link ? `<a class="read" href="${esc(c.link)}" target="_blank" rel="noopener">Read the write-up ↗</a>` : ''}</div></div></details>`).join('');
  // The headline number counts up with the scroll, not with a timer.
  document.querySelectorAll('.case').forEach(d => {
    const big = d.querySelector('.big'), m = big.dataset.up.match(/^(\D*)(\d+)(\D*)$/), n = m ? +m[2] : 0;
    if (n > 0) onE(d, e => { big.textContent = m[1] + Math.round(n * easeOut(clamp(e * 1.25))) + m[3]; });
  });
  $('#also').innerHTML = ALSO.map(([a, b, c], i) => `<div data-s="0.6" style="--k:${i % 3}"><b>${esc(a)}</b><strong>${esc(b)}</strong><p>${esc(c)}</p></div>`).join('');
}
function renderSkills() {
  $('#wont').innerHTML = WONT_CLAIM.map((w, i) => `<li style="--i:${i}">${esc(w)}</li>`).join('');
  $('.jar').setAttribute('data-s', '0.7');
  $('#skills-sr').innerHTML = BUCKETS.map(b => `<li>${esc(b.name)}: ${b.skills.map(s => esc(s[0])).join(', ')}</li>`).join('');
}
// Countries only. Before 2025 the work was done from Nigeria; the 2025 job was remote; the MSc is in Malta.
const PATH_PLACE = y => +y < 2025 ? 'Nigeria' : +y === 2025 ? 'Remote' : 'Malta';
function renderPath() {
  const sec = $('#path');
  sec.setAttribute('data-pin', '');
  $('#path-log').innerHTML = PATH.map((r, i) => `<li class="${r.st === 'Now' ? 'now' : ''}" style="--i:${i}">
    <div class="ln">[${esc(r.y)}] <span class="st">${esc(r.st.toLowerCase())}</span></div>
    <h3>${esc(r.h)}</h3><div class="o">${esc(r.o)}</div><p>${esc(r.p)}</p></li>`).join('');
  sec.style.setProperty('--rows', PATH.length);
  // While the section is stuck, one entry at a time takes the stage; a big year and country sit
  // beside it and flip as the entries pass.
  const yr = $('#path-yr'), pl = $('#path-pl'), rows = [...sec.querySelectorAll('#path-log li')];
  onE(sec, e => {
    const f = e * (PATH.length - 1);
    const i = Math.round(f);
    const y = PATH[i].y, place = PATH_PLACE(y);
    if (yr.textContent !== y) yr.textContent = y;
    if (pl.textContent !== place) pl.textContent = place;
    sec.style.setProperty('--f', f.toFixed(4));
    rows.forEach((r, k) => { r.style.setProperty('--d', (k - f).toFixed(4)); r.style.setProperty('--a', Math.abs(k - f).toFixed(4)); });
  });
}
function renderWitnesses() {
  const sec = $('#witnesses');
  sec.setAttribute('data-pin', '');
  $('#wits').innerHTML = WITNESSES.map((w, i) => `<figure class="wit" style="--i:${i}"><span class="no">Statement ${String(i + 1).padStart(2, '0')} of ${String(WITNESSES.length).padStart(2, '0')}</span>
    <blockquote>"${esc(w.q)}"</blockquote><figcaption>${esc(w.n)}<span>${esc(w.r)}</span></figcaption></figure>`).join('');
  // The statements slide past sideways while the section is stuck. The track's travel is measured,
  // because card widths change with the screen.
  const track = $('#wits');
  const fit = () => sec.style.setProperty('--travel', Math.max(0, track.scrollWidth - track.clientWidth) + 'px');
  requestAnimationFrame(fit); addEventListener('resize', fit);
}
function renderCreds() {
  $('#ranks').innerHTML = RANKS.map((r, i) => `<div class="rank" data-s="0.7" style="--k:${i}"><div class="n" data-n="${esc(r.n)}">${esc(r.n)}</div><h3>${esc(r.h)}</h3><p>${esc(r.p)}</p></div>`).join('');
  // Placings count down to where they finished, like a leaderboard settling.
  document.querySelectorAll('.rank').forEach(el => {
    const n = el.querySelector('.n'), m = n.dataset.n.match(/^(\D*)(\d+)(\D*)$/);
    if (!m) return;
    const end = +m[2], start = end < 50 ? 99 : 999;
    onE(el, e => { n.textContent = m[1] + Math.round(start + (end - start) * easeOut(clamp(e * 1.2))) + m[3]; });
  });
  $('#creds-list').innerHTML = CREDS.map((c, i) => `<button type="button" class="cred ${c.pend ? 'pend' : ''} ${c.past ? 'past' : ''}" data-s="0.6" style="--k:${i % 4}" aria-label="${esc(c.h)}, ${esc(c.m)}. Flip for details.">
    <div class="in"><div class="f"><span class="seal">${c.seal}</span><h3>${esc(c.h)}</h3><span class="m">${esc(c.m)}</span></div>
    <div class="bk">${esc(c.back)}</div></div></button>`).join('');
  document.querySelectorAll('.cred').forEach(b => {
    b.addEventListener('click', () => b.classList.toggle('flip'));
    if (touch || calm) return;
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 14 + 'deg'); b.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 14 + 'deg'); });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--rx', '0deg'); b.style.setProperty('--ry', '0deg'); });
  });
}
// Furniture every section shares: kicker, headline (word by word), lede. Plus arena cards and the
// contact buttons.
function scrubFurniture() {
  document.querySelectorAll('.sec').forEach(sec => {
    sec.querySelectorAll('.k, h2, .lede, .tb-tools, .also-h').forEach(el => {
      if (el.closest('.case, .wit, .ar')) return;
      if (el.tagName === 'H2') splitWords(el);
      el.setAttribute('data-s', el.tagName === 'H2' ? '0.5' : '0.45');
    });
  });
  document.querySelectorAll('.ar').forEach((a, i) => { a.setAttribute('data-s', '0.7'); a.style.setProperty('--k', i); });
  document.querySelectorAll('.ct-row > *').forEach((a, i) => { a.setAttribute('data-s', '0.5'); a.style.setProperty('--k', i); });
}
function renderContact() {
  const L = PERSON.links, items = [];
  items.push(`<a class="main" href="${L.linkedin}" target="_blank" rel="noopener">Message me on LinkedIn</a>`);
  if (CONTACT.email) items.push(`<a href="mailto:${CONTACT.email}">${CONTACT.email}</a>`, `<button type="button" data-copy="${CONTACT.email}">Copy email</button>`);
  if (CONTACT.cv) items.push(`<a href="${CONTACT.cv}" download>Download the CV</a>`);
  items.push(`<a href="${L.github}" target="_blank" rel="noopener">GitHub</a>`, `<a href="${L.blog}" target="_blank" rel="noopener">The blog</a>`);
  $('#ct-row').innerHTML = items.join('');
  $('#ct-row').addEventListener('click', e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    navigator.clipboard?.writeText(b.dataset.copy).then(() => { b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy email', 1500); });
  });
  $('#yr').textContent = new Date().getFullYear();
}

// Posts come from the blog's public API, only once the section is near the screen.
async function loadPosts() {
  const list = $('#posts');
  const show = (posts, live) => {
    list.innerHTML = posts.map((p, i) => `<li data-s="0.5" style="--k:${i}"><a href="${esc(p.url)}" target="_blank" rel="noopener"><time datetime="${esc(p.date)}">${new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time><b>${esc(p.title)}</b></a></li>`).join('');
    $('#writing-src').textContent = live ? 'Pulled from the blog when you scrolled here.' : 'The blog didn\'t answer, so here are the last posts I knew about.';
    refreshScrub();
  };
  show(POSTS, false);
  try {
    const r = await fetch('https://public-api.wordpress.com/rest/v1.1/sites/frankremmy.wordpress.com/posts/?number=6&fields=title,URL,date', { referrerPolicy: 'no-referrer', credentials: 'omit' });
    if (!r.ok) return;
    const j = await r.json();
    const tmp = document.createElement('textarea');
    const posts = (j.posts || []).map(p => { tmp.innerHTML = p.title; return { title: tmp.value, url: p.URL, date: p.date }; });
    if (posts.length) show(posts, true);
  } catch {}
}

// ---------- flags ----------
async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function gotFlags() { try { return JSON.parse(store.get('fr-flags') || '[]'); } catch { return []; } }
export async function checkFlag(f) {
  f = String(f || '').trim();
  const i = FLAG_HASHES.indexOf(await sha256(f));
  if (i < 0) return { ok: false };
  const got = gotFlags(); if (!got.includes(i)) got.push(i);
  store.set('fr-flags', JSON.stringify(got));
  const vals = JSON.parse(store.get('fr-flagv') || '{}'); vals[i] = f; store.set('fr-flagv', JSON.stringify(vals));
  renderFlags();
  let code = null;
  if (got.length === FLAG_HASHES.length) code = 'CASE-' + (await sha256([0, 1, 2, 3, 4].map(k => vals[k]).join(''))).slice(0, 8).toUpperCase();
  return { ok: true, n: i + 1, count: got.length, code };
}
function renderFlags() {
  const got = gotFlags();
  $('#flag-list').innerHTML = FLAG_HINTS.map((h, i) => `<li class="${got.includes(i) ? 'got' : ''}">${got.includes(i) ? 'Found. ' : ''}${esc(h)}</li>`).join('');
}
function setupFlags() {
  renderFlags();
  $('#flag-form').addEventListener('submit', async e => {
    e.preventDefault();
    const r = await checkFlag($('#flag-in').value), msg = $('#flag-msg');
    if (!r.ok) { msg.textContent = 'Not one of mine. Check the braces and the case.'; return; }
    $('#flag-in').value = '';
    msg.innerHTML = r.code ? `All five. Your case number is <b>${r.code}</b>. Put it in your message and I'll know you read everything.` : `Flag ${r.n} confirmed. ${r.count} of 5.`;
  });
}

// ---------- ransom note ----------
function setupRansom() {
  if (calm || store.sget('fr-ransom')) return;
  const box = $('#ransom');
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting) return;
    io.disconnect(); store.sset('fr-ransom', '1');
    box.hidden = false; box.setAttribute('aria-hidden', 'false');
    box.innerHTML = `<div class="rn" role="alertdialog" aria-label="A fake ransom note, as a joke">
      <h3>YOUR SCROLLING HAS BEEN ENCRYPTED</h3>
      <p>You've read a lot of this page. All of it is now locked behind a key only I hold.</p>
      <p>To get it back, pay the ransom:</p>
      <p class="tm" id="rn-t">one 20-minute call</p>
      <p>Payment accepted on LinkedIn.</p>
      <button type="button" data-r="pay">Pay the ransom</button><button type="button" data-r="no">Refuse</button></div>`;
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      if (b.dataset.r === 'pay') window.open(PERSON.links.linkedin, '_blank', 'noopener');
      box.querySelector('.rn').innerHTML = `<h3>JUST KIDDING</h3><p>Your files are fine. Nothing ran and nothing got encrypted. It was a div with a red border.</p><p>If a real one ever shows up, though, you know who to call.</p><button type="button" data-r="close">Back to the page</button>`;
      if (b.dataset.r === 'close') { box.hidden = true; box.setAttribute('aria-hidden', 'true'); }
    });
  }, { threshold: 0.6 });
  io.observe($('#contact'));
}

// ---------- reveal on scroll, lazy modules ----------
function setupObservers() {
  scrubFurniture();
  initScrub({ calm });
  const near = (el, fn, margin = '600px') => { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: margin }); io.observe(el); };
  near($('#writing'), loadPosts);
  // The balls should be seen falling in, so the toolbox starts only once it is on screen.
  near($('#toolbox'), () => import('./toolbox.js').then(m => m.initToolbox($('#toolbox'), $('#tb-tip'), { calm })).catch(e => console.warn('toolbox', e)), '0px 0px -25% 0px');
}

let term = null;
async function openTerminal() {
  if (!term) term = await import('./terminal.js').then(m => m.initTerminal({ visitor: V, goToChapter, checkFlag, openTriage, calm, film: () => film }));
  term.open();
}
async function openTriage() {
  const m = await import('./triage.js');
  m.openTriage($('#triage'), { calm });
}
function setupExtras() {
  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-term]')) openTerminal();
    if (e.target.closest('[data-open-triage]') || e.target.closest('#triage-open')) openTriage();
  });
  addEventListener('keydown', e => {
    if (e.key === '`' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) { e.preventDefault(); openTerminal(); }
  });
  const best = store.get('fr-triage-best');
  if (best) $('#triage-best').textContent = `Your best shift: ${best} points.`;
}

// ---------- film ----------
async function startFilm() {
  const q = new URLSearchParams(location.search);
  if (!webglOK()) { html.classList.add('nofilm'); return; }
  try {
    const m = await import('./film.js');
    film = await m.createFilm($('#scene'), { visitor: V, calm, onLost: () => { html.classList.add('nofilm'); film = null; chrome?.refresh(); } });
    if (q.has('film-p')) { const p = clamp(+q.get('film-p')); const [y0, h] = filmRange(); scrollTo(0, y0 + p * h); film.setProgress(p, true); }
    lastP = -1; onScroll();
    new IntersectionObserver(es => film?.setVisible(es[0].isIntersecting)).observe($('#top'));
    window.__film = film;
  } catch (e) {
    console.warn('film unavailable, showing the plain version', e);
    html.classList.add('nofilm');
  }
}

// ---------- boot ----------
(async function boot() {
  V = await scanVisitor(gpuName());
  persona = V.persona;
  window.__visitor = V;
  renderCaptions(); orderSections();
  renderCases(); renderSkills(); renderPath(); renderWitnesses(); renderCreds(); renderContact();
  // Header, footer and the film's rails follow the order the sections ended up in.
  chrome = initChrome({ chapters: CHAPTERS, links: PERSON.links, filmRange, goToChapter, calm });
  introDone.then(() => chrome.ready());
  setupFlags(); setupRansom(); setupExtras(); setupObservers();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { lastP = -1; onScroll(); });
  const filmReady = startFilm().then(() => { onScroll(); chrome?.refresh(); });
  setupSound();
  // The ticket opens, the camera drifts in, and the lamp clicks on (heard only if the visitor clicked).
  introDone.then(() => filmReady).then(() => { film?.enter(); setTimeout(() => sound?.play('lamp'), calm ? 0 : 760); });
  await intake(V);
  await filmReady;
})();
