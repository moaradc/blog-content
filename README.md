# moaradc/blog-content

博客文章和媒体的存储仓库，通过 GitHub Pages 提供 CDN 服务。

## 用途

- 通过 [PagesCMS](https://app.pagescms.org/moaradc/blog-content/main) 在线编辑文章
- 博客主站 ([moaradc/test2](https://github.com/moaradc/test2)) 通过 `https://raw-posts.945426.xyz` 运行时 fetch 内容
- `posts.json`（索引对象）+ `posts-{n}.json`（分页文件）和 `rss.xml` 由 GitHub Action 自动生成

## 结构

```
blog-content/
├── .pages.yml                    # PagesCMS 配置
├── .github/workflows/
│   ├── generate-posts-json.yml   # push 触发，生成 posts.json + posts-{n}.json
│   └── generate-rss.yml          # 手动触发，生成 rss.xml
├── clean-frontmatter.js          # 清理 frontmatter + 替换 /img/ 为绝对 URL
├── generate-posts.js             # 生成 docs/posts.json + docs/posts-{n}.json
├── generate-rss.js               # 生成 docs/rss.xml
├── posts/                        # 文章 markdown 文件（源文件）
│   ├── 101.md
│   └── ...
└── docs/                         # GitHub Pages 服务目录
    ├── CNAME                     # 绑定域名 raw-posts.945426.xyz
    ├── img/                      # 图片媒体
    ├── music/                    # 音乐文件
    ├── others/                   # 其他文件
    ├── posts.json                # 自动生成（索引对象，含分页元信息 + 全量可见文章）
    ├── posts-0.json              # 自动生成（第 0 页，perPage=16）
    ├── posts-1.json              # 自动生成（第 1 页）
    ├── ...                       # 文章增多时自动新增；减少时自动清理
    └── rss.xml                   # 自动生成（RSS 订阅）
```

## 分页 / 索引

参考 [afoim/eleventy-blog-pagescms](https://github.com/afoim/eleventy-blog-pagescms) 的分页模式。

### `posts.json`（索引对象）

```json
{
  "generatedAt": "2026-07-25T00:00:00.000Z",
  "perPage": 16,
  "total": 7,
  "pageCount": 1,
  "posts": [ /* 全量可见文章，pinned 优先 + date 降序 */ ]
}
```

- **可见文章** = 非 `locked`、非 `draft` 的文章
- **排序** = `pinned: true` 优先，再按 `date` 降序
- 前端既可直接用 `.posts` 全量渲染，也可按页拉取分页文件

### `posts-{n}.json`（分页文件）

```json
{
  "page": 0,
  "perPage": 16,
  "total": 7,
  "pageCount": 1,
  "posts": [ /* 第 n 页的文章切片，perPage=16 */ ]
}
```

- 文件命名 `posts-0.json` ~ `posts-{pageCount-1}.json`
- 每页 `perPage = 16` 篇文章
- 当文章总数减少导致 `pageCount` 缩小时，脚本自动清理多余的 `posts-{n}.json`

### 前端集成

| 用法 | fetch |
|---|---|
| 全量渲染 | `GET /posts.json` → 用 `data.posts` |
| 分页渲染（第 n 页） | `GET /posts-{n}.json` → 用 `data.posts`，`data.pageCount` 控制页码器 |
| 首页/列表首屏 | `GET /posts-0.json`（最小负载，仅 16 篇） |

> ⚠️ **Breaking change**: `posts.json` 从「裸数组」升级为「索引对象」。前端从 `posts = await fetch(...).json()` 改为 `posts = (await fetch(...).json()).posts` 即可。

## 访问方式

通过 GitHub Pages 自定义域名（`raw-posts.945426.xyz`）：
- **索引**: `https://raw-posts.945426.xyz/posts.json`
- **分页**: `https://raw-posts.945426.xyz/posts-0.json`、`posts-1.json` ...
- **单篇文章**: `https://raw-posts.945426.xyz/posts/107.md`（注：posts/ 不在 docs/ 下，需通过 GitHub raw 访问）
- **图片**: `https://raw-posts.945426.xyz/img/xxx.jpg`
- **RSS**: `https://raw-posts.945426.xyz/rss.xml`

## 编辑

访问 [PagesCMS](https://app.pagescms.org/moaradc/blog-content/main) 使用在线编辑器。

## 自动化

| Workflow | 触发 | 作用 |
|---|---|---|
| `generate-posts-json.yml` | push 到 posts/ | 清理 frontmatter + 替换图片路径 + 生成 posts.json + posts-{n}.json |
| `generate-rss.yml` | 手动（PagesCMS Actions） | 生成 rss.xml |

## 配置

- `SITE_URL` GitHub Actions 变量：`https://raw-posts.945426.xyz`
  - 用于 `clean-frontmatter.js` 把 `/img/` 替换为绝对 URL
  - 修改此变量即可切换 CDN 域名
- `BLOG_URL` GitHub Actions 变量：`https://blog.945426.xyz`
  - 用于 `generate-rss.js` / `generate-sitemap.js` 生成站点和文章 URL
  - 修改此变量即可切换博客主站域名（RSS 的 self link 也自动派生）
