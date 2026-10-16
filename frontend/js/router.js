/**
 * 前端 Hash 路由
 *   #/home  #/smart  #/scenery ...
 * 只负责：视图切换、导航高亮、goto 跳转；
 * 各视图的具体渲染由 main.js 注册的 viewHook 完成。
 */
import { $, $$, reduceMotion } from './utils.js';

export const VIEWS = [
  'home', 'smart', 'scenery', 'culture',
  'intangible', 'food', 'wellness', 'events', 'ai'
];

const navLinks = () => $$('#nav a');

export function currentView() {
  const h = (location.hash || '#/home').replace('#/', '');
  return VIEWS.includes(h) ? h : 'home';
}

let pendingOpts = null;
let viewHook = null;

/* 注册视图切换回调（main.js 中注册） */
export function setViewHook(fn) {
  viewHook = fn;
}

/* 取出并清除待处理的跳转参数 */
export function consumePendingOpts() {
  const o = pendingOpts;
  pendingOpts = null;
  return o;
}

export function goto(view, opts) {
  if (!VIEWS.includes(view)) return;
  pendingOpts = opts || null;
  if (currentView() === view) {
    renderRoute(); // 已在目标视图，直接执行一次（处理 opts）
  } else {
    location.hash = '#/' + view;
  }
  const nav = $('#nav');
  if (nav) nav.classList.remove('open');
}

export function renderRoute() {
  const v = currentView();
  const loader = $('#routeLoader');

  /* 开始加载状态 */
  if (loader) {
    loader.classList.remove('done');
    loader.classList.add('loading');
  }

  /* 延迟渲染以展示进度条感 */
  setTimeout(() => {
    VIEWS.forEach((id) => {
      const el = $('#view-' + id);
      if (el) el.classList.toggle('active', id === v);
    });
    navLinks().forEach((a) => a.classList.toggle('active', a.dataset.view === v));
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

    if (viewHook) viewHook(v, consumePendingOpts());

    /* 结束加载状态 */
    if (loader) {
      loader.classList.remove('loading');
      loader.classList.add('done');
      setTimeout(() => loader.classList.remove('done'), 400);
    }
  }, 50);
}

/* 路由与导航事件绑定（执行一次） */
export function initRouter() {
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('DOMContentLoaded', renderRoute);

  $('#burger').addEventListener('click', () => $('#nav').classList.toggle('open'));
  navLinks().forEach((a) =>
    a.addEventListener('click', () => $('#nav').classList.remove('open'))
  );
  $$('a[data-go]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      goto(a.dataset.go);
    })
  );
}
