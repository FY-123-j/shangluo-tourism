/**
 * 通用工具函数
 */
export const $ = (s, scope = document) => scope.querySelector(s);
export const $$ = (s, scope = document) => [...scope.querySelectorAll(s)];

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* HTML 转义，防止数据中的特殊字符破坏页面（XSS 防护） */
export const esc = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* 图片地址：完整 URL 直接用，否则去 IMG 字典里查 */
export const makeImgUrl = (IMG) => (k) => {
  if (k && String(k).startsWith('http')) return k;
  return (k && IMG[k]) || '';
};

/* 轻提示 */
let toastTimer = null;
export function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* 景区图片占位：无图时显示县名首字的色块 */
export function phHTML(sight, imgUrl) {
  const u = imgUrl(sight.img);
  if (u) return `<img src="${u}" alt="${esc(sight.name)}" loading="lazy">`;
  const cc = sight.county.charAt(0);
  return (
    '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;' +
    'background:linear-gradient(150deg,#14532d,#2f8f6b 60%,#c9a24b);color:rgba(255,255,255,.92);' +
    "font-family:'Noto Serif SC',serif;font-size:44px;font-weight:900;letter-spacing:.2em\">" +
    esc(cc) +
    '</div>'
  );
}
