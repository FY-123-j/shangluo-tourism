/**
 * 前端入口
 * 启动流程：加载内容数据 + 地图数据 → 初始化路由/动效/弹窗 → 渲染当前视图
 */
import { state, c } from './store.js';
import { getContent, getGeo } from './api.js';
import { initRouter, setViewHook, renderRoute } from './router.js';
import { initModalEvents } from './components/modal.js';
import { initHeroSlides, initFog, watchReveals } from './effects.js';
import { $ } from './utils.js';

import * as home from './components/home.js';
import * as smart from './components/smart.js';
import * as scenery from './components/scenery.js';
import * as culture from './components/culture.js';
import * as intangible from './components/intangible.js';
import * as food from './components/food.js';
import * as wellness from './components/wellness.js';
import * as events from './components/events.js';
import * as ai from './components/ai.js';

/* 视图 → 渲染函数 */
const viewRenderers = {
  home: home.render,
  smart: smart.render,
  scenery: scenery.render,
  culture: culture.render,
  intangible: intangible.render,
  food: food.render,
  wellness: wellness.render,
  events: events.render,
  ai: ai.render
};

/* 数据加载失败时的提示 */
function showLoadError() {
  const box = document.createElement('div');
  box.style.cssText =
    'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;' +
    'background:#f6f3ea;color:#10281d;text-align:center;padding:32px;font-family:"Noto Sans SC",sans-serif';
  box.innerHTML =
    '<div><h2 style="font-family:serif;margin-bottom:12px">数据加载失败</h2>' +
    '<p style="color:#4a5f52;line-height:1.9">请确认后端服务已启动（在 backend 目录执行 <b>npm install</b> 后 <b>npm start</b>），<br>' +
    '然后访问 http://localhost:3000 并刷新页面。</p></div>';
  document.body.appendChild(box);
}

/* 数据就绪后启动应用 */
function startApp() {
  /* 首屏 Hero 轮播图（IMG 中的 hero1-5） */
  const IMG = state.content.IMG;
  const heroImgs = ['hero1', 'hero2', 'hero3', 'hero4', 'hero5']
    .map((k) => IMG[k])
    .filter(Boolean);
  initHeroSlides(heroImgs);
  initFog();

  initModalEvents();
  initRouter();

  /* 动态更新 index.html 中的统计数字 */
  const summaryEl = $('#ai-stats-summary');
  if (summaryEl) {
    const s = c('SIGHTS') || [];
    const st = c('STORIES') || [];
    const h = c('HERITAGE') || [];
    const f = c('FOODS') || [];
    summaryEl.textContent = `${s.length} 处景区、${st.length} 段人文故事、${h.length} 项非遗、${f.length} 道美食与康养资源全量语料，常见问题秒回、附信息来源。`;
  }

  /* 视图切换时调用对应渲染函数（opts 用于 goto 跳转带参数） */
  setViewHook((view, opts) => {
    const renderer = viewRenderers[view];
    if (renderer) renderer(opts);
    watchReveals(document);
  });

  renderRoute();
}

async function bootstrap() {
  try {
    state.content = await getContent();
  } catch (e) {
    showLoadError();
    return;
  }
  /* 地图数据失败不阻塞（进入山水页时地图区域会显示失败提示） */
  getGeo()
    .then((geo) => {
      state.geo = geo;
    })
    .catch(() => {
      state.geo = null;
    })
    .finally(() => {
      state.loaded = true;
      startApp();
    });
}

bootstrap();
