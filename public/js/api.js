export async function fetchContent() {
  const res = await fetch('/api/content');
  if (!res.ok) throw new Error('获取内容失败');
  return res.json();
}

export async function saveContent(content) {
  const res = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '保存失败');
  return data;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

export async function uploadVideo(file) {
  const dataUrl = await fileToDataUrl(file);
  const res = await fetch('/api/upload-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, dataUrl })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '上传失败');
  return data;
}
