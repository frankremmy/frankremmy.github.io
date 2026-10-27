// The terminal. Bash-ish, plus a KQL-style query bar over log lines from the case, because Frank's
// real tools are Linux and ELK. Simulated: nothing leaves the browser.

import { PERSON, CASE, LOGS, CHAPTERS, PATH, RANKS, CREDS } from './content.js';
import { runPhishDrill } from './phishing.js';
import { fingerprint } from './visitor.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CHALLENGE = '47 50 42 4a 4e 7d 7f 38 7b 55 69 75 52 7e 3f 63 20 66 22 24 7b 6b';
const FILES = {
  'readme.txt': 'Case 0001. Phishing to Domain Admin, rebuilt from five log sources.\nTry: investigate, query, phish, triage, flags. Or cd into a chapter of the film.',
  'cv.txt': null,
  'challenge.bin': null,
  'notes.md': 'Things I check first on any alert:\n  1. Where did it come from, really? (relay IPs, return paths)\n  2. What ran, and who started it? (parent process)\n  3. What did it talk to? (one second after launch is never a coincidence)\n  4. What happened before the thing I was told about?'
};

export function initTerminal(ctx) {
  const box = $('#term'), out = $('#term-out'), form = $('#term-form'), input = $('#term-in');
  const hist = []; let hi = 0, busy = false;

  const print = async (h = '') => {
    const d = document.createElement('div'); d.innerHTML = h; out.appendChild(d);
    out.scrollTop = out.scrollHeight; return d;
  };
  const pad = (s, n) => String(s).padEnd(n);

  const targets = CHAPTERS.map(c => c.id).concat(['top', 'skills', 'path', 'arena', 'writing', 'contact']);
  const CMDS = {
    help: () => print(['<span class="hd">Commands</span>',
      '  investigate        the case timeline, event by event',
      '  query &lt;filter&gt;     search the case logs, e.g. query event_source:"Sysmon" AND EventID:3',
      '  phish              a phishing drill, built from the real email',
      '  triage             sixty-second alert triage game',
      '  cd &lt;chapter&gt;       jump the film: ' + CHAPTERS.map(c => c.id).join(', '),
      '  ls, cat &lt;file&gt;     look around',
      '  whoami · device · path · ranks · certs',
      '  flags · submit &lt;flag&gt;',
      '  clear · exit'].join('\n')),
    whoami: () => print(`<b>${esc(PERSON.name)}</b> (${esc(PERSON.legal)})\n${esc(PERSON.role)}\n${esc(PERSON.place)}\n\nAnd you're visitor ${esc(ctx.visitor?.ticketNo || '')}, on ${esc(ctx.visitor?.os || 'something')}. Type <span class="cmd-i">device</span> to see what else I know.`),
    device: () => {
      const v = ctx.visitor || {};
      const rows = [['os', v.os + (v.model ? ' · ' + v.model : '')], ['browser', v.browser], ['gpu', v.gpu || 'not shared'], ['cores', v.cores || 'not shared'],
        ['memory', v.mem || 'not shared'], ['screen', `${v.screen} @ ${v.dpr}x`], ['clock', `${v.tz || '?'} · ${v.time}`], ['language', v.lang],
        ['referrer', v.ref || 'none'], ['visits', v.visits], ['dev fonts', (v.devFonts || []).join(', ') || 'none found'], ['canvas hash', fingerprint() || 'blocked']];
      return print(rows.map(([a, b]) => `  <span class="dim">${pad(a, 12)}</span>${esc(b)}`).join('\n') + '\n\n<span class="dim">No cookies, no permission prompts. The canvas hash is the interesting one: the same drawing renders a little differently on every machine, so it can pick you out without storing anything.</span>');
    },
    ls: () => print(Object.keys(FILES).join('    ')),
    cat: async a => {
      const f = (a[0] || '').replace(/^\.\//, '');
      if (!(f in FILES)) return print(`cat: ${esc(f || '')}: No such file`);
      if (f === 'challenge.bin') return print(`<span class="dim">xxd challenge.bin</span>\n00000000: ${CHALLENGE}\n\n<span class="dim">Each byte was XORed with its own position, counting from 1.</span>`);
      if (f === 'cv.txt') return print(PATH.slice().reverse().map(r => `  ${r.y}  ${esc(r.h)} · <span class="dim">${esc(r.o)}</span>`).join('\n') + `\n\n<span class="dim">Full CV on request. Message me on LinkedIn.</span>`);
      return print(esc(FILES[f]));
    },
    investigate: async () => {
      await print(`<span class="hd">${esc(CASE.title)}</span>  <span class="dim">9 Feb 2025</span>`);
      for (const e of CASE.events) {
        await print(`  ${e.twist ? '<span class="bad">' : ''}${e.t}${e.twist ? '</span>' : ''}  <span class="dim">${pad(e.src, 11)}</span>${esc(e.what)}`);
        if (!ctx.calm) await new Promise(r => setTimeout(r, 70));
      }
      return print(`\n<span class="dim">The red lines came first. Full write-up:</span> <a href="${CASE.url}" target="_blank" rel="noopener">${esc(CASE.url.replace('https://', ''))}</a>`);
    },
    query: a => {
      const q = a.join(' ').trim();
      if (!q) return print('usage: query field:"value" [AND field:value ...]\n  query event_source:"AuthLog"\n  query EventID:4886\n  query lsass');
      const terms = q.split(/\s+AND\s+/i).map(t => {
        const m = t.match(/^([\w.]+)\s*:\s*"?([^"]*)"?$/);
        return m ? { f: m[1].replace(/^event\./, ''), v: m[2].toLowerCase() } : { v: t.replace(/"/g, '').toLowerCase() };
      });
      const hits = LOGS.filter(l => terms.every(t => t.f ? String(l[t.f] ?? '').toLowerCase().includes(t.v) : Object.entries(l).some(([k, v]) => k !== 'why' && k !== 'bad' && String(v).toLowerCase().includes(t.v))))
        .sort((x, y) => x.time.localeCompare(y.time));
      const body = hits.map(l => '  ' + Object.entries(l).filter(([k]) => k !== 'why' && k !== 'bad').map(([k, v]) => `<span class="dim">${k}:</span> ${esc(v)}`).join('  ')).join('\n');
      return print(`${hits.length} hit${hits.length === 1 ? '' : 's'}\n${body}${hits.length ? '\n<span class="dim">Some of the boring lines are invented so the triage game has something to be wrong about.</span>' : ''}`);
    },
    phish: async () => runPhishDrill(print, ctx.calm),
    triage: () => { close(); ctx.openTriage(); },
    cd: a => {
      const t = (a[0] || '').toLowerCase();
      if (!t || t === '~') return print('');
      if (['skills', 'path', 'arena', 'writing', 'contact', 'top'].includes(t)) { document.getElementById(t)?.scrollIntoView({ behavior: 'smooth' }); return print(`<span class="dim">moving to ${t}</span>`); }
      return ctx.goToChapter(t) ? print(`<span class="dim">rolling the film to ${esc(t)}</span>`) : print(`cd: ${esc(t)}: No such chapter. Try: ${targets.join(', ')}`);
    },
    path: () => CMDS.cat(['cv.txt']),
    ranks: () => print(RANKS.map(r => `  ${pad(r.n, 7)}${esc(r.h)}`).join('\n')),
    certs: () => print(CREDS.map(c => `  ${c.pend ? '<span class="warn">…</span>' : c.past ? '<span class="dim">×</span>' : '<span class="good">✓</span>'} ${esc(c.h)} <span class="dim">${esc(c.m)}</span>`).join('\n')),
    flags: () => print('Five flags, format FRANK{...}. Hints are in the Arena section.\nFound one? <span class="cmd-i">submit FRANK{...}</span>'),
    submit: async a => {
      const r = await ctx.checkFlag(a.join(' '));
      if (!r.ok) return print('<span class="bad">Not one of mine.</span>');
      return print(r.code ? `<span class="good">Flag ${r.n} confirmed. That's all five.</span>\nYour case number: <b>${r.code}</b>. Put it in your message.` : `<span class="good">Flag ${r.n} confirmed.</span> ${r.count} of 5.`);
    },
    sudo: () => print('frank is not in the sudoers file. This incident will be reported.\n<span class="dim">(To me. I\'ll read it and laugh.)</span>'),
    hire: () => { close(); document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }); },
    clear: () => { out.innerHTML = ''; },
    exit: () => close(),
    history: () => print(hist.map((h, i) => `  ${i + 1}  ${esc(h)}`).join('\n'))
  };
  const ALIAS = { '?': 'help', dir: 'ls', type: 'cat', man: 'help', grep: 'query', search: 'query', play: 'triage', quit: 'exit', id: 'whoami', uname: 'device' };

  async function run(line) {
    line = line.trim(); if (!line) return;
    hist.push(line); hi = hist.length;
    await print(`<span class="cmd">${esc(line)}</span>`);
    const [c0, ...args] = line.split(/\s+/), c = ALIAS[c0.toLowerCase()] || c0.toLowerCase();
    if (!CMDS[c]) { await print(`${esc(c0)}: command not found. Try <span class="cmd-i">help</span>.`); return; }
    busy = true;
    try { await CMDS[c](args); } finally { busy = false; }
  }

  form.addEventListener('submit', e => { e.preventDefault(); if (busy) return; const v = input.value; input.value = ''; run(v); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) input.value = hist[--hi] || ''; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.value.split(' ');
      const pool = parts.length > 1 ? (parts[0] === 'cd' ? targets : parts[0] === 'cat' ? Object.keys(FILES) : []) : Object.keys(CMDS);
      const m = pool.filter(p => p.startsWith(parts[parts.length - 1]));
      if (m.length === 1) { parts[parts.length - 1] = m[0]; input.value = parts.join(' ') + ' '; }
      else if (m.length > 1) print(m.join('  '));
    } else if (e.key === 'Escape') close();
  });
  out.addEventListener('click', e => { const c = e.target.closest('.cmd-i'); if (c) { input.value = c.textContent; input.focus(); } });
  $('#term-close').addEventListener('click', () => close());
  $('#term-chips').innerHTML = ['help', 'investigate', 'phish', 'query lsass', 'cat challenge.bin', 'device'].map(c => `<button type="button" data-c="${c}">${c}</button>`).join('');
  $('#term-chips').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b && !busy) run(b.dataset.c); });

  let greeted = false;
  function open() {
    box.hidden = false;
    if (!greeted) { greeted = true; print(`<span class="dim">case-0001 shell. Simulated, nothing leaves your browser. Type</span> <span class="cmd-i">help</span>`); }
    setTimeout(() => input.focus(), 30);
  }
  function close() { box.hidden = true; }
  return { open, close, run };
}
