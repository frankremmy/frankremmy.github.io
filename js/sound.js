// The room, in sound. Everything is synthesised with Web Audio, so there are no files to load: rain
// on the window, a low fan hum, and small cues tied to the film (the click, the beacon, the drop
// into the logs, the twist, each hop on the map, the fix). Rain closes in and a drone rises while
// the film is in the dark, then the room comes back. Kept quiet on purpose.

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// Cues fire when scrolling forward past them, never on the way back.
const CUES = [
  [0.15, 'click'], [0.196, 'beacon'], [0.292, 'whoosh'], [0.49, 'boom'],
  [0.588, 'tick'], [0.596, 'tick'], [0.632, 'deny'], [0.645, 'tick'], [0.66, 'tick'], [0.685, 'tick'], [0.7, 'tick'],
  [0.765, 'chord']
];

// muted: start silent (the visitor muted on an earlier visit, or pressed mute before it loaded).
export function startSound({ muted = false } = {}) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ac = new AC();
  const LEVEL = 0.6;
  const master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
  if (muted) ac.suspend(); else master.gain.setTargetAtTime(LEVEL, ac.currentTime, 1.2);

  function noise(kind) {
    const len = ac.sampleRate * 3, b = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let b0 = 0, b1 = 0, b2 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
      }
    }
    return b;
  }
  const loop = (buf) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; };
  const pink = noise('pink'), brown = noise('brown');

  // Rain: pink noise, band-limited; the lowpass closes when the film goes dark.
  const rainHP = ac.createBiquadFilter(); rainHP.type = 'highpass'; rainHP.frequency.value = 380;
  const rainLP = ac.createBiquadFilter(); rainLP.type = 'lowpass'; rainLP.frequency.value = 3200;
  const rainG = ac.createGain(); rainG.gain.value = 0.28;
  loop(pink).connect(rainHP); rainHP.connect(rainLP); rainLP.connect(rainG); rainG.connect(master);

  // Fan hum: brown noise low down, plus a faint mains tone.
  const humLP = ac.createBiquadFilter(); humLP.type = 'lowpass'; humLP.frequency.value = 170;
  const humG = ac.createGain(); humG.gain.value = 0.16;
  loop(brown).connect(humLP); humLP.connect(humG); humG.connect(master);
  const mains = ac.createOscillator(); mains.frequency.value = 50; const mainsG = ac.createGain(); mainsG.gain.value = 0.006;
  mains.connect(mainsG); mainsG.connect(master); mains.start();

  // The dark: two detuned saws under a lowpass.
  const droneG = ac.createGain(); droneG.gain.value = 0;
  const droneLP = ac.createBiquadFilter(); droneLP.type = 'lowpass'; droneLP.frequency.value = 240; droneLP.Q.value = 0.7;
  [55, 55.35, 82.6].forEach(f => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(droneLP); o.start(); });
  droneLP.connect(droneG); droneG.connect(master);

  // Single drops on the glass, scheduled a little ahead.
  let rainLevel = 1;
  (function drips() {
    const t = ac.currentTime + 0.05;
    if (rainLevel > 0.05 && ac.state === 'running') {
      const s = ac.createBufferSource(); s.buffer = pink;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 4200; bp.Q.value = 6;
      const g = ac.createGain(), pan = ac.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09 * rainLevel * Math.random(), t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      s.connect(bp); bp.connect(g); g.connect(pan); pan.connect(master);
      s.start(t, Math.random() * 2, 0.08);
    }
    setTimeout(drips, 30 + Math.random() * 160);
  })();

  // ---- cues ----
  function env(node, t, peak, a, d) { node.gain.setValueAtTime(0.0001, t); node.gain.exponentialRampToValueAtTime(peak, t + a); node.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, f, peak, a, d, t = ac.currentTime, f2) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, peak, a, d); o.connect(g); g.connect(master); o.start(t); o.stop(t + a + d + 0.05);
  }
  function burst(freq, q, peak, d, t = ac.currentTime) {
    const s = ac.createBufferSource(); s.buffer = pink;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); env(g, t, peak, 0.002, d);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 2, d + 0.05);
  }
  const play = {
    click() { const t = ac.currentTime; burst(3200, 3, 0.35, 0.02, t); burst(2600, 3, 0.25, 0.025, t + 0.09); },
    lamp() { const t = ac.currentTime; burst(2200, 2, 0.3, 0.03, t); tone('sine', 120, 0.02, 0.01, 0.4, t + 0.02); },
    beacon() { const t = ac.currentTime; for (let i = 0; i < 3; i++) tone('sine', 1320, 0.05, 0.005, 0.12, t + i * 0.32); },
    whoosh() {
      const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = pink;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
      f.frequency.setValueAtTime(250, t); f.frequency.exponentialRampToValueAtTime(2400, t + 1.6);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 1.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      s.connect(f); f.connect(g); g.connect(master); s.start(t, 0, 2.4);
    },
    boom() { const t = ac.currentTime; tone('sine', 92, 0.5, 0.01, 2.6, t, 34); burst(160, 1, 0.25, 0.6, t); },
    tick() { tone('triangle', 660 + Math.random() * 120, 0.06, 0.004, 0.09); },
    deny() { const t = ac.currentTime; tone('square', 140, 0.05, 0.005, 0.16, t); tone('square', 132, 0.05, 0.005, 0.16, t + 0.2); },
    chord() { const t = ac.currentTime; [220, 277.18, 329.63, 440].forEach((f, i) => tone('sine', f, 0.045, 1.4, 3.2, t + i * 0.12)); }
  };

  let last = -1, sleep = 0;
  document.addEventListener('visibilitychange', () => { if (document.hidden) ac.suspend(); else if (!muted) ac.resume(); });

  return {
    play: k => { if (!muted) play[k]?.(); },
    // Fade out quickly, then pause the audio clock so nothing runs while muted.
    setMuted(m) {
      muted = !!m; clearTimeout(sleep);
      const g = master.gain, now = ac.currentTime;
      g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
      if (muted) { g.setTargetAtTime(0, now, 0.06); sleep = setTimeout(() => { if (muted) ac.suspend(); }, 450); }
      else { ac.resume(); g.setTargetAtTime(LEVEL, ac.currentTime, 0.25); }
    },
    // Called with the film's progress on every scroll.
    progress(p) {
      const night = ss(0.235, 0.29, p) * (1 - ss(0.86, 0.92, p));
      const after = ss(0.95, 1, p);
      rainLevel = 1 - night * 0.75;
      const now = ac.currentTime;
      rainLP.frequency.setTargetAtTime(3200 - night * 2500, now, 0.4);
      rainG.gain.setTargetAtTime((0.28 - night * 0.16) * (1 - after * 0.45), now, 0.4);
      droneG.gain.setTargetAtTime(night * 0.035, now, 0.8);
      humG.gain.setTargetAtTime(0.16 * (1 - night * 0.5), now, 0.5);
      if (!muted && last >= 0 && p > last && p - last < 0.08) for (const [at, k] of CUES) if (last < at && p >= at) play[k]();
      last = p;
    }
  };
}
