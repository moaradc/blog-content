# MOARA SEO 零构建方案 · 实施文档 v1.1

> 版本：v1.1 · 日期：2026-08-01
> 相对 v1.0 的核心改动：**blog-content 生成的 HTML 直接引用主仓 blog.945426.xyz 的 CSS/JS 资源**，
> 不再在 blog-content 维护副本，降低维护成本。
> 涉及仓库：
> - `moaradc/blog-content@main`（公开，raw-posts.945426.xyz，GitHub Pages）
> - `moaradc/MOARA@main`（私有，blog.945426.xyz，Vercel）

---

## 一、v1.0 → v1.1 改动原因

### 1.1 v1.0 的问题

v1.0 在 blog-content 仓库 `docs/assets/` 维护了一份 CSS/JS/data-scripts 副本。这带来两个问题：

1. **维护成本高**：MOARA 修改 `article.js` / `global.css` / `article.astro` 内联样式时，
   需要手动同步到 blog-content，遗漏一处就出 bug
2. **`@custom-media` 不展开导致布局崩溃**：blog-content 副本不走 PostCSS 管道，
   `@media (--mobile)` 浏览器不识别，移动端响应式样式全部失效，
   访问 `https://raw-posts.945426.xyz/posts/101` 时布局塌方

### 1.2 v1.1 的解法

| 项 | v1.0 | v1.1 |
|---|---|---|
| CSS/JS 托管 | blog-content 自托管副本 | **直接引用主仓** `https://blog.945426.xyz/assets/...` |
| 资产维护 | 两份（需手动同步） | **一份**（只在 MOARA） |
| 命名断点展开 | blog-content 副本里手动展开 | 主仓已展开字面量（`expand-custom-media.cjs`） |
| 安全约束 | 不引用 blog.945426.xyz | **取消此约束**（用户授权） |
| middleware 拦截 | 不适用 | 已确认不拦截跨源 `<link>`/`<script>` |

### 1.3 可行性确认

1. ✅ MOARA 主仓 CSS 已迁到固定路径 `public/assets/css/{global,article}.css`，无构建 hash
2. ✅ `article.css` 的 `@media (--xxx)` 已展开为字面量
3. ✅ `global.css` 的 `@media (--xxx)` 已展开为字面量
4. ✅ `middleware.ts` 只拦截 `Sec-Fetch-Mode: navigate`（地址栏直访），
   跨源 `<link rel="stylesheet">` / `<script src>` 的 Sec-Fetch-Mode 是 `no-cors`，不被拦截
5. ✅ Vercel 静态资源 CORS 默认允许（响应头含 `access-control-allow-origin: *`）

---

## 二、最终架构（v1.1）

```
┌─────────────────────────────────────────────────────────────────┐
│  MOARA 仓库（私有，Vercel）                                      │
│                                                                  │
│  public/assets/css/global.css      ← 固定路径，无 hash           │
│  public/assets/css/article.css     ← 固定路径，无 hash           │
│  public/assets/js/article.js       ← 固定路径                    │
│  public/assets/js/marked.min.js    ← 固定路径                    │
│  public/assets/js/scroll-nav.js                                       │
│  public/assets/js/marquee-control.js                                  │
│  public/assets/js/noise.js                                            │
│  public/assets/data-scripts/{config,users,about,feature-switch}.js    │
│  public/assets/img/icon/{favicon,moara}.webp|jpg|png                  │
│  public/assets/img/users/{anonymous.webp,lamb.jpg}                    │
│                                                                  │
│  vercel.json 加 rewrite：                                         │
│    /posts/:id → https://raw-posts.945426.xyz/posts/:id.html      │
│                                                                  │
│  article.js getQueryParam 增强（支持 data-article-id + 路径路由） │
│                                                                  │
│  → Vercel 部署 → https://blog.945426.xyz                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ blog-content HTML 通过绝对 URL 引用：
                               │   https://blog.945426.xyz/assets/css/global.css
                               │   https://blog.945426.xyz/assets/css/article.css
                               │   https://blog.945426.xyz/assets/js/article.js
                               │   ...
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  blog-content 仓库（公开，已存在）                                │
│                                                                  │
│  源文件：                                                         │
│  ├── docs/posts/*.md        ← PagesCMS 写入                      │
│  └── template/article.html  ← 【新增】HTML 模板（引用主仓资源）   │
│                                                                  │
│  不再有 docs/assets/ 副本（v1.0 的副本删除）                      │
│                                                                  │
│  GitHub Action 产物（push 触发）：                                │
│  ├── docs/posts.json         ← 已存在                            │
│  ├── docs/posts-{n}.json     ← 已存在                            │
│  ├── docs/sitemap.xml        ← 已存在（URL 改为 /posts/{id}）     │
│  ├── docs/rss.xml            ← 已存在                            │
│  └── docs/posts/{id}.html    ← 【新增】每篇 SEO HTML              │
│                                                                  │
│  → GitHub Pages 部署 → https://raw-posts.945426.xyz               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 资源引用关系

| 资源 | blog-content HTML 中 | MOARA article.astro 中 |
|---|---|---|
| global.css | `https://blog.945426.xyz/assets/css/global.css` | `/assets/css/global.css` |
| article.css | `https://blog.945426.xyz/assets/css/article.css` | `/assets/css/article.css` |
| article.js | `https://blog.945426.xyz/assets/js/article.js` | `/assets/js/article.js` |
| marked.min.js | `https://blog.945426.xyz/assets/js/marked.min.js` | `/assets/js/marked.min.js` |
| data-scripts/* | `https://blog.945426.xyz/assets/data-scripts/*.js` | `/assets/data-scripts/*.js` |
| 作者头像 | `https://blog.945426.xyz/assets/img/icon/moara.webp` | `/assets/img/icon/moara.webp` |
| 第三方库 | `https://unpkg.com/...` / `https://cdnjs.cloudflare.com/...` | 同左 |

**关键**：blog-content HTML 用绝对 URL 引用主仓资源，主仓资源改了不需要同步副本。

### 2.2 数据流（用户访问 `/posts/123`）

```
1. 浏览器 → blog.945426.xyz/posts/123
2. Vercel rewrite → raw-posts.945426.xyz/posts/123.html  (15KB)
3. 浏览器解析 HTML，并行加载：
   - https://blog.945426.xyz/assets/css/global.css       (Vercel CDN)
   - https://blog.945426.xyz/assets/css/article.css      (Vercel CDN)
   - https://blog.945426.xyz/assets/js/article.js        (Vercel CDN)
   - https://blog.945426.xyz/assets/js/marked.min.js     (Vercel CDN)
   - https://blog.945426.xyz/assets/data-scripts/*.js    (Vercel CDN)
   - https://blog.945426.xyz/assets/img/icon/moara.webp  (Vercel CDN)
   - https://unpkg.com/...         (第三方 CDN)
   - https://cdnjs.cloudflare.com/...  (第三方 CDN)
4. 浏览器执行 article.js：
   - 从 #article-view[data-article-id] 拿到 ID
   - fetch https://raw-posts.945426.xyz/posts/123.md → marked.parse → 替换 #detail-content
   - 初始化 Waline、TOC、侧边栏、搜索等
5. 爬虫 / 禁用 JS 用户：
   - 看到 <title>、<meta>、<h1>、摘要正文（前 600 字 HTML）
   - noscript 兜底链接到原始 md
```

---

## 三、文件清单与改动

### 3.1 blog-content 仓库新增文件

| 路径 | 用途 |
|---|---|
| `IMPLEMENTATION.md` | 本文档 |
| `template/article.html` | SEO HTML 模板（**引用主仓绝对 URL**） |
| `generate-article-html.js` | 生成器脚本 |
| `docs/posts/{id}.html` | Action 生成，每篇 SEO HTML |

### 3.2 blog-content 仓库修改文件

| 路径 | 改动 |
|---|---|
| `site.js` | `postUrl(id)` 改为 `/posts/{id}` |
| `.github/workflows/generate-posts-json.yml` | 追加 `generate-article-html.js` 步骤 |

### 3.3 blog-content 仓库**不**新增（相对 v1.0）

- ❌ `docs/assets/` 副本目录（不再维护）
- ❌ `docs/assets/css/article-detail.css`（直接用主仓 article.css）

### 3.4 MOARA 仓库修改文件

| 路径 | 改动 |
|---|---|
| `vercel.json` | rewrites 加 `/posts/:id → raw-posts` |
| `public/assets/js/article.js` | `getQueryParam` 增强（支持 data-article-id + 路径路由） |

### 3.5 MOARA 仓库**不动**的文件

- `src/pages/details/article.astro`（保留作开发态与旧 URL 兼容入口）
- `public/assets/css/global.css` / `article.css`（已迁好，固定路径）
- `src/layouts/BaseLayout.astro` / `index.astro` / `midi_info.astro`
- `astro.config.mjs` / `middleware.ts` / `postcss.config.mjs`

---

## 四、详细实施步骤

### 4.1 编写 HTML 模板 `template/article.html`

模板关键点：
- `<head>` 中所有 CSS/JS 用 `https://blog.945426.xyz/assets/...` 绝对 URL
- `<body>` 结构与 article.astro 完全一致（marquee/loader/nav/article-view/sidebar/lightbox/scroll-controls）
- `<noscript>` 兜底
- `data-article-id` 属性让 article.js 识别当前文章
- `<h1>` 直出真实标题，`.article-body` 内嵌摘要正文（前 600 字 HTML）

### 4.2 编写生成器 `generate-article-html.js`

扫描 `docs/posts/*.md`，对每篇：
1. 解析 frontmatter
2. marked 渲染正文 → 截前 600 字 HTML 作为摘要
3. 提取纯文本前 200 字作为 description
4. 填充模板占位符
5. 输出 `docs/posts/{id}.html`

### 4.3 修改 site.js

`postUrl(id)` 从 `/details/article?id=` 改为 `/posts/`，影响 sitemap.xml + rss.xml 中所有文章链接。

### 4.4 修改 GitHub Action

`.github/workflows/generate-posts-json.yml` 在 `generate-sitemap.js` 之后追加：
```yaml
- name: Generate article SEO HTML
  run: node generate-article-html.js
```

### 4.5 MOARA 主仓改动

#### 4.5.1 `vercel.json` 加 rewrite

```json
{
  "rewrites": [
    { "source": "/rss.xml", "destination": "https://raw-posts.945426.xyz/rss.xml" },
    { "source": "/sitemap.xml", "destination": "https://raw-posts.945426.xyz/sitemap.xml" },
    { "source": "/posts/:id", "destination": "https://raw-posts.945426.xyz/posts/:id.html" }
  ],
  "headers": [ ... 保持不变 ... ]
}
```

#### 4.5.2 `article.js` 增强 `getQueryParam`

向后兼容三种 ID 来源：

```javascript
function getQueryParam(param) {
  if (param === 'id') {
    // 1. URL 查询参数（旧路由 /details/article?id=123）
    const v = new URLSearchParams(window.location.search).get(param);
    if (v) return v;
    // 2. data-article-id 属性（SEO HTML 直出，blog-content 生成）
    const view = document.getElementById('article-view');
    if (view && view.dataset.articleId) return view.dataset.articleId;
    // 3. 路径路由（/posts/123，vercel rewrite 到 raw-posts/posts/123.html）
    const m = window.location.pathname.match(/^\/posts\/([^\/?#]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return new URLSearchParams(window.location.search).get(param);
}
```

---

## 五、安全约束说明（v1.1 修订）

### 5.1 v1.0 约束（已取消）

> 为了安全性我明确禁止你类似外仓库引用 https://blog.945426.xyz/assets/css/article-detail.css！

### 5.2 v1.1 用户授权

> 这次我需要你先修改方案，直接引用主仓库的资源吧，减少维护成本。

### 5.3 安全分析

blog-content HTML 引用主仓 CSS/JS 的安全风险：
- ✅ 主仓 CSS/JS 是公开静态资源（Vercel 静态托管）
- ✅ 主仓仓库私有 ≠ 部署产物私有（`blog.945426.xyz/assets/*` 任何人可访问）
- ✅ middleware 不拦截跨源 `<link>` / `<script>`（Sec-Fetch-Mode 不是 navigate）
- ⚠️ 主仓改 CSS/JS 路径或文件名时，blog-content HTML 会引用失效 → 这是显式接受的代价

### 5.4 反向引用（MOARA → raw-posts）

MOARA 主仓继续引用 raw-posts 拉取 `.md` / `posts.json` / `music.json`（已有行为）。

---

## 六、维护策略（v1.1 简化）

### 6.1 资产维护流程

当 MOARA 修改 `article.js` / `global.css` / `article.css` 时：
1. 在 MOARA 仓库 commit + push → Vercel 自动部署
2. **不需要同步到 blog-content**（v1.1 关键改进）
3. blog-content 的 HTML 通过绝对 URL 自动指向最新版本

⚠️ 注意：如果 MOARA 改了文件名或路径（如 `article.css` 改名为 `article-detail.css`），
需要同步修改 blog-content 的 `template/article.html`。

### 6.2 新增文章流程

1. PagesCMS 编辑器写文章 → 推送到 `docs/posts/{id}.md`
2. GitHub Action 自动触发：
   - clean-frontmatter.js
   - generate-posts.js（更新 posts.json）
   - generate-sitemap.js
   - **generate-article-html.js（新增）**
3. Action 把生成的 `docs/posts/{id}.html` commit 回 main
4. GitHub Pages 部署
5. 用户访问 `https://blog.945426.xyz/posts/{id}` → Vercel rewrite → raw-posts HTML

**关键**：主仓 MOARA 完全不参与此流程，零构建零部署。

---

## 七、回滚方案

### 7.1 回滚 blog-content

```bash
cd blog-content
git revert <commit-sha>  # 撤销 HTML 生成相关提交
git push origin main
```

### 7.2 回滚 MOARA

```bash
cd MOARA
git revert <commit-sha>  # 撤销 vercel.json rewrite + article.js getQueryParam
git push origin main
```

### 7.3 级联回滚

先回滚 MOARA（移除 rewrite），再回滚 blog-content（移除 HTML 生成）。
过渡期访问 `/posts/{id}` 是 404 而不是 502。

---

## 八、验证检查清单

### 8.1 本地验证

- [ ] blog-content `node generate-article-html.js` 成功生成 `docs/posts/{id}.html`
- [ ] 生成的 HTML `<title>` 是真实文章标题
- [ ] 生成的 HTML `<meta name="description">` 非空
- [ ] 生成的 HTML `<link rel="canonical">` 指向 `https://blog.945426.xyz/posts/{id}`
- [ ] 生成的 HTML JSON-LD `@type` 是 `BlogPosting`
- [ ] 生成的 HTML `.article-body` 有摘要正文
- [ ] 生成的 HTML `<noscript>` 有 md 链接
- [ ] 生成的 HTML 中 CSS 引用是 `https://blog.945426.xyz/assets/css/...`
- [ ] Playwright 访问本地 HTML：CSS 加载成功（body 背景色 = `--bg-color`）
- [ ] Playwright 控制台无 error

### 8.2 生产验证

- [ ] `curl https://blog.945426.xyz/posts/101` 返回 200
- [ ] 返回的 HTML `<title>` 是真实标题
- [ ] 返回的 HTML 包含 `og:title` / `twitter:card` / `ld+json`
- [ ] Playwright 访问生产 URL：无 console error
- [ ] Playwright 访问生产 URL：`#detail-content` 渲染完整正文
- [ ] 三视口（mobile/tablet/desktop）布局正常

### 8.3 兼容性验证

- [ ] 旧链接 `https://blog.945426.xyz/details/article?id=101` 仍可访问
- [ ] 旧链接渲染正常（article.js 兼容旧 query param 模式）
- [ ] sitemap.xml 中 URL 全部为 `/posts/{id}` 格式
- [ ] RSS 中文章链接全部为 `/posts/{id}` 格式

---

**END OF DOCUMENT v1.1**
