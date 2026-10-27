// What the browser says about the visitor, read locally with no permission prompts and no network
// requests, plus a best guess at who is reading. Nothing here is sent anywhere.

const within = (pr, ms) => Promise.race([pr, new Promise(r => setTimeout(() => r(null), ms))]).catch(() => null);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  sget(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  sset(k, v) { try { sessionStorage.setItem(k, v); } catch {} }
};
export { store };

export function osName() {
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return 'iOS';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPadOS';
  if (/Android/.test(ua)) return 'Android';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown OS';
}
export function browserName() {
  const ua = navigator.userAgent; let m;
  if ((m = ua.match(/Edg(?:A|iOS)?\/(\d+)/))) return 'Edge ' + m[1];
  if ((m = ua.match(/OPR\/(\d+)/))) return 'Opera ' + m[1];
  if ((m = ua.match(/(?:Firefox|FxiOS)\/(\d+)/))) return 'Firefox ' + m[1];
  if ((m = ua.match(/(?:Chrome|CriOS)\/(\d+)/))) return (navigator.brave ? 'Brave ' : 'Chrome ') + m[1];
  if ((m = ua.match(/Version\/(\d+).*Safari/))) return 'Safari ' + m[1];
  return 'your browser';
}
export function cleanGpu(r) {
  r = String(r || '');
  const a = r.match(/^ANGLE \((.*)\)$/);
  if (a) { const parts = a[1].split(', '); r = parts[1] || parts[0]; }
  r = r.replace(/ANGLE Metal Renderer: /, '').replace(/\(0x[0-9a-f]+\)/ig, '').replace(/(Direct3D|OpenGL|Vulkan|vs_\d).*$/i, '')
    .replace(/\((R|TM)\)/g, '').replace(/\s+/g, ' ').trim();
  return r.length > 3 && !/^(WebKit WebGL|Disabled|Generic|Mozilla)/i.test(r) ? r : '';
}

// Font probe: a font is installed if text set in it measures differently from every fallback.
const DEV_FONTS = ['Cascadia Code', 'Cascadia Mono', 'JetBrains Mono', 'Fira Code', 'Hack', 'Source Code Pro', 'Ubuntu Mono', 'DejaVu Sans Mono', 'Menlo', 'SF Mono', 'Inconsolata'];
const OFFICE_FONTS = ['Calibri', 'Aptos', 'Cambria', 'Segoe UI', 'Franklin Gothic Medium', 'Gill Sans', 'Avenir', 'Helvetica Neue', 'Roboto', 'Ubuntu', 'Comic Sans MS'];
export function detectFonts(list) {
  try {
    const c = document.createElement('canvas').getContext('2d'), s = 'mmmmmmmmmmlli1WQ@#%&';
    const w = f => { c.font = `64px ${f}`; return c.measureText(s).width; };
    const base = ['monospace', 'serif', 'sans-serif'].map(b => [b, w(b)]);
    return list.filter(f => base.some(([b, bw]) => w(`"${f}", ${b}`) !== bw));
  } catch { return []; }
}

// Canvas fingerprint: same shapes and text drawn on every browser render a little differently (GPU,
// font smoothing, anti-aliasing), so the hash of the pixels is fairly unique to this device. The point
// of showing it to the visitor is to make "no cookies needed" concrete: sites can still single you out.
export function fingerprint() {
  try {
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 50;
    const x = cv.getContext('2d');
    x.textBaseline = 'top'; x.font = '15px Arial'; x.fillStyle = '#e33'; x.fillRect(100, 2, 60, 18);
    x.fillStyle = '#0a7'; x.fillText('frankremmy 0x2D check', 3, 14);
    x.fillStyle = 'rgba(40,80,220,0.6)'; x.fillText('frankremmy 0x2D check', 5, 16);
    const d = cv.toDataURL(); let h = 0x811c9dc5;
    for (let i = 0; i < d.length; i++) { h ^= d.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16).padStart(8, '0');
  } catch { return null; }
}

const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const partOfDay = h => h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';

// Guess the reader from what the browser shows. Every point is listed so the page can explain itself.
function guessPersona(v) {
  const score = { recruiter: 0, manager: 0, engineer: 0, skim: 0 }, why = { recruiter: [], manager: [], engineer: [], skim: [] };
  const add = (k, n, reason) => { score[k] += n; why[k].push(reason); };
  const ref = v.ref || '';
  if (/linkedin|indeed|glassdoor|greenhouse|lever\.co|workable|smartrecruiters|ashby|teamtailor|jobsinmalta|keepmeposted|bamboohr|recruitee|personio/.test(ref)) add('recruiter', 3, `you came from ${ref}`);
  if (/github|gitlab|news\.ycombinator|reddit|tryhackme|hackthebox|sans\.org|stackoverflow|dev\.to|lobste\.rs|^x\.com$|^t\.co$|twitter/.test(ref)) add('engineer', 3, `you came from ${ref}`);
  if (/wordpress|wordcamp|automattic/.test(ref)) add('engineer', 1, `you came from ${ref}`);
  if (v.devFonts.length) add('engineer', 2, `${v.devFonts[0]} is installed`);
  if (v.os === 'Linux') add('engineer', 2, 'you run Linux');
  if (/Firefox/.test(v.browser) && v.os !== 'Windows') add('engineer', 1, `${v.browser.split(' ')[0]} on ${v.os}`);
  if (v.officeFonts.some(f => /Calibri|Aptos/.test(f)) && !v.devFonts.length) { add('recruiter', 1, 'Office fonts, no developer fonts'); add('manager', 1, 'Office fonts, no developer fonts'); }
  const d = v.now.getDay(), h = v.now.getHours();
  if (d > 0 && d < 6 && h >= 8 && h < 18) { add('recruiter', 1, 'it\'s working hours where you are'); add('manager', 1, 'it\'s working hours where you are'); }
  if (v.mobile) add('skim', 2, 'you\'re on a phone');
  if (v.tz === 'Europe/Malta') add('manager', 1, 'your clock is set to Malta');
  const params = new URLSearchParams(location.search), forced = params.get('as') || store.get('fr-persona');
  if (forced && ['recruiter', 'manager', 'engineer', 'skim', 'default'].includes(forced)) return { persona: forced, why: ['you picked it'], forced: true };
  let best = 'default', top = 1;
  for (const k of ['engineer', 'recruiter', 'manager', 'skim']) if (score[k] > top) { top = score[k]; best = k; }
  return { persona: best, why: best === 'default' ? ['nothing gave you away, so you get the standard cut'] : why[best] };
}

export async function scanVisitor(gpuHint) {
  const ua = navigator.userAgent, dpr = window.devicePixelRatio || 1;
  let os = osName(), model = '';
  if (os === 'Android') { const m = ua.match(/Android (\d+(\.\d+)?)/); if (m) os = 'Android ' + m[1]; }
  if (os === 'iOS' || os === 'iPadOS') { const m = ua.match(/OS (\d+)_(\d+)/); if (m) os += ` ${m[1]}.${m[2]}`; }
  const uad = navigator.userAgentData?.getHighEntropyValues ? within(navigator.userAgentData.getHighEntropyValues(['platformVersion', 'model']), 600) : null;
  const bat = navigator.getBattery ? within(navigator.getBattery(), 600) : null;
  const media = navigator.mediaDevices?.enumerateDevices ? within(navigator.mediaDevices.enumerateDevices(), 600) : null;
  const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; } })();
  const city = /\//.test(tz) && !/^Etc\//.test(tz) ? tz.split('/').pop().replace(/_/g, ' ') : '';
  const now = new Date();
  let ref = '';
  try { if (document.referrer) { const h = new URL(document.referrer).hostname.replace(/^www\./, ''); if (h && h !== location.hostname.replace(/^www\./, '')) ref = h; } } catch {}
  let visits = +(store.get('fr-visits') || 0);
  if (!store.sget('fr-counted')) { visits += 1; store.set('fr-visits', String(visits)); store.sset('fr-counted', '1'); }
  visits = Math.max(1, visits);
  const [hi, battery, devices] = await Promise.all([uad, bat, media]);
  if (hi) {
    if (/^Windows/.test(os) && hi.platformVersion) { const major = parseInt(hi.platformVersion.split('.')[0], 10); if (major) os = major >= 13 ? 'Windows 11' : 'Windows 10'; }
    if (hi.model) model = hi.model;
  }
  const kinds = new Set((devices || []).map(d => d.kind));
  const mem = navigator.deviceMemory;
  const lang = (() => { try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(navigator.language); } catch { return navigator.language || ''; } })();
  const v = {
    os, model, browser: browserName(), gpu: cleanGpu(gpuHint || ''), cores: navigator.hardwareConcurrency || 0,
    mem: mem ? (mem >= 8 ? '8 GB+' : mem + ' GB') : '',
    screen: `${Math.round(screen.width * dpr)} × ${Math.round(screen.height * dpr)}`, dpr: +dpr.toFixed(2),
    tz, city, now, time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    day: now.toLocaleDateString('en-GB', { weekday: 'long' }), part: partOfDay(now.getHours()),
    date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
    battery: battery ? { level: Math.round(battery.level * 100), charging: battery.charging } : null,
    cam: kinds.has('videoinput'), mic: kinds.has('audioinput'),
    lang, dark: matchMedia('(prefers-color-scheme: dark)').matches, ref, visits,
    mobile: /iOS|iPadOS|Android/.test(os) || matchMedia('(hover: none) and (pointer: coarse)').matches,
    devFonts: detectFonts(DEV_FONTS), officeFonts: detectFonts(OFFICE_FONTS),
    net: navigator.connection?.downlink ? `${navigator.connection.effectiveType || ''} ~${navigator.connection.downlink} Mb/s`.trim() : ''
  };
  Object.assign(v, guessPersona(v));
  v.ticketNo = String(1000 + (visits * 7919 + now.getDate() * 31) % 9000);
  v.ordinal = ordinal(visits);
  return v;
}

// The lines the intake ticket types out. Bold bits are wrapped in <b>.
export function ticketLines(v) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const B = s => `<b>${esc(s)}</b>`;
  const L = [];
  L.push(`Host      ${B(v.os)}${v.model ? ` on a ${B(v.model)}` : ''} · ${B(v.browser)}`);
  const hw = [v.gpu && B(v.gpu), v.cores && `${v.cores} cores`, v.mem && `${v.mem} memory`].filter(Boolean).join(' · ');
  if (hw) L.push(`Hardware  ${hw}`);
  L.push(`Display   ${B(v.screen)} at ${v.dpr}×`);
  L.push(`Seen      ${v.city ? `near ${B(v.city)}, by your clock · ` : ''}${B(v.time)} on ${v.day} ${v.part}`);
  if (v.battery) L.push(`Power     battery ${v.battery.level}%, ${v.battery.charging ? 'charging' : 'not charging'}`);
  if (v.cam || v.mic) L.push(`Devices   ${[v.cam && 'camera', v.mic && 'microphone'].filter(Boolean).join(' and ')} connected`);
  L.push(`Source    ${v.ref ? `came from ${B(v.ref)}` : 'no referrer, so a link, a bookmark or you typed it'} · ${v.visits > 1 ? `${v.ordinal} visit` : 'first visit'}`);
  return L;
}
