// Kichik ovoz effektlari (WebAudio sintezi — fayl kerak emas): soat tiqillashi, to'g'ri/noto'g'ri, g'alaba.
let ctx;
let muted = false;
try {
  muted = localStorage.getItem("vgt.sfx") === "0";
} catch {}

function ac() {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = "sine", gain = 0.12, slide = 0 } = {}) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

const play = (fn) => {
  if (muted) return;
  try {
    fn();
  } catch {}
};

export const sfx = {
  get muted() {
    return muted;
  },
  setMuted(m) {
    muted = m;
    try {
      localStorage.setItem("vgt.sfx", m ? "0" : "1");
    } catch {}
  },
  tick: () => play(() => tone(1200, 0, 0.05, { type: "square", gain: 0.05 })),
  join: () => play(() => (tone(660, 0, 0.12), tone(990, 0.08, 0.16))),
  start: () => play(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.18, { type: "triangle" }))),
  correct: () => play(() => (tone(784, 0, 0.14, { type: "triangle" }), tone(1175, 0.11, 0.28, { type: "triangle" }))),
  wrong: () => play(() => tone(220, 0, 0.35, { type: "sawtooth", gain: 0.06, slide: -80 })),
  reveal: () => play(() => tone(440, 0, 0.5, { type: "triangle", slide: 440 })),
  win: () => play(() => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.12, 0.25, { type: "triangle", gain: 0.1 }))),
};
