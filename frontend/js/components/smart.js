/**
 * 智能推荐：循四季 / 看人群 / 追热点
 */
import { $, $$, esc, makeImgUrl } from '../utils.js';
import { c } from '../store.js';
import { goto } from '../router.js';

let tabsBound = false;

function renderGrid(k) {
  const REC = c('REC');
  const NEWS = c('NEWS');
  const imgUrl = makeImgUrl(c('IMG'));
  const box = $('#rec-' + k);
  if (box.children.length) return;

  /* 追热点：顶部放“近期热点速递” */
  let hotHead = '';
  if (k === 'hot') {
    hotHead = `
      <div class="hot-feed">
        <div class="hf-t"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>近期热点 · 推荐依据</div>
        <div class="hf-list">
          ${NEWS.slice(0, 4)
            .map(
              (n) =>
                `<a class="hf-item" data-url="${esc(n.url)}"><span class="hf-d">${esc(n.d)}</span><span class="hf-h">${esc(n.h)}</span></a>`
            )
            .join('')}
        </div>
      </div>`;
  }

  box.innerHTML =
    hotHead +
    REC[k]
      .map(
        (r) => `
      <article class="rec-card">
        <div class="ph"><img src="${imgUrl(r.img)}" alt="${esc(r.t)}" loading="lazy"><span class="tag">${esc(r.tag)}</span></div>
        <div class="bd"><h3>${esc(r.t)}</h3><p>${esc(r.p)}</p>
        <span class="more">查看详情<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></div>
      </article>`
      )
      .join('');

  box.querySelectorAll('.rec-card').forEach((card, i) =>
    card.addEventListener('click', () => goto(REC[k][i].go))
  );
  box.querySelectorAll('.hf-item').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const url = a.dataset.url;
      if (url) window.open(url, '_blank');
      else goto('events');
    })
  );
}

export function render() {
  if (!tabsBound) {
    $$('.rec-tab').forEach((t) =>
      t.addEventListener('click', () => {
        $$('.rec-tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        ['season', 'crowd', 'hot'].forEach((k) => ($('#rec-' + k).hidden = true));
        const k = t.dataset.tab;
        $('#rec-' + k).hidden = false;
        renderGrid(k);
      })
    );
    tabsBound = true;
  }
  ['season', 'crowd', 'hot'].forEach(renderGrid);
}
