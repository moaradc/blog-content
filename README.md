# moaradc/blog-content

博客文章和媒体的存储仓库，通过 GitHub Pages 提供 CDN 服务。

## 用途

- 通过 [PagesCMS](https://app.pagescms.org/moaradc/blog-content/main) 在线编辑文章
- 博客主站 ([moaradc/test2](https://github.com/moaradc/test2)) 通过 `https://raw-posts.945426.xyz` 运行时 fetch 内容
- `posts.json` 和 `rss.xml` 由 GitHub Action 自动生成

## 结构

```
blog-content/
├── .pages.yml                    # PagesCMS 配置
├── .github/workflows/
│   ├── generate-posts-json.yml   # push 触发，生成 posts.json
│   └── generate-rss.yml          # 手动触发，生成 rss.xml
├── clean-frontmatter.js          # 清理 frontmatter + 替换 /img/ 为绝对 URL
├── generate-posts.js             # 生成 docs/posts.json
├── generate-rss.js               # 生成 docs/rss.xml
├── posts/                        # 文章 markdown 文件（源文件）
│   ├── 101.md
│   └── ...
└── docs/                         # GitHub Pages 服务目录
    ├── CNAME                     # 绑定域名 raw-posts.945426.xyz
    ├── img/                      # 图片媒体
    ├── music/                    # 音乐文件
    ├── others/                   # 其他文件
    ├── posts.json                # 自动生成（文章列表）
    └── rss.xml                   # 自动生成（RSS 订阅）
```

## 访问方式

通过 GitHub Pages 自定义域名（`raw-posts.945426.xyz`）：
- **文章列表**: `https://raw-posts.945426.xyz/posts.json`
- **单篇文章**: `https://raw-posts.945426.xyz/posts/107.md`（注：posts/ 不在 docs/ 下，需通过 GitHub raw 访问）
- **图片**: `https://raw-posts.945426.xyz/img/xxx.jpg`
- **RSS**: `https://raw-posts.945426.xyz/rss.xml`

## 编辑

访问 [PagesCMS](https://app.pagescms.org/moaradc/blog-content/main) 使用在线编辑器。

## 自动化

| Workflow | 触发 | 作用 |
|---|---|---|
| `generate-posts-json.yml` | push 到 posts/ | 清理 frontmatter + 替换图片路径 + 生成 posts.json |
| `generate-rss.yml` | 手动（PagesCMS Actions） | 生成 rss.xml |

## 配置

- `SITE_URL` GitHub Actions 变量：`https://raw-posts.945426.xyz`
  - 用于 `clean-frontmatter.js` 把 `/img/` 替换为绝对 URL
  - 修改此变量即可切换 CDN 域名
