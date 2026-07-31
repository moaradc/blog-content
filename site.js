// site.js
// 全站配置单一来源 — 所有脚本（clean-frontmatter / generate-posts / generate-rss / generate-sitemap）
// 都从这里 require，避免分散在多个脚本顶部 const。
//
// 设计对齐 afoim/af_blog-data 的 site.ts（ theirs is ESM, ours is CommonJS）。
//
// 优先级：
//   1. 环境变量（GitHub Actions vars.BLOG_URL / vars.SITE_URL）覆盖默认值
//   2. 此处的硬编码默认值
//
// 修改方式：
//   - 域名 / 站点标题 / 作者邮箱改这里即可，所有产物自动跟随
//   - 想用 GitHub Actions 变量覆盖：在仓库 Settings → Secrets and variables → Actions → Variables
//     配 BLOG_URL 和 SITE_URL 两个 vars（注意是 vars 不是 secrets）

const domain = "raw-posts.945426.xyz";             // 内容 CDN 域名（GitHub Pages 绑定）
const blogDomain = "blog.945426.xyz";              // 主站权威域名（用户真正访问的）

// 兜底：环境变量可能被误填为不带协议头的域名（如 "blog.945426.xyz"），
// 此时补上 https://，避免 sitemap 的 <loc> 缺协议头被 Google 拒收。
function withProtocol(url, fallback) {
  if (!url) return fallback;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  if (!url.endsWith("/")) url += "/";
  return url;
}

const siteUrl = withProtocol(process.env.SITE_URL, `https://${domain}/`);
const blogUrl = withProtocol(process.env.BLOG_URL, `https://${blogDomain}/`);

const site = {
  // === 内容 CDN（图片/媒体资源 + posts.json/rss.xml/sitemap.xml 托管） ===
  domain,
  siteUrl,                                          // 含尾斜杠，如 https://raw-posts.945426.xyz/
  siteUrlBase: siteUrl.replace(/\/$/, ""),          // 去尾斜杠

  // === 主站权威域名（用户访问的博客前端，sitemap/SEO 的 canonical 指向） ===
  blogDomain,
  blogUrl,                                          // 含尾斜杠
  blogUrlBase: blogUrl.replace(/\/$/, ""),

  // === 站点元信息（用于 RSS channel、sitemap、前端 og:site_name 等） ===
  title: "沫然Blog",
  description: "极简博客",

  // === 作者（RSS managingEditor / webMaster / dc:creator） ===
  author: {
    name: "沫然",
    email: "moara@foxmail.com",
  },

  // === RSS 订阅源 self URL（指向主站 /rss.xml，与 generate-rss.js 之前的硬编码一致） ===
  rssSelfUrl: blogUrl.replace(/\/$/, "") + "/rss.xml",

  // === 分页（posts-{n}.json 每页条数） ===
  perPage: 16,

  // === sitemap 单文件 URL 上限（协议上限 50000，保守用 10000） ===
  sitemapShardSize: 10000,
};

module.exports = site;
