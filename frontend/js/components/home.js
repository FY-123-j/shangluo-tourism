/**
 * 首页：板块导航卡片 + 热点标签
 */
import { $, esc, makeImgUrl } from '../utils.js';
import { c } from '../store.js';
import { goto } from '../router.js';
import { watchReveals } from '../effects.js';
import { bindNewsClicks } from './news-detail.js';

export function render() {
  const IMG = c('IMG');
  const NEWS = c('NEWS');
  const imgUrl = makeImgUrl(IMG);

  const hub = $('#hubGrid');
  if (!hub.children.length) {
    const SIGHTS = c('SIGHTS') || [];
    const STORIES = c('STORIES') || [];
    const HERITAGE = c('HERITAGE') || [];
    const FOODS = c('FOODS') || [];

    const items = [
      { go: 'scenery', img: 'hero2', t: '山水商洛', p: `一图读懂七县山水，${SIGHTS.length} 处景区导航 + 门票预订` },
      { go: 'culture', img: 'dihua', t: '人文商洛', p: `秦岭故事：${STORIES.length} 段人文故事读懂商洛` },
      { go: 'intangible', img: 'huagu2', t: '非遗商洛', p: `${HERITAGE.length} 项非遗按县区浏览，看见活态传承` },
      { go: 'food', img: 'dahuicai', t: '舌尖商洛', p: `${FOODS.length} 道秦头楚尾滋味，按县区寻味` },
      { go: 'wellness', img: 'niubeiliang', t: '康养商洛', p: '22℃气候康养之都，五大康养资源板块' },
      { go: 'events', img: 'tayunshan', t: '文旅动态', p: '官方新闻、节庆日历、媒体矩阵' },
      { go: 'ai', img: 'hero3', t: 'AI 助手', p: '全量知识问答 + 豆包大模型' },
      { go: 'smart', img: 'hero4', t: '智能推荐', p: '循四季、看人群、追热点，千人千面' }
    ];
    hub.innerHTML = items
      .map(
        (it) => `
      <a class="hub-card reveal" data-go="${it.go}">
        <div class="ph"><img src="${imgUrl(it.img)}" alt="${esc(it.t)}" loading="lazy"></div>
        <div class="bd"><h3>${esc(it.t)}</h3><p>${esc(it.p)}</p>
        <span class="more">进入板块<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
      </a>`
      )
      .join('');
    hub.querySelectorAll('a[data-go]').forEach((a) =>
      a.addEventListener('click', (e) => {
        e.preventDefault();
        goto(a.dataset.go);
      })
    );
    watchReveals(hub);
  }

  const tape = $('#hotTape');
  if (!tape.children.length) {
    tape.innerHTML = NEWS.slice(0, 5)
      .map(
        (n) =>
          `<button class="hot-chip" data-news-id="${n.id}"><span class="hd">${esc(n.t)}</span>${esc(n.h.slice(0, 18))}…</button>`
      )
      .join('');
    bindNewsClicks(tape);
  }
}
