/**
 * 舌尖商洛：按县区筛选 + 详情弹窗
 */
import { $, esc } from '../utils.js';
import { c } from '../store.js';
import { showModal } from './modal.js';
import { watchReveals } from '../effects.js';

let region = '全部';

function openFood(f) {
  if (!f) return;
  const imageHtml = f.img
    ? `<img src="${f.img}" alt="${esc(f.name)}">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,#7c2d12,#c2410c 60%,#f59e0b);color:rgba(255,255,255,.97);font-family:'Noto Serif SC',serif;font-size:40px;font-weight:900;letter-spacing:.14em;text-align:center;padding:0 20px">${esc(f.name.slice(0, 5))}</div>`;

  const bodyHtml = `
    <p class="mtag">${esc(f.region)} · 秦头楚尾风味</p>
    <h3>${esc(f.name)}</h3>
    <div class="msub">${f.spec ? '商洛特色产品' : '商洛地方美食'}</div>
    <p class="mdesc">${esc(f.desc)}</p>
    <div class="mbtns" style="justify-content:flex-start">
      <a class="go-nav" href="#/ai" data-close="1" style="flex:0 0 auto;padding:11px 22px">问问 AI 哪里能吃到</a>
    </div>`;

  showModal(imageHtml, bodyHtml);
  document.querySelector('#mBody [data-close="1"]').addEventListener('click', (e) => {
    e.preventDefault();
    import('./modal.js').then((m) => m.closeModal());
  });
}

function renderGrid() {
  const FOODS = c('FOODS');
  const list = region === '全部' ? FOODS : FOODS.filter((f) => f.region === region);
  const grid = $('#foodGrid');
  grid.innerHTML = list
    .map(
      (f, i) => `
    <div class="food-card3 reveal" data-i="${i}">
      <div class="ph">${f.img ? `<img src="${f.img}" alt="${esc(f.name)}" loading="lazy">` : ''}</div>
      <div class="fd">
        <h4>${esc(f.name)}</h4><p>${esc(f.desc)}</p>${f.spec ? '<span class="spec">特产</span>' : ''}
        <span class="more">查看详情<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </div>
    </div>`
    )
    .join('');
  grid.querySelectorAll('.food-card3').forEach((card) =>
    card.addEventListener('click', () => openFood(list[+card.dataset.i]))
  );
  watchReveals(grid);
}

export function render() {
  const COUNTIES = c('COUNTIES');
  const tabs = $('#foodTabs');
  if (!tabs.children.length) {
    const regions = ['全部', ...COUNTIES];
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
