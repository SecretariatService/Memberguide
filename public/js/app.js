import { fetchContent } from './api.js';

const titleEl = document.getElementById('page-title');
const subtitleEl = document.getElementById('page-subtitle');
const flowchartEl = document.getElementById('mermaid-container');
const stepListEl = document.getElementById('step-list');
const videoListEl = document.getElementById('video-list');
const searchEl = document.getElementById('search-input');

let contentCache = null;

function renderVideos(videos) {
  videoListEl.innerHTML = '';
  if (!videos.length) {
    videoListEl.innerHTML = '<p class="note">暂无视频指引。</p>';
    return;
  }

  videos.forEach((video) => {
    const wrap = document.createElement('div');
    wrap.className = 'video-item';
    wrap.innerHTML = `<p>${video.name}</p><video controls src="${video.url}"></video>`;
    videoListEl.appendChild(wrap);
  });
}

function renderSteps(steps, keyword = '') {
  const needle = keyword.trim().toLowerCase();
  stepListEl.innerHTML = '';

  const filtered = steps
    .map((step) => {
      const faqs = step.faqs.filter((item) => {
        const text = `${item.q} ${item.a}`.toLowerCase();
        return !needle || text.includes(needle) || step.title.toLowerCase().includes(needle);
      });
      return { ...step, faqs };
    })
    .filter((step) => !needle || step.faqs.length);

  if (!filtered.length) {
    stepListEl.innerHTML = '<p class="note">未检索到匹配结果。</p>';
    return;
  }

  filtered.forEach((step) => {
    const card = document.createElement('article');
    card.className = 'card step';
    card.innerHTML = `<h3>${step.title}</h3><p>${step.description || ''}</p>`;

    step.faqs.forEach((item) => {
      const details = document.createElement('details');
      details.innerHTML = `<summary>${item.q}</summary><div class="answer">${item.a}</div>`;
      card.appendChild(details);
    });

    stepListEl.appendChild(card);
  });
}

async function renderFlowchart(mermaidCode) {
  try {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    const { svg } = await mermaid.render('guide-flowchart', mermaidCode);
    flowchartEl.innerHTML = svg;
  } catch (err) {
    flowchartEl.textContent = `流程图渲染失败：${err.message}`;
  }
}

async function init() {
  contentCache = await fetchContent();
  titleEl.textContent = contentCache.title;
  subtitleEl.textContent = contentCache.subtitle;
  renderVideos(contentCache.videos || []);
  renderSteps(contentCache.steps || []);
  await renderFlowchart(contentCache.flowchartMermaid || 'flowchart LR; A[暂无流程图]');

  searchEl.addEventListener('input', (event) => {
    renderSteps(contentCache.steps || [], event.target.value);
  });
}

init().catch((err) => {
  stepListEl.innerHTML = `<p class="note">加载失败：${err.message}</p>`;
});
