---
title: 我是怎么给纯前端博客做 SEO 的
date: 2026-08-01 12:00
last_modified: 2026-08-01 12:00
author: Admin
category: ["技术"]
tags: ["SEO", "Astro", "前后端分离"]
desc: 一个 Astro 纯静态博客，文章数据放在独立仓库通过 CDN 提供。本文记录从 SPA 空壳到爬虫可见完整正文的 SEO 落地过程，以及中途放弃的 Edge Function 方案。
image: https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?q=80&w=1200&auto=format&fit=crop
---
## 起点和一个不能接受的事实

博客主站用 Astro 静态构建，部署在 Vercel；文章 markdown 放在独立的公开仓库，通过 GitHub Pages 提供 CDN 服务（`raw-posts.945426.xyz`）。主仓私有，内容仓公开，两者彻底分离——这是为了 100 多篇博文加上千张图片共 300MB 资源不拖累主仓的 CI/CD。

但分离有个代价：文章详情页 `article.astro` 构建后只有 4 行——`<title>加载中...</title>` 加一个空 `<div id="article-view">`，正文靠 `article.js` 运行时 `fetch` markdown 再用 marked 渲染。爬虫看到的是空壳，SEO 完全失效。

## 目标和约束

需要做到：

1. 每篇文章有独立静态 HTML，含完整 head 元数据 + 正文
2. 主仓零构建——发文只触发内容仓的 Action，不触发主仓 CI
3. 纯前端——无 Node 运行时、无 Edge Function、无 SSR
4. 旧链接 `/details/article?id=xxx` 继续可用

## 方案：内容仓构建期生成 SEO HTML

最终落地的方案很直接：在内容仓的 GitHub Action 里加一个生成器脚本，扫描 `docs/posts/*.md`，为每篇文章生成一个带完整 SEO 的静态 HTML。

### 工作流

```
PagesCMS 写文章 → push 到 blog-content/docs/posts/{id}.md
                          ↓
              GitHub Action 自动触发（4 步流水线）
              1. clean-frontmatter.js     增量清理 frontmatter
              2. generate-posts.js        生成 posts.json 索引
              3. generate-sitemap.js      生成 sitemap.xml
              4. generate-article-html.js 生成每篇 SEO HTML ← 新增
                          ↓
              git commit + push [skip ci]
                          ↓
              GitHub Pages 部署 → raw-posts.945426.xyz
                          ↓
              用户访问 blog.945426.xyz/posts/{id}
              → Vercel rewrite（配置层字符串映射，0 次 Function 调用）
              → raw-posts.945426.xyz/posts/{id}.html
```

主仓 `vercel.json` 加一条 rewrite 规则：

```json
{
  "source": "/posts/:id",
  "destination": "https://raw-posts.945426.xyz/posts/:id.html"
}
```

### 生成器做了什么

对每篇 markdown：

1. 解析 frontmatter（title/date/author/category/tags/image 等）
2. 用 marked 渲染全文为 HTML，与客户端 `article.js` 的 marked 配置字节级对齐（`breaks: true, gfm: true`）
3. `protectCustomTags` 保护 `<music>`/`<gallery>`/`<spoiler>` 等自定义标签不被 marked 截断
4. 填充模板占位符：title/description/canonical/OG/JSON-LD/完整正文
5. 输出 `docs/posts/{id}.html`

JSON-LD 用数组形式注入两项：`BlogPosting`（含 `articleBody` 纯文本全文）+ `BreadcrumbList`（3 级面包屑：首页 → 归档 → 当前文章）。

### article.js 的配合改动

这是方案的关键一环。生成的 HTML 已经含完整正文，如果 `article.js` 运行时还 `fetch .md` 再渲染一次，就浪费了。

改动：`initArticle()` 检测 `#detail-content` 是否已有正文子元素。有就跳过 fetch，直接从 `data-article-meta` 属性读取 frontmatter JSON 构造 data 对象；没有就走旧路径 fetch md（兼容旧路由）。

```javascript
const existingContent = document.getElementById('detail-content');
const hasPrerenderedContent = existingContent && existingContent.children.length > 0;

if (hasPrerenderedContent) {
  // 从 data-article-meta 读取 frontmatter，跳过 fetch
  const view = document.getElementById('article-view');
  const meta = JSON.parse(view.dataset.articleMeta);
  data = { ...meta, content: existingContent.innerHTML };
} else {
  // 旧路径：fetch .md + marked 渲染
  const response = await fetch(POSTS_MD_BASE + articleId + '.md');
  // ...
}
```

收益：运行时零 fetch .md，浏览器首屏直接显示完整正文，无闪烁。

## 为什么放弃了 Edge Function 方案

中途认真考虑过参考 test2 仓库的方案：主仓加一个 Vercel Edge Function，请求 `/posts/{id}` 时服务端 fetch markdown + marked 渲染 + 注入 SEO head，返回完整 HTML。

这个方案看起来更优雅——单仓维护、同源资源、框架式注入。但有两个硬伤：

### 1. UA 分流不可行

最初设想用 `vercel.json` 的 `has` 条件按 UA 分流：爬虫请求走 Edge Function 预渲染，浏览器请求走静态空壳。这样浏览器 0 次 Function 调用，省 Vercel 配额。

但爬虫 UA 会变。新爬虫（DeepSeek、各种 AI Agent）UA 不在正则里，会被当浏览器放行，爬虫拿到空壳——回到原点。

如果改成所有 UA 都走 Edge Function（test2 最终方案），每次访问消耗 1 次 Function 调用。Vercel Hobby 免费额度 100 万次/月，日常流量够用，但一旦被 Reddit/V2EX 转发或 AI 爬虫扫站，配额瞬间爆掉，超限直接 503。

### 2. 复杂度高，收益不抵成本

Edge Function 方案需要：`api/prerender.ts` + `src/lib/seo/route-meta.ts` + `render-article.ts` + `inject.ts` + `[slug].astro` + BaseLayout 注入点 + middleware 改造。6 个新文件，逻辑复杂。

而内容仓生成器方案只需要：1 个生成器脚本 + 1 个模板 + 1 条 vercel rewrite + article.js 加几行跳过逻辑。运行时 0 次 Function 调用，纯静态。

**构建期一次性渲染，永远比运行时渲染好。**

## 碰到的实质性问题

### 1. @custom-media 不展开导致移动端布局崩溃

主仓 CSS 用了 `@custom-media --mobile (max-width: 767px);` 命名断点，原本由 `postcss-custom-media` 在构建期展开。但内容仓生成的 HTML 引用主仓 CSS 时，CSS 已经过 PostCSS 处理——看似没问题。

实际 v1.0 方案在内容仓维护了一份 CSS 副本（不走 PostCSS），`@media (--mobile)` 浏览器不识别，移动端响应式全部失效，访问 `raw-posts.945426.xyz/posts/101` 时布局塌方。

解法：主仓把 `global.css` 和 `article.css` 迁到 `public/assets/css/`（固定路径，无构建 hash），手动把所有 `@media (--xxx)` 展开为字面量 `@media (max-width: 767px)`，删除 `@custom-media` 声明和 `postcss-custom-media` 插件。

### 2. 跨域资源引用 + middleware 拦截

内容仓 HTML 部署在 `raw-posts.945426.xyz`，CSS/JS 在 `blog.945426.xyz`。最初用相对路径 `/assets/css/global.css`，浏览器解析成 `raw-posts.945426.xyz/assets/css/global.css`——但 raw-posts 没有这些文件，404。

改成主仓绝对 URL `https://blog.945426.xyz/assets/css/global.css` 后，又撞上主仓 `middleware.ts` 的 `PROTECTED_PREFIXES`——`Sec-Fetch-Mode: navigate` 时拦截 `/assets/css|js|data-scripts/`。

确认跨源 `<link>` / `<script>` 的 `Sec-Fetch-Mode` 是 `no-cors` 不被拦截后，方案才跑通。

### 3. 作者头像 404

`users.js` 里 `Anonymous` 的 avatar 是相对路径 `/assets/img/users/anonymous.webp`。内容仓 HTML 在 raw-posts 域名下，相对路径解析成 `raw-posts.945426.xyz/assets/img/users/anonymous.webp`——404，因为图片在主仓。

解法：`article.js` 检测当前 origin 非主仓时，自动给相对路径 avatar 加主仓前缀。

### 4. Cloudflare Email Obfuscation 注入 404 脚本

`raw-posts.945426.xyz` 通过 Cloudflare，CF 启用了 Email Address Obfuscation。HTML 里的 `mailto:moara@foxmail.com` 被 CF 自动替换成混淆链接，并注入 `/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js`。

但主仓 `blog.945426.xyz` 在 Vercel，没有 CF 这层，访问 `/cdn-cgi/*` 直接 404，控制台报错。

### 5. 上/下一篇导航链接拼接错误

`article.js` 的 `renderArticleNavigation` 用 `href="?id=${prevArticle.id}"` 相对查询参数。在 `/posts/103` 页面点击会拼成 `/posts/103?id=104`——错误。

改成绝对路径 `href="/posts/${prevArticle.id}"` 解决。

### 6. 禁用 JS 一直显示加载页面

`#global-loader` 默认显示，由 `article.js` 的 `playIntroAnimation` 隐藏。禁用 JS 时 loader 永远不隐藏，遮住完整正文。

解法：`<noscript><style>` 强制隐藏 loader + 恢复 GSAP 初始隐藏的元素 opacity。

## 增量生成

最后一步优化：生成器从全量扫描改为增量。

与 `clean-frontmatter.js` 一致的增量模式——workflow 用 `git diff --name-only` 取变更的 .md 文件路径，通过命令行参数传给生成器。日常发文只重新生成 1 篇 HTML，不再全量重建 100 篇。

已删除的 .md 路径也传进来，生成器检测到 .md 不存在时清理对应 .html。

## 最终架构

```
blog-content 仓库（公开，GitHub Pages）
├── docs/posts/*.md           ← PagesCMS 写入
├── template/article.html     ← HTML 模板
├── generate-article-html.js  ← 生成器（增量）
└── docs/posts/{id}.html      ← Action 生成

MOARA 仓库（私有，Vercel）
├── vercel.json               ← /posts/:id rewrite 到 raw-posts
├── public/assets/css/        ← 固定路径 CSS（无 hash）
├── public/assets/js/article.js ← 检测已有正文跳过 fetch
└── src/pages/details/article.astro ← 保留作旧路由兼容
```

## 验证

Google 富媒体测试工具检测到两项有效内容：

- **BlogPosting**：headline / description / image / author / datePublished / articleBody（完整正文纯文本）/ mainEntityOfPage 全部识别
- **BreadcrumbList**：3 级面包屑全部解析

无警告，无错误。

## 小结

整个方案的核心就一句话：**构建期一次性渲染，运行时零成本。**

具体落地时碰到的坑不少——@custom-media 不展开、跨域 middleware 拦截、头像相对路径、CF email 混淆、导航链接拼接、禁用 JS 加载遮罩——每一个都是实质性问题，但都是可解的。

放弃 Edge Function 方案是因为"运行时渲染"这个方向本身就比"构建期渲染"差。能用静态 HTML 解决的事，不要用 Function。
