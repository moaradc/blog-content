# 文章目录

每篇文章是一个 `.md` 文件，文件名是文章 ID（如 `107.md`）。

## 文章结构示例

```markdown
---
id: "107"
title: Markdown写作指南
date: 2026-06-09 10:00
author: Admin
category: ["技术"]
tags: ["Markdown", "教程"]
desc: 一篇使用Markdown格式编写的示例文章
coverImage: /img/example.jpg
# 或 image: https://images.unsplash.com/...
locked: false
draft: false
pin: false
type: ""
content_url: ""
---

## 正文内容

支持标准 Markdown 语法，以及自定义组件：
- `<music id="xxx"></music>` - 音乐卡片
- `<gallery src="url1, url2"></gallery>` - 图集
- `<span class='spoiler'>隐藏内容</span>` - 黑幕/防剧透
- `<div class="details-box">...</div>` - 折叠框
- `<ul class="todo-list">...</ul>` - 待办清单
```

## 访问方式

博客主站通过 jsdelivr CDN fetch：
- 单篇文章: `https://raw-posts.945426.xyz/posts/107.md`
- 文章列表: `https://raw-posts.945426.xyz/posts.json`（需 GitHub Action 生成）
