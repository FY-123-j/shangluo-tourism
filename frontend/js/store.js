/**
 * 前端数据中心
 * 启动时从后端加载一次内容数据，所有页面共享。
 */
export const state = {
  content: null, // 后端返回的全部内容（景区/非遗/美食/新闻/语料等）
  geo: null,     // 地图 GeoJSON
  loaded: false
};

/* 便捷取值：拿 content 中的某一项数据 */
export const c = (key) => (state.content ? state.content[key] : null);
