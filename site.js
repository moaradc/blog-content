// site.js
// 全站配置单一来源 + 通用 URL helper。
//
// 优先级：环境变量 > 硬编码默认值。
// GitHub Actions 在仓库 Settings → Secrets and variables → Actions → Variables
// 配 BLOG_URL 和 SITE_URL 两个 vars 即可覆盖（注意是 vars 不是 secrets）。

const domain = "raw-posts.945426.xyz";
const blogDomain = "blog.945426.xyz";

const siteUrl = process.env.SITE_URL || `https://${domain}/`;
const blogUrl = process.env.BLOG_URL || `https://${blogDomain}/`;

/**
 * 相对 URL → 绝对 URL。
 * - 已绝对的（http/https）原样返回
 * - 空值原样返回（null/undefined/""）
 * - 默认 base = siteUrl（内容 CDN），可传 blogUrl 切到主站
 */
function absUrl(url, base = siteUrl) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const b = base.replace(/\/$/, "");
  const p = url.startsWith("/") ? url : "/" + url;
  return b + p;
}

/**
 * 文章详情页 URL（主站 + /posts/<id>）。
 *
 * 历史：曾用 /details/article?id=<id>（SPA 路由，爬虫看到空壳）。
 * 现在：每篇文章由 blog-content Action 生成静态 SEO HTML（docs/posts/<id>.html），
 *       主仓 vercel.json 用 rewrite 把 /posts/<id> 透传到 raw-posts.945426.xyz/posts/<id>.html。
 *       爬虫看到完整 head 元数据 + 摘要正文，禁用 JS 也有 noscript 兜底。
 */
function postUrl(id) {
  return blogUrl.replace(/\/$/, "") + "/posts/" + encodeURIComponent(id);
}

const site = {
  domain,
  siteUrl,
  siteUrlBase: siteUrl.replace(/\/$/, ""),
  blogDomain,
  blogUrl,
  blogUrlBase: blogUrl.replace(/\/$/, ""),
  title: "沫然Blog",
  description: "极简博客",
  author: { name: "沫然", email: "moara@foxmail.com" },
  rssSelfUrl: blogUrl.replace(/\/$/, "") + "/rss.xml",
  perPage: 16,
  sitemapShardSize: 10000,
  absUrl,
  postUrl,
};

module.exports = site;
