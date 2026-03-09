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

  // 🎵 Real Shire melody — D major, read from sheet
  const D4=293.66, E4=329.63, FS4=369.99, G4=392, A4=440,
        D5=587.33, E5=659.25, FS5=739.99, G5=783.99, A5=880;

  const melody = [
    {f:D5,d:1.0},{f:E5,d:0.5},{f:FS5,d:0.5},
    {f:A5,d:2.0},{f:G5,d:1.0},{f:FS5,d:1.0},
    {f:E5,d:1.0},{f:G5,d:1.0},{f:FS5,d:1.0},{f:E5,d:1.0},
    {f:D5,d:4.0},
    {f:E5,d:1.0},{f:FS5,d:0.5},{f:G5,d:0.5},
    {f:A5,d:2.0},{f:G5,d:1.0},{f:FS5,d:1.0},
    {f:G5,d:1.0},{f:E5,d:1.0},{f:D5,d:2.0},
    {f:D5,d:4.0}
  ];

  // 🎵 Harmony — one octave down
  const harmony = [
    {f:D4,d:2.0},{f:A4,d:2.0},
    {f:G4,d:2.0},{f:FS4,d:2.0},
    {f:E4,d:2.0},{f:A4,d:2.0},
    {f:D4,d:4.0},
    {f:D4,d:2.0},{f:A4,d:2.0},
    {f:G4,d:2.0},{f:FS4,d:2.0},
    {f:G4,d:2.0},{f:D4,d:2.0},
    {f:D4,d:4.0}
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
      g.gain.linearRampToValueAtTime(0.4, t + d - 0.08);
      g.gain.linearRampToValueAtTime(0, t + d);
      osc.connect(g);
      g.connect(trackGain);
      osc.start(t);
      osc.stop(t + d);
      t += d;
    });

    setTimeout(() => {
      if (!_bgMusic.stopped) scheduleTrack(notes, gainVal);
    }, totalDuration * 1000 - 200);
  }

  scheduleTrack(melody, 1.0);
  scheduleTrack(harmony, 0.35);
}


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
      ladder:  () => { o.type='sine'; o.frequency.setValueAtTime(440,n); o.frequency.exponentialRampToValueAtTime(900,n+0.35); g.gain.setValueAtTime(0.14,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.4); },
      bear:    () => { o.type='sawtooth'; o.frequency.setValueAtTime(130,n); o.frequency.exponentialRampToValueAtTime(38,n+0.65); g.gain.setValueAtTime(0.28,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.65); },
      gift:    () => { o.type='sine'; o.frequency.setValueAtTime(660,n); o.frequency.setValueAtTime(880,n+0.1); g.gain.setValueAtTime(0.12,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.25); },
      win:     () => { o.type='sine'; o.frequency.setValueAtTime(523,n); o.frequency.setValueAtTime(659,n+0.15); o.frequency.setValueAtTime(784,n+0.3); o.frequency.setValueAtTime(1047,n+0.45); g.gain.setValueAtTime(0.2,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.75); },
      hospital:() => { o.type='square'; o.frequency.setValueAtTime(440,n); o.frequency.setValueAtTime(370,n+0.2); g.gain.setValueAtTime(0.1,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.4); },
    };
    if (sounds[type]) sounds[type]();
    o.start(n); o.stop(n + 0.8);
  } catch(e) {}
}
