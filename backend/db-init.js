/**
 * 数据库建表与数据导入
 *   - ensureDatabase()：启动时调用，表不存在则建、为空则导入（本地/云端首次启动均适用）
 *   - resetDatabase()：删表重建（开发期手动重置用）
 * 数据为静态内容（content.json / news-body.json），云端文件系统重置后会自动重建。
 */
const fs = require('fs');
const path = require('path');
const db = require('./db');

const DATA_DIR = path.join(__dirname, 'data');

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      tag        TEXT,
      title      TEXT,
      date       TEXT,
      category   TEXT,
      source     TEXT,
      summary    TEXT,
      url        TEXT,
      body       TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS content (
      key        TEXT PRIMARY KEY,
      value      TEXT
    );
  `);
}

function seed() {
  const content = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'content.json'), 'utf8'));
  const newsBody = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'news-body.json'), 'utf8'));

  const insertNews = db.prepare(`
    INSERT INTO news (tag, title, date, category, source, summary, url, body)
    VALUES (@tag, @title, @date, @category, @source, @summary, @url, @body)
  `);
  const newsRows = content.NEWS.map((n) => {
    const e = newsBody[n.h] || {};
    return {
      tag: n.t,
      title: n.h,
      date: n.d,
      category: n.c,
      source: e.source || '商洛市文化和旅游局',
      summary: e.summary || n.h,
      url: n.url || '',
      body: e.body || n.h
    };
  });

  const insertContent = db.prepare('INSERT INTO content (key, value) VALUES (?, ?)');

  db.transaction(() => {
    newsRows.forEach((r) => insertNews.run(r));
    Object.keys(content).forEach((key) => {
      if (key === 'NEWS') return;
      insertContent.run(key, JSON.stringify(content[key]));
    });
  })();
}

function ensureDatabase() {
  createTables();
  const newsCount = db.prepare('SELECT COUNT(*) AS n FROM news').get().n;
  const contentCount = db.prepare('SELECT COUNT(*) AS n FROM content').get().n;
  if (newsCount === 0 || contentCount === 0) seed();
}

function resetDatabase() {
  db.exec('DROP TABLE IF EXISTS news; DROP TABLE IF EXISTS content;');
  createTables();
  seed();
}

module.exports = { ensureDatabase, resetDatabase };
