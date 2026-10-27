// What the laptop's display shows, drawn in code on a 1280x800 canvas.
// mail: the phishing email from the case. agent: the visitor's own device, enrolled as an endpoint.

export const SW = 1280, SH = 800;
const UI = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, Consolas, monospace';

function rr(x, cx, cy, w, h, r) {
  x.beginPath(); x.moveTo(cx + r, cy); x.arcTo(cx + w, cy, cx + w, cy + h, r); x.arcTo(cx + w, cy + h, cx, cy + h, r);
  x.arcTo(cx, cy + h, cx, cy, r); x.arcTo(cx, cy, cx + w, cy, r); x.closePath();
}
const fill = (x, c, cx, cy, w, h, r = 0) => { x.fillStyle = c; if (r) { rr(x, cx, cy, w, h, r); x.fill(); } else x.fillRect(cx, cy, w, h); };
const text = (x, s, cx, cy, font, c, align = 'left') => { x.font = font; x.fillStyle = c; x.textAlign = align; x.textBaseline = 'alphabetic'; x.fillText(s, cx, cy); };

// The link's box in canvas pixels, for hover tests on the 3D screen.
export const LINK = { x: 470, y: 452, w: 430, h: 40 };

export function drawMail(x, st = {}) {
  const { click = 0, hover = false, time = '14:36' } = st;
  // window chrome
  fill(x, '#eef1f5', 0, 0, SW, SH);
  fill(x, '#1f3b63', 0, 0, SW, 52);
  text(x, 'Outlook', 24, 34, `600 22px ${UI}`, '#fff');
  fill(x, 'rgba(255,255,255,.14)', 360, 12, 520, 30, 15);
  text(x, 'Search mail', 386, 33, `400 15px ${UI}`, 'rgba(255,255,255,.7)');
  text(x, 'cabal_user02', SW - 24, 33, `500 15px ${UI}`, '#cfe0ff', 'right');
  // folders
  fill(x, '#e3e8ee', 0, 52, 210, SH - 52);
  [['Inbox', '3'], ['Sent', ''], ['Drafts', ''], ['Archive', ''], ['Junk', '']].forEach(([n, c], i) => {
    if (!i) fill(x, '#cdd8e6', 10, 70, 190, 36, 6);
    text(x, n, 26, 94 + i * 44, `${i ? 400 : 600} 16px ${UI}`, '#1b2430');
    if (c) text(x, c, 186, 94, `600 15px ${UI}`, '#1f5fbf', 'right');
  });
  // message list
  fill(x, '#ffffff', 210, 52, 330, SH - 52);
  const list = [
    ['Sam Flynn', 'URGENT!', time, true],
    ['HR', 'Payroll calendar 2025', '14:02', false],
    ['IT Helpdesk', 'Printer on floor 2 fixed', '13:20', false],
    ['Facilities', 'Fire drill on Thursday', '11:47', false]
  ];
  list.forEach(([f, s, t, sel], i) => {
    const y = 52 + i * 92;
    if (sel) { fill(x, '#e8f0fc', 210, y, 330, 92); fill(x, '#1f5fbf', 210, y, 5, 92); }
    text(x, f, 232, y + 34, `${sel ? 700 : 500} 17px ${UI}`, '#1b2430');
    text(x, t, 522, y + 34, `400 14px ${UI}`, '#6a7685', 'right');
    text(x, s, 232, y + 62, `${sel ? 700 : 400} 15px ${UI}`, sel ? '#c0262d' : '#4a5563');
    fill(x, '#edf0f3', 222, y + 91, 306, 1);
  });
  // the open message
  const X = 570;
  text(x, 'URGENT!', X, 110, `700 30px ${UI}`, '#1b2430');
  fill(x, '#7a4fd6', X, 134, 46, 46, 23);
  text(x, 'SF', X + 23, 164, `600 18px ${UI}`, '#fff', 'center');
  text(x, 'Sam Flynn', X + 60, 152, `600 17px ${UI}`, '#1b2430');
  text(x, '<samflynn@cabal.local>', X + 152, 152, `400 15px ${UI}`, '#6a7685');
  text(x, `To: cabal_user02 · Today ${time}`, X + 60, 176, `400 14px ${UI}`, '#6a7685');
  const body = ['Hi,', '', 'Please review the attached document before end of day.', 'It is time sensitive. Download it here:'];
  body.forEach((l, i) => text(x, l, X, 290 + i * 30, `400 18px ${UI}`, '#26303b'));
  // the link
  if (hover || click > 0) fill(x, hover ? '#dbe8ff' : '#eef3fb', LINK.x - 6, LINK.y - 4, LINK.w + 12, LINK.h + 8, 6);
  text(x, 'http://yppilc.com/redactedforsecurity.zip', LINK.x, LINK.y + 27, `500 18px ${UI}`, '#1f5fbf');
  fill(x, '#1f5fbf', LINK.x, LINK.y + 32, LINK.w - 22, 1.5);
  text(x, 'Password: SaveItRightMeow!', X, 530, `400 18px ${UI}`, '#26303b');
  text(x, 'Thanks,', X, 580, `400 18px ${UI}`, '#26303b');
  text(x, 'Sam', X, 608, `400 18px ${UI}`, '#26303b');
  if (hover) {
    fill(x, 'rgba(20,24,30,.92)', LINK.x, LINK.y + 50, 470, 34, 6);
    text(x, 'Return-Path: agi@yppilc.com · via 34.30.110.62', LINK.x + 12, LINK.y + 73, `500 14px ${MONO}`, '#ffd9d4');
  }
  // the download, then the "PDF"
  if (click > 0) {
    const k = Math.min(1, click * 2);
    fill(x, '#ffffff', 210, SH - 86, SW - 210, 86);
    fill(x, '#dfe4ea', 210, SH - 86, SW - 210, 1);
    fill(x, '#f3f5f8', 230, SH - 70, 380, 54, 8);
    fill(x, '#ffd34d', 244, SH - 58, 30, 30, 5);
    text(x, 'ZIP', 259, SH - 37, `700 11px ${UI}`, '#5a4300', 'center');
    text(x, 'redactedforsecurity.zip', 288, SH - 47, `600 15px ${UI}`, '#1b2430');
    fill(x, '#e1e6ec', 288, SH - 34, 300, 5, 3);
    fill(x, '#2ea043', 288, SH - 34, 300 * k, 5, 3);
    if (click > 0.5) {
      const j = Math.min(1, (click - 0.5) * 2);
      fill(x, `rgba(255,236,233,${j})`, 630, SH - 70, 420, 54, 8);
      fill(x, `rgba(214,48,39,${j})`, 644, SH - 58, 30, 30, 5);
      text(x, 'PDF', 659, SH - 37, `700 11px ${UI}`, `rgba(255,255,255,${j})`, 'center');
      text(x, 'redactedforsecurity.pdf.exe', 688, SH - 47, `600 15px ${UI}`, `rgba(140,20,14,${j})`);
      text(x, 'Type: Application · no publisher', 688, SH - 27, `400 13px ${UI}`, `rgba(140,60,50,${j})`);
    }
  }
}

// The visitor's machine as an enrolled agent, dashboard style. v comes from visitor.js.
export function drawAgent(x, v, k = 1) {
  fill(x, '#0b1118', 0, 0, SW, SH);
  fill(x, '#101a24', 0, 0, SW, 60);
  fill(x, '#3ddc97', 24, 22, 16, 16, 4);
  text(x, 'Endpoints', 52, 38, `600 20px ${UI}`, '#e8eef4');
  text(x, '/ agent 001 / you', 160, 38, `400 18px ${UI}`, '#6f8193');
  text(x, `${v.time || ''} · ${v.date || ''}`, SW - 24, 38, `500 15px ${MONO}`, '#6f8193', 'right');
  // status strip
  const pills = [['Status', 'Active', '#3ddc97'], ['Enrolled', 'just now', '#e8eef4'], ['Data sent', 'none', '#3ddc97'], ['Critical vulns', '0 seen', '#e8eef4']];
  pills.forEach(([a, b, c], i) => {
    const px = 24 + i * 308;
    fill(x, '#131f2b', px, 84, 292, 88, 10);
    text(x, a, px + 18, 116, `500 14px ${UI}`, '#6f8193');
    text(x, b, px + 18, 154, `600 28px ${UI}`, c);
  });
  // inventory
  fill(x, '#131f2b', 24, 192, 760, SH - 216, 10);
  text(x, 'Inventory', 44, 230, `600 18px ${UI}`, '#e8eef4');
  const rows = [
    ['OS', `${v.os || 'Unknown'}${v.model ? ' · ' + v.model : ''}`],
    ['Browser', v.browser || ''],
    ['GPU', v.gpu || 'not shared'],
    ['CPU', v.cores ? `${v.cores} logical cores` : 'not shared'],
    ['Memory', v.mem || 'not shared'],
    ['Display', `${v.screen || ''} @ ${v.dpr || 1}x`],
    ['Location', v.city ? `near ${v.city} (from your clock)` : (v.tz || 'unknown')],
    ['Power', v.battery ? `${v.battery.level}% ${v.battery.charging ? 'charging' : 'on battery'}` : 'not shared'],
    ['Language', v.lang || '']
  ];
  rows.forEach(([a, b], i) => {
    const y = 278 + i * 50, show = Math.min(1, Math.max(0, k * rows.length - i));
    x.globalAlpha = show;
    fill(x, '#1a2836', 44, y + 14, 720, 1);
    text(x, a, 44, y, `500 15px ${MONO}`, '#6f8193');
    text(x, String(b).slice(0, 52), 210, y, `500 17px ${MONO}`, '#e8eef4');
    x.globalAlpha = 1;
  });
  // checks
  fill(x, '#131f2b', 804, 192, 452, SH - 216, 10);
  text(x, 'Checks', 824, 230, `600 18px ${UI}`, '#e8eef4');
  const checks = ['Reached this page over HTTPS', 'No cookies set', 'No trackers loaded', 'Nothing sent home', 'You read this far'];
  checks.forEach((c, i) => {
    const y = 282 + i * 56, show = Math.min(1, Math.max(0, k * 6 - i - 1));
    x.globalAlpha = show;
    fill(x, '#173528', 824, y - 22, 30, 30, 15);
    text(x, '✓', 839, y, `700 18px ${UI}`, '#3ddc97', 'center');
    text(x, c, 868, y, `500 17px ${UI}`, '#cdd8e2');
    x.globalAlpha = 1;
  });
  text(x, 'Read in your browser. None of it left this page.', 824, SH - 50, `400 14px ${UI}`, '#6f8193');
}
