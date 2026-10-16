/**
 * 手动重置数据库（删表重建并重新导入）
 * 用法：npm run init-db 或 node scripts/init-db.js
 */
const path = require('path');
const db = require(path.join(__dirname, '..', 'db'));
const { resetDatabase } = require(path.join(__dirname, '..', 'db-init'));

resetDatabase();
console.log('数据库已重置：');
console.log('  news：', db.prepare('SELECT COUNT(*) AS n FROM news').get().n, '条');
console.log('  content：', db.prepare('SELECT COUNT(*) AS n FROM content').get().n, '项');
