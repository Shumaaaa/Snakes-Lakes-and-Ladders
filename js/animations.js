// ═══════════════════════════
//  animations.js — All dramatic board animations
// ═══════════════════════════

// Step-by-step glide with drama near snakes
function animateGlide(playerIdx, fromPos, toPos, players, callback) {
  if (fromPos === toPos || fromPos === 0) { callback(); return; }
  const path = [];
  for (let i = Math.max(1, fromPos); i <= toPos; i++) path.push(i);
  if (!path.length) { callback(); return; }

  const snakeHeads = Object.keys(snakeMap).map(Number);
  const nearSnake  = snakeHeads.includes(toPos);
  let step = 0;

  function tick() {
    const cur = path[step];
    const distFromEnd = path.length - 1 - step;
    const isLast = step === path.length - 1;
    const isTense = nearSnake && distFromEnd <= 2;

    // Highlight colour
    const hl = {};
    hl[cur] = isTense ? 'rgba(233,69,96,0.5)' : (P_COLORS[playerIdx % 4] + '33');

    const saved = players[playerIdx].pos;
    players[playerIdx].pos = cur;
    drawFullBoard(players, hl);
    players[playerIdx].pos = saved;

    // Shake + scary emoji on final snake square
    if (isLast && nearSnake) {
      players[playerIdx].pos = cur;
      _shakeCell(cur, players, callback);
      return;
    }

    step++;
    const delay = isTense ? 300 : 95;
    if (step < path.length) setTimeout(tick, delay);
    else { players[playerIdx].pos = toPos; drawFullBoard(players); callback(); }
  }
  tick();
}

function _shakeCell(cellNum, players, callback) {
  let f = 0; const total = 20;
  const off = [0,5,-5,7,-7,6,-6,4,-4,2,-2,1,-1,0,0,0,0,0,0,0];
  function step() {
    drawFullBoard(players, { [cellNum]: 'rgba(233,69,96,0.65)' });
    const c = cellCoords(cellNum), ctx = getCtx();
    ctx.font = `${CELL_SIZE*0.55}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('😱', c.x + (off[f]||0), c.y);
    f++;
    if (f < total) requestAnimationFrame(step); else callback();
  }
  step();
}

// Poof vanish then reappear flash
function animatePoof(playerIdx, fromBox, toBox, players, callback) {
  const from = cellCoords(fromBox);
  let f = 0; const total = 14;
  function step() {
    drawFullBoard(players);
    const ctx = getCtx();
    ctx.save(); ctx.globalAlpha = 1 - f/total;
    ctx.font = `${CELL_SIZE * (1 + f*0.06)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💨', from.x, from.y);
    ctx.restore();
    f++;
    if (f < total) requestAnimationFrame(step);
    else {
      players[playerIdx].pos = toBox;
      drawFullBoard(players);
      _flashCell(toBox, '#e94560', players, callback);
    }
  }
  step();
}

function _flashCell(cellNum, color, players, callback) {
  let f = 0;
  function step() {
    drawFullBoard(players, f % 2 === 0 ? { [cellNum]: color + '55' } : {});
    f++;
    if (f < 8) setTimeout(step, 75); else { drawFullBoard(players); callback(); }
  }
  step();
}

// Ladder smooth climb
function animateLadderClimb(fromBox, toBox, playerIdx, players, callback) {
  const f = cellCoords(fromBox), t = cellCoords(toBox);
  let frame = 0; const total = 32;
  function step() {
    drawFullBoard(players);
    const ctx = getCtx(); const p = frame / total;
    const cx = f.x + (t.x-f.x)*p, cy = f.y + (t.y-f.y)*p;
    ctx.save(); ctx.shadowColor='#4ecca3'; ctx.shadowBlur=14;
    ctx.font=`${CELL_SIZE*0.3}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(P_AVATARS[playerIdx%4], cx, cy);
    ctx.restore();
    frame++;
    if (frame < total) requestAnimationFrame(step);
    else { players[playerIdx].pos = toBox; drawFullBoard(players); callback(); }
  }
  step();
}

// Bear charges in, ambulance drives to hospital
function animateBear(playerIdx, players, callback) {
  let f = 0; const total = 38;
  function step() {
    drawFullBoard(players);
    const ctx=getCtx(), t=f/total;
    const bx = -CELL_SIZE*2 + (CANVAS_SIZE/2 + CELL_SIZE*2)*t;
    ctx.font=`${CELL_SIZE*1.1}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🐻', bx, CANVAS_SIZE/2);
    f++;
    if (f < total) requestAnimationFrame(step);
    else setTimeout(() => {
      animatePoof(playerIdx, players[playerIdx].pos, HOSPITAL_BOX, players, () => {
        _animateAmbulance(players, callback);
      });
    }, 200);
  }
  step();
}

function _animateAmbulance(players, callback) {
  let f = 0; const total = 34;
  const hospC = cellCoords(HOSPITAL_BOX);
  function step() {
    drawFullBoard(players);
    const ctx=getCtx(), t=f/total;
    const ax = CANVAS_SIZE + CELL_SIZE - (CANVAS_SIZE + CELL_SIZE - hospC.x)*t;
    ctx.font=`${CELL_SIZE*0.85}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🚑', ax, hospC.y);
    f++;
    if (f < total) requestAnimationFrame(step);
    else _flashCell(HOSPITAL_BOX, '#f43f5e', players, callback);
  }
  step();
}

// Gift sparkle
function animateGift(cellNum, players, callback) {
  let f = 0; const total = 22; const c = cellCoords(cellNum);
  function step() {
    drawFullBoard(players);
    const ctx=getCtx(), t=f/total;
    ctx.save(); ctx.globalAlpha=1-t;
    ctx.font=`${CELL_SIZE*(0.5+t*0.6)}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('✨', c.x, c.y - t*CELL_SIZE*0.9);
    ctx.restore();
    f++;
    if (f < total) requestAnimationFrame(step); else callback();
  }
  step();
}
