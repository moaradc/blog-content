<?xml version="1.0" encoding="UTF-8"?>
<!--
  public/xsl/rss.xsl
  沫然Blog RSS 订阅可视化样式表
-->
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:content="http://purl.org/rss/1.0/modules/content/"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:media="http://search.yahoo.com/mrss/"
                xmlns:dc="http://purl.org/dc/elements/1.1/"
                exclude-result-prefixes="content atom media dc">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <!-- 根模板 -->
  <xsl:template match="/">
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>RSS Feed · 沫然Blog</title>
        <style>
          :root {
            color-scheme: dark;
            --ik-bg: #0a0a0a;
            --ik-bg-elevated: #1a1a1a;
            --ik-bg-card: #222222;
            --ik-text: #e8e8e8;
            --ik-muted: #9a9a9a;
            --ik-primary: #BFFF09;
            --ik-primary-bright: #fbfe00;
            --ik-accent: #00e5ff;
            --ik-border: #2d2d2d;
            --ik-border-strong: #3a3a3a;
            --radius-cut: 24px 24px 0 24px;
            --radius-cut-inner: 20px 20px 0 20px;
            --mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: var(--ik-bg);
            color: var(--ik-text);
            line-height: 1.6;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            background-image:
              linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
            background-size: 48px 48px;
            background-position: center top;
          }
          .container {
            width: min(1100px, calc(100% - 40px));
            margin: 0 auto;
            padding: 40px 0 64px;
          }

          /* Channel 头部 */
          .channel {
            position: relative;
            padding: 36px 32px;
            background: linear-gradient(180deg, #1c1c1c 0%, #121212 100%);
            border: 1px solid var(--ik-border);
            border-radius: var(--radius-cut);
            overflow: hidden;
          }
          .channel::before {
            content: '';
            position: absolute;
            top: 0; right: 0;
            width: 140px; height: 140px;
            background-image:
              linear-gradient(45deg, rgba(191,255,9,0.10) 25%, transparent 25% 75%, rgba(191,255,9,0.10) 75%),
              linear-gradient(45deg, rgba(191,255,9,0.10) 25%, transparent 25% 75%, rgba(191,255,9,0.10) 75%);
            background-position: 0 0, 10px 10px;
            background-size: 20px 20px;
            border-radius: 0 24px 0 100%;
            pointer-events: none;
            opacity: 0.9;
          }
          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 12px;
            font-weight: 800;
            font-style: italic;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: var(--ik-primary);
          }
          .eyebrow::before {
            content: '';
            width: 28px; height: 2px;
            background: var(--ik-primary);
          }
          .channel-title {
            position: relative;
            margin: 14px 0 8px;
            font-size: clamp(1.8rem, 4vw, 2.6rem);
            font-weight: 900;
            letter-spacing: -0.5px;
            line-height: 1.1;
            color: #fff;
          }
          .channel-desc {
            position: relative;
            color: var(--ik-muted);
            font-size: 1rem;
            max-width: 60ch;
          }
          .channel-meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 14px 22px;
            margin-top: 24px;
            padding-top: 22px;
            border-top: 1px solid var(--ik-border);
            font-size: 13px;
            color: var(--ik-muted);
            position: relative;
          }
          .channel-meta strong { color: var(--ik-text); font-weight: 600; }
          .channel-meta .meta-item { display: inline-flex; align-items: center; gap: 6px; }
          .channel-meta .dot { color: var(--ik-border-strong); }

          /* 订阅地址条 */
          .subscribe {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;
            margin-top: 20px;
            position: relative;
          }
          .feed-url {
            flex: 1 1 320px;
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            background: #0e0e0e;
            border: 1px solid var(--ik-border);
            border-radius: 9999px;
            font-family: var(--mono);
            font-size: 13px;
            color: var(--ik-text);
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          .feed-url .rss-icon { color: var(--ik-primary); flex-shrink: 0; }
          .feed-url span { overflow: hidden; text-overflow: ellipsis; }
          .copy-btn {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 18px;
            background: var(--ik-primary);
            color: #000;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 0.3px;
            border: 1px solid #000;
            border-radius: 9999px;
            cursor: pointer;
            box-shadow: inset 0 0 0 2px #000, inset 0 0 0 4px var(--ik-primary);
            transition: transform 0.1s ease;
            font-family: inherit;
          }
          .copy-btn:hover { transform: translateY(-1px); }
          .copy-btn:active { transform: translateY(0) scale(0.97); }
          .copy-btn.copied { background: var(--ik-accent); box-shadow: inset 0 0 0 2px #000, inset 0 0 0 4px var(--ik-accent); }

          /* 章节标题 */
          .section-head {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 12px;
            margin: 44px 4px 20px;
          }
          .section-title {
            font-size: 1.05rem;
            font-weight: 800;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: #fff;
          }
          .section-count {
            font-size: 13px;
            color: var(--ik-muted);
            font-variant-numeric: tabular-nums;
          }
          .section-count strong { color: var(--ik-primary); font-weight: 800; }

          /* 文章卡片列表 */
          .items { display: flex; flex-direction: column; gap: 16px; }
          .item {
            position: relative;
            padding: 4px;
            background: #000;
            border: 1px solid var(--ik-border);
            border-radius: var(--radius-cut);
            transition: border-color 0.2s ease, transform 0.2s ease;
          }
          .item:hover { border-color: var(--ik-primary); }
          .item__inner {
            padding: 24px 26px;
            background: linear-gradient(180deg, #1e1e1e 0%, #161616 100%);
            border-radius: var(--radius-cut-inner);
          }
          .item__head {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 12px;
          }
          .item__title {
            font-size: 1.22rem;
            font-weight: 700;
            line-height: 1.35;
            letter-spacing: -0.2px;
          }
          .item__title a { color: #fff; text-decoration: none; transition: color 0.15s ease; }
          .item__title a:hover { color: var(--ik-primary); }
          .item__num {
            flex-shrink: 0;
            font-family: var(--mono);
            font-size: 12px;
            color: var(--ik-border-strong);
            font-variant-numeric: tabular-nums;
            padding-top: 4px;
          }
          .item__meta {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px 14px;
            margin-bottom: 14px;
            font-size: 12.5px;
            color: var(--ik-muted);
          }
          .item__date {
            font-family: var(--mono);
            font-variant-numeric: tabular-nums;
          }
          .item__author {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 11px;
            background: #2a2a2a;
            border: 1px solid var(--ik-border);
            border-radius: 9999px;
            font-size: 12px;
            color: #d4d4d4;
          }
          .item__author::before {
            content: '';
            width: 6px; height: 6px;
            border-radius: 50%;
            background: var(--ik-primary);
          }
          .item__tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 14px; }
          .tag {
            padding: 3px 11px;
            background: #181818;
            border: 1px solid var(--ik-border);
            border-radius: 9999px;
            font-size: 11.5px;
            color: var(--ik-muted);
            transition: color 0.15s ease, border-color 0.15s ease;
          }
          .tag:hover { color: var(--ik-primary); border-color: var(--ik-primary); }
          .item__excerpt {
            color: #b8b8b8;
            font-size: 0.95rem;
            line-height: 1.65;
            margin: 0 0 16px;
          }
          .item__excerpt.empty { color: var(--ik-border-strong); font-style: italic; }
          .item__actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
          .item__cta {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 9px 18px;
            background: transparent;
            color: var(--ik-primary);
            font-size: 13px;
            font-weight: 700;
            text-decoration: none;
            border: 1px solid var(--ik-primary);
            border-radius: 9999px;
            transition: background 0.15s ease, color 0.15s ease;
          }
          .item__cta:hover { background: var(--ik-primary); color: #000; }
          .item__cta .arrow { transition: transform 0.15s ease; }
          .item__cta:hover .arrow { transform: translateX(3px); }

          /* 正文预览折叠区 */
          .item__preview { margin-top: 16px; border-top: 1px solid var(--ik-border); padding-top: 14px; }
          .item__preview > summary {
            cursor: pointer;
            font-size: 12.5px;
            color: var(--ik-muted);
            list-style: none;
            user-select: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: color 0.15s ease;
          }
          .item__preview > summary::-webkit-details-marker { display: none; }
          .item__preview > summary::before { content: '▸'; color: var(--ik-primary); font-size: 11px; }
          .item__preview[open] > summary::before { content: '▾'; }
          .item__preview > summary:hover { color: var(--ik-text); }
          .preview-body {
            margin-top: 12px;
            padding: 18px;
            background: #0e0e0e;
            border: 1px solid var(--ik-border);
            border-radius: 14px;
            font-size: 0.9rem;
            line-height: 1.75;
            color: #c8c8c8;
            max-height: 520px;
            overflow: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.18) transparent;
          }
          .preview-body::-webkit-scrollbar { width: 6px; height: 6px; }
          .preview-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 3px; }
          .preview-body h1, .preview-body h2, .preview-body h3 { color: var(--ik-text); margin: 1em 0 0.4em; line-height: 1.3; }
          .preview-body h1 { font-size: 1.3rem; }
          .preview-body h2 { font-size: 1.15rem; }
          .preview-body h3 { font-size: 1.02rem; }
          .preview-body p { margin: 0.7em 0; }
          .preview-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 0.6em 0; }
          .preview-body a { color: var(--ik-primary); }
          .preview-body pre {
            background: #161616; padding: 12px 14px; border-radius: 8px; overflow-x: auto;
            border: 1px solid var(--ik-border); margin: 0.8em 0;
          }
          .preview-body code { font-family: var(--mono); font-size: 0.85em; }
          .preview-body blockquote {
            border-left: 3px solid var(--ik-primary);
            padding: 2px 14px; margin: 0.8em 0; color: var(--ik-muted);
            background: rgba(191,255,9,0.03);
          }
          .preview-body table { border-collapse: collapse; margin: 0.8em 0; }
          .preview-body th, .preview-body td { border: 1px solid var(--ik-border); padding: 6px 10px; }

          /* 空状态 */
          .empty {
            padding: 48px 24px;
            text-align: center;
            color: var(--ik-muted);
            background: var(--ik-bg-elevated);
            border: 1px dashed var(--ik-border);
            border-radius: var(--radius-cut);
          }

          /* 页脚 */
          .ik-footer {
            margin-top: 56px;
            padding: 28px 0 0;
            border-top: 1px solid #1e1e1e;
            text-align: center;
            color: var(--ik-muted);
            font-size: 13px;
            line-height: 1.7;
          }
          .ik-footer a { color: var(--ik-primary); text-decoration: none; }
          .ik-footer a:hover { text-decoration: underline; }
          .ik-footer .brand { color: #fff; font-weight: 800; letter-spacing: 0.3px; }

          /* 响应式 */
          @media (max-width: 640px) {
            .container { width: calc(100% - 24px); padding: 24px 0 48px; }
            .channel { padding: 26px 20px; }
            .channel::before { width: 90px; height: 90px; }
            .item__inner { padding: 20px 18px; }
            .item__title { font-size: 1.08rem; }
            .feed-url { flex: 1 1 100%; }
          }

          @media (prefers-reduced-motion: reduce) {
            * { transition: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <xsl:apply-templates/>
          <footer class="ik-footer">
            <p><span class="brand">沫然Blog</span> · RSS 2.0 Feed</p>
            <p>此页面由 <a href="/">rss.xsl</a> 自动渲染 · <a href="/">返回首页</a></p>
          </footer>
        </div>
        <script>
          (function () {
            var btn = document.querySelector('.copy-btn');
            if (!btn) return;
            var url = btn.getAttribute('data-url');
            var orig = btn.textContent;
            var flash = function (text, ok) {
              if (ok) btn.classList.add('copied');
              btn.textContent = text;
              setTimeout(function () {
                btn.classList.remove('copied');
                btn.textContent = orig;
              }, 1500);
            };
            var fallbackCopy = function () {
              var ta = document.createElement('textarea');
              ta.value = url;
              ta.setAttribute('readonly', '');
              ta.style.position = 'absolute';
              ta.style.left = '-9999px';
              ta.style.top = '0';
              document.body.appendChild(ta);
              ta.focus();
              ta.select();
              try { ta.setSelectionRange(0, ta.value.length); } catch (e) {}
              var ok = false;
              try { ok = document.execCommand('copy'); } catch (e) {}
              document.body.removeChild(ta);
              if (ok) flash('已复制 ✓', true);
              else flash('复制失败 ✗', false);
            };
            btn.addEventListener('click', function () {
              if (window.isSecureContext &amp;&amp; navigator.clipboard &amp;&amp; navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(
                  function () { flash('已复制 ✓', true); },
                  function () { fallbackCopy(); }
                );
              } else {
                fallbackCopy();
              }
            });
          })();
        </script>
      </body>
    </html>
  </xsl:template>

  <!-- channel 模式：站点信息 + 文章列表 -->
  <xsl:template match="channel">
    <!-- 头部信息卡 -->
    <section class="channel">
      <span class="eyebrow">RSS Feed</span>
      <h1 class="channel-title"><xsl:value-of select="title"/></h1>
      <xsl:if test="description">
        <p class="channel-desc"><xsl:value-of select="description"/></p>
      </xsl:if>

      <div class="channel-meta">
        <span class="meta-item"><strong><xsl:value-of select="count(item)"/></strong> 篇文章</span>
        <span class="dot">·</span>
        <span class="meta-item">语言 <strong><xsl:value-of select="language"/></strong></span>
        <xsl:if test="lastBuildDate">
          <span class="dot">·</span>
          <span class="meta-item">最近更新 <strong><xsl:value-of select="substring(lastBuildDate, 1, 16)"/></strong></span>
        </xsl:if>
        <xsl:if test="managingEditor">
          <span class="dot">·</span>
          <span class="meta-item">主编 <strong><xsl:value-of select="managingEditor"/></strong></span>
        </xsl:if>
      </div>

      <!-- 订阅地址条 -->
      <xsl:if test="atom:link/@href">
        <div class="subscribe">
          <code class="feed-url">
            <span class="rss-icon">📡</span>
            <span><xsl:value-of select="atom:link/@href"/></span>
          </code>
          <button class="copy-btn" type="button" data-url="{atom:link/@href}">复制订阅地址</button>
        </div>
      </xsl:if>
    </section>

    <!-- 文章列表 -->
    <div class="section-head">
      <h2 class="section-title">文章列表</h2>
    </div>

    <xsl:choose>
      <xsl:when test="item">
        <div class="items">
          <xsl:apply-templates select="item"/>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <div class="empty">暂无文章，RSS 订阅为空。</div>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- item 模式：单篇文章卡片 -->
  <xsl:template match="item">
    <article class="item">
      <div class="item__inner">
        <div class="item__head">
          <h3 class="item__title">
            <a href="{link}"><xsl:value-of select="title"/></a>
          </h3>
        </div>

        <div class="item__meta">
          <xsl:if test="pubDate">
            <span class="item__date"><xsl:value-of select="substring(pubDate, 1, 16)"/></span>
          </xsl:if>
          <xsl:if test="dc:creator">
            <span class="item__author"><xsl:value-of select="dc:creator"/></span>
          </xsl:if>
        </div>

        <xsl:if test="category">
          <div class="item__tags">
            <xsl:for-each select="category">
              <span class="tag"><xsl:value-of select="."/></span>
            </xsl:for-each>
          </div>
        </xsl:if>

        <xsl:if test="description">
          <p class="item__excerpt"><xsl:value-of select="description"/></p>
        </xsl:if>

        <div class="item__actions">
          <a class="item__cta" href="{link}">阅读全文 <span class="arrow">→</span></a>
        </div>

        <xsl:if test="content:encoded">
          <details class="item__preview">
            <summary>展开正文预览</summary>
            <div class="preview-body">
              <xsl:value-of select="content:encoded" disable-output-escaping="yes"/>
            </div>
          </details>
        </xsl:if>
      </div>
    </article>
  </xsl:template>
</xsl:stylesheet>
