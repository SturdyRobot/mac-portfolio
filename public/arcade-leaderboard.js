/* ═══════════════════════════════════════════════════════════════════
   ARCADE LEADERBOARD — shared high-score table for the games.
   Talks to /leaderboard.php so every visitor sees the SAME global board.
   localStorage is used only as an offline cache: if the endpoint is
   unreachable (e.g. local dev with no PHP), it degrades to per-device.

   Games call:  ArcadeLB.report(game, score)   // on game over
                ArcadeLB.top(game, n)           // sync, for HI displays
                ArcadeLB.refresh(game)          // async, warm the cache
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const ENDPOINT = '/leaderboard.php';
  const KEY = (g) => 'arcade.scores.' + g;
  const MAX = 10;
  const NAMES = { jungle: 'JUNGLE RUN', snake: 'SNAKE', breakout: 'BREAKOUT' };

  const sortTrim = (list) => list.slice().sort((a, b) => b.score - a.score).slice(0, MAX);
  function loadCache(g) {
    try { const a = JSON.parse(localStorage.getItem(KEY(g)) || '[]'); return Array.isArray(a) ? a : []; }
    catch { return []; }
  }
  function saveCache(g, list) { try { localStorage.setItem(KEY(g), JSON.stringify(list)); } catch {} }

  // sync — cached board, good enough for "HI 01500 NOEL" displays
  function top(g, n) { return sortTrim(loadCache(g)).slice(0, n || MAX); }

  // async — fetch the global board and refresh the cache
  async function refresh(g) {
    try {
      const r = await fetch(ENDPOINT + '?game=' + encodeURIComponent(g), { cache: 'no-store' });
      if (!r.ok) throw 0;
      const data = await r.json();
      if (!Array.isArray(data)) throw 0;
      saveCache(g, data);
      return data;
    } catch { return sortTrim(loadCache(g)); }
  }

  // async — submit to the global board; fall back to local-only if offline
  async function post(g, tag, score) {
    tag = String(tag || 'YOU').toUpperCase().replace(/[^A-Z0-9 ]/g, '').trim().slice(0, 6) || 'YOU';
    score = Math.floor(score) || 0;
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: g, tag, score }),
      });
      if (!r.ok) throw 0;
      const data = await r.json();
      if (!Array.isArray(data)) throw 0;
      saveCache(g, data);
      return { board: data, global: true };
    } catch {
      const list = loadCache(g);
      list.push({ tag, score, t: Date.now() });
      const trimmed = sortTrim(list);
      saveCache(g, trimmed);
      return { board: trimmed, global: false };
    }
  }

  function qualifies(board, score) {
    score = Math.floor(score) || 0;
    if (score <= 0) return false;
    return board.length < MAX || score > board[board.length - 1].score;
  }

  // the single entry point the games call on game over
  async function report(game, score) {
    score = Math.floor(score) || 0;
    if (score <= 0) return;
    const board = await refresh(game);        // latest global board
    if (!qualifies(board, score)) return;
    promptTag(game, score, board);
  }

  // ── shared retro styling, injected once ──
  function ensureCSS() {
    if (document.getElementById('alb-css')) return;
    const s = document.createElement('style');
    s.id = 'alb-css';
    s.textContent = `
      .alb-veil{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;
        background:rgba(4,12,8,.72);font-family:'Silkscreen','Courier New',monospace;
        -webkit-user-select:none;user-select:none;padding:8px;box-sizing:border-box}
      .alb-panel{width:100%;max-width:340px;background:#0e241a;border:3px solid #7bd88f;border-radius:8px;
        box-shadow:0 8px 34px rgba(0,0,0,.6),inset 0 0 0 2px #143325;color:#dfffe0;
        padding:14px 14px 12px;text-align:center;image-rendering:pixelated}
      .alb-title{color:#ffd23f;font-weight:bold;font-size:15px;letter-spacing:1px;margin:2px 0 2px}
      .alb-sub{color:#7bd88f;font-size:9px;letter-spacing:1px;margin-bottom:12px}
      .alb-slots{display:flex;gap:6px;justify-content:center;margin:6px 0 10px}
      .alb-slot{display:flex;flex-direction:column;align-items:center;gap:3px}
      .alb-ch{width:30px;height:38px;line-height:38px;font-size:22px;font-weight:bold;color:#dfffe0;
        background:#08160f;border:2px solid #2c5c40;border-radius:5px;cursor:pointer}
      .alb-ch.cur{border-color:#ffd23f;color:#ffd23f;box-shadow:0 0 0 2px rgba(255,210,63,.25)}
      .alb-arrow{width:26px;height:18px;line-height:16px;font-size:11px;color:#0e241a;background:#7bd88f;
        border:none;border-radius:4px;cursor:pointer;padding:0}
      .alb-arrow:active{background:#ffd23f}
      .alb-hint{color:#8fb89b;font-size:8px;letter-spacing:.5px;margin:8px 0 12px;line-height:1.5}
      .alb-btn{display:inline-block;background:#ffd23f;color:#3a2a0a;font-weight:bold;font-size:12px;
        letter-spacing:1px;border:none;border-radius:6px;padding:8px 22px;cursor:pointer;font-family:inherit}
      .alb-btn:disabled{opacity:.6;cursor:default}
      .alb-btn:active{transform:translateY(1px)}
      .alb-rows{text-align:left;margin:4px 0 12px;font-size:11px;line-height:1.72}
      .alb-row{display:flex;justify-content:space-between;gap:8px;padding:1px 4px;border-radius:3px}
      .alb-row .r{color:#7bd88f;width:20px}
      .alb-row .n{flex:1;color:#dfffe0;letter-spacing:1px;white-space:nowrap;overflow:hidden}
      .alb-row .s{color:#ffd23f;font-variant-numeric:tabular-nums}
      .alb-row.me{background:rgba(255,210,63,.16);outline:1px solid rgba(255,210,63,.4)}
    `;
    document.head.appendChild(s);
  }

  let active = false;
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
  const disp = (c) => (c === ' ' ? '_' : c);

  function promptTag(game, score, board, onDone) {
    ensureCSS();
    active = true; API.active = true;
    const slots = ['A', 'A', 'A', ' ', ' ', ' '];
    let cur = 0, saving = false;

    const veil = document.createElement('div'); veil.className = 'alb-veil';
    const panel = document.createElement('div'); panel.className = 'alb-panel';
    veil.appendChild(panel);

    const rank = board.filter((e) => e.score >= score).length;
    panel.innerHTML =
      `<div class="alb-title">NEW HIGH SCORE!</div>` +
      `<div class="alb-sub">${NAMES[game] || game} · #${rank + 1} · ${Math.floor(score)} PTS</div>`;

    const slotWrap = document.createElement('div'); slotWrap.className = 'alb-slots';
    const chEls = [];
    slots.forEach((_, i) => {
      const col = document.createElement('div'); col.className = 'alb-slot';
      const up = document.createElement('button'); up.className = 'alb-arrow'; up.textContent = '▲';
      const ch = document.createElement('div'); ch.className = 'alb-ch';
      const dn = document.createElement('button'); dn.className = 'alb-arrow'; dn.textContent = '▼';
      up.onclick = (e) => { e.stopPropagation(); cur = i; cycle(1); };
      dn.onclick = (e) => { e.stopPropagation(); cur = i; cycle(-1); };
      ch.onclick = (e) => { e.stopPropagation(); cur = i; render(); };
      col.append(up, ch, dn); slotWrap.appendChild(col); chEls.push(ch);
    });
    panel.appendChild(slotWrap);

    const hint = document.createElement('div'); hint.className = 'alb-hint';
    hint.innerHTML = 'TYPE YOUR TAG · &#9668;&#9658; MOVE · &#9650;&#9660; LETTER<br>ENTER / OK TO SAVE';
    panel.appendChild(hint);

    const ok = document.createElement('button'); ok.className = 'alb-btn'; ok.textContent = 'OK';
    ok.onclick = (e) => { e.stopPropagation(); confirm(); };
    panel.appendChild(ok);

    function render() {
      chEls.forEach((el, i) => { el.textContent = disp(slots[i]); el.classList.toggle('cur', i === cur); });
    }
    function cycle(d) {
      let idx = ALPHA.indexOf(slots[cur]); if (idx < 0) idx = 0;
      idx = (idx + d + ALPHA.length) % ALPHA.length;
      slots[cur] = ALPHA[idx]; render();
    }
    async function confirm() {
      if (saving) return;
      saving = true; ok.disabled = true; ok.textContent = 'SAVING…';
      const tag = slots.join('').replace(/\s+$/, '').replace(/\s/g, ' ').trim() || 'YOU';
      const { board: newBoard } = await post(game, tag, score);
      cleanup();
      showBoard(game, newBoard, tag, score, onDone);
    }
    function onKey(e) {
      if (!active || saving) return;
      const k = e.key;
      if (k === 'ArrowLeft')       { cur = (cur + slots.length - 1) % slots.length; render(); }
      else if (k === 'ArrowRight') { cur = (cur + 1) % slots.length; render(); }
      else if (k === 'ArrowUp')    { cycle(1); }
      else if (k === 'ArrowDown')  { cycle(-1); }
      else if (k === 'Enter')      { confirm(); return; }
      else if (k === 'Backspace')  { slots[cur] = ' '; cur = Math.max(0, cur - 1); render(); }
      else if (/^[a-zA-Z0-9]$/.test(k)) { slots[cur] = k.toUpperCase(); cur = Math.min(slots.length - 1, cur + 1); render(); }
      else return;
      e.preventDefault(); e.stopPropagation();
    }
    function cleanup() {
      window.removeEventListener('keydown', onKey, true);
      veil.remove();
    }
    window.addEventListener('keydown', onKey, true);
    document.body.appendChild(veil);
    render();
  }

  function showBoard(game, board, meTag, meScore, onDone) {
    ensureCSS();
    active = true; API.active = true;
    const veil = document.createElement('div'); veil.className = 'alb-veil';
    const panel = document.createElement('div'); panel.className = 'alb-panel';
    veil.appendChild(panel);

    let meRank = -1;
    for (let i = 0; i < board.length; i++) {
      if (meRank < 0 && board[i].tag === (meTag || '').toUpperCase() && board[i].score === Math.floor(meScore)) meRank = i;
    }

    let rows = '';
    for (let i = 0; i < MAX; i++) {
      const e = board[i];
      const me = i === meRank ? ' me' : '';
      const tag = e ? e.tag.padEnd(6, ' ') : '   ---';
      const sc = e ? String(e.score).padStart(5, '0') : '00000';
      rows += `<div class="alb-row${me}"><span class="r">${i + 1}</span><span class="n">${tag}</span><span class="s">${sc}</span></div>`;
    }
    panel.innerHTML =
      `<div class="alb-title">TOP 10</div>` +
      `<div class="alb-sub">${NAMES[game] || game} · WORLDWIDE</div>` +
      `<div class="alb-rows">${rows}</div>`;
    const ok = document.createElement('button'); ok.className = 'alb-btn'; ok.textContent = 'CONTINUE';
    panel.appendChild(ok);

    function close(e) {
      if (e) e.stopPropagation();
      window.removeEventListener('keydown', onKey, true);
      veil.remove(); active = false; API.active = false;
      if (typeof onDone === 'function') onDone();
    }
    function onKey(e) {
      if (['Enter', ' ', 'x', 'z', 'Escape'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); close(); }
    }
    ok.onclick = close;
    window.addEventListener('keydown', onKey, true);
    document.body.appendChild(veil);
  }

  const API = { report, refresh, top, qualifies, promptTag, showBoard, active: false, NAMES };
  window.ArcadeLB = API;
})();
