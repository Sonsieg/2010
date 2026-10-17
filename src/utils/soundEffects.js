// Web Audio API Sound Synthesizer for 20/10 Cinematic Web (v2)
// Không cần file audio ngoài. Có master bus, limiter, reverb, nhiễu, panning.

let audioCtx = null;
let dryBus = null;   // đường âm thanh khô -> compressor -> master
let wetBus = null;   // đường reverb
let masterGain = null;
let noiseBuffer = null;
let muted = false;
let volume = 0.8;
let lastTap = 0;

const PENTATONIC = [880, 987.77, 1174.66, 1318.51, 1567.98, 1760]; // A5 B5 D6 E6 G6 A6

/* ---------- Khởi tạo ---------- */

function buildImpulse(ctx, seconds = 1.6, decay = 3) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function initGraph(ctx) {
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : volume;

  // Limiter nhẹ: nhiều âm chồng nhau cũng không bị rè/vỡ tiếng
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 12;
  comp.ratio.value = 6;
  comp.attack.value = 0.003;
  comp.release.value = 0.2;

  dryBus = ctx.createGain();
  dryBus.connect(comp);

  // Reverb dùng chung -> cảm giác "điện ảnh", có không gian
  const convolver = ctx.createConvolver();
  convolver.buffer = buildImpulse(ctx);
  wetBus = ctx.createGain();
  wetBus.gain.value = 0.55;
  wetBus.connect(convolver);
  convolver.connect(comp);

  comp.connect(masterGain);
  masterGain.connect(ctx.destination);
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
    initGraph(audioCtx);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Gọi 1 lần khi app khởi động. Trình duyệt chỉ cho phát âm thanh sau
 * cú chạm đầu tiên của người dùng, nên ta "mở khóa" AudioContext ở đó.
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  const unlock = () => {
    getAudioContext();
    ['pointerdown', 'touchstart', 'keydown'].forEach((e) =>
      window.removeEventListener(e, unlock)
    );
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach((e) =>
    window.addEventListener(e, unlock, { passive: true })
  );

  // Tiết kiệm pin: tạm dừng khi chuyển tab
  document.addEventListener('visibilitychange', () => {
    if (!audioCtx) return;
    if (document.hidden) audioCtx.suspend().catch(() => {});
    else audioCtx.resume().catch(() => {});
  });
}

export function setMuted(value) {
  muted = !!value;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : volume, audioCtx.currentTime, 0.02);
  }
}
export function isMuted() { return muted; }
export function setVolume(v) {
  volume = Math.min(1, Math.max(0, v));
  if (masterGain && audioCtx && !muted) {
    masterGain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.02);
  }
}

/* ---------- Công cụ dựng âm ---------- */

function route(node, ctx, { pan = 0, wet = 0.2 } = {}) {
  let out = node;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    out.connect(p);
    out = p;
  }
  out.connect(dryBus);
  if (wet > 0) {
    const w = ctx.createGain();
    w.gain.value = wet;
    out.connect(w);
    w.connect(wetBus);
  }
}

// Một nốt: có attack ngắn (hết tiếng "tách" đầu nốt), decay mượt
function tone(ctx, o) {
  const {
    freq, type = 'sine', start = 0, dur = 0.3, vol = 0.1, attack = 0.006,
    glideTo = null, glideTime = dur, pan = 0, wet = 0.2, detune = 0, lowpass = null,
  } = o;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.detune.value = detune;
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + glideTime);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  let node = osc;
  if (lowpass) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lowpass;
    osc.connect(f);
    node = f;
  }
  node.connect(gain);
  route(gain, ctx, { pan, wet });

  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function getNoise(ctx) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

// Nhiễu qua bộ lọc: dùng cho tiếng "bục" của bóng và tiếng giấy sột soạt
function noise(ctx, o) {
  const {
    start = 0, dur = 0.05, vol = 0.2, attack = 0.002,
    type = 'bandpass', freq = 2000, q = 1, pan = 0, wet = 0.1,
  } = o;
  const t = ctx.currentTime + start;
  const src = ctx.createBufferSource();
  src.buffer = getNoise(ctx);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  src.connect(f);
  f.connect(g);
  route(g, ctx, { pan, wet });

  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

const rand = (min, max) => min + Math.random() * (max - min);

/* ---------- Các hiệu ứng ---------- */

/** 1. Bóng bay nổ + tiếng chuông lấp lánh (mỗi lần một khác) */
export function playPopSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const pan = rand(-0.5, 0.5);
  const pitch = rand(0.9, 1.15);

  // Tiếng "bục" thật của bóng: nhiễu ngắn + thân sine rơi tần
  noise(ctx, { dur: 0.05, vol: 0.28, freq: 1800 * pitch, q: 0.8, pan, wet: 0.08 });
  tone(ctx, {
    freq: 480 * pitch, glideTo: 70, dur: 0.09, vol: 0.32, attack: 0.002, pan, wet: 0.05,
  });

  // Lấp lánh: 3 nốt tăng dần, lấy ngẫu nhiên từ thang ngũ cung
  const start = Math.floor(rand(0, PENTATONIC.length - 3));
  for (let i = 0; i < 3; i++) {
    tone(ctx, {
      freq: PENTATONIC[start + i], type: 'triangle',
      start: 0.03 + i * 0.035, dur: 0.32, vol: 0.08, pan: pan + (i - 1) * 0.15, wet: 0.35,
    });
  }
}

/** 2. Mở phong bì: giấy sột soạt + hợp âm pha lê */
export function playLetterOpenSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Giấy sột soạt (nhiễu lọc cao) thay cho sine sweep
  noise(ctx, { dur: 0.2, vol: 0.14, attack: 0.05, type: 'highpass', freq: 3200, q: 0.5, wet: 0.05 });
  noise(ctx, { start: 0.07, dur: 0.12, vol: 0.09, attack: 0.03, type: 'bandpass', freq: 5000, q: 1.2, wet: 0.05 });

  // Cmaj9 trải rộng: C5 E5 G5 C6 D6
  [523.25, 659.25, 783.99, 1046.5, 1174.66].forEach((freq, i) => {
    tone(ctx, {
      freq, start: 0.1 + i * 0.045, dur: 0.9, vol: 0.1 - i * 0.008,
      attack: 0.012, pan: (i - 2) * 0.2, wet: 0.45,
    });
    // Lớp chồng nhẹ lệch tần tạo hiệu ứng "chorus" ấm áp
    tone(ctx, {
      freq, type: 'triangle', detune: 7, start: 0.1 + i * 0.045, dur: 0.7, vol: 0.03,
      pan: (i - 2) * 0.2, wet: 0.45,
    });
  });
}

/** 3. Còi xe hoa vintage "bíp bíp" */
export function playTruckHonkSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  [0, 0.16].forEach((offset) => {
    [349.23, 440.0].forEach((freq) => {
      // Sawtooth + lowpass cho chất còi cổ điển, ấm hơn triangle thuần
      tone(ctx, {
        freq, type: 'sawtooth', lowpass: 1400, start: offset, dur: 0.12,
        vol: 0.07, attack: 0.008, wet: 0.12,
      });
    });
  });
}

/** 4. Sao lấp lánh cổ tích: lướt từ trái sang phải */
export function playSparkleSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const scale = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 1975.53];
  scale.forEach((freq, i) => {
    tone(ctx, {
      freq: freq * rand(0.995, 1.005), start: i * 0.04 + rand(0, 0.01),
      dur: 0.5, vol: 0.075, pan: -0.7 + (i / (scale.length - 1)) * 1.4, wet: 0.5,
    });
  });
}

/** 5. Chạm nút êm ái (có chống spam) */
export function playSoftTapSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = performance.now();
  if (now - lastTap < 30) return;
  lastTap = now;

  tone(ctx, {
    freq: 320 * rand(0.97, 1.03), glideTo: 140, dur: 0.045, vol: 0.15,
    attack: 0.002, wet: 0.03,
  });
}