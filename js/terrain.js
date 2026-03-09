// ═══════════════════════════
//  terrain.js — Board generation: lakes, forests, snakes, ladders, gifts
// ═══════════════════════════
let lakeCells   = new Set();
let forestCells = new Set();
let snakeMap    = {};   // head → tail
let ladderMap   = {};   // base → top
let giftCells   = {};   // box → itemKey

function _rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function _shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = _rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function _neighbors(n) {
  const nb = [];
  if (n > BOARD_SIZE) nb.push(n - BOARD_SIZE);
  if (n <= TOTAL_CELLS - BOARD_SIZE) nb.push(n + BOARD_SIZE);
  if ((n - 1) % BOARD_SIZE !== 0) nb.push(n - 1);
  if (n % BOARD_SIZE !== 0) nb.push(n + 1);
  return nb;
}

function _growBlob(seed, size, avoid) {
  if (seed < 1 || seed > TOTAL_CELLS || avoid.has(seed)) return [];
  const blob = [seed]; avoid.add(seed);
  for (let s = 0; s < size * 5 && blob.length < size; s++) {
    const base = blob[_rand(0, blob.length - 1)];
    const nbs  = _neighbors(base);
    const next = nbs[_rand(0, nbs.length - 1)];
    if (next >= 1 && next <= TOTAL_CELLS && !avoid.has(next)) {
      blob.push(next); avoid.add(next);
    }
  }
  return blob;
}

function generateBoard() {
  lakeCells = new Set(); forestCells = new Set();
  snakeMap = {}; ladderMap = {}; giftCells = {};

  const reserved = new Set([1, HOSPITAL_BOX, TOTAL_CELLS]);

  // Lakes — 4 corner blobs, up to 12 cells each
  const lakeSeeds = [
    _rand(2, 5), _rand(BOARD_SIZE - 2, BOARD_SIZE),
    _rand(TOTAL_CELLS - BOARD_SIZE + 1, TOTAL_CELLS - BOARD_SIZE + 4),
    _rand(TOTAL_CELLS - 4, TOTAL_CELLS - 1)
  ];
  lakeSeeds.forEach(seed => {
    _growBlob(seed, _rand(6, 12), new Set(reserved))
      .forEach(b => { if (!reserved.has(b)) { lakeCells.add(b); reserved.add(b); } });
  });

  // Forests — 4 mid-board blobs
  [_rand(55,75), _rand(95,115), _rand(145,165), _rand(185,205)].forEach(seed => {
    if (lakeCells.has(seed) || reserved.has(seed)) return;
    _growBlob(seed, _rand(5, 9), new Set(reserved))
      .forEach(b => { if (!lakeCells.has(b) && !reserved.has(b)) { forestCells.add(b); reserved.add(b); } });
  });

  // Snakes — 16
  let pool = _shuffle([...Array(TOTAL_CELLS - 30)].map((_, i) => i + 30))
    .filter(n => !reserved.has(n) && !lakeCells.has(n) && !forestCells.has(n));
  let sc = 0;
  for (let i = 0; i < pool.length && sc < 16; i++) {
    const h = pool[i];
    const t = _rand(Math.max(2, h - 70), h - 12);
    if (!reserved.has(t) && !lakeCells.has(t) && t >= 2) {
      snakeMap[h] = t; reserved.add(h); reserved.add(t); sc++;
    }
  }

  // Ladders — 14
  pool = _shuffle([...Array(TOTAL_CELLS - 20)].map((_, i) => i + 2))
    .filter(n => !reserved.has(n) && !lakeCells.has(n) && !forestCells.has(n));
  let lc = 0;
  for (let i = 0; i < pool.length && lc < 14; i++) {
    const b = pool[i];
    const t = _rand(b + 14, Math.min(TOTAL_CELLS - 1, b + 65));
    if (!reserved.has(t) && !lakeCells.has(t) && t < TOTAL_CELLS) {
      ladderMap[b] = t; reserved.add(b); reserved.add(t); lc++;
    }
  }

  // Gifts — 20
  const itemKeys = Object.keys(ITEMS);
  pool = _shuffle([...Array(TOTAL_CELLS)].map((_, i) => i + 1))
    .filter(n => !reserved.has(n) && !lakeCells.has(n) && !forestCells.has(n)
              && !snakeMap[n] && !ladderMap[n]);
  for (let i = 0; i < 20 && i < pool.length; i++) {
    giftCells[pool[i]] = itemKeys[_rand(0, itemKeys.length - 1)];
  }
}
