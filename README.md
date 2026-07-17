# moaradc/blog-content

博客文章和媒体的存储仓库，作为"数据库"使用，不部署到任何平台。

## 用途

- 通过 [PagesCMS](https://pagescms.org/moaradc/blog-content) 在线编辑文章
- 博客主站 ([moaradc/test2](https://github.com/moaradc/test2)) 通过 jsdelivr CDN 运行时 fetch 内容

## 结构

```
blog-content/
├── .pages.yml     # PagesCMS 配置
├── posts/         # 文章 markdown 文件（如 107.md）
├── img/           # 图片媒体
└── README.md
```

## 访问方式

通过 jsdelivr CDN（10 分钟缓存延迟）：
- 单篇文章: `https://cdn.jsdelivr.net/gh/moaradc/blog-content@main/posts/107.md`
- 图片: `https://cdn.jsdelivr.net/gh/moaradc/blog-content@main/img/example.jpg`

## 编辑

访问 https://pagescms.org/moaradc/blog-content 使用在线编辑器。

## 文章字段说明

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | ✅ | 文章唯一标识（URL 用） |
| `title` | string | ✅ | 标题 |
| `date` | datetime | ✅ | 发布日期 |
| `desc` | text | | 摘要 |
| `body` | rich-text | | Markdown 正文 |
| `category` | select[] | | 分类（技术/闲谈/说说/生活/杂项/Demo） |
| `tags` | string[] | | 标签 |
| `author` | select | | 作者（Admin/Lamb/Anonymous） |
| `coverImage` | image | | 封面图（上传） |
| `image` | string | | 封面图（外部 URL） |
| `locked` | boolean | | 锁定（防误改） |
| `draft` | boolean | | 草稿 |
| `pin` | boolean | | 置顶 |
| `type` | select | | 特殊类型（note/gallery） |
| `content_url` | string | | 外部内容 URL |
