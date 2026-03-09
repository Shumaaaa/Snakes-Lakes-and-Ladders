// ═══════════════════════════
//  game.js — Main controller (game.html)
// ═══════════════════════════
let players     = [];
let currentTurn = 0;
let busy        = false;
let gameOver    = false;
let pendingRoll = null;

// Item click handler exposed to ui.js
window.handleItemClick = function(key) { _handleItemUse(key); };

// ── Init: load players from localStorage ──
window.addEventListener('load', () => {
  // Apply saved theme
  const theme = localStorage.getItem('asl_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  const tc = document.getElementById('themeCheck');
  if (tc) tc.checked = theme === 'light';

  // Load player config saved by index.html
  let saved;
  try { saved = JSON.parse(localStorage.getItem('asl_players') || 'null'); } catch { saved = null; }

  if (!saved || !saved.length) {
    // Fallback: 1 human + 1 CPU if accessed directly
    saved = [
      { name:'Adventurer', isHuman:true,  index:0 },
      { name:'Buddy',      isHuman:false, index:1 },
    ];
  }

  // Build full player objects
  players = saved.map((p, i) => {
    const fp = createPlayer(p.name, p.isHuman, i);
    return fp;
  });

  window._gamePlayers = players;

  generateBoard();
  initCanvas();
  initDice3D(); 
  drawFullBoard(players);
  startBoardAnimation(players);
  startTimer();
  _refreshUI();
  addLog('🗺️ The adventure begins! First to reach box 256 wins!', 'log-info');

  // CPU starts if first player is CPU
  if (!players[0].isHuman) setTimeout(_doRoll, 4000);
});

// ── Full UI refresh ──
function _refreshUI() {
  renderPlayerCards(players, currentTurn, pendingRoll);
  updateDiceUI(players[currentTurn], busy, gameOver);
}

// ── Dice ──
function rollDice() {
   startBGMusic();
  if (busy || gameOver || !players[currentTurn].isHuman) return;
  _doRoll();
}

function _doRoll() {
  busy = true; _refreshUI();
  const roll = Math.floor(Math.random() * 6) + 1;
  players[currentTurn].rollCount++;
  pendingRoll = roll;
  animateDice(roll);
  playSound('dice');
  // Refresh cards so converter lights up
  renderPlayerCards(players, currentTurn, pendingRoll);
  // Auto-execute after short delay (player can open converter first)
  setTimeout(() => { if (pendingRoll !== null) _executeMove(pendingRoll); }, 4000);
}

// ── Move execution ──
function _executeMove(roll) {
  pendingRoll = null;
  const p       = players[currentTurn];
  const prevPos = p.pos || 1;
  const result  = resolveMove(p, roll);

  result.log.forEach(l => addLog(l.text, l.cls));

  if (!result.moved) {
    // No movement — turn passes immediately
    busy = false;
    drawFullBoard(players);
    _refreshUI();
    setTimeout(_advanceTurn, 4000);
    return;
  }

  const targetPos = p.pos;
  p.pos = prevPos; // reset for animation start
  window._gamePlayers = players;

  animateGlide(currentTurn, prevPos, targetPos, players, () => {
    players[currentTurn].pos = targetPos;
    window._gamePlayers = players;
    drawFullBoard(players);
    _refreshUI();
    setTimeout(() => _handleSpecial(result.special, roll, targetPos), 4000);
  });
}

// ── Specials ──
function _handleSpecial(special, roll, landedPos) {
  const p = players[currentTurn];

  if (special === 'win')    { _endGame(currentTurn); return; }

  if (special === 'gift') {
    playSound('gift');
    animateGift(landedPos, players, () => { _refreshUI(); _afterSpecial(roll); });
    return;
  }

  if (special === 'snake') {
    p.snakesHit++;
    playSound('snake');
    addLog(`🐍 Snake at ${landedPos}! ${p.name} slithers down to ${snakeMap[landedPos]}…`, 'log-snake');
    animatePoof(currentTurn, landedPos, snakeMap[landedPos], players, () => {
      applyTerrain(players[currentTurn]);
      drawFullBoard(players); _refreshUI();
      _afterSpecial(roll);
    });
    return;
  }

  if (special === 'ladder') {
    p.laddersClimbed++;
    playSound('ladder');
    addLog(`🪜 Ladder at ${landedPos}! ${p.name} climbs to ${ladderMap[landedPos]}! 🎉`, 'log-ladder');
    animateLadderClimb(landedPos, ladderMap[landedPos], currentTurn, players, () => {
      applyTerrain(players[currentTurn]);
      drawFullBoard(players); _refreshUI();
      _afterSpecial(roll);
    });
    return;
  }

  if (special === 'bear') {
    playSound('bear');
    animateBear(currentTurn, players, () => {
      addLog(`🏥 ${p.name} is in hospital at box 64. Roll 6 to escape!`, 'log-hospital');
      drawFullBoard(players); _refreshUI();
      _afterSpecial(roll);
    });
    return;
  }

  _afterSpecial(roll);
}

function _afterSpecial(roll) {
  const p = players[currentTurn];
  // Bonus roll for 6 — only on normal ground
  if (roll === 6 && p.state === 'normal' && !gameOver) {
    addLog(`🎲 ${p.name} rolled 6 — BONUS ROLL! 🔥`, 'log-gift');
    busy = false; _refreshUI();
    if (!p.isHuman) setTimeout(_doRoll, 4000);
    return;
  }
  busy = false;
  _advanceTurn();
}

function _advanceTurn() {
  if (gameOver) return;
  currentTurn = (currentTurn + 1) % players.length;
  pendingRoll = null;
  _refreshUI();
  if (!players[currentTurn].isHuman) setTimeout(_doRoll, 4000);
}

// ── Item Usage ──
function _handleItemUse(key) {
  if (busy || gameOver) return;
  const p = players[currentTurn];
  if (!(p.inventory[key] > 0)) return;

  if (key === 'converter') {
    if (pendingRoll === null) { showToast('🎲 Roll first, then use the converter!'); return; }
    document.getElementById('originalRoll').textContent = pendingRoll;
    document.getElementById('converterModal').classList.add('show');
    return;
  }

  let msg = '';
  if      (key === 'jetpack')  { if (p.state !== 'lake' && p.state !== 'forest') { showToast('🚀 Jetpack only works in lake or forest!'); return; } msg = useJetpack(p); }
  else if (key === 'boat')     { if (p.state !== 'lake')    { showToast('🚤 Boat only works in a lake!'); return; }  msg = useBoat(p); }
  else if (key === 'bicycle')  { if (p.state !== 'normal')  { showToast('🚲 Bicycle only on normal ground!'); return; } msg = useBicycle(p); }
  else if (key === 'antidote') { if (p.state !== 'normal')  { showToast('💉 Antidote only on normal ground!'); return; } msg = useAntidote(p); }

  if (msg) { addLog(msg, 'log-gift'); _refreshUI(); drawFullBoard(players); }
}

function applyConverter(chosen) {
  document.getElementById('converterModal').classList.remove('show');
  if (pendingRoll === null) return;
  addLog(`🎲 ${players[currentTurn].name} converts ${pendingRoll} → ${chosen}`, 'log-gift');
  _removeItem(players[currentTurn], 'converter');
  pendingRoll = null;
  _executeMove(chosen);
}

function closeConverter() {
  document.getElementById('converterModal').classList.remove('show');
  if (pendingRoll !== null) { const r = pendingRoll; pendingRoll = null; _executeMove(r); }
}

// ── Win ──
function _endGame(idx) {
  gameOver = true; busy = false; stopTimer();
  const p   = players[idx];
  const sec = getElapsed();
  const m   = Math.floor(sec/60), s = sec % 60;
  saveRecord(p.name);
  addLog(`🏆 ${p.name} reached ${TOTAL_CELLS} — WINNER!! 🎉`, 'log-win');
  playSound('win');
  launchConfetti();
  const html = `
    <div class="stat-box"><div class="stat-val">${p.rollCount}</div><div class="stat-lbl">Rolls</div></div>
    <div class="stat-box"><div class="stat-val">${m}:${String(s).padStart(2,'0')}</div><div class="stat-lbl">Time</div></div>
    <div class="stat-box"><div class="stat-val">${p.snakesHit}</div><div class="stat-lbl">🐍 Snakes</div></div>
    <div class="stat-box"><div class="stat-val">${p.laddersClimbed}</div><div class="stat-lbl">🪜 Ladders</div></div>`;
  setTimeout(() => showWinModal(p, html), 900);
  _refreshUI();
}
