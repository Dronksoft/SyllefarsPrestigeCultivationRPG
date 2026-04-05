/**
 * integration.js — Syllefar's Prestige Cultivation RPG
 *
 * Wires together engine.js, ui.js, step2-data-loot.js and step4-world-content.js.
 * Runs after all four scripts have loaded.
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

  // Open prestige window → unlock book activation in ui.js
  bus.on('prestige:window:opened', () => {
    bus.emit('book:activationUnlocked', {});
  });

  // After prestige complete: reset quests + update character sheet
  bus.on('prestige:complete', (payload) => {
    if (window.QuestManager && typeof window.QuestManager.resetForPrestige === 'function') {
      window.QuestManager.resetForPrestige();
    }
    _updateCharacterSheet();
    // Update difficulty badge
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

  // ─── 2. Quest progress tracking ────────────────────────────────────────
  bus.on('monster:died', ({ monster }) => {
    if (!window.QuestManager) return;
    window.QuestManager.updateProgress('ritual_of_return', 'kill_boss', monster.id || monster.typeId);
    window.QuestManager.evaluateUnlocks({ level: window.GameState.player.level });
    _checkQuestCompletion();
  });

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

  // ─── 3. Character sheet live updates ───────────────────────────────────
  bus.on('book:activated', (d) => {
    const badge = document.getElementById('char-book-badge');
    if (badge && d && d.bookId) badge.textContent = d.bookId;
    _updateCharacterSheet();
  });

  bus.on('core:fused', () => _updateCharacterSheet());

  // ─── 4. Populate prestige selects from real book/core data ─────────────
  // Run after DOMContentLoaded so GameData (step2) is definitely available
  document.addEventListener('DOMContentLoaded', () => {
    _populatePrestigeSelects();
    _updateCharacterSheet();
  });

  // ─── Helpers ───────────────────────────────────────────────────────────

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

    // Level display
    const lvl = document.getElementById('char-level-display');
    if (lvl) lvl.textContent = 'Level ' + (p.level || 1);

    // Stats
    const s = p.stats || {};
    const statMap = { str:'stat-str', dex:'stat-dex', vit:'stat-vit', int:'stat-int', wis:'stat-wis', luk:'stat-luk' };
    Object.entries(statMap).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = s[key] || '—';
    });

    // Prestige badge
    const pb = document.getElementById('char-prestige-badge');
    if (pb) pb.textContent = '⚜ Prestige: ×' + (p.prestigeCount || 0);
  }

  function _populatePrestigeSelects() {
    const gd = window.GameData;
    if (!gd || !gd.BOOKS_LIST) return; // step2 may use different export shape

    // Martial books
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

  console.log('[integration.js] Loaded — all systems wired.');
})();
