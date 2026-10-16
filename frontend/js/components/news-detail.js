/**
 * 新闻详情弹窗（权威发布）
 * 首页热点胶囊、文旅动态新闻列表点击后调用 openNews(id)
 */
import { $, esc, toast } from '../utils.js';
import { showModal } from './modal.js';
import { getNewsDetail } from '../api.js';

const govIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6M9 12h.01M15 12h.01"/></svg>';
const calIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
const srcIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M4 21V5a2 2 0 0 1 2-2h7l5 5v13M14 3v5h5"/></svg>';

export async function openNews(id) {
  let n;
  try {
    n = await getNewsDetail(id);
  } catch (e) {
    toast('新闻详情加载失败，请稍后重试');
    return;
  }

  /* 左侧视觉块：权威发布徽章 */
  const imageHtml = `
    <div class="news-badge">
      <div class="nb-icon">${govIcon}</div>
      <div class="nb-t">权威发布</div>
      <div class="nb-c">${esc(n.tag)}</div>
      <div class="nb-line"></div>
      <div class="nb-note">内容来自官方<br>公开渠道</div>
    </div>`;

  /* 正文：标签 + 标题 + 元信息 + 段落 + 原文链接 */
  const paras = n.body
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');

  const bodyHtml = `
    <div class="news-detail">
      <span class="nd-tag">${esc(n.tag)}</span>
      <h3>${esc(n.title)}</h3>
      <div class="nd-meta">
        <span>${calIcon}<b>${esc(n.date)}</b></span>
        <span>${srcIcon}<b>${esc(n.source)}</b></span>
      </div>
      <div class="nd-body">${paras}</div>
      ${
        n.url
          ? `<a class="nd-link" href="${esc(n.url)}" target="_blank" rel="noopener">查看官方原文
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg></a>`
          : '<p class="nd-nourl">该条暂无外部链接，信息来自官方公开渠道。</p>'
      }
    </div>`;

  showModal(imageHtml, bodyHtml);
}

/* 便捷：给一批带 data-news-id 的元素统一绑定点击 */
export function bindNewsClicks(container) {
  const root = container || document;
  root.querySelectorAll('[data-news-id]').forEach((el) => {
    if (el._newsBound) return;
    el._newsBound = true;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openNews(el.dataset.newsId);
    });
  });
}
