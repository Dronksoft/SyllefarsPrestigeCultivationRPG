/**
 * ============================================================
 *  SYLLEFAR'S PRESTIGE CULTIVATION RPG
 *  Step 4 — World Content: Areas, Monsters, Bosses, Quests
 * ============================================================
 *
 *  Exposes:
 *    window.WorldData    — areas, monsters, bosses, post-quest content
 *    window.QuestManager — quest state, progress tracking, completion logic
 *
 *  Usage (HTML):
 *    <script src="step4-world-content.js"></script>
 *
 *  Integration notes:
 *    HOOK: Agent 1 (Engine)  — reads window.WorldData.areas[areaId]
 *                              for spawnPoints, exits, bossSpawn, tileset
 *    HOOK: Agent 2 (Loot)    — reads monster.dropWeights and monster.coreId
 *                              to resolve loot rolls
 *    HOOK: Agent 3 (UI)      — reads area.name, area.ambience,
 *                              monster.displayName, monster.flavorText,
 *                              and QuestManager for the quest log
 * ============================================================
 */

(function (global) {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // SECTION 1 — MONSTER DEFINITIONS
  // HOOK: Agent 2 — reads monster.dropWeights & monster.coreId
  // HOOK: Agent 3 — reads monster.displayName & monster.flavorText
  // ──────────────────────────────────────────────────────────

  const MONSTERS = {

    // ── AREA 1: ASHVEIL RUINS ────────────────────────────────

    /**
     * Corpse Walker — normal, melee brute, slow & tanky
     * The failed cultivator, still trudging its last patrol.
     */
    corpse_walker: {
      id: 'corpse_walker',
      name: 'Corpse Walker',
      displayName: 'Hollow Shell of the Fallen',
      areaId: 'ashveil_ruins',
      tier: 'normal',
      level: 4,
      stats: { str: 18, dex: 5, vit: 22, int: 2, wis: 2, luk: 3 },
      maxHP: 320,
      attackDamage: { min: 22, max: 34 },
      attackSpeed: 0.65,       // slow, heavy swings
      moveSpeed: 55,
      aggroRange: 160,
      attackRange: 65,
      skillIds: [],
      resistances: { physical: 0.15, fire: 0, magic: -0.10 },
      xpReward: 45,
      dropWeights: {
        gear:  0.20,
        book:  0.03,
        core:  0.003,
        gold:  { min: 2, max: 14 },
      },
      coreId: 'corpse_walker_core',
      spriteKey: 'monster_corpse_walker',
      aiType: 'aggressive_melee',
      flavorText:
        'The cultivation path promised ascension. It found only an endless walk through ash.',
    },

    /**
     * Ashveil Wraith — normal, fast, strong magic resistance
     * The lingering soul of a monk consumed by corrupted qi.
     */
    ashveil_wraith: {
      id: 'ashveil_wraith',
      name: 'Ashveil Wraith',
      displayName: 'Wraith of the Fallen Monk',
      areaId: 'ashveil_ruins',
      tier: 'normal',
      level: 8,
      stats: { str: 10, dex: 18, vit: 12, int: 16, wis: 10, luk: 7 },
      maxHP: 240,
      attackDamage: { min: 18, max: 28 },
      attackSpeed: 1.2,
      moveSpeed: 110,
      aggroRange: 200,
      attackRange: 60,
      skillIds: [],
      resistances: { physical: 0, fire: 0.20, magic: 0.35 },
      xpReward: 85,
      dropWeights: {
        gear:  0.25,
        book:  0.06,
        core:  0.005,
        gold:  { min: 5, max: 22 },
      },
      coreId: 'ashveil_wraith_core',
      spriteKey: 'monster_wraith',
      aiType: 'aggressive_melee',
      flavorText: 'It remembers pain. It is made of it.',
    },

    /**
     * Hollow Scholar — normal, ranged magic attacker, fragile glass cannon
     * Once a keeper of cultivation texts; now it fires corruption bolts.
     */
    hollow_scholar: {
      id: 'hollow_scholar',
      name: 'Hollow Scholar',
      displayName: 'The Ink-Stained Hollow',
      areaId: 'ashveil_ruins',
      tier: 'normal',
      level: 6,
      stats: { str: 5, dex: 14, vit: 8, int: 22, wis: 16, luk: 5 },
      maxHP: 160,
      attackDamage: { min: 28, max: 42 },
      attackSpeed: 0.8,
      moveSpeed: 70,
      aggroRange: 260,
      attackRange: 220,
      skillIds: [],
      resistances: { physical: -0.10, fire: 0, magic: 0.20 },
      xpReward: 65,
      dropWeights: {
        gear:  0.12,
        book:  0.18,           // higher book drop — they hoarded texts in life
        core:  0.004,
        gold:  { min: 3, max: 18 },
      },
      coreId: 'hollow_scholar_core',
      spriteKey: 'monster_hollow_scholar',
      aiType: 'ranged_kite',
      flavorText:
        'The texts it memorised rotted into something else. Now it reads only ruin.',
    },

    /**
     * Bone Sentinel — rare, armored, pack-leader aura
     * The overseer of the monastery's undead patrol — grants buffs to nearby normals.
     */
    bone_sentinel: {
      id: 'bone_sentinel',
      name: 'Bone Sentinel',
      displayName: 'Ossified Overseer',
      areaId: 'ashveil_ruins',
      tier: 'rare',
      level: 12,
      stats: { str: 20, dex: 8, vit: 26, int: 10, wis: 8, luk: 5 },
      maxHP: 520,
      attackDamage: { min: 30, max: 44 },
      attackSpeed: 0.75,
      moveSpeed: 65,
      aggroRange: 220,
      attackRange: 70,
      skillIds: ['aura_bone_fortitude'],   // buff: nearby normals gain +20% phys resist
      resistances: { physical: 0.30, fire: -0.15, magic: 0.10 },
      xpReward: 210,
      dropWeights: {
        gear:  0.45,
        book:  0.10,
        core:  0.025,
        gold:  { min: 18, max: 55 },
      },
      coreId: 'bone_sentinel_core',
      spriteKey: 'monster_bone_sentinel',
      aiType: 'pack_leader',
      flavorText:
        'Where it walks, the dead stand straighter. It hasn\'t rested in three hundred years.',
    },

    /**
     * The Ashen Abbot — BOSS, unique
     * Once the grand master of the monastery, now a vessel for corrupted cultivation energy.
     * HOOK: Agent 1 — triggered via bossSpawn.triggerCondition = "enter_zone"
     * HOOK: Agent 2 — guaranteedDrops populated on BossDef below
     */
    ashen_abbot: {
      id: 'ashen_abbot',
      name: 'The Ashen Abbot',
      displayName: 'Abbot Vo-Shren, the Hollowed Grand Master',
      areaId: 'ashveil_ruins',
      tier: 'unique',
      level: 15,
      stats: { str: 28, dex: 14, vit: 32, int: 24, wis: 20, luk: 10 },
      maxHP: 2400,
      attackDamage: { min: 55, max: 80 },
      attackSpeed: 1.0,
      moveSpeed: 80,
      aggroRange: 320,
      attackRange: 80,
      skillIds: ['soul_drain', 'summon_corpse_walker', 'ash_explosion_aoe'],
      resistances: { physical: 0.10, fire: 0.10, magic: 0.40 },
      xpReward: 1200,
      dropWeights: {
        gear:  1.0,    // boss — always drops gear
        book:  0.80,
        core:  1.0,    // always drops core
        gold:  { min: 80, max: 200 },
      },
      coreId: 'ashen_abbot_core',
      spriteKey: 'boss_ashen_abbot',
      aiType: 'aggressive_melee',
      flavorText:
        'He rang the bell for the last time when the ash came. The bell still echoes. So does he.',
    },

    // ── AREA 2: THE EMBER WASTES ─────────────────────────────

    /**
     * Scorchback Lizard — normal, fast melee, high fire resistance
     * Pack hunters that dart between the hot rocks.
     */
    scorchback_lizard: {
      id: 'scorchback_lizard',
      name: 'Scorchback Lizard',
      displayName: 'Scorchback Ambusher',
      areaId: 'ember_wastes',
      tier: 'normal',
      level: 17,
      stats: { str: 16, dex: 22, vit: 14, int: 4, wis: 4, luk: 10 },
      maxHP: 380,
      attackDamage: { min: 30, max: 44 },
      attackSpeed: 1.4,
      moveSpeed: 130,
      aggroRange: 180,
      attackRange: 55,
      skillIds: [],
      resistances: { physical: 0, fire: 0.60, magic: -0.15 },
      xpReward: 140,
      dropWeights: {
        gear:  0.22,
        book:  0.03,
        core:  0.006,
        gold:  { min: 8, max: 30 },
      },
      coreId: 'scorchback_lizard_core',
      spriteKey: 'monster_scorchback_lizard',
      aiType: 'aggressive_melee',
      flavorText:
        'It was bred in the first fires of the earth. It carries that heat in its blood.',
    },

    /**
     * Ember Golem — normal, slow physical tank, deals fire damage
     * Animated slag and will — a crude but devastating construct.
     */
    ember_golem: {
      id: 'ember_golem',
      name: 'Ember Golem',
      displayName: 'Slag-Fused Construct',
      areaId: 'ember_wastes',
      tier: 'normal',
      level: 19,
      stats: { str: 28, dex: 4, vit: 30, int: 4, wis: 2, luk: 2 },
      maxHP: 680,
      attackDamage: { min: 48, max: 66 },  // fire damage
      attackSpeed: 0.55,
      moveSpeed: 50,
      aggroRange: 140,
      attackRange: 75,
      skillIds: [],
      resistances: { physical: 0.30, fire: 0.90, magic: -0.20 },
      xpReward: 165,
      dropWeights: {
        gear:  0.28,
        book:  0.02,
        core:  0.008,
        gold:  { min: 10, max: 38 },
      },
      coreId: 'ember_golem_core',
      spriteKey: 'monster_ember_golem',
      aiType: 'aggressive_melee',
      flavorText:
        'No hands shaped it. The volcano simply… decided it should exist.',
    },

    /**
     * Cinder Shade — normal, ranged fire projectile attacker
     * A fire-wraith that hurls cinders from a distance, always retreating.
     */
    cinder_shade: {
      id: 'cinder_shade',
      name: 'Cinder Shade',
      displayName: 'Shade of Smouldering Will',
      areaId: 'ember_wastes',
      tier: 'normal',
      level: 18,
      stats: { str: 6, dex: 20, vit: 10, int: 18, wis: 12, luk: 8 },
      maxHP: 290,
      attackDamage: { min: 35, max: 52 },  // fire projectile
      attackSpeed: 0.9,
      moveSpeed: 85,
      aggroRange: 280,
      attackRange: 240,
      skillIds: [],
      resistances: { physical: -0.05, fire: 0.70, magic: 0.15 },
      xpReward: 155,
      dropWeights: {
        gear:  0.18,
        book:  0.08,
        core:  0.007,
        gold:  { min: 7, max: 28 },
      },
      coreId: 'cinder_shade_core',
      spriteKey: 'monster_cinder_shade',
      aiType: 'ranged_kite',
      flavorText: 'Born from a dying fire\'s last wish to keep burning.',
    },

    /**
     * Magma Crawler — rare, AOE ground slam, leaves fire DoT trails
     * A massive lava-armored insectoid that erupts from below.
     */
    magma_crawler: {
      id: 'magma_crawler',
      name: 'Magma Crawler',
      displayName: 'Deep-Crust Siege Beast',
      areaId: 'ember_wastes',
      tier: 'rare',
      level: 22,
      stats: { str: 32, dex: 8, vit: 28, int: 6, wis: 4, luk: 6 },
      maxHP: 960,
      attackDamage: { min: 60, max: 85 },
      attackSpeed: 0.70,
      moveSpeed: 60,
      aggroRange: 200,
      attackRange: 100,       // AOE slam radius
      skillIds: ['ground_slam_aoe', 'fire_dot_trail'],
      resistances: { physical: 0.20, fire: 0.80, magic: -0.10 },
      xpReward: 380,
      dropWeights: {
        gear:  0.50,
        book:  0.08,
        core:  0.035,
        gold:  { min: 30, max: 90 },
      },
      // HOOK: Agent 2 — altar_fragment drops from Ember Wastes rares (quest objective)
      coreId: 'magma_crawler_core',
      altarFragmentDrop: { chance: 0.25 },  // 25% drop chance — supports quest objective
      spriteKey: 'monster_magma_crawler',
      aiType: 'aggressive_melee',
      flavorText:
        'It does not hunt. It erupts. The difference matters only to those in its path.',
    },

    /**
     * Volcanic Sentinel — rare, guards boss approach, travels in packs
     * Crystallized obsidian constructs empowered by proximity to the Drake.
     */
    volcanic_sentinel: {
      id: 'volcanic_sentinel',
      name: 'Volcanic Sentinel',
      displayName: 'Obsidian Warden of the Drake',
      areaId: 'ember_wastes',
      tier: 'rare',
      level: 25,
      stats: { str: 26, dex: 12, vit: 24, int: 8, wis: 8, luk: 5 },
      maxHP: 840,
      attackDamage: { min: 52, max: 74 },
      attackSpeed: 0.85,
      moveSpeed: 75,
      aggroRange: 250,
      attackRange: 72,
      skillIds: ['aura_ember_shield', 'obsidian_charge'],
      resistances: { physical: 0.25, fire: 0.75, magic: 0.10 },
      xpReward: 420,
      dropWeights: {
        gear:  0.55,
        book:  0.06,
        core:  0.040,
        gold:  { min: 35, max: 100 },
      },
      // HOOK: Agent 2 — also can drop altar_fragment (quest support)
      coreId: 'volcanic_sentinel_core',
      altarFragmentDrop: { chance: 0.20 },
      spriteKey: 'monster_volcanic_sentinel',
      aiType: 'pack_leader',
      flavorText:
        'The Drake does not need bodyguards. It has them anyway. Old habits from an older age.',
    },

    /**
     * Inferno Drake — BOSS, unique
     * An ancient fire-dragon awakened by the cultivation wars. Legendary core holder.
     * HOOK: Agent 1 — triggered via bossSpawn.triggerCondition = "enter_zone"
     * HOOK: Agent 2 — guaranteedDrops populated on BossDef below
     */
    inferno_drake: {
      id: 'inferno_drake',
      name: 'Inferno Drake',
      displayName: 'Inferno Drake, the Living Conflagration',
      areaId: 'ember_wastes',
      tier: 'unique',
      level: 30,
      stats: { str: 40, dex: 22, vit: 38, int: 20, wis: 16, luk: 12 },
      maxHP: 5800,
      attackDamage: { min: 90, max: 130 },
      attackSpeed: 0.85,
      moveSpeed: 100,
      aggroRange: 380,
      attackRange: 300,     // fire breath range
      skillIds: ['fire_breath_cone', 'dive_bomb_aoe', 'fire_trail_movement', 'summon_fire_geyser'],
      resistances: { physical: 0.15, fire: 1.0, magic: 0.20 },
      xpReward: 3500,
      dropWeights: {
        gear:  1.0,
        book:  0.90,
        core:  1.0,       // always drops core (legendary)
        gold:  { min: 200, max: 600 },
      },
      coreId: 'inferno_drake_core',
      spriteKey: 'boss_inferno_drake',
      aiType: 'aggressive_melee',
      flavorText:
        'The cultivation masters sealed it beneath the wastes ten thousand years ago. Seals, it turns out, are not forever.',
    },
  };

  // ──────────────────────────────────────────────────────────
  // SECTION 2 — BOSS DEFINITIONS (extended MonsterDef)
  // HOOK: Agent 1 — reads arenaEffect, deathCinematic, bossMusic
  // HOOK: Agent 2 — reads guaranteedDrops for post-kill loot resolution
  // ──────────────────────────────────────────────────────────

  const BOSSES = {

    ashen_abbot: {
      ...MONSTERS.ashen_abbot,

      // Phase mechanics
      phase2Trigger: 0.50,           // enter phase 2 at 50% HP
      phase2StatMultiplier: 1.40,    // +40% to all stats in phase 2

      // Phase descriptions (Agent 1 reads these to trigger effects)
      phase1Description:
        'Soul drain beam attack that heals the Abbot. Periodically summons 2 Corpse Walkers from the shadows.',
      phase2Description:
        'Gains move speed. Each melee strike triggers a small AOE ash explosion. Corpse Walker summons increase to 3.',

      // HOOK: Agent 2 — guaranteed loot on first death
      guaranteedDrops: [
        { type: 'core',  coreId: 'ashen_abbot_core' },
        { type: 'gear',  slot: 'chest', tier: 3, tierMax: 4 },
        { type: 'book',  bookType: 'martial', tier: 3, tierMax: 4 },
      ],

      // First Nightmare-difficulty kill bonus
      nightmareFirstKillDrop: { type: 'catalyst', itemId: 'soul_forge_catalyst' },

      // HOOK: Agent 1 — visual/audio descriptors for boss arena
      arenaEffect: 'ash_fog_thickens_on_phase2',
      bossMusic: 'bgm_ashen_abbot_boss',       // audio key stub
      deathCinematic: 'camera_zoom_slow_explode',

      // Post-quest elite variant (see postQuestContent)
      eliteVariantId: 'echo_of_the_abbot',
    },

    inferno_drake: {
      ...MONSTERS.inferno_drake,

      phase2Trigger: 0.50,
      phase2StatMultiplier: 1.50,    // +50% — Drake rages harder

      phase1Description:
        'Fire breath cone in a 90° arc. Periodically launches a dive bomb that lands as a ground AOE.',
      phase2Description:
        'Every step leaves a fire trail that persists for 8 seconds. Fire geysers randomly spawn every 5s around the arena.',

      guaranteedDrops: [
        { type: 'core',  coreId: 'inferno_drake_core', rarity: 'legendary' },
        { type: 'gear',  slot: 'weapon', tier: 4, tierMax: 5 },
        { type: 'book',  bookType: 'soul', tier: 4, tierMax: 5 },
      ],

      nightmareFirstKillDrop: { type: 'catalyst', itemId: 'soul_forge_catalyst' },

      arenaEffect: 'fire_geyser_spawns',        // Agent 1 spawns geysers during phase 2
      bossMusic: 'bgm_inferno_drake_boss',
      deathCinematic: 'camera_zoom_slow_explode',

      eliteVariantId: 'elder_inferno_drake',
    },
  };

  // ──────────────────────────────────────────────────────────
  // SECTION 3 — AREA DEFINITIONS
  // HOOK: Agent 1 — reads areas[id].spawnPoints, exits, bossSpawn, tileset
  // HOOK: Agent 3 — reads areas[id].name, description, ambience
  // ──────────────────────────────────────────────────────────

  /**
   * Helper: WeightedMonsterEntry
   * @typedef {{ monsterId: string, weight: number, minCount: number, maxCount: number }} WeightedMonsterEntry
   */

  const AREAS = {

    // ── AREA 1 ───────────────────────────────────────────────
    ashveil_ruins: {
      id: 'ashveil_ruins',
      name: 'Ashveil Ruins',
      description:
        'A crumbling monastery suspended in perpetual ash-fog. The cultivation texts that once filled these halls are ashes now. Their authors still walk the corridors — hollow, purposeless, and hungry.',
      recommendedLevel: 15,
      recommendedLevelMin: 1,

      // HOOK: Agent 1 — Phaser tileset + particle emitter key
      tileset: 'tileset_ashveil_dark_stone',
      particleEmitters: ['emitter_ash_fall', 'emitter_dust_motes'],
      backgroundMusic: 'bgm_ashveil_ruins_ambient',
      ambience:
        'A deep, bone-cold silence broken only by distant, rhythmic chanting from no discernible source. The ash never settles.',

      // HOOK: Agent 1 — iterate spawnPoints to place monsters on map load
      spawnPoints: [
        {
          id: 'sp_entry_courtyard',
          x: 120,
          y: 340,
          monsterTable: [
            { monsterId: 'corpse_walker',  weight: 40, minCount: 1, maxCount: 3 },
            { monsterId: 'ashveil_wraith', weight: 35, minCount: 1, maxCount: 2 },
            { monsterId: 'hollow_scholar', weight: 25, minCount: 1, maxCount: 2 },
          ],
        },
        {
          id: 'sp_library_hall',
          x: 380,
          y: 180,
          monsterTable: [
            { monsterId: 'hollow_scholar', weight: 50, minCount: 1, maxCount: 3 },
            { monsterId: 'ashveil_wraith', weight: 30, minCount: 1, maxCount: 2 },
            { monsterId: 'corpse_walker',  weight: 20, minCount: 1, maxCount: 1 },
          ],
        },
        {
          id: 'sp_bone_patrol_east',
          x: 580,
          y: 260,
          monsterTable: [
            { monsterId: 'corpse_walker',  weight: 50, minCount: 2, maxCount: 4 },
            { monsterId: 'bone_sentinel',  weight: 15, minCount: 0, maxCount: 1 }, // rare
            { monsterId: 'ashveil_wraith', weight: 35, minCount: 1, maxCount: 2 },
          ],
        },
        {
          id: 'sp_inner_cloister',
          x: 720,
          y: 400,
          monsterTable: [
            { monsterId: 'ashveil_wraith', weight: 40, minCount: 2, maxCount: 4 },
            { monsterId: 'hollow_scholar', weight: 30, minCount: 1, maxCount: 2 },
            { monsterId: 'bone_sentinel',  weight: 20, minCount: 0, maxCount: 1 },
            { monsterId: 'corpse_walker',  weight: 10, minCount: 1, maxCount: 2 },
          ],
        },
      ],

      // HOOK: Agent 1 — renders exit trigger zones, transitions to targetAreaId
      exits: [
        {
          id: 'exit_to_ember_wastes',
          x: 900,
          y: 300,
          width: 60,
          height: 120,
          targetAreaId: 'ember_wastes',
          targetSpawnPoint: { x: 80, y: 400 },
          label: 'Breach in the Eastern Wall',
          requiresLevel: 14,
        },
      ],

      // HOOK: Agent 1 — places boss trigger zone; fires "enter_zone" event
      bossSpawn: {
        id: 'boss_inner_sanctum',
        x: 820,
        y: 160,
        monsterId: 'ashen_abbot',
        triggerZone: { x: 760, y: 100, width: 180, height: 180 },
        triggerCondition: 'enter_zone',
        bossRoomLabel: 'The Inner Sanctum',
        firstEntryNarration:
          'The bell tolls. You were not invited — and yet you are expected.',
      },

      // HOOK: Agent 3 — displayed in area HUD after "Ritual of Return" completes
      postQuestContent: {
        enabled: false,   // flipped to true by QuestManager on quest completion
        description: 'The ruins grow darker. Something else has noticed you.',
        ambience: 'The silence is gone. Now there are whispers.',
        newSpawnIds: ['elite_corpse_walker', 'echo_of_the_abbot'],
        additionalSpawnTables: [
          { monsterId: 'elite_corpse_walker', weight: 50, minCount: 1, maxCount: 2 },
          { monsterId: 'echo_of_the_abbot',   weight: 20, minCount: 0, maxCount: 1 },
        ],
        hiddenRoom: {
          triggerX: 450,
          triggerY: 200,
          triggerWidth: 40,
          triggerHeight: 40,
          reward: { type: 'book', tier: 4, guaranteed: true },
          label: 'Sealed Meditation Chamber',
          narration:
            'Behind a false wall, a cultivation scroll rests undisturbed. Until now.',
        },
      },

      lootMultipliers: { gear: 1.0, books: 1.0, cores: 1.0 },

      // HOOK: Agent 1 — map dimensions and tile data
      mapConfig: {
        width: 1024,
        height: 768,
        tileSize: 32,
        layers: ['ground', 'walls', 'debris', 'foreground_ash'],
        lightingMode: 'dark_torchlight',
      },
    },

    // ── AREA 2 ───────────────────────────────────────────────
    ember_wastes: {
      id: 'ember_wastes',
      name: 'The Ember Wastes',
      description:
        'A volcanic flatland where beast-cores litter the scorched earth like gemstones. Inferno Drakes and corrupted earth elementals hunt anything that moves. Heat shimmer blurs the horizon into a beautiful, lethal mirage.',
      recommendedLevel: 30,
      recommendedLevelMin: 16,

      // HOOK: Agent 1 — tileset with cracked earth and lava glow shader
      tileset: 'tileset_ember_cracked_earth',
      particleEmitters: ['emitter_ember_float', 'emitter_heat_shimmer', 'emitter_magma_glow'],
      backgroundMusic: 'bgm_ember_wastes_ambient',
      ambience:
        'Oppressive heat that presses against the skin like a living thing. The distant crack of new fissures opening. Beautiful. Deadly.',

      // HOOK: Agent 1 — spawn tables for Ember Wastes enemies
      spawnPoints: [
        {
          id: 'sp_waste_entry_flats',
          x: 120,
          y: 400,
          monsterTable: [
            { monsterId: 'scorchback_lizard', weight: 45, minCount: 2, maxCount: 5 },
            { monsterId: 'cinder_shade',      weight: 35, minCount: 1, maxCount: 2 },
            { monsterId: 'ember_golem',       weight: 20, minCount: 1, maxCount: 1 },
          ],
        },
        {
          id: 'sp_slag_field_central',
          x: 380,
          y: 300,
          monsterTable: [
            { monsterId: 'ember_golem',       weight: 40, minCount: 1, maxCount: 2 },
            { monsterId: 'scorchback_lizard', weight: 30, minCount: 2, maxCount: 4 },
            { monsterId: 'magma_crawler',     weight: 15, minCount: 0, maxCount: 1 }, // rare
            { monsterId: 'cinder_shade',      weight: 15, minCount: 1, maxCount: 2 },
          ],
        },
        {
          id: 'sp_obsidian_ridge',
          x: 620,
          y: 220,
          monsterTable: [
            { monsterId: 'volcanic_sentinel', weight: 25, minCount: 1, maxCount: 2 }, // rare
            { monsterId: 'scorchback_lizard', weight: 35, minCount: 2, maxCount: 3 },
            { monsterId: 'cinder_shade',      weight: 25, minCount: 1, maxCount: 3 },
            { monsterId: 'ember_golem',       weight: 15, minCount: 1, maxCount: 1 },
          ],
        },
        {
          id: 'sp_lava_pillar_approach',
          x: 820,
          y: 180,
          monsterTable: [
            { monsterId: 'volcanic_sentinel', weight: 40, minCount: 2, maxCount: 3 },
            { monsterId: 'magma_crawler',     weight: 30, minCount: 1, maxCount: 2 },
            { monsterId: 'cinder_shade',      weight: 30, minCount: 1, maxCount: 2 },
          ],
        },
      ],

      exits: [
        {
          id: 'exit_back_to_ashveil',
          x: 60,
          y: 400,
          width: 60,
          height: 120,
          targetAreaId: 'ashveil_ruins',
          targetSpawnPoint: { x: 860, y: 300 },
          label: 'The Broken Gate West',
        },
        {
          id: 'exit_deeper_stub',
          x: 980,
          y: 300,
          width: 60,
          height: 120,
          targetAreaId: null,    // STUB — Area 3 not yet implemented
          targetSpawnPoint: null,
          label: 'The Scalding Deep (Sealed)',
          locked: true,
          lockReason: 'The passage collapses under unimaginable heat. Something stirs beyond it.',
        },
      ],

      // HOOK: Agent 1 — boss trigger atop the lava pillar platform
      bossSpawn: {
        id: 'boss_lava_pillar_summit',
        x: 920,
        y: 120,
        monsterId: 'inferno_drake',
        triggerZone: { x: 860, y: 60, width: 200, height: 200 },
        triggerCondition: 'enter_zone',
        bossRoomLabel: 'The Lava Pillar Summit',
        firstEntryNarration:
          'The air stops moving. The Drake raises its head. It has been waiting a very long time.',
      },

      postQuestContent: {
        enabled: false,   // flipped true by QuestManager
        description: 'The flames burn hotter. The wastes hunger for more.',
        ambience: 'Even the rocks seem angrier. Elite drakes circle the horizon.',
        newSpawnIds: ['elder_inferno_drake', 'volcanic_titan'],
        additionalSpawnTables: [
          { monsterId: 'elder_inferno_drake', weight: 30, minCount: 0, maxCount: 1 },
          { monsterId: 'volcanic_titan',       weight: 20, minCount: 0, maxCount: 1 },
        ],
        infiniteRespawn: true,           // HOOK: Agent 1 — monsters respawn on a fast timer
        respawnIntervalMs: 8000,
        infernoDrakeEliteGuaranteedCore: true,  // HOOK: Agent 2 — force core drop on elites
      },

      lootMultipliers: { gear: 1.2, books: 1.1, cores: 1.3 },  // wastes are more rewarding

      mapConfig: {
        width: 1024,
        height: 768,
        tileSize: 32,
        layers: ['ground_cracked', 'lava_flows', 'ember_debris', 'foreground_heat'],
        lightingMode: 'ember_glow_ambient',
      },
    },
  };

  // ──────────────────────────────────────────────────────────
  // SECTION 4 — QUEST DEFINITIONS
  // HOOK: Agent 3 — reads quest.name, objectives[].displayText for quest log
  // ──────────────────────────────────────────────────────────

  const QUEST_DEFS = {

    ritual_of_return: {
      id: 'ritual_of_return',
      name: 'Ritual of Return',
      category: 'main',
      description:
        'Deep in the Ashveil Ruins lies an ancient cultivation altar. Those who have proven themselves may offer their progress to the altar and begin again — wiser, stronger.',
      loreText:
        'The monks of Ashveil called it the Wheel of Heaven. To them, dying was not failure. It was the first step of a second life. The altar remembers. It is waiting for someone worthy enough to use it.',

      // Unlock condition — evaluated by QuestManager against GameState
      unlockCondition: { type: 'player_level', value: 12 },

      objectives: [
        {
          id: 'obj_slay_abbot',
          type: 'kill_boss',
          target: 'ashen_abbot',
          count: 1,
          progress: 0,
          displayText: 'Slay the Ashen Abbot',
          completionText: 'The Abbot falls. His final bell toll fades into silence.',
        },
        {
          id: 'obj_reach_ember_wastes',
          type: 'reach_area',
          target: 'ember_wastes',
          count: 1,
          progress: 0,
          displayText: 'Enter the Ember Wastes',
          completionText: 'The heat hits like a wall. You have arrived.',
        },
        {
          id: 'obj_collect_fragments',
          type: 'collect_item',
          itemId: 'altar_fragment',
          count: 3,
          progress: 0,
          displayText: 'Collect 3 Altar Fragments',
          hintText: 'Rare creatures in the Ember Wastes carry fragments of the shattered altar.',
          completionText: 'Three pieces of something ancient, reassembled by your hands.',
        },
      ],

      reward: {
        unlocks: 'prestige_system',
        xpBonus: 500,
        goldBonus: { min: 100, max: 200 },
        // HOOK: Agent 1 / GameState — called when quest is completed
        onComplete: function () {
          if (typeof GameState !== 'undefined') {
            GameState.prestigeReady = true;
          }
          if (typeof GameEventBus !== 'undefined') {
            GameEventBus.emit('prestige:available');
          }
          // Unlock post-quest content in both areas
          if (window.WorldData) {
            window.WorldData.areas['ashveil_ruins'].postQuestContent.enabled = true;
            window.WorldData.areas['ember_wastes'].postQuestContent.enabled = true;
          }
        },
      },

      completionText:
        'The altar pulses with ancient energy. Your soul is ready to be forged anew. Speak to the altar to Prestige.',
      activeText:
        'The altar waits. Prove yourself worthy before you dare approach it.',

      isRepeatable: false,
      prestige_gated: false,    // accessible before first prestige, triggers it
    },
  };

  // ──────────────────────────────────────────────────────────
  // SECTION 5 — QUEST MANAGER
  // HOOK: Agent 3 — calls QuestManager.getActiveQuests() for quest log display
  // HOOK: Agent 1 — calls QuestManager.updateProgress() on kills/area entry/item collect
  // ──────────────────────────────────────────────────────────

  const _questState = {
    // questId → { unlocked, active, completed, objectives: { objId → progress } }
  };

  /**
   * Initialise runtime quest state from definitions.
   * Called once on load, or after a prestige reset.
   */
  function _initQuestState() {
    Object.keys(QUEST_DEFS).forEach(function (questId) {
      const def = QUEST_DEFS[questId];
      _questState[questId] = {
        unlocked:   false,
        active:     false,
        completed:  false,
        objectives: {},
      };
      def.objectives.forEach(function (obj) {
        _questState[questId].objectives[obj.id] = 0;
      });
    });
  }
  _initQuestState();

  /**
   * Check unlock conditions and activate eligible quests.
   * HOOK: Agent 1 — call this on level-up and area-change events.
   * @param {Object} playerContext — { level, completedQuests, unlockedFlags }
   */
  function _evaluateUnlocks(playerContext) {
    Object.keys(QUEST_DEFS).forEach(function (questId) {
      const def   = QUEST_DEFS[questId];
      const state = _questState[questId];
      if (state.unlocked || state.completed) return;

      const cond = def.unlockCondition;
      if (cond.type === 'player_level' && playerContext.level >= cond.value) {
        state.unlocked = true;
        state.active   = true;
        if (typeof GameEventBus !== 'undefined') {
          GameEventBus.emit('quest:unlocked', { questId: questId, questName: def.name });
        }
      }
    });
  }

  const QuestManager = {

    /**
     * Returns all currently active (unlocked but not completed) quest definitions
     * merged with their live progress state.
     * HOOK: Agent 3 — renders this in the quest log panel.
     * @returns {Array<Object>}
     */
    getActiveQuests: function () {
      return Object.keys(QUEST_DEFS)
        .filter(function (id) {
          return _questState[id].active && !_questState[id].completed;
        })
        .map(function (id) {
          const def   = QUEST_DEFS[id];
          const state = _questState[id];
          return {
            id:          id,
            name:        def.name,
            description: def.description,
            activeText:  def.activeText,
            objectives:  def.objectives.map(function (obj) {
              return {
                id:          obj.id,
                displayText: obj.displayText,
                hintText:    obj.hintText || null,
                required:    obj.count,
                current:     state.objectives[obj.id] || 0,
                complete:    (state.objectives[obj.id] || 0) >= obj.count,
                completionText: obj.completionText || null,
              };
            }),
          };
        });
    },

    /**
     * Returns all completed quests.
     * @returns {Array<string>} questIds
     */
    getCompletedQuests: function () {
      return Object.keys(_questState).filter(function (id) {
        return _questState[id].completed;
      });
    },

    /**
     * Advances objective progress for matching active quests.
     * HOOK: Agent 1 — call on:
     *   kill_boss    → updateProgress('ritual_of_return', 'kill_boss',   { target: 'ashen_abbot' })
     *   reach_area   → updateProgress('ritual_of_return', 'reach_area',  { target: 'ember_wastes' })
     *   collect_item → updateProgress('ritual_of_return', 'collect_item',{ itemId: 'altar_fragment', amount: 1 })
     *
     * @param {string} questId
     * @param {string} progressType  — matches objective.type
     * @param {Object} value         — context object ({ target, itemId, amount })
     */
    updateProgress: function (questId, progressType, value) {
      if (!_questState[questId] || !_questState[questId].active) return;
      if (_questState[questId].completed) return;

      const def   = QUEST_DEFS[questId];
      const state = _questState[questId];
      let madeProgress = false;

      def.objectives.forEach(function (obj) {
        if (obj.type !== progressType) return;

        // Match objective target
        const alreadyDone = (state.objectives[obj.id] || 0) >= obj.count;
        if (alreadyDone) return;

        let matches = false;
        if (progressType === 'kill_boss'    && value.target === obj.target)  matches = true;
        if (progressType === 'reach_area'   && value.target === obj.target)  matches = true;
        if (progressType === 'collect_item' && value.itemId === obj.itemId)  matches = true;

        if (matches) {
          const increment = (progressType === 'collect_item' && value.amount)
            ? value.amount
            : 1;
          state.objectives[obj.id] = Math.min(
            (state.objectives[obj.id] || 0) + increment,
            obj.count
          );
          madeProgress = true;

          if (typeof GameEventBus !== 'undefined') {
            GameEventBus.emit('quest:progress', {
              questId:  questId,
              objId:    obj.id,
              current:  state.objectives[obj.id],
              required: obj.count,
              complete: state.objectives[obj.id] >= obj.count,
            });
          }
        }
      });

      // Auto-complete check after any progress update
      if (madeProgress && QuestManager.isComplete(questId)) {
        QuestManager.completeQuest(questId);
      }
    },

    /**
     * Returns true if all objectives for a quest are satisfied.
     * @param {string} questId
     * @returns {boolean}
     */
    isComplete: function (questId) {
      if (!QUEST_DEFS[questId] || !_questState[questId]) return false;
      const def   = QUEST_DEFS[questId];
      const state = _questState[questId];
      return def.objectives.every(function (obj) {
        return (state.objectives[obj.id] || 0) >= obj.count;
      });
    },

    /**
     * Marks quest as completed, fires onComplete reward, emits event.
     * HOOK: Agent 1 — listen to 'quest:completed' event to trigger altar glow etc.
     * HOOK: Agent 3 — listen to 'quest:completed' to update quest log UI.
     * @param {string} questId
     */
    completeQuest: function (questId) {
      if (!_questState[questId] || _questState[questId].completed) return;

      _questState[questId].active    = false;
      _questState[questId].completed = true;

      const def = QUEST_DEFS[questId];

      // Execute reward callback (enables prestige, unlocks post-quest content)
      if (def.reward && typeof def.reward.onComplete === 'function') {
        def.reward.onComplete();
      }

      if (typeof GameEventBus !== 'undefined') {
        GameEventBus.emit('quest:completed', {
          questId:        questId,
          questName:      def.name,
          completionText: def.completionText,
          reward:         def.reward,
        });
      }
    },

    /**
     * Checks if a specific quest is unlocked.
     * @param {string} questId
     * @returns {boolean}
     */
    isUnlocked: function (questId) {
      return _questState[questId] ? _questState[questId].unlocked : false;
    },

    /**
     * Checks if a specific quest is completed.
     * @param {string} questId
     * @returns {boolean}
     */
    isQuestCompleted: function (questId) {
      return _questState[questId] ? _questState[questId].completed : false;
    },

    /**
     * Returns raw progress for a quest objective.
     * @param {string} questId
     * @param {string} objId
     * @returns {{ current: number, required: number }}
     */
    getObjectiveProgress: function (questId, objId) {
      if (!_questState[questId]) return { current: 0, required: 0 };
      const def = QUEST_DEFS[questId];
      const obj = def.objectives.find(function (o) { return o.id === objId; });
      return {
        current:  _questState[questId].objectives[objId] || 0,
        required: obj ? obj.count : 0,
      };
    },

    /**
     * Re-evaluate quest unlocks based on current player state.
     * HOOK: Agent 1 — call on level-up and area transitions.
     * @param {Object} playerContext — { level }
     */
    evaluateUnlocks: function (playerContext) {
      _evaluateUnlocks(playerContext);
    },

    /**
     * Resets all quest state — used on Prestige.
     * The Ritual of Return quest itself is NOT repeatable; prestige is already triggered.
     * HOOK: Agent 1 — call during prestige reset sequence.
     */
    resetForPrestige: function () {
      _initQuestState();
    },

    /**
     * Returns the full quest definition (read-only).
     * HOOK: Agent 3 — reads quest def for detailed quest log panels.
     * @param {string} questId
     * @returns {Object|null}
     */
    getQuestDef: function (questId) {
      return QUEST_DEFS[questId] || null;
    },

    /** Returns all quest IDs defined in the game. */
    getAllQuestIds: function () {
      return Object.keys(QUEST_DEFS);
    },
  };

  // ──────────────────────────────────────────────────────────
  // SECTION 6 — EXPOSE window.WorldData
  // HOOK: Agent 1 — primary consumer of WorldData
  // HOOK: Agent 2 — reads monsters[id] and bosses[id]
  // HOOK: Agent 3 — reads areas[id] for display text
  // ──────────────────────────────────────────────────────────

  global.WorldData = {
    areas:    AREAS,
    monsters: MONSTERS,
    bosses:   BOSSES,
    quests:   QUEST_DEFS,

    /**
     * Convenience: get a monster or boss definition by ID.
     * Bosses override their base monster stats, so check bosses first.
     * @param {string} monsterId
     * @returns {Object|null}
     */
    getMonster: function (monsterId) {
      return BOSSES[monsterId] || MONSTERS[monsterId] || null;
    },

    /**
     * Returns all monsters for a given area.
     * @param {string} areaId
     * @returns {Object[]}
     */
    getMonstersForArea: function (areaId) {
      return Object.values(MONSTERS).filter(function (m) {
        return m.areaId === areaId;
      });
    },

    /**
     * Returns the boss definition for a given area, or null.
     * @param {string} areaId
     * @returns {Object|null}
     */
    getBossForArea: function (areaId) {
      return Object.values(BOSSES).find(function (b) {
        return b.areaId === areaId;
      }) || null;
    },

    /**
     * Returns post-quest content config for a given area, if enabled.
     * HOOK: Agent 1 — poll after quest:completed event to refresh spawns.
     * @param {string} areaId
     * @returns {Object|null}
     */
    getPostQuestContent: function (areaId) {
      const area = AREAS[areaId];
      if (!area || !area.postQuestContent || !area.postQuestContent.enabled) return null;
      return area.postQuestContent;
    },
  };

  // ──────────────────────────────────────────────────────────
  // SECTION 7 — EXPOSE window.QuestManager
  // ──────────────────────────────────────────────────────────

  global.QuestManager = QuestManager;

  // Confirm load in dev console
  console.log(
    '[WorldData] Loaded: %d areas, %d monsters, %d bosses, %d quests.',
    Object.keys(AREAS).length,
    Object.keys(MONSTERS).length,
    Object.keys(BOSSES).length,
    Object.keys(QUEST_DEFS).length
  );

}(window));
