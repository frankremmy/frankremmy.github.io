// Site chrome: the header and footer navigation, and the two rails that frame the film.
//
// The header and footer are plain links in index.html, so they work with no JavaScript at all.
// This module keeps them in the page's order (sections are reordered per reader), marks where
// you are, builds the phone menu, and draws the rails while the film is on screen:
//
//   left rail   where else to find me, written up the side of the screen
//   right rail  the film's chapters on a track spaced by when they happen. Click one to jump to
//               it, or drag along the track to scrub. On phones it lies flat along the bottom.

const NAMES = { cases: 'Cases', skills: 'Skills', path: 'Path', witnesses: 'Witnesses', arena: 'Arena', writing: 'Writing', creds: 'Credentials', contact: 'Contact' };
const ELSEWHERE = [['linkedin', 'LinkedIn'], ['github', 'GitHub'], ['x', 'X'], ['blog', 'Blog']];
// The rails leave once the film fades to the page (the veil starts at 0.95).
const RAILS_UNTIL = 0.955;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0');

export function initChrome({ chapters, links, filmRange, goToChapter, calm = false }) {
  const html = document.documentElement;
  const $ = s => document.querySelector(s);
  const hdr = $('#hdr'), menu = $('#menu'), menuBtn = $('#menu-btn');
  const behavior = calm ? 'auto' : 'smooth';
  const flat = matchMedia('(max-width: 760px)');

  // ---------- page order ----------
  // Sections arrive already reordered for this reader, with their kicker numbers rewritten.
  const secs = [...document.querySelectorAll('main.after > section')].map(s => ({
    id: s.id, el: s, name: NAMES[s.id] || s.id,
    no: ((s.querySelector('.k')?.textContent || '').match(/^\d+/) || [''])[0]
  }));
  const hnav = $('#hnav'), fnav = $('#foot-secs');
  for (const s of secs) {
    const a = hnav?.querySelector(`[data-nav="${s.id}"]`);
    if (a) hnav.appendChild(a);
    const li = fnav?.querySelector(`[data-nav="${s.id}"]`)?.closest('li');
    if (li) { li.querySelector('.no').textContent = s.no; fnav.appendChild(li); }
  }

  // ---------- phone menu ----------
  menu.innerHTML = `<ol class="menu-list">${secs.map(s => `<li><a href="#${s.id}" data-nav="${s.id}"><span class="no">${s.no}</span>${esc(s.name)}</a></li>`).join('')}</ol>
    <div class="menu-more">
      <button type="button" data-open-term><span class="ps">$_</span> Open the terminal</button>
      <p class="k">Elsewhere</p>
      <ul>${ELSEWHERE.map(([k, n]) => `<li><a href="${esc(links[k])}" target="_blank" rel="noopener">${n} ↗</a></li>`).join('')}</ul>
    </div>`;
  let menuOpen = false;
  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    menu.hidden = !open;
    html.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('span').textContent = open ? 'Close' : 'Menu';
    if (open) menu.querySelector('a')?.focus({ preventScroll: true });
  }
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
  addEventListener('resize', () => { if (menuOpen && !getComputedStyle(menuBtn).display.includes('flex')) setMenu(false); });
  // Opening the terminal from the menu closes the menu first.
  menu.addEventListener('click', e => { if (e.target.closest('[data-open-term]')) setMenu(false); });

  // ---------- in-page links ----------
  // Smooth where motion is welcome. #top replays the film from the beginning.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !a.closest('.hdr, .menu, .foot, .rail')) return;
    const id = a.getAttribute('href').slice(1), el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    setMenu(false);
    if (id === 'top') scrollTo({ top: 0, behavior }); else el.scrollIntoView({ behavior });
  });

  // ---------- where you are ----------
  const marks = () => document.querySelectorAll('.hnav a[data-nav], .menu a[data-nav]');
  function setCurrent(id) {
    marks().forEach(a => { if (a.dataset.nav === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  const seen = new Map();
  const io = new IntersectionObserver(es => {
    for (const en of es) seen.set(en.target.id, en.isIntersecting);
    const on = secs.find(s => seen.get(s.id));
    setCurrent(seen.get('top') ? null : on?.id || null);
  }, { rootMargin: '-48% 0px -50% 0px' });
  secs.forEach(s => io.observe(s.el));
  io.observe($('#top'));

  // ---------- rails ----------
  const railL = $('#rail-l'), railR = $('#rail-r');
  railL.innerHTML = ELSEWHERE.map(([k, n]) => `<a href="${esc(links[k])}" target="_blank" rel="noopener" aria-label="${n} (opens in a new tab)">${n}</a>`).join('') + '<i class="rail-line" aria-hidden="true"></i>';
  const stops = chapters.map((c, i) => ({ id: c.id, at: clamp(c.at), from: c.in ?? c.at - 0.02, label: c.rail, no: pad2(i + 1) }));
  railR.innerHTML = `<p class="rail-cap">Case 0001</p>
    <div class="rail-track" id="rail-track">
      <i class="rail-fill" aria-hidden="true"></i><i class="rail-head" aria-hidden="true"></i>
      ${stops.map(s => `<button type="button" class="rail-stop" data-ch="${s.id}" style="--at:${s.at}" aria-label="Chapter ${s.no}, ${esc(s.label)}"><span class="rail-lbl"><b>${s.no}</b> ${esc(s.label)}</span><i class="rail-tick" aria-hidden="true"></i></button>`).join('')}
    </div>
    <p class="rail-pos" aria-live="off"><b id="rail-no">00</b> / ${pad2(stops.length)}<span id="rail-now"></span></p>`;
  const track = $('#rail-track'), stopEls = [...track.querySelectorAll('.rail-stop')], railNo = $('#rail-no'), railNow = $('#rail-now');

  track.addEventListener('click', e => {
    const b = e.target.closest('.rail-stop');
    if (b && !scrub.moved) goToChapter(b.dataset.ch);
  });
  // Drag along the track to scrub the film. Starting on a chapter only counts as a drag once you move.
  const scrub = { on: false, moved: false, x: 0, y: 0 };
  function scrubTo(e) {
    const r = track.getBoundingClientRect();
    const k = flat.matches ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
    const [y0, h] = filmRange();
    scrollTo({ top: y0 + clamp(k, 0, RAILS_UNTIL - 0.005) * h, behavior: 'auto' });
  }
  // Capture only once it is a drag: capturing on press would retarget the click away from the chapter.
  const startDrag = e => { scrub.moved = true; html.classList.add('scrubbing'); track.setPointerCapture(e.pointerId); };
  track.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    Object.assign(scrub, { on: true, moved: false, x: e.clientX, y: e.clientY });
    if (!e.target.closest('.rail-stop')) { startDrag(e); scrubTo(e); }
  });
  track.addEventListener('pointermove', e => {
    if (!scrub.on) return;
    if (!(e.buttons & 1) && e.pointerType === 'mouse') { endScrub(); return; }
    if (!scrub.moved && Math.hypot(e.clientX - scrub.x, e.clientY - scrub.y) > 5) startDrag(e);
    if (scrub.moved) scrubTo(e);
  });
  const endScrub = () => { scrub.on = false; html.classList.remove('scrubbing'); setTimeout(() => { scrub.moved = false; }, 0); };
  track.addEventListener('pointerup', endScrub);
  track.addEventListener('pointercancel', endScrub);

  // ---------- scroll state ----------
  let ready = false, lastKey = '', queued = false;
  function update() {
    queued = false;
    const [y0, h] = filmRange();
    const p = clamp((scrollY - y0) / Math.max(1, h));
    const nofilm = html.classList.contains('nofilm');
    hdr.classList.toggle('solid', nofilm ? scrollY > 8 : p >= RAILS_UNTIL);
    const on = ready && !nofilm && p < RAILS_UNTIL;
    html.classList.toggle('rails-on', on);
    if (!on) return;
    let cur = -1;
    stops.forEach((s, i) => { if (p >= s.from - 0.012) cur = i; });
    track.style.setProperty('--p', p.toFixed(4));
    const key = String(cur);
    if (key === lastKey) return;
    lastKey = key;
    stopEls.forEach((b, i) => { b.classList.toggle('now', i === cur); b.classList.toggle('past', i < cur); if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    railR.classList.toggle('toc', cur < 0);
    railNo.textContent = cur < 0 ? '00' : stops[cur].no;
    railNow.textContent = cur < 0 ? 'Start' : stops[cur].label;
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();

  return {
    // Called when the intake ticket opens, so the rails arrive with the film rather than under the lids.
    ready() { ready = true; lastKey = ''; update(); },
    refresh: queue
  };
}
