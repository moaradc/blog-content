// generate-sitemap.js
// 扫描 posts/*.md，生成 sitemap.xml（仅文章 URL，不含首页/归档等静态页）
//
// 设计对齐 https://2x.nz/posts/svaf-next-seo 的 sitemap 最佳实践：
//   - 只列文章 URL（首页/归档等已被外链引用，无需 sitemap 重复告知）
//   - lastmod 为纯日期 YYYY-MM-DD（不写到秒）
//   - 不写 changefreq / priority（Google 官方表态基本忽略，徒增体积）
//   - 加 <?xml-stylesheet?> 引用 /xsl/sitemap.xsl（浏览器可读，爬虫忽略）
//   - 每个 <url> 单行紧凑格式
//
// 文章数 ≤ 10000：单文件 urlset
// 文章数 > 10000：sitemapindex + 分片（每片 10000 URL，协议上限 50000，保守用 10000）
//
// 触发：generate-sitemap.yml（独立工作流，push 到 main 时自动跑）
// 用法: node generate-sitemap.js

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } = require("fs");
const { join } = require("path");

const POSTS_DIR = join(__dirname, "docs", "posts");
const DOCS_DIR = join(__dirname, "docs");
const SITEMAP_OUTPUT = join(DOCS_DIR, "sitemap.xml");

// 站点配置（与 generate-rss.js 一致）
const SITE_URL = "https://blog.945426.xyz";
const SITE_URL_BASE = SITE_URL.replace(/\/$/, "");

// 单个 sitemap 文件 URL 上限（协议上限 50000，保守用 10000）
const SITEMAP_SHARD_SIZE = 10000;

// XSL 样式表声明（让浏览器渲染成可读表格，爬虫忽略）
const XSL_PI = '<?xml-stylesheet type="text/xsl" href="/xsl/sitemap.xsl"?>';

/** 解析类 YAML frontmatter 为对象（与 generate-rss.js 一致） */
function parseFrontmatter(fm) {
  const lines = fm.split("\n");
  const result = {};
  let currentKey = null;
  let currentList = [];

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w_-]*):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey && currentList.length) {
        result[currentKey] = [...currentList];
        currentList = [];
      }
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === "") {
        currentList = [];
      } else if (val.startsWith("[")) {
        result[currentKey] = val
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
          .filter(Boolean);
        currentKey = null;
      } else if (val === "true") {
        result[currentKey] = true;
        currentKey = null;
      } else if (val === "false") {
        result[currentKey] = false;
        currentKey = null;
      } else {
        result[currentKey] = val.replace(/^['"]|['"]$/g, "");
        currentKey = null;
      }
      continue;
    }
    const liMatch = line.match(/^\s*-\s+(.*)$/);
    if (liMatch && currentKey) {
      currentList.push(liMatch[1].trim().replace(/^['"]|['"]$/g, ""));
    }
  }
  if (currentKey && currentList.length) {
    result[currentKey] = [...currentList];
  }
  return result;
}

function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  const frontmatter = parseFrontmatter(match[1]);
  const body = raw.slice(match[0].length);
  return { frontmatter, body };
}

/** XML 转义 */
function escapeXml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 把任意日期字符串标准化为 YYYY-MM-DD 纯日期 */
function toDateOnly(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

// === 主逻辑：扫描文章 ===
if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const files = readdirSync(POSTS_DIR).filter(
  (f) => f.endsWith(".md") && f !== "README.md"
);

const posts = [];
for (const file of files.sort()) {
  const raw = readFileSync(join(POSTS_DIR, file), "utf-8");
  const slug = file.replace(/\.md$/, "");
  const { frontmatter } = parseMarkdown(raw);

  if (frontmatter.locked === true) continue;
  if (frontmatter.draft === true) continue;

  const lastmod = toDateOnly(frontmatter.last_modified || frontmatter.date);
  posts.push({
    id: slug,
    title: frontmatter.title || slug,
    lastmod,
  });
}

// 按 date 降序（与 posts.json 排序一致，最新的在前）
// 注意：这里没有 date 字段，用 lastmod 兜底排序
posts.sort((a, b) => {
  const da = a.lastmod ? new Date(a.lastmod).getTime() : 0;
  const db = b.lastmod ? new Date(b.lastmod).getTime() : 0;
  return db - da;
});

// === 构造文章 URL 列表 ===
const articleUrls = posts.map((p) => ({
  loc: `${SITE_URL_BASE}/posts/${encodeURIComponent(p.id)}`,
  lastmod: p.lastmod,
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
  // === 单文件 urlset ===
  writeFileSync(SITEMAP_OUTPUT, renderUrlSet(articleUrls), "utf-8");
} else {
  // === 分片：主 sitemap 是 sitemapindex，分片文件是 urlset ===
  const shardCount = Math.ceil(articleUrls.length / SITEMAP_SHARD_SIZE);
  const shardFiles = [];
  for (let i = 0; i < shardCount; i++) {
    const shardUrls = articleUrls.slice(i * SITEMAP_SHARD_SIZE, (i + 1) * SITEMAP_SHARD_SIZE);
    const shardPath = join(DOCS_DIR, `sitemap-${i}.xml`);
    writeFileSync(shardPath, renderUrlSet(shardUrls), "utf-8");
    shardFiles.push({
      loc: `${SITE_URL_BASE}/sitemap-${i}.xml`,
    });
  }

  // 清理可能存在的多余分片文件（文章减少时）
  const existingShards = readdirSync(DOCS_DIR).filter((f) => /^sitemap-\d+\.xml$/.test(f));
  for (const f of existingShards) {
    const idx = parseInt(f.match(/^sitemap-(\d+)\.xml$/)[1], 10);
    if (idx >= shardCount) {
      try {
        unlinkSync(join(DOCS_DIR, f));
      } catch (e) {
        console.warn(`   ⚠️  清理 ${f} 失败: ${e.message}`);
      }
    }
  }

  writeFileSync(SITEMAP_OUTPUT, renderSitemapIndex(shardFiles), "utf-8");
}
