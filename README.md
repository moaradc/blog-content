# moaradc/blog-content

博客文章和媒体的存储仓库，作为"数据库"使用，不部署到任何平台。

## 用途

- 通过 [PagesCMS](https://pagescms.org/moaradc/blog-content) 在线编辑文章
- 博客主站 ([moaradc/test2](https://github.com/moaradc/test2)) 通过 jsdelivr CDN 运行时 fetch 内容
- `posts.json` 由 GitHub Action 自动生成（push 到 main 时触发）

## 结构

```
blog-content/
├── .pages.yml                    # PagesCMS 配置
├── .github/workflows/
│   └── generate-posts.yml        # 自动生成 posts.json 的 GitHub Action
├── generate-posts.js             # 生成脚本（扫描 posts/*.md → posts.json）
├── posts/                        # 文章 markdown 文件
│   ├── test-1.md
│   └── ...
├── img/                          # 图片媒体
├── posts.json                    # 自动生成（不入 git，由 Action 生成并 commit）
└── README.md
```

## 访问方式

通过 jsdelivr CDN（约 10 分钟缓存延迟）：

- **文章列表**: `https://cdn.jsdelivr.net/gh/moaradc/blog-content@main/posts.json`
  - 相当于原 `articles.js`，供首页和归档页使用
  - 包含所有文章的元数据 + `type=note` 的完整 content
- **单篇文章**: `https://cdn.jsdelivr.net/gh/moaradc/blog-content@main/posts/test-1.md`
- **图片**: `https://cdn.jsdelivr.net/gh/moaradc/blog-content@main/img/example.jpg`

## 编辑

访问 **https://pagescms.org/moaradc/blog-content** 使用在线编辑器。

## 文章字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 文章唯一标识（URL 用） |
| `title` | string | ✅ | 标题 |
| `date` | datetime | ✅ | 发布日期 |
| `content` | rich-text | | 正文（Markdown），type=note 时直接在首页渲染 |
| `content_type` | select | | md / html（默认 md） |
| `desc` | text | | 摘要 |
| `category` | select[] | | 分类（技术/闲谈/说说/生活/杂项/Demo） |
| `tags` | string[] | | 标签 |
| `author` | select | | 作者（Admin/Lamb/Anonymous） |
| `coverImage` | image | | 封面图（上传） |
| `image` | string | | 封面图（外部 URL） |
| `pinned` | boolean | | 置顶（首页列表最前，带 TOP 标记） |
| `locked` | boolean | | 锁定（列表隐藏，归档页可见） |
| `draft` | boolean | | 草稿 |
| `type` | select | | "" / note / gallery |
| `content_url` | string | | 外部内容 URL |

## posts.json 生成机制

`posts.json` 不需要手动维护。每次 push 到 main 时，GitHub Action 会：
1. 运行 `node generate-posts.js`
2. 扫描 `posts/*.md`，解析 frontmatter
3. 生成 `posts.json`（结构匹配 `articlesData`）
4. 自动 commit 回仓库

## 本地测试

```bash
# 手动生成 posts.json
node generate-posts.js

# 查看生成结果
cat posts.json
```
