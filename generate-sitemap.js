// generate-sitemap.js
// 从 docs/posts.json 读取索引对象，生成 docs/sitemap.xml。
//
// 设计要点（对齐 https://2x.nz/posts/svaf-next-seo 的最佳实践）：
//   - 只列文章 URL（首页/归档等已被外链引用，无需 sitemap 重复告知）
//   - lastmod 为纯日期 YYYY-MM-DD（不写到秒）
//   - 不写 changefreq / priority（Google 官方表态基本忽略，徒增体积）
//   - <?xml-stylesheet?> 引用 /xsl/sitemap.xsl（浏览器可读，爬虫忽略）
//   - <loc> 全部指向主站 blogUrl（防止 raw-posts 与主站重复收录）
//   - 文章数 > 10000 时自动分片为 sitemapindex + 多个 urlset
//
// 触发：generate-posts-json.yml（在 generate-posts.js 之后运行）
// 用法: node generate-sitemap.js

const { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } = require("fs");
const { join } = require("path");
const site = require("./site");

const DOCS_DIR = join(__dirname, "docs");
const POSTS_INDEX = join(DOCS_DIR, "posts.json");
const SITEMAP_OUTPUT = join(DOCS_DIR, "sitemap.xml");

const SITEMAP_SHARD_SIZE = site.sitemapShardSize;
const XSL_PI = '<?xml-stylesheet type="text/xsl" href="/xsl/sitemap.xsl"?>';

function escapeXml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** 日期字符串 → YYYY-MM-DD 纯日期 */
function toDateOnly(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

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

// 按 last_modified（兜底 date）降序
const sortedPosts = [...posts].sort((a, b) => {
  const da = new Date(a.last_modified || a.date).getTime() || 0;
  const db = new Date(b.last_modified || b.date).getTime() || 0;
  return db - da;
});

// canonical 全部指向主站 blogUrl，路径为 /details/article?id=<id>
const articleUrls = sortedPosts.map((p) => ({
  loc: site.postUrl(p.id),
  lastmod: toDateOnly(p.last_modified || p.date),
}));

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
    writeFileSync(join(DOCS_DIR, `sitemap-${i}.xml`), renderUrlSet(shardUrls), "utf-8");
    shardFiles.push({ loc: site.absUrl(`sitemap-${i}.xml`, site.blogUrl) });
  }
  // 清理多余分片
  for (const f of readdirSync(DOCS_DIR)) {
    const m = f.match(/^sitemap-(\d+)\.xml$/);
    if (m && parseInt(m[1], 10) >= shardCount) {
      try { unlinkSync(join(DOCS_DIR, f)); } catch (e) { /* ignore */ }
    }
  }
  writeFileSync(SITEMAP_OUTPUT, renderSitemapIndex(shardFiles), "utf-8");
}

console.log(`✅ 生成 sitemap.xml: ${articleUrls.length} 篇文章 URL`);
console.log(`   输出: ${SITEMAP_OUTPUT}`);
