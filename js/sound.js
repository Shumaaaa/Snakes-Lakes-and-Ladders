// ═══════════════════════════
//  sound.js — Web Audio sound effects
// ═══════════════════════════
let _audioCtx = null;

function _ac() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}

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
