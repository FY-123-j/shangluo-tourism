/**
 * 康养商洛：数据卡 + 五大板块 + 目的地 + 四季 + 板块弹窗
 */
import { $, esc } from '../utils.js';
import { c } from '../store.js';
import { showModal } from './modal.js';

function openWellness(b) {
  if (!b) return;
  const imageHtml = b.img
    ? `<img src="${b.img}" alt="${esc(b.t)}">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,#14532d,#2f8f6b 60%,#c9a24b);color:rgba(255,255,255,.97);font-family:'Noto Serif SC',serif;font-size:38px;font-weight:900;letter-spacing:.16em">${esc(b.t.slice(0, 6))}</div>`;

  const bodyHtml = `
    <p class="mtag">康养商洛 · ${esc(b.st)}</p>
    <h3>${esc(b.t)}</h3>
    <p class="mdesc">${esc(b.p)}</p>
    <div class="mbtns" style="justify-content:flex-start">
      <a class="go-nav" href="#/wellness" data-close="1" style="flex:0 0 auto;padding:11px 22px">返回康养板块</a>
    </div>`;

  showModal(imageHtml, bodyHtml);
  document.querySelector('#mBody [data-close="1"]').addEventListener('click', (e) => {
    e.preventDefault();
    import('./modal.js').then((m) => m.closeModal());
  });
}

export function render() {
  const WN_CARDS = c('WN_CARDS');
  const WN_BLOCKS = c('WN_BLOCKS');
  const WN_DESTS = c('WN_DESTS');
  const WN_SEASONS = c('WN_SEASONS');

  const cards = $('#wnCards');
  if (!cards.children.length) {
    cards.innerHTML = WN_CARDS.map(
      (card) => `
      <div class="wn-card"><div class="big num">${esc(card.v)}</div><h4>${esc(card.t)}</h4><p>${esc(card.p)}</p></div>`
    ).join('');
  }

  const blocks = $('#wnBlocks');
  if (!blocks.children.length) {
    blocks.innerHTML = WN_BLOCKS.map(
      (b, i) => `
      <div class="wb-card" data-i="${i}">
        <h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5z"/></svg>${esc(b.t)}
        <span style="font-size:12px;color:var(--gold);letter-spacing:.08em">${esc(b.st)}</span></h4>
        <p>${esc(b.p)}</p>
        <span class="more">查看详情<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </div>`
    ).join('');
    blocks.querySelectorAll('.wb-card').forEach((card) =>
      card.addEventListener('click', () => openWellness(WN_BLOCKS[+card.dataset.i]))
    );
  }

  const dests = $('#wnDests');
  if (!dests.children.length) {
    dests.innerHTML = WN_DESTS.map(
      (d) => `<div class="wd"><b>${esc(d.n)}</b><span>${esc(d.d)}</span></div>`
    ).join('');
  }

  const seasons = $('#wnSeasons');
  if (!seasons.children.length) {
    seasons.innerHTML = WN_SEASONS.map(
      (s) => `<div class="ws"><div class="wsm">${esc(s.s)}</div><p>${esc(s.p)}</p></div>`
    ).join('');
  }
}
