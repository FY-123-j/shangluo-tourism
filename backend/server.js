/**
 * 商洛文旅数字平台 · 后端服务入口
 *
 * 功能：
 *   1. 提供 API：内容数据 / AI 问答代理 / 天气代理
 *   2. 同时托管前端静态文件（同源部署，启动后直接访问 http://localhost:3000）
 *
 * 启动：npm start（需先 npm install）
 */
const express = require('express');
const fs = require('fs');
const path = require('path');

/* 本地开发：存在 .env 则加载（云端用平台注入的环境变量，无需 .env 文件） */
(function loadLocalEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const eq = line.indexOf('=');
      if (eq === -1) return;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    });
  } catch (_) {}
})();

/* 启动时确保数据库就绪（首次启动 / 云端文件系统重置后自动建表导入） */
require('./db-init').ensureDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

/* ===== 跨域配置（前后端分开部署时使用，同源不影响） ===== */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ===== 请求解析 ===== */
app.use(express.json({ limit: '64kb' }));

/* ===== API 路由 ===== */
app.get('/api/health', (req, res) => {
  res.json({ code: 0, status: 'ok', service: 'shangluo-tourism-backend' });
});
app.use('/api/content', require('./routes/content'));
app.use('/api/news', require('./routes/news'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/weather', require('./routes/weather'));

/* ===== 兜底：未知 API 路径返回 JSON 404 ===== */
app.use('/api', (req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

/* ===== 托管前端静态文件 ===== */
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

/* 非 API 请求统一返回 index.html（支持前端 hash 路由，此处仅做兜底） */
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

/* ===== 统一错误处理 ===== */
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 400, message: '请求体不是合法的 JSON' });
  }
  console.error(err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('==================================================');
  console.log('  商洛文旅数字平台已启动');
  console.log(`  本地访问：http://localhost:${PORT}`);
  console.log(`  局域网访问：http://${localIP}:${PORT}`);
  console.log(`  API 健康检查：http://localhost:${PORT}/api/health`);
  console.log('==================================================');
});
