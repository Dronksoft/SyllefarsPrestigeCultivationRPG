'use strict';

// ============================================================
//  SYLLEFAR'S PRESTIGE CULTIVATION RPG
//  game/data-loot.js — Data, Loot Engine & Prestige System
// ============================================================
(function () {

  // ── Internal helpers ──────────────────────────────────────

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
  function chance(p) { return Math.random() < p; }
  function weightedPick(table) {
    let roll = Math.random() * table.reduce((s, e) => s + e.weight, 0);
    for (const e of table) { roll -= e.weight; if (roll <= 0) return e.value; }
    return table[table.length - 1].value;
  }
  function emit(event, data) {
    if (window.GameEventBus && typeof window.GameEventBus.emit === 'function')
      window.GameEventBus.emit(event, data);
  }
  function getPlayer() {
    return (window.GameState && window.GameState.player) || null;
  }

  // ── 1. BOOKS ─────────────────────────────────────────────

  const BOOKS_MAP = {
    iron_body_sutra_1:       { id: 'iron_body_sutra_1',       name: 'Iron Body Sutra I',          type: 'martial', tier: 1, statBoosts: { str: 6,  vit: 4  }, physBonus: 0.05, magBonus: 0,    unlockedSkill: null,               flavorText: 'The first step on the path of iron: to endure.' },
    iron_body_sutra_4:       { id: 'iron_body_sutra_4',       name: 'Iron Body Sutra IV',         type: 'martial', tier: 4, statBoosts: { str: 40, vit: 20 }, physBonus: 0.25, magBonus: 0,    unlockedSkill: null,               flavorText: 'The iron does not yield. Neither shall you.' },
    iron_body_sutra_7:       { id: 'iron_body_sutra_7',       name: 'Iron Body Sutra VII',        type: 'martial', tier: 7, statBoosts: { str: 90, vit: 55 }, physBonus: 0.50, magBonus: 0,    unlockedSkill: 'iron_fortress',    flavorText: 'Legendary. Mountains move before this body yields.' },
    crouching_tiger_form_2:  { id: 'crouching_tiger_form_2',  name: 'Crouching Tiger Form II',    type: 'martial', tier: 2, statBoosts: { str: 12, dex: 10 }, physBonus: 0.10, magBonus: 0,    unlockedSkill: null,               flavorText: "Patience and speed are the tiger's two claws." },
    crouching_tiger_form_5:  { id: 'crouching_tiger_form_5',  name: 'Crouching Tiger Form V',     type: 'martial', tier: 5, statBoosts: { str: 28, dex: 35 }, physBonus: 0.30, magBonus: 0,    unlockedSkill: 'tiger_lunge',      flavorText: 'Strike before the thought of striking.' },
    thousand_step_sutra_3:   { id: 'thousand_step_sutra_3',   name: 'Thousand Step Sutra III',    type: 'martial', tier: 3, statBoosts: { dex: 22, vit: 12 }, physBonus: 0.15, magBonus: 0,    unlockedSkill: null,               flavorText: 'A thousand steps never taken twice.' },
    mountain_root_canon_2:   { id: 'mountain_root_canon_2',   name: 'Mountain Root Canon II',     type: 'martial', tier: 2, statBoosts: { vit: 18, str: 8  }, physBonus: 0.08, magBonus: 0,    unlockedSkill: null,               flavorText: 'Root yourself. Let the storm break around you.' },
    mountain_root_canon_6:   { id: 'mountain_root_canon_6',   name: 'Mountain Root Canon VI',     type: 'martial', tier: 6, statBoosts: { vit: 60, str: 30 }, physBonus: 0.38, magBonus: 0,    unlockedSkill: 'unshakeable_stance',flavorText: 'The mountain does not fight the wind. It outlasts it.' },
    blade_echo_codex_3:      { id: 'blade_echo_codex_3',      name: 'Blade Echo Codex III',       type: 'martial', tier: 3, statBoosts: { str: 20, dex: 16 }, physBonus: 0.18, magBonus: 0,    unlockedSkill: null,               flavorText: 'Every strike leaves an echo. Train until the echoes overlap.' },
    jade_fist_manual_4:      { id: 'jade_fist_manual_4',      name: 'Jade Fist Manual IV',        type: 'martial', tier: 4, statBoosts: { str: 35, dex: 20, vit: 10 }, physBonus: 0.22, magBonus: 0.05, unlockedSkill: null, flavorText: 'Jade yields but never breaks. Your fist must become jade.' },
    void_heart_scripture_1:  { id: 'void_heart_scripture_1',  name: 'Void Heart Scripture I',     type: 'soul',    tier: 1, statBoosts: { int: 6,  wis: 4  }, physBonus: 0,    magBonus: 0.05, unlockedSkill: null,               flavorText: 'Empty the mind. The void is not nothingness — it is potential.' },
    void_heart_scripture_4:  { id: 'void_heart_scripture_4',  name: 'Void Heart Scripture IV',    type: 'soul',    tier: 4, statBoosts: { int: 40, wis: 22 }, physBonus: 0,    magBonus: 0.25, unlockedSkill: null,               flavorText: 'Through the void, the heavens speak.' },
    void_heart_scripture_7:  { id: 'void_heart_scripture_7',  name: 'Void Heart Scripture VII',   type: 'soul',    tier: 7, statBoosts: { int: 90, wis: 55 }, physBonus: 0,    magBonus: 0.55, unlockedSkill: 'void_rupture',     flavorText: 'Legendary. The void listens. The void obeys.' },
    ember_chant_2:           { id: 'ember_chant_2',           name: 'Ember Chant II',             type: 'soul',    tier: 2, statBoosts: { int: 12, wis: 8  }, physBonus: 0,    magBonus: 0.10, unlockedSkill: null,               flavorText: 'Breathe. Every breath fans the inner ember.' },
    ember_chant_5:           { id: 'ember_chant_5',           name: 'Ember Chant V',              type: 'soul',    tier: 5, statBoosts: { int: 32, wis: 28 }, physBonus: 0,    magBonus: 0.32, unlockedSkill: 'conflagration_pulse',flavorText: 'The ember becomes inferno. The breath becomes wind.' },
    serpent_tongue_doctrine_3:{ id: 'serpent_tongue_doctrine_3',name: 'Serpent Tongue Doctrine III',type: 'soul',   tier: 3, statBoosts: { int: 20, luk: 12 }, physBonus: 0,    magBonus: 0.16, unlockedSkill: null,               flavorText: 'The serpent does not attack first. It simply never misses.' },
    starfall_invocation_6:   { id: 'starfall_invocation_6',   name: 'Starfall Invocation VI',     type: 'soul',    tier: 6, statBoosts: { int: 60, wis: 35 }, physBonus: 0,    magBonus: 0.42, unlockedSkill: 'starfall_cascade',  flavorText: 'To call the stars down, you must first become one.' },
    tidal_mind_sutra_3:      { id: 'tidal_mind_sutra_3',      name: 'Tidal Mind Sutra III',       type: 'soul',    tier: 3, statBoosts: { int: 18, wis: 16, vit: 6 }, physBonus: 0, magBonus: 0.14, unlockedSkill: null,         flavorText: 'The tide does not rush. Yet it reshapes all coastlines.' },
    pale_moon_canticle_4:    { id: 'pale_moon_canticle_4',    name: 'Pale Moon Canticle IV',      type: 'soul',    tier: 4, statBoosts: { wis: 30, int: 20 }, physBonus: 0.05, magBonus: 0.20, unlockedSkill: null,               flavorText: 'The pale moon casts no shadow but illuminates all secrets.' },
    boundless_heart_manual:  { id: 'boundless_heart_manual',  name: 'Boundless Heart Manual',     type: 'martial', tier: 5, statBoosts: { str: 20, vit: 20, dex: 20 }, physBonus: 0.20, magBonus: 0.10, unlockedSkill: 'boundless_strike', flavorText: 'No ceiling, no floor. Only the horizon and the will.' },
    iron_soul_convergence:   { id: 'iron_soul_convergence',   name: 'Iron Soul Convergence',      type: 'soul',    tier: 5, statBoosts: { int: 25, str: 25 }, physBonus: 0.15, magBonus: 0.15, unlockedSkill: 'soul_blade',        flavorText: 'The divide between body and spirit is a lie you chose to believe.' },
    eternal_dragon_codex:    { id: 'eternal_dragon_codex',    name: 'Eternal Dragon Codex',       type: 'martial', tier: 7, statBoosts: { str: 70, dex: 50, vit: 40 }, physBonus: 0.45, magBonus: 0.10, unlockedSkill: 'dragon_ascent',  flavorText: 'Legendary. The dragon did not learn to fly. It remembered.' },
    heaven_devouring_sutra:  { id: 'heaven_devouring_sutra',  name: 'Heaven Devouring Sutra',     type: 'soul',    tier: 7, statBoosts: { int: 75, wis: 60, luk: 20 }, physBonus: 0,    magBonus: 0.60, unlockedSkill: 'heaven_tear',    flavorText: 'Legendary. The sky is not the limit. The sky is fuel.' },
    twin_rivers_doctrine:    { id: 'twin_rivers_doctrine',    name: 'Twin Rivers Doctrine',       type: 'martial', tier: 6, statBoosts: { str: 45, dex: 40 }, physBonus: 0.35, magBonus: 0,    unlockedSkill: 'river_cleave',     flavorText: 'Two rivers, one current. Strike and flow as one.' },
    whispering_void_codex:   { id: 'whispering_void_codex',   name: 'Whispering Void Codex',      type: 'soul',    tier: 6, statBoosts: { int: 50, wis: 40 }, physBonus: 0,    magBonus: 0.40, unlockedSkill: 'void_whisper',     flavorText: 'Listen long enough to the void and it begins to answer.' },
  };

  // ── 2. CORES ─────────────────────────────────────────────

  const CORES_MAP = {
    inferno_drake_core:   { id: 'inferno_drake_core',   name: 'Inferno Drake Core',   sourceMonster: 'inferno_drake',   levelRequirement: 25, isBossCore: true,  statBoosts: { str: 15, int: 20 }, skillAffinity: ['fire'],                affinityBonus: 0.20, passiveEffect: { type: 'fire_dot',          description: 'Attacks apply a small fire DoT (5% weapon dmg/s, 3s)' },                 dropChance: 0.010, flavorText: 'The ember of a fallen dragon, still burning.' },
    void_spider_core:     { id: 'void_spider_core',     name: 'Void Spider Core',     sourceMonster: 'void_spider',     levelRequirement: 12, isBossCore: false, statBoosts: { dex: 18, luk: 10 }, skillAffinity: ['poison','darkness'],   affinityBonus: 0.12, passiveEffect: { type: 'web_slow',          description: 'Physical attacks have 10% chance to slow target 25% for 2s' },        dropChance: 0.025, flavorText: 'The darkness between stars — distilled into silk.' },
    stone_colossus_core:  { id: 'stone_colossus_core',  name: 'Stone Colossus Core',  sourceMonster: 'stone_colossus',  levelRequirement: 30, isBossCore: true,  statBoosts: { vit: 40, str: 20 }, skillAffinity: ['earth','physical'],    affinityBonus: 0.18, passiveEffect: { type: 'damage_reduction',  description: 'Reduces incoming physical damage by 8%' },                          dropChance: 0.008, flavorText: 'A heartbeat of stone. Heavy. Eternal. Unyielding.' },
    frost_wraith_core:    { id: 'frost_wraith_core',    name: 'Frost Wraith Core',    sourceMonster: 'frost_wraith',    levelRequirement: 20, isBossCore: false, statBoosts: { int: 22, wis: 14 }, skillAffinity: ['ice','wind'],          affinityBonus: 0.15, passiveEffect: { type: 'chill_on_hit',      description: 'Magic attacks reduce enemy attack speed by 12% for 3s' },             dropChance: 0.020, flavorText: 'Cold does not hate. It simply takes.' },
    lightning_hawk_core:  { id: 'lightning_hawk_core',  name: 'Lightning Hawk Core',  sourceMonster: 'lightning_hawk',  levelRequirement: 18, isBossCore: false, statBoosts: { dex: 25, str: 12 }, skillAffinity: ['lightning','wind'],    affinityBonus: 0.14, passiveEffect: { type: 'chain_spark',       description: '8% chance on hit to arc to nearest enemy for 40% dmg' },             dropChance: 0.020, flavorText: 'Forged in the storm. Released in a single dive.' },
    abyssal_leech_core:   { id: 'abyssal_leech_core',   name: 'Abyssal Leech Core',   sourceMonster: 'abyssal_leech',   levelRequirement: 35, isBossCore: false, statBoosts: { vit: 25, wis: 20 }, skillAffinity: ['darkness','poison'],   affinityBonus: 0.16, passiveEffect: { type: 'lifesteal',         description: 'Heals for 3% of damage dealt with darkness/poison skills' },          dropChance: 0.015, flavorText: 'It does not kill. It drains. And feeds. And drains.' },
    jade_serpent_core:    { id: 'jade_serpent_core',    name: 'Jade Serpent Core',    sourceMonster: 'jade_serpent',    levelRequirement: 40, isBossCore: true,  statBoosts: { int: 30, dex: 25, luk: 15 }, skillAffinity: ['earth','poison'], affinityBonus: 0.22, passiveEffect: { type: 'venomous_aura',   description: 'Passive poison aura deals 15 dmg/s to nearby enemies' },             dropChance: 0.007, flavorText: 'The jade coils. The jade waits. The jade strikes once.' },
    celestial_crane_core: { id: 'celestial_crane_core', name: 'Celestial Crane Core', sourceMonster: 'celestial_crane', levelRequirement: 45, isBossCore: true,  statBoosts: { wis: 35, int: 28 }, skillAffinity: ['wind','holy'],         affinityBonus: 0.25, passiveEffect: { type: 'grace_heal',        description: 'Skill cast has 15% chance to restore 2% max HP' },                   dropChance: 0.006, flavorText: 'It flew once above the clouds. It chose not to return.' },
    devouring_maw_core:   { id: 'devouring_maw_core',   name: 'Devouring Maw Core',   sourceMonster: 'devouring_maw',   levelRequirement: 50, isBossCore: true,  statBoosts: { str: 45, vit: 30, int: 20 }, skillAffinity: ['darkness','physical'], affinityBonus: 0.28, passiveEffect: { type: 'hungering_strikes', description: 'Every 5th attack deals +60% damage and restores 5% HP' }, dropChance: 0.005, flavorText: 'The void hungered before worlds existed. It still does.' },
  };

  // ── 3. ORIGINS ───────────────────────────────────────────

  const ORIGINS_MAP = {
    wandering_monk: {
      id: 'wandering_monk',
      name: 'Wandering Monk',
      description: 'A practitioner of ancient body arts. Starts poor, finishes iron.',
      baseStats: { str: 16, dex: 14, vit: 14, int: 8, wis: 8, luk: 6 },
      startingSkills: ['iron_strike', 'stone_step'],
      affinityHints: ['physical', 'earth'],
      flavorText: 'No home. No master. Only the road and the fist.',
    },
    fallen_noble: {
      id: 'fallen_noble',
      name: 'Fallen Noble',
      description: 'A disgraced scion of a cultivator house. Both blade and art remain.',
      baseStats: { str: 13, dex: 12, vit: 10, int: 14, wis: 13, luk: 8 },
      startingSkills: ['noble_blade', 'arcane_veil'],
      affinityHints: ['physical', 'magical', 'lightning'],
      flavorText: 'The house fell. The training did not.',
    },
    beast_tamer: {
      id: 'beast_tamer',
      name: 'Beast Tamer',
      description: 'A cultivator who binds monster essences and draws power from their cores.',
      baseStats: { str: 12, dex: 16, vit: 12, int: 10, wis: 12, luk: 8 },
      startingSkills: ['binding_mark', 'feral_instinct'],
      affinityHints: ['earth', 'darkness', 'physical'],
      flavorText: 'To command the beast, first understand it. Then become it.',
    },
  };

  // Flat arrays consumed by UI / engine
  const BOOKS_LIST   = Object.values(BOOKS_MAP);
  const CORES_LIST   = Object.values(CORES_MAP);
  const ORIGINS_LIST = Object.values(ORIGINS_MAP);

  // ── 4. GameData ──────────────────────────────────────────

  window.GameData = {
    BOOKS_LIST,
    CORES_LIST,
    ORIGINS_LIST,

    calcMaxHP(vit, level) {
      const v = (typeof vit   === 'number' && isFinite(vit))   ? vit   : 10;
      const l = (typeof level === 'number' && isFinite(level)) ? level : 1;
      return Math.floor(100 + v * 10 + l * 5);
    },

    calcMaxSoul(wis, level) {
      const w = (typeof wis   === 'number' && isFinite(wis))   ? wis   : 10;
      const l = (typeof level === 'number' && isFinite(level)) ? level : 1;
      return Math.floor(50 + w * 8 + l * 3);
    },

    getStatBonuses(originId) {
      const blank = { str: 0, dex: 0, vit: 0, int: 0, wis: 0, luk: 0 };
      if (typeof originId !== 'string') return blank;
      const origin = ORIGINS_MAP[originId];
      if (!origin) return blank;
      return Object.assign({}, blank, origin.baseStats);
    },
  };

  // ── 5. LootEngine ────────────────────────────────────────

  const RARITY_WEIGHTS = [
    { weight: 60, value: 'normal' },
    { weight: 30, value: 'magic'  },
    { weight:  9, value: 'rare'   },
    { weight:  1, value: 'unique' },
  ];

  const BOOK_TIER_MATRIX = {
    normal:  [1, 1, 2],
    rare:    [2, 3, 3],
    boss:    [3, 4, 5],
    unique:  [5, 6, 7],
  };

  function pickBookTier(areaLevel, monsterTier) {
    const buckets = BOOK_TIER_MATRIX[monsterTier] || BOOK_TIER_MATRIX.normal;
    const idx     = areaLevel <= 20 ? 0 : areaLevel <= 40 ? 1 : 2;
    return buckets[idx];
  }

  window.LootEngine = {
    rollLoot(lootTable, luk) {
      if (!Array.isArray(lootTable)) return [];
      const lukBonus = (typeof luk === 'number' && isFinite(luk)) ? luk : 0;

      return lootTable.reduce((drops, entry) => {
        if (!entry || typeof entry.chance !== 'number') return drops;
        const adjustedChance = Math.min(1, entry.chance * (1 + lukBonus * 0.002));
        if (!chance(adjustedChance)) return drops;

        const rarity   = entry.rarity || weightedPick(RARITY_WEIGHTS);
        const areaLvl  = (entry.areaLevel  && isFinite(entry.areaLevel))  ? entry.areaLevel  : 1;
        const monTier  = entry.monsterTier || 'normal';

        if (entry.type === 'book') {
          const tier    = pickBookTier(areaLvl, monTier);
          const matches = BOOKS_LIST.filter(b => b.tier === tier);
          if (!matches.length) return drops;
          const book = matches[randInt(0, matches.length - 1)];
          drops.push({ itemType: 'book', bookId: book.id, name: book.name, tier: book.tier, rarity });
        } else if (entry.type === 'core') {
          const specific = CORES_LIST.find(c => c.sourceMonster === entry.monsterType);
          const core     = specific || CORES_LIST[randInt(0, CORES_LIST.length - 1)];
          drops.push({ itemType: 'core', coreId: core.id, name: core.name, isBossCore: core.isBossCore });
        } else if (entry.type === 'gold') {
          const base = (entry.monsterLevel && isFinite(entry.monsterLevel)) ? entry.monsterLevel * 5 : 5;
          drops.push({ itemType: 'gold', amount: randInt(Math.floor(base * 0.7), Math.ceil(base * 1.4)) });
        } else if (entry.type === 'catalyst') {
          drops.push({ itemType: 'catalyst', catalystId: 'soul_forge_catalyst', name: 'Soul Forge Catalyst', amount: 1 });
        }
        return drops;
      }, []);
    },
  };

  // ── 6. BookSystem ────────────────────────────────────────

  let _activeBookId = null;

  window.BookSystem = {
    activateBook(bookId) {
      if (typeof bookId !== 'string' || !BOOKS_MAP[bookId]) return;
      _activeBookId = bookId;
      emit('book:activated', { bookId });
    },

    deactivateBook() {
      const prev = _activeBookId;
      _activeBookId = null;
      if (prev) emit('book:deactivated', { bookId: prev });
    },

    getActiveBook() {
      return _activeBookId ? (BOOKS_MAP[_activeBookId] || null) : null;
    },
  };

  // ── 7. CoreSystem ────────────────────────────────────────

  let _activeCoreId  = null;
  let _coreSwapStamp = 0;
  const CORE_SWAP_COOLDOWN_MS = 300_000;

  window.CoreSystem = {
    activateCore(coreId) {
      if (typeof coreId !== 'string' || !CORES_MAP[coreId]) return;
      const player = getPlayer();
      if (player && (player.level || 1) < CORES_MAP[coreId].levelRequirement) return;
      const prev = _activeCoreId;
      _activeCoreId  = coreId;
      _coreSwapStamp = Date.now();
      emit(prev ? 'core:swapped' : 'core:fused', { fromCoreId: prev, toCoreId: coreId });
    },

    deactivateCore() {
      const prev = _activeCoreId;
      _activeCoreId  = null;
      _coreSwapStamp = Date.now();
      if (prev) emit('core:swapped', { fromCoreId: prev, toCoreId: null });
    },

    getActiveCore() {
      return _activeCoreId ? (CORES_MAP[_activeCoreId] || null) : null;
    },

    swapCooldownRemaining() {
      if (!_coreSwapStamp) return 0;
      return Math.max(0, CORE_SWAP_COOLDOWN_MS - (Date.now() - _coreSwapStamp)) / 1000;
    },
  };

  // ── 8. PrestigeManager ───────────────────────────────────

  window.PrestigeManager = {
    canPrestige() {
      const player = getPlayer();
      return !!(player && player.prestigeQuestComplete);
    },

    executePrestige(options) {
      const player = getPlayer();
      if (!player) return;
      if (!this.canPrestige()) return;

      const opts           = (options && typeof options === 'object') ? options : {};
      const keptBooks      = Array.isArray(player.learnedBooks) ? [...player.learnedBooks] : [];
      const keptCores      = Array.isArray(player.ownedCores)   ? [...player.ownedCores]   : [];
      const soulForgedGear = Array.isArray(player.inventory)
        ? player.inventory.filter(i => i && i.isSoulForged)
        : [];

      const newMartialBook = (typeof opts.activeMartialBook === 'string' && keptBooks.includes(opts.activeMartialBook))
        ? opts.activeMartialBook : null;
      const newSoulBook    = (typeof opts.activeSoulBook    === 'string' && keptBooks.includes(opts.activeSoulBook))
        ? opts.activeSoulBook    : null;
      const newCore        = (typeof opts.activeCore        === 'string' && keptCores.includes(opts.activeCore))
        ? opts.activeCore        : null;
      const difficulty     = ['normal', 'nightmare', 'ascended'].includes(opts.difficulty)
        ? opts.difficulty : 'normal';

      player.level                              = 1;
      player.xp                                 = 0;
      player.gold                               = 0;
      player.inventory                          = [...soulForgedGear];
      player.learnedBooks                       = keptBooks;
      player.ownedCores                         = keptCores;
      player.activeMartialBook                  = newMartialBook;
      player.activeSoulBook                     = newSoulBook;
      player.activeCore                         = newCore;
      player.prestigeQuestComplete              = false;
      player.firstNightmareBossKilledThisPrestige = false;
      player.inPrestigeWindow                   = false;
      player.prestigeCount                      = (player.prestigeCount || 0) + 1;

      if (window.GameState) window.GameState.difficulty = difficulty;

      if (newMartialBook) _activeBookId = newMartialBook;
      if (newCore)        _activeCoreId = newCore;

      emit('prestige:complete', {
        prestigeCount:   player.prestigeCount,
        difficulty,
        keptBooks,
        keptCores,
        soulForgedCount: soulForgedGear.length,
      });
    },
  };

  // ── Init log ─────────────────────────────────────────────

  console.log(
    '[Step2] GameData, LootEngine, BookSystem, CoreSystem, PrestigeManager loaded.' +
    ` Books: ${BOOKS_LIST.length} | Cores: ${CORES_LIST.length} | Origins: ${ORIGINS_LIST.length}`
  );

})();
