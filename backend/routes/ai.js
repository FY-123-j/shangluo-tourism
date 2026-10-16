/**
 * AI 问答接口
 *   POST /api/ai/chat   { message: "问题" }
 * 成功：{ code:0, data:{ answer, source } }
 * 失败：HTTP 503，前端据此改用本地语料兜底
 */
const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

router.post('/chat', async (req, res) => {
  const message = (req.body && req.body.message ? String(req.body.message) : '').trim();
  if (!message) {
    return res.status(400).json({ code: 400, message: 'message 不能为空' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ code: 400, message: '问题过长（上限1000字）' });
  }

  try {
    const data = await aiService.chat(message);
    res.json({ code: 0, data });
  } catch (e) {
    res.status(503).json({ code: 503, message: 'AI 服务暂时不可用' });
  }
});

/**
 * 行程生成接口
 *   POST /api/ai/itinerary
 *   { days:2, crowd:"康养慢行", origin:"西安", preference:"" }
 * 成功：{ code:0, data:{ itinerary, source } }
 * 失败：HTTP 503
 */
router.post('/itinerary', async (req, res) => {
  const b = req.body || {};
  const days = Number(b.days);
  if (!days || days < 1 || days > 7) {
    return res.status(400).json({ code: 400, message: '天数需在 1~7 之间' });
  }
  const t0 = Date.now();
  console.log(`[行程] 收到请求 days=${days} crowd=${b.crowd} origin=${b.origin}`);
  try {
    const data = await aiService.generateItinerary({
      days,
      crowd: b.crowd,
      origin: b.origin,
      preference: b.preference
    });
    console.log(`[行程] 生成成功，耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    res.json({ code: 0, data });
  } catch (e) {
    console.log(`[行程] 失败，耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${e.message}`);
    res.status(503).json({ code: 503, message: 'AI 行程生成失败，请稍后重试' });
  }
});

module.exports = router;
