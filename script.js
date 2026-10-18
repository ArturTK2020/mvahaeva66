"use strict";

// ===================== ОПРЕДЕЛЕНИЕ МОБИЛЬНОГО =====================
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                 || (navigator.maxTouchPoints > 1 && /Mobi|Tablet/i.test(navigator.userAgent));

// ===================== КОНСТАНТЫ =====================
const TILE_SIZE = 32;
const MAP_WIDTH = 30, MAP_HEIGHT = 20;
const CANVAS_WIDTH = MAP_WIDTH * TILE_SIZE;
const CANVAS_HEIGHT = MAP_HEIGHT * TILE_SIZE;
const PLAYER_RADIUS = 12;
const BASE_SPEED = 150;
const MAX_PARTICLES = 150;

const TILE_GRASS = 0, TILE_STONE = 1, TILE_TREE = 2, TILE_WATER = 3, TILE_SNOW = 4, TILE_SAND = 5;

const BIOMES = {
  forest:  { id:'forest',  name:'🌲 Лес',      grass:'#7ec850', grassDetail:'#6ab040', ice:false },
  desert:  { id:'desert',  name:'🏜️ Пустыня',  grass:'#e8d28a', grassDetail:'#c9b06e', ice:false },
  snow:    { id:'snow',    name:'❄️ Снега',    grass:'#e8f0f5', grassDetail:'#c0d4e0', ice:true }
};

const RESOURCE_TYPES = {
  stone:   { name:'Камень',  color:'#9e9e9e', money:10,  time:2.0 },
  wood:    { name:'Дерево',  color:'#6b8e23', money:15,  time:2.0 },
  gold:    { name:'Золото',  color:'#ffd700', money:30,  time:3.0 },
  diamond: { name:'Алмаз',   color:'#b9f2ff', money:60,  time:4.0 }
};

const ANIMAL_TYPES = {
  chicken: { name:'Курица', drop:'meat', dropAmount:1, time:1.5 }
};

const SKINS = [
  { id:'default', name:'Стандарт', cost:0,   level:1, colorBody:'#ff9800', colorHead:'#ff9800' },
  { id:'blue',    name:'Синий',    cost:100, level:1, colorBody:'#2196f3', colorHead:'#2196f3' },
  { id:'red',     name:'Красный',  cost:150, level:2, colorBody:'#f44336', colorHead:'#f44336' },
  { id:'green',   name:'Зелёный',  cost:200, level:3, colorBody:'#4caf50', colorHead:'#4caf50' },
  { id:'purple',  name:'Фиолет',   cost:300, level:4, colorBody:'#9c27b0', colorHead:'#9c27b0' }
];

const ACCESSORIES = [
  { id:'hat',    name:'🎩 Шляпа',    cost:150, level:2 },
  { id:'crown',  name:'👑 Корона',   cost:400, level:5 },
  { id:'glasses',name:'🕶️ Очки',     cost:200, level:3 }
];

const WEAPONS = [
  { id:'fists',  name:'Кулаки',  cost:0,    level:1, damage:8,  range:35,  cooldown:0.45, icon:'✊', color:'#ff9800' },
  { id:'club',   name:'Дубина',  cost:50,   level:1, damage:15, range:40,  cooldown:0.55, icon:'🏏', color:'#8d6e63' },
  { id:'sword',  name:'Меч',     cost:200,  level:2, damage:25, range:50,  cooldown:0.40, icon:'⚔️', color:'#cfd8dc' },
  { id:'spear',  name:'Копьё',   cost:400,  level:4, damage:35, range:70,  cooldown:0.50, icon:'🔱', color:'#a1887f' },
  { id:'axe',    name:'Топор',   cost:700,  level:6, damage:50, range:50,  cooldown:0.70, icon:'🪓', color:'#795548' },
  { id:'bow',    name:'Лук',     cost:1200, level:8, damage:65, range:220, cooldown:0.85, icon:'🏹', color:'#5d4037', ranged:true }
];

const CRAFT_RECIPES = [
  { name:'Зелье скорости', desc:'+50% скорости на 30 сек', cost:{stone:10,wood:5},   effect:'speed_boost' },
  { name:'Каменная броня', desc:'-20% времени добычи',      cost:{stone:20,wood:10},  effect:'mining_boost' },
  { name:'Золотая кирка',  desc:'x2 золота',                cost:{gold:5,diamond:2},  effect:'gold_pickaxe' }
];

const PETS = [
  { id:'dog',    name:'🐕 Собака',  cost:300,  level:2, desc:'Собирает ресурсы рядом' },
  { id:'parrot', name:'🦜 Попугай', cost:500,  level:4, desc:'Приносит +5 монет раз в 30с' }
];

const ACHIEVEMENTS = [
  { id:'first_mine',  name:'Первый камень',       desc:'Добудь 1 ресурс',      reward:20,  check: () => stats.mined >= 1 },
  { id:'miner_10',    name:'Начинающий шахтёр',   desc:'Добудь 10 ресурсов',   reward:50,  check: () => stats.mined >= 10 },
  { id:'miner_100',   name:'Опытный шахтёр',      desc:'Добудь 100 ресурсов',  reward:300, check: () => stats.mined >= 100 },
  { id:'hunter_5',    name:'Охотник',             desc:'Поймай 5 куриц',       reward:50,  check: () => stats.chickens >= 5 },
  { id:'wolf_5',      name:'Гроза волков',        desc:'Убей 5 волков',        reward:100, check: () => stats.wolves >= 5 },
  { id:'wolf_20',     name:'Волчий кошмар',       desc:'Убей 20 волков',       reward:400, check: () => stats.wolves >= 20 },
  { id:'boss_1',      name:'Первый босс',         desc:'Убей первого босса',   reward:500, check: () => stats.bosses >= 1 },
  { id:'level_5',     name:'Опытный',             desc:'Дойди до 5 уровня',    reward:200, check: () => currentLevel >= 5 },
  { id:'level_10',    name:'Мастер',              desc:'Дойди до 10 уровня',   reward:800, check: () => currentLevel >= 10 },
  { id:'rich_1000',   name:'Богач',               desc:'Накопи 1000 монет',    reward:100, check: () => balance >= 1000 },
  { id:'deaths_3',    name:'Не сдаётся',          desc:'Умри 3 раза',          reward:50,  check: () => stats.deaths >= 3 },
  { id:'chef',        name:'Шеф-повар',           desc:'Съешь 10 мяса',        reward:100, check: () => stats.meatEaten >= 10 },
  { id:'pvp_1',       name:'Дуэлянт',             desc:'Выиграй первый PvP',   reward:100, check: () => pvp.wins >= 1 },
  { id:'pvp_5',       name:'Гладиатор',           desc:'Выиграй 5 PvP',        reward:300, check: () => pvp.wins >= 5 },
  { id:'pvp_10',      name:'Чемпион',             desc:'Выиграй 10 PvP',       reward:700, check: () => pvp.wins >= 10 },
  { id:'rank_gold',   name:'Золото',              desc:'Достигни ранга Золото', reward:500, check: () => pvp.rating >= 1500 },
  { id:'rank_legend', name:'Легенда',             desc:'Достигни ранга Легенда', reward:2000, check: () => pvp.rating >= 2500 }
];

const PRICE_SPEED = 50, PRICE_MINING = 80, PRICE_BONUS = 100;
const PRICE_TOOL_STONE = 80, PRICE_TOOL_GOLD = 150, PRICE_TOOL_DIAMOND = 250;
const MAX_MINING = 3;

const LEVEL_TARGETS = [200, 1000, 2000, 3500, 5500, 8000, 11000, 15000, 20000, 27000];
function getTargetForLevel(level){
  if(level <= LEVEL_TARGETS.length) return LEVEL_TARGETS[level - 1];
  return LEVEL_TARGETS[LEVEL_TARGETS.length-1] + (level - LEVEL_TARGETS.length) * 10000;
}

const MAX_HEALTH = 100;
const WOLF_DAMAGE = 10;
const WOLF_ATTACK_COOLDOWN = 1.5;
const WOLF_SPEED = 80;
const WOLF_DETECTION = 150;
const WOLF_CHASE_RANGE = 280;
const MEAT_HEAL = 20;
const DEATH_RESOURCE_LOSS = 0.5;
const DEATH_MONEY_LOSS = 0.25;

const MAX_HUNGER = 100;
const HUNGER_DRAIN = 0.5;

const COMBO_MAX = 5;
const COMBO_TIMEOUT = 6.0;
const FAIR_DURATION = 60;
const FAIR_COOLDOWN = 300;

// ===================== PVP КОНСТАНТЫ =====================
const PVP_OPPONENTS = [
  { id:'novice',  name:'🟢 Новичок',   level:1, hp:60,  damage:8,  speed:80,  icon:'👤', reward:50,  ratingWin:15, ratingLoss:5,  difficulty:'Лёгкий' },
  { id:'warrior', name:'🟡 Воин',      level:2, hp:100, damage:15, speed:100, icon:'⚔️', reward:120, ratingWin:25, ratingLoss:10, difficulty:'Средний' },
  { id:'knight',  name:'🟠 Рыцарь',    level:4, hp:150, damage:25, speed:120, icon:'🛡️', reward:250, ratingWin:40, ratingLoss:15, difficulty:'Сложный' },
  { id:'master',  name:'🔴 Мастер',    level:6, hp:200, damage:35, speed:140, icon:'💀', reward:500, ratingWin:60, ratingLoss:20, difficulty:'Очень сложный' },
  { id:'legend',  name:'💀 Легенда',   level:8, hp:300, damage:50, speed:160, icon:'👹', reward:1000,ratingWin:100,ratingLoss:30, difficulty:'Смертельный' }
];

const RANKS = [
  { min:0,    name:'🥉 Новичок',     color:'#cd7f32' },
  { min:500,  name:'🥈 Бронза',      color:'#a9a9a9' },
  { min:1000, name:'🥇 Серебро',     color:'#e0e0e0' },
  { min:1500, name:'👑 Золото',      color:'#ffd700' },
  { min:2000, name:'💎 Платина',     color:'#b9f2ff' },
  { min:2500, name:'🌟 Легенда',     color:'#e040fb' }
];

// ===================== СОСТОЯНИЕ =====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const STATE_MENU='menu', STATE_PLAYING='playing', STATE_PAUSED='paused', STATE_SHOP='shop', STATE_HOWTO='howto', STATE_INVENTORY='inventory', STATE_ACHIEVEMENTS='achievements', STATE_PVP_MENU='pvp_menu', STATE_PVP_ARENA='pvp_arena', STATE_PVP_RESULT='pvp_result';
let gameState = STATE_MENU;

const keys = {};

let player = { x:CANVAS_WIDTH/2, y:CANVAS_HEIGHT/2, radius:PLAYER_RADIUS, walkCycle:0, facing:1, facingDir:{x:0,y:1}, slideVX:0, slideVY:0 };

let playerHealth = MAX_HEALTH;
let playerMaxHealth = MAX_HEALTH;
let playerHunger = MAX_HUNGER;
let playerHurtTimer = 0, playerInvulnTimer = 0, deathBanner = 0;

let inventory = { stone:0, wood:0, gold:0, diamond:0, meat:0 };
let map = [], resources = [], animals = [], wolves = [];
let activeMining = null, flyingTexts = [], particles = [], projectiles = [], slashEffects = [];
let balance = 0, wolfSpawnTimer = 0;

let upgrades = {
  speed:0, mining:0, bonus:false,
  tools:{ stone:false, gold:false, diamond:false }
};

let equippedSkin = 'default', ownedSkins = ['default'];
let equippedAccessory = null, ownedAccessories = [];
let equippedWeapon = 'fists', ownedWeapons = ['fists'];

let ownedPets = [], activePet = null;
let petTimer = 0;

let stats = { mined: 0, chickens: 0, wolves: 0, bosses: 0, deaths: 0, meatEaten: 0 };
let unlockedAchievements = [];

let dailyQuest = null;

let pvp = { wins: 0, losses: 0, rating: 0, winStreak: 0, bestStreak: 0, lastOpponent: null, battles: [] };
let pvpPlayer = null, pvpOpponent = null, pvpResult = null;

let gameWasStarted = false, currentLevel = 1, targetMoney = getTargetForLevel(1);
let speedBoostTimer = 0, miningBoostActive = false, goldPickaxeActive = false;

let levelTransition = 0, levelTransitionPhase = 'none';
let comboCount = 0, comboTimer = 0;
let fairActive = false, fairTimer = 0, fairCooldown = 0;
let treasure = null, treasureParticles = 0;

let currentBiome = BIOMES.forest;
let bosses = [];
let bossActive = false;

let lastAttackTime = 0;
let audioCtx = null, soundEnabled = true, musicEnabled = true;
let musicInterval = null;
let animTime = 0;

// ===================== МОБИЛЬНОЕ УПРАВЛЕНИЕ =====================
let joystickActive = false, joystickDX = 0, joystickDY = 0;
let joystickStartX = 0, joystickStartY = 0;
const JOYSTICK_KNOB_MAX = 40;
const joystickEl = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystickKnob');
const btnAction = document.getElementById('btnAction');
const btnAttack = document.getElementById('btnAttack');
const btnEat = document.getElementById('btnEat');
const btnShop = document.getElementById('btnShop');
const btnInv = document.getElementById('btnInv');
const btnMenu = document.getElementById('btnMenu');

function showMobileControls(show){
  if(!isMobile){
    joystickEl.style.display = 'none';
    joystickEl.style.visibility = 'hidden';
    [btnAction, btnAttack, btnEat, btnShop, btnInv, btnMenu].forEach(b => {
      b.style.display = 'none'; b.style.visibility = 'hidden'; b.style.pointerEvents = 'none';
    });
    return;
  }
  if(show){
    joystickEl.style.display = 'block'; joystickEl.style.visibility = 'visible'; joystickEl.style.pointerEvents = 'auto';
    [btnAction, btnAttack, btnEat, btnShop, btnInv, btnMenu].forEach(b => {
      b.style.display = 'flex'; b.style.visibility = 'visible'; b.style.pointerEvents = 'auto';
    });
  } else {
    joystickEl.style.display = 'none'; joystickEl.style.visibility = 'hidden'; joystickEl.style.pointerEvents = 'none';
    [btnAction, btnAttack, btnEat, btnShop, btnInv, btnMenu].forEach(b => {
      b.style.display = 'none'; b.style.visibility = 'hidden'; b.style.pointerEvents = 'none';
    });
  }
}
function positionMobileControls(){
  if(!isMobile) return;
  const s = 60, rp = 12, bp = 15;
  joystickEl.style.left = '18px'; joystickEl.style.bottom = '18px';
  joystickEl.style.top = 'auto'; joystickEl.style.right = 'auto';
  btnMenu.style.right = rp + 'px';             btnMenu.style.bottom = bp + 'px';
  btnShop.style.right = rp + 'px';             btnShop.style.bottom = (bp + s + 8) + 'px';
  btnInv.style.right  = rp + 'px';             btnInv.style.bottom  = (bp + s*2 + 16) + 'px';
  btnAttack.style.right = (rp + s + 8) + 'px'; btnAttack.style.bottom = bp + 'px';
  btnAction.style.right = (rp + s + 8) + 'px'; btnAction.style.bottom = (bp + s + 8) + 'px';
  btnEat.style.right    = (rp + s + 8) + 'px'; btnEat.style.bottom    = (bp + s*2 + 16) + 'px';
  [btnAction, btnAttack, btnEat, btnShop, btnInv, btnMenu].forEach(b => { b.style.left='auto'; b.style.top='auto'; });
}
function onJoystickStart(e){
  e.preventDefault();
  const t = e.touches ? e.touches[0] : e;
  const r = joystickEl.getBoundingClientRect();
  joystickActive = true;
  joystickStartX = r.left + r.width/2;
  joystickStartY = r.top + r.height/2;
  updateJoystick(t.clientX, t.clientY);
}
function onJoystickMove(e){
  if(!joystickActive) return;
  e.preventDefault();
  const t = e.touches ? e.touches[0] : e;
  updateJoystick(t.clientX, t.clientY);
}
function onJoystickEnd(e){
  if(!joystickActive) return;
  e.preventDefault();
  joystickActive = false;
  joystickDX = 0; joystickDY = 0;
  joystickKnob.style.left = '50%'; joystickKnob.style.top = '50%';
}
function updateJoystick(cx, cy){
  let dx = cx - joystickStartX, dy = cy - joystickStartY;
  const d = Math.sqrt(dx*dx+dy*dy);
  if(d > JOYSTICK_KNOB_MAX){ dx = dx/d*JOYSTICK_KNOB_MAX; dy = dy/d*JOYSTICK_KNOB_MAX; }
  joystickKnob.style.left = `calc(50% + ${dx}px)`;
  joystickKnob.style.top = `calc(50% + ${dy}px)`;
  joystickDX = dx / JOYSTICK_KNOB_MAX;
  joystickDY = dy / JOYSTICK_KNOB_MAX;
}

if(isMobile){
  joystickEl.addEventListener('touchstart', onJoystickStart, {passive:false});
  joystickEl.addEventListener('touchmove', onJoystickMove, {passive:false});
  joystickEl.addEventListener('touchend', onJoystickEnd, {passive:false});
  joystickEl.addEventListener('touchcancel', onJoystickEnd, {passive:false});
  btnAction.addEventListener('touchstart', e => { e.preventDefault(); if(gameState===STATE_PLAYING) triggerAction(); }, {passive:false});
  btnAttack.addEventListener('touchstart', e => { e.preventDefault(); if(gameState===STATE_PLAYING) playerAttack(); else if(gameState===STATE_PVP_ARENA) pvpPlayerAttack(); }, {passive:false});
  btnEat.addEventListener('touchstart', e => { e.preventDefault(); if(gameState===STATE_PLAYING) eatMeat(); }, {passive:false});
  btnShop.addEventListener('touchstart', e => { e.preventDefault(); if(gameState===STATE_PLAYING||gameState===STATE_PAUSED) openShop(); }, {passive:false});
  btnInv.addEventListener('touchstart', e => { e.preventDefault(); if(gameState===STATE_PLAYING) openInventory(); }, {passive:false});
  btnMenu.addEventListener('touchstart', e => { e.preventDefault(); if(gameState===STATE_PLAYING) pauseGame(); else if(gameState===STATE_PAUSED) goToMainMenu(); else if(gameState===STATE_PVP_ARENA) exitPvpArena(); }, {passive:false});
}

// ===================== УТИЛИТЫ =====================
function getCanvasCoords(e){
  const r = canvas.getBoundingClientRect();
  const cx = e.touches?e.touches[0].clientX:(e.changedTouches?e.changedTouches[0].clientX:e.clientX);
  const cy = e.touches?e.touches[0].clientY:(e.changedTouches?e.changedTouches[0].clientY:e.clientY);
  return { x:(cx-r.left)*(canvas.width/r.width), y:(cy-r.top)*(canvas.height/r.height) };
}
function isTileWalkable(tx,ty){
  if(tx<0||tx>=MAP_WIDTH||ty<0||ty>=MAP_HEIGHT) return false;
  const t = map[ty][tx];
  if(t === TILE_GRASS || t === TILE_SNOW || t === TILE_SAND) return true;
  return false;
}
function collidesWithWorld(x,y,r){
  const sTX=Math.floor((x-r)/TILE_SIZE),eTX=Math.floor((x+r)/TILE_SIZE);
  const sTY=Math.floor((y-r)/TILE_SIZE),eTY=Math.floor((y+r)/TILE_SIZE);
  for(let ty=sTY;ty<=eTY;ty++)for(let tx=sTX;tx<=eTX;tx++)if(!isTileWalkable(tx,ty))return true;
  return false;
}
function tryMove(dx,dy){
  const nx=player.x+dx, ny=player.y+dy;
  if(!collidesWithWorld(nx,player.y,player.radius)) player.x=nx;
  if(!collidesWithWorld(player.x,ny,player.radius)) player.y=ny;
}
function addResource(t,a=1){ if(inventory.hasOwnProperty(t)) inventory[t]+=a; }
function canCraft(r){ for(let [k,v] of Object.entries(r.cost)) if((inventory[k]||0)<v) return false; return true; }
function craft(r){
  for(let [k,v] of Object.entries(r.cost)) inventory[k]-=v;
  if(r.effect==='speed_boost') speedBoostTimer=30;
  else if(r.effect==='mining_boost') miningBoostActive=true;
  else if(r.effect==='gold_pickaxe') goldPickaxeActive=true;
  saveGame();
}
function getCurrentWeapon(){ return WEAPONS.find(w=>w.id===equippedWeapon) || WEAPONS[0]; }
function getSellPrice(key){
  const base = { stone:10, wood:15, gold:30, diamond:60, meat:5 }[key] || 0;
  let price = base;
  if(upgrades.bonus) price *= 1.5;
  if(fairActive) price *= 2;
  return Math.floor(price);
}
function isBossLevel(level){ return level % 5 === 0; }
function getBiomeForLevel(level){
  const idx = Math.floor((level-1) / 4) % 3;
  if(idx === 0) return BIOMES.forest;
  if(idx === 1) return BIOMES.desert;
  return BIOMES.snow;
}

// ===================== ДОСТИЖЕНИЯ =====================
function checkAchievements(){
  for(let a of ACHIEVEMENTS){
    if(unlockedAchievements.includes(a.id)) continue;
    if(a.check()){
      unlockedAchievements.push(a.id);
      balance += a.reward;
      flyingTexts.push({text:`🏆 ${a.name}! +${a.reward}💰`,x:player.x,y:player.y-60,life:3.0,color:'#ffd700'});
      playLevelUpSound();
      saveGame();
    }
  }
}

// ===================== ЕЖЕДНЕВНОЕ ЗАДАНИЕ =====================
function generateDailyQuest(){
  const today = new Date().toDateString();
  const saved = localStorage.getItem('minersQuest_daily');
  if(saved){
    try { const d = JSON.parse(saved); if(d.date === today){ dailyQuest = d; return; } } catch(e){}
  }
  const types = [
    { type:'mine', name:'Добудь 15 ресурсов', target:15, reward:100 },
    { type:'hunt', name:'Поймай 5 куриц', target:5, reward:80 },
    { type:'wolf', name:'Убей 3 волков', target:3, reward:150 },
    { type:'sell', name:'Продай на 200 монет', target:200, reward:120 }
  ];
  const chosen = types[Math.floor(Math.random()*types.length)];
  dailyQuest = { date: today, type: chosen.type, name: chosen.name, target: chosen.target, progress: 0, reward: chosen.reward, done: false };
  localStorage.setItem('minersQuest_daily', JSON.stringify(dailyQuest));
}
function updateDailyQuest(type, amount){
  if(!dailyQuest || dailyQuest.done) return;
  if(dailyQuest.type !== type) return;
  dailyQuest.progress = Math.min(dailyQuest.target, dailyQuest.progress + amount);
  if(dailyQuest.progress >= dailyQuest.target && !dailyQuest.done){
    dailyQuest.done = true;
    balance += dailyQuest.reward;
    flyingTexts.push({text:`📅 Задание! +${dailyQuest.reward}💰`,x:player.x,y:player.y-80,life:3.0,color:'#4caf50'});
    playLevelUpSound();
  }
  localStorage.setItem('minersQuest_daily', JSON.stringify(dailyQuest));
}

// ===================== ГЕНЕРАЦИЯ =====================
function generateMap(level){
  currentBiome = getBiomeForLevel(level);
  const groundTile = currentBiome.ice ? TILE_SNOW : (currentBiome.id === 'desert' ? TILE_SAND : TILE_GRASS);
  map = Array.from({length:MAP_HEIGHT},()=>Array(MAP_WIDTH).fill(groundTile));
  const cTX=Math.floor(MAP_WIDTH/2),cTY=Math.floor(MAP_HEIGHT/2);
  const pct=Math.min(0.30,0.10+level*0.02);
  const max=Math.floor(MAP_WIDTH*MAP_HEIGHT*pct);
  let p=0;
  while(p<max){
    const tx=Math.floor(Math.random()*MAP_WIDTH),ty=Math.floor(Math.random()*MAP_HEIGHT);
    if(Math.abs(tx-cTX)<=1&&Math.abs(ty-cTY)<=1) continue;
    if(map[ty][tx]!==groundTile) continue;
    map[ty][tx] = [TILE_STONE,TILE_TREE,TILE_WATER][Math.floor(Math.random()*3)];
    p++;
  }
}
function placeResourcesOfType(type,count,cTX,cTY){
  let a=0,pl=0;
  while(pl<count && a<400){
    const tx=Math.floor(Math.random()*MAP_WIDTH),ty=Math.floor(Math.random()*MAP_HEIGHT);
    if(Math.abs(tx-cTX)<=1&&Math.abs(ty-cTY)<=1){a++;continue;}
    const t = map[ty][tx];
    if(t !== TILE_GRASS && t !== TILE_SNOW && t !== TILE_SAND){a++;continue;}
    if(resources.some(r=>r.tx===tx&&r.ty===ty)){a++;continue;}
    resources.push({ type,tx,ty,state:'idle',respawnTimer:0,particleTimer:0 });
    pl++;a++;
  }
}
function generateResources(level){
  resources=[];
  const cTX=Math.floor(MAP_WIDTH/2),cTY=Math.floor(MAP_HEIGHT/2);
  for(let key of ['stone','wood']){
    let base=8+level, cnt=base+Math.floor(Math.random()*3);
    placeResourcesOfType(key,cnt,cTX,cTY);
  }
  if(Math.random()<0.60){
    let cnt=2+Math.floor(Math.random()*4)+Math.floor(level/2);
    cnt=Math.min(cnt,8);
    placeResourcesOfType('gold',cnt,cTX,cTY);
  }
  if(level>=3 && Math.random()<0.35){
    let cnt=1+Math.floor(Math.random()*2);
    if(level>=5) cnt++;
    cnt=Math.min(cnt,4);
    placeResourcesOfType('diamond',cnt,cTX,cTY);
  }
}
function generateAnimals(level){
  animals=[];
  const cnt=3+level;
  const cTX=Math.floor(MAP_WIDTH/2),cTY=Math.floor(MAP_HEIGHT/2);
  for(let i=0;i<cnt;i++){
    let tx,ty,a=0;
    do{ tx=Math.floor(Math.random()*MAP_WIDTH); ty=Math.floor(Math.random()*MAP_HEIGHT); a++; }
    while((Math.abs(tx-cTX)<=2&&Math.abs(ty-cTY)<=2)||!isTileWalkable(tx,ty)||animals.some(x=>x.tx===tx&&x.ty===ty));
    if(a<100) animals.push({type:'chicken',tx,ty,moveTimer:Math.random()*2,dirX:1,dirY:1,state:'idle'});
  }
}
function generateWolves(level){
  wolves=[];
  if(level<2) return;
  const cnt=Math.max(1,Math.floor(level/2));
  const cTX=Math.floor(MAP_WIDTH/2),cTY=Math.floor(MAP_HEIGHT/2);
  for(let i=0;i<cnt;i++){
    let tx,ty,a=0;
    do{ tx=Math.floor(Math.random()*MAP_WIDTH); ty=Math.floor(Math.random()*MAP_HEIGHT); a++; }
    while((Math.abs(tx-cTX)<=5&&Math.abs(ty-cTY)<=5)||!isTileWalkable(tx,ty)||wolves.some(w=>w.tx===tx&&w.ty===ty));
    if(a<100){
      const hp=30+level*5;
      wolves.push({ type:'wolf',tx,ty,x:tx*TILE_SIZE+TILE_SIZE/2,y:ty*TILE_SIZE+TILE_SIZE/2,health:hp,maxHealth:hp,state:'idle',attackCooldown:0,walkCycle:0 });
    }
  }
  wolfSpawnTimer=30;
}
function generateBoss(level){
  bosses = [];
  bossActive = false;
  if(!isBossLevel(level)) return;
  const cTX=Math.floor(MAP_WIDTH/2),cTY=Math.floor(MAP_HEIGHT/2);
  for(let a=0;a<50;a++){
    const tx=Math.floor(Math.random()*MAP_WIDTH),ty=Math.floor(Math.random()*MAP_HEIGHT);
    if(!isTileWalkable(tx,ty)) continue;
    const cx=tx*TILE_SIZE+TILE_SIZE/2, cy=ty*TILE_SIZE+TILE_SIZE/2;
    if(Math.hypot(player.x-cx, player.y-cy) < TILE_SIZE*6) continue;
    const hp = 200 + level * 50;
    bosses.push({ type:'boss', x: cx, y: cy, tx, ty, health: hp, maxHealth: hp, state:'idle', attackCooldown: 0, walkCycle: 0, phase: 1 });
    bossActive = true;
    break;
  }
}
function generateTreasure(level){
  treasure = null;
  if(level % 3 !== 0) return;
  for(let a=0;a<100;a++){
    const tx = Math.floor(Math.random()*MAP_WIDTH);
    const ty = Math.floor(Math.random()*MAP_HEIGHT);
    if(!isTileWalkable(tx,ty)) continue;
    if(resources.some(r=>r.tx===tx&&r.ty===ty)) continue;
    const cx = tx*TILE_SIZE+TILE_SIZE/2, cy = ty*TILE_SIZE+TILE_SIZE/2;
    if(Math.hypot(player.x-cx, player.y-cy) < TILE_SIZE*5) continue;
    const reward = 100 + currentLevel * 50;
    treasure = { tx, ty, x:cx, y:cy, reward };
    break;
  }
}

// ===================== РЕСУРСЫ =====================
function getResourceAt(tx,ty){ return resources.find(r=>r.tx===tx&&r.ty===ty&&r.state!=='respawning'); }
function getAnimalAt(tx,ty){ return animals.find(a=>a.tx===tx&&a.ty===ty); }
function findNearbyResource(){
  const ptx=Math.floor(player.x/TILE_SIZE),pty=Math.floor(player.y/TILE_SIZE);
  let best=null,md=Infinity;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const r=getResourceAt(ptx+dx,pty+dy);
    if(r&&r.state==='idle'){
      const cx=r.tx*TILE_SIZE+TILE_SIZE/2,cy=r.ty*TILE_SIZE+TILE_SIZE/2;
      const ddx=player.x-cx, ddy=player.y-cy;
      const d=ddx*ddx+ddy*ddy;
      if(d<md){md=d;best=r;}
    }
  }
  return best && md <= TILE_SIZE*TILE_SIZE*2.25 ? best : null;
}
function findNearbyAnimal(){
  const ptx=Math.floor(player.x/TILE_SIZE),pty=Math.floor(player.y/TILE_SIZE);
  let best=null,md=Infinity;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const a=getAnimalAt(ptx+dx,pty+dy);
    if(a){
      const cx=a.tx*TILE_SIZE+TILE_SIZE/2,cy=a.ty*TILE_SIZE+TILE_SIZE/2;
      const ddx=player.x-cx, ddy=player.y-cy;
      const d=ddx*ddx+ddy*ddy;
      if(d<md){md=d;best=a;}
    }
  }
  return best && md <= TILE_SIZE*TILE_SIZE*2.25 ? best : null;
}
function findNearbyTreasure(){
  if(!treasure) return false;
  const dx = player.x - treasure.x, dy = player.y - treasure.y;
  return (dx*dx + dy*dy) < TILE_SIZE*TILE_SIZE*2.25;
}
function startMining(res){
  const cfg=RESOURCE_TYPES[res.type];
  let needTool=false, toolName='';
  if(res.type==='stone' && !upgrades.tools.stone){needTool=true;toolName='Кирка';}
  else if(res.type==='gold' && !upgrades.tools.gold){needTool=true;toolName='Золотая кирка';}
  else if(res.type==='diamond' && !upgrades.tools.diamond){needTool=true;toolName='Алмазный бур';}
  if(needTool){
    flyingTexts.push({text:`🔒 Нужна: ${toolName}!`,x:player.x,y:player.y-40,life:2.0,color:'#ff5252'});
    return;
  }
  let dur = cfg.time;
  if(miningBoostActive) dur *= 0.8;
  dur = Math.max(0.5, dur - upgrades.mining*0.5);
  res.state='mining';
  activeMining = { resource:res, startTime:performance.now()/1000, duration:dur };
}
function startHunting(animal){
  animal.state='hunting';
  activeMining = { animal, startTime:performance.now()/1000, duration:ANIMAL_TYPES[animal.type].time };
}
function finishMining(){
  if(activeMining.resource){
    const res=activeMining.resource, cfg=RESOURCE_TYPES[res.type];
    let amount=1;
    if(upgrades.tools.stone && res.type==='stone') amount*=2;
    if(upgrades.tools.gold && res.type==='gold') amount*=2;
    if(goldPickaxeActive && res.type==='gold') amount*=2;
    comboCount++;
    comboTimer = COMBO_TIMEOUT;
    if(comboCount >= COMBO_MAX){
      amount *= 2;
      comboCount = 0;
      flyingTexts.push({text:`🔥 КОМБО x2!`,x:player.x,y:player.y-60,life:2.0,color:'#ff5722'});
      playLevelUpSound();
    }
    addResource(res.type, amount);
    stats.mined += amount;
    updateDailyQuest('mine', amount);
    flyingTexts.push({text:`+${amount} ${cfg.name}`,x:res.tx*TILE_SIZE+TILE_SIZE/2,y:res.ty*TILE_SIZE+TILE_SIZE/2,life:1.0,color:cfg.color});
    spawnParticles(res.tx*TILE_SIZE+TILE_SIZE/2, res.ty*TILE_SIZE+TILE_SIZE/2, cfg.color, 5);
    res.state='respawning';
    res.respawnTimer=15+currentLevel*2;
    playCollectSound(res.type);
    checkAchievements();
  } else if(activeMining.animal){
    const a=activeMining.animal, cfg=ANIMAL_TYPES[a.type];
    addResource(cfg.drop, cfg.dropAmount);
    stats.chickens++;
    updateDailyQuest('hunt', 1);
    flyingTexts.push({text:`+${cfg.dropAmount} 🍗`,x:a.tx*TILE_SIZE+TILE_SIZE/2,y:a.ty*TILE_SIZE+TILE_SIZE/2,life:1.0,color:'#f9a825'});
    spawnParticles(a.tx*TILE_SIZE+TILE_SIZE/2, a.ty*TILE_SIZE+TILE_SIZE/2, '#f9a825', 5);
    animals = animals.filter(x=>x!==a);
    playCollectSound('meat');
    checkAchievements();
  }
  activeMining = null;
  saveGame();
  checkLevelUp();
}
function checkLevelUp(){
  if(balance >= targetMoney && levelTransitionPhase === 'none'){
    levelTransitionPhase = 'darken';
    levelTransition = 0;
  }
}
function doActualLevelUp(){
  currentLevel++;
  balance = 0;
  targetMoney = getTargetForLevel(currentLevel);
  generateMap(currentLevel);
  generateResources(currentLevel);
  generateAnimals(currentLevel);
  generateWolves(currentLevel);
  generateBoss(currentLevel);
  generateTreasure(currentLevel);
  player.x = CANVAS_WIDTH/2; player.y = CANVAS_HEIGHT/2;
  playerHealth = playerMaxHealth;
  player.slideVX = 0; player.slideVY = 0;
  if(isBossLevel(currentLevel)){
    flyingTexts.push({text:`👹 БОСС!`,x:player.x,y:player.y-80,life:3.0,color:'#f44336'});
  }
  flyingTexts.push({text:`🎉 Уровень ${currentLevel}`,x:player.x,y:player.y-60,life:2.5,color:'#ffd700'});
  playLevelUpSound();
  checkAchievements();
  saveGame();
}

// ===================== ПИТОМЦЫ =====================
function updatePet(dt){
  if(!activePet) return;
  petTimer -= dt;
  if(activePet === 'dog'){
    if(petTimer <= 0){
      petTimer = 3;
      let nearest = null, minD = TILE_SIZE*4;
      for(let r of resources){
        if(r.state !== 'idle') continue;
        const d = Math.hypot(player.x - (r.tx*TILE_SIZE+TILE_SIZE/2), player.y - (r.ty*TILE_SIZE+TILE_SIZE/2));
        if(d < minD){ minD = d; nearest = r; }
      }
      if(nearest){
        if(nearest.type === 'stone' && !upgrades.tools.stone) return;
        if(nearest.type === 'gold' && !upgrades.tools.gold) return;
        if(nearest.type === 'diamond' && !upgrades.tools.diamond) return;
        addResource(nearest.type, 1);
        stats.mined++;
        updateDailyQuest('mine', 1);
        flyingTexts.push({text:`🐕 +1`,x:nearest.tx*TILE_SIZE+TILE_SIZE/2,y:nearest.ty*TILE_SIZE+TILE_SIZE/2,life:1.0,color:'#4caf50'});
        spawnParticles(nearest.tx*TILE_SIZE+TILE_SIZE/2, nearest.ty*TILE_SIZE+TILE_SIZE/2, RESOURCE_TYPES[nearest.type].color, 4);
        nearest.state = 'respawning';
        nearest.respawnTimer = 15+currentLevel*2;
        saveGame();
      }
    }
  } else if(activePet === 'parrot'){
    if(petTimer <= 0){
      petTimer = 30;
      balance += 5;
      flyingTexts.push({text:`🦜 +5 💰`,x:player.x,y:player.y-40,life:1.5,color:'#ffd700'});
      saveGame();
    }
  }
}

// ===================== ЧАСТИЦЫ =====================
function spawnParticles(x,y,color,count){
  if(particles.length + count > MAX_PARTICLES) count = Math.max(0, MAX_PARTICLES - particles.length);
  for(let i=0;i<count;i++){
    const a = Math.random()*Math.PI*2;
    const s = 40 + Math.random()*80;
    particles.push({ x,y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 30, life:0.5+Math.random()*0.3, maxLife:0.8, color, size:2+Math.random()*3 });
  }
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x += p.vx*dt; p.y += p.vy*dt;
    p.vy += 200*dt;
    p.life -= dt;
    if(p.life<=0) particles.splice(i,1);
  }
}
function drawParticles(){
  for(let p of particles){
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}
function spawnSlash(x, y, angle, range, color){
  slashEffects.push({ x, y, angle, range, color, life: 0.25, maxLife: 0.25 });
}
function updateSlash(dt){
  for(let i=slashEffects.length-1;i>=0;i--){
    const s = slashEffects[i];
    s.life -= dt;
    if(s.life <= 0) slashEffects.splice(i,1);
  }
}
function drawSlash(){
  for(let s of slashEffects){
    const alpha = s.life / s.maxLife;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, s.range * 0.7, -Math.PI/4, Math.PI/4);
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
function spawnProjectile(x, y, dx, dy, damage, range){
  if(projectiles.length > 30) return;
  const speed = 400;
  projectiles.push({ x, y, vx:dx*speed, vy:dy*speed, damage, life:range/speed, color:'#5d4037' });
}
function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p = projectiles[i];
    p.x += p.vx*dt; p.y += p.vy*dt;
    p.life -= dt;
    let hit = false;
    for(let w of wolves){
      if(w.state==='dead') continue;
      const dx = w.x - p.x, dy = w.y - p.y;
      if(dx*dx + dy*dy < 324){
        w.health -= p.damage;
        spawnParticles(w.x, w.y, '#ff9800', 6);
        flyingTexts.push({text:`⚔️ -${p.damage}`,x:w.x,y:w.y-20,life:0.8,color:'#ff9800'});
        playHitSound();
        if(w.health <= 0){
          w.state = 'dead';
          stats.wolves++;
          updateDailyQuest('wolf', 1);
          addResource('meat', 2);
          balance += 15;
          spawnParticles(w.x, w.y, '#f44336', 8);
          flyingTexts.push({text:`+2 🍗 +15 💰`,x:w.x,y:w.y-40,life:1.5,color:'#4caf50'});
          checkAchievements();
        }
        hit = true; break;
      }
    }
    if(!hit){
      for(let b of bosses){
        const dx = b.x - p.x, dy = b.y - p.y;
        if(dx*dx + dy*dy < 900){
          b.health -= p.damage;
          spawnParticles(b.x, b.y, '#ff9800', 6);
          playHitSound();
          if(b.health <= 0) onBossDefeated(b);
          hit = true; break;
        }
      }
    }
    if(hit || p.life <= 0) projectiles.splice(i,1);
  }
}
function drawProjectiles(){
  for(let p of projectiles){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
    ctx.stroke();
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath();
    ctx.moveTo(8, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ===================== БОЙ =====================
function playerAttack(){
  if(gameState !== STATE_PLAYING) return;
  const weapon = getCurrentWeapon();
  const now = performance.now() / 1000;
  if(now - lastAttackTime < weapon.cooldown) return;
  lastAttackTime = now;
  let dirX = player.facingDir.x, dirY = player.facingDir.y;
  const len = Math.sqrt(dirX*dirX + dirY*dirY);
  if(len < 0.01){ dirX = player.facing; dirY = 0; }
  else { dirX /= len; dirY /= len; }
  const angle = Math.atan2(dirY, dirX);
  spawnSlash(player.x + dirX*20, player.y + dirY*20, angle, weapon.range, weapon.color);
  let damage = weapon.damage;
  if(upgrades.tools.stone) damage += 3;
  if(upgrades.tools.gold) damage += 6;
  if(weapon.ranged){
    spawnProjectile(player.x + dirX*12, player.y + dirY*12, dirX, dirY, damage, weapon.range);
    return;
  }
  let hitAny = false;
  for(let w of wolves){
    if(w.state === 'dead') continue;
    const dx = w.x - player.x, dy = w.y - player.y;
    const distSq = dx*dx + dy*dy;
    if(distSq > weapon.range * weapon.range) continue;
    const dist = Math.sqrt(distSq);
    const dot = (dx*dirX + dy*dirY) / Math.max(1, dist);
    if(dot < 0.5) continue;
    w.health -= damage;
    spawnParticles(w.x, w.y, '#ff9800', 6);
    flyingTexts.push({text:`⚔️ -${damage}`,x:w.x,y:w.y-20,life:0.8,color:'#ff9800'});
    hitAny = true;
    if(w.health <= 0){
      w.state = 'dead';
      stats.wolves++;
      updateDailyQuest('wolf', 1);
      addResource('meat', 2);
      balance += 15;
      spawnParticles(w.x, w.y, '#f44336', 8);
      flyingTexts.push({text:`+2 🍗 +15 💰`,x:w.x,y:w.y-40,life:1.5,color:'#4caf50'});
      checkAchievements();
    }
  }
  for(let b of bosses){
    const dx = b.x - player.x, dy = b.y - player.y;
    const distSq = dx*dx + dy*dy;
    if(distSq > weapon.range * weapon.range) continue;
    const dist = Math.sqrt(distSq);
    const dot = (dx*dirX + dy*dirY) / Math.max(1, dist);
    if(dot < 0.5) continue;
    b.health -= damage;
    spawnParticles(b.x, b.y, '#ff9800', 6);
    flyingTexts.push({text:`⚔️ -${damage}`,x:b.x,y:b.y-20,life:0.8,color:'#ff9800'});
    hitAny = true;
    if(b.health <= 0) onBossDefeated(b);
  }
  if(!hitAny) playHitSound();
}
function onBossDefeated(b){
  const idx = bosses.indexOf(b);
  if(idx !== -1) bosses.splice(idx, 1);
  bossActive = false;
  stats.bosses++;
  const reward = 300 + currentLevel * 100;
  balance += reward;
  addResource('diamond', 3);
  spawnParticles(b.x, b.y, '#ffd700', 20);
  flyingTexts.push({text:`👹 ПОБЕДА! +${reward}💰`,x:b.x,y:b.y-40,life:3.0,color:'#ffd700'});
  playLevelUpSound();
  checkAchievements();
  saveGame();
  checkLevelUp();
}
function eatMeat(){
  if(inventory.meat > 0 && playerHealth < playerMaxHealth){
    inventory.meat--;
    stats.meatEaten++;
    playerHealth = Math.min(playerMaxHealth, playerHealth + MEAT_HEAL);
    playerHunger = Math.min(MAX_HUNGER, playerHunger + 30);
    flyingTexts.push({text:`+${MEAT_HEAL} ❤️`,x:player.x,y:player.y-40,life:1.5,color:'#4caf50'});
    playHealSound();
    checkAchievements();
    saveGame();
  }
}
function onPlayerDeath(){
  if(isMobile) showMobileControls(false);
  for(let k in inventory) inventory[k] = Math.floor(inventory[k] * (1 - DEATH_RESOURCE_LOSS));
  balance = Math.floor(balance * (1 - DEATH_MONEY_LOSS));
  deathBanner = 3.0;
  stats.deaths++;
  player.x = CANVAS_WIDTH/2; player.y = CANVAS_HEIGHT/2;
  playerHealth = playerMaxHealth;
  wolves = wolves.filter(w => Math.hypot(player.x - w.x, player.y - w.y) > 300);
  comboCount = 0;
  playDeathSound();
  checkAchievements();
  saveGame();
}

// ===================== PVP =====================
function getRank(rating){
  let rank = RANKS[0];
  for(let r of RANKS){ if(rating >= r.min) rank = r; }
  return rank;
}
function openPvpMenu(){
  if(!gameWasStarted) return;
  gameState = STATE_PVP_MENU;
  if(isMobile) showMobileControls(false);
}
function startPvpBattle(opponentId){
  const opp = PVP_OPPONENTS.find(o=>o.id===opponentId);
  if(!opp) return;
  pvpPlayer = {
    x: 100, y: CANVAS_HEIGHT/2,
    health: playerMaxHealth, maxHealth: playerMaxHealth,
    damage: 15 + (upgrades.tools.gold ? 10 : 0) + (upgrades.tools.diamond ? 15 : 0),
    speed: 150, radius: 14, walkCycle: 0, facing: 1, attackCooldown: 0, invulnTimer: 0
  };
  pvpOpponent = {
    x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT/2,
    health: opp.hp, maxHealth: opp.hp,
    damage: opp.damage, speed: opp.speed, radius: 14,
    walkCycle: 0, facing: -1, attackCooldown: 0, icon: opp.icon, config: opp
  };
  pvpResult = null;
  gameState = STATE_PVP_ARENA;
  if(isMobile) showMobileControls(true);
  playLevelUpSound();
}
function pvpPlayerAttack(){
  if(!pvpPlayer || !pvpOpponent) return;
  if(pvpPlayer.attackCooldown > 0) return;
  pvpPlayer.attackCooldown = 0.5;
  const dx = pvpOpponent.x - pvpPlayer.x;
  const dy = pvpOpponent.y - pvpPlayer.y;
  const dist = Math.hypot(dx, dy);
  if(dist < 60){
    pvpOpponent.health -= pvpPlayer.damage;
    spawnParticles(pvpOpponent.x, pvpOpponent.y, '#ff9800', 8);
    flyingTexts.push({text:`⚔️ -${pvpPlayer.damage}`,x:pvpOpponent.x,y:pvpOpponent.y-30,life:1.0,color:'#ff9800'});
    playHitSound();
    if(pvpOpponent.health <= 0) endPvpBattle(true);
  } else playHitSound();
}
function endPvpBattle(win){
  const opp = pvpOpponent.config;
  let reward = 0, ratingChange = 0;
  if(win){
    pvp.wins++;
    pvp.winStreak++;
    if(pvp.winStreak > pvp.bestStreak) pvp.bestStreak = pvp.winStreak;
    reward = opp.reward;
    ratingChange = opp.ratingWin;
    balance += reward;
    pvp.rating += ratingChange;
    if(pvp.winStreak % 3 === 0){
      const bonus = 100 * (pvp.winStreak / 3);
      balance += bonus;
      reward += bonus;
    }
  } else {
    pvp.losses++;
    pvp.winStreak = 0;
    ratingChange = -opp.ratingLoss;
    pvp.rating = Math.max(0, pvp.rating - opp.ratingLoss);
  }
  pvp.battles.unshift({ opp: opp.name, win, rating: pvp.rating, time: Date.now() });
  if(pvp.battles.length > 10) pvp.battles.pop();
  pvpResult = { win, reward, ratingChange, opp };
  gameState = STATE_PVP_RESULT;
  if(win) playLevelUpSound();
  else playDeathSound();
  checkAchievements();
  saveGame();
}
function exitPvpArena(){
  gameState = STATE_PVP_MENU;
  pvpPlayer = null;
  pvpOpponent = null;
  if(isMobile) showMobileControls(false);
}
function updatePvpArena(dt){
  if(!pvpPlayer) return;
  let dx = 0, dy = 0;
  if(keys['ArrowLeft']||keys['KeyA']) dx -= 1;
  if(keys['ArrowRight']||keys['KeyD']) dx += 1;
  if(keys['ArrowUp']||keys['KeyW']) dy -= 1;
  if(keys['ArrowDown']||keys['KeyS']) dy += 1;
  if(joystickActive){ dx += joystickDX; dy += joystickDY; }
  if(Math.abs(dx)>0.01 || Math.abs(dy)>0.01){
    const len = Math.sqrt(dx*dx+dy*dy);
    if(len > 1){ dx /= len; dy /= len; }
    pvpPlayer.x += dx * pvpPlayer.speed * dt;
    pvpPlayer.y += dy * pvpPlayer.speed * dt;
    if(dx > 0) pvpPlayer.facing = 1;
    else if(dx < 0) pvpPlayer.facing = -1;
    pvpPlayer.walkCycle += pvpPlayer.speed * dt * 0.02;
  } else pvpPlayer.walkCycle *= 0.9;
  pvpPlayer.x = Math.max(30, Math.min(CANVAS_WIDTH-30, pvpPlayer.x));
  pvpPlayer.y = Math.max(30, Math.min(CANVAS_HEIGHT-30, pvpPlayer.y));
  if(pvpPlayer.attackCooldown > 0) pvpPlayer.attackCooldown -= dt;
  if(pvpPlayer.invulnTimer > 0) pvpPlayer.invulnTimer -= dt;
  if(!pvpOpponent) return;
  pvpOpponent.attackCooldown -= dt;
  const edx = pvpPlayer.x - pvpOpponent.x;
  const edy = pvpPlayer.y - pvpOpponent.y;
  const edist = Math.hypot(edx, edy);
  if(edist > 40){
    const en = edist < 1 ? 1 : edist;
    pvpOpponent.x += (edx/en) * pvpOpponent.speed * dt;
    pvpOpponent.y += (edy/en) * pvpOpponent.speed * dt;
    pvpOpponent.walkCycle += pvpOpponent.speed * dt * 0.02;
  }
  if(edist < 50 && pvpOpponent.attackCooldown <= 0){
    if(pvpPlayer.invulnTimer <= 0){
      pvpPlayer.health -= pvpOpponent.damage;
      pvpPlayer.invulnTimer = 0.8;
      spawnParticles(pvpPlayer.x, pvpPlayer.y, '#ff1744', 8);
      flyingTexts.push({text:`-${pvpOpponent.damage}`,x:pvpPlayer.x,y:pvpPlayer.y-30,life:1.0,color:'#ff1744'});
      playHurtSound();
      if(pvpPlayer.health <= 0){ pvpPlayer.health = 0; endPvpBattle(false); }
    }
    pvpOpponent.attackCooldown = 1.2;
  }
  updateParticles(dt);
  updateFlyingTexts(dt);
}

// ===================== ОБНОВЛЕНИЯ =====================
function updateResources(dt){
  for(let r of resources){
    if(r.state==='respawning'){ r.respawnTimer -= dt; if(r.respawnTimer<=0) r.state='idle'; }
    if(r.state==='idle') r.particleTimer = (r.particleTimer+dt)%1;
  }
}
function updateAnimals(dt){
  for(let a of animals){
    if(a.state==='hunting') continue;
    a.moveTimer -= dt;
    if(a.moveTimer<=0){ a.moveTimer=1+Math.random()*3; a.dirX=Math.random()>0.5?1:-1; a.dirY=Math.random()>0.5?1:-1; }
    const ntx = a.tx + (a.dirX>0?1:-1)*(Math.random()<0.02?1:0);
    const nty = a.ty + (a.dirY>0?1:-1)*(Math.random()<0.02?1:0);
    if(ntx>=0&&ntx<MAP_WIDTH&&nty>=0&&nty<MAP_HEIGHT&&isTileWalkable(ntx,nty)&&!getAnimalAt(ntx,nty)){ a.tx=ntx; a.ty=nty; }
  }
}
function updateWolves(dt){
  for(let w of wolves){
    if(w.state==='dead') continue;
    const dx = player.x - w.x, dy = player.y - w.y;
    const distSq = dx*dx+dy*dy;
    const dist = Math.sqrt(distSq);
    if(w.attackCooldown>0) w.attackCooldown -= dt;
    if(dist < WOLF_DETECTION){
      w.state = 'chase';
      const n = dist < 1 ? 1 : dist;
      const nx = w.x + (dx/n)*WOLF_SPEED*dt, ny = w.y + (dy/n)*WOLF_SPEED*dt;
      const ntx = Math.floor(nx/TILE_SIZE), nty = Math.floor(ny/TILE_SIZE);
      if(isTileWalkable(ntx,nty)){ w.x=nx; w.y=ny; w.tx=ntx; w.ty=nty; w.walkCycle += dt*10; }
      if(distSq < 400 && w.attackCooldown <= 0){
        if(playerInvulnTimer <= 0){
          let dmg = WOLF_DAMAGE;
          playerHealth -= dmg;
          playerHurtTimer = 0.4;
          playerInvulnTimer = 1.0;
          playHurtSound();
          spawnParticles(player.x, player.y, '#ff1744', 5);
          flyingTexts.push({text:`-${dmg} ❤️`,x:player.x,y:player.y-40,life:1.5,color:'#ff1744'});
          if(playerHealth <= 0){ playerHealth = 0; onPlayerDeath(); }
        }
        w.attackCooldown = WOLF_ATTACK_COOLDOWN;
      }
    } else if(dist > WOLF_CHASE_RANGE){
      w.state = 'idle';
    }
    if(w.state === 'idle'){
      if(Math.random() < 0.005){
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        const [d2x, d2y] = dirs[Math.floor(Math.random()*4)];
        const nx = w.tx + d2x, ny = w.ty + d2y;
        if(isTileWalkable(nx,ny)){ w.tx=nx; w.ty=ny; w.x=nx*TILE_SIZE+TILE_SIZE/2; w.y=ny*TILE_SIZE+TILE_SIZE/2; }
      }
    }
  }
  wolves = wolves.filter(w => w.state !== 'dead');
  wolfSpawnTimer -= dt;
  if(wolfSpawnTimer <= 0 && wolves.length < Math.max(1, Math.floor(currentLevel/2))){
    wolfSpawnTimer = 30;
    for(let a=0;a<50;a++){
      const tx=Math.floor(Math.random()*MAP_WIDTH),ty=Math.floor(Math.random()*MAP_HEIGHT);
      if(!isTileWalkable(tx,ty)) continue;
      const cx=tx*TILE_SIZE+TILE_SIZE/2, cy=ty*TILE_SIZE+TILE_SIZE/2;
      if(Math.hypot(player.x-cx, player.y-cy) < TILE_SIZE*5) continue;
      const hp = 30 + currentLevel*5;
      wolves.push({ type:'wolf',tx,ty,x:cx,y:cy,health:hp,maxHealth:hp,state:'idle',attackCooldown:0,walkCycle:0 });
      break;
    }
  }
}
function updateBoss(dt){
  for(let b of bosses){
    const dx = player.x - b.x, dy = player.y - b.y;
    const distSq = dx*dx + dy*dy;
    const dist = Math.sqrt(distSq);
    if(b.attackCooldown > 0) b.attackCooldown -= dt;
    const speed = WOLF_SPEED * 0.7;
    const n = dist < 1 ? 1 : dist;
    const nx = b.x + (dx/n) * speed * dt;
    const ny = b.y + (dy/n) * speed * dt;
    const ntx = Math.floor(nx/TILE_SIZE), nty = Math.floor(ny/TILE_SIZE);
    if(isTileWalkable(ntx,nty)){ b.x=nx; b.y=ny; b.tx=ntx; b.ty=nty; b.walkCycle += dt*10; }
    if(distSq < 900 && b.attackCooldown <= 0){
      if(playerInvulnTimer <= 0){
        let dmg = 20;
        playerHealth -= dmg;
        playerHurtTimer = 0.5;
        playerInvulnTimer = 1.2;
        playHurtSound();
        spawnParticles(player.x, player.y, '#ff1744', 10);
        flyingTexts.push({text:`-${dmg} ❤️ БОСС`,x:player.x,y:player.y-40,life:1.5,color:'#ff1744'});
        if(playerHealth <= 0){ playerHealth = 0; onPlayerDeath(); }
      }
      b.attackCooldown = 2.0;
    }
    if(b.health < b.maxHealth * 0.5 && b.phase === 1){
      b.phase = 2;
      flyingTexts.push({text:`👹 БОСС СВИРЕПЕЕТ!`,x:b.x,y:b.y-60,life:2.5,color:'#f44336'});
    }
  }
}
function updateFlyingTexts(dt){
  for(let i=flyingTexts.length-1;i>=0;i--){
    const ft = flyingTexts[i];
    ft.y -= 40*dt; ft.life -= dt;
    if(ft.life<=0) flyingTexts.splice(i,1);
  }
}
function updateTreasure(dt){
  if(!treasure) return;
  treasureParticles = (treasureParticles + dt) % 1;
  const dx = player.x - treasure.x, dy = player.y - treasure.y;
  if(dx*dx + dy*dy < 800){
    balance += treasure.reward;
    flyingTexts.push({text:`🎁 +${treasure.reward} 💰`,x:player.x,y:player.y-40,life:2.0,color:'#ffd700'});
    spawnParticles(treasure.x, treasure.y, '#ffd700', 12);
    playLevelUpSound();
    treasure = null;
    saveGame();
    checkLevelUp();
  }
}
function updatePlaying(dt){
  animTime += dt;
  if(playerHurtTimer>0) playerHurtTimer -= dt;
  if(playerInvulnTimer>0) playerInvulnTimer -= dt;
  if(deathBanner>0){
    deathBanner -= dt;
    if(deathBanner <= 0 && isMobile && gameState === STATE_PLAYING){
      showMobileControls(true);
    }
  }
  if(speedBoostTimer>0){ speedBoostTimer -= dt; if(speedBoostTimer<0) speedBoostTimer=0; }
  if(comboTimer > 0){
    comboTimer -= dt;
    if(comboTimer <= 0){ comboCount = 0; comboTimer = 0; }
  }
  if(fairActive){
    fairTimer -= dt;
    if(fairTimer <= 0){ fairActive = false; fairTimer = 0; }
  } else if(fairCooldown > 0){
    fairCooldown -= dt;
    if(fairCooldown <= 0) fairCooldown = 0;
  }
  playerHunger -= HUNGER_DRAIN * dt;
  if(playerHunger < 0) playerHunger = 0;
  updatePet(dt);
  if(levelTransitionPhase === 'darken'){
    levelTransition += dt * 2.5;
    if(levelTransition >= 1){ levelTransition = 1; doActualLevelUp(); levelTransitionPhase = 'brighten'; }
  } else if(levelTransitionPhase === 'brighten'){
    levelTransition -= dt * 2.5;
    if(levelTransition <= 0){ levelTransition = 0; levelTransitionPhase = 'none'; }
  }
  if(!activeMining && deathBanner <= 0 && levelTransitionPhase === 'none'){
    let dx = 0, dy = 0;
    if(keys['ArrowLeft']||keys['KeyA']) dx -= 1;
    if(keys['ArrowRight']||keys['KeyD']) dx += 1;
    if(keys['ArrowUp']||keys['KeyW']) dy -= 1;
    if(keys['ArrowDown']||keys['KeyS']) dy += 1;
    if(joystickActive){ dx += joystickDX; dy += joystickDY; }
    if(Math.abs(dx)>0.01 || Math.abs(dy)>0.01){
      const len = Math.sqrt(dx*dx+dy*dy);
      if(len > 1){ dx /= len; dy /= len; }
      let speed = BASE_SPEED * (1 + upgrades.speed*0.2);
      if(speedBoostTimer > 0) speed *= 1.5;
      if(playerHunger < 30) speed *= 0.7;
      if(playerHunger < 10) speed *= 0.5;
      if(currentBiome.ice){
        player.slideVX = player.slideVX * 0.92 + dx * speed * 0.08;
        player.slideVY = player.slideVY * 0.92 + dy * speed * 0.08;
        tryMove((player.slideVX + dx * speed * 0.4) * dt, (player.slideVY + dy * speed * 0.4) * dt);
      } else {
        player.slideVX = 0; player.slideVY = 0;
        tryMove(dx*speed*dt, dy*speed*dt);
      }
      player.facingDir = { x:dx, y:dy };
      if(dx !== 0) player.facing = dx > 0 ? 1 : -1;
      player.walkCycle += speed*dt*0.02;
    } else {
      player.walkCycle *= 0.9;
      if(currentBiome.ice){
        if(Math.abs(player.slideVX) > 1 || Math.abs(player.slideVY) > 1){
          tryMove(player.slideVX * dt, player.slideVY * dt);
          player.slideVX *= 0.96;
          player.slideVY *= 0.96;
        }
      }
    }
  }
  if(activeMining){
    const now = performance.now()/1000;
    if(now - activeMining.startTime >= activeMining.duration) finishMining();
  }
  updateResources(dt);
  updateAnimals(dt);
  updateWolves(dt);
  updateBoss(dt);
  updateFlyingTexts(dt);
  updateParticles(dt);
  updateSlash(dt);
  updateProjectiles(dt);
  updateTreasure(dt);
}

// ===================== ОТРИСОВКА =====================
function drawMap(){
  const groundTile = currentBiome.ice ? TILE_SNOW : (currentBiome.id === 'desert' ? TILE_SAND : TILE_GRASS);
  const grassColor = currentBiome.grass;
  const detailColor = currentBiome.grassDetail;
  const t = animTime;
  for(let ty=0;ty<MAP_HEIGHT;ty++){
    for(let tx=0;tx<MAP_WIDTH;tx++){
      const tile = map[ty][tx], x=tx*TILE_SIZE, y=ty*TILE_SIZE;
      ctx.fillStyle = grassColor;
      ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
      if(tile === groundTile){
        ctx.fillStyle = detailColor;
        for(let i=0;i<3;i++){
          const bx = x+4+(i*7+tx*3)%24, by = y+4+(i*5+ty*2)%24;
          ctx.fillRect(bx,by,2,4);
        }
      }
      if(tile===TILE_STONE){
        ctx.fillStyle='#7a8c8d'; ctx.fillRect(x+2,y+2,TILE_SIZE-4,TILE_SIZE-4);
        ctx.fillStyle='#5b6e6f';
        ctx.beginPath(); ctx.arc(x+TILE_SIZE/2,y+TILE_SIZE/2,10,0,Math.PI*2); ctx.fill();
      } else if(tile===TILE_TREE){
        const sway = Math.sin(t*1.2 + tx*0.7 + ty*0.3) * 2;
        ctx.fillStyle='#8b5a2b'; ctx.fillRect(x+12,y+16,8,16);
        ctx.fillStyle='#2e7d32';
        ctx.beginPath();
        ctx.moveTo(x+16+sway, y+4);
        ctx.lineTo(x+4+sway, y+22);
        ctx.lineTo(x+28+sway, y+22);
        ctx.closePath(); ctx.fill();
      } else if(tile===TILE_WATER){
        const wave = Math.sin(t*2 + tx*0.5) * 1.5;
        ctx.fillStyle='#4a90d9'; ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
        ctx.fillStyle='#6bb3f0';
        ctx.beginPath(); ctx.arc(x+10,y+10+wave,5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+22,y+22-wave,5,0,Math.PI*2); ctx.fill();
      }
    }
  }
}
function drawResources(){
  for(let res of resources){
    if(res.state==='respawning') continue;
    const cx = res.tx*TILE_SIZE+TILE_SIZE/2, cy = res.ty*TILE_SIZE+TILE_SIZE/2;
    ctx.save(); ctx.translate(cx, cy);
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
    const cfg = RESOURCE_TYPES[res.type];
    if(res.type==='stone'){
      ctx.fillStyle = cfg.color; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#6d6d6d'; ctx.beginPath(); ctx.arc(-3,-3,4,0,Math.PI*2); ctx.fill();
    } else if(res.type==='wood'){
      ctx.fillStyle='#8b5a2b'; ctx.fillRect(-5,-5,10,10);
      ctx.fillStyle = cfg.color;
      ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(-10,4); ctx.lineTo(10,4); ctx.closePath(); ctx.fill();
    } else if(res.type==='gold'){
      const g = 0.7+0.3*Math.sin(res.particleTimer*Math.PI*2);
      ctx.fillStyle = cfg.color;
      ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(8,0); ctx.lineTo(0,12); ctx.lineTo(-8,0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,255,200,${g})`;
      ctx.beginPath(); ctx.arc(0,-4,3,0,Math.PI*2); ctx.fill();
    } else if(res.type==='diamond'){
      const g = 0.7+0.3*Math.sin(res.particleTimer*Math.PI*2);
      ctx.fillStyle = cfg.color;
      ctx.beginPath();
      ctx.moveTo(0,-10); ctx.lineTo(6,-2); ctx.lineTo(10,0); ctx.lineTo(6,2);
      ctx.lineTo(0,10); ctx.lineTo(-6,2); ctx.lineTo(-10,0); ctx.lineTo(-6,-2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${g})`;
      ctx.beginPath(); ctx.arc(-2,-3,2.5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    let needsTool = false;
    if(res.type==='stone' && !upgrades.tools.stone) needsTool = true;
    else if(res.type==='gold' && !upgrades.tools.gold) needsTool = true;
    else if(res.type==='diamond' && !upgrades.tools.diamond) needsTool = true;
    if(needsTool && res.state==='idle'){
      ctx.font = '16px "Courier New"'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,82,82,0.9)';
      ctx.fillText('🔒', cx, cy - 14);
    }
    if(res.state==='mining' && activeMining && activeMining.resource===res){
      const progress = (performance.now()/1000 - activeMining.startTime) / activeMining.duration;
      const bw=24, bh=6, bx=cx-bw/2, by=res.ty*TILE_SIZE-10;
      ctx.fillStyle='#555'; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle = cfg.color; ctx.fillRect(bx,by,bw*Math.min(progress,1),bh);
    }
  }
}
function drawAnimals(){
  for(let a of animals){
    const cx = a.tx*TILE_SIZE+TILE_SIZE/2, cy = a.ty*TILE_SIZE+TILE_SIZE/2;
    ctx.save(); ctx.translate(cx, cy);
    if(a.type==='chicken'){
      ctx.fillStyle='#f9a825';
      ctx.beginPath(); ctx.ellipse(0,0,8,6,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff5722';
      ctx.beginPath(); ctx.arc(4,-5,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.arc(5,-6,1,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    if(a.state==='hunting' && activeMining && activeMining.animal===a){
      const progress = (performance.now()/1000 - activeMining.startTime) / activeMining.duration;
      const bw=24, bh=6, bx=cx-bw/2, by=cy-16;
      ctx.fillStyle='#555'; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle='#f44336'; ctx.fillRect(bx,by,bw*Math.min(progress,1),bh);
    }
  }
}
function drawWolves(){
  for(let w of wolves){
    if(w.state==='dead') continue;
    ctx.save(); ctx.translate(w.x, w.y);
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0,8,14,6,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#616161';
    ctx.beginPath(); ctx.ellipse(0,0,14,8,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#424242';
    ctx.beginPath(); ctx.arc(-12,-4,7,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16,-10); ctx.lineTo(-18,-16); ctx.lineTo(-12,-12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10,-10); ctx.lineTo(-8,-16); ctx.lineTo(-6,-11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = w.state==='chase' ? '#ff1744' : '#ffc107';
    ctx.beginPath(); ctx.arc(-14,-5,1.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-10,-5,1.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#424242'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(12,0); ctx.lineTo(20,-4); ctx.stroke();
    if(w.health < w.maxHealth){
      const bw=26, bh=4, bx=-bw/2, by=-20;
      ctx.fillStyle='#333'; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle='#f44336'; ctx.fillRect(bx,by,bw*(w.health/w.maxHealth),bh);
    }
    ctx.restore();
  }
}
function drawBosses(){
  for(let b of bosses){
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle='rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0,15,24,10,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = b.phase === 2 ? '#8b0000' : '#4a0000';
    ctx.beginPath(); ctx.ellipse(0,0,24,18,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = b.phase === 2 ? '#b71c1c' : '#6a1a1a';
    ctx.beginPath(); ctx.arc(-20,-8,12,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath(); ctx.arc(-25,-10,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-18,-10,3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-25,-10,1.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-18,-10,1.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-25,-18); ctx.lineTo(-30,-30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-15,-18); ctx.lineTo(-12,-30); ctx.stroke();
    const bw = 60, bh = 6, bx = -bw/2, by = -35;
    ctx.fillStyle='#333'; ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = b.phase === 2 ? '#ff1744' : '#f44336';
    ctx.fillRect(bx,by,bw*(b.health/b.maxHealth),bh);
    ctx.strokeStyle='#fff'; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#fff'; ctx.font='bold 12px "Courier New"'; ctx.textAlign='center';
    ctx.fillText('👹 БОСС', 0, by - 5);
    ctx.restore();
  }
}
function drawTreasure(){
  if(!treasure) return;
  const cx = treasure.x, cy = treasure.y;
  const glow = 0.6 + 0.4 * Math.sin(treasureParticles * Math.PI * 2);
  ctx.save();
  ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 15;
  ctx.fillStyle = '#8d6e63';
  ctx.fillRect(cx - 14, cy - 10, 28, 18);
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(cx - 14, cy - 10, 28, 5);
  ctx.fillStyle = `rgba(255,215,0,${glow})`;
  ctx.fillRect(cx - 3, cy - 3, 6, 6);
  ctx.restore();
}
function drawPet(){
  if(!activePet) return;
  const angle = animTime * 1.5;
  const px = player.x + Math.cos(angle) * 30;
  const py = player.y + Math.sin(angle) * 20 + 10;
  ctx.save();
  ctx.translate(px, py);
  if(activePet === 'dog'){
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#5d4037';
    ctx.beginPath(); ctx.arc(-5, -3, 4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-6, -4, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(-3, -4, 1, 0, Math.PI*2); ctx.fill();
  } else if(activePet === 'parrot'){
    ctx.fillStyle = '#4caf50';
    ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f44336';
    ctx.beginPath(); ctx.arc(-5, -2, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-6, -3, 1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath(); ctx.moveTo(-8, -1); ctx.lineTo(-11, -3); ctx.lineTo(-8, -4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawPlayer(){
  const skin = SKINS.find(s=>s.id===equippedSkin) || SKINS[0];
  const weapon = getCurrentWeapon();
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0,8,11,6,0,0,Math.PI*2); ctx.fill();
  const phase = player.walkCycle * Math.PI * 2;
  const isMoving = Math.abs(player.walkCycle) > 0.05;
  const legSwing = isMoving ? Math.sin(phase) * 5 : 0;
  const armSwing = isMoving ? Math.sin(phase) * 4 : 0;
  const bob = isMoving ? Math.abs(Math.sin(phase)) * 2 : 0;
  const bodyOffsetY = -bob;
  if(playerInvulnTimer > 0 && Math.floor(playerInvulnTimer*20)%2 === 0) ctx.globalAlpha = 0.5;
  ctx.strokeStyle = skin.colorBody; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, bodyOffsetY); ctx.lineTo(-6 + legSwing, bodyOffsetY + 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, bodyOffsetY); ctx.lineTo(6 - legSwing, bodyOffsetY + 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, bodyOffsetY - 6); ctx.lineTo(0, bodyOffsetY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, bodyOffsetY - 6); ctx.lineTo(-8 + armSwing, bodyOffsetY + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, bodyOffsetY - 6); ctx.lineTo(8 - armSwing, bodyOffsetY + 4); ctx.stroke();
  ctx.fillStyle = skin.colorHead;
  ctx.beginPath(); ctx.arc(0, bodyOffsetY - 14, 8, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
  const eyeShift = player.facing * 1.5;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-3+eyeShift, bodyOffsetY-16, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3+eyeShift, bodyOffsetY-16, 2, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-3+eyeShift*1.5, bodyOffsetY-16, 1, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3+eyeShift*1.5, bodyOffsetY-16, 1, 0, Math.PI*2); ctx.fill();
  if(equippedAccessory === 'hat'){
    ctx.fillStyle = '#212121';
    ctx.fillRect(-10, bodyOffsetY-24, 20, 3);
    ctx.fillRect(-6, bodyOffsetY-34, 12, 10);
  } else if(equippedAccessory === 'crown'){
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-9, bodyOffsetY-22); ctx.lineTo(-9, bodyOffsetY-30);
    ctx.lineTo(-5, bodyOffsetY-25); ctx.lineTo(0, bodyOffsetY-32);
    ctx.lineTo(5, bodyOffsetY-25); ctx.lineTo(9, bodyOffsetY-30);
    ctx.lineTo(9, bodyOffsetY-22); ctx.closePath(); ctx.fill();
  } else if(equippedAccessory === 'glasses'){
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-3+eyeShift, bodyOffsetY-16, 3.5, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(3+eyeShift, bodyOffsetY-16, 3.5, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.5+eyeShift, bodyOffsetY-16); ctx.lineTo(0.5+eyeShift, bodyOffsetY-16); ctx.stroke();
  }
  const wx = 8 - armSwing;
  const wy = bodyOffsetY + 4;
  ctx.font = '14px "Courier New"'; ctx.textAlign = 'center';
  ctx.fillText(weapon.icon, wx + player.facing*3, wy);
  ctx.globalAlpha = 1;
  ctx.restore();
  if(activeMining){
    const elapsed = (performance.now()/1000 - activeMining.startTime) % 0.5;
    for(let i=0;i<2;i++){
      const alpha = 1 - elapsed/0.5;
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + elapsed*20 + i*5, 0, Math.PI*2);
      ctx.stroke();
    }
  }
}
function drawHUD(){
  const hpX=15, hpY=15, hpW=150, hpH=18;
  ctx.fillStyle='#333'; ctx.fillRect(hpX,hpY,hpW,hpH);
  const hpPct = playerHealth / playerMaxHealth;
  let hpColor = '#4caf50';
  if(hpPct < 0.3) hpColor = '#f44336';
  else if(hpPct < 0.6) hpColor = '#ff9800';
  ctx.fillStyle = hpColor;
  ctx.fillRect(hpX, hpY, hpW*hpPct, hpH);
  ctx.strokeStyle='#fff'; ctx.strokeRect(hpX, hpY, hpW, hpH);
  ctx.fillStyle='#fff'; ctx.font='bold 12px "Courier New"'; ctx.textAlign='center';
  ctx.fillText(`❤️ ${Math.ceil(playerHealth)} / ${playerMaxHealth}`, hpX + hpW/2, hpY + 13);
  ctx.textAlign='left';
  const hungerY = hpY + 22;
  ctx.fillStyle='#333'; ctx.fillRect(hpX, hungerY, hpW, 10);
  const hungerPct = playerHunger / MAX_HUNGER;
  let hungerColor = '#ff9800';
  if(hungerPct < 0.3) hungerColor = '#f44336';
  ctx.fillStyle = hungerColor;
  ctx.fillRect(hpX, hungerY, hpW * hungerPct, 10);
  ctx.strokeStyle='#fff'; ctx.strokeRect(hpX, hungerY, hpW, 10);
  ctx.fillStyle='#fff'; ctx.font='bold 10px "Courier New"'; ctx.textAlign='center';
  ctx.fillText(`🍽️ ${Math.ceil(playerHunger)}`, hpX + hpW/2, hungerY + 8);
  ctx.textAlign='left';
  ctx.fillStyle='#fff'; ctx.font='bold 20px "Courier New"';
  ctx.fillText(`💰 ${balance}`, 15, 70);
  ctx.font='12px "Courier New"'; ctx.fillStyle='#a5d6a7';
  ctx.fillText(currentBiome.name, 15, 86);
  const rank = getRank(pvp.rating);
  ctx.fillStyle = rank.color;
  ctx.fillText(`${rank.name} — ${pvp.rating}`, 15, 102);
  const progressX = 220, progressY = 15, progressW = 200, progressH = 14;
  ctx.fillStyle='#333'; ctx.fillRect(progressX, progressY, progressW, progressH);
  const progress = Math.min(1, balance/targetMoney);
  ctx.fillStyle='#ffd700'; ctx.fillRect(progressX, progressY, progressW*progress, progressH);
  ctx.strokeStyle='#fff'; ctx.strokeRect(progressX, progressY, progressW, progressH);
  ctx.fillStyle='#fff'; ctx.font='14px "Courier New"'; ctx.textAlign='center';
  ctx.fillText(`Уровень ${currentLevel}${isBossLevel(currentLevel)?' 👹':''}`, progressX + progressW/2, progressY - 6);
  ctx.fillText(`${balance}/${targetMoney}`, progressX + progressW/2, progressY + progressH + 14);
  if(comboCount > 0){
    ctx.textAlign='center';
    ctx.fillStyle='#ff5722'; ctx.font='bold 14px "Courier New"';
    ctx.fillText(`🔥 Комбо: ${comboCount}/${COMBO_MAX}`, progressX + progressW/2, progressY + progressH + 32);
  }
  if(fairActive){
    ctx.textAlign='center';
    ctx.fillStyle='#ffd700'; ctx.font='bold 16px "Courier New"';
    ctx.fillText(`🎪 ЯРМАРКА x2! ${Math.ceil(fairTimer)}с`, CANVAS_WIDTH/2, 60);
  }
  const weapon = getCurrentWeapon();
  ctx.textAlign='right';
  ctx.fillStyle='#fff'; ctx.font='bold 16px "Courier New"';
  ctx.fillText(`${weapon.icon} ${weapon.name}`, CANVAS_WIDTH - 15, 30);
  const invX = CANVAS_WIDTH - 120, invY = 50;
  ctx.font='12px "Courier New"'; ctx.textAlign='left';
  let iy = invY;
  const resList = ['stone','wood','gold','diamond','meat'];
  const icons = {stone:'🪨',wood:'🪵',gold:'✨',diamond:'💎',meat:'🍗'};
  for(let key of resList){
    if(inventory[key] > 0){
      ctx.fillStyle='#eee';
      ctx.fillText(`${icons[key]} ${inventory[key]}`, invX, iy);
      iy += 15;
    }
  }
  if(!isMobile){
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='11px "Courier New"';
    ctx.fillText('E — действие | Q — атака | F — мясо | I — инвентарь | K — достижения | M — магазин | P — арена', 15, CANVAS_HEIGHT - 15);
  }
  if(!isMobile){
    const menuX = CANVAS_WIDTH - 40, menuY = CANVAS_HEIGHT - 40;
    ctx.fillStyle='#333'; ctx.fillRect(menuX-15,menuY-15,30,30);
    ctx.fillStyle='#fff'; ctx.font='22px "Courier New"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('☰', menuX, menuY);
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    canvas.menuButtonRect = { x:menuX-15, y:menuY-15, w:30, h:30 };
  } else {
    canvas.menuButtonRect = null;
  }
}
function drawFlyingTexts(){
  for(let ft of flyingTexts){
    ctx.globalAlpha = Math.min(1, ft.life);
    ctx.fillStyle = ft.color || '#ffd700';
    ctx.font='bold 16px "Courier New"'; ctx.textAlign='center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1;
  }
}
function drawButton(x,y,w,h,text,color,active=true,fontSize=20){
  ctx.fillStyle = active ? color : '#555';
  ctx.fillRect(x,y,w,h);
  ctx.fillStyle='#fff'; ctx.font=`${fontSize}px "Courier New"`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text, x+w/2, y+h/2);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
}

// ===================== ИНВЕНТАРЬ =====================
function openInventory(){
  if(gameState !== STATE_PLAYING) return;
  gameState = STATE_INVENTORY;
  if(isMobile) showMobileControls(false);
}
function closeInventory(){
  gameState = STATE_PLAYING;
  if(isMobile) showMobileControls(true);
}
function drawInventory(){
  ctx.fillStyle='rgba(0,0,0,0.9)'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  ctx.fillStyle='#fff'; ctx.font='bold 28px "Courier New"'; ctx.textAlign='center';
  ctx.fillText('🎒 Инвентарь', CANVAS_WIDTH/2, 45);
  const panelX = 40, panelY = 80, panelW = 380, panelH = CANVAS_HEIGHT - 165;
  ctx.fillStyle='#1e1e1e'; ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle='#444'; ctx.strokeRect(panelX, panelY, panelW, panelH);
  ctx.fillStyle='#fff'; ctx.font='bold 18px "Courier New"'; ctx.textAlign='left';
  ctx.fillText('Ресурсы', panelX + 20, panelY + 28);
  const resList = [
    {key:'stone',icon:'🪨',name:'Камень'},{key:'wood',icon:'🪵',name:'Дерево'},
    {key:'gold',icon:'✨',name:'Золото'},{key:'diamond',icon:'💎',name:'Алмаз'},
    {key:'meat',icon:'🍗',name:'Мясо'}
  ];
  let ry = panelY + 55;
  ctx.font='15px "Courier New"';
  for(let r of resList){
    ctx.fillStyle = inventory[r.key] > 0 ? '#fff' : '#666';
    ctx.textAlign='left';
    ctx.fillText(`${r.icon} ${r.name}`, panelX + 20, ry);
    ctx.textAlign='right';
    ctx.fillText(`${inventory[r.key]}`, panelX + panelW - 20, ry);
    ry += 28;
  }
  const panel2X = CANVAS_WIDTH/2 + 20, panel2Y = 80, panel2W = CANVAS_WIDTH/2 - 60, panel2H = CANVAS_HEIGHT - 165;
  ctx.fillStyle='#1e1e1e'; ctx.fillRect(panel2X, panel2Y, panel2W, panel2H);
  ctx.strokeStyle='#444'; ctx.strokeRect(panel2X, panel2Y, panel2W, panel2H);
  ctx.fillStyle='#fff'; ctx.font='bold 18px "Courier New"'; ctx.textAlign='left';
  ctx.fillText('Экипировка', panel2X + 20, panel2Y + 28);
  const weapon = getCurrentWeapon();
  const skin = SKINS.find(s=>s.id===equippedSkin) || SKINS[0];
  ctx.font='14px "Courier New"'; ctx.fillStyle='#fff';
  ctx.fillText(`⚔️ ${weapon.icon} ${weapon.name} (урон ${weapon.damage})`, panel2X + 20, panel2Y + 58);
  ctx.fillText(`👤 Скин: ${skin.name}`, panel2X + 20, panel2Y + 80);
  ctx.fillText(`🌍 Биом: ${currentBiome.name}`, panel2X + 20, panel2Y + 102);
  if(activePet){
    const pet = PETS.find(p=>p.id===activePet);
    ctx.fillText(`🐾 ${pet.name}`, panel2X + 20, panel2Y + 124);
  }
  const rank = getRank(pvp.rating);
  ctx.fillStyle = rank.color; ctx.font='bold 14px "Courier New"';
  ctx.fillText(`⚔️ PvP: ${rank.name} — ${pvp.rating}`, panel2X + 20, panel2Y + 152);
  ctx.fillStyle='#ccc'; ctx.font='12px "Courier New"';
  ctx.fillText(`Побед: ${pvp.wins} | Поражений: ${pvp.losses}`, panel2X + 20, panel2Y + 172);
  ctx.fillStyle='#fff'; ctx.font='bold 16px "Courier New"';
  ctx.fillText('Активные эффекты:', panel2X + 20, panel2Y + 200);
  ctx.font='12px "Courier New"';
  let ey = panel2Y + 222;
  const effects = [];
  if(speedBoostTimer > 0) effects.push({c:'#4caf50', t:`⚡ Зелье скорости (${Math.ceil(speedBoostTimer)}с)`});
  if(miningBoostActive) effects.push({c:'#2196f3', t:'⛏ Каменная броня'});
  if(goldPickaxeActive) effects.push({c:'#ffd700', t:'✨ Золотая кирка x2'});
  if(fairActive) effects.push({c:'#ffd700', t:`🎪 Ярмарка x2 (${Math.ceil(fairTimer)}с)`});
  if(effects.length === 0){
    ctx.fillStyle='#666';
    ctx.fillText('Нет активных эффектов', panel2X + 20, ey);
  } else {
    for(let e of effects){ ctx.fillStyle = e.c; ctx.fillText(e.t, panel2X + 20, ey); ey += 18; }
  }
  if(dailyQuest){
    ctx.fillStyle='#ffd700'; ctx.font='bold 14px "Courier New"';
    ctx.fillText(`📅 ${dailyQuest.name}`, panel2X + 20, CANVAS_HEIGHT - 160);
    ctx.fillStyle='#fff'; ctx.font='12px "Courier New"';
    ctx.fillText(`Прогресс: ${dailyQuest.progress}/${dailyQuest.target}${dailyQuest.done?' ✅':''}`, panel2X + 20, CANVAS_HEIGHT - 140);
  }
  drawButton(CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT - 60, 200, 42, '✖ Закрыть (I)', '#888');
  canvas.inventoryCloseButton = { x:CANVAS_WIDTH/2 - 100, y:CANVAS_HEIGHT - 60, w:200, h:42 };
}

// ===================== ДОСТИЖЕНИЯ =====================
function openAchievements(){
  if(gameState !== STATE_PLAYING) return;
  gameState = STATE_ACHIEVEMENTS;
  if(isMobile) showMobileControls(false);
}
function closeAchievements(){
  gameState = STATE_PLAYING;
  if(isMobile) showMobileControls(true);
}
function drawAchievements(){
  ctx.fillStyle='rgba(0,0,0,0.93)'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  ctx.fillStyle='#fff'; ctx.font='bold 28px "Courier New"'; ctx.textAlign='center';
  ctx.fillText('🏆 Достижения', CANVAS_WIDTH/2, 40);
  ctx.font='14px "Courier New"'; ctx.fillStyle='#a5d6a7';
  ctx.fillText(`Открыто: ${unlockedAchievements.length} / ${ACHIEVEMENTS.length}`, CANVAS_WIDTH/2, 65);
  const startY = 85;
  const lineH = 28;
  const colW = CANVAS_WIDTH - 100;
  const maxVisible = Math.floor((CANVAS_HEIGHT - startY - 90) / lineH);
  for(let i=0;i<Math.min(ACHIEVEMENTS.length, maxVisible);i++){
    const a = ACHIEVEMENTS[i];
    const unlocked = unlockedAchievements.includes(a.id);
    const y = startY + i * lineH;
    ctx.fillStyle = unlocked ? '#1e3a1e' : '#222';
    ctx.fillRect(50, y, colW, 24);
    ctx.strokeStyle = unlocked ? '#4caf50' : '#444';
    ctx.strokeRect(50, y, colW, 24);
    ctx.font='bold 12px "Courier New"'; ctx.textAlign='left';
    ctx.fillStyle = unlocked ? '#4caf50' : '#888';
    ctx.fillText(unlocked ? '✅' : '🔒', 60, y + 17);
    ctx.fillStyle = unlocked ? '#fff' : '#999';
    ctx.fillText(a.name, 85, y + 16);
    ctx.textAlign='right'; ctx.fillStyle = unlocked ? '#4caf50' : '#666';
    ctx.font='bold 11px "Courier New"';
    ctx.fillText(`+${a.reward}💰`, 50 + colW - 15, y + 16);
  }
  drawButton(CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT - 55, 200, 42, '✖ Закрыть (K)', '#888');
  canvas.achievementsCloseButton = { x:CANVAS_WIDTH/2 - 100, y:CANVAS_HEIGHT - 55, w:200, h:42 };
}

// ===================== МЕНЮ =====================
function drawMenu(){
  ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  ctx.fillStyle='#fff'; ctx.font='bold 36px "Courier New"'; ctx.textAlign='center';
  ctx.fillText("Miner's Quest", CANVAS_WIDTH/2, 50);
  ctx.font='14px "Courier New"'; ctx.fillStyle='#a5d6a7';
  ctx.fillText('Этап 6: PvP Арена и Рейтинг', CANVAS_WIDTH/2, 75);
  const rank = getRank(pvp.rating);
  ctx.font='13px "Courier New"'; ctx.fillStyle=rank.color;
  ctx.fillText(`${rank.name} — ${pvp.rating} рейтинга`, CANVAS_WIDTH/2, 100);
  const btnW=220, btnH=36, startY=120, gap=42;
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY, btnW, btnH, '▶ Играть', '#4caf50');
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY + gap, btnW, btnH, '⚔️ PvP Арена', '#f44336');
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY + gap*2, btnW, btnH, '🛒 Магазин', gameWasStarted ? '#2196f3' : '#555', gameWasStarted);
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY + gap*3, btnW, btnH, '❓ Как играть', '#ff9800');
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY + gap*4, btnW, btnH, `🎵 Музыка: ${musicEnabled?'ВКЛ':'ВЫКЛ'}`, '#9c27b0');
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY + gap*5, btnW, btnH, '🔄 Сбросить', '#888');
  canvas.menuButtons = [
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY, w:btnW, h:btnH, action:'play' },
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY+gap, w:btnW, h:btnH, action:'pvp' },
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY+gap*2, w:btnW, h:btnH, action:'shop', active:gameWasStarted },
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY+gap*3, w:btnW, h:btnH, action:'howto' },
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY+gap*4, w:btnW, h:btnH, action:'music' },
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY+gap*5, w:btnW, h:btnH, action:'reset' }
  ];
}
function drawHowToPlay(){
  ctx.fillStyle='rgba(0,0,0,0.92)'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  ctx.fillStyle='#fff'; ctx.font='bold 22px "Courier New"'; ctx.textAlign='center';
  ctx.fillText('Как играть', CANVAS_WIDTH/2, 25);
  ctx.font='11px "Courier New"'; ctx.textAlign='left';
  const lines = isMobile ? [
    '📱 Управление:',
    '   Джойстик | ⛏ добыча | ⚔️ атака',
    '   🍗 мясо | 🎒 инвентарь | 🛒 магазин | ☰ пауза',
    '',
    '⚔️ 6 видов оружия (магазин)',
    '📦 Ресурсы: камень, дерево, золото, алмаз',
    '🌍 Биомы: лес → пустыня → снега (4 ур.)',
    '👹 Босс на каждом 5-м уровне',
    '🐾 Питомцы, 🏆 Достижения, 🍽️ Голод',
    '',
    '⚔️ ЭТАП 6 — PvP Арена:',
    '   Выбирай противника по сложности',
    '   Сражайся 1 на 1, получай рейтинг',
    '   Ранги: Новичок → Бронза → Серебро →',
    '          Золото → Платина → Легенда'
  ] : [
    '🎮 Управление:',
    '   WASD/стрелки — движение | E — добыть',
    '   Q — атака | F — мясо | I — инвентарь',
    '   K — достижения | M — магазин | Esc — пауза',
    '',
    '⚔️ 6 видов оружия: Кулаки → Дубина → Меч → Копьё → Топор → Лук',
    '📦 Ресурсы: камень, дерево, золото, алмаз',
    '🌍 Биомы: лес → пустыня → снега (каждые 4 ур.)',
    '👹 Босс на каждом 5-м уровне',
    '🐾 Питомцы: 🐕 Собака, 🦜 Попугай',
    '🏆 Достижения — каждое даёт монеты',
    '🍽️ Голод — ешь мясо, иначе медленнее',
    '',
    '⚔️ ЭТАП 6 — PvP Арена (P):',
    '   Выбирай противника по сложности',
    '   Сражайся 1 на 1, получай рейтинг и монеты',
    '   Побеждай 3 подряд — бонус!',
    '   Ранги: Новичок → Бронза → Серебро →',
    '          Золото → Платина → Легенда'
  ];
  for(let i=0;i<lines.length;i++){
    ctx.fillText(lines[i], 40, 48 + i*18);
  }
  const btnW=200, btnH=40;
  drawButton(CANVAS_WIDTH/2 - btnW/2, CANVAS_HEIGHT - 45, btnW, btnH, '← Назад', '#888');
  canvas.howtoButtons = [{ x:CANVAS_WIDTH/2 - btnW/2, y:CANVAS_HEIGHT - 45, w:btnW, h:btnH, action:'back' }];
}
function drawPauseMenu(){
  ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  ctx.fillStyle='#fff'; ctx.font='bold 34px "Courier New"'; ctx.textAlign='center';
  ctx.fillText('Пауза', CANVAS_WIDTH/2, 150);
  const btnW=220, btnH=42, startY=200, gap=50;
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY, btnW, btnH, '▶ Продолжить', '#4caf50');
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY+gap, btnW, btnH, '🛒 Магазин', '#2196f3');
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY+gap*2, btnW, btnH, '🏆 Достижения', '#ffd700');
  drawButton(CANVAS_WIDTH/2 - btnW/2, startY+gap*3, btnW, btnH, '🏠 Главное меню', '#f44336');
  canvas.pauseButtons = [
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY, w:btnW, h:btnH, action:'resume' },
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY+gap, w:btnW, h:btnH, action:'shop' },
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY+gap*2, w:btnW, h:btnH, action:'achievements' },
    { x:CANVAS_WIDTH/2 - btnW/2, y:startY+gap*3, w:btnW, h:btnH, action:'menu' }
  ];
}

// ===================== МАГАЗИН =====================
function drawShopOverlay(){
  ctx.fillStyle='rgba(0,0,0,0.93)'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  ctx.fillStyle='#fff'; ctx.font='bold 22px "Courier New"'; ctx.textAlign='center';
  ctx.fillText('Магазин', CANVAS_WIDTH/2, 28);
  ctx.font='14px "Courier New"';
  ctx.fillText(`Баланс: ${balance}`, CANVAS_WIDTH/2, 48);
  const tabY = 62, tabW = 85, tabH = 24;
  const tabs = ['Улучш.','Инстр.','Оружие','Скины','Питомцы','Укр.','Крафт','Продажа'];
  if(canvas.shopTab === undefined) canvas.shopTab = 0;
  canvas.shopTabButtons = [];
  const tabStartX = (CANVAS_WIDTH - tabs.length * (tabW + 5)) / 2;
  for(let i=0;i<tabs.length;i++){
    const tx = tabStartX + i * (tabW + 5);
    drawButton(tx, tabY, tabW, tabH, tabs[i], i === canvas.shopTab ? '#4caf50' : '#555', true, 10);
    canvas.shopTabButtons.push({ x:tx, y:tabY, w:tabW, h:tabH, action:'tab', index:i });
  }
  const contentY = 96;
  canvas.shopItems = [];
  if(canvas.shopTab === 0) drawUpgradesTab(contentY);
  else if(canvas.shopTab === 1) drawToolsTab(contentY);
  else if(canvas.shopTab === 2) drawWeaponsTab(contentY);
  else if(canvas.shopTab === 3) drawSkinsTab(contentY);
  else if(canvas.shopTab === 4) drawPetsTab(contentY);
  else if(canvas.shopTab === 5) drawAccessoriesTab(contentY);
  else if(canvas.shopTab === 6) drawCraftTab(contentY);
  else if(canvas.shopTab === 7) drawSellTab(contentY);
  drawButton(CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT - 42, 200, 36, '✖ ЗАКРЫТЬ (M/Esc)', '#f44336', true, 13);
  canvas.shopCloseButton = { x:CANVAS_WIDTH/2 - 100, y:CANVAS_HEIGHT - 42, w:200, h:36 };
}
function drawShopItem(y,label,cost,action,active,highlight=false){
  const x = CANVAS_WIDTH/2 - 180;
  ctx.fillStyle = active ? '#333' : '#555';
  if(highlight) ctx.fillStyle = '#2e7d32';
  ctx.fillRect(x,y,360,32);
  ctx.fillStyle='#fff'; ctx.font='12px "Courier New"'; ctx.textAlign='center';
  ctx.fillText(`${label} (${cost})`, CANVAS_WIDTH/2, y+21);
}
function drawUpgradesTab(yStart){
  const lineH = 46;
  drawShopItem(yStart, '⚡ Улучшить скорость', `${PRICE_SPEED}`, 'buy_speed', balance>=PRICE_SPEED);
  drawShopItem(yStart+lineH, '⛏ Ускорение добычи', upgrades.mining>=MAX_MINING ? 'Макс.' : `${PRICE_MINING}`, 'buy_mining', balance>=PRICE_MINING && upgrades.mining<MAX_MINING);
  drawShopItem(yStart+lineH*2, '💎 Бонус к деньгам', upgrades.bonus ? 'Куплено' : `${PRICE_BONUS}`, 'buy_bonus', balance>=PRICE_BONUS && !upgrades.bonus);
  canvas.shopItems = [
    { x:CANVAS_WIDTH/2 - 180, y:yStart, w:360, h:34, action:'buy_speed' },
    { x:CANVAS_WIDTH/2 - 180, y:yStart+lineH, w:360, h:34, action:'buy_mining' },
    { x:CANVAS_WIDTH/2 - 180, y:yStart+lineH*2, w:360, h:34, action:'buy_bonus' }
  ];
}
function drawToolsTab(yStart){
  const lineH = 42;
  const tools = [
    { id:'stone',   name:'🪨 Кирка (камень)',        price:PRICE_TOOL_STONE,   level:1 },
    { id:'gold',    name:'⛏ Золотая кирка (золото)',  price:PRICE_TOOL_GOLD,    level:1 },
    { id:'diamond', name:'💎 Алмазный бур (алмаз)',   price:PRICE_TOOL_DIAMOND, level:3 }
  ];
  let y = yStart;
  for(let t of tools){
    const owned = upgrades.tools[t.id];
    const levelOk = currentLevel >= t.level;
    const canBuy = !owned && levelOk && balance >= t.price;
    const costText = owned ? '✅ Есть' : (levelOk ? `${t.price}` : `Ур. ${t.level}`);
    drawShopItem(y, t.name, costText, 'buy_tool_'+t.id, canBuy);
    canvas.shopItems.push({ x:CANVAS_WIDTH/2 - 180, y, w:360, h:34, action:'buy_tool_'+t.id });
    y += lineH;
  }
}
function drawWeaponsTab(yStart){
  const lineH = 38;
  let y = yStart;
  for(let w of WEAPONS){
    const owned = ownedWeapons.includes(w.id);
    const levelOk = currentLevel >= w.level;
    const canBuy = !owned && levelOk && balance >= w.cost;
    const costText = owned ? (equippedWeapon === w.id ? '✅ Надето' : '✔ Куплено') : (levelOk ? `${w.cost}` : `Ур. ${w.level}`);
    drawShopItem(y, `${w.icon} ${w.name} (урон ${w.damage})`, costText, 'buy_weapon_'+w.id, canBuy || owned, equippedWeapon === w.id);
    canvas.shopItems.push({ x:CANVAS_WIDTH/2 - 180, y, w:360, h:34, action:'buy_weapon_'+w.id });
    y += lineH;
  }
}
function drawSkinsTab(yStart){
  const lineH = 40;
  let y = yStart;
  for(let s of SKINS){
    const owned = ownedSkins.includes(s.id);
    const levelOk = currentLevel >= s.level;
    const canBuy = !owned && levelOk && balance >= s.cost;
    const text = owned ? 'Надет' : (levelOk ? `${s.cost}` : `Ур. ${s.level}`);
    drawShopItem(y, s.name, text, 'buy_skin_'+s.id, canBuy || owned, equippedSkin === s.id);
    canvas.shopItems.push({ x:CANVAS_WIDTH/2 - 180, y, w:360, h:34, action:'buy_skin_'+s.id });
    y += lineH;
  }
}
function drawPetsTab(yStart){
  const lineH = 50;
  let y = yStart;
  ctx.fillStyle='#fff'; ctx.font='13px "Courier New"'; ctx.textAlign='center';
  ctx.fillText('🐾 Питомцы бегают за тобой и помогают', CANVAS_WIDTH/2, y);
  y += 25;
  for(let p of PETS){
    const owned = ownedPets.includes(p.id);
    const levelOk = currentLevel >= p.level;
    const canBuy = !owned && levelOk && balance >= p.cost;
    const text = owned ? (activePet===p.id ? '✅ Активен' : '✔ Надеть') : (levelOk ? `${p.cost}` : `Ур. ${p.level}`);
    drawShopItem(y, `${p.name} — ${p.desc}`, text, 'buy_pet_'+p.id, canBuy || owned, activePet === p.id);
    canvas.shopItems.push({ x:CANVAS_WIDTH/2 - 180, y, w:360, h:34, action:'buy_pet_'+p.id });
    y += lineH;
  }
}
function drawAccessoriesTab(yStart){
  const lineH = 42;
  let y = yStart;
  for(let a of ACCESSORIES){
    const owned = ownedAccessories.includes(a.id);
    const levelOk = currentLevel >= a.level;
    const canBuy = !owned && levelOk && balance >= a.cost;
    const text = owned ? (equippedAccessory===a.id ? '✅ Надето' : '✔ Надеть') : (levelOk ? `${a.cost}` : `Ур. ${a.level}`);
    drawShopItem(y, a.name, text, 'buy_acc_'+a.id, canBuy || owned, equippedAccessory === a.id);
    canvas.shopItems.push({ x:CANVAS_WIDTH/2 - 180, y, w:360, h:34, action:'buy_acc_'+a.id });
    y += lineH;
  }
}
function drawCraftTab(yStart){
  const lineH = 38;
  let y = yStart;
  for(let i=0;i<CRAFT_RECIPES.length;i++){
    const r = CRAFT_RECIPES[i];
    const can = canCraft(r);
    const costStr = Object.entries(r.cost).map(([k,v])=>`${v}${(RESOURCE_TYPES[k]?.name||k).slice(0,3)}`).join(',');
    drawShopItem(y, `${r.name} — ${r.desc.slice(0,24)}`, costStr, 'craft_'+i, can);
    canvas.shopItems.push({ x:CANVAS_WIDTH/2 - 180, y, w:360, h:34, action:'craft_'+i });
    y += lineH;
  }
}
function drawSellTab(yStart){
  const lineH = 34;
  let y = yStart;
  for(let key of ['stone','wood','gold','diamond','meat']){
    const amount = inventory[key];
    const name = RESOURCE_TYPES[key]?.name || (key==='meat'?'Мясо':'?');
    const price = getSellPrice(key);
    drawShopItem(y, `${name} (${amount} шт.)`, `по ${price}${fairActive?' 🔥x2':''}`, 'sell_'+key, amount>0);
    canvas.shopItems.push({ x:CANVAS_WIDTH/2 - 180, y, w:360, h:34, action:'sell_'+key });
    y += lineH;
  }
  if(!fairActive && fairCooldown <= 0){
    drawButton(CANVAS_WIDTH/2 - 100, CANVAS_HEIGHT - 80, 200, 30, '🎪 Запустить Ярмарку!', '#ff9800', true, 12);
    canvas.shopItems.push({ x:CANVAS_WIDTH/2 - 100, y:CANVAS_HEIGHT - 80, w:200, h:30, action:'fair_start' });
  } else if(fairActive){
    ctx.fillStyle='#ffd700'; ctx.font='bold 13px "Courier New"'; ctx.textAlign='center';
    ctx.fillText(`🎪 Активна: ${Math.ceil(fairTimer)}с`, CANVAS_WIDTH/2, CANVAS_HEIGHT - 65);
  } else {
    ctx.fillStyle='#888'; ctx.font='12px "Courier New"'; ctx.textAlign='center';
    ctx.fillText(`🎪 Ярмарка через ${Math.ceil(fairCooldown)}с`, CANVAS_WIDTH/2, CANVAS_HEIGHT - 65);
  }
}

// ===================== ЦИКЛ =====================
function renderPlaying(){
  drawMap();
  drawResources();
  drawAnimals();
  drawWolves();
  drawBosses();
  drawTreasure();
  drawPet();
  drawPlayer();
  drawSlash();
  drawProjectiles();
  drawParticles();
  drawFlyingTexts();
  drawHUD();
  if(playerHurtTimer > 0){
    ctx.fillStyle = `rgba(255,0,0,${playerHurtTimer*0.5})`;
    ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  }
  if(deathBanner > 0){
    ctx.fillStyle = `rgba(0,0,0,${Math.min(0.85, deathBanner)})`;
    ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    ctx.fillStyle='#fff'; ctx.font='bold 52px "Courier New"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('☠️ ВЫ ПОГИБЛИ', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    ctx.font='bold 20px "Courier New"'; ctx.fillStyle='#ff5252';
    ctx.fillText('Потеряно 50% ресурсов и 25% монет', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    ctx.fillStyle='#4caf50'; ctx.font='bold 18px "Courier New"';
    ctx.fillText(`Возрождение через ${Math.ceil(deathBanner)}...`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 55);
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  }
  if(levelTransitionPhase === 'darken' || levelTransitionPhase === 'brighten'){
    ctx.fillStyle = `rgba(0,0,0,${levelTransition})`;
    ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  }
}

// ===================== УПРАВЛЕНИЕ =====================
function triggerAction(){
  if(activeMining) return;
  if(deathBanner > 0 || levelTransitionPhase !== 'none') return;
  if(findNearbyTreasure()) return;
  const res = findNearbyResource();
  if(res){ startMining(res); return; }
  const animal = findNearbyAnimal();
  if(animal) startHunting(animal);
}
function handleKeyDown(e){
  if(gameState === STATE_INVENTORY){
    if(e.code === 'KeyI' || e.code === 'Escape'){ e.preventDefault(); closeInventory(); }
    return;
  }
  if(gameState === STATE_ACHIEVEMENTS){
    if(e.code === 'KeyK' || e.code === 'Escape'){ e.preventDefault(); closeAchievements(); }
    return;
  }
  if(gameState === STATE_SHOP){
    if(e.code === 'KeyM' || e.code === 'Escape'){ e.preventDefault(); closeShop(); }
    return;
  }
  if(gameState === STATE_PVP_ARENA){
    if(e.code === 'Escape'){ e.preventDefault(); exitPvpArena(); }
    else if(e.code === 'KeyQ' || e.code === 'Space'){ e.preventDefault(); pvpPlayerAttack(); }
    else keys[e.code] = true;
    return;
  }
  if(gameState === STATE_PVP_MENU || gameState === STATE_PVP_RESULT){
    if(e.code === 'Escape'){ e.preventDefault(); gameState = STATE_MENU; }
    return;
  }
  if(gameState===STATE_HOWTO){
    if(e.code==='Escape'){ e.preventDefault(); gameState = STATE_MENU; }
    return;
  }
  if(gameState===STATE_MENU) return;
  if(gameState===STATE_PAUSED){
    if(e.code==='Escape'){ e.preventDefault(); resumeGame(); }
    return;
  }
  keys[e.code]=true;
  if((e.code==='KeyE'||e.code==='Space') && gameState===STATE_PLAYING){ e.preventDefault(); triggerAction(); }
  if(e.code==='KeyQ' && gameState===STATE_PLAYING) playerAttack();
  if(e.code==='KeyF' && gameState===STATE_PLAYING) eatMeat();
  if(e.code==='KeyI' && gameState===STATE_PLAYING) openInventory();
  if(e.code==='KeyK' && gameState===STATE_PLAYING) openAchievements();
  if(e.code==='KeyM' && gameState===STATE_PLAYING) openShop();
  if(e.code==='KeyP' && gameState===STATE_PLAYING) openPvpMenu();
  if(e.code==='Escape' && gameState===STATE_PLAYING) pauseGame();
}
function handleKeyUp(e){ keys[e.code]=false; }

function handleClick(e){
  const {x,y} = getCanvasCoords(e);
  if(gameState===STATE_HOWTO){
    if(canvas.howtoButtons){
      for(let b of canvas.howtoButtons){
        if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ gameState = STATE_MENU; canvas.howtoButtons = null; return; }
      }
    }
    return;
  }
  if(gameState===STATE_SHOP && canvas.shopCloseButton){
    const b = canvas.shopCloseButton;
    if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ closeShop(); return; }
  }
  if(gameState===STATE_INVENTORY && canvas.inventoryCloseButton){
    const b = canvas.inventoryCloseButton;
    if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ closeInventory(); return; }
  }
  if(gameState===STATE_ACHIEVEMENTS && canvas.achievementsCloseButton){
    const b = canvas.achievementsCloseButton;
    if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ closeAchievements(); return; }
  }
  if(gameState===STATE_PVP_MENU){
    if(canvas.pvpBackButton){
      const b = canvas.pvpBackButton;
      if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ gameState = STATE_MENU; return; }
    }
    if(canvas.pvpButtons){
      for(let b of canvas.pvpButtons){
        if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ startPvpBattle(b.oppId); return; }
      }
    }
    return;
  }
  if(gameState===STATE_PVP_RESULT){
    if(canvas.pvpResultButtons){
      for(let b of canvas.pvpResultButtons){
        if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){
          if(b.action==='again'){
            if(pvpResult && pvpResult.opp) startPvpBattle(pvpResult.opp.id);
            else openPvpMenu();
          }
          else if(b.action==='back') openPvpMenu();
          return;
        }
      }
    }
    return;
  }
  if(gameState===STATE_PLAYING && canvas.menuButtonRect){
    const b = canvas.menuButtonRect;
    if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ pauseGame(); return; }
  }
  if(gameState===STATE_MENU && canvas.menuButtons){
    for(let b of canvas.menuButtons){
      if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){
        if(b.action==='play') startGame();
        else if(b.action==='pvp') openPvpMenu();
        else if(b.action==='shop' && b.active) openShop();
        else if(b.action==='howto') gameState = STATE_HOWTO;
        else if(b.action==='music') toggleMusic();
        else if(b.action==='reset') resetProgress();
        return;
      }
    }
  }
  else if(gameState===STATE_PAUSED && canvas.pauseButtons){
    for(let b of canvas.pauseButtons){
      if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){
        if(b.action==='resume') resumeGame();
        else if(b.action==='shop') openShop();
        else if(b.action==='achievements') openAchievements();
        else if(b.action==='menu') goToMainMenu();
        return;
      }
    }
  }
  else if(gameState===STATE_SHOP){
    if(canvas.shopTabButtons){
      for(let b of canvas.shopTabButtons){
        if(x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h){ canvas.shopTab = b.index; return; }
      }
    }
    if(canvas.shopItems){
      for(let item of canvas.shopItems){
        if(x>=item.x && x<=item.x+item.w && y>=item.y && y<=item.y+item.h){
          handleShopAction(item.action); return;
        }
      }
    }
  }
  if(!audioCtx){
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
  }
}

function handleShopAction(action){
  if(action==='buy_speed') buyUpgrade('speed');
  else if(action==='buy_mining') buyUpgrade('mining');
  else if(action==='buy_bonus') buyUpgrade('bonus');
  else if(action.startsWith('buy_tool_')) buyTool(action.substring(9));
  else if(action.startsWith('buy_weapon_')) buyWeapon(action.substring(11));
  else if(action.startsWith('buy_skin_')) buySkin(action.substring(9));
  else if(action.startsWith('buy_pet_')) buyPet(action.substring(8));
  else if(action.startsWith('buy_acc_')) buyAccessory(action.substring(8));
  else if(action.startsWith('craft_')){
    const i = parseInt(action.split('_')[1]);
    if(i>=0 && i<CRAFT_RECIPES.length && canCraft(CRAFT_RECIPES[i])) craft(CRAFT_RECIPES[i]);
  } else if(action.startsWith('sell_')) sellResource(action.substring(5));
  else if(action==='fair_start'){
    if(!fairActive && fairCooldown <= 0){
      fairActive = true;
      fairTimer = FAIR_DURATION;
      fairCooldown = FAIR_COOLDOWN;
      flyingTexts.push({text:'🎪 ЯРМАРКА! Цены x2!',x:player.x,y:player.y-40,life:2.5,color:'#ffd700'});
      playLevelUpSound();
    }
  }
}
function buyUpgrade(type){
  if(type==='speed' && balance>=PRICE_SPEED){ balance-=PRICE_SPEED; upgrades.speed++; saveGame(); }
  else if(type==='mining' && upgrades.mining<MAX_MINING && balance>=PRICE_MINING){ balance-=PRICE_MINING; upgrades.mining++; saveGame(); }
  else if(type==='bonus' && !upgrades.bonus && balance>=PRICE_BONUS){ balance-=PRICE_BONUS; upgrades.bonus=true; saveGame(); }
}
function buyTool(tool){
  const prices = { stone:PRICE_TOOL_STONE, gold:PRICE_TOOL_GOLD, diamond:PRICE_TOOL_DIAMOND };
  const levels = { stone:1, gold:1, diamond:3 };
  if(!upgrades.tools[tool] && balance >= prices[tool] && currentLevel >= levels[tool]){
    balance -= prices[tool];
    upgrades.tools[tool] = true;
    saveGame();
  }
}
function buyWeapon(id){
  const w = WEAPONS.find(x=>x.id===id);
  if(!w) return;
  if(ownedWeapons.includes(id)){ equippedWeapon = id; saveGame(); return; }
  if(balance >= w.cost && currentLevel >= w.level){
    balance -= w.cost;
    ownedWeapons.push(id);
    equippedWeapon = id;
    saveGame();
  }
}
function buySkin(id){
  const skin = SKINS.find(s=>s.id===id);
  if(!skin || ownedSkins.includes(id)) return;
  if(balance>=skin.cost && currentLevel>=skin.level){
    balance -= skin.cost;
    ownedSkins.push(id);
    equippedSkin = id;
    saveGame();
  }
}
function buyPet(id){
  const p = PETS.find(x=>x.id===id);
  if(!p) return;
  if(ownedPets.includes(id)){ activePet = id; petTimer = 1; saveGame(); return; }
  if(balance >= p.cost && currentLevel >= p.level){
    balance -= p.cost;
    ownedPets.push(id);
    activePet = id;
    petTimer = 1;
    saveGame();
  }
}
function buyAccessory(id){
  const a = ACCESSORIES.find(x=>x.id===id);
  if(!a) return;
  if(ownedAccessories.includes(id)){
    equippedAccessory = (equippedAccessory === id) ? null : id;
    saveGame();
    return;
  }
  if(balance >= a.cost && currentLevel >= a.level){
    balance -= a.cost;
    ownedAccessories.push(id);
    equippedAccessory = id;
    saveGame();
  }
}
function sellResource(type){
  if(inventory[type] > 0){
    const total = inventory[type] * getSellPrice(type);
    balance += total;
    updateDailyQuest('sell', total);
    inventory[type] = 0;
    saveGame();
    checkLevelUp();
  }
}

// ===================== МУЗЫКА =====================
const melodyNotes = [262, 294, 330, 349, 392, 440, 494, 523];
let musicNoteIndex = 0;
function startMusic(){
  if(!audioCtx) return;
  if(musicInterval) clearInterval(musicInterval);
  musicNoteIndex = 0;
  musicInterval = setInterval(() => {
    if(!musicEnabled || !audioCtx) return;
    if(gameState === STATE_MENU || gameState === STATE_PLAYING || gameState === STATE_PVP_MENU) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = melodyNotes[musicNoteIndex % melodyNotes.length];
      g.gain.setValueAtTime(0.02, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + 0.3);
      musicNoteIndex++;
    }
  }, 500);
}
function stopMusic(){ if(musicInterval){ clearInterval(musicInterval); musicInterval = null; } }
function toggleMusic(){ musicEnabled = !musicEnabled; if(musicEnabled) startMusic(); else stopMusic(); saveGame(); }

// ===================== СОСТОЯНИЯ =====================
function startGame(){
  currentLevel = 1;
  targetMoney = getTargetForLevel(1);
  balance = 0;
  playerHealth = MAX_HEALTH;
  playerHunger = MAX_HUNGER;
  generateMap(1);
  generateResources(1);
  generateAnimals(1);
  generateWolves(1);
  generateBoss(1);
  player.x = CANVAS_WIDTH/2; player.y = CANVAS_HEIGHT/2;
  player.slideVX = 0; player.slideVY = 0;
  activeMining = null; flyingTexts = []; particles = []; projectiles = []; slashEffects = [];
  deathBanner = 0; levelTransition = 0; levelTransitionPhase = 'none';
  comboCount = 0; comboTimer = 0;
  fairActive = false; fairTimer = 0; fairCooldown = 0;
  treasure = null;
  gameState = STATE_PLAYING;
  gameWasStarted = true;
  loadGame();
  generateTreasure(currentLevel);
  generateDailyQuest();
  if(isMobile) showMobileControls(true);
  else showMobileControls(false);
  if(!audioCtx){ try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
  if(musicEnabled) startMusic();
}
function pauseGame(){ gameState = STATE_PAUSED; if(isMobile) showMobileControls(false); }
function resumeGame(){ gameState = STATE_PLAYING; if(isMobile) showMobileControls(true); }
function openShop(){
  if(!gameWasStarted && gameState===STATE_MENU) return;
  canvas.preShopState = gameState;
  gameState = STATE_SHOP;
  canvas.shopTab = 0;
  if(isMobile) showMobileControls(false);
}
function closeShop(){ gameState = STATE_PLAYING; if(isMobile) showMobileControls(true); }
function goToMainMenu(){ gameState = STATE_MENU; activeMining = null; saveGame(); if(isMobile) showMobileControls(false); }
function resetProgress(){
  if(confirm('Сбросить весь прогресс?')){
    localStorage.removeItem('minersQuest_save');
    localStorage.removeItem('minersQuest_daily');
    inventory = {stone:0,wood:0,gold:0,diamond:0,meat:0};
    balance = 0;
    upgrades = {speed:0,mining:0,bonus:false,tools:{stone:false,gold:false,diamond:false}};
    ownedSkins=['default']; equippedSkin='default';
    ownedAccessories=[]; equippedAccessory=null;
    ownedWeapons=['fists']; equippedWeapon='fists';
    ownedPets=[]; activePet=null;
    unlockedAchievements=[];
    stats = {mined:0,chickens:0,wolves:0,bosses:0,deaths:0,meatEaten:0};
    dailyQuest = null;
    pvp = {wins:0,losses:0,rating:0,winStreak:0,bestStreak:0,lastOpponent:null,battles:[]};
    gameWasStarted=false; currentLevel=1; targetMoney=getTargetForLevel(1);
    miningBoostActive=false; goldPickaxeActive=false;
    playerMaxHealth = MAX_HEALTH;
  }
}
function saveGame(){
  try {
    localStorage.setItem('minersQuest_save', JSON.stringify({
      balance, upgrades, inventory, currentLevel, targetMoney, gameWasStarted,
      ownedSkins, equippedSkin, ownedAccessories, equippedAccessory,
      ownedWeapons, equippedWeapon, ownedPets, activePet,
      miningBoostActive, goldPickaxeActive,
      unlockedAchievements, stats, musicEnabled, pvp
    }));
  } catch(e){}
}
function loadGame(){
  const s = localStorage.getItem('minersQuest_save');
  if(s){
    try {
      const d = JSON.parse(s);
      balance = d.balance || 0;
      upgrades = d.upgrades || {speed:0,mining:0,bonus:false,tools:{stone:false,gold:false,diamond:false}};
      if(!upgrades.tools) upgrades.tools = {stone:false,gold:false,diamond:false};
      inventory = d.inventory || {stone:0,wood:0,gold:0,diamond:0,meat:0};
      currentLevel = d.currentLevel || 1;
      targetMoney = getTargetForLevel(currentLevel);
      gameWasStarted = d.gameWasStarted || false;
      ownedSkins = d.ownedSkins || ['default'];
      equippedSkin = d.equippedSkin || 'default';
      ownedAccessories = d.ownedAccessories || [];
      equippedAccessory = d.equippedAccessory || null;
      ownedWeapons = d.ownedWeapons || ['fists'];
      equippedWeapon = d.equippedWeapon || 'fists';
      ownedPets = d.ownedPets || [];
      activePet = d.activePet || null;
      miningBoostActive = d.miningBoostActive || false;
      goldPickaxeActive = d.goldPickaxeActive || false;
      unlockedAchievements = d.unlockedAchievements || [];
      stats = d.stats || {mined:0,chickens:0,wolves:0,bosses:0,deaths:0,meatEaten:0};
      musicEnabled = d.musicEnabled !== undefined ? d.musicEnabled : true;
      pvp = d.pvp || {wins:0,losses:0,rating:0,winStreak:0,bestStreak:0,lastOpponent:null,battles:[]};
    } catch(e){}
  }
}

// ===================== ЗВУКИ =====================
function playCollectSound(type){
  if(!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type='triangle';
  let f = 600;
  if(type==='wood') f=500;
  else if(type==='gold') f=800;
  else if(type==='diamond') f=1000;
  else if(type==='meat') f=400;
  o.frequency.setValueAtTime(f, now);
  o.frequency.exponentialRampToValueAtTime(f*1.5, now+0.1);
  g.gain.setValueAtTime(0.3, now);
  g.gain.exponentialRampToValueAtTime(0.01, now+0.2);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now+0.2);
}
function playLevelUpSound(){
  if(!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  for(let i=0;i<3;i++){
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type='sine'; o.frequency.value = 400 + i*150;
    g.gain.setValueAtTime(0.2, now+i*0.1);
    g.gain.exponentialRampToValueAtTime(0.01, now+i*0.1+0.2);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now+i*0.1); o.stop(now+i*0.1+0.2);
  }
}
function playHurtSound(){
  if(!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type='sawtooth';
  o.frequency.setValueAtTime(200, now);
  o.frequency.exponentialRampToValueAtTime(80, now+0.2);
  g.gain.setValueAtTime(0.3, now);
  g.gain.exponentialRampToValueAtTime(0.01, now+0.25);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now+0.25);
}
function playHitSound(){
  if(!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type='square';
  o.frequency.setValueAtTime(400, now);
  o.frequency.exponentialRampToValueAtTime(150, now+0.1);
  g.gain.setValueAtTime(0.25, now);
  g.gain.exponentialRampToValueAtTime(0.01, now+0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now+0.15);
}
function playDeathSound(){
  if(!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  for(let i=0;i<3;i++){
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type='sawtooth';
    o.frequency.setValueAtTime(300-i*60, now+i*0.15);
    o.frequency.exponentialRampToValueAtTime(50, now+i*0.15+0.3);
    g.gain.setValueAtTime(0.25, now+i*0.15);
    g.gain.exponentialRampToValueAtTime(0.01, now+i*0.15+0.3);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now+i*0.15); o.stop(now+i*0.15+0.3);
  }
}
function playHealSound(){
  if(!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type='sine';
  o.frequency.setValueAtTime(500, now);
  o.frequency.exponentialRampToValueAtTime(900, now+0.15);
  g.gain.setValueAtTime(0.2, now);
  g.gain.exponentialRampToValueAtTime(0.01, now+0.25);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now+0.25);
}

// ===================== ГЛАВНЫЙ ЦИКЛ =====================
let lastTime = performance.now();
function gameLoop(ts){
  const dt = Math.min(0.1, (ts - lastTime) / 1000);
  lastTime = ts;
  if(gameState===STATE_PLAYING) updatePlaying(dt);
  else if(gameState===STATE_PVP_ARENA) updatePvpArena(dt);
  ctx.fillStyle='#2d2d2d';
  ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  if(gameState===STATE_MENU) drawMenu();
  else if(gameState===STATE_HOWTO) drawHowToPlay();
  else if(gameState===STATE_PLAYING) renderPlaying();
  else if(gameState===STATE_PAUSED){ renderPlaying(); drawPauseMenu(); }
  else if(gameState===STATE_SHOP){ if(canvas.preShopState===STATE_PLAYING) renderPlaying(); drawShopOverlay(); }
  else if(gameState===STATE_INVENTORY){ renderPlaying(); drawInventory(); }
  else if(gameState===STATE_ACHIEVEMENTS){ renderPlaying(); drawAchievements(); }
  else if(gameState===STATE_PVP_MENU) drawPvpMenu();
  else if(gameState===STATE_PVP_ARENA) drawPvpArena();
  else if(gameState===STATE_PVP_RESULT) drawPvpResult();
  requestAnimationFrame(gameLoop);
}

// ===================== ИНИЦИАЛИЗАЦИЯ =====================
function resizeCanvas(){
  const maxW = window.innerWidth, maxH = window.innerHeight;
  const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
  let w, h;
  if(maxW/maxH > aspect){ h = maxH; w = h*aspect; }
  else { w = maxW; h = w/aspect; }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
let lastClickTime = 0;
function handleClickWrapper(e){
  const now = performance.now();
  if(now - lastClickTime < 150) return;
  lastClickTime = now;
  handleClick(e);
}
canvas.addEventListener('click', handleClickWrapper);
canvas.addEventListener('touchstart', e => {
  if(e.target === canvas){ e.preventDefault(); handleClickWrapper(e); }
}, {passive:false});
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('resize', () => { resizeCanvas(); if(isMobile) positionMobileControls(); });
window.addEventListener('orientationchange', () => { setTimeout(() => { resizeCanvas(); if(isMobile) positionMobileControls(); }, 200); });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

loadGame();
generateDailyQuest();
resizeCanvas();
showMobileControls(false);
if(isMobile) positionMobileControls();
requestAnimationFrame(gameLoop);
