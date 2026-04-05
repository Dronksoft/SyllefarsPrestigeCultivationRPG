/**
 * @file game/world-content.js
 * @description World content for Syllefar's Prestige Cultivation RPG.
 *   Loads first, has no dependencies. Exposes window.WorldData and window.QuestManager.
 * @fires GameEventBus#quest:unlocked
 * @fires GameEventBus#quest:progress
 * @fires GameEventBus#quest:completed
 * @fires GameEventBus#prestige:available
 */

(function (global) {
  'use strict';

  // ── MONSTERS ────────────────────────────────────────────────────────────────────────────

  /** @type {Object.<string, MonsterDef>} */
  const MONSTERS = {

    // Ashveil Ruins — area 1
    corpse_walker: {
      id: 'corpse_walker',      name: 'Corpse Walker',
      displayName: 'Hollow Shell of the Fallen',
      areaId: 'ashveil_ruins',  tier: 'normal',         level: 4,
      stats: { str: 18, dex: 5, vit: 22, int: 2, wis: 2, luk: 3 },
      maxHP: 320,               attackDamage: { min: 22, max: 34 },
      attackSpeed: 0.65,        moveSpeed: 55,
      aggroRange: 160,          attackRange: 65,
      skillIds: [],
      resistances: { physical: 0.15, fire: 0, magic: -0.10 },
      xpReward: 45,
      dropWeights: { gear: 0.20, book: 0.03, core: 0.003, gold: { min: 2, max: 14 } },
      coreId: 'corpse_walker_core',
      spriteKey: 'monster_corpse_walker',   aiType: 'aggressive_melee',
      flavorText: 'The cultivation path promised ascension. It found only an endless walk through ash.',
    },

    ashveil_wraith: {
      id: 'ashveil_wraith',     name: 'Ashveil Wraith',
      displayName: 'Wraith of the Fallen Monk',
      areaId: 'ashveil_ruins',  tier: 'normal',         level: 8,
      stats: { str: 10, dex: 18, vit: 12, int: 16, wis: 10, luk: 7 },
      maxHP: 240,               attackDamage: { min: 18, max: 28 },
      attackSpeed: 1.2,         moveSpeed: 110,
      aggroRange: 200,          attackRange: 60,
      skillIds: [],
      resistances: { physical: 0, fire: 0.20, magic: 0.35 },
      xpReward: 85,
      dropWeights: { gear: 0.25, book: 0.06, core: 0.005, gold: { min: 5, max: 22 } },
      coreId: 'ashveil_wraith_core',
      spriteKey: 'monster_wraith',          aiType: 'aggressive_melee',
      flavorText: 'It remembers pain. It is made of it.',
    },

    hollow_scholar: {
      id: 'hollow_scholar',     name: 'Hollow Scholar',
      displayName: 'The Ink-Stained Hollow',
      areaId: 'ashveil_ruins',  tier: 'normal',         level: 6,
      stats: { str: 5, dex: 14, vit: 8, int: 22, wis: 16, luk: 5 },
      maxHP: 160,               attackDamage: { min: 28, max: 42 },
      attackSpeed: 0.8,         moveSpeed: 70,
      aggroRange: 260,          attackRange: 220,
      skillIds: [],
      resistances: { physical: -0.10, fire: 0, magic: 0.20 },
      xpReward: 65,
      dropWeights: { gear: 0.12, book: 0.18, core: 0.004, gold: { min: 3, max: 18 } },
      coreId: 'hollow_scholar_core',
      spriteKey: 'monster_hollow_scholar',  aiType: 'ranged_kite',
      flavorText: 'The texts it memorised rotted into something else. Now it reads only ruin.',
    },

    bone_sentinel: {
      id: 'bone_sentinel',      name: 'Bone Sentinel',
      displayName: 'Ossified Overseer',
      areaId: 'ashveil_ruins',  tier: 'rare',           level: 12,
      stats: { str: 20, dex: 8, vit: 26, int: 10, wis: 8, luk: 5 },
      maxHP: 520,               attackDamage: { min: 30, max: 44 },
      attackSpeed: 0.75,        moveSpeed: 65,
      aggroRange: 220,          attackRange: 70,
      skillIds: ['aura_bone_fortitude'],
      resistances: { physical: 0.30, fire: -0.15, magic: 0.10 },
      xpReward: 210,
      dropWeights: { gear: 0.45, book: 0.10, core: 0.025, gold: { min: 18, max: 55 } },
      coreId: 'bone_sentinel_core',
      spriteKey: 'monster_bone_sentinel',   aiType: 'pack_leader',
      flavorText: "Where it walks, the dead stand straighter. It hasn't rested in three hundred years.",
    },

    ashen_abbot: {
      id: 'ashen_abbot',        name: 'The Ashen Abbot',
      displayName: 'Abbot Vo-Shren, the Hollowed Grand Master',
      areaId: 'ashveil_ruins',  tier: 'unique',         level: 15,
      stats: { str: 28, dex: 14, vit: 32, int: 24, wis: 20, luk: 10 },
      maxHP: 2400,              attackDamage: { min: 55, max: 80 },
      attackSpeed: 1.0,         moveSpeed: 80,
      aggroRange: 320,          attackRange: 80,
      skillIds: ['soul_drain', 'summon_corpse_walker', 'ash_explosion_aoe'],
      resistances: { physical: 0.10, fire: 0.10, magic: 0.40 },
      xpReward: 1200,
      dropWeights: { gear: 1.0, book: 0.80, core: 1.0, gold: { min: 80, max: 200 } },
      coreId: 'ashen_abbot_core',
      spriteKey: 'boss_ashen_abbot',        aiType: 'aggressive_melee',
      flavorText: 'He rang the bell for the last time when the ash came. The bell still echoes. So does he.',
    },

    // Ember Wastes — area 2
    scorchback_lizard: {
      id: 'scorchback_lizard',  name: 'Scorchback Lizard',
      displayName: 'Scorchback Ambusher',
      areaId: 'ember_wastes',   tier: 'normal',         level: 17,
      stats: { str: 16, dex: 22, vit: 14, int: 4, wis: 4, luk: 10 },
      maxHP: 380,               attackDamage: { min: 30, max: 44 },
      attackSpeed: 1.4,         moveSpeed: 130,
      aggroRange: 180,          attackRange: 55,
      skillIds: [],
      resistances: { physical: 0, fire: 0.60, magic: -0.15 },
      xpReward: 140,
      dropWeights: { gear: 0.22, book: 0.03, core: 0.006, gold: { min: 8, max: 30 } },
      coreId: 'scorchback_lizard_core',
      spriteKey: 'monster_scorchback_lizard', aiType: 'aggressive_melee',
      flavorText: 'It was bred in the first fires of the earth. It carries that heat in its blood.',
    },

    ember_golem: {
      id: 'ember_golem',        name: 'Ember Golem',
      displayName: 'Slag-Fused Construct',
      areaId: 'ember_wastes',   tier: 'normal',         level: 19,
      stats: { str: 28, dex: 4, vit: 30, int: 4, wis: 2, luk: 2 },
      maxHP: 680,               attackDamage: { min: 48, max: 66 },
      attackSpeed: 0.55,        moveSpeed: 50,
      aggroRange: 140,          attackRange: 75,
      skillIds: [],
      resistances: { physical: 0.30, fire: 0.90, magic: -0.20 },
      xpReward: 165,
      dropWeights: { gear: 0.28, book: 0.02, core: 0.008, gold: { min: 10, max: 38 } },
      coreId: 'ember_golem_core',
      spriteKey: 'monster_ember_golem',     aiType: 'aggressive_melee',
      flavorText: 'No hands shaped it. The volcano simply\u2026 decided it should exist.',
    },

    cinder_shade: {
      id: 'cinder_shade',       name: 'Cinder Shade',
      displayName: 'Shade of Smouldering Will',
      areaId: 'ember_wastes',   tier: 'normal',         level: 18,
      stats: { str: 6, dex: 20, vit: 10, int: 18, wis: 12, luk: 8 },
      maxHP: 290,               attackDamage: { min: 35, max: 52 },
      attackSpeed: 0.9,         moveSpeed: 85,
      aggroRange: 280,          attackRange: 240,
      skillIds: [],
      resistances: { physical: -0.05, fire: 0.70, magic: 0.15 },
      xpReward: 155,
      dropWeights: { gear: 0.18, book: 0.08, core: 0.007, gold: { min: 7, max: 28 } },
      coreId: 'cinder_shade_core',
      spriteKey: 'monster_cinder_shade',    aiType: 'ranged_kite',
      flavorText: "Born from a dying fire's last wish to keep burning.",
    },

    magma_crawler: {
      id: 'magma_crawler',      name: 'Magma Crawler',
      displayName: 'Deep-Crust Siege Beast',
      areaId: 'ember_wastes',   tier: 'rare',           level: 22,
      stats: { str: 32, dex: 8, vit: 28, int: 6, wis: 4, luk: 6 },
      maxHP: 960,               attackDamage: { min: 60, max: 85 },
      attackSpeed: 0.70,        moveSpeed: 60,
      aggroRange: 200,          attackRange: 100,
      skillIds: ['ground_slam_aoe', 'fire_dot_trail'],
      resistances: { physical: 0.20, fire: 0.80, magic: -0.10 },
      xpReward: 380,
      dropWeights: { gear: 0.50, book: 0.08, core: 0.035, gold: { min: 30, max: 90 } },
      altarFragmentDrop: { chance: 0.25 },
      coreId: 'magma_crawler_core',
      spriteKey: 'monster_magma_crawler',   aiType: 'aggressive_melee',
      flavorText: 'It does not hunt. It erupts. The difference matters only to those in its path.',
    },

    volcanic_sentinel: {
      id: 'volcanic_sentinel',  name: 'Volcanic Sentinel',
      displayName: 'Obsidian Warden of the Drake',
      areaId: 'ember_wastes',   tier: 'rare',           level: 25,
      stats: { str: 26, dex: 12, vit: 24, int: 8, wis: 8, luk: 5 },
      maxHP: 840,               attackDamage: { min: 52, max: 74 },
      attackSpeed: 0.85,        moveSpeed: 75,
      aggroRange: 250,          attackRange: 72,
      skillIds: ['aura_ember_shield', 'obsidian_charge'],
      resistances: { physical: 0.25, fire: 0.75, magic: 0.10 },
      xpReward: 420,
      dropWeights: { gear: 0.55, book: 0.06, core: 0.040, gold: { min: 35, max: 100 } },
      altarFragmentDrop: { chance: 0.20 },
      coreId: 'volcanic_sentinel_core',
      spriteKey: 'monster_volcanic_sentinel', aiType: 'pack_leader',
      flavorText: 'The Drake does not need bodyguards. It has them anyway. Old habits from an older age.',
    },

    inferno_drake: {
      id: 'inferno_drake',      name: 'Inferno Drake',
      displayName: 'Inferno Drake, the Living Conflagration',
      areaId: 'ember_wastes',   tier: 'unique',         level: 30,
      stats: { str: 40, dex: 22, vit: 38, int: 20, wis: 16, luk: 12 },
      maxHP: 5800,              attackDamage: { min: 90, max: 130 },
      attackSpeed: 0.85,        moveSpeed: 100,
      aggroRange: 380,          attackRange: 300,
      skillIds: ['fire_breath_cone', 'dive_bomb_aoe', 'fire_trail_movement', 'summon_fire_geyser'],
      resistances: { physical: 0.15, fire: 1.0, magic: 0.20 },
      xpReward: 3500,
      dropWeights: { gear: 1.0, book: 0.90, core: 1.0, gold: { min: 200, max: 600 } },
      coreId: 'inferno_drake_core',
      spriteKey: 'boss_inferno_drake',      aiType: 'aggressive_melee',
      flavorText: 'The cultivation masters sealed it beneath the wastes ten thousand years ago. Seals, it turns out, are not forever.',
    },
  };

  // ── BOSSES ────────────────────────────────────────────────────────────────────────────

  /** @type {Object.<string, BossDef>} */
  const BOSSES = {

    ashen_abbot: {
      ...MONSTERS.ashen_abbot,
      phase2Trigger: 0.50,        phase2StatMultiplier: 1.40,
      phase1Description: 'Soul drain beam attack that heals the Abbot. Periodically summons 2 Corpse Walkers.',
      phase2Description: 'Gains move speed. Each melee strike triggers an ash explosion AOE. Corpse Walker summons increase to 3.',
      guaranteedDrops: [
        { type: 'core', coreId: 'ashen_abbot_core' },
        { type: 'gear', slot: 'chest',  tier: 3, tierMax: 4 },
        { type: 'book', bookType: 'martial', tier: 3, tierMax: 4 },
      ],
      nightmareFirstKillDrop: { type: 'catalyst', itemId: 'soul_forge_catalyst' },
      arenaEffect: 'ash_fog_thickens_on_phase2',
      bossMusic: 'bgm_ashen_abbot_boss',
      deathCinematic: 'camera_zoom_slow_explode',
      eliteVariantId: 'echo_of_the_abbot',
    },

    inferno_drake: {
      ...MONSTERS.inferno_drake,
      phase2Trigger: 0.50,        phase2StatMultiplier: 1.50,
      phase1Description: 'Fire breath cone in a 90° arc. Periodically launches a dive bomb ground AOE.',
      phase2Description: 'Every step leaves a fire trail for 8 s. Fire geysers spawn every 5 s around the arena.',
      guaranteedDrops: [
        { type: 'core', coreId: 'inferno_drake_core', rarity: 'legendary' },
        { type: 'gear', slot: 'weapon', tier: 4, tierMax: 5 },
        { type: 'book', bookType: 'soul', tier: 4, tierMax: 5 },
      ],
      nightmareFirstKillDrop: { type: 'catalyst', itemId: 'soul_forge_catalyst' },
      arenaEffect: 'fire_geyser_spawns',
      bossMusic: 'bgm_inferno_drake_boss',
      deathCinematic: 'camera_zoom_slow_explode',
      eliteVariantId: 'elder_inferno_drake',
    },
  };

  // ── AREAS ────────────────────────────────────────────────────────────────────────────

  /** @type {Object.<string, AreaDef>} */
  const AREAS = {

    ashveil_ruins: {
      id: 'ashveil_ruins',
      name: 'Ashveil Ruins',
      description: 'A crumbling monastery suspended in perpetual ash-fog. The cultivation texts that once filled these halls are ashes now. Their authors still walk the corridors — hollow, purposeless, and hungry.',
      recommendedLevel: 15,   recommendedLevelMin: 1,
      tileset: 'tileset_ashveil_dark_stone',
      particleEmitters: ['emitter_ash_fall', 'emitter_dust_motes'],
      backgroundMusic: 'bgm_ashveil_ruins_ambient',
      ambience: 'A deep, bone-cold silence broken only by distant, rhythmic chanting from no discernible source. The ash never settles.',
      mapConfig: { width: 1024, height: 768, tileSize: 32, layers: ['ground', 'walls', 'debris', 'foreground_ash'], lightingMode: 'dark_torchlight' },
      lootMultipliers: { gear: 1.0, books: 1.0, cores: 1.0 },

      spawnPoints: [
        { id: 'sp_entry_courtyard',  x: 120, y: 340, monsterTable: [
            { monsterId: 'corpse_walker',  weight: 40, minCount: 1, maxCount: 3 },
            { monsterId: 'ashveil_wraith', weight: 35, minCount: 1, maxCount: 2 },
            { monsterId: 'hollow_scholar', weight: 25, minCount: 1, maxCount: 2 },
        ]},
        { id: 'sp_library_hall',     x: 380, y: 180, monsterTable: [
            { monsterId: 'hollow_scholar', weight: 50, minCount: 1, maxCount: 3 },
            { monsterId: 'ashveil_wraith', weight: 30, minCount: 1, maxCount: 2 },
            { monsterId: 'corpse_walker',  weight: 20, minCount: 1, maxCount: 1 },
        ]},
        { id: 'sp_bone_patrol_east', x: 580, y: 260, monsterTable: [
            { monsterId: 'corpse_walker',  weight: 50, minCount: 2, maxCount: 4 },
            { monsterId: 'ashveil_wraith', weight: 35, minCount: 1, maxCount: 2 },
            { monsterId: 'bone_sentinel',  weight: 15, minCount: 0, maxCount: 1 },
        ]},
        { id: 'sp_inner_cloister',   x: 720, y: 400, monsterTable: [
            { monsterId: 'ashveil_wraith', weight: 40, minCount: 2, maxCount: 4 },
            { monsterId: 'hollow_scholar', weight: 30, minCount: 1, maxCount: 2 },
            { monsterId: 'bone_sentinel',  weight: 20, minCount: 0, maxCount: 1 },
            { monsterId: 'corpse_walker',  weight: 10, minCount: 1, maxCount: 2 },
        ]},
      ],

      exits: [
        { id: 'exit_to_ember_wastes', x: 900, y: 300, width: 60, height: 120,
          targetAreaId: 'ember_wastes', targetSpawnPoint: { x: 80, y: 400 },
          label: 'Breach in the Eastern Wall', requiresLevel: 14 },
      ],

      bossSpawn: {
        id: 'boss_inner_sanctum', x: 820, y: 160, monsterId: 'ashen_abbot',
        triggerZone: { x: 760, y: 100, width: 180, height: 180 },
        triggerCondition: 'enter_zone', bossRoomLabel: 'The Inner Sanctum',
        firstEntryNarration: 'The bell tolls. You were not invited — and yet you are expected.',
      },

      postQuestContent: {
        enabled: false,
        description: 'The ruins grow darker. Something else has noticed you.',
        ambience: 'The silence is gone. Now there are whispers.',
        newSpawnIds: ['elite_corpse_walker', 'echo_of_the_abbot'],
        additionalSpawnTables: [
          { monsterId: 'elite_corpse_walker', weight: 50, minCount: 1, maxCount: 2 },
          { monsterId: 'echo_of_the_abbot',   weight: 20, minCount: 0, maxCount: 1 },
        ],
        hiddenRoom: {
          triggerX: 450, triggerY: 200, triggerWidth: 40, triggerHeight: 40,
          reward: { type: 'book', tier: 4, guaranteed: true },
          label: 'Sealed Meditation Chamber',
          narration: 'Behind a false wall, a cultivation scroll rests undisturbed. Until now.',
        },
      },
    },

    ember_wastes: {
      id: 'ember_wastes',
      name: 'The Ember Wastes',
      description: 'A volcanic flatland where beast-cores litter the scorched earth like gemstones. Inferno Drakes and corrupted earth elementals hunt anything that moves. Heat shimmer blurs the horizon into a beautiful, lethal mirage.',
      recommendedLevel: 30,   recommendedLevelMin: 16,
      tileset: 'tileset_ember_cracked_earth',
      particleEmitters: ['emitter_ember_float', 'emitter_heat_shimmer', 'emitter_magma_glow'],
      backgroundMusic: 'bgm_ember_wastes_ambient',
      ambience: 'Oppressive heat that presses against the skin like a living thing. The distant crack of new fissures opening. Beautiful. Deadly.',
      mapConfig: { width: 1024, height: 768, tileSize: 32, layers: ['ground_cracked', 'lava_flows', 'ember_debris', 'foreground_heat'], lightingMode: 'ember_glow_ambient' },
      lootMultipliers: { gear: 1.2, books: 1.1, cores: 1.3 },

      spawnPoints: [
        { id: 'sp_waste_entry_flats',    x: 120, y: 400, monsterTable: [
            { monsterId: 'scorchback_lizard', weight: 45, minCount: 2, maxCount: 5 },
            { monsterId: 'cinder_shade',      weight: 35, minCount: 1, maxCount: 2 },
            { monsterId: 'ember_golem',       weight: 20, minCount: 1, maxCount: 1 },
        ]},
        { id: 'sp_slag_field_central',   x: 380, y: 300, monsterTable: [
            { monsterId: 'ember_golem',       weight: 40, minCount: 1, maxCount: 2 },
            { monsterId: 'scorchback_lizard', weight: 30, minCount: 2, maxCount: 4 },
            { monsterId: 'cinder_shade',      weight: 15, minCount: 1, maxCount: 2 },
            { monsterId: 'magma_crawler',     weight: 15, minCount: 0, maxCount: 1 },
        ]},
        { id: 'sp_obsidian_ridge',       x: 620, y: 220, monsterTable: [
            { monsterId: 'scorchback_lizard', weight: 35, minCount: 2, maxCount: 3 },
            { monsterId: 'cinder_shade',      weight: 25, minCount: 1, maxCount: 3 },
            { monsterId: 'volcanic_sentinel', weight: 25, minCount: 1, maxCount: 2 },
            { monsterId: 'ember_golem',       weight: 15, minCount: 1, maxCount: 1 },
        ]},
        { id: 'sp_lava_pillar_approach', x: 820, y: 180, monsterTable: [
            { monsterId: 'volcanic_sentinel', weight: 40, minCount: 2, maxCount: 3 },
            { monsterId: 'magma_crawler',     weight: 30, minCount: 1, maxCount: 2 },
            { monsterId: 'cinder_shade',      weight: 30, minCount: 1, maxCount: 2 },
        ]},
      ],

      exits: [
        { id: 'exit_back_to_ashveil', x: 60, y: 400, width: 60, height: 120,
          targetAreaId: 'ashveil_ruins', targetSpawnPoint: { x: 860, y: 300 },
          label: 'The Broken Gate West' },
        { id: 'exit_deeper_stub',     x: 980, y: 300, width: 60, height: 120,
          targetAreaId: null, targetSpawnPoint: null,
          label: 'The Scalding Deep (Sealed)', locked: true,
          lockReason: 'The passage collapses under unimaginable heat. Something stirs beyond it.' },
      ],

      bossSpawn: {
        id: 'boss_lava_pillar_summit', x: 920, y: 120, monsterId: 'inferno_drake',
        triggerZone: { x: 860, y: 60, width: 200, height: 200 },
        triggerCondition: 'enter_zone', bossRoomLabel: 'The Lava Pillar Summit',
        firstEntryNarration: 'The air stops moving. The Drake raises its head. It has been waiting a very long time.',
      },

      postQuestContent: {
        enabled: false,
        description: 'The flames burn hotter. The wastes hunger for more.',
        ambience: 'Even the rocks seem angrier. Elite drakes circle the horizon.',
        newSpawnIds: ['elder_inferno_drake', 'volcanic_titan'],
        additionalSpawnTables: [
          { monsterId: 'elder_inferno_drake', weight: 30, minCount: 0, maxCount: 1 },
          { monsterId: 'volcanic_titan',       weight: 20, minCount: 0, maxCount: 1 },
        ],
        infiniteRespawn: true,
        respawnIntervalMs: 8000,
        infernoDrakeEliteGuaranteedCore: true,
      },
    },
  };

  // ── QUESTS ────────────────────────────────────────────────────────────────────────────

  /** @type {Object.<string, QuestDef>} */
  const QUEST_DEFS = {

    ritual_of_return: {
      id: 'ritual_of_return',
      name: 'Ritual of Return',
      category: 'main',
      description: 'Deep in the Ashveil Ruins lies an ancient cultivation altar. Those who have proven themselves may offer their progress to the altar and begin again — wiser, stronger.',
      loreText: 'The monks of Ashveil called it the Wheel of Heaven. To them, dying was not failure. It was the first step of a second life. The altar remembers. It is waiting for someone worthy enough to use it.',
      unlockCondition: { type: 'player_level', value: 12 },
      activeText: 'The altar waits. Prove yourself worthy before you dare approach it.',
      completionText: 'The altar pulses with ancient energy. Your soul is ready to be forged anew. Speak to the altar to Prestige.',
      isRepeatable: false,
      prestige_gated: false,

      objectives: [
        { id: 'obj_slay_abbot',       type: 'kill_boss',    target: 'ashen_abbot',   count: 1,
          displayText: 'Slay the Ashen Abbot',
          completionText: 'The Abbot falls. His final bell toll fades into silence.' },
        { id: 'obj_reach_ember_wastes', type: 'reach_area', target: 'ember_wastes',  count: 1,
          displayText: 'Enter the Ember Wastes',
          completionText: 'The heat hits like a wall. You have arrived.' },
        { id: 'obj_collect_fragments', type: 'collect_item', itemId: 'altar_fragment', count: 3,
          displayText: 'Collect 3 Altar Fragments',
          hintText: 'Rare creatures in the Ember Wastes carry fragments of the shattered altar.',
          completionText: 'Three pieces of something ancient, reassembled by your hands.' },
      ],

      reward: {
        unlocks: 'prestige_system',
        xpBonus: 500,
        goldBonus: { min: 100, max: 200 },
        onComplete: function () {
          if (typeof GameState !== 'undefined') GameState.prestigeReady = true;
          if (typeof GameEventBus !== 'undefined') GameEventBus.emit('prestige:available');
          if (global.WorldData) {
            global.WorldData.areas.ashveil_ruins.postQuestContent.enabled = true;
            global.WorldData.areas.ember_wastes.postQuestContent.enabled  = true;
          }
        },
      },
    },
  };

  // ── QUEST STATE (private) ─────────────────────────────────────────────────────────────────────

  /** @type {Object.<string, { unlocked: boolean, active: boolean, completed: boolean, objectives: Object.<string, number> }>} */
  const _state = {};

  function _initQuestState() {
    Object.keys(QUEST_DEFS).forEach(function (qid) {
      _state[qid] = { unlocked: false, active: false, completed: false, objectives: {} };
      QUEST_DEFS[qid].objectives.forEach(function (o) { _state[qid].objectives[o.id] = 0; });
    });
  }
  _initQuestState();

  function _emit(event, payload) {
    if (typeof GameEventBus !== 'undefined') GameEventBus.emit(event, payload);
  }

  function _evaluateUnlocks(ctx) {
    Object.keys(QUEST_DEFS).forEach(function (qid) {
      const def = QUEST_DEFS[qid];
      const s   = _state[qid];
      if (s.unlocked || s.completed) return;
      if (def.unlockCondition.type === 'player_level' && ctx.level >= def.unlockCondition.value) {
        s.unlocked = s.active = true;
        _emit('quest:unlocked', { questId: qid, questName: def.name });
      }
    });
  }

  // ── QUEST MANAGER ───────────────────────────────────────────────────────────────────────

  /**
   * @namespace QuestManager
   * @description Runtime quest state machine. Exposes read + write quest operations.
   *   All hooks documented with their expected callers (Agent 1 = Engine, Agent 3 = UI).
   */
  const QuestManager = {

    /**
     * Advance objective progress. Auto-completes when all objectives are satisfied.
     * @param {string} questId
     * @param {'kill_boss'|'reach_area'|'collect_item'} progressType
     * @param {{ target?: string, itemId?: string, amount?: number }} value
     */
    updateProgress: function (questId, progressType, value) {
      const s = _state[questId];
      if (!s || !s.active || s.completed) return;
      const def = QUEST_DEFS[questId];
      let changed = false;
      def.objectives.forEach(function (o) {
        if (o.type !== progressType) return;
        if ((s.objectives[o.id] || 0) >= o.count) return;
        const hit = (progressType === 'kill_boss'    && value.target === o.target)
                 || (progressType === 'reach_area'   && value.target === o.target)
                 || (progressType === 'collect_item' && value.itemId === o.itemId);
        if (!hit) return;
        const inc = (progressType === 'collect_item' && value.amount) ? value.amount : 1;
        s.objectives[o.id] = Math.min((s.objectives[o.id] || 0) + inc, o.count);
        changed = true;
        _emit('quest:progress', { questId, objId: o.id, current: s.objectives[o.id], required: o.count, complete: s.objectives[o.id] >= o.count });
      });
      if (changed && QuestManager.isComplete(questId)) QuestManager.completeQuest(questId);
    },

    /**
     * @param {string} questId
     * @returns {boolean} True when all objectives are satisfied.
     */
    isComplete: function (questId) {
      if (!QUEST_DEFS[questId] || !_state[questId]) return false;
      return QUEST_DEFS[questId].objectives.every(function (o) {
        return (_state[questId].objectives[o.id] || 0) >= o.count;
      });
    },

    /**
     * @param {string} questId
     * @returns {boolean} True if the quest has been marked completed.
     */
    isQuestCompleted: function (questId) {
      return _state[questId] ? _state[questId].completed : false;
    },

    /**
     * Mark a quest complete, fire its reward callback, and emit the event.
     * @param {string} questId
     */
    completeQuest: function (questId) {
      const s = _state[questId];
      if (!s || s.completed) return;
      s.active = false;  s.completed = true;
      const def = QUEST_DEFS[questId];
      if (def.reward && typeof def.reward.onComplete === 'function') def.reward.onComplete();
      _emit('quest:completed', { questId, questName: def.name, completionText: def.completionText, reward: def.reward });
    },

    /**
     * Re-check unlock conditions against current player context.
     * Call on level-up and area transitions.
     * @param {{ level: number }} playerContext
     */
    evaluateUnlocks: function (playerContext) {
      _evaluateUnlocks(playerContext);
    },

    /**
     * Reset all quest state for a prestige cycle.
     * Note: prestige:available is already fired during completeQuest — do not re-fire here.
     */
    resetForPrestige: function () {
      _initQuestState();
    },

    /** @returns {Array<Object>} Active quests merged with live progress. */
    getActiveQuests: function () {
      return Object.keys(QUEST_DEFS).filter(function (id) {
        return _state[id].active && !_state[id].completed;
      }).map(function (id) {
        const def = QUEST_DEFS[id];
        return {
          id, name: def.name, description: def.description, activeText: def.activeText,
          objectives: def.objectives.map(function (o) {
            return { id: o.id, displayText: o.displayText, hintText: o.hintText || null,
                     required: o.count, current: _state[id].objectives[o.id] || 0,
                     complete: (_state[id].objectives[o.id] || 0) >= o.count,
                     completionText: o.completionText || null };
          }),
        };
      });
    },

    /** @returns {string[]} IDs of all completed quests. */
    getCompletedQuests: function () {
      return Object.keys(_state).filter(function (id) { return _state[id].completed; });
    },

    /**
     * @param {string} questId
     * @param {string} objId
     * @returns {{ current: number, required: number }}
     */
    getObjectiveProgress: function (questId, objId) {
      if (!_state[questId]) return { current: 0, required: 0 };
      const obj = QUEST_DEFS[questId].objectives.find(function (o) { return o.id === objId; });
      return { current: _state[questId].objectives[objId] || 0, required: obj ? obj.count : 0 };
    },

    /** @param {string} questId  @returns {QuestDef|null} */
    getQuestDef:    function (questId) { return QUEST_DEFS[questId] || null; },
    /** @param {string} questId  @returns {boolean} */
    isUnlocked:     function (questId) { return _state[questId] ? _state[questId].unlocked : false; },
    /** @returns {string[]} */
    getAllQuestIds:  function () { return Object.keys(QUEST_DEFS); },
  };

  // ── WORLD DATA ──────────────────────────────────────────────────────────────────────────

  /**
   * @namespace WorldData
   * @property {Object} areas       - Area definitions keyed by areaId.
   * @property {Object} monsters    - Monster definitions keyed by monsterId.
   * @property {Object} bosses      - Boss definitions (extend monster) keyed by bossId.
   * @property {Object} quests      - Quest definitions keyed by questId.
   */
  global.WorldData = {
    areas:    AREAS,
    monsters: MONSTERS,
    bosses:   BOSSES,
    quests:   QUEST_DEFS,

    /**
     * Fetch a monster or boss definition by ID. Bosses take precedence.
     * @param {string} monsterId  @returns {Object|null}
     */
    getMonster: function (monsterId) {
      return BOSSES[monsterId] || MONSTERS[monsterId] || null;
    },

    /**
     * @param {string} areaId  @returns {Object[]} All monster defs for the area.
     */
    getMonstersForArea: function (areaId) {
      return Object.values(MONSTERS).filter(function (m) { return m.areaId === areaId; });
    },

    /**
     * @param {string} areaId  @returns {Object|null} Boss def for the area, or null.
     */
    getBossForArea: function (areaId) {
      return Object.values(BOSSES).find(function (b) { return b.areaId === areaId; }) || null;
    },

    /**
     * Returns post-quest content config only when enabled by quest completion.
     * @param {string} areaId  @returns {Object|null}
     */
    getPostQuestContent: function (areaId) {
      const area = AREAS[areaId];
      if (!area || !area.postQuestContent || !area.postQuestContent.enabled) return null;
      return area.postQuestContent;
    },
  };

  global.QuestManager = QuestManager;

  console.log(
    '[WorldData] Loaded:', Object.keys(AREAS).length, 'areas,',
    Object.keys(MONSTERS).length, 'monsters,',
    Object.keys(BOSSES).length, 'bosses,',
    Object.keys(QUEST_DEFS).length, 'quests.'
  );

}(window));
