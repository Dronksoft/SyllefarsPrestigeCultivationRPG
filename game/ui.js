/* ═════════════════════════════════════════════
   STUBS: GameState, GameEventBus, WorldData
   (engine.js sets the real versions before ui.js
    loads — these || guards are safety nets only)
═════════════════════════════════════════════ */
window.GameState = window.GameState || {
  player:{ name:'Syllefar',level:12,prestige:2,origin:'Iron Path',
    hp:420,maxHp:580,soul:180,maxSoul:300,xp:2400,xpToNext:5000,
    stats:{STR:24,DEX:31,VIT:28,INT:18,WIS:15,LUK:12},
    statBonuses:{STR:26,DEX:15,VIT:18,INT:4,WIS:3,LUK:2} },
  combat:{active:false}, prestigeReady:false,
  activeBook:{id:'iron_body_4',name:'Iron Body Sutra IV',type:'martial'},
  activeCore:{id:'drake',name:'Drake Core'}, difficulty:'nightmare'
};
window.GameEventBus = window.GameEventBus || (function(){
  const L={};
  return {
    on(e,cb){(L[e]=L[e]||[]).push(cb)},
    off(e,cb){if(L[e])L[e]=L[e].filter(l=>l!==cb)},
    emit(e,d){console.log('[GameEventBus]',e,d);(L[e]||[]).forEach(cb=>cb(d))}
  };
})();
window.WorldData = window.WorldData || {currentArea:{name:'The Ashen Reaches',id:'ashen_reaches'}};

/* ═════════════════════════════════════════════
   PANEL SYSTEM
   Panels are independent floating windows —
   opening one does NOT close the others.
   Use Esc to close all, X button or keybind
   to toggle individual panels.
═════════════════════════════════════════════ */
const PANELS = ['inventory','character','books','cores','prestige'];

function openPanel(id){
  const el = document.getElementById('panel-' + id);
  if (!el) return;
  el.classList.add('panel-open');
  if (id === 'prestige') el.style.transform = 'translateX(-50%) scale(1) translateY(0)';
  // Bring clicked panel to front
  const maxZ = Math.max(...PANELS.map(p => {
    const e = document.getElementById('panel-' + p);
    return e ? (parseInt(e.style.zIndex) || 100) : 100;
  }));
  el.style.zIndex = maxZ + 1;
}

function closePanel(id){
  const el = document.getElementById('panel-' + id);
  if (!el) return;
  el.classList.remove('panel-open');
  if (id === 'prestige') el.style.transform = 'translateX(-50%) scale(0.96) translateY(8px)';
}

function togglePanel(id){
  const el = document.getElementById('panel-' + id);
  if (el && el.classList.contains('panel-open')) closePanel(id);
  else openPanel(id);
}

document.addEventListener('keydown', e => {
  if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  const map = { c:'character', i:'inventory', b:'books', k:'cores', p:'prestige' };
  if (map[e.key.toLowerCase()]) { e.preventDefault(); togglePanel(map[e.key.toLowerCase()]); }
  if (e.key === 'Escape') PANELS.forEach(p => closePanel(p));
});

/* ═════════════════════════════════════════════
   DRAGGING
═════════════════════════════════════════════ */
function startDrag(e, panelId){
  if (e.button !== 0) return;
  const p = document.getElementById(panelId);
  const r = p.getBoundingClientRect();
  let ox = e.clientX - r.left, oy = e.clientY - r.top;
  // Bring to front on drag
  const maxZ = Math.max(...PANELS.map(pid => {
    const el = document.getElementById('panel-' + pid);
    return el ? (parseInt(el.style.zIndex) || 100) : 100;
  }));
  p.style.zIndex = maxZ + 1;
  const onMove = ev => {
    p.style.left   = (ev.clientX - ox) + 'px';
    p.style.top    = (ev.clientY - oy) + 'px';
    p.style.right  = 'auto';
    if (panelId !== 'panel-prestige') p.style.transform = 'none';
    else p.style.transform = 'scale(1) translateY(0)';
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  e.preventDefault();
}

/* ═════════════════════════════════════════════
   HUD BAR UPDATES
═════════════════════════════════════════════ */
function setBar(type, cur, max){
  const f = document.getElementById('bar-' + type + '-fill');
  const v = document.getElementById('bar-' + type + '-value');
  if (!f || !v) return;
  f.style.width = Math.max(0, Math.min(100, (cur / max) * 100)) + '%';
  v.textContent = type === 'xp'
    ? cur.toLocaleString() + '/' + max.toLocaleString()
    : cur + '/' + max;
}
function updateHUD(){
  const p = window.GameState.player;
  // Support both engine.js field names (currentHP/maxHP) and ui.js stub names (hp/maxHp)
  setBar('hp',   Math.ceil(p.currentHP  ?? p.hp   ?? 0), p.maxHP   ?? p.maxHp  ?? 1);
  setBar('soul', Math.ceil(p.currentSoul ?? p.soul ?? 0), p.maxSoul ?? 1);
  setBar('xp',   Math.floor(p.xp ?? 0),                  p.xpToNext ?? 100);
  const badge = document.getElementById('hud-prestige-badge');
  if (badge) badge.textContent = 'Prestige ×' + (p.prestigeCount ?? p.prestige ?? 0);
  const lvl = document.getElementById('portrait-level');
  if (lvl) lvl.textContent = 'Lv.' + (p.level || 1);
  const orig = document.getElementById('portrait-origin');
  const labels = { wandering_monk:'MONK', fallen_noble:'NOBLE', beast_tamer:'TAMER' };
  if (orig) orig.textContent = labels[p.originId] || (p.origin || '').toUpperCase().slice(0, 10);
}

/* ═════════════════════════════════════════════
   FLOATING COMBAT TEXT
═════════════════════════════════════════════ */
function spawnFCT(x, y, text, cls){
  const layer = document.getElementById('fct-layer');
  if (!layer) return;
  const el = document.createElement('div');
  el.className = 'fct-text ' + cls;
  el.textContent = text;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

/* ═════════════════════════════════════════════
   LOOT POP
═════════════════════════════════════════════ */
function showLootPop(items){
  const panel = document.getElementById('loot-pop-panel');
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'loot-pop-card';
    card.innerHTML = `<span class="loot-icon">${item.icon||'📦'}</span><span class="loot-name loot-${item.rarity}">${item.name}</span><button class="loot-dismiss" title="Dismiss">✕</button>`;
    card.querySelector('.loot-dismiss').addEventListener('click', e => {
      e.stopPropagation();
      clearTimeout(card._t);
      card.classList.add('fading');
      setTimeout(() => card.remove(), 500);
    });
    card.addEventListener('click', e => {
      if (e.target.classList.contains('loot-dismiss')) return;
      window.GameEventBus.emit('loot:pickup', { itemId: item.id });
      card.classList.add('fading');
      setTimeout(() => card.remove(), 500);
    });
    panel.appendChild(card);
    card._t = setTimeout(() => {
      card.classList.add('fading');
      setTimeout(() => card.remove(), 500);
    }, 8000);
  });
}

/* ═════════════════════════════════════════════
   BOOKS DATA & RENDERING
═════════════════════════════════════════════ */
const BOOKS = [
  {id:'iron_body_4',    name:'Iron Body Sutra IV',     type:'martial', tier:4, stats:'+18 STR · +12 VIT', skill:'Iron Fortress',  active:true},
  {id:'iron_body_3',    name:'Iron Body Sutra III',    type:'martial', tier:3, stats:'+12 STR · +8 VIT',  skill:null,             active:false},
  {id:'bladestorm_2',   name:'Bladestorm Arts II',     type:'martial', tier:2, stats:'+14 DEX · +10% Crit',skill:'Wind Slash',    active:false},
  {id:'thunderstep_3',  name:'Thunderstep Form III',   type:'martial', tier:3, stats:'+12 DEX · +8 LUK',  skill:'Thunder Dash',   active:false},
  {id:'mountain_1',     name:'Mountain Fist I',        type:'martial', tier:1, stats:'+10 STR · +6 VIT',  skill:null,             active:false},
  {id:'void_weave_3',   name:'Void Weave III',         type:'soul',    tier:3, stats:'+15 INT · +20 Soul Cap', skill:'Soul Pulse',active:false},
  {id:'void_weave_2',   name:'Void Weave II',          type:'soul',    tier:2, stats:'+10 INT · +15 Soul Cap', skill:null,        active:false},
  {id:'flame_heart_2',  name:'Flame Heart II',         type:'soul',    tier:2, stats:'+12 INT · +10 WIS',  skill:'Ember Burst',   active:false},
  {id:'starflow_1',     name:'Starflow Meditation I',  type:'soul',    tier:1, stats:'+8 WIS · +10 Soul Cap',  skill:null,        active:false},
];
let bookTab = 'martial', bookFilter = 'all', bookUnlocked = false;
function renderBooks(){
  let list = BOOKS.filter(b => b.type === bookTab);
  if      (bookFilter === 'skill') list = list.filter(b => b.skill);
  else if (bookFilter === '1')     list = list.filter(b => b.tier === 1);
  else if (bookFilter === '2')     list = list.filter(b => b.tier === 2);
  else if (bookFilter === '3')     list = list.filter(b => b.tier === 3);
  else if (bookFilter === '4')     list = list.filter(b => b.tier >= 4);
  const discovered = BOOKS.filter(b => b.type === bookTab).length;
  const countEl = document.getElementById('book-count');
  const totalEl = document.getElementById('book-total');
  if (countEl) countEl.textContent = discovered;
  if (totalEl) totalEl.textContent = discovered;
  document.getElementById('book-list').innerHTML = list.map(b => {
    const ac  = b.active ? (bookTab === 'martial' ? 'active-martial' : 'active-soul') : '';
    const btn = bookTab === 'martial' ? 'activate-btn martial-btn' : 'activate-btn';
    return `<div class="book-entry ${ac}" data-id="${b.id}">
      <div class="book-entry-header">
        <span class="book-entry-name ${b.type}">${b.name}</span>
        <span class="tier-badge tier-${b.tier}">T${b.tier}</span>
        ${b.active ? '<span style="font-family:var(--font-hud);font-size:10px;color:var(--ui-gold);font-weight:700;letter-spacing:0.1em">ACTIVE</span>' : ''}
      </div>
      <div class="book-stats">${b.stats}</div>
      ${b.skill ? `<div><span class="book-skill-unlock">⚡ Skill: ${b.skill}</span></div>` : ''}
      <button class="${btn}" ${(!b.active && !bookUnlocked) ? 'disabled' : ''}
        title="${(!b.active && !bookUnlocked) ? 'Available on Prestige' : ''}"
        onclick="event.stopPropagation();activateBook('${b.id}','${b.type}')">
        ${b.active ? '✓ Active' : 'Activate'}
      </button>
    </div>`;
  }).join('');
}
function switchBookTab(t){
  bookTab = t;
  document.getElementById('tab-martial').className = 'book-tab martial' + (t === 'martial' ? ' active' : '');
  document.getElementById('tab-soul').className    = 'book-tab soul'    + (t === 'soul'    ? ' active' : '');
  renderBooks();
}
function filterBooks(f, btn){
  bookFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBooks();
}
function activateBook(id, type){
  BOOKS.forEach(b => { if (b.type === type) b.active = false; });
  const b = BOOKS.find(x => x.id === id);
  if (b) {
    b.active = true;
    window.GameEventBus.emit('book:activated', { bookId: id });
    const badge = document.getElementById('active-book-badge');
    if (badge) badge.textContent = b.name;
  }
  renderBooks();
}

/* ═════════════════════════════════════════════
   CORES DATA & RENDERING
═════════════════════════════════════════════ */
const CORES = [
  {id:'drake',   name:'Drake Core',   icon:'🐉', lvl:1,  active:true,  locked:false, affinity:['fire','body'],  desc:'+15% Fire, +8 STR'},
  {id:'serpent', name:'Serpent Core', icon:'🐍', lvl:1,  active:false, locked:false, affinity:['soul','void'],  desc:'+12% Soul, +6 WIS'},
  {id:'storm',   name:'Storm Core',   icon:'⚡', lvl:5,  active:false, locked:false, affinity:['wind','soul'],  desc:'+18% Wind, +10 DEX'},
  {id:'frost',   name:'Frost Drake',  icon:'❄️', lvl:15, active:false, locked:true,  affinity:['ice','body'],   desc:'+20% Ice, +12 VIT'},
  {id:'void',    name:'Void Shade',   icon:'🌑', lvl:20, active:false, locked:true,  affinity:['void','soul'],  desc:'+25% Void, +15 INT'},
  {id:'thunder', name:'Thunder Rex',  icon:'🦖', lvl:18, active:false, locked:true,  affinity:['wind','fire'],  desc:'+22% Lightning, +14 STR'},
];
let selCoreId = 'drake', inCombat = false, cdCountdown = 0, cdTimer = null;
function renderCores(){
  const playerLevel = window.GameState.player.level || 1;
  document.getElementById('core-grid').innerHTML = CORES.map(c => {
    const prog = c.locked ? Math.min(100, Math.floor((playerLevel / c.lvl) * 100)) : 100;
    return `<div class="core-card${c.locked?' locked-core':''}${c.active?' active-core':''}${selCoreId===c.id&&!c.locked&&!c.active?' selected-core':''}"
      onclick="${c.locked ? '' : ("selectCore('" + c.id + "')") }">
      ${c.locked ? '<div class="core-lock-icon">🔒</div>' : ''}
      <div class="core-card-header">
        <span class="core-icon">${c.icon}</span>
        <span class="core-name${c.locked?' locked':''}">${c.name}</span>
        ${c.active ? '<span class="core-active-marker">ACTIVE</span>' : ''}
      </div>
      <div class="core-level-req">Req Lv.${c.lvl} · ${c.desc}</div>
      <div class="core-affinity-tags">${c.affinity.map(a=>`<span class="affinity-tag affinity-${a}">${a.toUpperCase()}</span>`).join('')}</div>
      ${c.locked ? `<div class="core-progress"><div class="core-progress-track"><div class="core-progress-fill" style="width:${prog}%"></div></div><div class="core-progress-text">Lv.${playerLevel}/${c.lvl} required</div></div>` : ''}
    </div>`;
  }).join('');
  updateCoreSwapUI();
}
function selectCore(id){ selCoreId = id; renderCores(); }
function updateCoreSwapUI(){
  const btn = document.getElementById('core-swap-btn');
  const s   = document.getElementById('core-swap-status');
  const st  = document.getElementById('core-swap-status-text');
  if (!btn || !s || !st) return;
  if (inCombat) {
    btn.disabled = true; s.className = 'core-swap-status locked'; st.textContent = 'Cannot swap during combat';
  } else if (cdCountdown > 0) {
    btn.disabled = true; s.className = 'core-swap-status cooling'; st.textContent = 'Cooldown: ' + cdCountdown + 's';
  } else {
    btn.disabled = false; s.className = 'core-swap-status ready'; st.textContent = 'Core swap available';
  }
}

/* ═════════════════════════════════════════════
   STASH POPULATION
═════════════════════════════════════════════ */
const STASH_ITEMS = [
  {id:'s1',icon:'🪖',rarity:'magic'},  {id:'s2',icon:'📿',rarity:'rare'},
  {id:'s3',icon:'🧪',rarity:'normal'}, {id:'s4',icon:'⚡',rarity:'unique'},
  {id:'s5',icon:'🗡️',rarity:'magic'},  {id:'s6',icon:'👟',rarity:'normal'},
  {id:'s7',icon:'💰',rarity:'normal'}, {id:'s8',icon:'📜',rarity:'magic'},
];
function renderStash(){
  const g = document.getElementById('stash-grid');
  if (!g) return;
  let html = '';
  for (let i = 0; i < 32; i++) {
    const item = STASH_ITEMS[i];
    html += item
      ? `<div class="stash-cell has-item rarity-${item.rarity}" title="Item"
           onclick="UI.equipItem('${item.id}')"
           onmouseenter="showTT(event,'${item.id}')" onmouseleave="hideTT()">${item.icon}</div>`
      : `<div class="stash-cell"></div>`;
  }
  g.innerHTML = html;
}
function showTT(e, id){ const tt=document.getElementById('item-tooltip'); if(tt) tt.style.display='block'; }
function hideTT(){ const tt=document.getElementById('item-tooltip'); if(tt) tt.style.display='none'; }
function equipAction(e, slot){ e.preventDefault(); window.GameEventBus.emit('item:unequip', {slot}); }

/* ═════════════════════════════════════════════
   PRESTIGE PANEL
═════════════════════════════════════════════ */
let selectedDiff = 'nightmare';
function selectDiff(d){
  selectedDiff = d;
  document.querySelectorAll('.diff-radio-label').forEach(l => {
    const ld = l.dataset.diff;
    if (!ld) return;
    l.className = 'diff-radio-label' +
      (l.classList.contains('locked-diff') ? ' locked-diff' : ld === d ? ' checked-' + d : '');
  });
}
function showPrestigeConfirm(){ document.getElementById('prestige-confirm-modal').classList.add('visible'); }
function hidePrestigeConfirm(){ document.getElementById('prestige-confirm-modal').classList.remove('visible'); }
function confirmPrestige(){
  hidePrestigeConfirm(); closePanel('prestige');
  const mBook = document.getElementById('prestige-martial-select').value;
  const sBook = document.getElementById('prestige-soul-select').value;
  const core  = document.getElementById('prestige-core-select').value;
  window.GameEventBus.emit('ui:prestigeConfirmed', {
    activeMartialBook: mBook, activeSoulBook: sBook, activeCore: core, difficulty: selectedDiff
  });
  const p = window.GameState.player;
  document.getElementById('fanfare-subtitle').textContent =
    'Prestige ×' + ((p.prestige || 0) + 1) + ' — ' +
    selectedDiff.charAt(0).toUpperCase() + selectedDiff.slice(1) + ' Difficulty';
  const f = document.getElementById('prestige-fanfare');
  f.classList.add('active');
  setTimeout(() => f.classList.remove('active'), 4000);
  // State reset handled by PrestigeManager.executePrestige() via integration.js
}

/* ═════════════════════════════════════════════
   PUBLIC UI API
═════════════════════════════════════════════ */
window.UI = {
  skillSlotClick(slot){ window.GameEventBus.emit('ui:skillbarAssign', {slotIndex: slot, skillId: null}); },
  swapCore(){
    if (inCombat || cdCountdown > 0) return;
    const c = CORES.find(x => x.id === selCoreId);
    if (!c || c.locked) return;
    CORES.forEach(x => x.active = false); c.active = true;
    window.GameState.activeCore = { id: c.id, name: c.name };
    const badge = document.getElementById('active-core-badge');
    if (badge) badge.textContent = c.name;
    renderCores();
    window.GameEventBus.emit('core:fused', { coreId: selCoreId });
    document.querySelectorAll('.core-card.active-core').forEach(el => {
      el.classList.add('core-fuse-anim');
      setTimeout(() => el.classList.remove('core-fuse-anim'), 700);
    });
    cdCountdown = 30;
    if (cdTimer) clearInterval(cdTimer);
    cdTimer = setInterval(() => {
      cdCountdown--;
      if (cdCountdown <= 0) { cdCountdown = 0; clearInterval(cdTimer); }
      updateCoreSwapUI();
    }, 1000);
    updateCoreSwapUI();
  },
  equipItem(id){ window.GameEventBus.emit('item:equip', {itemId: id, slot: 'auto'}); }
};

/* ═════════════════════════════════════════════
   GAMEEVENTBUS LISTENERS
═════════════════════════════════════════════ */
(function setupListeners(){
  const bus = window.GameEventBus;
  bus.on('player:damaged', d => {
    updateHUD();
    const t = document.getElementById('bar-hp-track');
    if (t) { t.classList.add('bar-flashing'); setTimeout(() => t.classList.remove('bar-flashing'), 900); }
    spawnFCT(d?.x || window.innerWidth * 0.22, d?.y || window.innerHeight * 0.45,
      '-' + (d?.amount || '??'), 'fct-damage-taken');
  });
  bus.on('player:healed', d => {
    updateHUD();
    spawnFCT(d?.x || window.innerWidth * 0.22, d?.y || window.innerHeight * 0.45,
      '+' + (d?.amount || 0), 'fct-heal');
  });
  bus.on('player:levelup', d => {
    updateHUD();
    document.getElementById('hud-portrait')?.classList.add('levelup-anim');
    setTimeout(() => document.getElementById('hud-portrait')?.classList.remove('levelup-anim'), 900);
    const xpt = document.getElementById('bar-xp-track');
    if (xpt) { xpt.classList.add('xp-levelup-anim'); setTimeout(() => xpt.classList.remove('xp-levelup-anim'), 1000); }
  });
  bus.on('monster:damaged', d => {
    const cx = d?.x || window.innerWidth  * 0.45 + (Math.random() - 0.5) * 300;
    const cy = d?.y || window.innerHeight * 0.35 + (Math.random() - 0.5) * 150;
    spawnFCT(cx, cy, String(d?.amount || '??'), d?.crit ? 'fct-crit' : 'fct-damage-dealt');
  });
  bus.on('xp:gained', d => {
    updateHUD();
    spawnFCT(d?.x || window.innerWidth * 0.5, d?.y || window.innerHeight * 0.5,
      '+' + (d?.amount || 0) + ' XP', 'fct-xp');
  });
  bus.on('loot:dropped', d => showLootPop(d?.items || []));
  bus.on('book:learned', () => renderBooks());
  bus.on('book:activated', d => {
    const b = BOOKS.find(x => x.id === d?.bookId);
    if (b) {
      BOOKS.forEach(x => { if (x.type === b.type) x.active = false; });
      b.active = true;
      const badge = document.getElementById('active-book-badge');
      if (badge) badge.textContent = b.name;
      renderBooks();
    }
  });
  bus.on('book:activationUnlocked', () => { bookUnlocked = true; renderBooks(); });
  bus.on('core:fused', d => {
    const c = CORES.find(x => x.id === d?.coreId);
    if (c) {
      CORES.forEach(x => x.active = false); c.active = true;
      const badge = document.getElementById('active-core-badge');
      if (badge) badge.textContent = c.name;
      renderCores();
    }
  });
  bus.on('prestige:available', () => {
    window.GameState.prestigeReady = true;
    document.getElementById('prestige-indicator')?.classList.add('visible');
  });
  bus.on('prestige:complete', () => {
    window.GameState.prestigeReady = false;
    document.getElementById('prestige-indicator')?.classList.remove('visible');
    PANELS.forEach(p => closePanel(p));
    updateHUD();
  });
  bus.on('area:entered', d => {
    const nameEl = document.getElementById('area-name-text');
    if (nameEl) nameEl.textContent = d?.name || window.WorldData?.currentArea?.name || 'Unknown Region';
  });
  bus.on('combat:started', () => { inCombat = true;  updateCoreSwapUI(); });
  bus.on('combat:ended',   () => { inCombat = false; updateCoreSwapUI(); });
})();

/* ═════════════════════════════════════════════
   DEMO EVENTS (Live Demo Controls panel)
═════════════════════════════════════════════ */
function demoEvent(type){
  const cx = window.innerWidth  * 0.3 + Math.random() * window.innerWidth  * 0.4;
  const cy = window.innerHeight * 0.25 + Math.random() * window.innerHeight * 0.35;
  switch (type) {
    case 'player:damaged':  window.GameEventBus.emit('player:damaged',  {amount: Math.floor(30  + Math.random() * 90),  x:cx, y:cy}); break;
    case 'monster:damaged': window.GameEventBus.emit('monster:damaged', {amount: Math.floor(80  + Math.random() * 240), crit: Math.random() > 0.55, x:cx, y:cy}); break;
    case 'xp:gained':       window.GameEventBus.emit('xp:gained',       {amount: Math.floor(100 + Math.random() * 500), x:cx, y:cy}); break;
    case 'loot:dropped':    window.GameEventBus.emit('loot:dropped',    {items:[
      {id:'l'+Date.now(),      icon:'⚔️', name:'Ember Blade',    rarity:'magic'},
      {id:'l'+(Date.now()+1), icon:'💎', name:'Void Shard Core', rarity:'unique'}
    ]}); break;
    case 'player:levelup':     window.GameEventBus.emit('player:levelup',     {}); break;
    case 'prestige:available': window.GameEventBus.emit('prestige:available', {}); break;
    case 'combat:started':     window.GameEventBus.emit('combat:started',     {}); break;
    case 'combat:ended':       window.GameEventBus.emit('combat:ended',       {}); break;
  }
}

/* ═════════════════════════════════════════════
   INIT
═════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  updateHUD(); renderBooks(); renderCores(); renderStash();
  // All panels start closed — open with C / I / B / K / P  or portrait click.
  // Esc closes all. Each panel is independent; opening one does not close others.
});

/* GameData stub — Agent 2 (data-loot.js) populates the real version */
window.GameData = window.GameData || { books: BOOKS, cores: CORES,
  origins: [{id:'iron_path', name:'Iron Path', lore:'Born where stone meets sky.'}]
};
