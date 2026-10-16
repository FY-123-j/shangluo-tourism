/**
 * 非遗商洛：按县区筛选 + 详情弹窗
 */
import { $, esc } from '../utils.js';
import { c } from '../store.js';
import { showModal } from './modal.js';
import { watchReveals } from '../effects.js';

let region = '全部';

function openHeritage(h) {
  if (!h) return;
  const imageHtml = h.img
    ? `<img src="${h.img}" alt="${esc(h.name)}">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,#4a2c1a,#c9a24b 70%,#8a6d2f);color:rgba(255,255,255,.95);font-family:'Noto Serif SC',serif;font-size:40px;font-weight:900;letter-spacing:.16em;text-align:center;padding:0 20px">${esc(h.name.slice(0, 6))}</div>`;

  const bodyHtml = `
    <p class="mtag">${esc(h.region)} · ${esc(h.type)}</p>
    <h3>${esc(h.name)}</h3>
    <div class="msub">非物质文化遗产项目 · 活态传承</div>
    <p class="mdesc">${esc(h.desc)}</p>
    <div class="mbtns" style="justify-content:flex-start">
      <a class="go-nav" href="#/ai" data-close="1" style="flex:0 0 auto;padding:11px 22px">问问 AI 更多非遗</a>
    </div>`;

  showModal(imageHtml, bodyHtml);
  document.querySelector('#mBody [data-close="1"]').addEventListener('click', (e) => {
    e.preventDefault();
    import('./modal.js').then((m) => m.closeModal());
  });
}

function renderGrid() {
  const HERITAGE = c('HERITAGE');
  const list = region === '全部' ? HERITAGE : HERITAGE.filter((h) => h.region === region);
  const grid = $('#fyGrid');
  grid.innerHTML = list
    .map(
      (h, i) => `
    <div class="item-card reveal" data-i="${i}">
      <div class="ph">${h.img ? `<img src="${h.img}" alt="${esc(h.name)}" loading="lazy">` : ''}</div>
      <div class="fd">
        <div class="ic-t">${esc(h.region)} · ${esc(h.type)}</div>
        <h4>${esc(h.name)}</h4>
        <p>${esc(h.desc)}</p>
        <span class="more">查看详情<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </div>
    </div>`
    )
    .join('');
  grid.querySelectorAll('.item-card').forEach((card) =>
    card.addEventListener('click', () => openHeritage(list[+card.dataset.i]))
  );
  watchReveals(grid);
}

export function render() {
  const COUNTIES = c('COUNTIES');
  const tabs = $('#fyTabs');
  if (!tabs.children.length) {
    const regions = ['全部', '全市', ...COUNTIES];
    tabs.innerHTML = regions
      .map(
        (r) =>
          `<button class="filter-tab ${r === region ? 'active' : ''}" data-r="${esc(r)}">${esc(r)}</button>`
      )
      .join('');
    tabs.querySelectorAll('.filter-tab').forEach((b) =>
      b.addEventListener('click', () => {
        region = b.dataset.r;
        tabs.querySelectorAll('.filter-tab').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        renderGrid();
      })
    );
  }
  renderGrid();
}
