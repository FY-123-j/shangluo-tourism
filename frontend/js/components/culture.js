/**
 * 人文商洛：特色名片 + 时间线 + 故事网格 + 故事弹窗
 */
import { $, esc, makeImgUrl } from '../utils.js';
import { c } from '../store.js';
import { showModal } from './modal.js';

function openStory(i) {
  const s = c('STORIES')[i];
  if (!s) return;

  const imageHtml = s.img
    ? `<img src="${s.img}" alt="${esc(s.name)}">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,#0d3b22,#2f8f6b 55%,#c9a24b);color:rgba(255,255,255,.95);font-family:'Noto Serif SC',serif;font-size:42px;font-weight:900;letter-spacing:.18em;text-align:center;padding:0 20px">${esc(s.name)}</div>`;

  const bodyHtml = `
    <p class="mtag">${esc(s.era)} · ${esc(s.theme)}</p>
    <h3>${esc(s.name)}</h3>
    <div class="msub">${esc(s.theme)}</div>
    <p class="mdesc">${esc(s.text)}</p>
    <div class="mbtns" style="justify-content:flex-start">
      <a class="go-nav" href="#/scenery" data-close="1" style="flex:0 0 auto;padding:11px 22px">去山水商洛看看</a>
    </div>`;

  showModal(imageHtml, bodyHtml);
  const closeBtn = document.querySelector('#mBody [data-close="1"]');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      import('./modal.js').then((m) => m.closeModal());
    });
  }
}

export function render() {
  const STORIES = c('STORIES');
  const imgUrl = makeImgUrl(c('IMG'));

  /* 特色名片 */
  const feat = $('#cultureFeature');
  if (!feat.children.length) {
    feat.innerHTML = `
      <img src="${imgUrl('dihua')}" alt="棣花古镇门楼">
      <div class="fd">
        <p class="fk">文学故乡 · 名人名片</p>
        <h3>贾平凹与棣花古镇</h3>
        <p>棣花古镇是作家贾平凹的故乡，《秦腔》《主角》里的清风街、荷塘与老街都能在此寻到原型。文学与山水在此互为映照，是商洛最具辨识度的人文名片。</p>
      </div>`;
  }

  /* 时间线 */
  const tl = $('#cultureTimeline');
  if (!tl.children.length) {
    const eras = [
      ['旧石器时代', '洛南猿人遗址'],
      ['上古传说', '仓颉造字'],
      ['春秋战国', '商於古道'],
      ['明清', '商埠古镇'],
      ['当代', '秦岭博物馆']
    ];
    tl.innerHTML = eras
      .map((e) => {
        const s = STORIES.find((x) => x.name === e[1]) || STORIES.find((x) => x.era === e[0]);
        return `
        <div class="tl-node"><span class="t">${esc(e[0])}</span></div>
        <div class="tl-rail"><span class="p"></span></div>
        <div class="tl-body"><h4>${esc(e[1])}</h4><p>${esc(s ? s.text.slice(0, 60) + '…' : '')}</p></div>`;
      })
      .join('');
  }

  /* 故事网格 */
  const grid = $('#storyGrid');
  if (!grid.children.length) {
    grid.innerHTML = STORIES.map(
      (s, i) => `
      <article class="story-card" data-story="${i}">
        <div class="sc-ph">${s.img ? `<img src="${s.img}" alt="${esc(s.name)}">` : ''}</div>
        <div class="sc-t">${esc(s.theme)}</div>
        <h4>${esc(s.name)}</h4>
        <p>${esc(s.text.slice(0, 72))}…</p>
        <span class="more">阅读全文<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
      </article>`
    ).join('');
    grid.querySelectorAll('.story-card').forEach((card) =>
      card.addEventListener('click', () => openStory(+card.dataset.story))
    );
  }
}
