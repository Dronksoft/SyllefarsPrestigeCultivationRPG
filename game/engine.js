'use strict';

/* ══════════════════════════════════════════════════════════════════════
   1. GameEventBus
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
   2. GameState
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
    skills: [],
    prestigeCount: 0,
    activeMartialBook: null,
    activeSoulBook: null,
    activeCore: null,
    learnedBooks: [],
    ownedCores: [],
    inventory: [],
    soulForgedGear: [],
  },
  currentArea: 'ashveil_ruins',
  monstersAlive: [],
  sessionLoot: [],
  questProgress: {},
  prestigeReady: false,
};

/* ══════════════════════════════════════════════════════════════════════
   3. HOOK stubs
   ══════════════════════════════════════════════════════════════════════ */
window.GameData = window.GameData || {
  getStatBonuses: () => ({ str:0, dex:0, vit:0, int:0, wis:0, luk:0 }),
  calcMaxHP:   (vit, level) => 80 + vit * 4 + level * 5,
  calcMaxSoul: (wis, level) => 40 + wis * 4 + level * 3,
};
window.LootEngine = window.LootEngine || { rollDrop: () => null };
window.WorldData  = window.WorldData  || {
  areas: {
    ashveil_ruins: {
      id: 'ashveil_ruins', name: 'Ashveil Ruins', width: 2400, height: 2400, tileVariant: 'dungeon',
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
      id: 'ember_wastes', name: 'Ember Wastes', width: 2400, height: 2400, tileVariant: 'wasteland',
      exits: [{ x: 60, y: 1200, targetAreaId: 'ashveil_ruins' }],
      spawns: [
        { x: 600,  y: 600,  type: 'ash_crawler',  count: 3 },
        { x: 1000, y: 400,  type: 'ember_wraith', count: 2 },
        { x: 1400, y: 800,  type: 'ash_crawler',  count: 2 },
      ],
    },
  },
  monsterTemplates: {
    fallen_shade:   { name:'Fallen Shade',   maxHP:60,  stats:{str:8,dex:7,vit:5,int:3,wis:2,luk:2},  speed:60,  aggroRange:150, attackRange:36,  attackSpeed:1.2, damage:8,  xpReward:18, color:0x5a3080 },
    bone_hound:     { name:'Bone Hound',     maxHP:80,  stats:{str:12,dex:9,vit:7,int:2,wis:2,luk:3}, speed:80,  aggroRange:180, attackRange:40,  attackSpeed:1.5, damage:12, xpReward:25, color:0x9a8a60 },
    corrupted_wisp: { name:'Corrupted Wisp', maxHP:40,  stats:{str:3,dex:12,vit:3,int:15,wis:8,luk:5},speed:100, aggroRange:200, attackRange:180, attackSpeed:2.0, damage:16, xpReward:30, color:0x20a0c0 },
    ash_crawler:    { name:'Ash Crawler',    maxHP:100, stats:{str:14,dex:6,vit:10,int:2,wis:2,luk:2},speed:55,  aggroRange:140, attackRange:44,  attackSpeed:1.0, damage:15, xpReward:35, color:0x804020 },
    ember_wraith:   { name:'Ember Wraith',   maxHP:70,  stats:{str:5,dex:10,vit:6,int:12,wis:7,luk:6},speed:90,  aggroRange:220, attackRange:160, attackSpeed:1.8, damage:20, xpReward:42, color:0xe04030 },
  },
};

/* ══════════════════════════════════════════════════════════════════════
   4. Skill Definitions
   ══════════════════════════════════════════════════════════════════════ */
const SKILL_DEFS = {
  basic_strike: {
    id: 'basic_strike', name: 'Iron Strike', type: 'physical',
    icon: '⚔️', slotIndex: 0,
    cooldown: 0.5, soulCost: 0,
    range: 80, aoe: false, aoeRadius: 0,
    baseDamage: 10, scalingStat: 'str', scalingFactor: 1.4,
    tags: ['melee', 'physical'],
    description: 'A focused strike that channels martial force.',
    passive: false,
    // VFX config — melee slash
    vfx: { type: 'slash', color: 0xffcc66, width: 60, sweepAngle: 90 },
  },
  soul_pulse: {
    id: 'soul_pulse', name: 'Soul Pulse', type: 'magical',
    icon: '💠', slotIndex: 1,
    cooldown: 2.0, soulCost: 20,
    range: 200, aoe: true, aoeRadius: 90,
    baseDamage: 18, scalingStat: 'int', scalingFactor: 1.8,
    tags: ['ranged', 'magical', 'aoe'],
    description: 'Releases condensed soul energy in a ring.',
    passive: false,
    // VFX config — projectile burst (8 orbs)
    vfx: { type: 'projectile_burst', color: 0x55aaff, speed: 320, size: 7, count: 8 },
  },
  dash: {
    id: 'dash', name: 'Wind Step', type: 'physical',
    icon: '💨', slotIndex: 2,
    cooldown: 4.0, soulCost: 15,
    range: 0, aoe: false, aoeRadius: 0,
    baseDamage: 0, scalingStat: 'dex', scalingFactor: 0,
    tags: ['movement', 'physical'],
    description: 'A swift burst of movement, evading all harm.',
    passive: false,
    isDash: true, dashDistance: 160, dashDuration: 0.15,
  },
};
window.GameState.player.skills = [
  SKILL_DEFS.basic_strike,
  SKILL_DEFS.soul_pulse,
  SKILL_DEFS.dash,
];

/* ══════════════════════════════════════════════════════════════════════
   5. Combat Damage Pipeline
   ══════════════════════════════════════════════════════════════════════ */
function calcSkillDamage(skill, attackerStats) {
  return Math.floor(skill.baseDamage + (attackerStats[skill.scalingStat] || 0) * skill.scalingFactor);
}
function applyDamageToTarget(rawDamage, skill, targetDef, targetCurrentHP) {
  const player = window.GameState.player;
  let dmg = Math.max(1, rawDamage - (targetDef || 0));
  const critChance = (player.stats.luk || 6) * 0.5;
  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) dmg = Math.floor(dmg * 1.8);
  return { finalDamage: Math.max(1, dmg), isCrit };
}

/* ══════════════════════════════════════════════════════════════════════
   6. XP & Leveling
   ══════════════════════════════════════════════════════════════════════ */
function xpToNextLevel(level) { return Math.floor(100 * Math.pow(1.35, level - 1)); }
function grantXP(amount) {
  const p = window.GameState.player;
  p.xp += amount;
  window.GameEventBus.emit('xp:gained', { amount, total: p.xp, toNext: p.xpToNext });
  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext; p.level++;
    p.xpToNext = xpToNextLevel(p.level);
    p.stats.str++; p.stats.dex++; p.stats.vit++; p.stats.int++; p.stats.wis++;
    const newMaxHP   = window.GameData.calcMaxHP(p.stats.vit, p.level);
    const newMaxSoul = window.GameData.calcMaxSoul(p.stats.wis, p.level);
    p.currentHP   = Math.min(p.currentHP   + (newMaxHP   - p.maxHP),   newMaxHP);
    p.currentSoul = Math.min(p.currentSoul + (newMaxSoul - p.maxSoul), newMaxSoul);
    p.maxHP = newMaxHP; p.maxSoul = newMaxSoul;
    window.GameEventBus.emit('player:levelup', { newLevel: p.level, stats: p.stats });
    window.GameEventBus.emit('levelup:skillcheck', { level: p.level });
  }
  updateHUD();
}

/* ══════════════════════════════════════════════════════════════════════
   7. HUD Helpers
   ══════════════════════════════════════════════════════════════════════ */
function updateHUD() {
  const p = window.GameState.player;
  const hpPct  = Math.max(0, p.currentHP   / p.maxHP   * 100);
  const sPct   = Math.max(0, p.currentSoul / p.maxSoul * 100);
  const xpPct  = p.xp / p.xpToNext * 100;
  // step1 IDs
  const s = (id) => document.getElementById(id);
  if (s('bar-hp'))   s('bar-hp').style.width   = hpPct + '%';
  if (s('bar-soul')) s('bar-soul').style.width = sPct  + '%';
  if (s('bar-xp'))   s('bar-xp').style.width   = xpPct + '%';
  if (s('val-hp'))   s('val-hp').textContent   = `${Math.ceil(p.currentHP)}/${p.maxHP}`;
  if (s('val-soul')) s('val-soul').textContent = `${Math.ceil(p.currentSoul)}/${p.maxSoul}`;
  if (s('val-xp'))   s('val-xp').textContent   = `${Math.floor(p.xp)}/${p.xpToNext}`;
  if (s('player-level')) s('player-level').textContent = `Lv. ${p.level}`;
  // step3 IDs
  if (s('bar-hp-fill'))   s('bar-hp-fill').style.width   = hpPct + '%';
  if (s('bar-soul-fill')) s('bar-soul-fill').style.width = sPct  + '%';
  if (s('bar-xp-fill'))   s('bar-xp-fill').style.width   = xpPct + '%';
  if (s('bar-hp-value'))   s('bar-hp-value').textContent   = `${Math.ceil(p.currentHP)}/${p.maxHP}`;
  if (s('bar-soul-value')) s('bar-soul-value').textContent = `${Math.ceil(p.currentSoul)}/${p.maxSoul}`;
  if (s('bar-xp-value'))   s('bar-xp-value').textContent   = `${Math.floor(p.xp)}/${p.xpToNext}`;
  if (s('portrait-level'))     s('portrait-level').textContent     = `Lv.${p.level}`;
  if (s('hud-prestige-badge')) s('hud-prestige-badge').textContent = `Prestige ×${p.prestigeCount || 0}`;
}
function originLabel(id) {
  return { wandering_monk:'Wandering Monk', fallen_noble:'Fallen Noble', beast_tamer:'Beast Tamer' }[id] || id;
}
function updateSkillCooldownUI(slotIndex, cdRemain, cdTotal) {
  const slot = document.getElementById(`slot-${slotIndex}`);
  if (slot) {
    if (cdRemain <= 0) {
      slot.classList.remove('on-cooldown');
      const ov = slot.querySelector('.skill-cd-overlay'); if (ov) ov.remove();
    } else {
      slot.classList.add('on-cooldown');
      let ov = slot.querySelector('.skill-cd-overlay');
      if (!ov) { ov = document.createElement('div'); ov.className = 'skill-cd-overlay'; slot.appendChild(ov); }
      ov.textContent = cdRemain.toFixed(1);
    }
  }
  const sweep = document.getElementById(`cd-sweep-${slotIndex}`);
  const overlay = document.getElementById(`cd-overlay-${slotIndex}`);
  if (sweep) {
    if (cdRemain <= 0) {
      sweep.classList.remove('active'); sweep.style.removeProperty('--cd-pct');
      if (overlay) overlay.textContent = '';
    } else {
      const pct = (cdRemain / (cdTotal || 1)) * 100;
      sweep.classList.add('active'); sweep.style.setProperty('--cd-pct', pct.toFixed(1) + '%');
      if (overlay) overlay.textContent = Math.ceil(cdRemain);
    }
  }
}
function flashLevelUp() {
  const el = document.getElementById('levelup-flash');
  if (!el) return;
  el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 1800);
}
function addKillFeed(monsterName) {
  const feed = document.getElementById('kill-feed');
  if (!feed) return;
  const el = document.createElement('div');
  el.className = 'kill-entry'; el.textContent = `✦ ${monsterName} slain`;
  feed.appendChild(el); setTimeout(() => el.remove(), 3000);
}

/* ══════════════════════════════════════════════════════════════════════
   8. EventBus UI bindings
   ══════════════════════════════════════════════════════════════════════ */
window.GameEventBus.on('player:damaged',  ({ amount, currentHP }) => { window.GameState.player.currentHP = currentHP; updateHUD(); });
window.GameEventBus.on('player:healed',   ({ amount, currentHP }) => { window.GameState.player.currentHP = currentHP; updateHUD(); });
window.GameEventBus.on('player:levelup',  () => { flashLevelUp(); updateHUD(); });
window.GameEventBus.on('monster:died',    ({ monster }) => addKillFeed(monster.name));
window.GameEventBus.on('xp:gained',       updateHUD);
window.GameEventBus.on('prestige:available', () => {
  window.GameState.prestigeReady = true;
  const banner = document.getElementById('prestige-banner');
  if (banner) { banner.classList.add('show'); setTimeout(() => banner.classList.remove('show'), 5000); }
});
window.GameEventBus.on('area:entered', ({ areaId, name }) => {
  const area = window.WorldData.areas[areaId];
  const areaName = name || (area && area.name) || areaId;
  const el  = document.getElementById('area-name');      if (el)  el.textContent  = areaName;
  const el2 = document.getElementById('area-name-text'); if (el2) el2.textContent = areaName;
  window.GameState.currentArea = areaId;
});
window._onSkillClick = (slotIndex) => window.GameEventBus.emit('ui:skillclick', { slotIndex });
window._onRespawn    = () => window.GameEventBus.emit('ui:respawn');

/* ══════════════════════════════════════════════════════════════════════
   9. PHASER 3 — Main Game Scene
   ══════════════════════════════════════════════════════════════════════ */
const TILE_SIZE       = 32;
const MAP_TILES_W     = 75;
const MAP_TILES_H     = 75;
const PLAYER_SPEED    = 140;
const ATTACK_RANGE    = 90;
const SOUL_REGEN_RATE = 3;
const skillCooldowns  = [0, 0, 0, 0, 0, 0];

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.player = null; this.monsters = []; this.damageTexts = [];
    this.projectiles = [];  // ← ROTMG-style live projectiles
    this.particles = []; this.playerDead = false; this.inputFrozen = false;
    this.autoAttackTimer = 0; this.soulRegenTimer = 0;
    this.dashActive = false; this.dashTimer = 0; this.dashVelX = 0; this.dashVelY = 0;
    this._monsterBarEls = {}; this._fps = 0; this._fpsFrames = 0; this._fpsLast = 0;
    this.areaId = window.GameState.currentArea;
  }

  preload() {}

  create() {
    const areaData = window.WorldData.areas[this.areaId] || window.WorldData.areas['ashveil_ruins'];
    this.areaData = areaData;
    const worldW = MAP_TILES_W * TILE_SIZE;
    const worldH = MAP_TILES_H * TILE_SIZE;
    if (!areaData.tileVariant && areaData.tileset)
      areaData.tileVariant = (areaData.id || '').includes('ruins') ? 'dungeon' : 'wasteland';
    this._buildTilemap(worldW, worldH, areaData.tileVariant || 'dungeon');
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this._createPlayer(worldW, worldH);
    this.spawnMonsters(this.areaId);
    this._createExitZones(areaData);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0);
    this.cursors   = this.input.keyboard.createCursorKeys();
    this.wasd      = this.input.keyboard.addKeys({ up:'W', down:'S', left:'A', right:'D' });
    this.skillKeys = this.input.keyboard.addKeys({ k1:'ONE', k2:'TWO', k3:'THREE', k4:'FOUR', k5:'FIVE', k6:'SIX' });
    this.input.on('pointerdown', this._onPointerDown, this);
    this.input.on('pointermove', this._onPointerHold, this);
    window.GameEventBus.on('ui:skillclick', ({ slotIndex }) => this._activateSkillSlot(slotIndex));
    window.GameEventBus.on('ui:respawn', () => this._respawnPlayer());
    const p = window.GameState.player;
    p.maxHP   = window.GameData.calcMaxHP(p.stats.vit, p.level);
    p.maxSoul = window.GameData.calcMaxSoul(p.stats.wis, p.level);
    p.currentHP = p.maxHP; p.currentSoul = p.maxSoul;
    updateHUD();
    window.GameEventBus.emit('area:entered', { areaId: this.areaId, name: areaData.name });
  }

  /* ────── Tilemap ─────────────────────────────────────────────────── */
  _buildTilemap(worldW, worldH, variant) {
    const gfx = this.add.graphics();
    const ts = TILE_SIZE, cols = Math.ceil(worldW / ts), rows = Math.ceil(worldH / ts);
    const isDungeon = variant === 'dungeon';
    const floorColors = isDungeon
      ? [0x1a1520, 0x1e1828, 0x18151e, 0x211c2a]
      : [0x2a1e10, 0x2e200e, 0x261a0c, 0x321f0a];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        gfx.fillStyle(floorColors[(c + r * 3) % floorColors.length]);
        gfx.fillRect(c * ts, r * ts, ts, ts);
      }
    gfx.lineStyle(1, isDungeon ? 0x2a2035 : 0x352015, 0.25);
    for (let r = 0; r <= rows; r++) gfx.lineBetween(0, r * ts, worldW, r * ts);
    for (let c = 0; c <= cols; c++) gfx.lineBetween(c * ts, 0, c * ts, worldH);
    this._buildObstacles(gfx, worldW, worldH, isDungeon);
    const vigGfx = this.add.graphics().setDepth(200);
    const vigColors = isDungeon ? 0x0a0812 : 0x100804;
    for (let i = 0; i < 5; i++) {
      vigGfx.lineStyle(18 - i * 2, vigColors, 0.25 - i * 0.04);
      vigGfx.strokeRect(i * 10, i * 10, worldW - i * 20, worldH - i * 20);
    }
  }
  _buildObstacles(gfx, worldW, worldH, isDungeon) {
    const ts = TILE_SIZE, count = 120;
    const occupiedCells = new Set(), reservedCenter = { cx:1200, cy:1200, r:200 };
    const stoneColor = isDungeon ? 0x3a3045 : 0x3a2810;
    const detailColor = isDungeon ? 0x2a2035 : 0x2a1a08;
    this.solidTiles = [];
    for (let i = 0; i < count; i++) {
      const gx = Phaser.Math.Between(2, Math.floor(worldW / ts) - 3);
      const gy = Phaser.Math.Between(2, Math.floor(worldH / ts) - 3);
      const key = `${gx},${gy}`;
      const wx = gx * ts + ts / 2, wy = gy * ts + ts / 2;
      if (Phaser.Math.Distance.Between(wx, wy, reservedCenter.cx, reservedCenter.cy) < reservedCenter.r) continue;
      if (occupiedCells.has(key)) continue;
      occupiedCells.add(key);
      const w = ts + Phaser.Math.Between(-8, 8), h = ts + Phaser.Math.Between(-6, 6);
      gfx.fillStyle(stoneColor); gfx.fillRect(gx * ts, gy * ts, w, h);
      gfx.fillStyle(detailColor, 0.6); gfx.fillRect(gx * ts + 4, gy * ts + 3, w - 8, h - 7);
      this.solidTiles.push(new Phaser.Geom.Rectangle(gx * ts, gy * ts, w, h));
    }
  }

  /* ────── Player ──────────────────────────────────────────────────── */
  _createPlayer(worldW, worldH) {
    const startX = worldW * 0.1, startY = worldH * 0.5;
    this.player = this.add.graphics().setDepth(10);
    this._drawPlayerGraphic(this.player, false);
    this.player.x = startX; this.player.y = startY;
    this.player.vx = 0; this.player.vy = 0;
    this.playerShadow = this.add.ellipse(startX, startY + 12, 28, 8, 0x000000, 0.4).setDepth(9);
    this.playerGlow   = this.add.ellipse(startX, startY, 36, 36, 0x6633cc, 0.08).setDepth(8);
    // No more attackArc graphic — replaced by slash/projectile VFX
  }
  _drawPlayerGraphic(gfx, isDashing) {
    gfx.clear();
    const baseColor = isDashing ? 0x88aaff : 0x7744cc;
    const rimColor  = isDashing ? 0xaaddff : 0xaa77ff;
    const coreColor = isDashing ? 0xeef5ff : 0xddbbff;
    gfx.fillStyle(baseColor); gfx.fillCircle(0, 0, 14);
    gfx.lineStyle(2, rimColor, 0.8); gfx.strokeCircle(0, 0, 14);
    gfx.fillStyle(coreColor, 0.9); gfx.fillCircle(0, -3, 4);
    gfx.fillStyle(rimColor, 0.6); gfx.fillTriangle(0, -14, -4, -8, 4, -8);
  }

  /* ────── Monster Spawning ────────────────────────────────────────── */
  spawnMonsters(areaId) {
    this.monsters.forEach(m => { m.gfx && m.gfx.destroy(); m.shadow && m.shadow.destroy(); });
    this.monsters = []; window.GameState.monstersAlive = [];
    const bars = document.getElementById('monster-bars'); if (bars) bars.innerHTML = '';
    this._monsterBarEls = {};
    const area = window.WorldData.areas[areaId]; if (!area) return;
    if (area.spawnPoints) {
      area.spawnPoints.forEach(sp => {
        (sp.monsterTable || []).forEach(entry => {
          const monDef = window.WorldData.getMonster ? window.WorldData.getMonster(entry.monsterId) : null;
          if (!monDef) return;
          const tpl = this._toSpawnTpl(monDef);
          const cnt = Phaser.Math.Between(entry.minCount || 1, entry.maxCount || 1);
          for (let i = 0; i < cnt; i++)
            this._spawnMonster(tpl, sp.x + Phaser.Math.Between(-60,60), sp.y + Phaser.Math.Between(-60,60), entry.monsterId);
        });
      });
    } else if (area.spawns) {
      area.spawns.forEach(sg => {
        const tpl = window.WorldData.monsterTemplates && window.WorldData.monsterTemplates[sg.type];
        if (!tpl) return;
        for (let i = 0; i < sg.count; i++)
          this._spawnMonster(tpl, sg.x + Phaser.Math.Between(-40,40), sg.y + Phaser.Math.Between(-40,40), sg.type);
      });
    }
  }
  _toSpawnTpl(monDef) {
    const tierColors = { normal:0x5a3080, rare:0x3060b0, boss:0xb03020, unique:0xd07020 };
    return {
      name: monDef.displayName || monDef.name,
      maxHP: monDef.maxHP || 100,
      stats: monDef.stats || { str:10, dex:10, vit:10, int:8, wis:8, luk:5 },
      speed: monDef.moveSpeed || 60,
      aggroRange: monDef.aggroRange || 150,
      attackRange: monDef.attackRange || 40,
      attackSpeed: monDef.attackSpeed || 1.0,
      damage: monDef.attackDamage ? Math.floor((monDef.attackDamage.min + monDef.attackDamage.max) / 2) : 10,
      xpReward: monDef.xpReward || 20,
      color: tierColors[monDef.tier] || 0x5a3080,
    };
  }
  _spawnMonster(tpl, x, y, typeId) {
    const id = `monster_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const gfx = this.add.graphics().setDepth(10);
    const shadow = this.add.ellipse(x, y + 10, 24, 7, 0x000000, 0.35).setDepth(9);
    this._drawMonsterGraphic(gfx, tpl.color, false, tpl.name);
    gfx.x = x; gfx.y = y;
    const monster = {
      id, typeId, name: tpl.name, maxHP: tpl.maxHP, currentHP: tpl.maxHP,
      stats: { ...tpl.stats }, speed: tpl.speed, aggroRange: tpl.aggroRange,
      attackRange: tpl.attackRange, attackSpeed: tpl.attackSpeed,
      damage: tpl.damage, xpReward: tpl.xpReward, color: tpl.color,
      x, y, vx:0, vy:0, state:'idle', attackTimer:0, gfx, shadow, dead:false, deathTimer:0,
    };
    this.monsters.push(monster);
    window.GameState.monstersAlive.push(monster);
    this._createMonsterHPBar(monster);
    return monster;
  }
  _drawMonsterGraphic(gfx, color, isAggro, name) {
    gfx.clear();
    gfx.fillStyle(color); gfx.fillCircle(0, 0, 11);
    gfx.lineStyle(1.5, isAggro ? 0xff4444 : 0x000000, 0.6); gfx.strokeCircle(0, 0, 11);
    if (isAggro) { gfx.lineStyle(1, 0xff3333, 0.5); gfx.strokeCircle(0, 0, 15); }
    gfx.fillStyle(0xff2222); gfx.fillCircle(-3.5, -2, 2.2); gfx.fillCircle(3.5, -2, 2.2);
    gfx.fillStyle(0xffaaaa, 0.7); gfx.fillCircle(-3, -2.5, 0.8); gfx.fillCircle(4, -2.5, 0.8);
  }
  _createMonsterHPBar(monster) {
    const container = document.getElementById('monster-bars'); if (!container) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'monster-hpbar'; wrapper.id = `mbar-${monster.id}`;
    wrapper.style.cssText = 'position:absolute;transform:translate(-50%,-100%);';
    const nameEl = document.createElement('div'); nameEl.className = 'monster-name-label'; nameEl.textContent = monster.name;
    const track = document.createElement('div'); track.className = 'monster-hp-track';
    const fill  = document.createElement('div'); fill.className  = 'monster-hp-fill'; fill.style.width = '100%';
    track.appendChild(fill); wrapper.appendChild(nameEl); wrapper.appendChild(track); container.appendChild(wrapper);
    this._monsterBarEls[monster.id] = { wrapper, fill };
  }
  _updateMonsterHPBar(monster) {
    const els = this._monsterBarEls[monster.id]; if (!els) return;
    const cam = this.cameras.main, canvas = this.sys.game.canvas, rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width, scaleY = rect.height / canvas.height;
    els.wrapper.style.left = ((monster.x - cam.scrollX) * cam.zoom * scaleX + rect.left) + 'px';
    els.wrapper.style.top  = ((monster.y - cam.scrollY - 20) * cam.zoom * scaleY + rect.top) + 'px';
    els.fill.style.width = Math.max(0, monster.currentHP / monster.maxHP * 100) + '%';
    if (monster.dead) els.wrapper.style.display = 'none';
  }

  /* ────── Exit Zones ──────────────────────────────────────────────── */
  _createExitZones(areaData) {
    this.exitZones = [];
    if (!areaData.exits) return;
    areaData.exits.forEach(exit => {
      const zone   = this.add.rectangle(exit.x, exit.y, 48, 48, 0xc8973a, 0.18).setDepth(1);
      const border = this.add.rectangle(exit.x, exit.y, 48, 48).setDepth(2);
      border.setStrokeStyle(2, 0xc8973a, 0.6);
      this.add.text(exit.x, exit.y - 32, '→ EXIT', { fontFamily:'Satoshi,sans-serif', fontSize:'10px', color:'#c8973a', alpha:0.7 }).setOrigin(0.5).setDepth(2);
      this.tweens.add({ targets:[zone,border], alpha:{from:0.12,to:0.35}, duration:1200, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
      this.exitZones.push({ zone, targetAreaId: exit.targetAreaId, x: exit.x, y: exit.y });
    });
  }

  /* ────── Main Update Loop ────────────────────────────────────────── */
  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    if (this.playerDead) return;
    this._updateDebugOverlay(time);
    this._handlePlayerMovement(dt);
    this._handleSkillKeys();
    this._updateDash(dt);
    this._updateMonsters(dt);
    this._updateProjectiles(dt);   // ← new
    this._updateDamageTexts(dt);
    this._updateParticles(dt);
    this._updateAutoAttack(dt);
    this._updateSoulRegen(dt);
    this._checkExitZones();
    this._syncMonsterBars();
  }

  _updateDebugOverlay(time) {
    this._fpsFrames++;
    if (time - this._fpsLast >= 1000) {
      this._fps = Math.round(this._fpsFrames * 1000 / (time - this._fpsLast));
      this._fpsFrames = 0; this._fpsLast = time;
      const p = window.GameState.player;
      const el = document.getElementById('debug-overlay');
      if (el) el.textContent = `FPS:${this._fps}  Monsters:${this.monsters.filter(m=>!m.dead).length}  Player:(${Math.floor(this.player.x)},${Math.floor(this.player.y)})  HP:${Math.ceil(p.currentHP)}/${p.maxHP}`;
    }
  }

  /* ────── Movement ────────────────────────────────────────────────── */
  _handlePlayerMovement(dt) {
    if (this.inputFrozen || this.dashActive) return;
    const c = this.cursors, w = this.wasd;
    let vx = 0, vy = 0;
    if (c.left.isDown  || w.left.isDown)  vx -= 1;
    if (c.right.isDown || w.right.isDown) vx += 1;
    if (c.up.isDown    || w.up.isDown)    vy -= 1;
    if (c.down.isDown  || w.down.isDown)  vy += 1;
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    const nx = Phaser.Math.Clamp(this.player.x + vx * PLAYER_SPEED * dt, 16, 2400-16);
    const ny = Phaser.Math.Clamp(this.player.y + vy * PLAYER_SPEED * dt, 16, 2400-16);
    let blocked = false;
    for (const tile of this.solidTiles) { if (tile.contains(nx, ny)) { blocked = true; break; } }
    if (!blocked) { this.player.x = nx; this.player.y = ny; }
    if (vx !== 0 || vy !== 0) this.player.rotation = Math.atan2(vy, vx) + Math.PI / 2;
    this.playerShadow.setPosition(this.player.x, this.player.y + 12);
    this.playerGlow.setPosition(this.player.x, this.player.y);
  }
  _handleSkillKeys() {
    const sk = this.skillKeys, jd = Phaser.Input.Keyboard.JustDown;
    if (jd(sk.k1)) this._activateSkillSlot(0);
    if (jd(sk.k2)) this._activateSkillSlot(1);
    if (jd(sk.k3)) this._activateSkillSlot(2);
    if (jd(sk.k4)) this._activateSkillSlot(3);
    if (jd(sk.k5)) this._activateSkillSlot(4);
    if (jd(sk.k6)) this._activateSkillSlot(5);
  }

  /* ────── Skill Activation ────────────────────────────────────────── */
  _activateSkillSlot(slotIndex) {
    if (this.inputFrozen) return;
    const p = window.GameState.player;
    const skill = p.skills[slotIndex]; if (!skill) return;
    if (skillCooldowns[slotIndex] > 0) return;
    if (skill.soulCost > 0 && p.currentSoul < skill.soulCost) {
      this._spawnFloatingText(this.player.x, this.player.y - 20, 'No Soul', 0x4466aa); return;
    }
    if (skill.isDash) {
      this._triggerDash(skill); p.currentSoul -= skill.soulCost;
      skillCooldowns[slotIndex] = skill.cooldown;
      window.GameEventBus.emit('skill:used', { skillId: skill.id, targets: [] });
      updateHUD(); return;
    }
    p.currentSoul -= skill.soulCost; updateHUD();
    const targets  = this._getSkillTargets(skill);
    const rawDmg   = calcSkillDamage(skill, p.stats);
    const hitTargets = [];
    targets.forEach(monster => {
      const { finalDamage, isCrit } = applyDamageToTarget(rawDmg, skill, 0, monster.currentHP);
      this._damageMonster(monster, finalDamage, isCrit, skill);
      hitTargets.push(monster.id);
    });
    // ── VFX dispatch ──────────────────────────────────────────────────
    const vfx = skill.vfx;
    if (vfx) {
      if (vfx.type === 'slash') {
        this._spawnSlashVFX(this.player.x, this.player.y, this.player.rotation, vfx);
      } else if (vfx.type === 'projectile_burst') {
        this._spawnProjectileBurst(this.player.x, this.player.y, vfx, targets);
      } else if (vfx.type === 'projectile') {
        const target = targets[0];
        if (target) this._spawnProjectile(this.player.x, this.player.y, target.x, target.y, vfx, target);
      }
    }
    skillCooldowns[slotIndex] = skill.cooldown;
    window.GameEventBus.emit('skill:used', { skillId: skill.id, targets: hitTargets });
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) { slotEl.classList.add('active'); setTimeout(() => slotEl.classList.remove('active'), 200); }
  }
  _getSkillTargets(skill) {
    if (skill.isDash) return [];
    const alive = this.monsters.filter(m => !m.dead); if (!alive.length) return [];
    if (skill.aoe)
      return alive.filter(m => Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y) <= skill.aoeRadius);
    let nearest = null, nearestDist = Infinity;
    alive.forEach(m => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, m.x, m.y);
      if (d <= (skill.range || ATTACK_RANGE) && d < nearestDist) { nearest = m; nearestDist = d; }
    });
    return nearest ? [nearest] : [];
  }
  _damageMonster(monster, amount, isCrit, skill) {
    monster.currentHP -= amount;
    const color = isCrit ? 0xffdd44 : (skill && skill.type === 'magical' ? 0x88ccff : 0xff4444);
    this._spawnFloatingText(monster.x, monster.y - 16, isCrit ? `${amount}!` : `${amount}`, color);
    window.GameEventBus.emit('monster:damaged', { monsterId: monster.id, amount, currentHP: monster.currentHP });
    this.tweens.add({ targets: monster.gfx, x: monster.x + Phaser.Math.Between(-5, 5), duration: 60, yoyo: true });
    if (monster.currentHP <= 0) this._killMonster(monster);
  }
  _killMonster(monster) {
    if (monster.dead) return;
    monster.dead = true; monster.state = 'dead';
    window.GameState.monstersAlive = window.GameState.monstersAlive.filter(m => m.id !== monster.id);
    window.GameEventBus.emit('monster:died', { monster: { ...monster }, position: { x: monster.x, y: monster.y } });
    grantXP(monster.xpReward);
    this._spawnDeathVFX(monster.x, monster.y, monster.color);
    this.tweens.add({
      targets: [monster.gfx, monster.shadow], alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 350, ease: 'Quad.easeOut',
      onComplete: () => { monster.gfx.destroy(); monster.shadow.destroy(); }
    });
  }

  /* ────── Auto-attack ─────────────────────────────────────────────── */
  _onPointerDown(pointer) { if (!this.inputFrozen) this._activateSkillSlot(0); }
  _onPointerHold(pointer) { /* auto handled by timer */ }
  _updateAutoAttack(dt) {
    if (this.inputFrozen) return;
    this.autoAttackTimer += dt;
    if (this.autoAttackTimer < 0.5) return;
    if (this.input.activePointer.isDown) { this.autoAttackTimer = 0; this._activateSkillSlot(0); }
  }

  /* ────── Cooldown / soul regen ───────────────────────────────────── */
  _updateSoulRegen(dt) {
    const p = window.GameState.player;
    if (p.currentSoul < p.maxSoul) {
      p.currentSoul = Math.min(p.maxSoul, p.currentSoul + SOUL_REGEN_RATE * dt);
      this.soulRegenTimer = (this.soulRegenTimer || 0) + dt;
      if (this.soulRegenTimer >= 0.5) { this.soulRegenTimer = 0; updateHUD(); }
    }
    for (let i = 0; i < skillCooldowns.length; i++) {
      if (skillCooldowns[i] > 0) {
        skillCooldowns[i] = Math.max(0, skillCooldowns[i] - dt);
        updateSkillCooldownUI(i, skillCooldowns[i], window.GameState.player.skills[i]?.cooldown || 1);
      }
    }
  }

  /* ────── Dash ────────────────────────────────────────────────────── */
  _triggerDash(skill) {
    const c = this.cursors, w = this.wasd;
    let vx = 0, vy = 0;
    if (c.left.isDown  || w.left.isDown)  vx -= 1;
    if (c.right.isDown || w.right.isDown) vx += 1;
    if (c.up.isDown    || w.up.isDown)    vy -= 1;
    if (c.down.isDown  || w.down.isDown)  vy += 1;
    if (vx === 0 && vy === 0) vy = -1;
    const len = Math.sqrt(vx*vx + vy*vy); vx /= len; vy /= len;
    this.dashActive = true; this.dashTimer = skill.dashDuration;
    this.dashVelX = vx * (skill.dashDistance / skill.dashDuration);
    this.dashVelY = vy * (skill.dashDistance / skill.dashDuration);
    this.playerGlow.setAlpha(0.6);
    this._drawPlayerGraphic(this.player, true);
    this._spawnDashVFX(this.player.x, this.player.y);
  }
  _updateDash(dt) {
    if (!this.dashActive) return;
    this.dashTimer -= dt;
    if (this.dashTimer <= 0) {
      this.dashActive = false; this.dashVelX = 0; this.dashVelY = 0;
      this._drawPlayerGraphic(this.player, false); this.playerGlow.setAlpha(0.08); return;
    }
    const nx = Phaser.Math.Clamp(this.player.x + this.dashVelX * dt, 16, 2400-16);
    const ny = Phaser.Math.Clamp(this.player.y + this.dashVelY * dt, 16, 2400-16);
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
      if (monster.state === 'idle'   && dist < monster.aggroRange)           monster.state = 'chase';
      if (monster.state === 'chase'  && dist <= monster.attackRange)         monster.state = 'attack';
      if (monster.state === 'attack' && dist > monster.attackRange * 1.5)    monster.state = 'chase';
      if (prevState !== monster.state && (monster.state === 'chase' || monster.state === 'attack'))
        this._drawMonsterGraphic(monster.gfx, monster.color, true, monster.name);
      else if (prevState !== 'idle' && monster.state === 'idle')
        this._drawMonsterGraphic(monster.gfx, monster.color, false, monster.name);
      if (monster.state === 'chase' || monster.state === 'attack') {
        const dx = px - monster.x, dy = py - monster.y, len = Math.sqrt(dx*dx + dy*dy);
        if (len > 0 && monster.state === 'chase') { monster.vx = (dx/len)*monster.speed; monster.vy = (dy/len)*monster.speed; }
        else { monster.vx = 0; monster.vy = 0; }
      } else {
        if (!monster.idleTimer || monster.idleTimer <= 0) {
          monster.idleTimer = Phaser.Math.FloatBetween(1.5, 4);
          monster.idleVx = Phaser.Math.FloatBetween(-0.3, 0.3);
          monster.idleVy = Phaser.Math.FloatBetween(-0.3, 0.3);
        }
        monster.idleTimer -= dt; monster.vx = monster.idleVx * 20; monster.vy = monster.idleVy * 20;
      }
      if (monster.vx !== 0 || monster.vy !== 0) {
        const nx = Phaser.Math.Clamp(monster.x + monster.vx * dt, 16, 2400-16);
        const ny = Phaser.Math.Clamp(monster.y + monster.vy * dt, 16, 2400-16);
        let blocked = false;
        for (const tile of this.solidTiles) { if (tile.contains(nx, ny)) { blocked = true; break; } }
        if (!blocked) { monster.x = nx; monster.y = ny; }
        monster.gfx.x = monster.x; monster.gfx.y = monster.y;
        monster.shadow.setPosition(monster.x, monster.y + 10);
      }
      if (monster.state === 'attack' && !this.dashActive) {
        monster.attackTimer += dt;
        const interval = 1 / monster.attackSpeed;
        if (monster.attackTimer >= interval) { monster.attackTimer = 0; this._monsterAttackPlayer(monster); }
      } else { monster.attackTimer = 0; }
    });
  }
  _monsterAttackPlayer(monster) {
    const p = window.GameState.player;
    const dmg = Math.max(1, monster.damage - Math.floor(p.stats.vit * 0.5));
    p.currentHP = Math.max(0, p.currentHP - dmg);
    this._spawnFloatingText(this.player.x, this.player.y - 20, `-${dmg}`, 0xff4444);
    this._flashPlayerHit();
    window.GameEventBus.emit('player:damaged', { amount: dmg, currentHP: p.currentHP, maxHP: p.maxHP });
    updateHUD();
    if (p.currentHP <= 0) this._playerDeath();
  }
  _flashPlayerHit() {
    this.playerGlow.setFillStyle(0xff2222, 0.4);
    this.tweens.add({
      targets: this.playerGlow, alpha: { from:0.4, to:0.08 }, duration: 250, ease: 'Quad.easeOut',
      onComplete: () => this.playerGlow.setFillStyle(0x6633cc, 0.08),
    });
  }

  /* ────── Player Death / Respawn ──────────────────────────────────── */
  _playerDeath() {
    if (this.playerDead) return;
    this.playerDead = true; this.inputFrozen = true;
    this._spawnDeathVFX(this.player.x, this.player.y, 0x7744cc);
    const overlay = document.getElementById('death-overlay');
    if (overlay) overlay.classList.add('show');
    window.GameEventBus.emit('player:died', {});
  }
  _respawnPlayer() {
    const p = window.GameState.player;
    p.currentHP = p.maxHP; p.currentSoul = p.maxSoul;
    this.player.x = 240; this.player.y = 1200;
    this.playerDead = false; this.inputFrozen = false;
    const overlay = document.getElementById('death-overlay'); if (overlay) overlay.classList.remove('show');
    updateHUD(); window.GameEventBus.emit('player:respawned', {});
  }

  /* ══════════════════════════════════════════════════════════════════
     VFX — SLASH (melee)
     Draws a fast pie-slice arc + 2 motion lines in the attack direction.
     Vanishes in ~180ms.
     ══════════════════════════════════════════════════════════════════ */
  _spawnSlashVFX(x, y, playerRotation, vfxCfg) {
    const color   = vfxCfg.color || 0xffcc66;
    const halfAng = Phaser.Math.DegToRad((vfxCfg.sweepAngle || 90) / 2);
    const radius  = vfxCfg.width || 60;

    // Attack direction = player's facing (rotation - π/2 because sprite points up)
    const facingAngle = playerRotation - Math.PI / 2;

    const slash = this.add.graphics().setDepth(20);
    slash.x = x; slash.y = y;

    // Pie-slice fill (sword sweep)
    slash.fillStyle(color, 0.55);
    slash.beginPath();
    slash.moveTo(0, 0);
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const a = facingAngle - halfAng + (halfAng * 2 * i / steps);
      slash.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    slash.closePath();
    slash.fillPath();

    // Leading edge bright arc line
    slash.lineStyle(2, color, 0.9);
    slash.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = facingAngle - halfAng + (halfAng * 2 * i / steps);
      const rx = Math.cos(a) * radius, ry = Math.sin(a) * radius;
      i === 0 ? slash.moveTo(rx, ry) : slash.lineTo(rx, ry);
    }
    slash.strokePath();

    // Two speed lines radiating from origin
    slash.lineStyle(1.5, color, 0.7);
    for (let s = -1; s <= 1; s += 2) {
      const sa = facingAngle + s * halfAng * 0.6;
      slash.lineBetween(0, 0, Math.cos(sa) * radius * 1.15, Math.sin(sa) * radius * 1.15);
    }

    // Fade out quickly
    this.tweens.add({
      targets: slash, alpha: 0, duration: 180, ease: 'Quad.easeOut',
      onComplete: () => slash.destroy(),
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     VFX — PROJECTILE (single shot, travels to target)
     ROTMG-style: orb that flies toward the target position and
     explodes into a small burst on impact.
     ══════════════════════════════════════════════════════════════════ */
  _spawnProjectile(ox, oy, tx, ty, vfxCfg, hitTarget) {
    const color  = vfxCfg.color || 0x88ccff;
    const speed  = vfxCfg.speed || 300;
    const size   = vfxCfg.size  || 6;
    const dx = tx - ox, dy = ty - oy;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const vx = (dx / dist) * speed, vy = (dy / dist) * speed;

    const gfx = this.add.graphics().setDepth(18);
    gfx.x = ox; gfx.y = oy;
    gfx.fillStyle(0xffffff, 0.95); gfx.fillCircle(0, 0, size * 0.4);  // white core
    gfx.fillStyle(color, 0.8);     gfx.fillCircle(0, 0, size);          // coloured body
    gfx.lineStyle(1, 0xffffff, 0.5); gfx.strokeCircle(0, 0, size);      // rim

    // Trail
    const trail = this.add.graphics().setDepth(17);
    trail.fillStyle(color, 0.25); trail.fillCircle(ox, oy, size * 0.6);

    const proj = {
      gfx, trail, vx, vy, tx, ty, hitTarget,
      color, size,
      life: dist / speed + 0.05,   // max lifetime = travel time + small buffer
      age: 0, hit: false,
    };
    this.projectiles.push(proj);
  }

  /* ══════════════════════════════════════════════════════════════════
     VFX — PROJECTILE BURST (Soul Pulse: fires N orbs in all directions)
     Each orb travels outward for the skill's aoeRadius distance,
     damaging the first monster it touches.
     ══════════════════════════════════════════════════════════════════ */
  _spawnProjectileBurst(ox, oy, vfxCfg, targets) {
    const count  = vfxCfg.count  || 8;
    const color  = vfxCfg.color  || 0x88ccff;
    const speed  = vfxCfg.speed  || 320;
    const size   = vfxCfg.size   || 7;
    const range  = 200;   // how far each orb travels

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const tx = ox + Math.cos(angle) * range;
      const ty = oy + Math.sin(angle) * range;

      const gfx = this.add.graphics().setDepth(18);
      gfx.x = ox; gfx.y = oy;
      gfx.fillStyle(0xffffff, 0.95); gfx.fillCircle(0, 0, size * 0.35);
      gfx.fillStyle(color, 0.85);    gfx.fillCircle(0, 0, size);
      gfx.lineStyle(1, 0xffffff, 0.4); gfx.strokeCircle(0, 0, size);

      const proj = {
        gfx, trail: null, vx, vy, tx, ty,
        hitTarget: null,          // burst orbs hit on collision check, not on arrival
        color, size,
        life: range / speed + 0.05,
        age: 0, hit: false,
        isBurst: true,
      };
      this.projectiles.push(proj);
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     Update all live projectiles each frame
     ══════════════════════════════════════════════════════════════════ */
  _updateProjectiles(dt) {
    const toRemove = [];

    this.projectiles.forEach((proj, idx) => {
      proj.age += dt;
      if (proj.hit || proj.age > proj.life) {
        proj.gfx.destroy();
        if (proj.trail) proj.trail.destroy();
        toRemove.push(idx);
        return;
      }

      // Move
      proj.gfx.x += proj.vx * dt;
      proj.gfx.y += proj.vy * dt;

      // Burst orbs: check collision with monsters
      if (proj.isBurst) {
        const alive = this.monsters.filter(m => !m.dead);
        for (const monster of alive) {
          const d = Phaser.Math.Distance.Between(proj.gfx.x, proj.gfx.y, monster.x, monster.y);
          if (d < 14 + proj.size) {
            proj.hit = true;
            this._projectileImpact(proj.gfx.x, proj.gfx.y, proj.color, proj.size);
            toRemove.push(idx);
            break;
          }
        }
      }

      // Single-target projectile: check arrival near target
      if (!proj.isBurst && proj.hitTarget) {
        const d = Phaser.Math.Distance.Between(proj.gfx.x, proj.gfx.y, proj.hitTarget.x, proj.hitTarget.y);
        if (d < 16) {
          proj.hit = true;
          this._projectileImpact(proj.gfx.x, proj.gfx.y, proj.color, proj.size);
          toRemove.push(idx);
        }
      }
    });

    // Remove dead projectiles (reverse order to keep indices valid)
    for (let i = toRemove.length - 1; i >= 0; i--)
      this.projectiles.splice(toRemove[i], 1);
  }

  /* Small burst of particles on projectile impact */
  _projectileImpact(x, y, color, size) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = Phaser.Math.Between(6, 20);
      const p = this.add.graphics().setDepth(19);
      p.fillStyle(color, 0.9); p.fillCircle(0, 0, Phaser.Math.Between(1, Math.ceil(size * 0.5)));
      p.x = x; p.y = y;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0, scaleX: 0.3, scaleY: 0.3,
        duration: Phaser.Math.Between(120, 260),
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  /* ────── Floating text ───────────────────────────────────────────── */
  _spawnFloatingText(x, y, text, color = 0xffffff) {
    const layer = document.getElementById('fct-layer'); if (!layer) return;
    const cam = this.cameras.main, canvas = this.sys.game.canvas, rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width, scaleY = rect.height / canvas.height;
    const sx = (x - cam.scrollX) * cam.zoom * scaleX + rect.left;
    const sy = (y - cam.scrollY) * cam.zoom * scaleY + rect.top;
    const hex = '#' + color.toString(16).padStart(6, '0');
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;left:${sx}px;top:${sy}px;font:bold 13px 'Barlow Condensed',sans-serif;color:${hex};text-shadow:0 1px 3px #000;pointer-events:none;white-space:nowrap;animation:fctRise 0.9s ease-out forwards;transform:translateX(-50%);`;
    el.textContent = text; layer.appendChild(el); setTimeout(() => el.remove(), 900);
  }

  /* ────── Death / Dash VFX ────────────────────────────────────────── */
  _spawnDeathVFX(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist  = Phaser.Math.Between(20, 60);
      const p = this.add.graphics().setDepth(15);
      p.fillStyle(color, 0.9); p.fillCircle(0, 0, Phaser.Math.Between(2, 5));
      p.x = x; p.y = y;
      this.tweens.add({
        targets: p, x: x + Math.cos(angle)*dist, y: y + Math.sin(angle)*dist,
        alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: Phaser.Math.Between(300, 600), ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }
  _spawnDashVFX(x, y) {
    const trail = this.add.graphics().setDepth(9);
    trail.fillStyle(0x7744cc, 0.4); trail.fillCircle(0, 0, 12);
    trail.x = x; trail.y = y;
    this.tweens.add({
      targets: trail, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 250, ease: 'Quad.easeOut',
      onComplete: () => trail.destroy(),
    });
  }

  /* ────── (Soul Pulse ring VFX kept as secondary ring under projectiles) */
  _spawnSoulPulseVFX(x, y, radius) {
    const ring = this.add.graphics().setDepth(12);
    ring.lineStyle(2, 0x88ccff, 0.4); ring.strokeCircle(0, 0, 1);
    ring.x = x; ring.y = y;
    this.tweens.add({
      targets: ring, scaleX: radius, scaleY: radius, alpha: 0, duration: 350, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  /* ────── Misc ─────────────────────────────────────────────────────── */
  _updateDamageTexts(dt) {}
  _updateParticles(dt) {}

  _checkExitZones() {
    if (!this.exitZones) return;
    const px = this.player.x, py = this.player.y;
    this.exitZones.forEach(ez => {
      if (Phaser.Math.Distance.Between(px, py, ez.x, ez.y) < 32)
        this._transitionToArea(ez.targetAreaId);
    });
  }
  _transitionToArea(targetAreaId) {
    if (this._transitioning) return;
    this._transitioning = true;
    const fade = document.getElementById('area-fade'); if (fade) fade.classList.add('fade-in');
    setTimeout(() => {
      this.areaId = targetAreaId; window.GameState.currentArea = targetAreaId;
      const area = window.WorldData.areas[targetAreaId];
      if (area) {
        const worldW = MAP_TILES_W * TILE_SIZE, worldH = MAP_TILES_H * TILE_SIZE;
        this.children.removeAll(true);
        this._monsterBarEls = {}; this.exitZones = []; this.monsters = []; this.projectiles = [];
        window.GameState.monstersAlive = [];
        const bars = document.getElementById('monster-bars'); if (bars) bars.innerHTML = '';
        this._buildTilemap(worldW, worldH, area.tileVariant || 'dungeon');
        this._createPlayer(worldW, worldH);
        this.spawnMonsters(targetAreaId);
        this._createExitZones(area);
        this.cameras.main.setBounds(0, 0, worldW, worldH);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        window.GameEventBus.emit('area:entered', { areaId: targetAreaId, name: area.name });
      }
      if (fade) fade.classList.remove('fade-in');
      this._transitioning = false;
    }, 500);
  }
  _syncMonsterBars() { this.monsters.forEach(m => this._updateMonsterHPBar(m)); }
}

/* ══════════════════════════════════════════════════════════════════════
   10. Phaser Config
   ══════════════════════════════════════════════════════════════════════ */
const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0d0b0e',
  physics: { default:'arcade', arcade:{ gravity:{ y:0 }, debug:false } },
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [GameScene],
};
window.PhaserGame = new Phaser.Game(phaserConfig);
