// site.js
// 全站配置单一来源 + 通用 URL helper。
//
// 优先级：环境变量 > 硬编码默认值。
// GitHub Actions 在仓库 Settings → Secrets and variables → Actions → Variables
// 配 BLOG_URL 和 SITE_URL 两个 vars 即可覆盖（注意是 vars 不是 secrets）。

const domain = "raw-posts.945426.xyz";
const blogDomain = "blog.945426.xyz";

// 兜底：环境变量可能被误填为不带协议头的域名，自动补 https:// + 尾斜杠。
function withProtocol(url, fallback) {
  if (!url) return fallback;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  if (!url.endsWith("/")) url += "/";
  return url;
}

const siteUrl = withProtocol(process.env.SITE_URL, `https://${domain}/`);
const blogUrl = withProtocol(process.env.BLOG_URL, `https://${blogDomain}/`);

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
};

module.exports = site;
