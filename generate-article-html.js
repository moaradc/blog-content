// generate-article-html.js
// 扫描 docs/posts/*.md，用 template/article.html 生成每篇 SEO HTML。
// 用法: node generate-article-html.js [docs/posts/101.md ...]
//   无参数 = 全量，有参数 = 增量（只处理传入文件）

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } = require("fs");
const { join } = require("path");
const site = require("./site");
const { parseFrontmatter } = require("./parse-frontmatter");

let marked;
try {
  ({ marked } = require("marked"));
} catch (e) {
  console.warn("⚠️  marked 未安装，将输出原始 markdown。请运行 npm install marked");
  marked = { parse: (s) => s };
}

marked.setOptions({ breaks: true, gfm: true });

const POSTS_DIR = join(__dirname, "docs", "posts");
const TEMPLATE_FILE = join(__dirname, "template", "article.html");
const DOCS_DIR = join(__dirname, "docs");

const SITE_META = {
  name: "沫然Blog",
  url: "https://blog.945426.xyz",
  author: "moara",
  description: "沫然的个人博客 —— 技术、生活、闲谈、创作、归档",
  ogImage: "/assets/img/icon/moara.webp",
  rssUrl: "/rss.xml",
};

if (!existsSync(TEMPLATE_FILE)) {
  console.error(`❌ 模板不存在: ${TEMPLATE_FILE}`);
  process.exit(1);
}
const template = readFileSync(TEMPLATE_FILE, "utf-8");
console.log(`📄 加载模板: ${TEMPLATE_FILE}`);

function protectCustomTags(text) {
  const placeholders = [];

  const pairedTagRegex = /<(music|gallery)\b[^>]*>[\s\S]*?<\/\1>/gi;
  text = text.replace(pairedTagRegex, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\n%%CUSTOM_TAG_${idx}%%\n`;
  });

  const divBlockRegex = /<div\b[^>]*class=["'][^"']*details-box[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
  text = text.replace(divBlockRegex, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\n%%CUSTOM_TAG_${idx}%%\n`;
  });

  const spoilerRegex = /<span\b[^>]*class=['"][^'"]*spoiler[^'"]*['"][^>]*>[\s\S]*?<\/span>/gi;
  text = text.replace(spoilerRegex, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `%%CUSTOM_TAG_${idx}%%`;
  });

  const todoRegex = /<ul\b[^>]*class=['"][^'"]*todo-list[^'"]*['"][^>]*>[\s\S]*?<\/ul>/gi;
  text = text.replace(todoRegex, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\n%%CUSTOM_TAG_${idx}%%\n`;
  });

  const genericBlockRegex = /<(details-box|todo-item|music-card|gallery-item)[^>]*>[\s\S]*?<\/\1>/gi;
  text = text.replace(genericBlockRegex, (match) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `\n%%CUSTOM_TAG_${idx}%%\n`;
  });

  return { text, placeholders };
}

function restoreCustomTags(html, placeholders) {
  let out = html;
  placeholders.forEach((original, idx) => {
    out = out.replace(`<p>%%CUSTOM_TAG_${idx}%%</p>`, original);
    out = out.replace(`%%CUSTOM_TAG_${idx}%%`, original);
  });
  return out;
}

function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: raw };
  return { frontmatter: parseFrontmatter(match[1]), body: raw.slice(match[0].length) };
}

function renderMarkdown(mdText) {
  const parsed = parseMarkdown(mdText);
  const { text: protectedBody, placeholders } = protectCustomTags(parsed.body);
  let html = marked.parse(protectedBody, { breaks: true, gfm: true });
  html = restoreCustomTags(html, placeholders);
  return { metadata: parsed.frontmatter, html };
}

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
  return authorKey || "Anonymous";
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

function makeExcerpt(html, maxLen = 160) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice) + "...";
}

function extractArticleBody(html, maxLen = 5000) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
  return text || undefined;
}

function renderCategoryBadges(categories) {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return '<span class="category-badge" style="background: var(--text-color); color: var(--bg-color); padding: 2px 10px; border-radius: 2px; font-size: 0.8rem; font-weight: 700;">杂项</span>';
  }
  return categories.map((cat) =>
    `<span class="category-badge" style="background: var(--text-color); color: var(--bg-color); padding: 2px 10px; border-radius: 2px; font-size: 0.8rem; font-weight: 700;">${escapeHtml(cat)}</span>`
  ).join("");
}

function getCategoryText(categories) {
  if (!categories || !Array.isArray(categories)) return "";
  return categories.join(", ");
}

function buildBreadcrumbJsonLd(trail) {
  const base = SITE_META.url.replace(/\/$/, "");
  const items = trail.map((item) => ({
    name: item.name,
    url: item.url.startsWith("http") ? item.url : `${base}${item.url}`,
  }));
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildArticleJsonLd(opts) {
  const base = SITE_META.url.replace(/\/$/, "");
  const image = opts.image || `${base}${SITE_META.ogImage}`;
  const authorName = opts.authorName || SITE_META.author;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    image,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    author: { "@type": "Person", name: authorName, url: `${base}/` },
    publisher: { "@type": "Person", name: SITE_META.author, url: `${base}/` },
    datePublished: opts.datePublished || new Date().toISOString(),
    dateModified: opts.dateModified || opts.datePublished || new Date().toISOString(),
    url: opts.url,
  };

  const articleBody = extractArticleBody(opts.articleBodyHtml || "");
  if (articleBody) {
    jsonLd.articleBody = articleBody;
  }

  return jsonLd;
}

if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const argv = process.argv.slice(2);
let files;
if (argv.length > 0) {
  files = argv
    .map((p) => p.replace(/^.*\//, ""))
    .filter((f) => f.endsWith(".md") && f !== "README.md");
  const existing = files.filter((f) => existsSync(join(POSTS_DIR, f)));
  const deleted = files.filter((f) => !existsSync(join(POSTS_DIR, f)));
  console.log(`📄 增量生成 ${existing.length} 篇文章 HTML` + (deleted.length > 0 ? `，清理 ${deleted.length} 篇已删除文章的 HTML` : ""));
  files = existing;
} else {
  files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");
  console.log(`📄 全量生成 ${files.length} 篇文章 HTML`);
}

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

  if ("locked" in fm) {
    console.log(`🔒 ${file}: locked，跳过`);
    const htmlPath = join(POSTS_DIR, `${slug}.html`);
    if (existsSync(htmlPath)) {
      try {
        unlinkSync(htmlPath);
        cleaned++;
        console.log(`  🗑️  清理已锁定文章的 HTML: ${slug}.html`);
      } catch (e) {
        console.warn(`  ⚠️  清理 ${slug}.html 失败: ${e.message}`);
      }
    }
    existingHtmls.delete(`${slug}.html`);
    skipped++;
    continue;
  }
  if ("draft" in fm) {
    console.log(`📝 ${file}: draft，跳过`);
    const htmlPath = join(POSTS_DIR, `${slug}.html`);
    if (existsSync(htmlPath)) {
      try {
        unlinkSync(htmlPath);
        cleaned++;
        console.log(`  🗑️  清理草稿文章的 HTML: ${slug}.html`);
      } catch (e) {
        console.warn(`  ⚠️  清理 ${slug}.html 失败: ${e.message}`);
      }
    }
    existingHtmls.delete(`${slug}.html`);
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

  const { html: fullContentHtml } = renderMarkdown(raw);

  const description = (fm.desc || makeExcerpt(fullContentHtml, 160)).slice(0, 200);

  const canonicalUrl = `https://${site.blogDomain}/posts/${slug}`;
  const categoryBadgesHtml = renderCategoryBadges(categories);
  const categoryText = getCategoryText(categories);

  const articleJsonLd = buildArticleJsonLd({
    title,
    description,
    url: canonicalUrl,
    image: coverUrl || undefined,
    datePublished: toIsoDate(dateStr),
    dateModified: toIsoDate(lastMod),
    authorName,
    articleBodyHtml: fullContentHtml,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "首页", url: "/" },
    { name: "归档", url: "/details/archives" },
    { name: title, url: `/posts/${slug}` },
  ]);

  const jsonld = JSON.stringify([articleJsonLd, breadcrumbJsonLd]);

  const articleMetaObj = {
    title,
    date: dateStr,
    last_modified: lastMod,
    author: authorKey,
    category: categories,
    tags,
    image: coverUrl,
    type: fm.type || "article",
    locked: !!fm.locked,
  };
  const articleMetaJson = escapeAttr(JSON.stringify(articleMetaObj));

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
    .replace(/\{\{articleMetaJson\}\}/g, articleMetaJson)
    .replace(/\{\{excerptHtml\}\}/g, fullContentHtml)
    .replace(/\{\{coverOgHtml\}\}/g, coverOgHtml)
    .replace(/\{\{coverTwitterHtml\}\}/g, coverTwitterHtml)
    .replace(/\{\{twitterCardType\}\}/g, twitterCardType)
    .replace(/\{\{jsonld\}\}/g, jsonld);

  writeFileSync(join(POSTS_DIR, `${slug}.html`), html, "utf-8");
  existingHtmls.delete(`${slug}.html`);
  console.log(`  ✅ ${slug}.html: ${title} (${fullContentHtml.length} bytes 正文)`);
  generated++;
}

const isIncremental = argv.length > 0;
if (isIncremental) {
  for (const argFile of argv) {
    const slug = argFile.replace(/^.*\//, "").replace(/\.md$/, "");
    const mdPath = join(POSTS_DIR, `${slug}.md`);
    const htmlPath = join(POSTS_DIR, `${slug}.html`);
    if (!existsSync(mdPath) && existsSync(htmlPath)) {
      try {
        unlinkSync(htmlPath);
        console.log(`  🗑️  清理已删除文章的 HTML: ${slug}.html`);
        cleaned++;
      } catch (e) {
        console.warn(`  ⚠️  清理 ${slug}.html 失败: ${e.message}`);
      }
    }
  }
} else {
  for (const orphan of existingHtmls) {
    try {
      unlinkSync(join(POSTS_DIR, orphan));
      console.log(`  🗑️  清理孤儿 HTML: ${orphan}`);
      cleaned++;
    } catch (e) {
      console.warn(`  ⚠️  清理 ${orphan} 失败: ${e.message}`);
    }
  }
}

console.log(`\n✅ 完成`);
console.log(`   生成: ${generated}`);
console.log(`   跳过: ${skipped}`);
console.log(`   清理: ${cleaned}`);
