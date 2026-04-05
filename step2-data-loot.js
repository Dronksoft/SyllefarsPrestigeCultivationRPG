/**
 * ============================================================
 *  SYLLEFAR'S PRESTIGE CULTIVATION RPG
 *  Step 2 — Data Definitions, Loot Engine & Prestige System
 * ============================================================
 *
 *  Exposes:
 *    window.GameData       — all static definitions
 *    window.LootEngine     — procedural drop resolution
 *    window.BookSystem     — book learn / activation
 *    window.CoreSystem     — core fuse / swap
 *    window.PrestigeManager — prestige state machine
 *
 *  Reads:   window.GameState.player  (Agent 1)
 *  Listens: window.GameEventBus      (Agent 1)
 *  Emits:   events via GameEventBus for Agent 3 UI re-renders
 *
 *  No external dependencies. Load as <script> before Agent 1.
 * ============================================================
 */

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  //  UTILITY
  // ─────────────────────────────────────────────

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }
  function chance(p) {
    return Math.random() < p;
  }
  function weightedPick(table) {
    // table: [{ weight, value }]
    const total = table.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (const entry of table) {
      roll -= entry.weight;
      if (roll <= 0) return entry.value;
    }
    return table[table.length - 1].value;
  }
  function emit(event, data) {
    if (window.GameEventBus) window.GameEventBus.emit(event, data);
  }
  function getPlayer() {
    return (window.GameState && window.GameState.player) ? window.GameState.player : null;
  }

  // ─────────────────────────────────────────────
  //  1. KNOWLEDGE BOOK DEFINITIONS (25 books)
  // ─────────────────────────────────────────────

  const BOOKS = {
    // ── MARTIAL BOOKS (T1–T7) ──────────────────

    iron_body_sutra_1: {
      id: 'iron_body_sutra_1',
      name: 'Iron Body Sutra I',
      type: 'martial',
      tier: 1,
      statBoosts: { str: 6, vit: 4 },
      physicalSkillBonus: 0.05,
      magicalSkillBonus: 0,
      unlockedSkillId: null,
      flavorText: 'The first step on the path of iron: to endure.',
      dropSources: 'area level 1-10, normal/rare tier',
    },
    iron_body_sutra_4: {
      id: 'iron_body_sutra_4',
      name: 'Iron Body Sutra IV',
      type: 'martial',
      tier: 4,
      statBoosts: { str: 40, vit: 20 },
      physicalSkillBonus: 0.25,
      magicalSkillBonus: 0,
      unlockedSkillId: null,
      flavorText: 'The iron does not yield. Neither shall you.',
      dropSources: 'area level 21-40, boss/unique tier',
    },
    iron_body_sutra_7: {
      id: 'iron_body_sutra_7',
      name: 'Iron Body Sutra VII',
      type: 'martial',
      tier: 7,
      statBoosts: { str: 90, vit: 55 },
      physicalSkillBonus: 0.50,
      magicalSkillBonus: 0,
      unlockedSkillId: 'iron_fortress',
      flavorText: 'Legendary. Mountains move before this body yields.',
      dropSources: 'area level 41-60, unique boss tier',
    },

    crouching_tiger_form_2: {
      id: 'crouching_tiger_form_2',
      name: 'Crouching Tiger Form II',
      type: 'martial',
      tier: 2,
      statBoosts: { str: 12, dex: 10 },
      physicalSkillBonus: 0.10,
      magicalSkillBonus: 0,
      unlockedSkillId: null,
      flavorText: 'Patience and speed are the tiger\'s two claws.',
      dropSources: 'area level 1-20, rare/boss tier',
    },
    crouching_tiger_form_5: {
      id: 'crouching_tiger_form_5',
      name: 'Crouching Tiger Form V',
      type: 'martial',
      tier: 5,
      statBoosts: { str: 28, dex: 35 },
      physicalSkillBonus: 0.30,
      magicalSkillBonus: 0,
      unlockedSkillId: 'tiger_lunge',
      flavorText: 'Strike before the thought of striking.',
      dropSources: 'area level 21-60, boss tier',
    },

    thousand_step_sutra_3: {
      id: 'thousand_step_sutra_3',
      name: 'Thousand Step Sutra III',
      type: 'martial',
      tier: 3,
      statBoosts: { dex: 22, vit: 12 },
      physicalSkillBonus: 0.15,
      magicalSkillBonus: 0,
      unlockedSkillId: null,
      flavorText: 'A thousand steps never taken twice.',
      dropSources: 'area level 11-40, rare tier',
    },

    mountain_root_canon_2: {
      id: 'mountain_root_canon_2',
      name: 'Mountain Root Canon II',
      type: 'martial',
      tier: 2,
      statBoosts: { vit: 18, str: 8 },
      physicalSkillBonus: 0.08,
      magicalSkillBonus: 0,
      unlockedSkillId: null,
      flavorText: 'Root yourself. Let the storm break around you.',
      dropSources: 'area level 1-20, rare/boss tier',
    },
    mountain_root_canon_6: {
      id: 'mountain_root_canon_6',
      name: 'Mountain Root Canon VI',
      type: 'martial',
      tier: 6,
      statBoosts: { vit: 60, str: 30 },
      physicalSkillBonus: 0.38,
      magicalSkillBonus: 0,
      unlockedSkillId: 'unshakeable_stance',
      flavorText: 'The mountain does not fight the wind. It outlasts it.',
      dropSources: 'area level 41-60, boss/unique tier',
    },

    blade_echo_codex_3: {
      id: 'blade_echo_codex_3',
      name: 'Blade Echo Codex III',
      type: 'martial',
      tier: 3,
      statBoosts: { str: 20, dex: 16 },
      physicalSkillBonus: 0.18,
      magicalSkillBonus: 0,
      unlockedSkillId: null,
      flavorText: 'Every strike leaves an echo. Train until the echoes overlap.',
      dropSources: 'area level 11-40, rare/boss tier',
    },
    jade_fist_manual_4: {
      id: 'jade_fist_manual_4',
      name: 'Jade Fist Manual IV',
      type: 'martial',
      tier: 4,
      statBoosts: { str: 35, dex: 20, vit: 10 },
      physicalSkillBonus: 0.22,
      magicalSkillBonus: 0.05,
      unlockedSkillId: null,
      flavorText: 'Jade yields but never breaks. Your fist must become jade.',
      dropSources: 'area level 21-40, boss tier',
    },

    // ── SOUL BOOKS (T1–T7) ────────────────────

    void_heart_scripture_1: {
      id: 'void_heart_scripture_1',
      name: 'Void Heart Scripture I',
      type: 'soul',
      tier: 1,
      statBoosts: { int: 6, wis: 4 },
      physicalSkillBonus: 0,
      magicalSkillBonus: 0.05,
      unlockedSkillId: null,
      flavorText: 'Empty the mind. The void is not nothingness — it is potential.',
      dropSources: 'area level 1-10, normal/rare tier',
    },
    void_heart_scripture_4: {
      id: 'void_heart_scripture_4',
      name: 'Void Heart Scripture IV',
      type: 'soul',
      tier: 4,
      statBoosts: { int: 40, wis: 22 },
      physicalSkillBonus: 0,
      magicalSkillBonus: 0.25,
      unlockedSkillId: null,
      flavorText: 'Through the void, the heavens speak.',
      dropSources: 'area level 21-40, boss/unique tier',
    },
    void_heart_scripture_7: {
      id: 'void_heart_scripture_7',
      name: 'Void Heart Scripture VII',
      type: 'soul',
      tier: 7,
      statBoosts: { int: 90, wis: 55 },
      physicalSkillBonus: 0,
      magicalSkillBonus: 0.55,
      unlockedSkillId: 'void_rupture',
      flavorText: 'Legendary. The void listens. The void obeys.',
      dropSources: 'area level 41-60, unique boss tier',
    },

    ember_chant_2: {
      id: 'ember_chant_2',
      name: 'Ember Chant II',
      type: 'soul',
      tier: 2,
      statBoosts: { int: 12, wis: 8 },
      physicalSkillBonus: 0,
      magicalSkillBonus: 0.10,
      unlockedSkillId: null,
      flavorText: 'Breathe. Every breath fans the inner ember.',
      dropSources: 'area level 1-20, rare tier',
    },
    ember_chant_5: {
      id: 'ember_chant_5',
      name: 'Ember Chant V',
      type: 'soul',
      tier: 5,
      statBoosts: { int: 32, wis: 28 },
      physicalSkillBonus: 0,
      magicalSkillBonus: 0.32,
      unlockedSkillId: 'conflagration_pulse',
      flavorText: 'The ember becomes inferno. The breath becomes wind.',
      dropSources: 'area level 21-60, boss tier',
    },

    serpent_tongue_doctrine_3: {
      id: 'serpent_tongue_doctrine_3',
      name: 'Serpent Tongue Doctrine III',
      type: 'soul',
      tier: 3,
      statBoosts: { int: 20, luk: 12 },
      physicalSkillBonus: 0,
      magicalSkillBonus: 0.16,
      unlockedSkillId: null,
      flavorText: 'The serpent does not attack first. It simply never misses.',
      dropSources: 'area level 11-40, rare tier',
    },

    starfall_invocation_6: {
      id: 'starfall_invocation_6',
      name: 'Starfall Invocation VI',
      type: 'soul',
      tier: 6,
      statBoosts: { int: 60, wis: 35 },
      physicalSkillBonus: 0,
      magicalSkillBonus: 0.42,
      unlockedSkillId: 'starfall_cascade',
      flavorText: 'To call the stars down, you must first become one.',
      dropSources: 'area level 41-60, boss/unique tier',
    },

    tidal_mind_sutra_3: {
      id: 'tidal_mind_sutra_3',
      name: 'Tidal Mind Sutra III',
      type: 'soul',
      tier: 3,
      statBoosts: { int: 18, wis: 16, vit: 6 },
      physicalSkillBonus: 0,
      magicalSkillBonus: 0.14,
      unlockedSkillId: null,
      flavorText: 'The tide does not rush. Yet it reshapes all coastlines.',
      dropSources: 'area level 11-40, rare/boss tier',
    },
    pale_moon_canticle_4: {
      id: 'pale_moon_canticle_4',
      name: 'Pale Moon Canticle IV',
      type: 'soul',
      tier: 4,
      statBoosts: { wis: 30, int: 20 },
      physicalSkillBonus: 0.05,
      magicalSkillBonus: 0.20,
      unlockedSkillId: null,
      flavorText: 'The pale moon casts no shadow but illuminates all secrets.',
      dropSources: 'area level 21-40, boss tier',
    },

    // ── SPECIAL UNLOCK BOOKS (5) ──────────────

    boundless_heart_manual: {
      id: 'boundless_heart_manual',
      name: 'Boundless Heart Manual',
      type: 'martial',
      tier: 5,
      statBoosts: { str: 20, vit: 20, dex: 20 },
      physicalSkillBonus: 0.20,
      magicalSkillBonus: 0.10,
      unlockedSkillId: 'boundless_strike',
      flavorText: 'No ceiling, no floor. Only the horizon and the will to reach it.',
      dropSources: 'area level 31-60, unique boss only',
    },
    eclipse_meridian_codex: {
      id: 'eclipse_meridian_codex',
      name: 'Eclipse Meridian Codex',
      type: 'soul',
      tier: 6,
      statBoosts: { int: 45, wis: 25, luk: 15 },
      physicalSkillBonus: 0.10,
      magicalSkillBonus: 0.35,
      unlockedSkillId: 'eclipse_nova',
      flavorText: 'When sun and moon align, so do flesh and spirit.',
      dropSources: 'area level 41-60, unique boss only',
    },
    twin_souls_doctrine: {
      id: 'twin_souls_doctrine',
      name: 'Twin Souls Doctrine',
      type: 'soul',
      tier: 4,
      statBoosts: { int: 25, wis: 20, str: 15 },
      physicalSkillBonus: 0.12,
      magicalSkillBonus: 0.18,
      unlockedSkillId: 'soul_resonance',
      flavorText: 'Two truths coexist: the fist and the flame. Master both.',
      dropSources: 'area level 21-40, boss tier',
    },
    feral_king_tome: {
      id: 'feral_king_tome',
      name: 'Feral King Tome',
      type: 'martial',
      tier: 5,
      statBoosts: { str: 35, dex: 25, luk: 10 },
      physicalSkillBonus: 0.28,
      magicalSkillBonus: 0,
      unlockedSkillId: 'primal_rampage',
      flavorText: 'The beast was not tamed. The beast became king.',
      dropSources: 'area level 31-50, unique boss only',
    },
    heaven_defying_scripture: {
      id: 'heaven_defying_scripture',
      name: 'Heaven-Defying Scripture',
      type: 'soul',
      tier: 7,
      statBoosts: { int: 80, wis: 50, str: 30 },
      physicalSkillBonus: 0.20,
      magicalSkillBonus: 0.50,
      unlockedSkillId: 'heaven_rend',
      flavorText: 'Legendary. The heavens set limits. This book burned the sky.',
      dropSources: 'area level 41-60, legendary unique boss only',
    },
  };

  // ─────────────────────────────────────────────
  //  BOOK QUALITY MATRIX
  // ─────────────────────────────────────────────

  /**
   * areaLevel  1-10:  normal→T1, rare→T2, boss→T3, unique→T4
   * areaLevel 11-20:  normal→T2, rare→T3, boss→T4, unique→T5
   * areaLevel 21-40:  normal→T3, rare→T4, boss→T5, unique→T6
   * areaLevel 41-60:  normal→T4, rare→T5, boss→T6, unique→T7
   */
  const BOOK_QUALITY_MATRIX = [
    { minArea: 1,  maxArea: 10, normal: 1, rare: 2, boss: 3, unique: 4 },
    { minArea: 11, maxArea: 20, normal: 2, rare: 3, boss: 4, unique: 5 },
    { minArea: 21, maxArea: 40, normal: 3, rare: 4, boss: 5, unique: 6 },
    { minArea: 41, maxArea: 60, normal: 4, rare: 5, boss: 6, unique: 7 },
  ];

  function getBookTierFromMatrix(areaLevel, monsterTier) {
    for (const row of BOOK_QUALITY_MATRIX) {
      if (areaLevel >= row.minArea && areaLevel <= row.maxArea) {
        return row[monsterTier] || row.normal;
      }
    }
    return 1;
  }

  // ─────────────────────────────────────────────
  //  2. MONSTER CORE DEFINITIONS (9 cores)
  // ─────────────────────────────────────────────

  const CORES = {
    inferno_drake_core: {
      id: 'inferno_drake_core',
      name: 'Inferno Drake Core',
      sourceMonster: 'inferno_drake',
      levelRequirement: 25,
      isBossCore: true,
      statBoosts: { str: 15, int: 20 },
      skillAffinity: ['fire'],
      affinityBonus: 0.20,
      passiveEffect: { type: 'fire_dot', description: 'Attacks apply a small fire DoT (5% weapon dmg/s, 3s)' },
      dropChance: 0.01,
      flavorText: 'The ember of a fallen dragon, still burning.',
    },
    void_spider_core: {
      id: 'void_spider_core',
      name: 'Void Spider Core',
      sourceMonster: 'void_spider',
      levelRequirement: 12,
      isBossCore: false,
      statBoosts: { dex: 18, luk: 10 },
      skillAffinity: ['poison', 'darkness'],
      affinityBonus: 0.12,
      passiveEffect: { type: 'web_slow', description: 'Physical attacks have 10% chance to slow target 25% for 2s' },
      dropChance: 0.025,
      flavorText: 'The darkness between stars — distilled into silk.',
    },
    stone_colossus_core: {
      id: 'stone_colossus_core',
      name: 'Stone Colossus Core',
      sourceMonster: 'stone_colossus',
      levelRequirement: 30,
      isBossCore: true,
      statBoosts: { vit: 40, str: 20 },
      skillAffinity: ['earth', 'physical'],
      affinityBonus: 0.18,
      passiveEffect: { type: 'damage_reduction', description: 'Reduces incoming physical damage by 8%' },
      dropChance: 0.008,
      flavorText: 'A heartbeat of stone. Heavy. Eternal. Unyielding.',
    },
    frost_wraith_core: {
      id: 'frost_wraith_core',
      name: 'Frost Wraith Core',
      sourceMonster: 'frost_wraith',
      levelRequirement: 20,
      isBossCore: false,
      statBoosts: { int: 22, wis: 14 },
      skillAffinity: ['ice', 'wind'],
      affinityBonus: 0.15,
      passiveEffect: { type: 'chill_on_hit', description: 'Magic attacks reduce enemy attack speed by 12% for 3s' },
      dropChance: 0.02,
      flavorText: 'Cold does not hate. It simply takes.',
    },
    lightning_hawk_core: {
      id: 'lightning_hawk_core',
      name: 'Lightning Hawk Core',
      sourceMonster: 'lightning_hawk',
      levelRequirement: 18,
      isBossCore: false,
      statBoosts: { dex: 25, str: 12 },
      skillAffinity: ['lightning', 'wind'],
      affinityBonus: 0.14,
      passiveEffect: { type: 'chain_spark', description: '8% chance on hit to arc to nearest enemy for 40% dmg' },
      dropChance: 0.02,
      flavorText: 'Forged in the storm. Released in a single dive.',
    },
    abyssal_leech_core: {
      id: 'abyssal_leech_core',
      name: 'Abyssal Leech Core',
      sourceMonster: 'abyssal_leech',
      levelRequirement: 35,
      isBossCore: false,
      statBoosts: { vit: 25, wis: 20 },
      skillAffinity: ['darkness', 'poison'],
      affinityBonus: 0.16,
      passiveEffect: { type: 'lifesteal', description: 'Heals for 3% of damage dealt with darkness/poison skills' },
      dropChance: 0.015,
      flavorText: 'It does not kill. It drains. And feeds. And drains.',
    },
    jade_serpent_core: {
      id: 'jade_serpent_core',
      name: 'Jade Serpent Core',
      sourceMonster: 'jade_serpent',
      levelRequirement: 40,
      isBossCore: true,
      statBoosts: { int: 30, dex: 25, luk: 15 },
      skillAffinity: ['earth', 'poison'],
      affinityBonus: 0.22,
      passiveEffect: { type: 'venomous_aura', description: 'Passive poison aura deals 15 dmg/s to nearby enemies' },
      dropChance: 0.007,
      flavorText: 'The jade coils. The jade waits. The jade strikes once.',
    },
    celestial_crane_core: {
      id: 'celestial_crane_core',
      name: 'Celestial Crane Core',
      sourceMonster: 'celestial_crane',
      levelRequirement: 45,
      isBossCore: true,
      statBoosts: { wis: 35, int: 28 },
      skillAffinity: ['wind', 'holy'],
      affinityBonus: 0.25,
      passiveEffect: { type: 'grace_heal', description: 'Skill cast has 15% chance to restore 2% max HP' },
      dropChance: 0.006,
      flavorText: 'It flew once above the clouds. It chose not to return.',
    },
    devouring_maw_core: {
      id: 'devouring_maw_core',
      name: 'Devouring Maw Core',
      sourceMonster: 'devouring_maw',
      levelRequirement: 50,
      isBossCore: true,
      statBoosts: { str: 45, vit: 30, int: 20 },
      skillAffinity: ['darkness', 'physical'],
      affinityBonus: 0.28,
      passiveEffect: { type: 'hungering_strikes', description: 'Every 5th attack deals +60% damage and restores 5% HP' },
      dropChance: 0.005,
      flavorText: 'The void hungered before worlds existed. It still does.',
    },
  };

  // ─────────────────────────────────────────────
  //  3. GEAR BASE TYPES & AFFIX TABLES
  // ─────────────────────────────────────────────

  /**
   * Slots: helm, chest, weapon, boots, gloves, ring
   * Each slot has base item types with iLvl requirements and stat ranges.
   */

  const GEAR_BASES = {
    helm: [
      { id: 'leather_cap',    name: 'Leather Cap',    iLvlReq: 1,  base: { vit: [3,6],  dex: [2,4] } },
      { id: 'iron_helm',      name: 'Iron Helm',      iLvlReq: 15, base: { vit: [8,14], str: [4,8] } },
      { id: 'dragonbone_helm',name: 'Dragonbone Helm',iLvlReq: 40, base: { vit: [20,32],str: [12,20],int: [5,10] } },
    ],
    chest: [
      { id: 'cloth_robe',       name: 'Cloth Robe',       iLvlReq: 1,  base: { int: [4,7],  wis: [3,5] } },
      { id: 'chain_mail',       name: 'Chain Mail',       iLvlReq: 15, base: { vit: [10,18], str: [5,10] } },
      { id: 'cultivators_vest', name: 'Cultivator\'s Vest',iLvlReq: 40, base: { vit: [18,28], int: [10,18], str: [8,14] } },
    ],
    weapon: [
      { id: 'bone_staff',       name: 'Bone Staff',     iLvlReq: 1,  base: { int: [5,9],  wis: [3,6],  dmg: [8,14] } },
      { id: 'iron_sword',       name: 'Iron Sword',     iLvlReq: 1,  base: { str: [4,8],  dex: [2,5],  dmg: [12,18] } },
      { id: 'jade_halberd',     name: 'Jade Halberd',   iLvlReq: 20, base: { str: [12,20],dex: [6,12], dmg: [22,34] } },
      { id: 'void_catalyst',    name: 'Void Catalyst',  iLvlReq: 35, base: { int: [18,30],wis: [10,18],dmg: [18,26] } },
      { id: 'celestial_blade',  name: 'Celestial Blade',iLvlReq: 45, base: { str: [24,38],int: [16,26],dmg: [35,52] } },
    ],
    boots: [
      { id: 'sandals',         name: 'Sandals',         iLvlReq: 1,  base: { dex: [3,6]  } },
      { id: 'iron_greaves',    name: 'Iron Greaves',    iLvlReq: 12, base: { vit: [6,10], dex: [4,7] } },
      { id: 'wind_treads',     name: 'Wind Treads',     iLvlReq: 30, base: { dex: [14,22],luk: [6,10] } },
    ],
    gloves: [
      { id: 'cloth_wraps',     name: 'Cloth Wraps',     iLvlReq: 1,  base: { dex: [2,5], int: [2,4] } },
      { id: 'iron_gauntlets',  name: 'Iron Gauntlets',  iLvlReq: 12, base: { str: [5,9],  vit: [3,6] } },
      { id: 'jade_palms',      name: 'Jade Palms',      iLvlReq: 35, base: { str: [12,18],dex: [10,16],int: [6,10] } },
    ],
    ring: [
      { id: 'copper_ring',     name: 'Copper Ring',     iLvlReq: 1,  base: { luk: [3,6]  } },
      { id: 'silver_band',     name: 'Silver Band',     iLvlReq: 10, base: { luk: [7,12], wis: [4,8] } },
      { id: 'soul_signet',     name: 'Soul Signet',     iLvlReq: 35, base: { int: [14,22],wis: [10,18],luk: [8,14] } },
    ],
  };

  // ── PREFIXES (13) ─────────────────────────────

  const GEAR_PREFIXES = [
    { id: 'heavy',       name: 'Heavy',        iLvlReq: 1,  modStat: 'str',  modRange: [3,8],   weight: 20 },
    { id: 'swift',       name: 'Swift',        iLvlReq: 1,  modStat: 'dex',  modRange: [3,8],   weight: 20 },
    { id: 'sturdy',      name: 'Sturdy',       iLvlReq: 1,  modStat: 'vit',  modRange: [4,10],  weight: 20 },
    { id: 'wise',        name: 'Wise',         iLvlReq: 5,  modStat: 'wis',  modRange: [3,8],   weight: 18 },
    { id: 'arcane',      name: 'Arcane',       iLvlReq: 5,  modStat: 'int',  modRange: [3,8],   weight: 18 },
    { id: 'fortunate',   name: 'Fortunate',    iLvlReq: 5,  modStat: 'luk',  modRange: [2,6],   weight: 14 },
    { id: 'iron',        name: 'Iron',         iLvlReq: 15, modStat: 'str',  modRange: [10,20], weight: 15 },
    { id: 'gale',        name: 'Gale',         iLvlReq: 15, modStat: 'dex',  modRange: [10,20], weight: 15 },
    { id: 'granite',     name: 'Granite',      iLvlReq: 15, modStat: 'vit',  modRange: [12,24], weight: 15 },
    { id: 'void_kissed', name: 'Void-Kissed',  iLvlReq: 30, modStat: 'int',  modRange: [18,35], weight: 10 },
    { id: 'celestial',   name: 'Celestial',    iLvlReq: 40, modStat: 'wis',  modRange: [22,40], weight: 7  },
    { id: 'dragonborn',  name: 'Dragonborn',   iLvlReq: 40, modStat: 'str',  modRange: [25,45], weight: 7  },
    { id: 'legendary',   name: 'Legendary',    iLvlReq: 50, modStat: 'str',  modRange: [40,60], weight: 3  },
  ];

  // ── SUFFIXES (13) ─────────────────────────────

  const GEAR_SUFFIXES = [
    { id: 'of_the_bear',    name: 'of the Bear',    iLvlReq: 1,  modStat: 'vit',          modRange: [4,9],  weight: 20 },
    { id: 'of_the_fox',     name: 'of the Fox',     iLvlReq: 1,  modStat: 'dex',          modRange: [3,7],  weight: 20 },
    { id: 'of_the_sage',    name: 'of the Sage',    iLvlReq: 5,  modStat: 'int',          modRange: [3,7],  weight: 18 },
    { id: 'of_the_monk',    name: 'of the Monk',    iLvlReq: 5,  modStat: 'wis',          modRange: [3,7],  weight: 18 },
    { id: 'of_resilience',  name: 'of Resilience',  iLvlReq: 10, modStat: 'physResist',   modRange: [2,5],  weight: 14 },
    { id: 'of_warding',     name: 'of Warding',     iLvlReq: 10, modStat: 'magResist',    modRange: [2,5],  weight: 14 },
    { id: 'of_the_tiger',   name: 'of the Tiger',   iLvlReq: 20, modStat: 'critChance',   modRange: [2,5],  weight: 12 },
    { id: 'of_cruelty',     name: 'of Cruelty',     iLvlReq: 20, modStat: 'critDmg',      modRange: [10,20],weight: 12 },
    { id: 'of_the_phoenix', name: 'of the Phoenix', iLvlReq: 30, modStat: 'fireBonus',    modRange: [8,16], weight: 9  },
    { id: 'of_the_abyss',   name: 'of the Abyss',   iLvlReq: 30, modStat: 'darkBonus',    modRange: [8,16], weight: 9  },
    { id: 'of_storms',      name: 'of Storms',      iLvlReq: 35, modStat: 'lightningBonus',modRange:[10,20],weight: 8  },
    { id: 'of_transcendence',name:'of Transcendence',iLvlReq:45,  modStat: 'allStats',     modRange: [8,14], weight: 4  },
    { id: 'of_the_heavens', name: 'of the Heavens', iLvlReq: 50, modStat: 'allStats',     modRange: [12,20],weight: 2  },
  ];

  // ── UNIQUE ITEMS (one per slot) ───────────────

  const UNIQUE_ITEMS = {
    helm: {
      id: 'crown_of_the_cultivator',
      name: 'Crown of the Cultivator',
      slot: 'helm',
      iLvlReq: 40,
      baseType: 'dragonbone_helm',
      affixes: [
        { stat: 'int', value: 30 }, { stat: 'wis', value: 25 },
        { stat: 'physicalSkillBonus', value: 0.10 }, { stat: 'magicalSkillBonus', value: 0.10 },
      ],
      flavorText: 'A crown for those who cultivate both body and spirit.',
    },
    chest: {
      id: 'robe_of_ten_thousand_sutras',
      name: 'Robe of Ten Thousand Sutras',
      slot: 'chest',
      iLvlReq: 45,
      baseType: 'cultivators_vest',
      affixes: [
        { stat: 'int', value: 40 }, { stat: 'vit', value: 30 },
        { stat: 'magResist', value: 15 }, { stat: 'magicalSkillBonus', value: 0.20 },
      ],
      flavorText: 'Every stitch is a word. Every word, a truth.',
    },
    weapon: {
      id: 'sovereign_edge',
      name: 'Sovereign Edge',
      slot: 'weapon',
      iLvlReq: 50,
      baseType: 'celestial_blade',
      affixes: [
        { stat: 'str', value: 50 }, { stat: 'int', value: 30 },
        { stat: 'critChance', value: 8 }, { stat: 'critDmg', value: 40 },
      ],
      flavorText: 'There is no second strike. There is no need.',
    },
    boots: {
      id: 'steps_of_the_first_cultivator',
      name: 'Steps of the First Cultivator',
      slot: 'boots',
      iLvlReq: 40,
      baseType: 'wind_treads',
      affixes: [
        { stat: 'dex', value: 30 }, { stat: 'luk', value: 20 },
        { stat: 'physResist', value: 8 }, { stat: 'physicalSkillBonus', value: 0.12 },
      ],
      flavorText: 'He walked the realm once. No one saw where he went.',
    },
    gloves: {
      id: 'jade_emperor_palms',
      name: 'Jade Emperor Palms',
      slot: 'gloves',
      iLvlReq: 45,
      baseType: 'jade_palms',
      affixes: [
        { stat: 'str', value: 28 }, { stat: 'dex', value: 24 },
        { stat: 'critChance', value: 6 }, { stat: 'physicalSkillBonus', value: 0.18 },
      ],
      flavorText: 'The emperor strikes once. The world remembers forever.',
    },
    ring: {
      id: 'ring_of_infinite_return',
      name: 'Ring of Infinite Return',
      slot: 'ring',
      iLvlReq: 50,
      baseType: 'soul_signet',
      affixes: [
        { stat: 'allStats', value: 15 }, { stat: 'luk', value: 20 },
        { stat: 'magicalSkillBonus', value: 0.12 }, { stat: 'physicalSkillBonus', value: 0.12 },
      ],
      flavorText: 'Death is a door. This ring is the key that opens it inward.',
    },
  };

  // ─────────────────────────────────────────────
  //  4. CHARACTER ORIGINS
  // ─────────────────────────────────────────────

  const ORIGINS = {
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

  // ─────────────────────────────────────────────
  //  5. CATALYST ITEM DEFINITION
  // ─────────────────────────────────────────────

  const CATALYSTS = {
    soulForgeCatalyst: {
      id: 'soul_forge_catalyst',
      name: 'Soul Forge Catalyst',
      type: 'catalyst',
      stackable: true,
      flavorText: 'The residue of a Nightmare boss\'s death. Heat refines. The forge remembers.',
      dropSources: 'Nightmare difficulty boss kills',
    },
  };

  // ─────────────────────────────────────────────
  //  STAT FORMULA HELPERS
  //  These mirror the stubs in engine.js and must stay in sync.
  //  engine.js calls window.GameData.calcMaxHP / calcMaxSoul on create()
  //  and on level-up, so they must exist on the exposed GameData object.
  // ─────────────────────────────────────────────

  function calcMaxHP(vit, level) {
    return 80 + vit * 4 + level * 5;
  }

  function calcMaxSoul(wis, level) {
    return 40 + wis * 4 + level * 3;
  }

  function getStatBonuses(originId) {
    const origin = ORIGINS[originId];
    if (!origin) return { str:0, dex:0, vit:0, int:0, wis:0, luk:0 };
    return { ...origin.baseStats };
  }

  // ─────────────────────────────────────────────
  //  EXPOSE window.GameData
  // ─────────────────────────────────────────────

  window.GameData = {
    books: BOOKS,
    cores: CORES,
    gear: {
      bases: GEAR_BASES,
      uniques: UNIQUE_ITEMS,
    },
    gearAffixes: {
      prefixes: GEAR_PREFIXES,
      suffixes: GEAR_SUFFIXES,
    },
    origins: ORIGINS,
    skills: {}, // Populated by Agent 1 — GameData.skills is a read reference
    catalysts: CATALYSTS,
    bookQualityMatrix: BOOK_QUALITY_MATRIX,

    // Stat formulas — called by engine.js on create() and level-up
    calcMaxHP,
    calcMaxSoul,
    getStatBonuses,
  };

  // ─────────────────────────────────────────────
  //  6. PROCEDURAL GEAR GENERATION
  // ─────────────────────────────────────────────

  /**
   * Rarity tiers:
   *   normal  — no affixes
   *   magic   — 1-2 affixes
   *   rare    — 2-4 affixes
   *   unique  — fixed affix set
   */

  function getBaseItemForSlot(slot, iLvl) {
    const bases = GEAR_BASES[slot];
    if (!bases) return null;
    // Pick highest eligible base that doesn't exceed iLvl
    const eligible = bases.filter(b => b.iLvlReq <= iLvl);
    return eligible.length ? eligible[eligible.length - 1] : bases[0];
  }

  function rollBaseStats(base) {
    const rolled = {};
    for (const [stat, range] of Object.entries(base.base)) {
      rolled[stat] = randInt(range[0], range[1]);
    }
    return rolled;
  }

  function rollAffixes(iLvl, count, pool) {
    const eligible = pool.filter(a => a.iLvlReq <= iLvl);
    const weightTable = eligible.map(a => ({ weight: a.weight, value: a }));
    const chosen = [];
    const usedIds = new Set();
    for (let i = 0; i < count; i++) {
      const available = weightTable.filter(e => !usedIds.has(e.value.id));
      if (!available.length) break;
      const picked = weightedPick(available);
      usedIds.add(picked.id);
      const rollValue = randInt(picked.modRange[0], picked.modRange[1]);
      chosen.push({ id: picked.id, name: picked.name, stat: picked.modStat, value: rollValue });
    }
    return chosen;
  }

  function rollGearItem(iLvl, slot, rarity) {
    // Resolve slot and rarity
    const validSlots = Object.keys(GEAR_BASES);
    const resolvedSlot = slot || validSlots[randInt(0, validSlots.length - 1)];
    const resolvedRarity = rarity || weightedPick([
      { weight: 60, value: 'normal' },
      { weight: 30, value: 'magic'  },
      { weight: 9,  value: 'rare'   },
      { weight: 1,  value: 'unique' },
    ]);

    // Handle unique — return fixed item
    if (resolvedRarity === 'unique') {
      const uniq = UNIQUE_ITEMS[resolvedSlot];
      if (uniq && uniq.iLvlReq <= iLvl) {
        return Object.assign({}, uniq, {
          slot: resolvedSlot,
          rarity: 'unique',
          isSoulForged: false,
          iLvl,
        });
      }
      // Fall back to rare if unique not eligible
      return rollGearItem(iLvl, resolvedSlot, 'rare');
    }

    const base = getBaseItemForSlot(resolvedSlot, iLvl);
    if (!base) return null;

    const stats = rollBaseStats(base);
    let affixes = [];

    if (resolvedRarity === 'magic') {
      const prefixCount = randInt(0, 1);
      const suffixCount = randInt(1, 2 - prefixCount) || 1;
      affixes = [
        ...rollAffixes(iLvl, prefixCount, GEAR_PREFIXES),
        ...rollAffixes(iLvl, suffixCount, GEAR_SUFFIXES),
      ].slice(0, 2);
    } else if (resolvedRarity === 'rare') {
      const prefixCount = randInt(1, 2);
      const suffixCount = randInt(1, 2);
      affixes = [
        ...rollAffixes(iLvl, prefixCount, GEAR_PREFIXES),
        ...rollAffixes(iLvl, suffixCount, GEAR_SUFFIXES),
      ].slice(0, 4);
    }

    // Build display name for magic/rare
    let name = base.name;
    if (resolvedRarity === 'magic' || resolvedRarity === 'rare') {
      const prefix = affixes.find(a => GEAR_PREFIXES.some(p => p.id === a.id));
      const suffix = affixes.find(a => GEAR_SUFFIXES.some(s => s.id === a.id));
      if (prefix) name = prefix.name + ' ' + name;
      if (suffix) name = name + ' ' + suffix.name;
    }

    return {
      id: base.id + '_' + resolvedRarity + '_' + Date.now(),
      name,
      slot: resolvedSlot,
      baseType: base.id,
      rarity: resolvedRarity,
      iLvl,
      baseStats: stats,
      affixes,
      isSoulForged: false,
    };
  }

  // ─────────────────────────────────────────────
  //  7. LOOT ENGINE
  // ─────────────────────────────────────────────

  /**
   * rollBookDrop — picks a book from BOOKS matching the required tier
   */
  function rollBookDrop(areaLevel, monsterTier) {
    const targetTier = getBookTierFromMatrix(areaLevel, monsterTier);
    const matches = Object.values(BOOKS).filter(b => b.tier === targetTier);
    if (!matches.length) return null;
    const book = matches[randInt(0, matches.length - 1)];
    return { itemType: 'book', bookId: book.id, name: book.name, tier: book.tier, rarity: monsterTier };
  }

  /**
   * rollCoreDrop — returns a core for the specific monster, or a random eligible core
   */
  function rollCoreDrop(monster) {
    // Try to find a core matching the monster type
    const specific = Object.values(CORES).find(c => c.sourceMonster === monster.type);
    if (specific) return { itemType: 'core', coreId: specific.id, name: specific.name };
    // Fallback: random core
    const all = Object.values(CORES);
    const picked = all[randInt(0, all.length - 1)];
    return { itemType: 'core', coreId: picked.id, name: picked.name };
  }

  /**
   * applyCatalyst — marks a gear item as Soul Forged
   */
  function applyCatalyst(gearItem) {
    gearItem.isSoulForged = true;
    return gearItem;
  }

  /**
   * rollDrops — main loot resolution called on monster:died
   * Returns LootItem[]
   */
  function rollDrops(monster, area) {
    const drops = [];
    const tier = monster.tier || 'normal'; // 'normal'|'rare'|'boss'|'unique'
    const isBoss = tier === 'boss' || tier === 'unique';
    const areaLevel = (area && area.level) || 1;
    const monsterLevel = monster.level || 1;

    // ── Gold drop ──
    const baseGold = monsterLevel * 5;
    const gold = randInt(baseGold * 0.7, baseGold * 1.4);
    drops.push({ itemType: 'gold', amount: gold });

    // ── Gear drop ──
    const gearChance = 0.30;
    if (chance(gearChance)) {
      const rarityTable = [
        { weight: 60, value: 'normal' },
        { weight: 30, value: 'magic'  },
        { weight: 9,  value: 'rare'   },
        { weight: 1,  value: 'unique' },
      ];
      const gearRarity = weightedPick(rarityTable);
      const iLvl = Math.max(1, areaLevel + randInt(-2, 2));
      const gearSlots = Object.keys(GEAR_BASES);
      const slot = gearSlots[randInt(0, gearSlots.length - 1)];
      const item = rollGearItem(iLvl, slot, gearRarity);
      if (item) drops.push(Object.assign({ itemType: 'gear' }, item));
    }

    // ── Book drop ──
    const bookChanceTable = { normal: 0.05, rare: 0.15, boss: 0.40, unique: 0.60 };
    if (chance(bookChanceTable[tier] || 0.05)) {
      const book = rollBookDrop(areaLevel, tier);
      if (book) drops.push(book);
    }

    // ── Core drop ──
    const coreChanceTable = { normal: 0.005, rare: 0.02, boss: 0.05, unique: 0.15 };
    if (isBoss || chance(coreChanceTable[tier] || 0.005)) {
      // unique bosses always roll core
      const coreActualChance = (tier === 'unique') ? coreChanceTable.unique : coreChanceTable[tier];
      if (chance(coreActualChance)) {
        const core = rollCoreDrop(monster);
        if (core) drops.push(core);
      }
    }

    // ── Soul Forge Catalyst ──
    // 0% Normal, 0% Nightmare stage 1 (handled via GameState flag)
    // Guaranteed 1× first Nightmare boss kill per prestige cycle, 3% thereafter
    const player = getPlayer();
    if (player && isBoss) {
      const isNightmare = (window.GameState && window.GameState.difficulty === 'nightmare');
      if (isNightmare) {
        const catalystKey = 'firstNightmareBossKilledThisPrestige';
        if (!player[catalystKey]) {
          player[catalystKey] = true;
          drops.push({ itemType: 'catalyst', catalystId: 'soul_forge_catalyst', name: 'Soul Forge Catalyst', amount: 1 });
        } else if (chance(0.03)) {
          drops.push({ itemType: 'catalyst', catalystId: 'soul_forge_catalyst', name: 'Soul Forge Catalyst', amount: 1 });
        }
      }
    }

    return drops;
  }

  // ── HOOK: Agent 1 — listens to GameEventBus.on('monster:died') ──
  function initLootEventListener() {
    if (!window.GameEventBus) {
      // Retry after GameEventBus is defined
      setTimeout(initLootEventListener, 200);
      return;
    }
    window.GameEventBus.on('monster:died', ({ monster, position, area }) => {
      const items = rollDrops(monster, area || {});
      emit('loot:dropped', { items, position });
    });
  }
  initLootEventListener();

  window.LootEngine = {
    rollDrops,
    rollGearItem,
    rollBookDrop,
    rollCoreDrop,
    applyCatalyst,
  };

  // ─────────────────────────────────────────────
  //  8. BOOK LEARN & ACTIVATION SYSTEM
  // ─────────────────────────────────────────────

  window.BookSystem = {
    /**
     * learnBook — adds to player.learnedBooks if not already learned.
     * Can be called any time (not prestige-gated).
     */
    learnBook(bookId) {
      const player = getPlayer();
      if (!player) return { success: false, reason: 'No player state' };
      if (!BOOKS[bookId]) return { success: false, reason: 'Unknown book' };
      if (!player.learnedBooks) player.learnedBooks = [];
      if (player.learnedBooks.includes(bookId)) {
        return { success: false, reason: 'Already learned' };
      }
      player.learnedBooks.push(bookId);
      // HOOK: Agent 3 — emit book:learned for UI refresh
      emit('book:learned', { bookId });
      return { success: true, bookId };
    },

    /**
     * activateBook — sets the active martial or soul book.
     * Only valid during prestige selection or via PrestigeManager.executePrestige().
     * Slot: 'martial' | 'soul'
     */
    activateBook(bookId, slot) {
      const player = getPlayer();
      if (!player) return { success: false, reason: 'No player state' };
      if (!this.canActivate(bookId)) return { success: false, reason: 'Book not learned or wrong timing' };
      const book = BOOKS[bookId];
      if (!book) return { success: false, reason: 'Unknown book' };
      if (slot === 'martial' && book.type !== 'martial') return { success: false, reason: 'Wrong book type for martial slot' };
      if (slot === 'soul' && book.type !== 'soul') return { success: false, reason: 'Wrong book type for soul slot' };
      if (slot === 'martial') player.activeMartialBook = bookId;
      else if (slot === 'soul') player.activeSoulBook = bookId;
      // HOOK: Agent 3 — emit book:activated for UI refresh
      emit('book:activated', { bookId, slot });
      return { success: true, bookId, slot };
    },

    /**
     * getActiveBookEffects — returns combined stat boosts + skill bonuses
     * from both active books.
     */
    getActiveBookEffects() {
      const player = getPlayer();
      const effects = { statBoosts: {}, physicalSkillBonus: 0, magicalSkillBonus: 0, unlockedSkills: [] };
      const activePair = [player?.activeMartialBook, player?.activeSoulBook].filter(Boolean);
      for (const bookId of activePair) {
        const book = BOOKS[bookId];
        if (!book) continue;
        for (const [stat, val] of Object.entries(book.statBoosts || {})) {
          effects.statBoosts[stat] = (effects.statBoosts[stat] || 0) + val;
        }
        effects.physicalSkillBonus += book.physicalSkillBonus || 0;
        effects.magicalSkillBonus  += book.magicalSkillBonus  || 0;
        if (book.unlockedSkillId) effects.unlockedSkills.push(book.unlockedSkillId);
      }
      return effects;
    },

    /**
     * canActivate — checks that the book is in player.learnedBooks
     * and the prestige window is open (player.inPrestigeWindow === true).
     * PrestigeManager.previewPrestige() and executePrestige() bypass this flag.
     */
    canActivate(bookId) {
      const player = getPlayer();
      if (!player) return false;
      if (!player.learnedBooks || !player.learnedBooks.includes(bookId)) return false;
      return !!player.inPrestigeWindow;
    },
  };

  // ─────────────────────────────────────────────
  //  9. CORE FUSION SYSTEM
  // ─────────────────────────────────────────────

  const CORE_SWAP_COOLDOWN_SECONDS = 300; // 5 minutes
  let coreSwapTimestamp = 0; // Unix ms when last swap happened

  window.CoreSystem = {
    /**
     * fuseCore — equip a core if level requirement is met.
     * Cannot swap in combat.
     */
    fuseCore(coreId) {
      const player = getPlayer();
      if (!player) return { success: false, reason: 'No player state' };
      if (!CORES[coreId]) return { success: false, reason: 'Unknown core' };
      if (!this.canFuse(coreId)) return { success: false, reason: 'Level requirement not met or in combat' };

      const cooldownLeft = this.swapCooldownRemaining();
      if (cooldownLeft > 0) return { success: false, reason: `Swap cooldown: ${cooldownLeft}s remaining` };

      const prevCoreId = player.activeCore;
      if (!player.ownedCores) player.ownedCores = [];
      if (!player.ownedCores.includes(coreId)) player.ownedCores.push(coreId);

      player.activeCore = coreId;
      coreSwapTimestamp = Date.now();

      if (prevCoreId && prevCoreId !== coreId) {
        // HOOK: Agent 3 — emit core:swapped for UI refresh
        emit('core:swapped', { fromCoreId: prevCoreId, toCoreId: coreId });
      } else {
        // HOOK: Agent 3 — emit core:fused for UI refresh
        emit('core:fused', { coreId });
      }
      return { success: true, coreId };
    },

    /**
     * unfuseCore — removes the active core, starts cooldown.
     */
    unfuseCore() {
      const player = getPlayer();
      if (!player || !player.activeCore) return { success: false, reason: 'No active core' };
      const prevCoreId = player.activeCore;
      player.activeCore = null;
      coreSwapTimestamp = Date.now();
      emit('core:swapped', { fromCoreId: prevCoreId, toCoreId: null });
      return { success: true };
    },

    /**
     * canFuse — checks level requirement and that player is not in combat.
     */
    canFuse(coreId) {
      const player = getPlayer();
      if (!player) return false;
      const core = CORES[coreId];
      if (!core) return false;
      if ((player.level || 1) < core.levelRequirement) return false;
      // Check combat state via Agent 1's GameState
      if (window.GameState && window.GameState.monstersAlive && window.GameState.monstersAlive.length > 0) return false;
      return true;
    },

    /**
     * getActiveCoreEffects — stat boosts + affinity bonus %
     */
    getActiveCoreEffects() {
      const player = getPlayer();
      if (!player || !player.activeCore) return { statBoosts: {}, affinityBonus: 0, skillAffinity: [], passiveEffect: null };
      const core = CORES[player.activeCore];
      if (!core) return { statBoosts: {}, affinityBonus: 0, skillAffinity: [], passiveEffect: null };
      return {
        statBoosts:    core.statBoosts || {},
        affinityBonus: core.affinityBonus || 0,
        skillAffinity: core.skillAffinity || [],
        passiveEffect: core.passiveEffect || null,
      };
    },

    /**
     * swapCooldownRemaining — seconds remaining on swap cooldown.
     */
    swapCooldownRemaining() {
      if (!coreSwapTimestamp) return 0;
      const elapsed = (Date.now() - coreSwapTimestamp) / 1000;
      return Math.max(0, CORE_SWAP_COOLDOWN_SECONDS - elapsed);
    },
  };

  // ─────────────────────────────────────────────
  //  10. PRESTIGE STATE MACHINE
  // ─────────────────────────────────────────────

  /**
   * Difficulty multipliers applied to GameState.difficultyMultiplier
   *
   * prestigeCount: how many times the player has prestiged (0 = first run)
   * difficulty:    'normal' | 'nightmare' | 'ascended'
   */
  function getDifficultyMultipliers(prestigeCount, difficulty) {
    const base = {
      normal:    { enemyHp: 1.0, enemyDmg: 1.0, xpGain: 1.0, dropRate: 1.0 },
      nightmare: { enemyHp: 1.8, enemyDmg: 1.6, xpGain: 1.5, dropRate: 1.4 },
      ascended:  { enemyHp: 3.0, enemyDmg: 2.5, xpGain: 2.2, dropRate: 2.0 },
    }[difficulty] || { enemyHp: 1.0, enemyDmg: 1.0, xpGain: 1.0, dropRate: 1.0 };

    // Scale up by prestige count: each prestige adds 10% to enemy stats, 5% to rewards
    const prestigeScale = 1 + (prestigeCount * 0.10);
    const rewardScale   = 1 + (prestigeCount * 0.05);
    return {
      enemyHp:  +(base.enemyHp  * prestigeScale).toFixed(3),
      enemyDmg: +(base.enemyDmg * prestigeScale).toFixed(3),
      xpGain:   +(base.xpGain   * rewardScale).toFixed(3),
      dropRate: +(base.dropRate  * rewardScale).toFixed(3),
    };
  }

  window.PrestigeManager = {

    /**
     * canPrestige — checks that the player has completed the prestige quest.
     * Requires player.prestigeQuestComplete === true (set by Agent 1's quest system).
     */
    canPrestige() {
      const player = getPlayer();
      if (!player) return false;
      return !!player.prestigeQuestComplete;
    },

    /**
     * previewPrestige — returns what would be LOST, KEPT, and SOUL FORGED.
     */
    previewPrestige() {
      const player = getPlayer();
      if (!player) return { lost: [], kept: [], soulForged: [] };

      const inventory = player.inventory || [];
      const soulForged  = inventory.filter(i => i.isSoulForged);
      const lost        = inventory.filter(i => !i.isSoulForged);

      return {
        lost,
        kept: {
          books:    player.learnedBooks  || [],
          cores:    player.ownedCores    || [],
          gear:     soulForged,
          gold:     0, // gold resets
        },
        soulForged,
      };
    },

    /**
     * executePrestige — core state machine.
     *
     * options: {
     *   activeMartialBook: bookId | null,
     *   activeSoulBook:    bookId | null,
     *   activeCore:        coreId | null,
     *   difficulty:        'normal' | 'nightmare' | 'ascended',
     * }
     */
    executePrestige(options = {}) {
      const player = getPlayer();
      if (!player) return { success: false, reason: 'No player state' };
      if (!this.canPrestige()) return { success: false, reason: 'Prestige quest not complete' };

      // ── KEEP: books, cores, soulForged gear ──
      const keptBooks    = [...(player.learnedBooks || [])];
      const keptCores    = [...(player.ownedCores   || [])];
      const soulForgedGear = (player.inventory || []).filter(i => i.isSoulForged);

      // ── SET: active book/core selections ──
      const newMartialBook = options.activeMartialBook || null;
      const newSoulBook    = options.activeSoulBook    || null;
      const newCore        = options.activeCore        || null;
      const difficulty     = options.difficulty        || 'normal';

      // Validate book selections exist in learnedBooks
      if (newMartialBook && !keptBooks.includes(newMartialBook)) {
        return { success: false, reason: 'activeMartialBook not in learnedBooks' };
      }
      if (newSoulBook && !keptBooks.includes(newSoulBook)) {
        return { success: false, reason: 'activeSoulBook not in learnedBooks' };
      }

      // ── RESET: level, xp, inventory, gold, quest flags ──
      player.level                = 1;
      player.xp                   = 0;
      player.gold                 = 0;
      player.inventory            = [...soulForgedGear];
      player.learnedBooks         = keptBooks;
      player.ownedCores           = keptCores;
      player.activeMartialBook    = newMartialBook;
      player.activeSoulBook       = newSoulBook;
      player.activeCore           = newCore;
      player.prestigeQuestComplete = false;
      player.firstNightmareBossKilledThisPrestige = false;
      player.inPrestigeWindow     = false;

      // ── PRESTIGE COUNTER ──
      player.prestigeCount        = (player.prestigeCount || 0) + 1;

      // ── APPLY: difficulty multipliers to GameState ──
      const multipliers = getDifficultyMultipliers(player.prestigeCount, difficulty);
      if (window.GameState) {
        window.GameState.difficultyMultiplier = multipliers;
        window.GameState.difficulty = difficulty;
      }

      const payload = {
        prestigeCount: player.prestigeCount,
        difficulty,
        keptBooks,
        keptCores,
        soulForgedGear: soulForgedGear.length,
        multipliers,
      };

      // HOOK: Agent 1 / Agent 3 — emit prestige:complete for state reset & UI
      emit('prestige:complete', payload);

      return { success: true, ...payload };
    },

    getDifficultyMultipliers,

    /**
     * openPrestigeWindow — call before showing prestige UI to allow book activation.
     * Sets player.inPrestigeWindow = true.
     */
    openPrestigeWindow() {
      const player = getPlayer();
      if (player) player.inPrestigeWindow = true;
      emit('prestige:window:opened', {});
    },

    /**
     * closePrestigeWindow — clears the prestige window flag without executing.
     */
    closePrestigeWindow() {
      const player = getPlayer();
      if (player) player.inPrestigeWindow = false;
      emit('prestige:window:closed', {});
    },
  };

  // ─────────────────────────────────────────────
  //  INIT LOG
  // ─────────────────────────────────────────────
  console.log(
    '[Step2] GameData, LootEngine, BookSystem, CoreSystem, PrestigeManager loaded. ' +
    `Books: ${Object.keys(BOOKS).length} | Cores: ${Object.keys(CORES).length} | Origins: ${Object.keys(ORIGINS).length}`
  );

})();
