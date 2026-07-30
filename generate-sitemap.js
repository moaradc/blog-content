// generate-sitemap.js
// 从 docs/posts.json 读取已生成的索引对象，产出：
//   - docs/sitemap.xml          单文件 urlset（或文章数 > 10000 时的 sitemapindex + 分片）
//   - docs/seo/posts/<slug>.html  每篇文章的静态 SEO 预渲染页（零 JS、零 CSS、纯语义 HTML）
//   - docs/seo/posts.html       SEO 文章列表页
//
// 设计对齐 https://2x.nz/posts/svaf-next-seo 的最佳实践：
//   - sitemap 只列文章 URL（首页/归档等已被外链引用，无需 sitemap 重复告知）
//   - lastmod 为纯日期 YYYY-MM-DD（不写到秒）
//   - 不写 changefreq / priority（Google 官方表态基本忽略，徒增体积）
//   - 加 <?xml-stylesheet?> 引用 /xsl/sitemap.xsl（浏览器可读，爬虫忽略）
//   - 每个 <url> 单行紧凑格式
//   - sitemap 中的 <loc> 全部指向权威主站 BLOG_URL（防止 raw-posts 与主站重复收录）
//
// 触发：generate-posts-json.yml（在 generate-posts.js 之后运行）
// 用法: BLOG_URL=https://blog.945426.xyz node generate-sitemap.js

const { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } = require("fs");
const { join } = require("path");

const DOCS_DIR = join(__dirname, "docs");
const POSTS_INDEX = join(DOCS_DIR, "posts.json");
const SITEMAP_OUTPUT = join(DOCS_DIR, "sitemap.xml");

// 站点配置（与 generate-rss.js 共用 BLOG_URL 环境变量）
const BLOG_URL = process.env.BLOG_URL || "https://blog.945426.xyz";
const BLOG_URL_BASE = BLOG_URL.replace(/\/$/, "");

// 内容 CDN（图片等硬资源的前缀，用于 SEO 页里把相对 /img/ 转绝对）
const SITE_URL = process.env.SITE_URL || "https://raw-posts.945426.xyz";
const SITE_URL_BASE = SITE_URL.replace(/\/$/, "");

const MAIN_NAME = "沫然Blog";
const SITE_DESC = "极简博客";
const DEFAULT_OG_IMAGE = BLOG_URL_BASE + "/files/img/official.png";

// 单个 sitemap 文件 URL 上限（协议上限 50000，保守用 10000）
const SITEMAP_SHARD_SIZE = 10000;

// XSL 样式表声明（让浏览器渲染成可读表格，爬虫忽略）
const XSL_PI = '<?xml-stylesheet type="text/xsl" href="/xsl/sitemap.xsl"?>';

/** XML 转义 */
function escapeXml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** HTML 转义（用于 SEO 静态页的属性值与文本） */
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 把任意日期字符串标准化为 YYYY-MM-DD 纯日期 */
function toDateOnly(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

/** 把相对 URL 转成绝对 URL（已绝对的保持不变） */
function absUrl(url, base) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const b = base.replace(/\/$/, "");
  const p = url.startsWith("/") ? url : "/" + url;
  return b + p;
}

// === 读取 posts.json 索引对象 ===
if (!existsSync(POSTS_INDEX)) {
  console.error(`❌ posts.json 不存在: ${POSTS_INDEX}`);
  console.error("   请先运行 generate-posts.js 生成 posts.json");
  process.exit(1);
}

const indexObj = JSON.parse(readFileSync(POSTS_INDEX, "utf-8"));
const posts = Array.isArray(indexObj.posts) ? indexObj.posts : [];

if (posts.length === 0) {
  console.warn("⚠️  posts.json 中没有文章，sitemap 将是空 urlset");
}

// 按 last_modified（兜底 date）降序，与 posts.json 的排序接近（最新在前）
const sortedPosts = [...posts].sort((a, b) => {
  const da = new Date(a.last_modified || a.date).getTime() || 0;
  const db = new Date(b.last_modified || b.date).getTime() || 0;
  return db - da;
});

// === 构造文章 URL 列表（canonical 全部指向主站 BLOG_URL） ===
const articleUrls = sortedPosts.map((p) => ({
  loc: `${BLOG_URL_BASE}/posts/${encodeURIComponent(p.id)}`,
  lastmod: toDateOnly(p.last_modified || p.date),
}));

// === 生成 sitemap ===
mkdirSync(DOCS_DIR, { recursive: true });

function renderUrlSet(urls) {
  const lines = urls.map(
    (u) => `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n${XSL_PI}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>\n`;
}

function renderSitemapIndex(shards) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = shards.map(
    (s) => `  <sitemap><loc>${escapeXml(s.loc)}</loc><lastmod>${today}</lastmod></sitemap>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n${XSL_PI}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</sitemapindex>\n`;
}

if (articleUrls.length <= SITEMAP_SHARD_SIZE) {
  writeFileSync(SITEMAP_OUTPUT, renderUrlSet(articleUrls), "utf-8");
} else {
  const shardCount = Math.ceil(articleUrls.length / SITEMAP_SHARD_SIZE);
  const shardFiles = [];
  for (let i = 0; i < shardCount; i++) {
    const shardUrls = articleUrls.slice(i * SITEMAP_SHARD_SIZE, (i + 1) * SITEMAP_SHARD_SIZE);
    const shardPath = join(DOCS_DIR, `sitemap-${i}.xml`);
    writeFileSync(shardPath, renderUrlSet(shardUrls), "utf-8");
    shardFiles.push({ loc: `${BLOG_URL_BASE}/sitemap-${i}.xml` });
  }
  // 清理可能存在的多余分片文件
  for (const f of readdirSync(DOCS_DIR)) {
    const m = f.match(/^sitemap-(\d+)\.xml$/);
    if (!m) continue;
    if (parseInt(m[1], 10) >= shardCount) {
      try { unlinkSync(join(DOCS_DIR, f)); } catch (e) { /* ignore */ }
    }
  }
  writeFileSync(SITEMAP_OUTPUT, renderSitemapIndex(shardFiles), "utf-8");
}

console.log(`✅ 生成 sitemap.xml: ${articleUrls.length} 篇文章 URL`);
console.log(`   输出: ${SITEMAP_OUTPUT}`);

// === SEO 静态预渲染页 ===
// 目的：把主站动态拼 HTML 给爬虫的活挪到构建时，产物是零样式、零 JS 的纯语义 HTML，
// 供 UA 重写规则把爬虫直接导流到 raw-posts.945426.xyz/seo/posts/<slug> 取用。
//
// 路径策略（与 afoim/af_blog-data 对齐）：
//   - 图片等硬资源 → 绝对 URL（内容托管在 raw-posts.945426.xyz）
//   - canonical / og:url / JSON-LD 页面地址 → 硬指向权威主站 blog.945426.xyz（防收录分裂）

const SEO_OUT = join(DOCS_DIR, "seo", "posts");
mkdirSync(SEO_OUT, { recursive: true });

/** <title> 拼接：`标题 | 沫然Blog` */
function seoTitle(t) {
  return escapeXml(t + " | " + MAIN_NAME);
}

/** 单篇文章的完整 SEO HTML 文档 */
function buildPostSeoHtml(post) {
  const pageUrl = `${BLOG_URL_BASE}/posts/${encodeURIComponent(post.id)}`;
  const description = post.desc || post.title + " —— 来自沫然Blog 的博客文章。";
  const image = post.image ? absUrl(post.image, SITE_URL_BASE) : DEFAULT_OG_IMAGE;
  const fullTitle = post.title + " | " + MAIN_NAME;
  const datePublished = toDateOnly(post.date || post.last_modified);

  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: description,
    datePublished: datePublished || undefined,
    dateModified: toDateOnly(post.last_modified) || datePublished || undefined,
    image: image,
    keywords: Array.isArray(post.tags) && post.tags.length ? post.tags.join(",") : undefined,
    inLanguage: "zh-CN",
    author: { "@type": "Person", name: post.author || "沫然", url: BLOG_URL_BASE },
    mainEntityOfPage: pageUrl,
  };
  const jsonLd = JSON.stringify(ld).replace(/</g, "\\u003c");

  const tags = Array.isArray(post.tags) ? post.tags : [];
  const category = Array.isArray(post.category) ? post.category : [];

  const lines = [];
  lines.push("<!doctype html>");
  lines.push('<html lang="zh-CN">');
  lines.push("<head>");
  lines.push('<meta charset="utf-8" />');
  lines.push("<title>" + seoTitle(post.title) + "</title>");
  lines.push('<meta name="description" content="' + escapeXml(description) + '" />');
  lines.push('<meta name="robots" content="index, follow" />');
  lines.push('<link rel="canonical" href="' + escapeXml(pageUrl) + '" />');
  lines.push('<meta property="og:site_name" content="' + escapeXml(MAIN_NAME) + '" />');
  lines.push('<meta property="og:title" content="' + escapeXml(fullTitle) + '" />');
  lines.push('<meta property="og:description" content="' + escapeXml(description) + '" />');
  lines.push('<meta property="og:url" content="' + escapeXml(pageUrl) + '" />');
  lines.push('<meta property="og:type" content="article" />');
  lines.push('<meta property="og:image" content="' + escapeXml(image) + '" />');
  if (datePublished) {
    lines.push('<meta property="article:published_time" content="' + escapeXml(datePublished) + '" />');
  }
  for (const tag of tags) {
    lines.push('<meta property="article:tag" content="' + escapeXml(tag) + '" />');
  }
  for (const cat of category) {
    lines.push('<meta property="article:section" content="' + escapeXml(cat) + '" />');
  }
  lines.push('<meta name="twitter:card" content="summary_large_image" />');
  lines.push('<meta name="twitter:title" content="' + escapeXml(fullTitle) + '" />');
  lines.push('<meta name="twitter:description" content="' + escapeXml(description) + '" />');
  lines.push('<meta name="twitter:image" content="' + escapeXml(image) + '" />');
  lines.push('<script type="application/ld+json">' + jsonLd + "</script>");
  lines.push("</head>");
  lines.push("<body>");
  lines.push('<nav><a href="/posts">← 博客文章</a></nav>');
  lines.push("<article>");
  lines.push("<h1>" + escapeXml(post.title) + "</h1>");
  if (post.desc) {
    lines.push("<p>" + escapeXml(post.desc) + "</p>");
  }
  // type=note 的说说直接内嵌 content（已在 posts.json 中），其他文章链接到主站查看
  if (post.type === "note" && post.content) {
    lines.push("<div>" + escapeXml(post.content).replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>") + "</div>");
  }
  lines.push("</article>");
  lines.push("</body>");
  lines.push("</html>");
  return lines.join("\n") + "\n";
}

/** SEO 文章列表页（爬虫抓取入口，链接指向公开路径 /posts/<slug>） */
function buildListSeoHtml(list) {
  const listUrl = `${BLOG_URL_BASE}/posts`;
  const items = list
    .map(function (p) {
      const d = toDateOnly(p.date || p.last_modified);
      const dateTag = d ? '<time datetime="' + d + '">' + d + "</time> " : "";
      return (
        "<li>" +
        dateTag +
        '<a href="/posts/' +
        encodeURIComponent(p.id) +
        '">' +
        escapeXml(p.title) +
        "</a></li>"
      );
    })
    .join("\n");

  const lines = [];
  lines.push("<!doctype html>");
  lines.push('<html lang="zh-CN">');
  lines.push("<head>");
  lines.push('<meta charset="utf-8" />');
  lines.push("<title>" + seoTitle("博客文章") + "</title>");
  lines.push('<meta name="description" content="' + escapeXml(SITE_DESC) + '" />');
  lines.push('<meta name="robots" content="index, follow" />');
  lines.push('<link rel="canonical" href="' + escapeXml(listUrl) + '" />');
  lines.push('<meta property="og:site_name" content="' + escapeXml(MAIN_NAME) + '" />');
  lines.push('<meta property="og:title" content="' + escapeXml("博客文章 | " + MAIN_NAME) + '" />');
  lines.push('<meta property="og:description" content="' + escapeXml(SITE_DESC) + '" />');
  lines.push('<meta property="og:url" content="' + escapeXml(listUrl) + '" />');
  lines.push('<meta property="og:type" content="website" />');
  lines.push('<meta property="og:image" content="' + escapeXml(DEFAULT_OG_IMAGE) + '" />');
  lines.push("</head>");
  lines.push("<body>");
  lines.push("<h1>博客文章</h1>");
  lines.push("<ul>");
  lines.push(items);
  lines.push("</ul>");
  lines.push("</body>");
  lines.push("</html>");
  return lines.join("\n") + "\n";
}

// 清理 SEO 目录中已不存在的文章的旧 HTML（防止删除文章后 SEO 页残留）
const existingSeoFiles = new Set();
if (existsSync(SEO_OUT)) {
  for (const f of readdirSync(SEO_OUT)) {
    if (f.endsWith(".html")) existingSeoFiles.add(f);
  }
}

let seoCount = 0;
for (const post of sortedPosts) {
  const html = buildPostSeoHtml(post);
  writeFileSync(join(SEO_OUT, post.id + ".html"), html, "utf-8");
  existingSeoFiles.delete(post.id + ".html");
  seoCount++;
}

// 删除残留的旧 SEO 页（文章已被删除/转草稿）
for (const stale of existingSeoFiles) {
  try { unlinkSync(join(SEO_OUT, stale)); } catch (e) { /* ignore */ }
}

// 列表页
writeFileSync(join(DOCS_DIR, "seo", "posts.html"), buildListSeoHtml(sortedPosts), "utf-8");

console.log(`✅ 生成 SEO 静态页: ${seoCount} 篇文章 + 1 个列表页`);
console.log(`   输出: ${SEO_OUT}/`);
console.log(`   列表: ${join(DOCS_DIR, "seo", "posts.html")}`);
