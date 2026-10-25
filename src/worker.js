export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/") {
      const rangeHeader = request.headers.get("Range");
      if (rangeHeader && request.method === "GET") {
        return serveRange(env, url, rangeHeader);
      }
      return withAssetCors(await env.ASSETS.fetch(request));
    }

    const shellPromise = env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
    const postsPromise = env.ASSETS.fetch(new Request(new URL("/posts.json", request.url)));

    const [shellRes, postsRes] = await Promise.all([shellPromise, postsPromise]);

    let posts = [];
    let generatedAt = "";
    if (postsRes.ok) {
      try {
        const data = await postsRes.json();
        posts = data.posts || [];
        generatedAt = data.generatedAt || "";
      } catch (e) {}
    }

    const cardsHtml = posts.map((post, index) => renderCard(post, index, url.origin)).join("");

    const metaTotal = posts.length;
    const metaUpdated = generatedAt ? generatedAt.slice(0, 10) : "-";

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

async function serveRange(env, url, rangeHeader) {
  const full = await env.ASSETS.fetch(new Request(url, { method: "GET" }));
  if (!full.ok) return full;

  const buf = await full.arrayBuffer();
  const total = buf.byteLength;

  const baseHeaders = {
    "Content-Type": full.headers.get("Content-Type") || "application/octet-stream",
    "Access-Control-Allow-Origin": full.headers.get("Access-Control-Allow-Origin") || "*",
  };
  const etag = full.headers.get("ETag");
  if (etag) baseHeaders["ETag"] = etag;
  const cacheControl = full.headers.get("Cache-Control");
  if (cacheControl) baseHeaders["Cache-Control"] = cacheControl;

  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m || (m[1] === "" && m[2] === "") || !total) {
    return new Response(buf, { status: 200, headers: baseHeaders });
  }

  let start, end;
  if (m[1] === "") {
    start = Math.max(0, total - Math.max(1, Number(m[2])));
    end = total - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? total - 1 : Math.min(Number(m[2]), total - 1);
  }

  if (start > end || start >= total) {
    return new Response(null, {
      status: 416,
      headers: Object.assign({}, baseHeaders, {
        "Content-Range": "bytes */" + total,
        "Accept-Ranges": "bytes",
      }),
    });
  }

  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: Object.assign({}, baseHeaders, {
      "Content-Length": String(end - start + 1),
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
    }),
  });
}

function withAssetCors(res) {
  if (res.status !== 200 || res.headers.get("Access-Control-Allow-Origin")) return res;
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
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

  html += '</div></article>';

  return html;
}
