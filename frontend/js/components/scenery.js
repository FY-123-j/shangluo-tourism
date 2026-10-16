/**
 * 山水商洛：ECharts 地图 + 七县天气 + 县区联动 + 景区详情
 */
import { $, $$, esc, makeImgUrl, phHTML, toast } from '../utils.js';
import { state, c } from '../store.js';
import { getAllWeather, getWeather } from '../api.js';
import { showModal, closeModal } from './modal.js';
import { watchReveals } from '../effects.js';

const TICKET_URL = 'https://touch.piao.qunar.com/touch/index_%E5%95%86%E6%B4%9B.html';
const NAV = (lng, lat, name) =>
  `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&callnative=0`;

let curCounty = '商州区';
let mapChart = null;
let weatherInited = false;
let weatherData = {};

/* ---------- 县区天气条 ---------- */
async function initWeather() {
  if (weatherInited) return;
  weatherInited = true;
  const COUNTIES = c('COUNTIES');
  const box = $('#wxItems');
  box.innerHTML = COUNTIES.map(
    (name) =>
      `<button class="wx-item ${name === curCounty ? 'active' : ''}" data-c="${esc(name)}">
        <span>${esc(name)}</span><b class="ld">--</b><span class="w"></span>
      </button>`
  ).join('');
  box.querySelectorAll('.wx-item').forEach((b) =>
    b.addEventListener('click', () => selectCounty(b.dataset.c))
  );

  try {
    const list = await getAllWeather();
    list.forEach((d) => {
      weatherData[d.county] = d;
      const el = box.querySelector(`.wx-item[data-c="${d.county}"]`);
      if (!el) return;
      if (d.error) {
        el.querySelector('.w').textContent = '获取失败';
      } else {
        el.querySelector('.ld').textContent = d.temperature + '℃';
        el.querySelector('.w').textContent = d.weather;
      }
    });
  } catch (_) {
    /* 天气整体失败不阻塞页面 */
  }
  renderCountyPanel();
}

/* ---------- 县区 Tab ---------- */
function renderCountyTabs() {
  const COUNTIES = c('COUNTIES');
  $('#countyTabs').innerHTML = COUNTIES.map(
    (name) =>
      `<button class="county-tab ${name === curCounty ? 'active' : ''}" data-c="${esc(name)}">${esc(name)}</button>`
  ).join('');
  $('#countyTabs').querySelectorAll('.county-tab').forEach((b) =>
    b.addEventListener('click', () => selectCounty(b.dataset.c))
  );
}

/* ---------- 县区面板 ---------- */
function renderCountyPanel() {
  const SIGHTS = c('SIGHTS');
  const COUNTY_TAG = c('COUNTY_TAG');
  const list = SIGHTS.filter((s) => s.county === curCounty);

  $('#countyPanel').innerHTML = `
    <div class="wx-card" id="wxCard"><span style="opacity:.8">正在获取 ${esc(curCounty)} 实时天气…</span></div>
    <div class="cp-head">
      <div class="cn">${esc(curCounty)} <span style="font-size:12px;color:#8aa093;letter-spacing:.2em">· ${esc(COUNTY_TAG[curCounty] || '')}</span></div>
      <div class="cd">${esc(curCounty)}共有 ${list.length} 处主要景区景点，点击景点查看详情、交通与门票。</div>
    </div>
    <div class="cp-list">
      ${list
        .slice(0, 4)
        .map(
          (s) => `
        <div class="cp-item" data-sight="${esc(s.name)}">
          <span class="dot"></span>
          <div><div class="nm">${esc(s.name)}${s.level ? '<span class="lvl">' + esc(s.level) + '</span>' : ''}</div>
          <div class="ds">${s.free ? '免费开放' : esc(s.price || '收费景区')}</div></div>
        </div>`
        )
        .join('')}
    </div>
    <div style="padding:0 18px 18px">
      <button class="cp-all" id="countyAllBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>
        查看${esc(curCounty)}全部 ${list.length} 处景区
      </button>
    </div>`;

  $('#countyPanel').querySelectorAll('.cp-item').forEach((el) =>
    el.addEventListener('click', () => openSight(el.dataset.sight))
  );
  $('#countyAllBtn').addEventListener('click', () => {
    const grid = $('#countySights');
    grid.innerHTML = renderSightGrid(list);
    bindSightGrid(grid);
    grid.scrollIntoView({ behavior: 'auto', block: 'start' });
    watchReveals(grid);
  });

  renderCountyWeatherCard();
}

/* 面板上的当前县天气卡：优先用已加载数据，否则单独请求 */
async function renderCountyWeatherCard() {
  const card = $('#wxCard');
  if (!card) return;
  let d = weatherData[curCounty];
  if (!d) {
    try {
      d = await getWeather(curCounty);
      weatherData[curCounty] = d;
    } catch (_) {
      d = null;
    }
  }
  if (!d || d.error) {
    card.innerHTML = `<span style="opacity:.8">${esc(curCounty)} 天气服务暂不可用，稍后重试</span>`;
    return;
  }
  card.innerHTML = `
    <span class="wt">${d.temperature}℃</span>
    <div class="wd"><b>${esc(curCounty)} · ${esc(d.weather || '')}</b><br>
    <span class="dim">湿度 ${d.humidity == null ? '--' : d.humidity + '%'} · 风力 ${d.wind}km/h${d.updatedAt ? ' · 更新 ' + esc(d.updatedAt) : ''}</span></div>`;
}

/* ---------- 景区网格 ---------- */
function renderSightGrid(list) {
  return list
    .map(
      (s) => `
    <article class="sight-card reveal" data-sight="${esc(s.name)}">
      <div class="ph">${phHTML(s, makeImgUrl(c('IMG')))}${s.free ? '<span class="free">免费</span>' : ''}</div>
      <div class="bd">
        <h4>${esc(s.name)}${s.level ? '<span class="lv">' + esc(s.level) + '</span>' : ''}</h4>
        <p>${esc(s.desc)}</p>
        <div class="ft">
          <button class="go" data-act="nav" data-name="${esc(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>导航</button>
          <button class="ticket" data-act="ticket" data-name="${esc(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>${s.free ? '免费开放' : '门票预订'}</button>
        </div>
      </div>
    </article>`
    )
    .join('');
}

function bindSightGrid(scope) {
  const SIGHTS = c('SIGHTS');
  scope.querySelectorAll('.sight-card').forEach((card) =>
    card.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (btn) {
        e.stopPropagation();
        const s = SIGHTS.find((x) => x.name === btn.dataset.name);
        if (btn.dataset.act === 'nav') {
          window.open(NAV(s.lng, s.lat, s.name), '_blank');
        } else {
          ticketAction(s);
        }
        return;
      }
      openSight(card.dataset.sight);
    })
  );
}

/* ---------- 切换县区 ---------- */
export function selectCounty(name) {
  const COUNTIES = c('COUNTIES');
  if (!COUNTIES.includes(name)) return;
  curCounty = name;
  renderCountyPanel();
  renderCountyTabs();
  $('#countySights').innerHTML = '';
  if (mapChart) mapChart.dispatchAction({ type: 'showTip', seriesIndex: 0, name });
}

/* ---------- 地图 ---------- */
function initMap() {
  const el = $('#slmap');
  if (!el || !window.echarts) {
    if (el) {
      el.innerHTML =
        '<div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:32px;color:rgba(255,255,255,.55);font-size:14px">地图组件加载失败，请联网后刷新（其余功能不受影响）。</div>';
    }
    return;
  }
  if (!state.geo) return;

  mapChart = echarts.init(el);
  echarts.registerMap('shangluo', state.geo);

  /* 用每个县的第一个景区作为地图标记点 */
  const SIGHTS = c('SIGHTS');
  const COUNTIES = c('COUNTIES');
  const centers = COUNTIES.map((name) => {
    const s = SIGHTS.find((x) => x.county === name);
    return { name, value: s ? [s.lng, s.lat] : undefined };
  }).filter((x) => x.value);

  mapChart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#10281d',
      borderColor: 'rgba(255,255,255,.2)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: (p) =>
        '<b style="font-size:14px">' + p.name + '</b><br/>点击查看县区代表风景'
    },
    geo: {
      map: 'shangluo',
      roam: false,
      top: 18, bottom: 18, left: 16, right: 16,
      itemStyle: { areaColor: '#e6efe5', borderColor: '#3d9a75', borderWidth: 1.4 },
      emphasis: {
        itemStyle: { areaColor: '#d7eadd', shadowBlur: 18, shadowColor: 'rgba(47,143,107,.35)' },
        label: { color: '#10281d' }
      },
      label: {
        show: true, fontSize: 14, color: '#14532d',
        fontFamily: 'Noto Serif SC, serif', fontWeight: 600
      }
    },
    series: [
      {
        type: 'map',
        map: 'shangluo',
        geoIndex: 0,
        data: COUNTIES.map((name) => ({ name, value: 1 })),
        itemStyle: { areaColor: '#e6efe5' },
        emphasis: { label: { show: false } }
      },
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: centers,
        symbolSize: 8,
        rippleEffect: { scale: 3.2, brushType: 'stroke' },
        itemStyle: { color: '#c9a24b', shadowBlur: 6 },
        label: { show: false }
      }
    ]
  });

  mapChart.on('click', (p) => {
    if (p.name && c('COUNTIES').includes(p.name)) selectCounty(p.name);
  });
  window.addEventListener('resize', () => mapChart && mapChart.resize());
}

/* ---------- 门票 ---------- */
function ticketAction(s) {
  if (s.free) {
    toast(s.name + ' 为免费开放景点，无需购票');
    return;
  }
  if (s.ticket) {
    window.open(s.ticket, '_blank');
    toast('已打开官方购票渠道；也可在微信搜索「' + s.name + ' 门票」');
    return;
  }
  window.open(TICKET_URL, '_blank');
  toast('已打开商洛景区门票聚合页；也可在微信搜索「' + s.name + '」');
}

/* ---------- 景区详情弹窗 ---------- */
export function openSight(name) {
  const SIGHTS = c('SIGHTS');
  const s = SIGHTS.find((x) => x.name === name);
  if (!s) return;
  const imgUrl = makeImgUrl(c('IMG'));
  const u = imgUrl(s.img);

  const imageHtml = u
    ? `<img src="${u}" alt="${esc(s.name)}">`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(150deg,#14532d,#2f8f6b 60%,#c9a24b);color:rgba(255,255,255,.95);font-family:'Noto Serif SC',serif;font-size:56px;font-weight:900;letter-spacing:.2em">${esc(s.county.charAt(0))}</div>`;

  const imageWithTag = s.free
    ? imageHtml
    : imageHtml + `<span class="mfree">${esc(s.price)}</span>`;

  const bodyHtml = `
    <p class="mtag">${esc(s.county)}${s.level ? ' · ' + esc(s.level) + ' 景区' : ''}</p>
    <h3>${esc(s.name)}</h3>
    <div class="msub">${esc(s.free ? '免费开放' : s.price || '收费景区')}</div>
    <p class="mdesc">${esc(s.desc)}</p>
    <div class="mmeta">
      <div class="mm">门票${s.free ? '' : '参考价'}<b>${esc(s.free ? '免费' : s.price || '以景区公示为准')}</b></div>
      <div class="mm">交通方式<b>自驾 / 导航直达</b></div>
    </div>
    <div class="mbtns">
      <a class="go-nav" href="${NAV(s.lng, s.lat, s.name)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>查看交通 · 高德导航</a>
      <a class="go-ticket" href="javascript:void(0)" id="mTicket">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>${s.free ? '免费开放' : '门票预订'}</a>
    </div>
    <p class="mnote">
      ${s.free ? '该景点免费开放，可直接前往。' : s.ticket ? '支持官方公众号 / 携程 / 美团 / 抖音实名购票，点上方按钮进入官方渠道。' : '可在携程、美团、抖音团购等平台实名购票。'}
      ${s.phone ? ' 景区咨询电话：' + esc(s.phone) : ''}
    </p>`;

  showModal(imageWithTag, bodyHtml);
  const mTicket = $('#mTicket');
  if (mTicket) mTicket.addEventListener('click', (e) => {
    e.preventDefault();
    ticketAction(s);
  });
}

/* ---------- 视图渲染入口 ---------- */
export function render(opts) {
  renderCountyTabs();
  if (!weatherInited) initWeather();
  renderCountyPanel();
  window.__ensureEcharts(initMap);

  if (opts) {
    if (opts.county) setTimeout(() => selectCounty(opts.county), 60);
    if (opts.sight) setTimeout(() => openSight(opts.sight), 80);
  }
}
