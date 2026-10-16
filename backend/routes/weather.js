/**
 * 天气接口（代理 Open-Meteo，免费、无需 Key）
 *   GET /api/weather            七县天气
 *   GET /api/weather/:county    单县天气，例如 /api/weather/商州区
 * 服务端缓存 10 分钟，减少对第三方接口的请求次数。
 */
const express = require('express');

const router = express.Router();

const COUNTY_XY = {
  商州区: [109.938, 33.869],
  山阳县: [109.88, 33.53],
  洛南县: [110.146, 34.089],
  丹凤县: [110.332, 33.695],
  商南县: [110.885, 33.526],
  镇安县: [109.151, 33.424],
  柞水县: [109.111, 33.683]
};

const WMO_ZH = {
  0: '晴', 1: '晴转多云', 2: '多云', 3: '阴', 45: '雾', 48: '雾凇',
  51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨', 56: '冻毛毛雨', 57: '冻毛毛雨',
  61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '冻雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
  80: '小阵雨', 81: '中阵雨', 82: '强阵雨', 85: '小阵雪', 86: '大阵雪',
  95: '雷阵雨', 96: '雷阵雨伴冰雹', 99: '雷阵雨伴冰雹'
};

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

async function fetchWeather(county) {
  const [lng, lat] = COUNTY_XY[county];
  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
    '&longitude=' + lng +
    '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m';

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    const c = j.current;
    if (!c) throw new Error('空数据');

    const now = new Date();
    const hh = ('0' + now.getHours()).slice(-2);
    const mm = ('0' + now.getMinutes()).slice(-2);

    return {
      county,
      temperature: Math.round(c.temperature_2m),
      humidity: c.relative_humidity_2m,
      wind: Math.round(c.wind_speed_10m),
      weather: WMO_ZH[c.weather_code] || '',
      updatedAt: hh + ':' + mm
    };
  } finally {
    clearTimeout(timer);
  }
}

async function getWeather(county) {
  const hit = cache.get(county);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.d;
  const d = await fetchWeather(county);
  cache.set(county, { t: Date.now(), d });
  return d;
}

/* 七县天气 */
router.get('/', async (req, res) => {
  try {
    const names = Object.keys(COUNTY_XY);
    const list = await Promise.all(
      names.map(async (name) => {
        try {
          return await getWeather(name);
        } catch (_) {
          return { county: name, error: '天气获取失败' };
        }
      })
    );
    res.json({ code: 0, data: list });
  } catch (e) {
    res.status(503).json({ code: 503, message: '天气服务暂时不可用' });
  }
});

/* 单县天气 */
router.get('/:county', async (req, res) => {
  const county = decodeURIComponent(req.params.county);
  if (!(county in COUNTY_XY)) {
    return res.status(404).json({ code: 404, message: '未知县区：' + county });
  }
  try {
    res.json({ code: 0, data: await getWeather(county) });
  } catch (e) {
    res.status(503).json({ code: 503, message: county + ' 天气获取失败' });
  }
});

module.exports = router;
