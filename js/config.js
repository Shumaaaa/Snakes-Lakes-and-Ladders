// ═══════════════════════════
//  config.js — Constants & item definitions
// ═══════════════════════════
const BOARD_SIZE  = 16;
const TOTAL_CELLS = 256;
const HOSPITAL_BOX = 14;

const P_AVATARS = ['🧑‍🚀','🧙','🧭','🧗'];
const P_COLORS  = ['#4ecca3','#e94560','#f5a623','#a855f7'];
const P_NAMES   = ['Astronaut','Knight','Explorer','Climber'];
const DICE_FACE = ['','⚀','⚁','⚂','⚃','⚄','⚅'];

const ITEMS = {
  jetpack:   { emoji:'🚀', name:'Jetpack',        desc:'Escape forest or lake instantly' },
  boat:      { emoji:'🚤', name:'Boat',            desc:'Move full dice steps in lake (1 turn)' },
  antidote:  { emoji:'💉', name:'Snake Antidote',  desc:'Block next snake bite automatically' },
  bicycle:   { emoji:'🚲', name:'Bicycle',         desc:'+2 bonus squares on next move' },
  converter: { emoji:'🎲', name:'Dice Converter',  desc:'Replace current roll with any number 1–6' }
};
