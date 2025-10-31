# NotePilot Demo

一个基于 Vite + React 的原型应用，用于展示“视频学习智能助手”的核心交互：从视频播放界面拖拽 AI 生成的亮点，快速生成结构化笔记大纲，并导出为 Markdown 或 Word。

## 开始使用

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

## 配置文件

应用启动后会自动加载 `public/config/demo-config.json` 中的示例配置，你也可以通过左侧面板上传自定义的 JSON 配置。配置结构如下：

```json
{
  "videoDirectory": "https://example.com/videos",
  "export": {
    "outlineTitle": "示例课程大纲"
  },
  "videos": [
    {
      "id": "unique-id",
      "title": "视频标题",
      "src": "https://example.com/videos/sample.mp4",
      "poster": "https://example.com/poster.jpg",
      "duration": 300,
      "highlights": [
        {
          "id": "highlight-1",
          "label": "亮点标签",
          "time": 42,
          "shape": "circle",
          "category": "summary"
        }
      ]
    }
  ]
}
```

- `shape` 可选值：`circle`、`diamond`、`rectangle`，用于在界面中展示不同形状的提示卡片。
- `category` 用于映射不同颜色的提示标签，例如 `summary`、`insight`、`question`、`action`。

## 功能概览

- 左侧面板：加载/查看配置、切换视频。
- 中间面板：视频播放与 AI 亮点提示，亮点会在配置的时间点自动出现并支持拖拽。
- 右侧面板：将亮点拖拽生成大纲、实时 Markdown 预览、一键导出。

该项目专注于原型验证，未实现真实的 LLM 调用逻辑，适合用于 HCI 课程中的交互演示与可用性测试。
