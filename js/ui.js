// ═══════════════════════════
//  ui.js — All UI: per-player cards, dice, log, timer, HOF
// ═══════════════════════════

// ── Theme ──
function toggleTheme() {
  const html    = document.documentElement;
  const isLight = html.getAttribute('data-theme') === 'light';
  html.setAttribute('data-theme', isLight ? 'dark' : 'light');
  document.querySelectorAll('#themeCheck').forEach(c => c.checked = !isLight);
  localStorage.setItem('asl_theme', isLight ? 'dark' : 'light');
  if (window._gamePlayers) drawFullBoard(window._gamePlayers);
}

function goHome() {
  stopTimer();
  window.location.href = 'index.html';
}

// ── Per-Player Cards ──
// Each player gets their own card with name, position, state, stats AND inventory
function renderPlayerCards(players, currentTurn, pendingRoll) {
  const container = document.getElementById('playerCards');
  if (!container) return;

  container.innerHTML = players.map((p, i) => {
    const isActive = i === currentTurn;
    const stateInfo = {
      normal:   { icon:'',    label:'' },
      lake:     { icon:'🌊', label:'Swimming' },
      forest:   { icon:'🌲', label:`Lost in Forest [${p.forestFails}/3]` },
      hospital: { icon:'🏥', label:'Hospital — needs 6' },
    }[p.state] || { icon:'', label:'' };

    const invHtml = _buildInvHtml(p, i, isActive, pendingRoll);

    return `
    <div class="player-card ${isActive ? 'player-card-active' : ''}" id="pcard-${i}"
         style="--pcolor:${P_COLORS[i%4]}">
      <div class="pcard-header">
        <span class="pcard-avatar">${P_AVATARS[i%4]}</span>
        <div class="pcard-info">
          <div class="pcard-name">${p.name}${p.isHuman ? '' : ' 🤖'}</div>
          <div class="pcard-detail">
            ${stateInfo.icon} ${stateInfo.label}
            ${p.pos ? `· Box <b>${p.pos}</b>` : '· Not started'}
          </div>
        </div>
        <div class="pcard-stats">
          <div class="pstat">🎲${p.rollCount}</div>
          <div class="pstat">🐍${p.snakesHit}</div>
          <div class="pstat">🪜${p.laddersClimbed}</div>
        </div>
        ${isActive ? '<div class="pcard-active-tag">YOUR TURN</div>' : ''}
      </div>
      <div class="pcard-inv">
        <div class="pcard-inv-label">🎒 Inventory</div>
        <div class="pcard-inv-grid">${invHtml}</div>
      </div>
    </div>`;
  }).join('');
}

function _buildInvHtml(p, playerIdx, isActive, pendingRoll) {
  const keys = Object.keys(p.inventory || {}).filter(k => p.inventory[k] > 0);
  if (!keys.length) return '<span class="inv-empty-sm">Empty</span>';

  const usable = isActive ? getUsableItems(p, pendingRoll) : new Set();

  return keys.map(key => {
    const item   = ITEMS[key];
    const count  = p.inventory[key];
    const isConv = key === 'converter' && usable.has('converter');
    const isUse  = usable.has(key) && !isConv;
    const cls    = isConv ? 'inv-converter' : isUse ? 'inv-usable' : '';
    const click  = isActive ? `onclick="handleItemClick('${key}')"` : '';
    return `<div class="inv-item ${cls}" title="${item.name}: ${item.desc}" ${click}>
              ${item.emoji}<span class="item-count">${count}</span>
            </div>`;
  }).join('');
}

// Refresh just the inventory section of a player card (lighter than full re-render)
function refreshPlayerCard(players, playerIdx, currentTurn, pendingRoll) {
  renderPlayerCards(players, currentTurn, pendingRoll);
}

// ── Dice UI ──
function updateDiceUI(currentPlayer, busy, gameOver) {
  const lbl  = document.getElementById('turnLabel');
  const btn  = document.getElementById('rollBtn');
  const stat = document.getElementById('statusMsg');
  if (!lbl || !btn) return;

  lbl.textContent = currentPlayer.isHuman
    ? `${currentPlayer.name}'s Turn!`
    : `${currentPlayer.name} is thinking…`;

  btn.disabled = !currentPlayer.isHuman || busy || gameOver;

  const msgs = {
    lake:     `🌊 Even roll ÷2 moves you. Odd = skip turn.`,
    forest:   `🌲 Odd roll moves you. Even = skip [${currentPlayer.forestFails}/3 fails].`,
    hospital: `🏥 Need to roll 6 to be discharged!`,
    normal:   '',
  };
  if (stat) stat.textContent = msgs[currentPlayer.state] || '';
}

// Build 3D dice once on load
function initDice3D() {
  const el = document.getElementById('diceDisplay');
  if (!el) return;
  el.innerHTML = `
    <div class="dice-scene">
      <div class="dice-cube" id="diceCube">
        <div class="face face-1">⚀</div>
        <div class="face face-2">⚁</div>
        <div class="face face-3">⚂</div>
        <div class="face face-4">⚃</div>
        <div class="face face-5">⚄</div>
        <div class="face face-6">⚅</div>
      </div>
    </div>`;
}

// Final rotation to show correct face
const DICE_ROTATIONS = {
  1: 'rotateY(0deg)   rotateX(0deg)',
  2: 'rotateY(-90deg) rotateX(0deg)',
  3: 'rotateY(180deg) rotateX(0deg)',
  4: 'rotateY(90deg)  rotateX(0deg)',
  5: 'rotateX(-90deg) rotateX(0deg)',
  6: 'rotateX(90deg)  rotateX(0deg)',
};

function animateDice(roll) {
  const cube = document.getElementById('diceCube');
  if (!cube) return;
  cube.classList.remove('rolling');
  void cube.offsetWidth;
  cube.classList.add('rolling');
  // Land on correct face after animation
  setTimeout(() => {
    cube.classList.remove('rolling');
    cube.style.transform = DICE_ROTATIONS[roll];
  }, 600);
}


// ── Log ──
function addLog(text, cls) {
  const log = document.getElementById('gameLog');
  if (!log) return;
  const div = document.createElement('div');
  div.className  = 'log-entry ' + (cls || '');
  div.textContent = text;
  log.prepend(div);
}

// ── Timer ──
let _timerInterval = null;
let _startTime     = null;

function startTimer() {
  stopTimer();
  _startTime = Date.now();
  _timerInterval = setInterval(() => {
    const s   = Math.floor((Date.now() - _startTime) / 1000);
    const m   = Math.floor(s / 60), sec = s % 60;
    const el  = document.getElementById('timerDisplay');
    if (el) el.textContent = `⏱️ ${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }, 1000);
}

function stopTimer()    { clearInterval(_timerInterval); }
function getElapsed()   { return _startTime ? Math.floor((Date.now() - _startTime) / 1000) : 0; }

// ── HOF ──
function getHOF()    { try { return JSON.parse(localStorage.getItem('asl_hof') || '{}'); } catch { return {}; } }
function saveRecord(name) { const r = getHOF(); r[name] = (r[name]||0)+1; localStorage.setItem('asl_hof', JSON.stringify(r)); }

// ── Toast ──
function showToast(msg) {
  const t = document.getElementById('itemPrompt');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

// ── Win Modal ──
function showWinModal(player, statsHtml) {
  document.getElementById('winTitle').textContent = player.isHuman
    ? `🎉 ${player.name} Wins!` : `🤖 ${player.name} Wins!`;
  document.getElementById('winSub').textContent = `Reached box ${TOTAL_CELLS} — adventure complete!`;
  document.getElementById('statsGrid').innerHTML = statsHtml;
  document.getElementById('winModal').classList.add('show');
}

// ── Confetti ──
function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:400;width:100%;height:100%';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx   = canvas.getContext('2d');
  const cols  = ['#e94560','#4ecca3','#f5a623','#a855f7','#60a5fa','#fff'];
  const pieces = Array.from({ length: 200 }, () => ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height - canvas.height,
    r: Math.random()*9+4, d: Math.random()*7+2,
    color: cols[Math.floor(Math.random()*cols.length)],
    tilt:0, tiltAngle:0, tiltSpeed: Math.random()*0.1+0.04
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p => {
      p.tiltAngle+=p.tiltSpeed; p.y+=p.d; p.tilt=Math.sin(p.tiltAngle)*13;
      ctx.beginPath(); ctx.lineWidth=p.r; ctx.strokeStyle=p.color;
      ctx.moveTo(p.x+p.tilt+p.r/2,p.y); ctx.lineTo(p.x+p.tilt,p.y+p.tilt+p.r/2);
      ctx.stroke();
      if (p.y > canvas.height) { p.y=-10; p.x=Math.random()*canvas.width; }
    });
    if (++frame < 280) requestAnimationFrame(draw); else canvas.remove();
  }
  draw();
}
