/**
 * 文旅动态：新闻列表 + 节庆日历 + 媒体矩阵
 */
import { $, esc, toast } from '../utils.js';
import { c } from '../store.js';
import { bindNewsClicks } from './news-detail.js';

const ICONS = {
  site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
  wechat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-9 8.35 8.5 8.5 0 0 1-3.8-.85L3 20l1.1-4.3A8.38 8.38 0 1 1 21 11.5z"/><path d="M8.5 9.5h.01M12.5 9.5h.01M9.2 14.2c2 .7 3.6.5 5-.2"/></svg>',
  douyin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a8 8 0 0 0 6 3"/></svg>',
  gov: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6"/></svg>'
};

export function render() {
  const NEWS = c('NEWS');
  const CALENDAR = c('CALENDAR');
  const MEDIA = c('MEDIA');

  /* 新闻列表 */
  const news = $('#newsList');
  if (!news.children.length) {
    news.innerHTML = NEWS.map(
      (n) => `
      <div class="news-item" data-news-id="${n.id}">
        <div class="nh"><span class="hot">${esc(n.t)}</span><span class="tag">${esc(n.c)}</span><span class="date">${esc(n.d)}</span></div>
        <h5>${esc(n.h)}</h5><p>${esc(n.summary || n.h)}</p>
      </div>`
    ).join('');
    bindNewsClicks(news);
  }

  /* 节庆日历 */
  const cal = $('#calList');
  if (!cal.children.length) {
    cal.innerHTML = CALENDAR.map(
      (item) => `
      <div class="cal-item">
        <div class="d"><b>${esc(item.d)}</b><span>${esc(item.s)}</span></div>
        <div class="cd"><b>${esc(item.t)}</b><p>${esc(item.p)}</p></div>
      </div>`
    ).join('');
  }

  /* 媒体矩阵 */
  const media = $('#mediaGrid');
  if (!media.children.length) {
    media.innerHTML = MEDIA.map((m) => {
      const hasUrl = !!m.url;
      return `
      <a class="media-card" ${hasUrl ? `href="${esc(m.url)}" target="_blank" rel="noopener"` : 'data-nourl="1"'}>
        <div class="mi">${ICONS[m.icon] || ''}</div>
        <b>${esc(m.n)}</b><p>${esc(m.d)}</p>
      </a>`;
    }).join('');
    media.querySelectorAll('[data-nourl]').forEach((el) =>
      el.addEventListener('click', (e) => {
        e.preventDefault();
        toast('打开微信/抖音搜索「商洛文旅」，每日资讯与购票一站直达');
      })
    );
  }
}
