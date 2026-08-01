---
title: 折腾博客 SEO 这件事
date: 2026-08-01 12:00
last_modified: 2026-08-01 12:00
author: Admin
category: ["技术"]
tags: ["SEO", "Astro"]
desc: 博客文章放在另一个仓库，主站构建后是个空壳，爬虫什么都看不到。记录一下怎么把这个坑填上的。
image: https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?q=80&w=1200&auto=format&fit=crop
---

## 事情是这样的

博客用 Astro 写的，部署在 Vercel。文章 markdown 单独放在一个公开仓库，走 GitHub Pages 当 CDN 用。分仓的理由很实在——一百多篇文章加图片三百多兆，塞主仓里每次 clone 都要等半天，CI/CD 也慢。

但这么搞有个后遗症：文章详情页构建出来就 4 行，title 写着"加载中..."，body 里一个空 div，正文全靠 article.js 运行时 fetch markdown 再渲染。用户看着没问题，爬虫看到的就一空壳。

Google 收录倒是收了，但搜出来标题永远是"加载中"。

## 想达到什么效果

其实就三点：

- 爬虫能看到真实的标题、正文、元数据
- 发文章不触发主仓构建（内容仓自己玩自己的）
- 别搞 Node 服务端，纯静态

## 试过的弯路

中途偷了 moaradc/test2 仓库的方案来看。那套思路挺 fancy 的——主仓加个 Vercel Edge Function，请求文章页时服务端拉 markdown、marked 渲染、注入 SEO head，返回完整 HTML。

本来想按 UA 分流：爬虫走 Function 预渲染，浏览器走静态空壳，省 Function 调用次数。结果发现根本分不动——爬虫 UA 会变，今天 Googlebot 明天 ClaudeBot 后天不知道什么 Bot，正则永远写不全。漏一个就是空壳。

那不分了，所有请求都走 Function？算过账，Vercel 免费额度 100 万次/月，平时够用，但哪天被 V2EX 一转发或者 AI 爬虫一扫，配额直接见底，超了就 503。

而且那套方案要加 6 个文件，Edge Function + SEO 注入库 + render 模块 + inject 模块 + 路由元数据 + BaseLayout 改造，光看代码就头大。

想了想，**能用静态 HTML 解决的事，干嘛要跑 Function**。放弃了。

## 最后怎么做的

还是分仓那条路，只是让内容仓的 GitHub Action 多干一件事：扫描所有 markdown，给每篇生成一个带完整 SEO 的静态 HTML。

流水线长这样：

```
写文章 → push 到内容仓
         ↓
GitHub Action 跑 4 步：
  1. 清理 frontmatter
  2. 生成 posts.json 索引
  3. 生成 sitemap
  4. 生成每篇 SEO HTML    ← 新加的
         ↓
commit 回去，Pages 自动部署
         ↓
用户访问 blog.945426.xyz/posts/101
  → Vercel rewrite 到 raw-posts/posts/101.html
  → 拿到完整 HTML
```

主仓就加了一条 rewrite 规则，其他啥都没动。配置层字符串映射，0 次 Function 调用。

生成器干的事也不复杂：读 markdown，marked 渲染全文，填模板占位符，输出 HTML。JSON-LD 塞了两个——BlogPosting 带 articleBody 全文，加个 3 级面包屑。Google 富媒体测试一跑，两项全绿。

## article.js 的配合

这里有个关键点。生成的 HTML 已经有完整正文了，article.js 运行时要是还 fetch 一遍 markdown 再渲染，那就白搞了——多一次网络请求，还闪一下。

改了 initArticle：先看 #detail-content 有没有内容，有就跳过 fetch，直接用。frontmatter 数据通过 data-article-meta 属性传过去，JSON parse 一下就行。

```javascript
const hasContent = document.querySelector('#detail-content').children.length > 0;
if (hasContent) {
  // HTML 已经有正文，跳过 fetch
  const meta = JSON.parse(view.dataset.articleMeta);
  data = { ...meta, content: existingContent.innerHTML };
} else {
  // 旧路径：fetch md + marked 渲染
}
```

效果：首屏直接是完整正文，不闪，还少一次请求。

## 踩的坑

说起来都是泪。

**@custom-media 不展开**。主仓 CSS 用了 `@custom-media --mobile` 命名断点，本来 PostCSS 构建时展开。v1.0 方案在内容仓放了份 CSS 副本不走 PostCSS，`@media (--mobile)` 浏览器不认识，移动端布局直接塌。最后把主仓 CSS 全迁到 public/ 固定路径，手动把 @media 全展开成字面量，连 postcss-custom-media 插件都删了。

**跨域资源 404**。内容仓 HTML 在 raw-posts 域名，CSS/JS 在主仓域名。一开始用相对路径，浏览器解析成 raw-posts 上的路径，没有，404。改成主仓绝对 URL，又撞上主仓 middleware 的 403 保护。后来确认跨源 `<link>` 的 Sec-Fetch-Mode 是 no-cors 不被拦，才通。

**作者头像 404**。users.js 里头像是相对路径 `/assets/img/users/anonymous.webp`，在 raw-posts 域名下解析过去还是 404。article.js 里加了个域名检测，非主仓就自动补前缀。

**Cloudflare 乱注入脚本**。raw-posts 走 Cloudflare，CF 检测到 HTML 里有 email 就自动替换成混淆链接，还塞了个 email-decode.min.js。但主仓在 Vercel 没这层，访问 /cdn-cgi/* 就 404。最后把模板里 .profile-social 留空，让 article.js 运行时填，HTML 里彻底没有 email 字符串。

**上/下一篇链接拼错**。article.js 里 href 写的是 `?id=102`，在 `/posts/101` 页面点击会拼成 `/posts/101?id=102`。改成绝对路径 `/posts/102` 才对。

**禁用 JS 一直转圈**。加载遮罩默认显示，靠 article.js 隐藏。禁用 JS 就永远转，正文被遮住。加了 noscript 样式强制隐藏 loader 才好。

每个坑都不大，但连着踩也是心累。

## 最后的优化

生成器一开始是全量扫描，发一篇文章也把 100 篇全重新生成一遍。后来改成增量，跟 clean-frontmatter.js 一个套路——workflow 用 git diff 取变更的文件，传给生成器，只处理改动的那些篇。删掉的文件也传进来，顺手清理对应的 HTML。

日常发文现在只生成 1 篇，秒完。

## 就这样

回头看其实方案挺朴素的——构建期把活干完，运行时纯静态。没什么花活，但中间踩的坑不少。

放弃了 Edge Function 那套 fancy 方案，不是因为不好，是没必要。静态 HTML 能搞定的事，别上 Function。
