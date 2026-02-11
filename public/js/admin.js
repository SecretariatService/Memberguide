import { fetchContent, saveContent, uploadVideo } from './api.js';

const titleInput = document.getElementById('title-input');
const subtitleInput = document.getElementById('subtitle-input');
const flowchartInput = document.getElementById('flowchart-input');
const stepsContainer = document.getElementById('admin-steps');
const addStepBtn = document.getElementById('add-step-btn');
const saveBtn = document.getElementById('save-btn');
const saveMsg = document.getElementById('save-msg');
const uploadVideoBtn = document.getElementById('upload-video-btn');
const videoFileInput = document.getElementById('video-file');
const adminVideoList = document.getElementById('admin-video-list');

let contentState = null;

function renderVideos() {
  adminVideoList.innerHTML = '';
  (contentState.videos || []).forEach((video, index) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>${video.name}</span>`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'ghost';
    removeBtn.textContent = '删除';
    removeBtn.addEventListener('click', () => {
      contentState.videos.splice(index, 1);
      renderVideos();
    });

    row.appendChild(removeBtn);
    adminVideoList.appendChild(row);
  });
}

function renderSteps() {
  stepsContainer.innerHTML = '';

  contentState.steps.forEach((step, stepIndex) => {
    const wrap = document.createElement('div');
    wrap.className = 'admin-step';

    wrap.innerHTML = `
      <label>步骤ID</label>
      <input type="text" data-type="id" value="${step.id || ''}" />
      <label>步骤标题</label>
      <input type="text" data-type="title" value="${step.title || ''}" />
      <label>步骤说明</label>
      <input type="text" data-type="description" value="${step.description || ''}" />
      <div class="row" style="margin-top:8px;">
        <button type="button" class="ghost" data-action="add-faq">+ 新增问题</button>
        <button type="button" class="ghost" data-action="remove-step">删除步骤</button>
      </div>
      <div class="faq-list"></div>
    `;

    const faqList = wrap.querySelector('.faq-list');
    step.faqs.forEach((faq, faqIndex) => {
      const faqEl = document.createElement('div');
      faqEl.className = 'faq-item';
      faqEl.innerHTML = `
        <label>问题</label>
        <input type="text" data-faq="q" value="${faq.q || ''}" />
        <label>回答</label>
        <textarea data-faq="a">${faq.a || ''}</textarea>
        <button type="button" class="ghost" data-action="remove-faq">删除该问题</button>
      `;

      faqEl.querySelector('[data-faq="q"]').addEventListener('input', (e) => {
        contentState.steps[stepIndex].faqs[faqIndex].q = e.target.value;
      });
      faqEl.querySelector('[data-faq="a"]').addEventListener('input', (e) => {
        contentState.steps[stepIndex].faqs[faqIndex].a = e.target.value;
      });
      faqEl.querySelector('[data-action="remove-faq"]').addEventListener('click', () => {
        contentState.steps[stepIndex].faqs.splice(faqIndex, 1);
        renderSteps();
      });
      faqList.appendChild(faqEl);
    });

    wrap.querySelector('[data-type="id"]').addEventListener('input', (e) => {
      contentState.steps[stepIndex].id = e.target.value;
    });
    wrap.querySelector('[data-type="title"]').addEventListener('input', (e) => {
      contentState.steps[stepIndex].title = e.target.value;
    });
    wrap.querySelector('[data-type="description"]').addEventListener('input', (e) => {
      contentState.steps[stepIndex].description = e.target.value;
    });
    wrap.querySelector('[data-action="add-faq"]').addEventListener('click', () => {
      contentState.steps[stepIndex].faqs.push({ q: '', a: '' });
      renderSteps();
    });
    wrap.querySelector('[data-action="remove-step"]').addEventListener('click', () => {
      contentState.steps.splice(stepIndex, 1);
      renderSteps();
    });

    stepsContainer.appendChild(wrap);
  });
}

async function init() {
  contentState = await fetchContent();
  titleInput.value = contentState.title || '';
  subtitleInput.value = contentState.subtitle || '';
  flowchartInput.value = contentState.flowchartMermaid || '';

  renderVideos();
  renderSteps();

  addStepBtn.addEventListener('click', () => {
    contentState.steps.push({ id: '', title: '', description: '', faqs: [] });
    renderSteps();
  });

  uploadVideoBtn.addEventListener('click', async () => {
    const file = videoFileInput.files[0];
    if (!file) {
      saveMsg.textContent = '请先选择视频文件';
      return;
    }
    try {
      saveMsg.textContent = '视频上传中...';
      const video = await uploadVideo(file);
      contentState.videos.push(video);
      videoFileInput.value = '';
      renderVideos();
      saveMsg.textContent = '视频上传成功';
    } catch (error) {
      saveMsg.textContent = `视频上传失败：${error.message}`;
    }
  });

  saveBtn.addEventListener('click', async () => {
    if (!window.confirm('确认保存并发布到前端？')) {
      return;
    }

    const payload = {
      ...contentState,
      title: titleInput.value.trim(),
      subtitle: subtitleInput.value.trim(),
      flowchartMermaid: flowchartInput.value.trim()
    };

    try {
      saveMsg.textContent = '保存中...';
      await saveContent(payload);
      saveMsg.textContent = '保存成功，前端已可查看最新指引。';
    } catch (error) {
      saveMsg.textContent = `保存失败：${error.message}`;
    }
  });
}

init().catch((error) => {
  saveMsg.textContent = `初始化失败：${error.message}`;
});
