'use strict';

/* ══════════════════════════════════════════════════════════════════════
   1. GameEventBus — simple EventEmitter shared across all agents
   ══════════════════════════════════════════════════════════════════════ */
window.GameEventBus = (function() {
  const listeners = {};
  return {
    on(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    off(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
      if (!listeners[event]) return;
      listeners[event].forEach(fn => { try { fn(data); } catch(e) { console.error('[GameEventBus]', event, e); } });
    }
  };
})();

/* ══════════════════════════════════════════════════════════════════════
   2. GameState — canonical world state, read/write by all agents
   ══════════════════════════════════════════════════════════════════════ */
window.GameState = {
  player: {
    name: 'Aethos',
    originId: 'wandering_monk',
    level: 1,
    xp: 0,
    xpToNext: 100,
    stats: { str: 12, dex: 10, vit: 14, int: 8, wis: 10, luk: 6 },
    currentHP: 140,
    maxHP: 140,
    currentSoul: 80,
    maxSoul: 80,
    skills: [],          // populated below
    prestigeCount: 0,
    activeMartialBook: null,
    activeSoulBook: null,
    activeCore: null,
    learnedBooks: [],
    ownedCores: [],
    inventory: [],
    soulForgedGear: [],
  },
  currentArea: 'ashen_hollow',
  monstersAlive: [],
  sessionLoot: [],
  questProgress: {},
  prestigeReady: false,
};

/* ══════════════════════════════════════════════════════════════════════
   3. HOOK stubs — Agent 2 (GameData / LootEngine) & Agent 4 (WorldData)
   ══════════════════════════════════════════════════════════════════════ */

// HOOK: Agent 2 — GameData (stat tables, book definitions, core definitions)
window.GameData = window.GameData || {
  getStatBonuses: (originId) => ({ str:0, dex:0, vit:0, int:0, wis:0, luk:0 }),
  calcMaxHP: (vit, level) => 80 + vit * 4 + level * 5,
  calcMaxSoul: (wis, level) => 40 + wis * 4 + level * 3,
};

// HOOK: Agent 2 — LootEngine (generates loot on monster death)
window.LootEngine = window.LootEngine || {
  rollDrop: (monster) => null,   // returns GearItem | null
};

// HOOK: Agent 4 — WorldData (area definitions, spawn tables, boss encounters)
window.WorldData = window.WorldData || {
  areas: {
    ashen_hollow: {
      id: 'ashen_hollow',
      name: 'The Ashen Hollow',
      width: 2400,
      height: 2400,
      tileVariant: 'dungeon',
      exits: [{ x: 2340, y: 1200, targetAreaId: 'ember_wastes' }],
      spawns: [
        { x: 400,  y: 300,  type: 'fallen_shade',   count: 2 },
        { x: 800,  y: 600,  type: 'bone_hound',     count: 2 },
        { x: 1200, y: 400,  type: 'corrupted_wisp', count: 1 },
        { x: 600,  y: 1200, type: 'fallen_shade',   count: 2 },
        { x: 1500, y: 900,  type: 'bone_hound',     count: 1 },
      ],
    },
    ember_wastes: {
      id: 'ember_wastes',
      name: 'Ember Wastes',
      width: 2400,
      height: 2400,
      tileVariant: 'wasteland',
      exits: [{ x: 60, y: 1200, targetAreaId: 'ashen_hollow' }],
      spawns: [
        { x: 600,  y: 600,  type: 'ash_crawler',    count: 3 },
        { x: 1000, y: 400,  type: 'ember_wraith',   count: 2 },
        { x: 1400, y: 800,  type: 'ash_crawler',    count: 2 },
      ],
    },
  },
  monsterTemplates: {
    fallen_shade:   { name:'Fallen Shade',   maxHP:60,  stats:{str:8,dex:7,vit:5,int:3,wis:2,luk:2},  speed:60, aggroRange:150, attackRange:36, attackSpeed:1.2, damage:8,  xpReward:18, color:0x5a3080 },
    bone_hound:     { name:'Bone Hound',     maxHP:80,  stats:{str:12,dex:9,vit:7,int:2,wis:2,luk:3}, speed:80, aggroRange:180, attackRange:40, attackSpeed:1.5, damage:12, xpReward:25, color:0x9a8a60 },
    corrupted_wisp: { name:'Corrupted Wisp', maxHP:40,  stats:{str:3,dex:12,vit:3,int:15,wis:8,luk:5},speed:100,aggroRange:200, attackRange:180,attackSpeed:2.0, damage:16, xpReward:30, color:0x20a0c0 },
    ash_crawler:    { name:'Ash Crawler',    maxHP:100, stats:{str:14,dex:6,vit:10,int:2,wis:2,luk:2},speed:55, aggroRange:140, attackRange:44, attackSpeed:1.0, damage:15, xpReward:35, color:0x804020 },
    ember_wraith:   { name:'Ember Wraith',   maxHP:70,  stats:{str:5,dex:10,vit:6,int:12,wis:7,luk:6},speed:90, aggroRange:220, attackRange:160,attackSpeed:1.8, damage:20, xpReward:42, color:0xe04030 },
  },
};

/* ══════════════════════════════════════════════════════════════════════
   4. Skill Definitions (3 hardcoded MVP skills)
   ══════════════════════════════════════════════════════════════════════ */
const SKILL_DEFS = {
  basic_strike: {
    id: 'basic_strike', name: 'Iron Strike', type: 'physical',
    icon: '⚔️', slotIndex: 0,
    cooldown: 0.5,   soulCost: 0,
    range: 80,       aoe: false,  aoeRadius: 0,
    baseDamage: 10,  scalingStat: 'str', scalingFactor: 1.4,
    tags: ['melee', 'physical'],
    description: 'A focused strike that channels martial force.',
    passive: false,
  },
  soul_pulse: {
    id: 'soul_pulse', name: 'Soul Pulse', type: 'magical',
    icon: '💠', slotIndex: 1,
    cooldown: 2.0,   soulCost: 20,
    range: 200,      aoe: true,   aoeRadius: 90,
    baseDamage: 18,  scalingStat: 'int', scalingFactor: 1.8,
    tags: ['ranged', 'magical', 'aoe'],
    description: 'Releases condensed soul energy in a ring.',
    passive: false,
  },
  dash: {
    id: 'dash', name: 'Wind Step', type: 'physical',
    icon: '💨', slotIndex: 2,
    cooldown: 4.0,   soulCost: 15,
    range: 0,        aoe: false,  aoeRadius: 0,
    baseDamage: 0,   scalingStat: 'dex', scalingFactor: 0,
    tags: ['movement', 'physical'],
    description: 'A swift burst of movement, evading all harm.',
    passive: false,
    isDash: true,    dashDistance: 160, dashDuration: 0.15,
  },
};

// Assign to GameState player
window.GameState.player.skills = [
  SKILL_DEFS.basic_strike,
  SKILL_DEFS.soul_pulse,
  SKILL_DEFS.dash,
];

/* ══════════════════════════════════════════════════════════════════════
   5. Combat Damage Pipeline
   ══════════════════════════════════════════════════════════════════════ */
function calcSkillDamage(skill, attackerStats) {
  const base = skill.baseDamage;
  const scaledVal = (attackerStats[skill.scalingStat] || 0) * skill.scalingFactor;
  return Math.floor(base + scaledVal);
}

/**
 * applyDamage — full pipeline
 *  incomingDamage
 *   → defense reduction (flat + %)
 *   → core affinity boost
 *   → book bonus
 *   → final damage
 */
function applyDamageToTarget(rawDamage, skill, targetDef, targetCurrentHP, isPlayer = false) {
  const player = window.GameState.player;

  // 1. Defense reduction
  const flatDef   = isPlayer ? (targetDef || 0) : (targetDef || 0);
  const pctDef    = 0;  // HOOK: Agent 2 — gear defense %
  let dmg = Math.max(1, rawDamage - flatDef);
  dmg = Math.floor(dmg * (1 - pctDef));

  // 2. HOOK: Agent 2 — core affinity boost
  // if (player.activeCore && coreMatchesTags(player.activeCore, skill.tags)) dmg *= 1.25;

  // 3. HOOK: Agent 2 — active book bonus
  // if (skill.type === 'physical' && player.activeMartialBook) dmg *= 1.1;
  // if (skill.type === 'magical'  && player.activeSoulBook)    dmg *= 1.15;

  // 4. Critical hit
  const critChance = (player.stats.luk || 6) * 0.5; // 0.5% per luk
  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) dmg = Math.floor(dmg * 1.8);

  return { finalDamage: Math.max(1, dmg), isCrit };
}

/* ══════════════════════════════════════════════════════════════════════
   6. XP & Leveling
   ══════════════════════════════════════════════════════════════════════ */
function xpToNextLevel(level) {
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

function grantXP(amount) {
  const p = window.GameState.player;
  p.xp += amount;
  window.GameEventBus.emit('xp:gained', { amount, total: p.xp, toNext: p.xpToNext });

  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext;
    p.level++;
    p.xpToNext = xpToNextLevel(p.level);

    // Recalculate stats on level up (small flat gains per level)
    p.stats.str += 1;
    p.stats.dex += 1;
    p.stats.vit += 1;
    p.stats.int += 1;
    p.stats.wis += 1;

    // Recalculate HP/Soul pools
    const newMaxHP   = window.GameData.calcMaxHP(p.stats.vit, p.level);
    const newMaxSoul = window.GameData.calcMaxSoul(p.stats.wis, p.level);
    p.currentHP = Math.min(p.currentHP + (newMaxHP - p.maxHP), newMaxHP);
    p.currentSoul = Math.min(p.currentSoul + (newMaxSoul - p.maxSoul), newMaxSoul);
    p.maxHP   = newMaxHP;
    p.maxSoul = newMaxSoul;

    window.GameEventBus.emit('player:levelup', { newLevel: p.level, stats: p.stats });

    // HOOK: Agent 2 — check skill unlock on level up
    window.GameEventBus.emit('levelup:skillcheck', { level: p.level });
  }
  updateHUD();
}

/* ══════════════════════════════════════════════════════════════════════
   7. HUD Update Helpers
   ══════════════════════════════════════════════════════════════════════ */
function updateHUD() {
  const p = window.GameState.player;

  const hpPct   = Math.max(0, (p.currentHP   / p.maxHP)   * 100);
  const sPct    = Math.max(0, (p.currentSoul  / p.maxSoul) * 100);
  const xpPct   = (p.xp / p.xpToNext) * 100;

  // step1 element IDs (legacy bar-hp etc.)
  const elHp    = document.getElementById('bar-hp');
  const elSoul  = document.getElementById('bar-soul');
  const elXp    = document.getElementById('bar-xp');
  if (elHp)   elHp.style.width   = hpPct   + '%';
  if (elSoul) elSoul.style.width = sPct    + '%';
  if (elXp)   elXp.style.width   = xpPct  + '%';
  const vHp   = document.getElementById('val-hp');
  const vSoul = document.getElementById('val-soul');
  const vXp   = document.getElementById('val-xp');
  if (vHp)   vHp.textContent   = `${Math.ceil(p.currentHP)}/${p.maxHP}`;
  if (vSoul) vSoul.textContent = `${Math.ceil(p.currentSoul)}/${p.maxSoul}`;
  if (vXp)   vXp.textContent   = `${Math.floor(p.xp)}/${p.xpToNext}`;
  const lvEl = document.getElementById('player-level');
  if (lvEl) lvEl.textContent = `Lv. ${p.level} · ${originLabel(p.originId)}`;

  // step3 element IDs (bar-hp-fill etc.)
  const elHpFill   = document.getElementById('bar-hp-fill');
  const elSoulFill = document.getElementById('bar-soul-fill');
  const elXpFill   = document.getElementById('bar-xp-fill');
  if (elHpFill)   elHpFill.style.width   = hpPct + '%';
  if (elSoulFill) elSoulFill.style.width = sPct   + '%';
  if (elXpFill)   elXpFill.style.width   = xpPct  + '%';
  const vHp2   = document.getElementById('bar-hp-value');
  const vSoul2 = document.getElementById('bar-soul-value');
  const vXp2   = document.getElementById('bar-xp-value');
  if (vHp2)   vHp2.textContent   = `${Math.ceil(p.currentHP)}/${p.maxHP}`;
  if (vSoul2) vSoul2.textContent = `${Math.ceil(p.currentSoul)}/${p.maxSoul}`;
  if (vXp2)   vXp2.textContent   = `${Math.floor(p.xp)}/${p.xpToNext}`;
  const lvEl2 = document.getElementById('portrait-level');
  if (lvEl2) lvEl2.textContent = `Lv.${p.level}`;
  const badge = document.getElementById('hud-prestige-badge');
  if (badge) badge.textContent = `Prestige ×${p.prestigeCount || 0}`;
}

function originLabel(id) {
  return { wandering_monk:'Wandering Monk', fallen_noble:'Fallen Noble', beast_tamer:'Beast Tamer' }[id] || id;
}

function updateSkillCooldownUI(slotIndex, cdRemain, cdTotal) {
  // step1 element IDs
  const slot = document.getElementById(`slot-${slotIndex}`);
  if (slot) {
    if (cdRemain <= 0) {
      slot.classList.remove('on-cooldown');
      const ov = slot.querySelector('.skill-cd-overlay');
      if (ov) ov.remove();
    } else {
      slot.classList.add('on-cooldown');
      let ov = slot.querySelector('.skill-cd-overlay');
      if (!ov) { ov = document.createElement('div'); ov.className = 'skill-cd-overlay'; slot.appendChild(ov); }
      ov.textContent = cdRemain.toFixed(1);
    }
  }
  // step3 element IDs (cd-sweep / cd-overlay)
  const sweep   = document.getElementById(`cd-sweep-${slotIndex}`);
  const overlay = document.getElementById(`cd-overlay-${slotIndex}`);
  if (sweep) {
    if (cdRemain <= 0) {
      sweep.classList.remove('active');
      sweep.style.removeProperty('--cd-pct');
      if (overlay) overlay.textContent = '';
    } else {
      const pct = (cdRemain / (cdTotal || 1)) * 100;
      sweep.classList.add('active');
      sweep.style.setProperty('--cd-pct', pct.toFixed(1) + '%');
      if (overlay) overlay.textContent = Math.ceil(cdRemain);
    }
  }
}

function flashLevelUp() {
  const el = document.getElementById('levelup-flash');
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}

function addKillFeed(monsterName) {
  const feed = document.getElementById('kill-feed');
  if (!feed) return;
  const el = document.createElement('div');
  el.className = 'kill-entry';
  el.textContent = `✦ ${monsterName} slain`;
  feed.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* ══════════════════════════════════════════════════════════════════════
   8. GameEventBus UI bindings
   ══════════════════════════════════════════════════════════════════════ */
window.GameEventBus.on('player:damaged', ({ amount, currentHP, maxHP }) => {
  window.GameState.player.currentHP = currentHP;
  updateHUD();
});
window.GameEventBus.on('player:healed', ({ amount, currentHP, maxHP }) => {
  window.GameState.player.currentHP = currentHP;
  updateHUD();
});
window.GameEventBus.on('player:levelup', () => {
  flashLevelUp();
  updateHUD();
});
window.GameEventBus.on('monster:died', ({ monster }) => {
  addKillFeed(monster.name);
  // Loot generation is handled by step2-data-loot.js (it listens to monster:died and emits loot:dropped)
});
window.GameEventBus.on('xp:gained', updateHUD);
window.GameEventBus.on('prestige:available', () => {
  window.GameState.prestigeReady = true;
  const banner = document.getElementById('prestige-banner');
  if (banner) {
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 5000);
  }
});
window.GameEventBus.on('area:entered', ({ areaId, name }) => {
  const area = window.WorldData.areas[areaId];
  const areaName = name || (area && area.name) || areaId;
  // step1 element
  const el = document.getElementById('area-name');
  if (el) el.textContent = areaName;
  // step3 element
  const el2 = document.getElementById('area-name-text');
  if (el2) el2.textContent = areaName;
  window.GameState.currentArea = areaId;
});

/* skill click from action bar HTML onclick */
window._onSkillClick = function(slotIndex) {
  window.GameEventBus.emit('ui:skillclick', { slotIndex });
};
window._onRespawn = function() {
  window.GameEventBus.emit('ui:respawn');
};

/* ══════════════════════════════════════════════════════════════════════
   9. PHASER 3 — Main Game Scene
   ══════════════════════════════════════════════════════════════════════ */

const TILE_SIZE      = 32;
const MAP_TILES_W    = 75;   // 2400 / 32
const MAP_TILES_H    = 75;
const PLAYER_SPEED   = 140;
const ATTACK_RANGE   = 90;
const SOUL_REGEN_RATE = 3;   // per second

// Skill cooldown tracking (runtime state)
const skillCooldowns = [0, 0, 0, 0, 0, 0];   // seconds remaining per slot

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player      = null;
    this.monsters    = [];
    this.damageTexts = [];
    this.particles   = [];
    this.playerDead  = false;
    this.inputFrozen = false;
    this.autoAttackTimer = 0;
    this.soulRegenTimer  = 0;
    this.dashActive  = false;
    this.dashTimer   = 0;
    this.dashVelX    = 0;
    this.dashVelY    = 0;
    this._monsterBarEls = {};
    this._fps = 0;
    this._fpsFrames = 0;
    this._fpsLast = 0;
    this.areaId = window.GameState.currentArea;
  }

  preload() {
    // We use procedural graphics — no external sprite assets needed
  }

  create() {
    const areaData = window.WorldData.areas[this.areaId] || window.WorldData.areas['ashen_hollow'];
    this.areaData  = areaData;
    const worldW   = MAP_TILES_W * TILE_SIZE;
    const worldH   = MAP_TILES_H * TILE_SIZE;

    // ── Tilemap (procedural) — resolve tileVariant from step4 tileset field if needed ──
    if (!areaData.tileVariant && areaData.tileset) {
      areaData.tileVariant = (areaData.id || '').includes('ruins') ? 'dungeon' : 'wasteland';
    }
    this._buildTilemap(worldW, worldH, areaData.tileVariant || 'dungeon');

    // ── Physics world bounds ──────────────────────────────────────────
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // ── Player ───────────────────────────────────────────────────────
    this._createPlayer(worldW, worldH);

    // ── Monsters ─────────────────────────────────────────────────────
    this.spawnMonsters(this.areaId);

    // ── Area exit trigger zones ───────────────────────────────────────
    this._createExitZones(areaData);

    // ── Camera ───────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);

    // ── Input ─────────────────────────────────────────────────────────
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.wasd     = this.input.keyboard.addKeys({ up:'W', down:'S', left:'A', right:'D' });
    this.skillKeys = this.input.keyboard.addKeys({ k1:'ONE', k2:'TWO', k3:'THREE', k4:'FOUR', k5:'FIVE', k6:'SIX' });

    // Mouse click to attack
    this.input.on('pointerdown', this._onPointerDown, this);
    // Hold LMB to auto attack
    this.input.on('pointermove', this._onPointerHold, this);

    // UI skill click bridge
    window.GameEventBus.on('ui:skillclick', ({ slotIndex }) => {
      this._activateSkillSlot(slotIndex);
    });

    // Respawn bridge
    window.GameEventBus.on('ui:respawn', () => this._respawnPlayer());

    // ── Recalculate HP/Soul from stats ────────────────────────────────
    const p = window.GameState.player;
    p.maxHP   = window.GameData.calcMaxHP(p.stats.vit, p.level);
    p.maxSoul = window.GameData.calcMaxSoul(p.stats.wis, p.level);
    p.currentHP   = p.maxHP;
    p.currentSoul = p.maxSoul;
    updateHUD();

    window.GameEventBus.emit('area:entered', { areaId: this.areaId, name: areaData.name });
  }

  /* ────── Tilemap Generation ──────────────────────────────────────── */
  _buildTilemap(worldW, worldH, variant) {
    const gfx = this.add.graphics();
    const ts = TILE_SIZE;
    const cols = Math.ceil(worldW / ts);
    const rows = Math.ceil(worldH / ts);

    const isDungeon = variant === 'dungeon';

    // Floor
    const floorColors = isDungeon
      ? [0x1a1520, 0x1e1828, 0x18151e, 0x211c2a]
      : [0x2a1e10, 0x2e200e, 0x261a0c, 0x321f0a];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ci = (c + r * 3) % floorColors.length;
        gfx.fillStyle(floorColors[ci]);
        gfx.fillRect(c * ts, r * ts, ts, ts);
      }
    }

    // Grid lines (very subtle)
    gfx.lineStyle(1, isDungeon ? 0x2a2035 : 0x352015, 0.25);
    for (let r = 0; r <= rows; r++) gfx.lineBetween(0, r * ts, worldW, r * ts);
    for (let c = 0; c <= cols; c++) gfx.lineBetween(c * ts, 0, c * ts, worldH);

    // Scatter obstacle rocks / rubble
    this._buildObstacles(gfx, worldW, worldH, isDungeon);

    // Atmospheric edge vignette
    const vigGfx = this.add.graphics().setDepth(200);
    // (Vignette drawn via rectangle borders for performance)
    const vigColors = isDungeon ? 0x0a0812 : 0x100804;
    for (let i = 0; i < 5; i++) {
      vigGfx.lineStyle(18 - i * 2, vigColors, 0.25 - i * 0.04);
      vigGfx.strokeRect(i * 10, i * 10, worldW - i * 20, worldH - i * 20);
    }
  }

  _buildObstacles(gfx, worldW, worldH, isDungeon) {
    const count = 120;
    const ts = TILE_SIZE;
    const occupiedCells = new Set();
    const reservedCenter = { cx: 1200, cy: 1200, r: 200 };

    const stoneColor = isDungeon ? 0x3a3045 : 0x3a2810;
    const detailColor = isDungeon ? 0x2a2035 : 0x2a1a08;

    this.solidTiles = [];

    for (let i = 0; i < count; i++) {
      const gx = Phaser.Math.Between(2, Math.floor(worldW / ts) - 3);
      const gy = Phaser.Math.Between(2, Math.floor(worldH / ts) - 3);
      const key = `${gx},${gy}`;

      const wx = gx * ts + ts / 2;
      const wy = gy * ts + ts / 2;
      const dist = Phaser.Math.Distance.Between(wx, wy, reservedCenter.cx, reservedCenter.cy);
      if (dist < reservedCenter.r) continue;
      if (occupiedCells.has(key)) continue;

      occupiedCells.add(key);

      const w = ts + Phaser.Math.Between(-8, 8);
      const h = ts + Phaser.Math.Between(-6, 6);
      gfx.fillStyle(stoneColor);
      gfx.fillRect(gx * ts, gy * ts, w, h);
      gfx.fillStyle(detailColor, 0.6);
      gfx.fillRect(gx * ts + 4, gy * ts + 3, w - 8, h - 7);

      this.solidTiles.push(new Phaser.Geom.Rectangle(gx * ts, gy * ts, w, h));
    }
  }

  /* ────── Player Creation ─────────────────────────────────────────── */
  _createPlayer(worldW, worldH) {
    const startX = worldW * 0.1;
    const startY = worldH * 0.5;

    // Body (ellipse for top-down look)
    this.player = this.add.graphics();
    this.player.setDepth(10);
    this._drawPlayerGraphic(this.player, false);

    this.player.x = startX;
    this.player.y = startY;
    this.player.vx = 0;
    this.player.vy = 0;

    // Shadow
    this.playerShadow = this.add.ellipse(startX, startY + 12, 28, 8, 0x000000, 0.4).setDepth(9);

    // Player glow
    this.playerGlow = this.add.ellipse(startX, startY, 36, 36, 0x6633cc, 0.08).setDepth(8);

    // Attack indicator arc (shown briefly when attacking)
    this.attackArc = this.add.graphics().setDepth(11);
    this.attackArcTimer = 0;
  }

  _drawPlayerGraphic(gfx, isDashing) {
    gfx.clear();
    const baseColor = isDashing ? 0x88aaff : 0x7744cc;
    const rimColor  = isDashing ? 0xaaddff : 0xaa77ff;
    const coreColor = isDashing ? 0xeef5ff : 0xddbbff;

    // Body circle
    gfx.fillStyle(baseColor);
    gfx.fillCircle(0, 0, 14);

    // Rim highlight
    gfx.lineStyle(2, rimColor, 0.8);
    gfx.strokeCircle(0, 0, 14);

    // Inner core dot
    gfx.fillStyle(coreColor, 0.9);
    gfx.fillCircle(0, -3, 4);

    // Direction indicator (drawn during movement in update)
    gfx.fillStyle(rimColor, 0.6);
    gfx.fillTriangle(0, -14, -4, -8, 4, -8);
  }

  /* ────── Monster Spawning ─────────────────────────────────────────── */
  spawnMonsters(areaId) {
    // Clear existing
    this.monsters.forEach(m => { m.gfx && m.gfx.destroy(); m.shadow && m.shadow.destroy(); });
    this.monsters = [];
    window.GameState.monstersAlive = [];
    const bars = document.getElementById('monster-bars');
    if (bars) bars.innerHTML = '';
    this._monsterBarEls = {};

    const area = window.WorldData.areas[areaId];
    if (!area) return;

    if (area.spawnPoints) {
      // step4 WorldData format: spawnPoints with monsterTable
      area.spawnPoints.forEach(sp => {
        (sp.monsterTable || []).forEach(entry => {
          const monDef = window.WorldData.getMonster
            ? window.WorldData.getMonster(entry.monsterId)
            : null;
          if (!monDef) return;
          const tpl = this._toSpawnTpl(monDef);
          const cnt = Phaser.Math.Between(entry.minCount || 1, entry.maxCount || 1);
          for (let i = 0; i < cnt; i++) {
            const ox = Phaser.Math.Between(-60, 60);
            const oy = Phaser.Math.Between(-60, 60);
            this._spawnMonster(tpl, sp.x + ox, sp.y + oy, entry.monsterId);
          }
        });
      });
    } else if (area.spawns) {
      // step1 stub format
      area.spawns.forEach(spawnGroup => {
        const tpl = window.WorldData.monsterTemplates && window.WorldData.monsterTemplates[spawnGroup.type];
        if (!tpl) return;
        for (let i = 0; i < spawnGroup.count; i++) {
          const ox = Phaser.Math.Between(-40, 40);
          const oy = Phaser.Math.Between(-40, 40);
          this._spawnMonster(tpl, spawnGroup.x + ox, spawnGroup.y + oy, spawnGroup.type);
        }
      });
    }
  }

  // Normalise a step4 monster definition into the flat template format _spawnMonster expects
  _toSpawnTpl(monDef) {
    const tierColors = { normal: 0x5a3080, rare: 0x3060b0, boss: 0xb03020, unique: 0xd07020 };
    return {
      name:        monDef.displayName || monDef.name,
      maxHP:       monDef.maxHP || 100,
      stats:       monDef.stats || { str:10, dex:10, vit:10, int:8, wis:8, luk:5 },
      speed:       monDef.moveSpeed || 60,
      aggroRange:  monDef.aggroRange || 150,
      attackRange: monDef.attackRange || 40,
      attackSpeed: monDef.attackSpeed || 1.0,
      damage:      monDef.attackDamage
                     ? Math.floor((monDef.attackDamage.min + monDef.attackDamage.max) / 2)
                     : 10,
      xpReward:    monDef.xpReward || 20,
      color:       tierColors[monDef.tier] || 0x5a3080,
    };
  }

  _spawnMonster(tpl, x, y, typeId) {
    const id = `monster_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const gfx = this.add.graphics().setDepth(10);
    const shadow = this.add.ellipse(x, y + 10, 24, 7, 0x000000, 0.35).setDepth(9);
    this._drawMonsterGraphic(gfx, tpl.color, false, tpl.name);
    gfx.x = x; gfx.y = y;

    const monster = {
      id, typeId,
      name: tpl.name,
      maxHP: tpl.maxHP,
      currentHP: tpl.maxHP,
      stats: { ...tpl.stats },
      speed: tpl.speed,
      aggroRange: tpl.aggroRange,
      attackRange: tpl.attackRange,
      attackSpeed: tpl.attackSpeed,
      damage: tpl.damage,
      xpReward: tpl.xpReward,
      color: tpl.color,
      x, y,
      vx: 0, vy: 0,
      state: 'idle',         // idle | aggro | chase | attack
      attackTimer: 0,
      gfx, shadow,
      dead: false,
      deathTimer: 0,
    };

    this.monsters.push(monster);
    window.GameState.monstersAlive.push(monster);

    // HTML health bar
    this._createMonsterHPBar(monster);

    return monster;
  }

  _drawMonsterGraphic(gfx, color, isAggro, name) {
    gfx.clear();

    // Shadow body
    const darkColor = Phaser.Display.Color.IntegerToColor(color);
    darkColor.darken(30);

    gfx.fillStyle(color);
    gfx.fillCircle(0, 0, 11);
    gfx.lineStyle(1.5, isAggro ? 0xff4444 : 0x000000, 0.6);
    gfx.strokeCircle(0, 0, 11);

    // Aggro indicator
    if (isAggro) {
      gfx.lineStyle(1, 0xff3333, 0.5);
      gfx.strokeCircle(0, 0, 15);
    }

    // Eyes
    gfx.fillStyle(0xff2222);
    gfx.fillCircle(-3.5, -2, 2.2);
    gfx.fillCircle(3.5, -2, 2.2);
    gfx.fillStyle(0xffaaaa, 0.7);
    gfx.fillCircle(-3, -2.5, 0.8);
    gfx.fillCircle(4, -2.5, 0.8);
  }

  _createMonsterHPBar(monster) {
    const container = document.getElementById('monster-bars');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'monster-hpbar';
    wrapper.id = `mbar-${monster.id}`;
    wrapper.style.cssText = 'position:absolute;transform:translate(-50%,-100%);';

    const nameEl = document.createElement('div');
    nameEl.className = 'monster-name-label';
    nameEl.textContent = monster.name;

    const track = document.createElement('div');
    track.className = 'monster-hp-track';
    const fill = document.createElement('div');
    fill.className = 'monster-hp-fill';
    fill.style.width = '100%';
    track.appendChild(fill);

    wrapper.appendChild(nameEl);
    wrapper.appendChild(track);
    container.appendChild(wrapper);

    this._monsterBarEls[monster.id] = { wrapper, fill };
  }

  _updateMonsterHPBar(monster) {
    const els = this._monsterBarEls[monster.id];
    if (!els) return;

    // Convert world pos to screen pos
    const cam   = this.cameras.main;
    const scaleX = this.sys.game.canvas.clientWidth  / this.sys.game.config.width;
    const scaleY = this.sys.game.canvas.clientHeight / this.sys.game.config.height;

    const sx = (monster.x - cam.scrollX) * cam.zoom * scaleX;
    const sy = (monster.y - cam.scrollY - 20) * cam.zoom * scaleY;

    els.wrapper.style.left = sx + 'px';
    els.wrapper.style.top  = sy + 'px';

    const pct = Math.max(0, monster.currentHP / monster.maxHP * 100);
    els.fill.style.width = pct + '%';

    if (monster.dead) els.wrapper.style.display = 'none';
  }

  /* ────── Exit Zones ──────────────────────────────────────────────── */
  _createExitZones(areaData) {
    this.exitZones = [];
    if (!areaData.exits) return;

    areaData.exits.forEach(exit => {
      const zone = this.add.rectangle(exit.x, exit.y, 48, 48, 0xc8973a, 0.18).setDepth(1);
      zone.targetAreaId = exit.targetAreaId;

      // Animated border
      const border = this.add.rectangle(exit.x, exit.y, 48, 48).setDepth(2);
      border.setStrokeStyle(2, 0xc8973a, 0.6);

      // Label
      const label = this.add.text(exit.x, exit.y - 32, '→ EXIT', {
        fontFamily: 'Satoshi, sans-serif',
        fontSize: '10px',
        color: '#c8973a',
        alpha: 0.7,
      }).setOrigin(0.5).setDepth(2);

      // Pulse tween
      this.tweens.add({ targets: [zone, border], alpha: { from:0.12, to:0.35 }, duration: 1200, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });

      this.exitZones.push({ zone, targetAreaId: exit.targetAreaId, x: exit.x, y: exit.y });
    });
  }

  /* ────── Main Update Loop ─────────────────────────────────────────── */
  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    if (this.playerDead) return;

    this._updateDebugOverlay(time);
    this._handlePlayerMovement(dt);
    this._handleSkillKeys();
    this._updateDash(dt);
    this._updateMonsters(dt);
    this._updateDamageTexts(dt);
    this._updateParticles(dt);
    this._updateAutoAttack(dt);
    this._updateSoulRegen(dt);
    this._updateAttackArc(dt);
    this._checkExitZones();
    this._syncMonsterBars();
  }

  _updateDebugOverlay(time) {
    this._fpsFrames++;
    if (time - this._fpsLast >= 1000) {
      this._fps = Math.round(this._fpsFrames * 1000 / (time - this._fpsLast));
      this._fpsFrames = 0;
      this._fpsLast = time;
      const p = window.GameState.player;
      const el = document.getElementById('debug-overlay');
      if (el) el.textContent = `FPS:${this._fps}  Monsters:${this.monsters.filter(m=>!m.dead).length}  Player:(${Math.floor(this.player.x)},${Math.floor(this.player.y)})  HP:${Math.ceil(p.currentHP)}/${p.maxHP}`;
    }
  }

  _handlePlayerMovement(dt) {
    if (this.inputFrozen || this.dashActive) return;

    const c  = this.cursors;
    const w  = this.wasd;
    let vx = 0, vy = 0;

    if (c.left.isDown  || w.left.isDown)  vx -= 1;
    if (c.right.isDown || w.right.isDown) vx += 1;
    if (c.up.isDown    || w.up.isDown)    vy -= 1;
    if (c.down.isDown  || w.down.isDown)  vy += 1;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    const speed = PLAYER_SPEED;
    const nx = this.player.x + vx * speed * dt;
    const ny = this.player.y + vy * speed * dt;

    const pw = 2400; const ph = 2400;
    const cx = Phaser.Math.Clamp(nx, 16, pw - 16);
    const cy = Phaser.Math.Clamp(ny, 16, ph - 16);

    // Obstacle collision (simplified — skip tile that contains target pos)
    let blocked = false;
    for (const tile of this.solidTiles) {
      if (tile.contains(cx, cy)) { blocked = true; break; }
    }
    if (!blocked) { this.player.x = cx; this.player.y = cy; }

    // Rotate player direction graphic
    if (vx !== 0 || vy !== 0) {
      this.player.rotation = Math.atan2(vy, vx) + Math.PI / 2;
    }

    // Update shadow & glow positions
    this.playerShadow.setPosition(this.player.x, this.player.y + 12);
    this.playerGlow.setPosition(this.player.x, this.player.y);

    // Sync GameState (position tracked inside Phaser graphics object)
    // GameState has player position implicitly via this.player.x/y
  }

  _handleSkillKeys() {
    const sk = this.skillKeys;
    const justDown = Phaser.Input.Keyboard.JustDown;
    if (justDown(sk.k1)) this._activateSkillSlot(0);
    if (justDown(sk.k2)) this._activateSkillSlot(1);
    if (justDown(sk.k3)) this._activateSkillSlot(2);
    if (justDown(sk.k4)) this._activateSkillSlot(3);
    if (justDown(sk.k5)) this._activateSkillSlot(4);
    if (justDown(sk.k6)) this._activateSkillSlot(5);
  }

  _activateSkillSlot(slotIndex) {
    if (this.inputFrozen) return;
    const p = window.GameState.player;
    const skill = p.skills[slotIndex];
    if (!skill) return;
    if (skillCooldowns[slotIndex] > 0) return;

    // Soul cost check
    if (skill.soulCost > 0 && p.currentSoul < skill.soulCost) {
      this._spawnFloatingText(this.player.x, this.player.y - 20, 'No Soul', 0x4466aa);
      return;
    }

    // Dash skill special handling
    if (skill.isDash) {
      this._triggerDash(skill);
      p.currentSoul -= skill.soulCost;
      skillCooldowns[slotIndex] = skill.cooldown;
      window.GameEventBus.emit('skill:used', { skillId: skill.id, targets: [] });
      updateHUD();
      return;
    }

    // Deduct soul
    p.currentSoul -= skill.soulCost;
    updateHUD();

    // Find targets
    const targets = this._getSkillTargets(skill);
    if (targets.length === 0 && skill.range > 0) {
      // Swing anyway for visual feedback
    }

    // Apply damage to targets
    const rawDmg = calcSkillDamage(skill, p.stats);
    const hitTargets = [];

    targets.forEach(monster => {
      const { finalDamage, isCrit } = applyDamageToTarget(rawDmg, skill, 0, monster.currentHP);
      this._damageMonster(monster, finalDamage, isCrit, skill);
      hitTargets.push(monster.id);
    });

    // Attack arc visual
    this._showAttackArc(skill);

    // Skill effect particle
    if (skill.type === 'magical' && skill.aoe) {
      this._spawnSoulPulseVFX(this.player.x, this.player.y, skill.aoeRadius);
    }

    // Set cooldown
    skillCooldowns[slotIndex] = skill.cooldown;

    window.GameEventBus.emit('skill:used', { skillId: skill.id, targets: hitTargets });

    // Highlight slot
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) {
      slotEl.classList.add('active');
      setTimeout(() => slotEl.classList.remove('active'), 200);
    }
  }

  _getSkillTargets(skill) {
    if (skill.isDash) return [];
    const alive = this.monsters.filter(m => !m.dead);
    if (alive.length === 0) return [];

    if (skill.aoe) {
      // All monsters within aoeRadius
      return alive.filter(m => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y);
        return d <= skill.aoeRadius;
      });
    } else {
      // Nearest within range
      let nearest = null, nearestDist = Infinity;
      alive.forEach(m => {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y);
        if (d <= (skill.range || ATTACK_RANGE) && d < nearestDist) { nearest = m; nearestDist = d; }
      });
      return nearest ? [nearest] : [];
    }
  }

  _damageMonster(monster, amount, isCrit, skill) {
    monster.currentHP -= amount;
    const color = isCrit ? 0xffdd44 : (skill && skill.type === 'magical' ? 0x88ccff : 0xff4444);
    this._spawnFloatingText(monster.x, monster.y - 16, isCrit ? `${amount}!` : `${amount}`, color);

    window.GameEventBus.emit('monster:damaged', {
      monsterId: monster.id,
      amount,
      currentHP: monster.currentHP,
    });

    // Stagger visual
    this.tweens.add({ targets: monster.gfx, x: monster.x + Phaser.Math.Between(-5, 5), duration: 60, yoyo: true });

    if (monster.currentHP <= 0) {
      this._killMonster(monster);
    }
  }

  _killMonster(monster) {
    if (monster.dead) return;
    monster.dead = true;
    monster.state = 'dead';

    // Remove from GameState
    window.GameState.monstersAlive = window.GameState.monstersAlive.filter(m => m.id !== monster.id);

    window.GameEventBus.emit('monster:died', {
      monster: { ...monster },
      position: { x: monster.x, y: monster.y },
    });

    // XP
    grantXP(monster.xpReward);

    // Death VFX
    this._spawnDeathVFX(monster.x, monster.y, monster.color);

    // Fade out graphic
    this.tweens.add({
      targets: [monster.gfx, monster.shadow],
      alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 350, ease: 'Quad.easeOut',
      onComplete: () => {
        monster.gfx.destroy();
        monster.shadow.destroy();
      }
    });
  }

  /* ────── Auto-attack (hold LMB) ──────────────────────────────────── */
  _onPointerDown(pointer) {
    if (this.inputFrozen) return;
    this._activateSkillSlot(0);
  }
  _onPointerHold(pointer) {
    if (!pointer.isDown || this.inputFrozen) return;
    // auto attack handled via autoAttackTimer
  }

  _updateAutoAttack(dt) {
    if (this.inputFrozen) return;
    this.autoAttackTimer += dt;
    if (this.autoAttackTimer < 0.5) return;

    if (this.input.activePointer.isDown) {
      this.autoAttackTimer = 0;
      this._activateSkillSlot(0);
    }
  }

  /* ────── Cooldown ticking ────────────────────────────────────────── */
  _updateSoulRegen(dt) {
    const p = window.GameState.player;
    if (p.currentSoul < p.maxSoul) {
      p.currentSoul = Math.min(p.maxSoul, p.currentSoul + SOUL_REGEN_RATE * dt);
      // throttle HUD update
      this.soulRegenTimer = (this.soulRegenTimer || 0) + dt;
      if (this.soulRegenTimer >= 0.5) { this.soulRegenTimer = 0; updateHUD(); }
    }

    // Update skill cooldowns
    for (let i = 0; i < skillCooldowns.length; i++) {
      if (skillCooldowns[i] > 0) {
        skillCooldowns[i] = Math.max(0, skillCooldowns[i] - dt);
        updateSkillCooldownUI(i, skillCooldowns[i], window.GameState.player.skills[i]?.cooldown || 1);
      }
    }
  }

  /* ────── Dash mechanic ───────────────────────────────────────────── */
  _triggerDash(skill) {
    const c  = this.cursors;
    const w  = this.wasd;
    let vx = 0, vy = 0;
    if (c.left.isDown  || w.left.isDown)  vx -= 1;
    if (c.right.isDown || w.right.isDown) vx += 1;
    if (c.up.isDown    || w.up.isDown)    vy -= 1;
    if (c.down.isDown  || w.down.isDown)  vy += 1;
    if (vx === 0 && vy === 0) { vx = 0; vy = -1; }
    const len = Math.sqrt(vx*vx + vy*vy);
    vx /= len; vy /= len;

    this.dashActive = true;
    this.dashTimer  = skill.dashDuration;
    this.dashVelX   = vx * (skill.dashDistance / skill.dashDuration);
    this.dashVelY   = vy * (skill.dashDistance / skill.dashDuration);

    // Visual: brief invincibility glow
    this.playerGlow.setAlpha(0.6);
    this._drawPlayerGraphic(this.player, true);
    this._spawnDashVFX(this.player.x, this.player.y);
  }

  _updateDash(dt) {
    if (!this.dashActive) return;
    this.dashTimer -= dt;
    if (this.dashTimer <= 0) {
      this.dashActive = false;
      this.dashVelX = 0; this.dashVelY = 0;
      this._drawPlayerGraphic(this.player, false);
      this.playerGlow.setAlpha(0.08);
      return;
    }
    const nx = Phaser.Math.Clamp(this.player.x + this.dashVelX * dt, 16, 2400 - 16);
    const ny = Phaser.Math.Clamp(this.player.y + this.dashVelY * dt, 16, 2400 - 16);
    this.player.x = nx; this.player.y = ny;
    this.playerShadow.setPosition(nx, ny + 12);
    this.playerGlow.setPosition(nx, ny);
  }

  /* ────── Monster AI ──────────────────────────────────────────────── */
  _updateMonsters(dt) {
    const px = this.player.x, py = this.player.y;

    this.monsters.forEach(monster => {
      if (monster.dead) return;

      const dist = Phaser.Math.Distance.Between(px, py, monster.x, monster.y);
      const prevState = monster.state;

      // State transitions
      if (monster.state === 'idle' && dist < monster.aggroRange) {
        monster.state = 'chase';
      }
      if (monster.state === 'chase' && dist <= monster.attackRange) {
        monster.state = 'attack';
      }
      if (monster.state === 'attack' && dist > monster.attackRange * 1.5) {
        monster.state = 'chase';
      }

      // Re-draw if state changed (aggro indication)
      if (prevState !== monster.state && (monster.state === 'chase' || monster.state === 'attack')) {
        this._drawMonsterGraphic(monster.gfx, monster.color, true, monster.name);
      } else if (prevState !== 'idle' && monster.state === 'idle') {
        this._drawMonsterGraphic(monster.gfx, monster.color, false, monster.name);
      }

      // Movement
      if (monster.state === 'chase' || monster.state === 'attack') {
        const dx = px - monster.x, dy = py - monster.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0 && monster.state === 'chase') {
          const spd = monster.speed;
          monster.vx = (dx / len) * spd;
          monster.vy = (dy / len) * spd;
        } else {
          monster.vx = 0; monster.vy = 0;
        }
      } else {
        // Idle wandering
        if (!monster.idleTimer || monster.idleTimer <= 0) {
          monster.idleTimer = Phaser.Math.FloatBetween(1.5, 4);
          monster.idleVx = Phaser.Math.FloatBetween(-0.3, 0.3);
          monster.idleVy = Phaser.Math.FloatBetween(-0.3, 0.3);
        }
        monster.idleTimer -= dt;
        monster.vx = monster.idleVx * 20;
        monster.vy = monster.idleVy * 20;
      }

      // Apply movement
      if (monster.vx !== 0 || monster.vy !== 0) {
        const nx = Phaser.Math.Clamp(monster.x + monster.vx * dt, 16, 2400 - 16);
        const ny = Phaser.Math.Clamp(monster.y + monster.vy * dt, 16, 2400 - 16);

        let blocked = false;
        for (const tile of this.solidTiles) {
          if (tile.contains(nx, ny)) { blocked = true; break; }
        }
        if (!blocked) { monster.x = nx; monster.y = ny; }

        monster.gfx.x   = monster.x;
        monster.gfx.y   = monster.y;
        monster.shadow.setPosition(monster.x, monster.y + 10);
      }

      // Attack player
      if (monster.state === 'attack' && !this.dashActive) {
        monster.attackTimer += dt;
        const interval = 1 / monster.attackSpeed;
        if (monster.attackTimer >= interval) {
          monster.attackTimer = 0;
          this._monsterAttackPlayer(monster);
        }
      } else {
        monster.attackTimer = 0;
      }
    });
  }

  _monsterAttackPlayer(monster) {
    const p  = window.GameState.player;
    const dmg = Math.max(1, monster.damage - Math.floor(p.stats.vit * 0.5));
    p.currentHP = Math.max(0, p.currentHP - dmg);

    this._spawnFloatingText(this.player.x, this.player.y - 20, `-${dmg}`, 0xff4444);
    this._flashPlayerHit();

    window.GameEventBus.emit('player:damaged', {
      amount: dmg,
      currentHP: p.currentHP,
      maxHP: p.maxHP,
    });

    if (p.currentHP <= 0) this._onPlayerDeath();
  }

  _flashPlayerHit() {
    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.3, to: 1 },
      duration: 150, yoyo: false,
    });
    this.cameras.main.shake(80, 0.005);
  }

  /* ────── Player Death & Respawn ──────────────────────────────────── */
  _onPlayerDeath() {
    if (this.playerDead) return;
    this.playerDead  = true;
    this.inputFrozen = true;

    window.GameEventBus.emit('player:died');

    // Fade to death screen
    this.cameras.main.flash(400, 180, 0, 0);
    setTimeout(() => {
      const overlay = document.getElementById('death-overlay');
      if (overlay) overlay.classList.add('show');
    }, 500);
  }

  _respawnPlayer() {
    const overlay = document.getElementById('death-overlay');
    if (overlay) overlay.classList.remove('show');

    const p = window.GameState.player;
    p.currentHP   = Math.ceil(p.maxHP * 0.5);
    p.currentSoul = Math.ceil(p.maxSoul * 0.5);
    updateHUD();

    // Respawn at entrance
    this.player.x = 200;
    this.player.y = 1200;
    this.player.alpha = 1;
    this.playerDead  = false;
    this.inputFrozen = false;

    this.cameras.main.flash(300, 100, 80, 120);
    window.GameEventBus.emit('player:healed', { amount: p.currentHP, currentHP: p.currentHP, maxHP: p.maxHP });
  }

  /* ────── Area Transitions ────────────────────────────────────────── */
  _checkExitZones() {
    this.exitZones.forEach(exit => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, exit.x, exit.y);
      if (dist < 30) {
        this._transitionToArea(exit.targetAreaId);
      }
    });
  }

  _transitionToArea(targetAreaId) {
    if (this._transitioning) return;
    this._transitioning = true;

    const fade = document.getElementById('area-fade');
    if (fade) { fade.classList.add('fade-in'); }

    window.GameEventBus.emit('area:transition', { targetAreaId });

    setTimeout(() => {
      this.areaId = targetAreaId;
      window.GameState.currentArea = targetAreaId;

      // Re-init scene content for new area
      const areaData = window.WorldData.areas[targetAreaId];
      if (!areaData) { this._transitioning = false; return; }

      // Clear existing graphics
      this.children.removeAll(true);
      this.exitZones = [];
      this.monsters  = [];
      this.damageTexts = [];
      this.particles = [];
      this._monsterBarEls = {};
      const bars = document.getElementById('monster-bars');
      if (bars) bars.innerHTML = '';

      this._buildTilemap(MAP_TILES_W * TILE_SIZE, MAP_TILES_H * TILE_SIZE, areaData.tileVariant);
      this._createPlayer(MAP_TILES_W * TILE_SIZE, MAP_TILES_H * TILE_SIZE);
      this.player.x = (targetAreaId === 'ashen_hollow') ? 2200 : 200;
      this.player.y = 1200;
      this.playerShadow.setPosition(this.player.x, this.player.y + 12);
      this.playerGlow.setPosition(this.player.x, this.player.y);
      this.attackArc = this.add.graphics().setDepth(11);
      this.attackArcTimer = 0;
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
      this._createExitZones(areaData);
      this.spawnMonsters(targetAreaId);

      window.GameEventBus.emit('area:entered', { areaId: targetAreaId, name: areaData.name });

      setTimeout(() => {
        if (fade) { fade.classList.remove('fade-in'); }
        this._transitioning = false;
      }, 500);
    }, 500);
  }

  /* ────── Attack Arc Visual ───────────────────────────────────────── */
  _showAttackArc(skill) {
    this.attackArcTimer = 0.18;
    const arc = this.attackArc;
    arc.clear();
    const r = (skill.aoe ? skill.aoeRadius : skill.range) || ATTACK_RANGE;
    const color = skill.type === 'magical' ? 0x5599ff : 0xffcc44;
    arc.lineStyle(1.5, color, 0.45);
    arc.strokeCircle(this.player.x, this.player.y, r);
    arc.fillStyle(color, 0.06);
    arc.fillCircle(this.player.x, this.player.y, r);
  }

  _updateAttackArc(dt) {
    if (this.attackArcTimer > 0) {
      this.attackArcTimer -= dt;
      if (this.attackArcTimer <= 0) {
        this.attackArc.clear();
      }
    }
  }

  /* ────── Floating Damage Text ────────────────────────────────────── */
  _spawnFloatingText(x, y, text, color) {
    const style = { fontFamily: 'Satoshi, sans-serif', fontSize: '13px', color: '#' + color.toString(16).padStart(6, '0'), fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 };
    const t = this.add.text(x, y, text, style).setOrigin(0.5).setDepth(50);
    this.damageTexts.push({ text: t, life: 0.9, maxLife: 0.9, vy: -60, x, y });
  }

  _updateDamageTexts(dt) {
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const d = this.damageTexts[i];
      d.life -= dt;
      d.y += d.vy * dt;
      d.text.setPosition(d.x, d.y);
      d.text.setAlpha(Math.max(0, d.life / d.maxLife));
      if (d.life <= 0) {
        d.text.destroy();
        this.damageTexts.splice(i, 1);
      }
    }
  }

  /* ────── Particle VFX ────────────────────────────────────────────── */
  _spawnDeathVFX(x, y, color) {
    const gfx = this.add.graphics().setDepth(30);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = Phaser.Math.FloatBetween(40, 100);
      this.particles.push({
        gfx, x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.5, maxLife: 0.5,
        color, size: Phaser.Math.FloatBetween(2, 5),
        shared: i === 0,
      });
    }
  }

  _spawnSoulPulseVFX(x, y, radius) {
    const gfx = this.add.graphics().setDepth(30);
    gfx.lineStyle(2, 0x4488ff, 0.8);
    gfx.strokeCircle(x, y, 10);
    this.particles.push({ gfx, x, y, vx:0, vy:0, life:0.35, maxLife:0.35, color:0x4488ff, size:radius, isRing:true, radius:10 });
  }

  _spawnDashVFX(x, y) {
    const gfx = this.add.graphics().setDepth(30);
    gfx.fillStyle(0xaaddff, 0.4);
    gfx.fillCircle(x, y, 14);
    this.particles.push({ gfx, x, y, vx:0, vy:0, life:0.3, maxLife:0.3, color:0xaaddff, size:14, isFadeCircle:true });
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      const alpha = Math.max(0, p.life / p.maxLife);

      if (p.isRing) {
        p.radius += 200 * dt;
        p.gfx.clear();
        p.gfx.lineStyle(2, p.color, alpha * 0.8);
        p.gfx.strokeCircle(p.x, p.y, p.radius);
      } else if (p.isFadeCircle) {
        p.gfx.clear();
        p.gfx.fillStyle(p.color, alpha * 0.4);
        p.gfx.fillCircle(p.x, p.y, p.size);
      } else if (p.shared) {
        // all particles share this gfx in deathVFX — redraw all siblings
        const siblings = this.particles.filter(s => s.gfx === p.gfx);
        p.gfx.clear();
        siblings.forEach(s => {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 120 * dt; // gravity
          const a = Math.max(0, s.life / s.maxLife);
          p.gfx.fillStyle(s.color, a);
          p.gfx.fillCircle(s.x, s.y, s.size * a);
        });
      }

      if (p.life <= 0) {
        if (!p.shared) {
          p.gfx.destroy();
        } else {
          // Only destroy the gfx once, when the first particle dies
          const allDead = this.particles.filter(s => s.gfx === p.gfx).every(s => s.life <= 0);
          if (allDead) p.gfx.destroy();
        }
        this.particles.splice(i, 1);
      }
    }
  }

  /* ────── Sync HTML monster HP bars to screen positions ───────────── */
  _syncMonsterBars() {
    this.monsters.forEach(m => this._updateMonsterHPBar(m));
  }
}

/* ══════════════════════════════════════════════════════════════════════
   10. Phaser Game Configuration & Launch
   ══════════════════════════════════════════════════════════════════════ */
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width:  window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0d0b0e',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
window._phaserGame = game;  // expose for integration.js and testing

/* ══════════════════════════════════════════════════════════════════════
   11. window.advanceTime — deterministic testing hook
   ══════════════════════════════════════════════════════════════════════ */
window.advanceTime = function(ms) {
  const scene = game.scene.getScene('GameScene');
  if (!scene) return;
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i++) scene.update(performance.now(), 1000 / 60);
};

/* ══════════════════════════════════════════════════════════════════════
   12. window.render_game_to_text — state snapshot for automated testing
   ══════════════════════════════════════════════════════════════════════ */
window.render_game_to_text = function() {
  const scene = game.scene.getScene('GameScene');
  const p = window.GameState.player;
  return JSON.stringify({
    /* Origin: top-left of world; +x right, +y down */
    player: {
      x: scene ? Math.floor(scene.player.x) : 0,
      y: scene ? Math.floor(scene.player.y) : 0,
      hp: Math.ceil(p.currentHP),
      maxHP: p.maxHP,
      soul: Math.ceil(p.currentSoul),
      maxSoul: p.maxSoul,
      level: p.level,
      xp: Math.floor(p.xp),
      xpToNext: p.xpToNext,
      dead: scene ? scene.playerDead : false,
    },
    area: window.GameState.currentArea,
    monsters: window.GameState.monstersAlive.map(m => ({
      id: m.id, name: m.name, x: Math.floor(m.x), y: Math.floor(m.y),
      hp: m.currentHP, maxHP: m.maxHP, state: m.state,
    })),
    skillCooldowns,
    prestigeReady: window.GameState.prestigeReady,
  });
};

/* ══════════════════════════════════════════════════════════════════════
   13. Handle resize
   ══════════════════════════════════════════════════════════════════════ */
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

/* Initial HUD render */
updateHUD();