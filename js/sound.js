// ═══════════════════════════
//  sound.js — Web Audio sound effects + Background Music
// ═══════════════════════════
let _audioCtx = null;
let _bgAudio = null;
let _bgMusicEnabled = true;
let _currentTrack = 0;

const _bgTracks = [
  'audio/Fearsome Tipsy Pirates (Pirates Epic trailer).mp3',
  'audio/Hero Marvel Superhero Music.mp3',
  'audio/Pirates Action Loop.mp3',
  'audio/The First Tree of Middle Earth.mp3',
  'audio/There be Pirates - The Quest.mp3'
];

function _ac() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}

// ── Background Music ──
function startBGMusic() {
  if (_bgAudio || !_bgMusicEnabled) return;
  _bgAudio = new Audio(_bgTracks[_currentTrack]);
  _bgAudio.loop = false;
  _bgAudio.volume = 0.3;
  _bgAudio.play().catch(e => console.warn('Audio play failed:', e));
  _bgAudio.addEventListener('ended', () => {
    _bgAudio = null;
    _currentTrack = (_currentTrack + 1) % _bgTracks.length;
    startBGMusic();
  });
}

function stopBGMusic() {
  if (_bgAudio) {
    _bgAudio.pause();
    _bgAudio.currentTime = 0;
    _bgAudio = null;
  }
}

function toggleBGMusic() {
  if (_bgAudio) {
    stopBGMusic();
    _bgMusicEnabled = false;
  } else {
    _bgMusicEnabled = true;
    startBGMusic();
  }
}

// ── Sound Effects ──
function playSound(type) {
  try {
    const ac = _ac(); if (!ac) return;
    // Unlock AudioContext if suspended
    if (ac.state === 'suspended') ac.resume();
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
