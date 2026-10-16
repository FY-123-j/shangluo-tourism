/**
 * 内容数据接口
 * 数据来源已由 content.json 迁移到 SQLite（shangluo.db）：
 *   - 新闻存 news 表（含权威正文）
 *   - 其余数据（景区/非遗/美食/故事等）存 content 表（JSON）
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

/* news 表行 → 前端使用的新闻对象 */
function rowToNews(r) {
  return {
    id: r.id,
    t: r.tag,        // 标签
    h: r.title,      // 标题
    d: r.date,       // 日期
    c: r.category,   // 分类
    source: r.source,
    summary: r.summary,
    url: r.url,
    body: r.body
  };
}

/* 聚合全部内容（每次请求实时读库，数据更新即时生效） */
function getAllContent() {
  const data = {};
  db.prepare('SELECT key, value FROM content').all().forEach((row) => {
    data[row.key] = JSON.parse(row.value);
  });
  data.NEWS = db.prepare('SELECT * FROM news ORDER BY id').all().map(rowToNews);
  return data;
}

/* GET /api/content —— 全部内容 */
router.get('/', (req, res) => {
  res.json({ code: 0, data: getAllContent() });
});

/* GET /api/content/:type —— 按类型取，例如 /api/content/SIGHTS */
router.get('/:type', (req, res) => {
  const type = req.params.type;
  if (type === 'NEWS') {
    return res.json({
      code: 0,
      data: db.prepare('SELECT * FROM news ORDER BY id').all().map(rowToNews)
    });
  }
  const row = db.prepare('SELECT value FROM content WHERE key = ?').get(type);
  if (!row) {
    return res.status(404).json({ code: 404, message: '不存在的数据类型：' + type });
  }
  res.json({ code: 0, data: JSON.parse(row.value) });
});

module.exports = router;
module.exports.rowToNews = rowToNews;
