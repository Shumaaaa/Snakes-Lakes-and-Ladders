// ═══════════════════════════
//  board.js — Canvas + drawing. Board fills available space.
// ═══════════════════════════
let CELL_SIZE   = 42;
let CANVAS_SIZE = BOARD_SIZE * CELL_SIZE;
let _ctx        = null;
let _animFrame = null;
let _animTime  = 0;

function startBoardAnimation(players) {
  if (_animFrame) cancelAnimationFrame(_animFrame);
  function loop(ts) {
    _animTime = ts * 0.001; // seconds
    drawFullBoard(players);
    _animFrame = requestAnimationFrame(loop);
  }
  _animFrame = requestAnimationFrame(loop);
}

function stopBoardAnimation() {
  if (_animFrame) cancelAnimationFrame(_animFrame);
  _animFrame = null;
}

function cellCoords(n) {
  if (n < 1 || n > TOTAL_CELLS) return { x: CELL_SIZE/2, y: CELL_SIZE/2 };
  const idx = n - 1;
  const row = Math.floor(idx / BOARD_SIZE);
  const col = idx % BOARD_SIZE;
  const bx  = (row % 2 === 0) ? col : (BOARD_SIZE - 1 - col);
  const by  = BOARD_SIZE - 1 - row;
  return { x: bx * CELL_SIZE + CELL_SIZE/2, y: by * CELL_SIZE + CELL_SIZE/2 };
}

function cellRect(n) {
  const c = cellCoords(n);
  return { x: c.x - CELL_SIZE/2, y: c.y - CELL_SIZE/2, w: CELL_SIZE, h: CELL_SIZE };
}

function initCanvas() {
  const canvas = document.getElementById('gameCanvas');
  const wrap   = document.querySelector('.board-wrap');
  // Use as much space as possible — full viewport minus side panel
  const sidePanelW = 290;
  const topBarH    = 50;
  const pad        = 20;
  const availW     = Math.max(300, window.innerWidth  - sidePanelW - pad * 2);
  const availH     = Math.max(300, window.innerHeight - topBarH    - pad * 2);
  const avail      = Math.min(availW, availH);
  CELL_SIZE   = Math.max(28, Math.floor(avail / BOARD_SIZE));
  CANVAS_SIZE = BOARD_SIZE * CELL_SIZE;
  canvas.width = canvas.height = CANVAS_SIZE;
  _ctx = canvas.getContext('2d');
  return _ctx;
}

function getCtx() { return _ctx; }

function drawFullBoard(players, highlights) {
  if (!_ctx) return;
  _ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  _drawCells(highlights || {});
  _drawTerrain();
  _drawSnakes();
  _drawLadders();
  _drawGifts();
  _drawHospital();
  if (players && players.length) _drawPlayers(players);
}

function _drawCells(highlights) {
  const dark = document.documentElement.getAttribute('data-theme') !== 'light';
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const rfb = BOARD_SIZE - 1 - r;
      const col = rfb % 2 === 0 ? c : BOARD_SIZE - 1 - c;
      const num = rfb * BOARD_SIZE + col + 1;
      const x   = c * CELL_SIZE, y = r * CELL_SIZE;

      // ⬛ Black cells with subtle blue tint alternating
      let bg = (r + c) % 2 === 0 ? '#0a0a0a' : '#0d0d1a';
      if (highlights[num]) bg = highlights[num];

      _ctx.fillStyle = bg;
      _ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

      // Glowing border
      _ctx.strokeStyle = '#00b4d833';
      _ctx.lineWidth = 0.8;
      _ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

      // Cell number
      _ctx.fillStyle  = '#ffffff18';
      _ctx.font       = `bold ${Math.max(9, CELL_SIZE * 0.2)}px Segoe UI`;
      _ctx.textAlign  = 'center';
      _ctx.textBaseline = 'top';
      _ctx.fillText(num, x + CELL_SIZE/2, y + 2);
    }
  }
}


function _drawTerrain() {
  const t = _animTime;

  // 🌊 Animated Lakes
  lakeCells.forEach(n => {
    const r = cellRect(n);
    const wave = Math.sin(t * 2 + n * 0.5) * 0.15 + 0.25;
    _ctx.fillStyle = `rgba(0,180,216,${wave})`;
    _ctx.fillRect(r.x, r.y, r.w, r.h);

    // Ripple lines
    _ctx.save();
    _ctx.strokeStyle = `rgba(144,224,239,${wave * 0.8})`;
    _ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const wy = r.y + r.h * (0.3 + i * 0.2) + Math.sin(t * 3 + i + n) * 2;
      _ctx.beginPath();
      _ctx.moveTo(r.x + 3, wy);
      _ctx.bezierCurveTo(
        r.x + r.w*0.3, wy - 2 + Math.sin(t*2+i)*2,
        r.x + r.w*0.7, wy + 2 + Math.cos(t*2+i)*2,
        r.x + r.w - 3, wy
      );
      _ctx.stroke();
    }
    _ctx.restore();

    if (CELL_SIZE > 30) {
      _ctx.save(); _ctx.globalAlpha = 0.5;
      _ctx.font = `${CELL_SIZE*0.32}px serif`;
      _ctx.textAlign = 'center'; _ctx.textBaseline = 'middle';
      _ctx.fillText('🌊', r.x+r.w*0.74, r.y+r.h*0.74);
      _ctx.restore();
    }
  });

  // 🌲 Animated Forests — shimmer effect
  forestCells.forEach(n => {
    const r = cellRect(n);
    const shimmer = Math.sin(t * 1.5 + n * 0.7) * 0.1 + 0.22;
    _ctx.fillStyle = `rgba(30,150,60,${shimmer})`;
    _ctx.fillRect(r.x, r.y, r.w, r.h);

    if (CELL_SIZE > 30) {
      _ctx.save();
      // Sway the tree emoji
      const sway = Math.sin(t * 2 + n) * 0.08;
      _ctx.translate(r.x + r.w*0.74, r.y + r.h*0.74);
      _ctx.rotate(sway);
      _ctx.globalAlpha = 0.55;
      _ctx.font = `${CELL_SIZE*0.32}px serif`;
      _ctx.textAlign = 'center'; _ctx.textBaseline = 'middle';
      _ctx.fillText('🌲', 0, 0);
      _ctx.restore();
    }
  });
}

function _drawSnakes() {
  const t = _animTime;
  Object.entries(snakeMap).forEach(([h, tail]) => {
    const f  = cellCoords(+h);
    const to = cellCoords(+tail);
    _ctx.save();

    // Draw wavy snake body
    const segments = 40;
    const grad = _ctx.createLinearGradient(f.x, f.y, to.x, to.y);
    grad.addColorStop(0,  '#e94560ff');
    grad.addColorStop(0.5,'#ff6b35cc');
    grad.addColorStop(1,  '#8b0000aa');

    _ctx.strokeStyle = grad;
    _ctx.lineWidth   = Math.max(3, CELL_SIZE * 0.12);
    _ctx.lineCap     = 'round';
    _ctx.lineJoin    = 'round';
    _ctx.setLineDash([]);

    _ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const pct = i / segments;
      const bx  = f.x + (to.x - f.x) * pct;
      const by  = f.y + (to.y - f.y) * pct;

      // Perpendicular wave
      const dx  = to.x - f.x, dy = to.y - f.y;
      const len = Math.hypot(dx, dy) || 1;
      const px  = -dy / len, py = dx / len;

      // Amplitude shrinks toward tail
      const amp   = CELL_SIZE * 0.35 * (1 - pct * 0.6);
      const wave  = Math.sin(pct * Math.PI * 4 - t * 4) * amp;

      const wx = bx + px * wave;
      const wy = by + py * wave;

      if (i === 0) _ctx.moveTo(wx, wy);
      else _ctx.lineTo(wx, wy);
    }
    _ctx.stroke();

    // Snake head 🐍
    _ctx.font = `${CELL_SIZE * 0.52}px serif`;
    _ctx.textAlign = 'center'; _ctx.textBaseline = 'middle';
    // Bobbing head
    const bob = Math.sin(t * 3 + +h) * 2;
    _ctx.fillText('🐍', f.x, f.y + bob);

    // Tail marker
    _ctx.font = `${CELL_SIZE * 0.32}px serif`;
    _ctx.fillText('💀', to.x, to.y);

    _ctx.restore();
  });
}

function _drawLadders() {
  Object.entries(ladderMap).forEach(([b, t]) => {
    const f=cellCoords(+b), to=cellCoords(+t);
    const ang=Math.atan2(to.y-f.y,to.x-f.x)+Math.PI/2;
    const off=CELL_SIZE*0.1, dx=Math.cos(ang)*off, dy=Math.sin(ang)*off;
    _ctx.save();
    _ctx.strokeStyle='#4ecca3cc'; _ctx.lineWidth=Math.max(2,CELL_SIZE*0.07); _ctx.lineCap='round';
    _ctx.beginPath(); _ctx.moveTo(f.x-dx,f.y-dy); _ctx.lineTo(to.x-dx,to.y-dy); _ctx.stroke();
    _ctx.beginPath(); _ctx.moveTo(f.x+dx,f.y+dy); _ctx.lineTo(to.x+dx,to.y+dy); _ctx.stroke();
    const dist=Math.hypot(to.x-f.x,to.y-f.y), steps=Math.max(2,Math.floor(dist/(CELL_SIZE*0.55)));
    _ctx.lineWidth=Math.max(1.5,CELL_SIZE*0.05); _ctx.strokeStyle='#4ecca355';
    for(let i=1;i<steps;i++){const rx=f.x+(to.x-f.x)*i/steps,ry=f.y+(to.y-f.y)*i/steps;
      _ctx.beginPath();_ctx.moveTo(rx-dx*1.5,ry-dy*1.5);_ctx.lineTo(rx+dx*1.5,ry+dy*1.5);_ctx.stroke();}
    const mx=(f.x+to.x)/2, my=(f.y+to.y)/2;
    _ctx.font=`${CELL_SIZE*0.5}px serif`; _ctx.textAlign='center'; _ctx.textBaseline='middle';
    _ctx.fillText('🧗',mx,my);
    _ctx.font=`${CELL_SIZE*0.36}px serif`; _ctx.fillText('🪜',f.x,f.y);
    _ctx.restore();
  });
}

function _drawGifts() {
  Object.keys(giftCells).forEach(box => {
    const c = cellCoords(+box);
    _ctx.globalAlpha=0.9; _ctx.font=`${CELL_SIZE*0.46}px serif`;
    _ctx.textAlign='center'; _ctx.textBaseline='middle';
    _ctx.fillText('🎁',c.x,c.y); _ctx.globalAlpha=1;
  });
}

function _drawHospital() {
  const r=cellRect(HOSPITAL_BOX), c=cellCoords(HOSPITAL_BOX);
  _ctx.fillStyle='rgba(255,50,50,0.18)'; _ctx.fillRect(r.x,r.y,r.w,r.h);
  _ctx.font=`${CELL_SIZE*0.5}px serif`; _ctx.textAlign='center'; _ctx.textBaseline='middle';
  _ctx.fillText('🏥',c.x,c.y);
}

function _drawPlayers(players) {
  const slots=[
    {ox:-CELL_SIZE*0.2, oy:-CELL_SIZE*0.2},
    {ox: CELL_SIZE*0.2, oy:-CELL_SIZE*0.2},
    {ox:-CELL_SIZE*0.2, oy: CELL_SIZE*0.2},
    {ox: CELL_SIZE*0.2, oy: CELL_SIZE*0.2}
  ];
  players.forEach((p, i) => {
    if (!p.pos) return;
    const c  = cellCoords(p.pos);
    const sl = slots[i % 4];
    const px = c.x + sl.ox, py = c.y + sl.oy;
    _ctx.save();
    _ctx.shadowColor = P_COLORS[i%4]; _ctx.shadowBlur = 12;
    _ctx.beginPath(); _ctx.arc(px, py, CELL_SIZE*0.2, 0, Math.PI*2);
    _ctx.fillStyle = P_COLORS[i%4]+'cc'; _ctx.fill();
    _ctx.restore();
    _ctx.font=`${CELL_SIZE*0.3}px serif`;
    _ctx.textAlign='center'; _ctx.textBaseline='middle';
    _ctx.fillText(P_AVATARS[i%4], px, py);
  });
}

// Resize board when window resizes
window.addEventListener('resize', () => {
  if (window._gamePlayers && document.getElementById('gameCanvas')) {
    initCanvas();
    drawFullBoard(window._gamePlayers);
  }
});
