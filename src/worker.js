export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/") {
      return env.ASSETS.fetch(request);
    }

    const shellPromise = env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
    const postsPromise = env.ASSETS.fetch(new Request(new URL("/posts.json", request.url)));

    const [shellRes, postsRes] = await Promise.all([shellPromise, postsPromise]);

    let posts = [];
    if (postsRes.ok) {
      try {
        const data = await postsRes.json();
        posts = data.posts || [];
      } catch (e) {}
    }

    const cardsHtml = posts.map((post, index) => renderCard(post, index, url.origin)).join("");

    const metaTotal = posts.length;
    const metaUpdated = extractDate(posts);

    return new HTMLRewriter()
      .on("#items-container", {
        element(el) {
          el.setInnerContent(cardsHtml || '<div class="empty">暂无文章，posts.json 为空。</div>', { html: true });
        },
      })
      .on("#meta-total", {
        element(el) {
          el.setInnerContent(String(metaTotal));
        },
      })
      .on("#meta-updated", {
        element(el) {
          el.setInnerContent(metaUpdated);
        },
      })
      .transform(shellRes);
  },
};

function extractDate(posts) {
  for (const p of posts) {
    if (p.last_modified) return p.last_modified.slice(0, 10);
  }
  for (const p of posts) {
    if (p.date) return p.date.slice(0, 10);
  }
  return "-";
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s);
}

function formatDate(d) {
  if (!d) return "";
  return String(d).slice(0, 10);
}

function renderCard(post, index, origin) {
  const id = post.id || "";
  const title = post.title || id;
  const blogUrl = "https://blog.945426.xyz";
  const postUrl = blogUrl + "/posts/" + encodeURIComponent(id);
  const mdUrl = "/posts/" + encodeURIComponent(id) + ".md";

  let html = '<article class="item"><div class="item__inner">';

  html += '<div class="item__head">';
  html += '<h3 class="item__title"><a href="' + escapeAttr(postUrl) + '" target="_blank" rel="noopener">' + escapeHtml(title) + '</a></h3>';
  html += '<span class="item__num">#' + (index + 1) + '</span>';
  html += '</div>';

  html += '<div class="item__meta">';
  if (post.date) {
    html += '<span class="item__date">' + escapeHtml(formatDate(post.date)) + '</span>';
  }
  if (post.author) {
    html += '<span class="item__author">' + escapeHtml(post.author) + '</span>';
  }
  if (post.type) {
    html += '<span class="item__type">' + escapeHtml(post.type) + '</span>';
  }
  if (post.pinned) {
    html += '<span class="item__pinned">PINNED</span>';
  }
  html += '</div>';

  if (post.image) {
    html += '<img class="item__cover" src="' + escapeAttr(post.image) + '" alt="' + escapeAttr(title) + '" loading="lazy">';
  }

  if (Array.isArray(post.category) && post.category.length) {
    html += '<div class="item__tags">';
    post.category.forEach(function(c) {
      html += '<span class="tag">' + escapeHtml(c) + '</span>';
    });
    html += '</div>';
  }

  if (post.desc) {
    html += '<p class="item__excerpt">' + escapeHtml(post.desc) + '</p>';
  }

  html += '<div class="item__actions">';
  html += '<a class="item__cta" href="' + escapeAttr(postUrl) + '" target="_blank" rel="noopener">阅读全文 <span class="arrow">→</span></a>';
  html += '<a class="item__cta secondary" href="' + escapeAttr(mdUrl) + '">查看 Markdown</a>';
  html += '</div>';

  if (post.content && post.content.trim()) {
    html += '<details class="item__preview">';
    html += '<summary>展开正文预览</summary>';
    html += '<div class="preview-body" style="white-space: pre-wrap;">' + escapeHtml(post.content) + '</div>';
    html += '</details>';
  }

  html += '</div></article>';

  return html;
}
