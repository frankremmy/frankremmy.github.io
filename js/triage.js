// Sixty-second alert triage. Real lines from the case mixed with boring ones; call each one a true
// or false positive. F / J on a keyboard. The end card teaches something either way.

import { LOGS } from './content.js';
import { store } from './visitor.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const SECS = 60;

export function openTriage(box, { calm = false } = {}) {
  let queue = shuffle(LOGS), i = 0, score = 0, right = 0, wrong = 0, streak = 0, missed = [], t0 = 0, timer = 0, locked = false, ended = false;
  box.hidden = false;
  box.innerHTML = `<div class="tg">
    <div class="tg-hud"><span>Score <b id="tg-s">0</b></span><span>Streak <b id="tg-k">0</b></span><span>Queue <b id="tg-q">${queue.length}</b></span><button type="button" class="x" aria-label="Close">×</button></div>
    <div class="tg-time"><i id="tg-t"></i></div>
    <div class="tg-log" id="tg-log" aria-live="polite"></div>
    <div class="tg-btns"><button type="button" class="fp" data-a="0">False positive <kbd>F</kbd></button><button type="button" class="tp" data-a="1">True positive <kbd>J</kbd></button></div>
    <div class="tg-why" id="tg-why">Is this line part of the attack, or just Tuesday?</div></div>`;
  const q = s => box.querySelector(s);

  const show = () => {
    const l = queue[i];
    q('#tg-log').innerHTML = Object.entries(l).filter(([k]) => !['why', 'bad'].includes(k)).map(([k, v]) => `<span class="f">${esc(k)}:</span> ${esc(v)}`).join('\n');
    q('#tg-q').textContent = queue.length - i;
  };
  const answer = a => {
    if (locked || ended) return;
    const l = queue[i], ok = (a === 1) === l.bad;
    if (ok) { streak++; right++; score += 100 + Math.min(5, streak - 1) * 20; } else { streak = 0; wrong++; score = Math.max(0, score - 50); missed.push(l); }
    q('#tg-s').textContent = score; q('#tg-k').textContent = streak;
    q('#tg-why').innerHTML = `<span class="${ok ? 'good' : 'bad'}">${ok ? 'Right.' : 'Missed.'}</span> ${l.bad ? 'True positive.' : 'False positive.'} ${esc(l.why)}`;
    locked = true;
    setTimeout(() => { locked = false; i++; if (i >= queue.length) end(); else show(); }, calm ? 900 : 650);
  };
  const tick = () => {
    if (ended) return;
    const k = Math.min(1, (performance.now() - t0) / (SECS * 1000));
    q('#tg-t').style.transform = `scaleX(${1 - k})`;
    if (k >= 1) end(); else timer = requestAnimationFrame(tick);
  };
  function end() {
    if (ended) return; ended = true; cancelAnimationFrame(timer);
    const best = Math.max(score, +(store.get('fr-triage-best') || 0)); store.set('fr-triage-best', String(best));
    const bestEl = document.getElementById('triage-best'); if (bestEl) bestEl.textContent = `Your best shift: ${best} points.`;
    const verdict = wrong === 0 && right === queue.length ? 'Clean shift. Every call right.' : right >= wrong * 3 ? 'Solid shift.' : 'Rough shift. Happens to everyone in week one.';
    const lesson = missed.length ? `The one to look at again: <code>${esc(missed[0].event_source)}</code> at ${esc(missed[0].time)}. ${esc(missed[0].why)}` :
      'The trick on the real case was the same as here: the bad lines only look bad next to the normal ones. That\'s why you keep baselines.';
    box.querySelector('.tg').innerHTML = `<div class="tg-end"><h3>${verdict}</h3>
      <p>${score} points · ${right} right · ${wrong} wrong · ${queue.length - i} left in the queue</p>
      <p>${lesson}</p>
      <p class="dim small">The attack lines are from my write-up. The boring ones are made up so you'd have something to be wrong about.</p>
      <button type="button" data-again>Another shift</button><button type="button" class="x2">Done</button></div>`;
    box.querySelector('[data-again]').onclick = () => openTriage(box, { calm });
    box.querySelector('.x2').onclick = close;
  }
  function close() { ended = true; cancelAnimationFrame(timer); box.hidden = true; removeEventListener('keydown', key); }
  const key = e => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key.toLowerCase() === 'f') answer(0);
    else if (e.key.toLowerCase() === 'j') answer(1);
  };
  // One game at a time: drop the last game's key handler before adding this one's.
  if (box._key) removeEventListener('keydown', box._key);
  box._key = key; addEventListener('keydown', key);
  box.onclick = e => {
    const b = e.target.closest('[data-a]'); if (b) answer(+b.dataset.a);
    if (e.target.closest('.x')) close();
  };
  show(); t0 = performance.now(); tick();
  q('[data-a="1"]').focus();
}
