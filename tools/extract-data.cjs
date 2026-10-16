/**
 * 数据提取脚本
 * 作用：从旧的单文件 HTML（商洛文旅数字平台）中，把写死在 <script> 里的
 *       地图 GeoJSON、景区/非遗/美食/新闻等数据自动抽出来，生成：
 *         - frontend/assets/data/shangluo.geo.json   （前端地图数据）
 *         - backend/data/content.json                （后端内容数据源）
 *
 * 用法：node tools/extract-data.cjs [原始HTML路径]
 * 不传路径时使用下方默认路径。
 */
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] || 'C:/Users/29906/Documents/Downloads/商洛文旅数字平台 (9).html';
const ROOT = path.resolve(__dirname, '..');

const src = fs.readFileSync(SRC, 'utf8');
const lines = src.split('\n');

/* 按 1 起始行号取片段（与编辑器行号一致） */
function sliceLines(a, b) {
  return lines.slice(a - 1, b).join('\n');
}

/*
 * 原文件中数据声明的行范围（均为纯数据，不含 DOM 操作）：
 *   1064-1317：GEO(地图)、IMG、COUNTIES、SIGHTS、STORIES、HERITAGE、
 *              FOODS、WN_*、NEWS、CALENDAR、MEDIA、REC、ROUTES
 *   1909-1973：CORPUS(本地问答语料)、FALLBACK
 *   2051     ：AI_SYS(AI 系统提示词)
 */
const block1 = sliceLines(1064, 1317);
const block2 = sliceLines(1909, 1973);
const block3 = sliceLines(2051, 2051);

const code = [
  block1,
  block2,
  block3,
  'return { GEO, IMG, TICKET_URL, COUNTIES, COUNTY_TAG, SIGHTS, STORIES, HERITAGE,',
  'FOODS, WN_CARDS, WN_BLOCKS, WN_DESTS, WN_SEASONS, NEWS, CALENDAR, MEDIA,',
  'REC, ROUTES, CORPUS, FALLBACK, AI_SYS };'
].join('\n');

let data;
try {
  data = new Function(code)();
} catch (e) {
  console.error('数据解析失败，请检查原 HTML 行号是否发生变化：', e);
  process.exit(1);
}

/* 1. 地图 GeoJSON → 前端 */
const geoPath = path.join(ROOT, 'frontend/assets/data/shangluo.geo.json');
fs.writeFileSync(geoPath, JSON.stringify(data.GEO));

/* 2. 其余内容数据 → 后端 */
const { GEO, ...content } = data;
const contentPath = path.join(ROOT, 'backend/data/content.json');
fs.writeFileSync(contentPath, JSON.stringify(content, null, 2));

console.log('提取完成：');
console.log('  地图数据 ->', path.relative(ROOT, geoPath),
  '(' + (fs.statSync(geoPath).size / 1024).toFixed(1) + ' KB)');
console.log('  内容数据 ->', path.relative(ROOT, contentPath),
  '(' + (fs.statSync(contentPath).size / 1024).toFixed(1) + ' KB)');
console.log('  景区 %d 处 / 故事 %d 段 / 非遗 %d 项 / 美食 %d 项 / 新闻 %d 条 / 语料 %d 条',
  content.SIGHTS.length, content.STORIES.length, content.HERITAGE.length,
  content.FOODS.length, content.NEWS.length, content.CORPUS.length);
