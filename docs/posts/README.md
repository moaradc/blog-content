# 文章目录

每篇文章是一个 `.md` 文件，文件名是文章 ID（如 `107.md`）。

## 文章结构示例

```markdown
---
title: 月下独酌：李白诗中的孤独与自由
date: 2025-11-21 13:09
last_modified: 2025-11-21 13:09
author: Anonymous
category: ["闲谈"]
tags: ["书评"]
desc: 品读李白《月下独酌》，探寻诗仙在孤独中寻得的自由境界。
image: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop
type: note
locked: false
draft: true
---
```

## 正文内容

支持标准 Markdown 语法，以及 `moara-md` 扩展组件（完整示例见 `test001.md`）。

### 折叠面板（推荐，取代旧版手写 HTML）

```
:::folding{title="点击展开 — 查看详细配置说明"}
内部支持所有块级语法：列表、表格、代码块，甚至嵌套折叠。
加 open 属性默认展开：:::folding{title="..." open}
:::
```

### 选项卡

```
::::tabs
:::tab{title="NPM"}
npm install moara
:::
:::tab{title="PNPM" notoc}
pnpm add moara
:::
::::
```

`notoc`：面板内标题不进文章目录。外层用四冒号、内层三冒号（围栏长度决定嵌套层级）。

### 视频嵌入

```
:::video{type="bilibili" id="BV1GJ411x7h7"}
:::video{type="youtube" id="aqz-KE-bpKQ"}
:::video{url="https://example.com/video.mp4" title="直链视频"}
```

视频无正文、无需闭合围栏；直链视频**跟随原始比例**（无外壳装饰）。折叠块内叶子/块两种形式均可，渲染位置正确。

### 链接卡片 / 仓库卡片

```
:::linkcard{url="https://example.com" title="示例站点"}
:::linkcard{url="https://example.com/docs/guide.pdf" title="参考文档"}
::linkcard{post="104"}
:::github{repo="moaradc/MOARA"}
```

普通域名自动解析 favicon；文件后缀显示对应文件类型图标；皆无则不显示。`post` 指向站内文章（运行时解析标题）。

### 提示框（Admonition）

```
> [!NOTE]
> 备注内容。

> [!TIP]+ 自定义标题
> 尾缀 + 默认展开，- 默认收起。
```

支持类型：`NOTE` `TIP` `INFO` `IMPORTANT` `WARNING` `CAUTION` `DANGER` `ABSTRACT` `EXAMPLE` `QUOTE` `SUCCESS` `QUESTION`（同义词自动归并）。

### 行内语法与功能

- `:spoiler[防剧透文本]` — 行内黑幕（点击显示）
- `[^1]` 脚注引用 + `[^1]: 定义` 脚注定义（文末低调「注释」区汇总；未写定义的引用按原文显示；点击不更新地址栏）
- `<mark>高亮</mark>`、`<kbd>Ctrl</kbd>`、`<sup>上标</sup>`、`<sub>下标</sub>` — 行内排版
- frontmatter 加 `math: true` 启用 KaTeX 数学公式（`$...$` / `\(...\)` 行内，`$$...$$` / `\[...\]` 块级，支持 aligned 等环境）
- 链接包裹的图片 `[![alt](img)](url)`：图片点击开灯箱，仅右上角角标跳转（新标签页）
- `<gallery src="url1, url2" links="link1, link2">` — 图集（`links` 可选，逐项对应，空项维持灯箱预览）
- `<music id="xxx"></music>` — 音乐卡片
- `<ul class="todo-list">...</ul>` — 待办清单
- `<details><summary>原生折叠</summary>` + 空行 + 内容 + `</details>` — 原生折叠（与 :::folding 视觉统一）
- `<span class='spoiler'>隐藏内容</span>` — 旧版黑幕写法（仍兼容，推荐 `:spoiler[]`）

> [!WARNING]
> 旧版 `<div class='details-box'>...</div>` 手写折叠语法**不再推荐**：内部代码块无法高亮，且缺少无障碍标注。请改用 `:::folding`（运行时会自动为旧语法补齐图标并保持可用）。

## 访问方式

- 单篇文章: `https://raw-posts.945426.xyz/posts/107.md`
- html: `https://raw-posts.945426.xyz/posts/107.html`
- 文章列表: `https://raw-posts.945426.xyz/posts.json`
