/**
 * 后端接口封装
 */
import { API_BASE, GEO_URL } from './config.js';

async function request(url, options = {}, timeout = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(API_BASE + url, {
      ...options,
      signal: controller.signal
    });
    if (!res.ok) {
      const err = new Error('HTTP ' + res.status);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

/* 加载全部内容数据 */
export async function getContent() {
  const j = await request('/api/content', {}, 10000);
  return j.data;
}

/* 加载地图 GeoJSON（纯静态文件） */
export async function getGeo() {
  const res = await fetch(GEO_URL);
  if (!res.ok) throw new Error('地图数据加载失败');
  return res.json();
}

/* AI 服务健康检查 */
export async function checkAIHealth() {
  try {
    await request('/api/health', {}, 5000);
    return true;
  } catch (e) {
    return false;
  }
}

/* AI 问答：返回 { answer, source }，失败（503等）抛出 */
export async function askAI(message) {
  const j = await request('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  }, 15000); // 客户端最多等 15s
  return j.data;
}

/* 七县天气 */
export async function getAllWeather() {
  const j = await request('/api/weather');
  return j.data;
}

/* 单县天气 */
export async function getWeather(county) {
  const j = await request('/api/weather/' + encodeURIComponent(county));
  return j.data;
}

/* 新闻详情：返回单条新闻（含权威正文） */
export async function getNewsDetail(id) {
  const j = await request('/api/news/' + id);
  return j.data;
}

/* AI 生成行程：返回 { itinerary, source } */
export async function generateItinerary(params) {
  const j = await request('/api/ai/itinerary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }, 50000); // 客户端等 50s
  return j.data;
}
