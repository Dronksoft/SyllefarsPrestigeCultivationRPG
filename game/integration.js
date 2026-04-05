/**
 * integration.js — Syllefar's Prestige Cultivation RPG
 *
 * Wires together engine.js, ui.js, data-loot.js and world-content.js.
 * Runs after all scripts have loaded.
 */
(function () {
  'use strict';

  const bus = window.GameEventBus;

  // ─── 1. Prestige: forward UI confirm → PrestigeManager ─────────────────
  bus.on('ui:prestigeConfirmed', (options) => {
    if (window.PrestigeManager && typeof window.PrestigeManager.executePrestige === 'function') {
      window.PrestigeManager.executePrestige(options);
    }
  });

  bus.on('prestige:window:opened', () => {
    bus.emit('book:activationUnlocked', {});
  });

  bus.on('prestige:complete', (payload) => {
    if (window.QuestManager && typeof window.QuestManager.resetForPrestige === 'function') {
      window.QuestManager.resetForPrestige();
    }
    _updateCharacterSheet();
    if (payload && payload.difficulty) {
      const el = document.getElementById('char-difficulty-badge');
      if (el) {
        el.className = 'difficulty-badge difficulty-' + payload.difficulty;
        el.textContent = payload.difficulty.toUpperCase();
      }
    }
    const pb = document.getElementById('char-prestige-badge');
    if (pb && window.GameState) {
      pb.textContent = '⚜ Prestige: ×' + (window.GameState.player.prestigeCount || 0);
    }
  });

  // ─── 2. Monster death: loot + quest + kill feed ─────────────────────────

  // Loot tables keyed by monster typeId.
  // Each entry matches LootEngine.rollLoot(table, luk) signature:
  //   { type, chance, rarity?, areaLevel?, monsterTier?, monsterType?, monsterLevel? }
  const MONSTER_LOOT_TABLES = {
    fallen_shade: [
      { type: 'gold',     chance: 0.90, monsterLevel: 3  },
      { type: 'book',     chance: 0.12, areaLevel: 5,  monsterTier: 'normal' },
      { type: 'catalyst', chance: 0.05 },
    ],
    bone_hound: [
      { type: 'gold',     chance: 0.90, monsterLevel: 5  },
      { type: 'book',     chance: 0.14, areaLevel: 5,  monsterTier: 'normal' },
      { type: 'catalyst', chance: 0.06 },
    ],
    ash_crawler: [
      { type: 'gold',     chance: 0.90, monsterLevel: 8  },
      { type: 'book',     chance: 0.16, areaLevel: 10, monsterTier: 'normal' },
      { type: 'catalyst', chance: 0.08 },
    ],
    corrupted_wisp: [
      { type: 'gold',     chance: 0.85, monsterLevel: 6  },
      { type: 'book',     chance: 0.18, areaLevel: 8,  monsterTier: 'rare'   },
      { type: 'core',     chance: 0.04, monsterType: 'corrupted_wisp' },
      { type: 'catalyst', chance: 0.08 },
    ],
    ember_wraith: [
      { type: 'gold',     chance: 0.85, monsterLevel: 10 },
      { type: 'book',     chance: 0.20, areaLevel: 12, monsterTier: 'rare'   },
      { type: 'core',     chance: 0.05, monsterType: 'ember_wraith' },
      { type: 'catalyst', chance: 0.10 },
    ],
  };

  bus.on('monster:died', ({ monster, position }) => {
    // ── Quest progress ──────────────────────────────────────────────────
    if (window.QuestManager) {
      window.QuestManager.updateProgress('ritual_of_return', 'kill_boss', monster.id || monster.typeId);
      window.QuestManager.evaluateUnlocks({ level: window.GameState.player.level });
      _checkQuestCompletion();
    }

    // ── Loot roll ───────────────────────────────────────────────────────
    const table = MONSTER_LOOT_TABLES[monster.typeId];
    if (table && window.LootEngine) {
      const luk   = (window.GameState.player.stats && window.GameState.player.stats.luk) || 6;
      const drops = window.LootEngine.rollLoot(table, luk);
      if (drops.length > 0) {
        _applyDropsToPlayer(drops);
        bus.emit('loot:dropped', { monster, drops, position: position || { x: 0, y: 0 } });
      }
    }
  });

  // ── Apply drops to player inventory / gold ──────────────────────────
  function _applyDropsToPlayer(drops) {
    const p = window.GameState.player;
    drops.forEach(drop => {
      if (drop.itemType === 'gold') {
        p.gold = (p.gold || 0) + (drop.amount || 0);
        bus.emit('gold:gained', { amount: drop.amount, total: p.gold });
      } else if (drop.itemType === 'book') {
        if (!p.learnedBooks.includes(drop.bookId)) {
          p.learnedBooks.push(drop.bookId);
          bus.emit('book:obtained', { bookId: drop.bookId, name: drop.name });
        }
      } else if (drop.itemType === 'core') {
        if (!p.ownedCores.includes(drop.coreId)) {
          p.ownedCores.push(drop.coreId);
          bus.emit('core:obtained', { coreId: drop.coreId, name: drop.name });
        }
      } else if (drop.itemType === 'catalyst') {
        const existing = p.inventory.find(i => i && i.id === drop.catalystId);
        if (existing) {
          existing.qty = (existing.qty || 1) + (drop.amount || 1);
        } else {
          p.inventory.push({ id: drop.catalystId, name: drop.name, qty: drop.amount || 1 });
        }
      }
    });
  }

  // ── Floating loot text on screen at kill position ────────────────────
  bus.on('loot:dropped', ({ drops, position }) => {
    if (!position) return;
    drops.forEach((drop, i) => {
      const label = _lootLabel(drop);
      if (!label) return;
      // Stagger lines so multiple drops don't overlap
      setTimeout(() => _spawnFloatingLootText(position.x, position.y - i * 18, label, _lootColor(drop)), i * 80);
    });
  });

  function _lootLabel(drop) {
    if (drop.itemType === 'gold')      return `+${drop.amount}g`;
    if (drop.itemType === 'book')      return `📖 ${drop.name}`;
    if (drop.itemType === 'core')      return `💠 ${drop.name}`;
    if (drop.itemType === 'catalyst')  return `✦ Catalyst ×${drop.amount || 1}`;
    return null;
  }

  function _lootColor(drop) {
    if (drop.itemType === 'gold')     return '#f0c040';
    if (drop.itemType === 'book')     return '#88ccff';
    if (drop.itemType === 'core')     return '#cc88ff';
    if (drop.itemType === 'catalyst') return '#88ffcc';
    return '#ffffff';
  }

  // Uses the fct-layer div already in index.html (same layer as damage numbers)
  function _spawnFloatingLootText(worldX, worldY, text, color) {
    const layer = document.getElementById('fct-layer');
    if (!layer) return;
    // If no Phaser camera reference is available yet, fall back to screen centre
    let sx = window.innerWidth  / 2;
    let sy = window.innerHeight / 2;
    try {
      const game = window.PhaserGame;
      if (game) {
        const cam    = game.scene.scenes[0] && game.scene.scenes[0].cameras && game.scene.scenes[0].cameras.main;
        const canvas = game.canvas;
        if (cam && canvas) {
          const rect   = canvas.getBoundingClientRect();
          const scaleX = rect.width  / canvas.width;
          const scaleY = rect.height / canvas.height;
          sx = (worldX - cam.scrollX) * cam.zoom * scaleX + rect.left;
          sy = (worldY - cam.scrollY) * cam.zoom * scaleY + rect.top;
        }
      }
    } catch (_) {}

    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed',
      `left:${sx}px`,
      `top:${sy}px`,
      `color:${color}`,
      'font:bold 12px \'Barlow Condensed\',sans-serif',
      'text-shadow:0 1px 4px #000',
      'pointer-events:none',
      'white-space:nowrap',
      'transform:translateX(-50%)',
      'animation:fctRise 1.1s ease-out forwards',
    ].join(';');
    el.textContent = text;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  // ─── 3. Area / level events ──────────────────────────────────────────────
  bus.on('area:entered', ({ areaId }) => {
    if (window.QuestManager) {
      window.QuestManager.updateProgress('ritual_of_return', 'reach_area', areaId);
      _checkQuestCompletion();
    }
    _updateCharacterSheet();
  });

  bus.on('player:levelup', ({ newLevel }) => {
    if (window.QuestManager) {
      window.QuestManager.evaluateUnlocks({ level: newLevel || window.GameState.player.level });
      _checkQuestCompletion();
    }
    _updateCharacterSheet();
  });

  // ─── 4. Character sheet live updates ────────────────────────────────────
  bus.on('book:activated', (d) => {
    const badge = document.getElementById('char-book-badge');
    if (badge && d && d.bookId) badge.textContent = d.bookId;
    _updateCharacterSheet();
  });

  bus.on('core:fused', () => _updateCharacterSheet());

  // ─── 5. Populate prestige selects from real book/core data ──────────────
  document.addEventListener('DOMContentLoaded', () => {
    _populatePrestigeSelects();
    _updateCharacterSheet();
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function _checkQuestCompletion() {
    if (!window.QuestManager) return;
    if (window.QuestManager.isComplete('ritual_of_return') &&
        !window.QuestManager.isQuestCompleted('ritual_of_return')) {
      window.QuestManager.completeQuest('ritual_of_return');
      const el = document.getElementById('prestige-quest-status');
      if (el) {
        el.style.color = '#60c070';
        el.textContent = 'Ritual of Return: ✓ Complete — You are ready to ascend.';
      }
    }
  }

  function _updateCharacterSheet() {
    const p = window.GameState && window.GameState.player;
    if (!p) return;

    const lvl = document.getElementById('char-level-display');
    if (lvl) lvl.textContent = 'Level ' + (p.level || 1);

    const s = p.stats || {};
    const statMap = { str:'stat-str', dex:'stat-dex', vit:'stat-vit', int:'stat-int', wis:'stat-wis', luk:'stat-luk' };
    Object.entries(statMap).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = s[key] || '—';
    });

    const pb = document.getElementById('char-prestige-badge');
    if (pb) pb.textContent = '⚜ Prestige: ×' + (p.prestigeCount || 0);
  }

  function _populatePrestigeSelects() {
    const gd = window.GameData;
    if (!gd || !gd.BOOKS_LIST) return;

    const martialSel = document.getElementById('prestige-martial-select');
    const soulSel    = document.getElementById('prestige-soul-select');
    const coreSel    = document.getElementById('prestige-core-select');

    if (gd.BOOKS_LIST) {
      gd.BOOKS_LIST.filter(b => b.type === 'martial').forEach(b => {
        if (martialSel) martialSel.innerHTML += `<option value="${b.id}">${b.name}</option>`;
      });
      gd.BOOKS_LIST.filter(b => b.type === 'soul').forEach(b => {
        if (soulSel) soulSel.innerHTML += `<option value="${b.id}">${b.name}</option>`;
      });
    }

    const player = window.GameState && window.GameState.player;
    if (player && player.ownedCores && coreSel) {
      player.ownedCores.forEach(cId => {
        coreSel.innerHTML += `<option value="${cId}">${cId}</option>`;
      });
    }
  }

  console.log('[integration.js] Loaded — combat loot, kill feed, and all systems wired.');
})();
