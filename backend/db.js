/**
 * SQLite 数据库连接（better-sqlite3）
 * 数据库文件：backend/data/shangluo.db
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'shangluo.db'));

/* WAL 模式，读写并发更好；开启外键约束 */
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
