// generate-rss.js
// 扫描 docs/posts/*.md，生成 RSS 2.0 订阅（docs/rss.xml）。
// 用法: node generate-rss.js

const { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const site = require("./site");
const { parseFrontmatter } = require("./parse-frontmatter");

let marked;
try {
  ({ marked } = require("marked"));
} catch (e) {
  console.warn("⚠️  marked 未安装，RSS 将输出原始 markdown。请运行 npm install marked");
  marked = { parse: (s) => s };
}

const POSTS_DIR = join(__dirname, "docs", "posts");
const RSS_OUTPUT = join(__dirname, "docs", "rss.xml");

// <?xml-stylesheet?> 引用 /xsl/rss.xsl（浏览器可读，阅读器忽略）
const XSL_PI = '<?xml-stylesheet type="text/xsl" href="/xsl/rss.xsl"?>';

const SITE_URL = site.blogUrl;            // RSS channel link 指向主站
const RSS_SELF_URL = site.rssSelfUrl;
const SITE_TITLE = site.title;
const SITE_DESC = site.description;
const AUTHOR_NAME = site.author.name;
const AUTHOR_EMAIL = site.author.email;

function parseMarkdown(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { frontmatter: {}, body: raw };
  return { frontmatter: parseFrontmatter(match[1]), body: raw.slice(match[0].length) };
}

function escapeXml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function toRfc822Date(dateStr) {
  if (!dateStr) return new Date().toUTCString();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

const MIME_MAP = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".bmp": "image/bmp",
};

if (!existsSync(POSTS_DIR)) {
  console.error(`❌ posts 目录不存在: ${POSTS_DIR}`);
  process.exit(1);
}

const posts = [];
const rawPosts = [];
const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md") && f !== "README.md");

for (const file of files.sort()) {
  // CRLF → LF：让 Windows 本地编辑的 .md 在 CI（Linux）上行为一致
  const raw = readFileSync(join(POSTS_DIR, file), "utf-8").replace(/\r\n/g, "\n");
  const { frontmatter, body } = parseMarkdown(raw);

  if (frontmatter.locked === true) continue;
  if (frontmatter.draft === true) continue;

  const slug = file.replace(/\.md$/, "");
  const article = {
    id: slug,
    title: frontmatter.title || "",
    date: frontmatter.date || "",
    last_modified: frontmatter.last_modified || frontmatter.date || "",
  };

  if (frontmatter.author) article.author = frontmatter.author;
  if (frontmatter.category) article.category = frontmatter.category;
  if (frontmatter.tags) article.tags = frontmatter.tags;
  if (frontmatter.type) article.type = frontmatter.type;
  if (frontmatter.desc) article.desc = frontmatter.desc;
  if (frontmatter.image) article.image = frontmatter.image;
  if (frontmatter.coverImage) article.image = frontmatter.coverImage;
  if (frontmatter.content_url) article.content_url = frontmatter.content_url;

  if (frontmatter.type === "note" && body && body.trim()) {
    article.content = body.trim();
  }

  posts.push(article);
  rawPosts.push({ slug, body, frontmatter });
}

posts.sort((a, b) => {
  const dateA = new Date(a.date).getTime() || 0;
  const dateB = new Date(b.date).getTime() || 0;
  return dateB - dateA;
});
rawPosts.sort((a, b) => {
  const dateA = new Date(a.frontmatter.date).getTime() || 0;
  const dateB = new Date(b.frontmatter.date).getTime() || 0;
  return dateB - dateA;
});

function generateRssFeed(allPosts, allRawPosts) {
  const lastBuildDate =
    allPosts.length > 0 ? toRfc822Date(allPosts[0].date) : new Date().toUTCString();

  const bodyMap = {};
  for (const rp of allRawPosts) bodyMap[rp.slug] = rp.body;

  const lines = [];
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push(XSL_PI);
  lines.push('<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">');
  lines.push("  <channel>");
  lines.push("    <title>" + escapeXml(SITE_TITLE) + "</title>");
  lines.push("    <link>" + escapeXml(SITE_URL) + "</link>");
  lines.push("    <description>" + escapeXml(SITE_DESC) + "</description>");
  lines.push("    <language>zh-CN</language>");
  lines.push("    <lastBuildDate>" + lastBuildDate + "</lastBuildDate>");
  lines.push("    <generator>generate-rss.js (PagesCMS)</generator>");
  lines.push('    <atom:link href="' + escapeXml(RSS_SELF_URL) + '" rel="self" type="application/rss+xml"/>');
  lines.push("    <managingEditor>" + escapeXml(AUTHOR_EMAIL) + " (" + escapeXml(AUTHOR_NAME) + ")</managingEditor>");
  lines.push("    <webMaster>" + escapeXml(AUTHOR_EMAIL) + " (" + escapeXml(AUTHOR_NAME) + ")</webMaster>");

  for (const post of allPosts) {
    // 文章详情页 URL：主站 /details/article?id=<id>
    const postUrl = site.postUrl(post.id);

    const rawBody = (bodyMap[post.id] || "").trim();
    const contentHtml = marked.parse(rawBody);

    let fullContent = "";
    if (post.image) {
      // 封面图 URL：若是 /img/ 相对路径，转绝对指向 raw-posts CDN
      const imageUrl = site.absUrl(post.image);
      fullContent += '<p><img src="' + escapeXml(imageUrl) + '" alt="' + escapeXml(post.title) + '" /></p>';
    }
    fullContent += contentHtml;

    lines.push("    <item>");
    lines.push("      <title>" + escapeXml(post.title) + "</title>");
    lines.push("      <link>" + escapeXml(postUrl) + "</link>");
    lines.push('      <guid isPermaLink="false">' + escapeXml(post.id) + "</guid>");
    lines.push("      <pubDate>" + toRfc822Date(post.date) + "</pubDate>");

    if (post.desc) {
      lines.push("      <description>" + escapeXml(post.desc) + "</description>");
    }

    lines.push("      <content:encoded><![CDATA[" + fullContent + "]]></content:encoded>");

    if (post.image) {
      const imageUrl = site.absUrl(post.image);
      const ext = (imageUrl.toLowerCase().match(/\.\w+$/) || [""])[0];
      const mime = MIME_MAP[ext] || "image/jpeg";
      lines.push('      <media:content url="' + escapeXml(imageUrl) + '" type="' + mime + '" medium="image" />');
      lines.push('      <media:thumbnail url="' + escapeXml(imageUrl) + '" />');
    }

    if (Array.isArray(post.category)) {
      for (const cat of post.category) {
        lines.push("      <category>" + escapeXml(cat) + "</category>");
      }
    }
    if (Array.isArray(post.tags)) {
      for (const tag of post.tags) {
        lines.push("      <category>" + escapeXml(tag) + "</category>");
      }
    }

    if (post.author) {
      lines.push("      <dc:creator>" + escapeXml(post.author) + "</dc:creator>");
    }

    lines.push("    </item>");
  }

  lines.push("  </channel>");
  lines.push("</rss>");
  return lines.join("\n") + "\n";
}

mkdirSync(join(__dirname, "docs"), { recursive: true });
writeFileSync(RSS_OUTPUT, generateRssFeed(posts, rawPosts), "utf-8");
console.log(`✅ 生成 rss.xml`);
console.log(`   输出: ${RSS_OUTPUT}`);
