/**
 * 通用详情弹窗（景区 / 故事 / 非遗 / 美食 / 康养共用）
 */
import { $ } from '../utils.js';

const btnClose =
  '<button class="close" id="mClose2" aria-label="关闭">' +
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
  '<path d="M6 6l12 12M18 6L6 18"/></svg></button>';

export function openModal() {
  $('#modalMask').classList.add('open');
  document.body.style.overflow = 'hidden';
  const c = $('#mClose2');
  if (c) c.addEventListener('click', closeModal);
}

export function closeModal() {
  $('#modalMask').classList.remove('open');
  document.body.style.overflow = '';
}

/* 填充弹窗内容并打开 */
export function showModal(imageHtml, bodyHtml) {
  $('#mImg').innerHTML = imageHtml + btnClose;
  $('#mBody').innerHTML = bodyHtml;
  openModal();
}

export function getCloseButton() {
  return btnClose;
}

/* 弹窗基础事件绑定（只需执行一次） */
export function initModalEvents() {
  $('#mClose').addEventListener('click', closeModal);
  $('#modalMask').addEventListener('click', (e) => {
    if (e.target === $('#modalMask')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}
