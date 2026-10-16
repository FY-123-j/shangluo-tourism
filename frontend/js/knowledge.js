/**
 * 本地知识库（大模型与网络全部不可用时的最终兜底）
 * 语料 CORPUS、FALLBACK 均来自后端内容数据，
 * 这里只负责关键词匹配检索。
 */
import { c } from './store.js';

export function matchAnswer(q) {
  const CORPUS = c('CORPUS') || [];
  const FALLBACK = c('FALLBACK') || {
    a: '这个问题我暂时没有答案，可以换个问法试试，比如「商洛有什么好玩的」「金丝峡门票多少钱」。',
    src: '官方语料未命中'
  };
  const SIGHTS = c('SIGHTS') || [];
  const COUNTIES = c('COUNTIES') || [];
  const FOODS = c('FOODS') || [];
  const HERITAGE = c('HERITAGE') || [];

  let best = null;
  let bestScore = 0;
  for (const it of CORPUS) {
    if (!it.k || !it.a) continue;
    let s = 0;
    for (const kw of it.k) {
      if (kw && q.includes(kw)) {
        /* 权重：关键词越长，分值越高 */
        s += kw.length * 2;
        /* 全字匹配额外加分 */
        if (q === kw) s += 10;
      }
    }
    if (s > bestScore) {
      bestScore = s;
      best = it;
    }
  }
  if (best && bestScore > 0) return best;

  /* 景区名检索 */
  const sightHit = SIGHTS.find(
    (s) => q.includes(s.name) || (s.name.length >= 3 && q.includes(s.name.slice(0, 3)))
  );
  if (sightHit) {
    return {
      a:
        sightHit.name +
        (sightHit.county ? '（' + sightHit.county + (sightHit.level ? ' · ' + sightHit.level + ' 景区' : '') + '）' : '') +
        '：' + sightHit.desc +
        (sightHit.free ? ' 该景点免费开放。' : sightHit.price ? ' 门票参考价 ' + sightHit.price + '。' : '') +
        '\n\n可点击「山水商洛」页该景区卡片，一键导航或预订门票。',
      src: '商洛文旅数字平台 · 景区数据'
    };
  }

  /* 美食检索 */
  const foodHit = FOODS.find((f) => q.includes(f.name));
  if (foodHit) {
    return {
      a: `${foodHit.name}（${foodHit.region}）：${foodHit.desc}。想要品尝正宗的${foodHit.name}，推荐去${foodHit.region}当地的老字号餐馆。`,
      src: '商洛文旅数字平台 · 美食数据'
    };
  }

  /* 非遗检索 */
  const fyHit = HERITAGE.find((h) => q.includes(h.name));
  if (fyHit) {
    return {
      a: `${fyHit.name}（${fyHit.region} · ${fyHit.type}）：${fyHit.desc}。这是商洛极具代表性的非物质文化遗产。`,
      src: '商洛文旅数字平台 · 非遗数据'
    };
  }

  /* 县区查询 */
  const cc = COUNTIES.find((name) => q.includes(name));
  if (cc) {
    const list = SIGHTS.filter((s) => s.county === cc).slice(0, 6);
    return {
      a:
        cc + '主要景区景点：' +
        list.map((s) => s.name + (s.level ? '（' + s.level + '）' : '')).join('、') +
        '。点击「山水商洛」页选择' + cc + '，可查看全部 ' +
        SIGHTS.filter((s) => s.county === cc).length + ' 处景区并一键导航、预订门票。',
      src: '商洛文旅数字平台 · 景区数据'
    };
  }

  return FALLBACK;
}

/* 判断返回的是否为“未命中兜底”，用于决定是否显示降级提示 */
export function isFallback(ans) {
  const FALLBACK = c('FALLBACK');
  return !!FALLBACK && ans.a === FALLBACK.a;
}
