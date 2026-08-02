# blog.945426.xyz SEO 满分计划

> 基于首页 Lighthouse SEO 83 分 + 文章页 SEO 92 分的诊断与修复方案
>
> 仓库：`moaradc/MOARA@main`（主站，Astro）+ `moaradc/blog-content@cms`（内容仓库，Cloudflare Workers）
>
> 日期：2026-08-02

---

## 1. 当前评分总览

| 页面 | Lighthouse SEO | 目标 | 主要扣分项 |
| --- | --- | --- | --- |
| 首页 `blog.945426.xyz/` | **83** | 100 | meta-description 缺失、crawlable-anchors 失败、robots.txt 404、canonical 缺失 |
| 文章页 `blog.945426.xyz/posts/101` | **92** | 100 | image-alt（Waline 评论系统运行时 img，无害） |
| 文章页 `blog.945426.xyz/posts/107` | ~92 | 100 | 同上 |

### 首页审计明细（Lighthouse 83 分）

| 状态 | 审计项 | 说明 |
| --- | --- | --- |
| ✅ | viewport | 有 `<meta name="viewport">` |
| ✅ | document-title | 有 `<title>` |
| ❌ | **meta-description** | **文档缺少 meta 描述** |
| ✅ | http-status-code | HTTP 200 |
| ✅ | link-text | 链接文字可描述 |
| ❌ | **crawlable-anchors** | **链接不可抓取**（`<a class="pc-tag-trigger" onclick="...">` 等） |
| ✅ | is-crawlable | 未被 robots 阻止 |
| N/A | robots-txt | robots.txt 有效（实际 404，Lighthouse 因首页未引用未计分） |
| ✅ | image-alt | 图片有 alt |
| ✅ | hreflang | 有效 |
| N/A | canonical | 文档有有效 rel=canonical（实际缺失） |
| ✅ | font-size | 90.82% 文字可读 |
| ✅ | plugins | 无插件 |
| ✅ | tap-targets | 100% 点击区域合适 |
| N/A | structured-data | 结构化数据有效（实际缺失） |

### 文章页审计明细（Lighthouse 92 分）

| 状态 | 审计项 | 说明 |
| --- | --- | --- |
| ✅ | viewport / title / description / canonical / OG / Twitter Card / JSON-LD | 全部齐全 |
| ❌ | **image-alt** | Waline 评论系统 `ul.wl-reaction-list > li.wl-reaction-item > div.wl-reaction-img > img` 缺 alt（运行时 JS 渲染，无害） |

---

## 2. 现状证据（curl 抓取）

### 2.1 首页 head（缺失项标红）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>沫然Blog</title>
  <link rel="icon" href="/favicon.jpg" type="image/jpeg">
  <!-- ❌ 没有 meta name="description" -->
  <!-- ❌ 没有 link rel="canonical" -->
  <!-- ❌ 没有 Open Graph (og:type, og:title, ...) -->
  <!-- ❌ 没有 Twitter Card (twitter:card, ...) -->
  <!-- ❌ 没有 JSON-LD 结构化数据 -->
  <!-- 只有 CSS/JS 资源引用 -->
</head>
```

### 2.2 首页 nav 不可抓取链接

```html
<a id="nav-link-home" onclick="scrollToSection('home'); toggleMenu()">首页</a>
<a id="nav-link-articles" onclick="scrollToSection('archive'); toggleMenu()">文章</a>
<a class="pc-tag-trigger" onclick="togglePCTags(event)">标签</a>  <!-- Lighthouse 直接点名的这个 -->
<a id="nav-link-about" onclick="openAbout(); toggleMenu()">关于</a>
<a id="nav-link-footer" onclick="scrollToSection('about'); toggleMenu()">页脚</a>
<!-- 这 5 个 <a> 都没有 href，爬虫无法抓取 -->
```

### 2.3 robots.txt 404

```
$ curl -sI https://blog.945426.xyz/robots.txt
HTTP/2 404
content-type: text/plain; charset=utf-8

The page could not be found
```

### 2.4 sitemap.xml 含文档文件

```xml
<!-- 2114.md 是文档说明文件（无 frontmatter），不该进 sitemap -->
<url><loc>https://blog.945426.xyz/posts/2114</loc></url>
```

### 2.5 文章页 head（完整，作为对照）

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Markdown写作指南 | 沫然Blog</title>
  <meta name="description" content="一篇使用Markdown格式编写的示例文章..." />
  <meta name="keywords" content="Markdown,教程" />
  <meta name="author" content="Admin" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="https://blog.945426.xyz/posts/107" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="..." />
  <meta property="og:description" content="..." />
  <meta property="og:url" content="..." />
  <meta property="og:site_name" content="沫然Blog" />
  <meta property="og:locale" content="zh_CN" />
  <meta property="article:published_time" content="..." />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="..." />
  <meta name="twitter:description" content="..." />
  <meta name="twitter:url" content="..." />
  <meta name="twitter:image" content="..." />
  <script type="application/ld+json">[BlogPosting + BreadcrumbList]</script>
</head>
```

---

## 3. P0 修复：首页 meta description + canonical + OG + Twitter Card

**仓库**：`moaradc/MOARA` @ `src/pages/index.astro`

### Before

```astro
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>沫然Blog</title>
  <link rel="icon" href="/favicon.jpg" type="image/jpeg">
  <!-- 资源库 -->
  <link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css">
  ...
</head>
```

### After

```astro
---
const SITE_URL = 'https://blog.945426.xyz';
const SITE_NAME = '沫然Blog';
const SITE_DESCRIPTION = '沫然的个人博客 —— 技术、生活、闲谈、创作、归档';
const OG_IMAGE = `${SITE_URL}/assets/img/icon/moara.webp`;
---
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{SITE_NAME} —— 技术、生活、闲谈、创作</title>
  <meta name="description" content={SITE_DESCRIPTION} />
  <meta name="author" content="沫然" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href={SITE_URL} />
  <link rel="icon" href="/favicon.jpg" type="image/jpeg">

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content={SITE_NAME} />
  <meta property="og:description" content={SITE_DESCRIPTION} />
  <meta property="og:url" content={SITE_URL} />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:locale" content="zh_CN" />
  <meta property="og:image" content={OG_IMAGE} />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={SITE_NAME} />
  <meta name="twitter:description" content={SITE_DESCRIPTION} />
  <meta name="twitter:url" content={SITE_URL} />
  <meta name="twitter:image" content={OG_IMAGE} />

  <!-- 资源库（保持原样） -->
  <link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css">
  ...
</head>
```

### 要点

- **`title`** 加长成描述性句子（"沫然Blog —— 技术、生活、闲谈、创作"），比单纯"沫然Blog"在 SERP 里更吸引点击
- **`description`** 70-160 字符最佳，中文 30-80 字
- **`og:image`** 不强制 1200×630px。现有方图素材（`moara.webp` 256×256 / 480×480 / 720×720）均可直接用，社交平台会自动缩放。推荐用 720×720 的版本（清晰度与体积平衡）
- **`twitter:card=summary`** 用方图小卡片（图在左侧，标题描述在右侧），完美匹配方图素材。不要用 `summary_large_image`（横图大卡片，方图会被裁剪/留白）
- **`og:image` 不是 Lighthouse SEO 审计项**，不加不扣分。但加了社交分享会有卡片预览图，点击率明显高，强烈建议加

---

## 4. P0 修复：robots.txt

**仓库**：`moaradc/MOARA` @ `public/robots.txt`（新增文件）

### 文件内容

```
User-agent: *
Allow: /
Disallow: /assets/data-scripts/feature-switch.js
Disallow: /assets/data-scripts/about.js
Disallow: /assets/data-scripts/anime.json

Sitemap: https://blog.945426.xyz/sitemap.xml
```

### 说明

- Vercel 部署 `public/` 目录下的文件会自动映射到根路径，`public/robots.txt` → `https://blog.945426.xyz/robots.txt`
- `Allow: /` 允许爬取所有路径（默认行为，写明更清晰）
- `Sitemap:` 引导爬虫发现 sitemap.xml
- 不需要 `Disallow`，因为没有需要屏蔽的路径（`/assets/` 爬了也无害，是静态资源）

### 验证

```bash
curl -sI https://blog.945426.xyz/robots.txt
# 期望：HTTP/2 200
# 内容包含 User-agent / Allow / Sitemap 三行
```

---

## 5. P0 修复：导航链接可抓取性

**仓库**：`moaradc/MOARA` @ `src/pages/index.astro` 的 nav 区域

Lighthouse 直接点名：`<a class="pc-tag-trigger" onclick="togglePCTags(event)">`。实际首页有 5 处 `<a onclick>` 无 href。

### 修复原则

- 给 `<a>` 加 `href`，让爬虫能抓取
- 保留 `onclick`，用 `e.preventDefault()` 拦截走 SPA 体验
- 爬虫看到 href 就能发现链接目标，不会执行 JS

### 5.1 "首页" / "文章" / "页脚" 锚点链接

这三个是页内锚点滚动，href 指向 `#section`。

#### Before

```html
<a id="nav-link-home" onclick="scrollToSection('home'); toggleMenu()">首页</a>
<a id="nav-link-articles" onclick="scrollToSection('archive'); toggleMenu()">文章</a>
<a id="nav-link-footer" onclick="scrollToSection('about'); toggleMenu()">页脚</a>
```

#### After

```html
<a id="nav-link-home" href="#home" onclick="event.preventDefault(); scrollToSection('home'); toggleMenu()">首页</a>
<a id="nav-link-articles" href="#archive" onclick="event.preventDefault(); scrollToSection('archive'); toggleMenu()">文章</a>
<a id="nav-link-footer" href="#about" onclick="event.preventDefault(); scrollToSection('about'); toggleMenu()">页脚</a>
```

### 5.2 "标签" 下拉触发器

Lighthouse 直接点名的这个。标签功能是展开下拉，**用户点击行为保留不变（展开下拉，不跳转）**，只是给 `<a>` 加 href 让爬虫能发现归档页（那里有完整标签云）。

#### Before

```html
<a class="pc-tag-trigger" onclick="togglePCTags(event)">标签</a>
```

#### After

```html
<a class="pc-tag-trigger" href="/details/archives" onclick="event.preventDefault(); togglePCTags(event)">标签</a>
```

#### 行为说明

- **爬虫**：看到 `href="/details/archives"`，能发现并抓取归档页（无需执行 JS）
- **用户点击**：`event.preventDefault()` 阻止默认跳转，`togglePCTags(event)` 展开下拉 —— 跟之前行为完全一样
- **中键/右键新窗口打开**：浏览器中键点击会打开 `/details/archives`（这是 href 的副作用，合理 —— 用户想新窗口看标签云的话有去处）

### 5.3 "关于" 弹窗触发器

关于是弹窗，没有独立页面，href 指向一个合理的 fallback URL（可以是首页锚点或单独的 /about 页面，当前没有 /about 就先指向首页锚点）。

#### Before

```html
<a id="nav-link-about" onclick="openAbout(); toggleMenu()">关于</a>
```

#### After

```html
<a id="nav-link-about" href="#about" onclick="event.preventDefault(); openAbout(); toggleMenu()">关于</a>
```

### 为什么不用 `<button>` 替代 `<a>`

- `<button>` 爬虫不抓取，无法发现新页面
- 改成 `<button>` 要重写所有 CSS（`<a>` 和 `<button>` 默认样式不同）
- 保留 `<a>` + href 是最小改动 + 最大 SEO 收益

### 为什么不能只删 onclick

- 删了 onclick 会丢 SPA 体验（页面整体刷新、动画丢失）
- `e.preventDefault()` 是两全方案：爬虫看 href，用户看 SPA

---

## 6. P1 修复：首页结构化数据（JSON-LD）

**仓库**：`moaradc/MOARA` @ `src/pages/index.astro`

### 现状

文章页已有 `BlogPosting` + `BreadcrumbList` 两个 JSON-LD，首页一个都没有。

### 方案：加 WebSite + SearchAction

WebSite + SearchAction 让 Google 识别为"带站内搜索的网站"，SERP 可能出现站点搜索框。

#### After（在 `</head>` 前加）

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://blog.945426.xyz",
  "name": "沫然Blog",
  "description": "沫然的个人博客 —— 技术、生活、闲谈、创作、归档",
  "inLanguage": "zh-CN",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://blog.945426.xyz/?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
})} />
```

### 注意

- **`urlTemplate` 的 `?q=` 必须跟主站搜索功能实际用的参数一致**。当前首页搜索框 `oninput="handleSearch(this)"` 是客户端过滤，没有 URL 参数。如果主站没有服务端搜索，这个 SearchAction 可能不生效。两个选项：
  - **A**：先不加 `potentialAction`，只加基础 WebSite JSON-LD（让 Google 识别站点）
  - **B**：加 `potentialAction`，同时改 main.js 让 `?q=xxx` 能触发搜索（中等工作量）
- 推荐先 A，后续主站支持 URL 搜索后再加 B

### 顺带：首页 h1 优化

当前首页 hero 区域：

```html
<header>
  <div class="hero-text">
    <div>HELLO</div>
    <div style="color: var(--accent-3)">WORLD</div>
    <div>AGAIN</div>
  </div>
</header>
```

这三个 div 都不是 h1，爬虫看不到主标题。建议改成：

```html
<header>
  <h1 class="hero-text">
    <span>HELLO</span>
    <span style="color: var(--accent-3)">WORLD</span>
    <span>AGAIN</span>
  </h1>
</header>
```

- 每个页面应该有且只有一个 h1
- 用 span 替代 div 保持 flex 布局
- CSS 的 `.hero-text div` 选择器要同步改成 `.hero-text span`

---

## 10. 实施步骤与验收标准

### 10.1 MOARA@main 改动

| 步骤 | 文件 | 改动 |
| --- | --- | --- |
| 1 | `src/pages/index.astro` head | 加 meta description / canonical / OG / Twitter Card（见 §3） |
| 2 | `src/pages/index.astro` head | 加 WebSite JSON-LD（见 §6） |
| 3 | `src/pages/index.astro` hero | h1 改 div→span（见 §6） |
| 4 | `src/pages/index.astro` nav | 5 处 `<a onclick>` → `<a href + onclick>`（见 §5） |
| 5 | `public/robots.txt` | 新增文件（见 §4） |

### 10.2 验收标准

| # | 验收命令 | 期望结果 |
| --- | --- | --- |
| 1 | `curl -s https://blog.945426.xyz/ \| grep 'meta name="description"'` | 有输出 |
| 2 | `curl -s https://blog.945426.xyz/ \| grep 'rel="canonical"'` | 有输出，指向 `https://blog.945426.xyz/` |
| 3 | `curl -s https://blog.945426.xyz/ \| grep 'og:type'` | 有输出，content="website" |
| 4 | `curl -s https://blog.945426.xyz/ \| grep 'twitter:card'` | 有输出 |
| 5 | `curl -sI https://blog.945426.xyz/robots.txt` | HTTP 200 |
| 6 | `curl -s https://blog.945426.xyz/robots.txt` | 包含 `Sitemap: https://blog.945426.xyz/sitemap.xml` |
| 7 | `curl -s https://blog.945426.xyz/ \| grep 'pc-tag-trigger'` | 那行 `<a>` 有 `href=` |
| 8 | Lighthouse SEO（首页） | 83 → 100 |

### 10.3 实施顺序

1. **先 P0**：§3（首页 meta）+ §4（robots.txt）+ §5（nav href）→ 首页 SEO 83 → ~95
2. **再 P1**：§6（JSON-LD + h1 优化）→ 首页 95 → 100

---

## 附录：评分预期变化

| 阶段 | 首页 SEO | 文章页 SEO | 说明 |
| --- | --- | --- | --- |
| 当前 | 83 | 92 | 基线 |
| P0 完成 | ~95 | 92 | 首页补齐 meta/canonical/OG/Twitter/robots/nav href |
| P1 完成 | 100 | 92 | 首页加 JSON-LD + h1 优化 |

**关键洞察**：首页从 83 到 100 的核心是 3 件事 —— 补 meta description、补 canonical、给 nav `<a>` 加 href。这三件事做完，分数直接到 95+。JSON-LD 和 h1 优化是锦上添花到 100。

**文章页 92 分**：唯一扣分项是 Waline 评论系统运行时 img 缺 alt（爬虫不执行 JS，对实际 SEO 无影响），保持 92 即可，无需处理。
