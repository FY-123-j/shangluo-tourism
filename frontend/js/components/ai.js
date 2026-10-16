/**
 * AI 文旅助手：对话（主页面 + 浮动抽屉）+ 行程规划
 */
import { $, $$, esc, reduceMotion } from '../utils.js';
import { c } from '../store.js';
import { askAI, generateItinerary, checkAIHealth } from '../api.js';
import { matchAnswer, isFallback } from '../knowledge.js';

/* ---------- 消息渲染 ---------- */
const STORAGE_KEY = 'sl_ai_history';

function updateModeLabel() {
  const label = $('#aiModeLabel');
  if (!label) return;
  checkAIHealth().then((ok) => {
    label.textContent = ok ? '大模型在线' : '大模型离线 (本地语料兜底)';
    label.style.color = ok ? '#7ee2a8' : '#c9a24b';
  });
}

function saveMsg(role, html) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  history.push({ role, html });
  if (history.length > 50) history.shift(); // 最多存 50 条
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function loadHistory(chat) {
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!history.length) {
    welcome(chat);
    return;
  }
  history.forEach((m) => {
    const el = document.createElement('div');
    el.className = 'msg ' + m.role;
    el.innerHTML = m.html;
    chat.appendChild(el);
  });
  chat.scrollTop = chat.scrollHeight;
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  const chats = $$('.ai-chat');
  chats.forEach((c) => {
    c.innerHTML = '';
    welcome(c);
  });
}

function addMsg(chat, role, html, shouldSave = true) {
  const m = document.createElement('div');
  m.className = 'msg ' + role;
  m.innerHTML = html;
  chat.appendChild(m);
  chat.scrollTop = chat.scrollHeight;
  if (shouldSave) saveMsg(role, html);
  return m;
}

function typeInto(el, text, done, chat, role) {
  let i = 0;
  const step = () => {
    i += 2;
    el.textContent = text.slice(0, i);
    if (chat) chat.scrollTop = chat.scrollHeight;
    if (i < text.length && !reduceMotion) setTimeout(step, 14);
    else {
      el.textContent = text;
      /* 打字完成后保存最终 HTML */
      const msgEl = el.closest('.msg');
      if (msgEl) saveMsg(role, msgEl.innerHTML);
      done && done();
    }
  };
  step();
}

function renderAnswer(aiEl, ans, chat) {
  aiEl.innerHTML = '';
  typeInto(
    aiEl,
    ans.a,
    () => {
      let extra = '';
      if (ans.cards) {
        const ck = ans.cards
          .map(
            (card) =>
              `<div class="ck"><b>${esc(card[0])}</b><span>${esc(card[1])}</span></div>`
          )
          .join('');
        extra += `<div class="cards">${ck}</div>`;
      }
      if (ans.src) {
        extra += `<div class="src"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/></svg>信息来源：${esc(ans.src)}</div>`;
      }
      if (extra) {
        aiEl.insertAdjacentHTML('beforeend', extra);
        /* 更新保存的内容 */
        const msgEl = aiEl.closest('.msg');
        if (msgEl) {
          const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          if (history.length) {
            history[history.length - 1].html = msgEl.innerHTML;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
          }
        }
      }
      if (chat) chat.scrollTop = chat.scrollHeight;
    },
    chat,
    'ai'
  );
}

/* ---------- 提问 ---------- */
function ask(chat, input, q) {
  q = (q || input.value).trim();
  if (!q) return;
  input.value = '';
  addMsg(chat, 'user', esc(q));
  const aiEl = addMsg(chat, 'ai', '<span style="opacity:.6">思考中…</span>', false);

  /* 极速响应策略：优先检查本地语料库，如果是核心问题则直接秒回 */
  const local = matchAnswer(q);
  const isCore = !isFallback(local);

  if (isCore) {
    /* 核心问题直接由本地语料库回答，实现零延迟 */
    renderAnswer(aiEl, local, chat);
    return;
  }

  /* 非核心问题走后端大模型 */
  askAI(q)
    .then((d) => renderAnswer(aiEl, { a: d.answer, src: d.source }, chat))
    .catch(() => {
      /* 如果 AI 失败且之前没走本地（即非核心问题），则展示最终兜底 */
      renderAnswer(
        aiEl,
        {
          a: local.a || 'AI 服务暂时不可用，请稍后重试。',
          src: local.src || '服务暂不可用'
        },
        chat
      );
    });
}

function welcome(chat) {
  addMsg(
    chat,
    'ai',
    '你好，我是商洛文旅数字助手，任何问题都能答（景区、门票、非遗、美食、交通、天气、攻略等），也可以选择天数、人群生成专属行程。',
    false
  );
}

/* ---------- 行程规划（AI 生成，固定模板兜底） ---------- */
let routeIdx = Math.floor(Math.random() * 5);

/* 渲染 AI 返回的结构化行程 */
function renderAIItinerary(it, source) {
  const daysHtml = it.days
    .map((d) => {
      const items = (d.items || [])
        .map(
          (n) => `
        <div class="itin-node" data-type="${esc(n.type || 'sight')}">
          <span class="node-time">${esc(n.time || '')}</span>
          <span class="node-dot"></span>
          <div class="node-body"><b>${esc(n.title)}</b><span>${esc(n.desc || '')}</span></div>
        </div>`
        )
        .join('');
      return `
      <div class="itin-day">
        <div class="day-hd">
          <span class="day-no">${d.day}</span>
          <b>第 ${d.day} 天</b>
          ${d.theme ? `<span class="day-theme">${esc(d.theme)}</span>` : ''}
        </div>
        ${items}
        ${d.meals ? `<div class="day-meals">餐食：${esc(d.meals)}</div>` : ''}
        ${d.tips ? `<div class="day-tips">贴士：${esc(d.tips)}</div>` : ''}
      </div>`;
    })
    .join('');

  const tipsHtml =
    Array.isArray(it.tips) && it.tips.length
      ? `<div class="itin-tips"><b>出行贴士</b><ul>${it.tips
          .map((t) => `<li>${esc(t)}</li>`)
          .join('')}</ul></div>`
      : '';

  $('#itinerary').innerHTML = `
    <div class="itin-result">
      <div class="itin-head">
        <h3>${esc(it.title || '你的专属行程')}</h3>
        ${it.summary ? `<p>${esc(it.summary)}</p>` : ''}
      </div>
      ${daysHtml}
      ${tipsHtml}
      <div class="itin-actions">
        <button id="regenItin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6"/></svg>重新生成</button>
      </div>
      <div class="itin-src">本行程由 ${esc(source)} 生成，仅供参考，具体以官方及实际情况为准</div>
    </div>`;
  $('#itinerary').classList.add('show');
  $('#regenItin').addEventListener('click', () => buildItinerary());
}

/* 主入口：调用 AI 生成行程，失败回退固定模板 */
function buildItinerary() {
  const days = +$('#planDays').value;
  const crowdText = $('#planCrowd').selectedOptions[0].text;
  const from = $('#planFrom').value.trim() || '西安';

  $('#itinerary').classList.add('show');
  $('#itinerary').innerHTML = `
    <div class="itin-loading">
      <div class="spin"></div>
      <p>AI 正在为你规划 ${days} 天的「${esc(crowdText)}」行程…</p>
      <p style="font-size:12.5px;color:#8a9b8f">大模型生成约需 1~2 分钟，请耐心等待，勿重复点击</p>
    </div>`;

  generateItinerary({ days, crowd: crowdText, origin: from })
    .then((d) => renderAIItinerary(d.itinerary, d.source))
    .catch((err) => {
      console.error('[行程生成失败]', err);
      buildFallbackItinerary(err.message === 'HTTP 503' ? 'AI 服务繁忙' : '生成失败');
    });
}

/* 兜底：AI 不可用时使用内置经典线路模板 */
function buildFallbackItinerary(reason = 'AI 行程生成暂时不可用') {
  const ROUTES = c('ROUTES');
  const days = +$('#planDays').value;
  const crowdKey = $('#planCrowd').value;
  const from = $('#planFrom').value.trim() || '西安';
  const crowdText = $('#planCrowd').selectedOptions[0].text;
  const pool = ROUTES[crowdKey] || ROUTES.health;

  const dayHtml = [];
  for (let d = 0; d < days; d++) {
    const t = pool[(routeIdx + d) % pool.length];
    dayHtml.push(`
      <div class="day">
        <div class="day-hd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>第 ${d + 1} 天 · ${esc(t.title)}</div>
        <div class="day-bd">
          ${t.stops
            .map(
              (s) =>
                `<div class="stop"><span class="t">${esc(s[0])}</span><span><b>${esc(s[1])}</b> — ${esc(s[2])}</span></div>`
            )
            .join('')}
          <div class="stop"><span class="t">餐食</span><span class="food">${esc(t.food)}</span></div>
        </div>
      </div>`);
  }

  $('#itinerary').innerHTML = `
    <div class="itin-error">${esc(reason)}，已为你推荐经典线路（可稍后点"重新生成"）。</div>
    <div class="day" style="border-color:rgba(201,162,75,.45)">
      <div class="day-hd" style="color:#fff"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3v-6l2-4h14l2 4v6h-2M7 17h10"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>${esc(from)}出发 · ${days} 日 ${esc(crowdText)}</div>
    </div>
    ${dayHtml.join('')}
    <button class="swap" id="swapRoute">
      <svg style="width:12px;height:12px;vertical-align:-1px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v6h6M20 20v-6h-6h-6"/><path d="M20 9A8.5 8.5 0 0 0 5.5 5.5L4 8M4 15a8.5 8.5 0 0 0 14.5 3.5L20 16"/></svg>换一条线路
    </button>`;
  $('#itinerary').classList.add('show');
  $('#swapRoute').addEventListener('click', () => {
    routeIdx++;
    buildFallbackItinerary();
  });
}

/* ---------- 事件绑定 ---------- */
let eventsBound = false;
let drawerOpened = false;

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  const aiChat = $('#aiChat');
  const aiInput = $('#aiInput');
  $('#aiSend').addEventListener('click', () => ask(aiChat, aiInput));
  aiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ask(aiChat, aiInput);
  });
  $('#aiClear').addEventListener('click', clearHistory);

  /* 浮动抽屉 */
  const dChat = $('#dChat');
  const dInput = $('#dInput');
  $('#fab').addEventListener('click', () => {
    $('#drawer').classList.toggle('open');
    if (!drawerOpened) {
      drawerOpened = true;
      /* 浮动框不加载全部历史，仅显示欢迎语 */
      welcome(dChat);
    }
  });
  $('#dClose').addEventListener('click', () => $('#drawer').classList.remove('open'));
  $('#dSend').addEventListener('click', () => ask(dChat, dInput));
  dInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') ask(dChat, dInput);
  });

  /* 快捷问题：根据所在容器路由到对应对话 */
  $$('[data-q]').forEach((b) =>
    b.addEventListener('click', () => {
      const inStage = !!b.closest('.ai-stage');
      ask(inStage ? aiChat : dChat, inStage ? aiInput : dInput, b.dataset.q);
    })
  );

  /* 行程规划：点击按钮由 AI 生成（改变下拉不自动请求） */
  $('#planGo').addEventListener('click', buildItinerary);
}

/* ---------- 视图渲染入口 ---------- */
export function render() {
  bindEvents();
  updateModeLabel();
  const aiChat = $('#aiChat');
  if (!aiChat.children.length) loadHistory(aiChat);
}
