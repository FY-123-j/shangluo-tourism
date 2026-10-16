/**
 * AI 服务层
 * 调用顺序：火山方舟豆包大模型 → Pollinations 免费公共通道
 *   - chat()：普通问答
 *   - generateItinerary()：根据天数/人群/出发地生成结构化 JSON 行程
 */

const SYSTEM_PROMPT =
  '你是"商洛文旅数字平台"的官方文旅助手。请用简体中文、口语化且简洁地回答关于商洛旅游的问题' +
  '（景点、门票、交通、美食、住宿、天气、攻略、近期活动等）。可以结合公开信息作答；' +
  '不确定的信息请说明"以官方为准"，不要编造景区电话等具体事实。回答控制在200字以内，必要时分点。';

/* 简单的内存缓存：相同问题 10 分钟内直接复用 */
const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

/* 带超时的 fetch 封装 */
async function fetchWithTimeout(url, options = {}, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 通用：调用火山方舟豆包大模型，返回文本
 * @param {Array<{role:string,content:string}>} messages
 * @param {object} opts { temperature, max_tokens, timeout }
 */
async function arkChat(messages, opts = {}) {
  const apiKey = process.env.ARK_API_KEY;
  const baseUrl = (process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3').replace(/\/$/, '');
  const model = process.env.ARK_MODEL || 'doubao-seed-evolving';

  if (!apiKey || apiKey.startsWith('在此填入')) {
    throw new Error('未配置 ARK_API_KEY');
  }

  const res = await fetchWithTimeout(
    baseUrl + '/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature != null ? opts.temperature : 0.7,
        max_tokens: opts.max_tokens != null ? opts.max_tokens : 600
      })
    },
    opts.timeout != null ? opts.timeout : 20000
  );

  if (!res.ok) {
    let msg = 'HTTP ' + res.status;
    try {
      const j = await res.json();
      msg = (j.error && (j.error.message || j.message)) || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const j = await res.json();
  const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!text || !text.trim()) throw new Error('豆包返回空回复');
  return text.trim();
}

/**
 * 通道一：火山方舟 · 豆包大模型
 */
async function askArk(question, timeout = 12000) {
  const text = await arkChat([
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question }
  ], { timeout });
  const model = process.env.ARK_MODEL || 'doubao-seed-evolving';
  return { answer: text, source: '豆包大模型 · ' + model };
}

/**
 * 通道二：Pollinations 免费公共通道（无需 Key）
 */
async function askPollinations(question, timeout = 10000) {
  const res = await fetchWithTimeout(
    'https://text.pollinations.ai/' +
      encodeURIComponent('请用简体中文、口语化且简洁地回答，控制在200字以内：' + question) +
      '?model=openai',
    { method: 'GET' },
    timeout
  );
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  if (!text || text.length <= 4 || /^\{/.test(text.trim())) throw new Error('空回复');
  return { answer: text.trim(), source: '联网智能通道 · 在线作答' };
}

/**
 * 普通问答统一入口：先查缓存，再依次尝试两个通道
 * @returns {Promise<{answer:string, source:string}>}
 */
async function chat(question) {
  const hit = cache.get(question);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.data;

  /* 策略：如果问题很短且命中本地核心关键词，可以考虑直接由前端处理，
     但为了保持后端逻辑统一，这里尝试缩短超时并并发调用 */
  try {
    const data = await Promise.any([
      askArk(question, 10000), // 10秒超时
      askPollinations(question, 8000) // 8秒超时
    ]);
    cache.set(question, { t: Date.now(), data });
    return data;
  } catch (e) {
    console.error('[AI Chat] 所有通道超时或失败:', e.message);
    throw new Error('AI 服务繁忙，请使用本地搜索');
  }
}

/* =====================================================================
 * 行程生成
 * ===================================================================== */

/* 从模型输出中提取 JSON（兼容 ```json 代码块、前后多余文字） */
function extractJSON(text) {
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end !== -1) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

/* 读取数据库中真实景区/美食，构造上下文，防止模型编造 */
function buildItineraryContext() {
  const db = require('../db');
  const get = (key) =>
    JSON.parse(db.prepare('SELECT value FROM content WHERE key = ?').get(key).value);
  const sights = get('SIGHTS');
  const foods = get('FOODS');
  const sightLines = sights
    .map((s) => `· ${s.name}（${s.county}，${s.level || '开放'}）`)
    .join('\n');
  const foodLines = foods.map((f) => `· ${f.name}（${f.region}）`).join('\n');
  return { sightLines, foodLines };
}

/**
 * 生成行程
 * @param {object} params { days, crowd, origin, preference }
 * @returns {Promise<{itinerary:object, source:string}>}
 */
async function generateItinerary(params) {
  const days = Math.max(1, Math.min(7, Number(params.days) || 2));
  const crowd = (params.crowd || '游客').toString();
  const origin = (params.origin || '西安').toString();
  const preference = (params.preference || '').toString();
  const { sightLines, foodLines } = buildItineraryContext();

  const sys =
    '你是资深的商洛文旅行程规划师，熟悉商洛七县的景区、美食、交通与住宿。' +
    '你只会依据提供的真实资源安排行程，不编造不存在的景点。';

  const user =
    `请为以下游客生成一份商洛旅游行程。\n\n` +
    `【需求】\n` +
    `· 行程天数：${days} 天\n` +
    `· 人群：${crowd}\n` +
    `· 出发地：${origin}\n` +
    (preference ? `· 偏好备注：${preference}\n` : '') +
    `\n【商洛真实景区（只能从中选择，勿编造）】\n${sightLines}\n\n` +
    `【商洛美食（可用于餐食安排）】\n${foodLines}\n\n` +
    `【规划要求】\n` +
    `1. 按天编排，每天 3~5 个节点，时间从早到晚，地点就近、避免来回绕路；\n` +
    `2. 节点 type 只能取：traffic（交通）、sight（游览）、meal（用餐）、hotel（住宿）、rest（休整）；\n` +
    `3. 要考虑从出发地往返的交通时间（高铁/自驾），首日抵达、末日返程要写清楚；\n` +
    `4. 节奏贴合人群（亲子轻松、研学重文化、康养宜慢、摄影重光影）；\n` +
    `5. 只输出紧凑的 JSON（不要 markdown 代码块和任何解释，直接以 { 开头）。\n\n` +
    `【JSON 格式示例】\n` +
    `{\n` +
    `  "title": "行程标题",\n` +
    `  "summary": "2~3句总体说明",\n` +
    `  "days": [\n` +
    `    {\n` +
    `      "day": 1,\n` +
    `      "theme": "当天主题",\n` +
    `      "items": [\n` +
    `        {"time":"08:30","type":"sight","title":"名称","desc":"一句话说明"}\n` +
    `      ],\n` +
    `      "meals": "当天推荐餐食",\n` +
    `      "tips": "当天贴士"\n` +
    `    }\n` +
    `  ],\n` +
    `  "tips": ["整体贴士1", "整体贴士2"]\n` +
    `}`;

  const text = await arkChat(
    [
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ],
    { temperature: 0.3, max_tokens: 1500, timeout: 45000 } // 缩短到 45s
  );

  let itinerary;
  try {
    itinerary = extractJSON(text);
  } catch (e) {
    console.error('[AI 行程] JSON 解析失败:', e, '\n原始文本:', text);
    throw new Error('AI 生成的行程格式错误');
  }

  /* 规整：确保天数与需求一致 */
  if (!Array.isArray(itinerary.days) || itinerary.days.length === 0) {
    throw new Error('行程 JSON 缺少 days');
  }
  const model = process.env.ARK_MODEL || 'doubao-seed-evolving';
  return { itinerary, source: '豆包大模型 · ' + model };
}

module.exports = { chat, generateItinerary, arkChat };
