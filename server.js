const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const uploadDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'data', 'content.json');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime'
};

function sendJson(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        reject(new Error('请求体过大'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function validateContent(content) {
  if (!content || typeof content !== 'object') return '内容格式不正确';
  if (!Array.isArray(content.steps)) return 'steps 必须是数组';
  if (!Array.isArray(content.videos)) return 'videos 必须是数组';
  for (const step of content.steps) {
    if (!step.id || !step.title || !Array.isArray(step.faqs)) {
      return '每个步骤需包含 id、title、faqs';
    }
  }
  return null;
}

function safeJoin(base, target) {
  const targetPath = path.normalize(path.join(base, target));
  if (!targetPath.startsWith(base)) return null;
  return targetPath;
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && reqUrl.pathname === '/api/content') {
    const content = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    return sendJson(res, 200, content);
  }

  if (req.method === 'PUT' && reqUrl.pathname === '/api/content') {
    try {
      const body = await readRequestBody(req);
      const payload = JSON.parse(body || '{}');
      const err = validateContent(payload);
      if (err) return sendJson(res, 400, { message: err });
      fs.writeFileSync(dataFile, JSON.stringify(payload, null, 2));
      return sendJson(res, 200, { message: '保存成功' });
    } catch (error) {
      return sendJson(res, 400, { message: `请求错误：${error.message}` });
    }
  }

  if (req.method === 'POST' && reqUrl.pathname === '/api/upload-video') {
    try {
      const body = await readRequestBody(req);
      const { name, dataUrl } = JSON.parse(body || '{}');
      if (!name || !dataUrl) return sendJson(res, 400, { message: '缺少视频名称或数据' });
      const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!match) return sendJson(res, 400, { message: '视频数据格式错误' });
      const ext = path.extname(name) || '.mp4';
      const safeName = `${Date.now()}_${path.basename(name, path.extname(name)).replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40)}${ext}`;
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'));
      return sendJson(res, 200, { name, url: `/uploads/${safeName}` });
    } catch (error) {
      return sendJson(res, 400, { message: `上传失败：${error.message}` });
    }
  }

  if (req.method === 'GET' && reqUrl.pathname.startsWith('/uploads/')) {
    const filePath = safeJoin(uploadDir, reqUrl.pathname.replace('/uploads/', ''));
    if (!filePath || !fs.existsSync(filePath)) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    return fs.createReadStream(filePath).pipe(res);
  }

  if (req.method === 'GET') {
    const routePath = reqUrl.pathname === '/admin' ? '/admin.html' : reqUrl.pathname;
    const assetPath = routePath === '/' ? '/index.html' : routePath;
    const filePath = safeJoin(publicDir, assetPath);

    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
      return fs.createReadStream(filePath).pipe(res);
    }

    const indexPath = path.join(publicDir, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.writeHead(405);
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
