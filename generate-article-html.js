// generate-article-html.js
// 扫描 docs/posts/*.md，根据 template/article.html 生成每篇文章的 SEO HTML。
//
// v1.1 关键改动：
//   - 不再从 blog-content 本地 docs/assets/ 读 users.js / config.js
//   - 改为从主仓 GitHub raw URL 拉取（moaradc/MOARA@main/public/assets/data-scripts/）
//   - 失败时 fallback 到默认值，不阻断生成
//
// 关键产物：docs/posts/{id}.html
//   - 完整 <head> 元数据（title/description/keywords/canonical/OG/Twitter/JSON-LD）
//   - 预渲染摘要正文（前 600 字 HTML，爬虫可见）
//   - data-article-id 属性让 article.js 识别当前文章
//   - <noscript> 兜底链接到原始 md
//   - 所有 CSS/JS 通过 https://blog.945426.xyz/assets/... 绝对 URL 引用主仓
//
// 触发：generate-posts-json.yml（在 generate-sitemap.js 之后运行）
// 用法: node generate-article-html.js

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } = require("fs");
const { join } = require("path");
const https = require("https");
const site = require("./site");
const { parseFrontmatter } = require("./parse-frontmatter");

let marked;
try {
  ({ marked } = require("marked"));
} catch (e) {
  console.warn("⚠️  marked 未安装，将输出原始 markdown。请运行 npm install marked");
  marked = { parse: (s) => s };
}

const POSTS_DIR = join(__dirname, "docs", "posts");
const TEMPLATE_FILE = join(__dirname, "template", "article.html");
const DOCS_DIR = join(__dirname, "docs");

// 主仓部署 URL（用于拉取 users.js / config.js 数据）
// 用 blog.945426.xyz 而非 raw.githubusercontent.com，因为主仓是私有仓库
const MOARA_ASSETS_BASE = "https://blog.945426.xyz/assets/data-scripts";

// === 加载模板 ===
if (!existsSync(TEMPLATE_FILE)) {
  console.error(`❌ 模板不存在: ${TEMPLATE_FILE}`);
  process.exit(1);
}
const template = readFileSync(TEMPLATE_FILE, "utf-8");
console.log(`📄 加载模板: ${TEMPLATE_FILE}`);

// === 从主仓 GitHub raw 拉取 users.js / config.js ===
function fetchSync(url) {
  // 同步包装：用 Node 子进程 execSync 调 curl（最简单）
  try {
    const { execSync } = require("child_process");
    const out = execSync(`curl -sSL --max-time 10 "${url}"`, { encoding: "utf-8" });
    return out;
  } catch (e) {
    return null;
  }
}

function evalDataScript(content, varName) {
  // data-scripts 是 `const varName = {...};` 形式
  // 用 vm.runInNewContext 跑，const 在 vm context 里不挂全局，
  // 所以先用正则把 `const varName =` 改成 `var varName =` 让它挂到 context 对象
  try {
    const vm = require("vm");
    const stripped = content
      .replace(new RegExp(`^(const|let)\\s+${varName}\\s*=`, "m"), `var ${varName} =`);
    const ctx = {};
    vm.runInNewContext(stripped, ctx);
    return ctx[varName] || null;
  } catch (e) {
    console.warn(`⚠️  eval ${varName} 失败: ${e.message}`);
    return null;
  }
}

console.log(`🌐 从主仓拉取 data-scripts...`);
const usersJsContent = fetchSync(`${MOARA_ASSETS_BASE}/users.js`);
const configJsContent = fetchSync(`${MOARA_ASSETS_BASE}/config.js`);

const usersConfig = (usersJsContent && evalDataScript(usersJsContent, "usersConfig")) || {
  Anonymous: { name: "佚名", avatar: "/assets/img/users/anonymous.webp", social: [{}] },
  Admin: { name: "沫然", avatar: "/assets/img/icon/moara.webp", social: [] },
};
console.log(`  ✅ usersConfig: ${Object.keys(usersConfig).join(", ")}`);

let categoryConfig = {};
if (configJsContent) {
  const cfg = evalDataScript(configJsContent, "categoryConfig");
  if (cfg && typeof cfg === "object") categoryConfig = cfg;
}
console.log(`  ✅ categoryConfig: ${Object.keys(categoryConfig).join(", ")}`);

// === 工具函数 ===
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function getAuthorName(authorKey) {
  const key = authorKey || "Anonymous";
  if (usersConfig && usersConfig[key] && usersConfig[key].name) {
    return usersConfig[key].name;
  }
  return "佚名";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateStr;
  return `${parseInt(m[1], 10)}年${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日`;
}

function toIsoDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr.replace(" ", "T") + ":00+08:00");
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/**
 * 截取 HTML 到指定字符数（保留完整标签）
 */
function truncateHtml(html, maxChars) {
  if (html.length <= maxChars) return html;
  let truncated = html.slice(0, maxChars);
  const lastLt = truncated.lastIndexOf("<");
  const lastGt = truncated.lastIndexOf(">");
  if (lastLt > lastGt) {
    truncated = truncated.slice(0, lastLt);
  }
  // 闭合未关的标签
  const openTags = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  let m;
  while ((m = tagRegex.exec(truncated)) !== null) {
    const isClosing = m[0].startsWith("</");
    const isSelfClosing = m[2] === "/" || ["br", "img", "hr", "input", "meta", "link"].includes(m[1].toLowerCase());
    if (isSelfClosing) continue;
    if (isClosing) {
      const idx = openTags.lastIndexOf(m[1].toLowerCase());
      if (idx !== -1) openTags.splice(idx, 1);
    } else {
      openTags.push(m[1].toLowerCase());
    }
  }
  for (let i = openTags.length - 1; i >= 0; i--) {
    truncated += `</${openTags[i]}>`;
  }
  return truncated;
}

function extractPlainText(mdBody, maxChars) {
  let text = mdBody
    .replace(/^---[\s\S]*?---\n?/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#+\s+/gm, " ")
    .replace(/^\s*[-*+]\s+/gm, " ")
    .replace(/^\s*>\s+/gm, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxChars);
}

function renderCategoryBadges(categories) {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return '<span class="category-badge" style="background: var(--text-color); color: var(--bg-color); padding: 2px 10px; border-radius: 2px; font-size: 0.8rem; font-weight: 700;">杂项</span>';
  }
  return categories.map((cat) => {
    const conf = categoryConfig[cat] || { bg: "var(--text-color)", text: "var(--bg-color)" };
    return `<span class="category-badge" style="background: ${conf.bg}; color: ${conf.text}; padding: 2px 10px; border-radius: 2px; font-size: 0.8rem; font-weight: 700;">${escapeHtml(cat)}</span>`;
  }).join("");
}

function getCategoryText(categories) {
  if (!categories || !Array.isArray(categories)) return "";
  return categories.join(", ");
}

function buildJsonLd(post, authorName, coverUrl, canonicalUrl, description) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title || "",
    description: description,
    datePublished: toIsoDate(post.date),
    dateModified: toIsoDate(post.last_modified || post.date),
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: site.title,
      logo: { "@type": "ImageObject", url: "https://blog.945426.xyz/favicon.jpg" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
  };
  if (coverUrl) {
    ld.image = { "@type": "ImageObject", url: coverUrl };
  }
  if (post.category && post.category.length) {
    ld.articleSection = post.category.join(", ");
    ld.keywords = (post.tags || []).join(", ");
  }
  return JSON.stringify(ld);
}

// === 扫描文章 ===
if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
console.log(`📄 扫描到 ${files.length} 篇 markdown 文件`);

let generated = 0;
let skipped = 0;
let cleaned = 0;

const existingHtmls = new Set();
for (const f of readdirSync(POSTS_DIR)) {
  if (f.endsWith(".html")) existingHtmls.add(f);
}

for (const file of files.sort()) {
  const raw = readFileSync(join(POSTS_DIR, file), "utf-8").replace(/\r\n/g, "\n");
  const slug = file.replace(/\.md$/, "");

  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    console.warn(`⚠️  ${file}: 无 frontmatter，跳过`);
    skipped++;
    continue;
  }
  const fm = parseFrontmatter(match[1]);
  const body = raw.slice(match[0].length);

  if (fm.locked === true) {
    console.log(`🔒 ${file}: locked，跳过`);
    skipped++;
    continue;
  }
  if (fm.draft === true) {
    console.log(`📝 ${file}: draft，跳过`);
    skipped++;
    continue;
  }

  const title = fm.title || slug;
  const dateStr = fm.date || "";
  const lastMod = fm.last_modified || dateStr;
  const authorKey = fm.author || "Anonymous";
  const authorName = getAuthorName(authorKey);
  const categories = Array.isArray(fm.category) ? fm.category : fm.category ? [fm.category] : [];
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  const coverUrl = fm.image || fm.coverImage || "";
  const contentType = fm.content_type || (fm.type === "note" ? "note" : "md");

  let excerptHtml;
  if (fm.type === "note" && body.trim()) {
    excerptHtml = marked.parse(body.trim());
  } else {
    const fullHtml = marked.parse(body);
    excerptHtml = truncateHtml(fullHtml, 600);
  }

  const description = (fm.desc || extractPlainText(body, 200)).slice(0, 200);
  const canonicalUrl = `https://${site.blogDomain}/posts/${slug}`;
  const categoryBadgesHtml = renderCategoryBadges(categories);
  const categoryText = getCategoryText(categories);
  const jsonld = buildJsonLd({ title, date: dateStr, last_modified: lastMod, category: categories, tags }, authorName, coverUrl, canonicalUrl, description);

  const coverOgHtml = coverUrl
    ? `<meta property="og:image" content="${escapeAttr(coverUrl)}" />`
    : "";
  const coverTwitterHtml = coverUrl
    ? `<meta name="twitter:image" content="${escapeAttr(coverUrl)}" />`
    : "";
  const twitterCardType = coverUrl ? "summary_large_image" : "summary";
  const dateDisplay = formatDate(dateStr);
  const datePublished = toIsoDate(dateStr);

  const html = template
    .replace(/\{\{id\}\}/g, escapeAttr(slug))
    .replace(/\{\{title\}\}/g, escapeHtml(title))
    .replace(/\{\{description\}\}/g, escapeAttr(description))
    .replace(/\{\{keywords\}\}/g, escapeAttr(tags.join(",")))
    .replace(/\{\{authorName\}\}/g, escapeHtml(authorName))
    .replace(/\{\{datePublished\}\}/g, escapeAttr(datePublished))
    .replace(/\{\{dateDisplay\}\}/g, escapeHtml(dateDisplay))
    .replace(/\{\{categoryText\}\}/g, escapeAttr(categoryText))
    .replace(/\{\{categoryBadgesHtml\}\}/g, categoryBadgesHtml)
    .replace(/\{\{contentType\}\}/g, escapeAttr(contentType))
    .replace(/\{\{excerptHtml\}\}/g, excerptHtml)
    .replace(/\{\{coverOgHtml\}\}/g, coverOgHtml)
    .replace(/\{\{coverTwitterHtml\}\}/g, coverTwitterHtml)
    .replace(/\{\{twitterCardType\}\}/g, twitterCardType)
    .replace(/\{\{jsonld\}\}/g, jsonld);

  writeFileSync(join(POSTS_DIR, `${slug}.html`), html, "utf-8");
  existingHtmls.delete(`${slug}.html`);
  console.log(`  ✅ ${slug}.html: ${title}`);
  generated++;
}

// === 清理无对应 .md 的 .html ===
for (const orphan of existingHtmls) {
  try {
    unlinkSync(join(POSTS_DIR, orphan));
    console.log(`  🗑️  清理孤儿 HTML: ${orphan}`);
    cleaned++;
  } catch (e) {
    console.warn(`  ⚠️  清理 ${orphan} 失败: ${e.message}`);
  }
}

console.log(`\n✅ 完成`);
console.log(`   生成: ${generated}`);
console.log(`   跳过: ${skipped}`);
console.log(`   清理: ${cleaned}`);
