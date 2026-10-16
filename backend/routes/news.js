/**
 * 新闻接口
 *   GET /api/news        —— 新闻列表（含摘要）
 *   GET /api/news/:id    —— 新闻详情（权威发布正文）
 */
const express = require('express');
const db = require('../db');
const { rowToNews } = require('./content');

const router = express.Router();

/* GET /api/news —— 全部新闻 */
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM news ORDER BY id').all().map(rowToNews);
  res.json({ code: 0, data: rows });
});

/* GET /api/news/:id —— 单条新闻详情 */
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ code: 400, message: '新闻 id 不合法' });
  }
  const row = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  if (!row) {
    return res.status(404).json({ code: 404, message: '新闻不存在' });
  }
  res.json({ code: 0, data: rowToNews(row) });
});

module.exports = router;
