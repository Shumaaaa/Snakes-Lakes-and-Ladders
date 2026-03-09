# 🐍 Adventure Snakes & Ladders

> An epic browser game — no install needed. Just open `index.html`!

## 🎮 Features
- **256-box board** (16×16) with random layout every game
- **1–4 human players** + CPU Buddy fills empty slots
- **Custom player names** per session
- 🌊 **Lakes** — even rolls move you at half steps; odd = skip turn
- 🌲 **Forests** — odd rolls only; even = skip; 3 fails = 🐻 bear attack!
- 🏥 **Hospital** at box 20 — roll 6 to be discharged
- 🐍 **16 Snakes** + 🪜 **14 Ladders** — randomly placed every game
- 🎁 **20 Gift Boxes** — one-time claim; items: Jetpack 🚀, Boat 🚤, Antidote 💉, Bicycle 🚲, Dice Converter 🎲
- 🎬 **Dramatic animations** — glide, snake tension, poof, bear charge, ambulance, ladder climb, confetti
- 🔊 **Sound effects** via Web Audio API (no files needed)
- 🌙 **Dark / Light theme** toggle (works everywhere)
- 🏆 **Hall of Fame** — wins saved in localStorage across sessions
- 📊 **Game stats** on win screen: rolls, time, snakes hit, ladders climbed
- ⏱️ **Live timer** in top bar
- 📱 **Mobile friendly**

## 📁 File Structure
```
adventure-snakes/
├── index.html
├── css/
│   ├── themes.css      ← CSS variables for dark/light
│   ├── animations.css  ← All @keyframes
│   ├── board.css       ← Canvas wrapper styles
│   └── main.css        ← All UI components
└── js/
    ├── config.js       ← Constants & item definitions
    ├── terrain.js      ← Board generation (lakes, forests, snakes, ladders, gifts)
    ├── players.js      ← Player state, movement rules, item effects
    ├── board.js        ← Canvas drawing
    ├── animations.js   ← All dramatic animations
    ├── sound.js        ← Web Audio sound effects
    ├── inventory.js    ← Inventory UI (per-player, lights up on turn)
    ├── ui.js           ← Panels, log, timer, HOF, theme, confetti
    └── game.js         ← Main controller & turn flow
```

## ▶️ How to Play
1. Put all files in the same folder keeping the `css/` and `js/` subfolders
2. Open `index.html` in any browser
3. No internet required!

## 🌍 Deploy to GitHub Pages
Push to GitHub → Settings → Pages → Source: main branch → Save  
Your game goes live at: `https://yourusername.github.io/adventure-snakes`

---
Made with ❤️ by Fadhil & Perplexity AI — Dar es Salaam 🇹🇿
