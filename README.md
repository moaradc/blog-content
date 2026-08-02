# moaradc/blog-content

博客文章与媒体的存储仓库，通过 Cloudflare Workers 提供内容 CDN。

## 分支

- `cms` —— 源码、文章、生成脚本、自动产物。Pages CMS 与日常修改进这里
- `main` —— 只有 `dist/` + `wrangler.jsonc`，由 release.yml 强推孤儿分支，Cloudflare Workers Builds 部署

## 用途

- 通过 [PagesCMS](https://app.pagescms.org/moaradc/blog-content/cms/collection/posts) 在线编辑文章
- 博客主站 [blog.945426.xyz](https://blog.945426.xyz) 运行时 fetch 内容
- `posts.json` / `posts-{n}.json` / `sitemap.xml` / `rss.xml` 由 GitHub Action 自动生成

## 自动化

| Workflow | 触发 | 作用 |
| --- | --- | --- |
| `generate-posts-json.yml` | push 到 cms | clean-frontmatter → generate-posts → generate-sitemap → generate-article-html，产物 commit 回 cms |
| `generate-rss.yml` | 手动 | 生成 rss.xml |
| `release.yml` | 手动 | 把 cms 的 docs/ 打包成 dist/ 强推到 main |

## 访问

- 内容 CDN：`https://raw-posts.945426.xyz`
- 文章索引：`/posts.json`
- RSS：`/rss.xml`
- 站点地图：`/sitemap.xml`
- 单篇文章 Markdown：`/posts/<id>.md`
- 单篇HTML文章：`/posts/<id>`

## 配置

GitHub Actions Variables（Settings → Secrets and variables → Actions → Variables）：

- `SITE_URL` —— 内容 CDN 地址，如 `https://raw-posts.945426.xyz`
- `BLOG_URL` —— 主站地址，如 `https://blog.945426.xyz`
