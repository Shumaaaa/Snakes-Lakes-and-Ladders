// ═══════════════════════════
//  players.js — Player state, movement rules, item effects
// ═══════════════════════════

function createPlayer(name, isHuman, index) {
  return {
    name, isHuman, index,
    pos: 0,
    state: 'normal',       // normal | lake | forest | hospital
    forestFails: 0,
    inventory: {},         // key → count
    hasAntidote: false,
    inBoat: false,
    hasBicycle: false,
    // Stats
    rollCount: 0,
    snakesHit: 0,
    laddersClimbed: 0,
  };
}

function applyTerrain(player) {
  const p = player.pos;
  if (player.state === 'hospital') return; // stay until discharged
  if (lakeCells.has(p))    { player.state = 'lake';   return; }
  if (forestCells.has(p))  { player.state = 'forest'; return; }
  player.state = 'normal';
}

// Returns { moved:bool, log:[], special:string|null }
function resolveMove(player, roll) {
  const log = [];

  // ── Hospital ──
  if (player.state === 'hospital') {
    if (roll === 6) {
      player.state = 'normal';
      player.pos   = Math.min(player.pos + roll, TOTAL_CELLS);
      log.push({ text: `🏥 ${player.name} rolled 6 — DISCHARGED! Moves to ${player.pos}`, cls: 'log-hospital' });
      applyTerrain(player);
      return { moved: true, log, special: _checkLanding(player, log) };
    }
    log.push({ text: `🏥 ${player.name} rolled ${roll} — needs 6 to leave hospital. Turn passes.`, cls: 'log-hospital' });
    return { moved: false, log, special: null };
  }

  // ── Lake ──
  if (player.state === 'lake' && !player.inBoat) {
    if (roll % 2 === 1) {
      log.push({ text: `🌊 ${player.name} rolled ${roll} (odd) — treading water! Turn passes.`, cls: 'log-lake' });
      return { moved: false, log, special: null };
    }
    const steps = roll / 2;
    player.pos = Math.min(player.pos + steps, TOTAL_CELLS);
    log.push({ text: `🌊 ${player.name} swims ${steps} box(es) with roll ${roll} → ${player.pos}`, cls: 'log-lake' });
    player.inBoat = false; applyTerrain(player);
    return { moved: true, log, special: _checkLanding(player, log) };
  }

  // ── Lake with Boat ──
  if (player.state === 'lake' && player.inBoat) {
    player.pos = Math.min(player.pos + roll, TOTAL_CELLS);
    player.inBoat = false;
    log.push({ text: `🚤 ${player.name} rows the boat — full ${roll} steps → ${player.pos}`, cls: 'log-lake' });
    applyTerrain(player);
    return { moved: true, log, special: _checkLanding(player, log) };
  }

  // ── Forest ──
  if (player.state === 'forest') {
    if (roll % 2 === 0) {
      player.forestFails++;
      log.push({ text: `🌲 ${player.name} rolled ${roll} (even) — lost in forest! [${player.forestFails}/3] Turn passes.`, cls: 'log-forest' });
      if (player.forestFails >= 3) {
        player.forestFails = 0;
        player.state = 'hospital';
        player.pos   = HOSPITAL_BOX;
        log.push({ text: `🐻 BEAR ATTACK! ${player.name} is rushed to the hospital!`, cls: 'log-bear' });
        return { moved: true, log, special: 'bear' };
      }
      return { moved: false, log, special: null };
    }
    player.forestFails = 0;
    player.pos = Math.min(player.pos + roll, TOTAL_CELLS);
    log.push({ text: `🌲 ${player.name} found a forest path! Moves to ${player.pos}`, cls: 'log-forest' });
    applyTerrain(player);
    return { moved: true, log, special: _checkLanding(player, log) };
  }

  // ── Normal ──
  const newPos = player.pos + roll;
  if (newPos > TOTAL_CELLS) {
    log.push({ text: `${player.name} rolled ${roll} — needs exactly ${TOTAL_CELLS - player.pos} to finish! Turn passes.`, cls: '' });
    return { moved: false, log, special: null };
  }
  player.pos = newPos;

  // Bicycle bonus
  if (player.hasBicycle) {
    player.pos = Math.min(player.pos + 2, TOTAL_CELLS);
    player.hasBicycle = false;
    log.push({ text: `🚲 Bicycle bonus! +2 → ${player.pos}`, cls: 'log-gift' });
  }

  log.push({ text: `${player.name} rolled ${roll} → moves to ${player.pos}`, cls: '' });
  applyTerrain(player);
  return { moved: true, log, special: _checkLanding(player, log) };
}

function _checkLanding(player, log) {
  const pos = player.pos;
  if (pos >= TOTAL_CELLS) return 'win';
  if (giftCells[pos] !== undefined) {
    const key = giftCells[pos];
    _giveItem(player, key);
    log.push({ text: `🎁 ${player.name} found a ${ITEMS[key].emoji} ${ITEMS[key].name}!`, cls: 'log-gift' });
    delete giftCells[pos];
    return 'gift';
  }
  if (snakeMap[pos]) {
    if (player.hasAntidote) {
      player.hasAntidote = false; _removeItem(player, 'antidote');
      log.push({ text: `💉 Antidote activated! ${player.name} is immune to the snake!`, cls: 'log-gift' });
      return null;
    }
    return 'snake';
  }
  if (ladderMap[pos]) return 'ladder';
  return null;
}

function _giveItem(p, k)  { p.inventory[k] = (p.inventory[k] || 0) + 1; }
function _removeItem(p, k) { if ((p.inventory[k] || 0) > 0) { p.inventory[k]--; if (!p.inventory[k]) delete p.inventory[k]; } }

// ── Item usage ──
function useJetpack(p)  { _removeItem(p,'jetpack');  p.state='normal'; p.forestFails=0; p.inBoat=false; return `🚀 ${p.name} fires the Jetpack — escaped terrain!`; }
function useBoat(p)     { _removeItem(p,'boat');     p.inBoat=true;   return `🚤 ${p.name} launches the Boat — full steps in lake this turn!`; }
function useBicycle(p)  { _removeItem(p,'bicycle');  p.hasBicycle=true; return `🚲 ${p.name} hops on the Bicycle — +2 bonus next move!`; }
function useAntidote(p) { _removeItem(p,'antidote'); p.hasAntidote=true; return `💉 ${p.name} prepared the Antidote — immune to next snake!`; }

// Returns Set of item keys that are currently usable
function getUsableItems(p, pendingRoll) {
  const u = new Set();
  if ((p.state==='lake'||p.state==='forest') && (p.inventory.jetpack||0)>0) u.add('jetpack');
  if (p.state==='lake' && !p.inBoat && (p.inventory.boat||0)>0) u.add('boat');
  if (p.state==='normal' && (p.inventory.bicycle||0)>0 && !p.hasBicycle) u.add('bicycle');
  if (p.state==='normal' && (p.inventory.antidote||0)>0 && !p.hasAntidote) u.add('antidote');
  if (pendingRoll && (p.inventory.converter||0)>0) u.add('converter');
  return u;
}
