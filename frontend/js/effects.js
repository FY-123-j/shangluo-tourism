/**
 * 视觉动效：Hero 轮播、雾气 Canvas、滚动揭示
 */
import { $, reduceMotion } from './utils.js';

/* ---------- Hero 轮播 ---------- */
export function initHeroSlides(images) {
  const box = $('#heroSlides');
  if (!box) return;
  box.innerHTML = images
    .map(
      (u, i) =>
        `<img class="hero-slide ${i === 0 ? 'is-active' : ''}" src="${u}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}">`
    )
    .join('');

  const slides = [...box.querySelectorAll('.hero-slide')];
  if (slides.length > 1 && !reduceMotion) {
    let cur = 0;
    setInterval(() => {
      slides[cur].classList.remove('is-active');
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add('is-active');
    }, 7000);
  }
}

/* ---------- 雾气 Canvas ---------- */
export function initFog() {
  const fog = $('#fog');
  if (!fog) return;
  const fctx = fog.getContext('2d');
  let blobs = [];

  const setup = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    fog.width = fog.clientWidth * dpr;
    fog.height = fog.clientHeight * dpr;
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.scale(dpr, dpr);
    const n = window.innerWidth < 760 ? 14 : 26;
    blobs = Array.from({ length: n }, () => ({
      x: Math.random() * fog.clientWidth,
      y: fog.clientHeight * (0.15 + Math.random() * 0.75),
      r: 60 + Math.random() * 160,
      vx: 0.12 + Math.random() * 0.3,
      vy: -0.03 - Math.random() * 0.06,
      a: 0.028 + Math.random() * 0.05
    }));
  };

  const draw = () => {
    fctx.clearRect(0, 0, fog.clientWidth, fog.clientHeight);
    for (const b of blobs) {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x - b.r > fog.clientWidth) b.x = -b.r;
      if (b.y < -b.r) b.y = fog.clientHeight + b.r;
      const g = fctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, `rgba(255,255,255,${b.a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      fctx.fillStyle = g;
      fctx.beginPath();
      fctx.arc(b.x, b.y, b.r, 0, 6.2832);
      fctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  };

  setup();
  draw();
  window.addEventListener('resize', setup);
}

/* ---------- 滚动揭示 ---------- */
const revObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1 }
);

export function watchReveals(scope = document) {
  scope.querySelectorAll('.reveal:not(.in)').forEach((el) => revObs.observe(el));
}
