// ═══════════════════════════
//  sound.js — Web Audio sound effects + Background Music
// ═══════════════════════════
let _audioCtx = null;
let _bgMusic = null;
let _bgMusicEnabled = true;

function _ac() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}

// ── Background Music (The Shire) ──
function startBGMusic() {
  if (_bgMusic || !_bgMusicEnabled) return;
  const ac = _ac(); if (!ac) return;

  const master = ac.createGain();
  master.gain.value = 0.12;
  master.connect(ac.destination);
  _bgMusic = { gain: master, stopped: false };

  // 🎵 Shire melody — gentle flute-style sine waves
  const melody = [
    {f:392,d:0.5},{f:440,d:0.5},{f:523,d:0.5},{f:494,d:0.5},
    {f:440,d:0.5},{f:392,d:0.5},{f:349,d:0.75},{f:392,d:0.25},
    {f:440,d:0.5},{f:494,d:0.5},{f:523,d:0.5},{f:587,d:0.5},
    {f:523,d:0.5},{f:494,d:0.5},{f:440,d:1.0},
    {f:392,d:0.5},{f:349,d:0.5},{f:392,d:0.5},{f:440,d:0.5},
    {f:494,d:0.5},{f:523,d:0.5},{f:494,d:0.75},{f:440,d:0.25},
    {f:392,d:0.5},{f:349,d:0.5},{f:330,d:0.5},{f:349,d:0.5},
    {f:392,d:2.0}
  ];

  // 🎵 Gentle harmony — lower octave
  const harmony = [
    {f:196,d:1.0},{f:262,d:1.0},{f:220,d:1.0},{f:196,d:1.0},
    {f:220,d:1.0},{f:262,d:1.0},{f:247,d:1.0},{f:220,d:1.0},
    {f:196,d:1.0},{f:175,d:1.0},{f:165,d:1.0},{f:175,d:1.0},
    {f:196,d:2.0}
  ];

  function scheduleTrack(notes, gainVal) {
    if (_bgMusic.stopped) return;
    const trackGain = ac.createGain();
    trackGain.gain.value = gainVal;
    trackGain.connect(master);

    let t = ac.currentTime + 0.1;
    const totalDuration = notes.reduce((s, n) => s + n.d, 0);

    notes.forEach(({ f, d }) => {
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.6, t + 0.05);
      g.gain.linearRampToValueAtTime(0.4, t + d - 0.05);
      g.gain.linearRampToValueAtTime(0, t + d);
      osc.connect(g);
      g.connect(trackGain);
      osc.start(t);
      osc.stop(t + d);
      t += d;
    });

    // Loop seamlessly
    setTimeout(() => {
      if (!_bgMusic.stopped) scheduleTrack(notes, gainVal);
    }, totalDuration * 1000 - 200);
  }

  scheduleTrack(melody, 1.0);
  scheduleTrack(harmony, 0.4);
}

function stopBGMusic() {
  if (_bgMusic) {
    _bgMusic.stopped = true;
    try { _bgMusic.gain.gain.linearRampToValueAtTime(0, _ac().currentTime + 0.5); } catch(e) {}
    _bgMusic = null;
  }
}

function toggleBGMusic() {
  if (_bgMusic) { stopBGMusic(); _bgMusicEnabled = false; }
  else { _bgMusicEnabled = true; startBGMusic(); }
}

// ── Sound Effects ──
function playSound(type) {
  try {
    const ac = _ac(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    const n = ac.currentTime;
    const sounds = {
      dice:    () => { o.frequency.setValueAtTime(320,n); o.frequency.exponentialRampToValueAtTime(140,n+0.14); g.gain.setValueAtTime(0.15,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.15); },
      snake:   () => { o.type='sawtooth'; o.frequency.setValueAtTime(220,n); o.frequency.exponentialRampToValueAtTime(55,n+0.55); g.gain.setValueAtTime(0.2,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.55); },
      ladder:  () => { o.type='sine'; o.frequency
