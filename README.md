# MemberGuide 桌面版（参会指导制作工具）

一个轻松制作系列嘉宾参会指导的本地化工具：

- 支持多份参会指导并行管理。
- 支持流程图节点创建与编辑。
- 支持给节点添加 Q&A。
- 支持插入图片、视频、文字内容。
- 支持流程图节点之间设置关联关系。
- 支持在不同参会指导之间设置跳转链接并一键打开。
- 数据本地保存（`localStorage`），可导入/导出 JSON。
- 基于 Electron，可打包为 Windows `.exe`（portable）。
- 应用可联网（例如媒体 URL、外部链接可访问）。

## 本地运行

```bash
npm install
npm run start
```

## 打包为 Windows EXE

```bash
npm install
npm run pack-win
```

打包产物默认在 `dist/` 目录，例如：

- `dist/MemberGuideBuilder-1.0.0.exe`

## 说明

- 这是一个离线可运行的本地应用，数据默认保存在本机。
- 若媒体资源使用在线 URL，应用会通过网络加载。
