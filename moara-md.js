/* =========================================================================
 *  moara-md.js — 沫然Blog Markdown 扩展层（浏览器 / Node 双端共享）
 * =========================================================================
 *  同一份实现同时供两条渲染管线使用，保证产物一致：
 *    - 浏览器端：/article?id=<> 页面由 article.js 调用（marked v15 前置变换）
 *    - Node 端 ：blog-content 仓 generate-article-html.js require 本文件
 *                （/posts/<id> SEO 直出 HTML）
 *
 *  与本文件保持同步的副本：blog-content 仓根目录 moara-md.js（复制即用，
 *  两仓无共享子模块机制，以文件头版本号标记同步点）。
 *
 *  ── 指令语法（本文档为准，docs/posts/README.md 面向作者摘录） ──
 *
 *  1. 折叠面板（取代旧版 <div class="details-box"> 手写 HTML）：
 *         :::folding{title="点击展开 — 查看详细配置说明"}
 *         任意块级内容（列表 / 表格 / 代码块 / 嵌套折叠 …）
 *         :::
 *     加 open 属性默认展开：:::folding{title="..." open}
 *
 *  2. 选项卡：
 *         ::::tabs
 *         :::tab{title="NPM"}
 *         内容……
 *         :::
 *         :::tab{title="PNPM" notoc}
 *         内容……
 *         :::
 *         ::::
 *     notoc：面板内标题不进目录。围栏长度决定嵌套层级（同 CommonMark 代码围栏）。
 *
 *  3. 视频嵌入（容器形式 / 叶子形式皆可，叶子形式用于折叠块内部）：
 *         :::video{type="bilibili" id="BVxxxxxxxx"}
 *         ::video{type="youtube" id="dQw4w9WgXcQ"}
 *         ::video{url="https://example.com/demo.mp4" poster="..."}
 *     type + id 支持 bilibili / youtube；url/src 为直链视频走原生播放器。
 *
 *  4. 链接卡片：
 *         :::linkcard{url="https://example.com" title="示例站点"}
 *         ::linkcard{post="104"}          → 站内文章卡片（运行时解析标题）
 *     图标策略：文件后缀 → 文件类型图标；普通域名 → favicon；皆无 → 不显示。
 *
 *  5. 仓库卡片：:::github{repo="owner/repo"}（运行时经 GitHub API 填充星标）
 *
 *  6. VitePress 风格 admonition（引用块语法）：
 *         > [!NOTE] 可选自定义标题
 *         > 正文支持任意 Markdown / 指令。
 *     类型见 ADM_TYPES；后缀 + 默认展开可折叠，- 默认折叠。
 *
 *  7. 行内防剧透：:spoiler[被隐藏的文字]
 *
 *  8. 脚注：[^1] 引用（可多处复用）；[^1]: 定义可出现在全文任意位置，
 *     生成物统一汇总至文末（正文占位，postprocess 阶段 inline 渲染定义体）。
 *
 *  ── 管线 ──
 *    preprocess(bodyMd)  → { text, ctx }
 *        ① 摘离代码区（围栏 / 行内）→ 随机占位符（防误解析，之后原样归还）
 *        ② 保护遗留自定义标签（<music>/<gallery>/旧 details-box/黑幕/待办）
 *        ③ admonition 变换（引用块 [!TYPE]）
 *        ④ 容器指令变换（栈式解析 + 递归，支持任意嵌套）
 *        ⑤ 脚注收集与引用替换
 *        ⑥ 行内 :spoiler[] 变换
 *        ⑦ 归还代码区（让 marked 正常解析高亮 / Mermaid）
 *    postprocess(html, ctx, { parseInline }) → html
 *        ① 脚注定义体 inline 渲染回填
 *        ② 遗留自定义标签占位符还原
 *
 *  纯字符串变换、零 DOM 依赖；防御式实现：未知指令 / 未闭合围栏一律按
 *  原文输出并告警（opts.onWarn），绝不吞正文。
 * ========================================================================= */
(function (global, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else {
        global.MoaraMd = factory();
    }
})(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    var VERSION = '1.0.0';

    /* ------------------------------------------------------------------
     * 基础工具
     * ------------------------------------------------------------------ */

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function makeNonce() {
        return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    /**
     * 解析指令属性串 {a="1" b='2' c=3 flag}
     * 布尔旗标（无 =）置 true；返回普通对象。
     */
    function parseAttrs(raw) {
        var attrs = {};
        if (!raw) return attrs;
        var re = /([a-zA-Z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=}]+))|([a-zA-Z_][\w-]*)/g;
        var m;
        while ((m = re.exec(raw))) {
            if (m[5] !== undefined) {
                attrs[m[5]] = true;
            } else if (m[1] !== undefined) {
                attrs[m[1]] = (m[2] !== undefined) ? m[2] : (m[3] !== undefined) ? m[3] : m[4];
            }
        }
        return attrs;
    }

    function indentBlock(text, indent) {
        if (!indent) return text;
        return text.split('\n').map(function (l) { return l ? indent + l : l; }).join('\n');
    }

    /* ------------------------------------------------------------------
     * admonition（> [!TYPE]）类型表
     * ------------------------------------------------------------------ */

    var ADM_TYPES = {
        note:     { icon: 'ri-sticky-note-line',      label: '备注'   },
        abstract: { icon: 'ri-file-text-line',        label: '摘要'   },
        info:     { icon: 'ri-information-line',      label: '信息'   },
        tip:      { icon: 'ri-lightbulb-line',        label: '提示'   },
        success:  { icon: 'ri-checkbox-circle-line',  label: '成功'   },
        question: { icon: 'ri-question-line',         label: '问题'   },
        warning:  { icon: 'ri-alert-line',            label: '警告'   },
        failure:  { icon: 'ri-close-circle-line',     label: '失败'   },
        danger:   { icon: 'ri-alert-fill',            label: '危险'   },
        bug:      { icon: 'ri-bug-line',              label: '缺陷'   },
        example:  { icon: 'ri-flask-line',            label: '示例'   },
        quote:    { icon: 'ri-double-quotes-l',       label: '引用'   },
        important:{ icon: 'ri-shield-star-line',      label: '重要'   }
    };

    /* 同义别名归一 */
    var ADM_ALIASES = {
        tldr: 'abstract', summary: 'abstract',
        cite: 'quote',
        help: 'question', faq: 'question',
        check: 'success', done: 'success', updated: 'success',
        attention: 'warning', caution: 'warning',
        fail: 'failure', missing: 'failure', error: 'bug',
        highlight: 'important'
    };

    var ADM_MARKER_RE = /^\[!(\w+)\][ \t]*([+-]?)[ \t]*(.*)$/;

    /* ------------------------------------------------------------------
     * ① 代码区摘离 / ⑦ 归还
     * ------------------------------------------------------------------ */

    /**
     * 摘离围栏代码块与行内 code span，防止其内容被后续变换误处理。
     * 占位符含随机 nonce，避免与正文同形文本碰撞；还原用 split/join，
     * 规避 String.replace 对 $ 等替换特殊字符的二次解释。
     */
    function extractCode(text, ctx) {
        var codeSpans = [];
        var nonce = makeNonce();
        var ph = function (i) { return '%%MD_CODE_' + nonce + '_' + i + '%%'; };

        /* fenced code block：```lang 或 ~~~lang 起始，同串围栏闭合 */
        var fenceRegex = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n[ \t]*\1[ \t]*(?=\n|$)/gm;
        text = text.replace(fenceRegex, function (match) {
            codeSpans.push(match);
            return ph(codeSpans.length - 1);
        });

        /* 行内 code span：成对反引号，内容不含空行（与 CommonMark 宽松近似） */
        var inlineCodeRegex = /(`+)(?!`)((?:[^`]|\n(?!\n))+?)\1(?!`)/g;
        text = text.replace(inlineCodeRegex, function (match) {
            codeSpans.push(match);
            return ph(codeSpans.length - 1);
        });

        ctx.codeSpans = codeSpans;
        ctx.codeNonce = nonce;
        return text;
    }

    function restoreCode(text, ctx) {
        if (!ctx.codeSpans || !ctx.codeSpans.length) return text;
        var out = text;
        for (var i = 0; i < ctx.codeSpans.length; i++) {
            out = out.split('%%MD_CODE_' + ctx.codeNonce + '_' + i + '%%').join(ctx.codeSpans[i]);
        }
        return out;
    }

    /* ------------------------------------------------------------------
     * ② 遗留自定义标签保护（与旧版行为等价，旧语法仅作兼容降级）
     * ------------------------------------------------------------------ */

    function protectLegacyTags(text, ctx) {
        var placeholders = ctx.customTags || (ctx.customTags = []);
        var nonce = ctx.tagNonce || (ctx.tagNonce = makeNonce());
        var ph = function (i) { return '\n%%CUSTOM_TAG_' + nonce + '_' + i + '%%\n'; };

        var push = function (match) {
            placeholders.push(match);
            return ph(placeholders.length - 1);
        };

        /* 成对自定义标签：<music id="x"></music> / <gallery src="a, b"></gallery> */
        text = text.replace(/<(music|gallery)\b[^>]*>[\s\S]*?<\/\1>/gi, push);

        /* 旧版折叠框整块 HTML（已废弃，此处仅为防截断保护；渲染走旧 CSS） */
        text = text.replace(/<div\b[^>]*class=["'][^"']*details-box[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, push);

        /* 行内黑幕 <span class='spoiler'>…</span> */
        text = text.replace(/<span\b[^>]*class=['"][^'"]*spoiler[^'"]*['"][^>]*>[\s\S]*?<\/span>/gi, function (match) {
            /* 行内元素占位符不加换行，避免污染段落结构 */
            var idx = placeholders.length;
            placeholders.push(match);
            return '%%CUSTOM_TAG_' + nonce + '_' + idx + '%%';
        });

        /* 待办清单 <ul class="todo-list">…</ul> */
        text = text.replace(/<ul\b[^>]*class=['"][^'"]*todo-list[^'"]*['"][^>]*>[\s\S]*?<\/ul>/gi, push);

        return text;
    }

    function restoreLegacyTags(html, ctx) {
        if (!ctx.customTags || !ctx.customTags.length) return html;
        var out = html;
        for (var i = 0; i < ctx.customTags.length; i++) {
            out = out.split('%%CUSTOM_TAG_' + ctx.tagNonce + '_' + i + '%%').join(ctx.customTags[i]);
        }
        return out;
    }

    /* ------------------------------------------------------------------
     * ③ admonition 变换（> [!TYPE] 引用块 → 提示框 HTML）
     * ------------------------------------------------------------------ */

    function transformAdmonitions(text, opts) {
        var lines = text.split('\n');
        var out = [];
        var i = 0;

        while (i < lines.length) {
            var line = lines[i];

            /* 收集连续引用块行（含 > 空行） */
            if (/^[ \t]*>/.test(line)) {
                var j = i;
                var quote = [];
                while (j < lines.length && /^[ \t]*>/.test(lines[j])) {
                    quote.push(lines[j].replace(/^[ \t]*>[ \t]?/, ''));
                    j++;
                }

                /* 标记必须位于引用块首个非空行（与 GitHub 行为一致） */
                var firstIdx = 0;
                while (firstIdx < quote.length && !quote[firstIdx].trim()) firstIdx++;
                var marker = firstIdx < quote.length ? quote[firstIdx].match(ADM_MARKER_RE) : null;

                if (marker) {
                    var rawType = marker[1].toLowerCase();
                    var type = ADM_ALIASES[rawType] || rawType;
                    var collapse = marker[2] || '';
                    var customTitle = marker[3].trim();

                    if (!ADM_TYPES[type]) {
                        /* 未知类型：原样输出引用块，告警不吞内容 */
                        if (opts && opts.onWarn) opts.onWarn('[moara-md] 未知 admonition 类型: ' + rawType);
                        out.push(lines.slice(i, j).join('\n'));
                        i = j;
                        continue;
                    }

                    var conf = ADM_TYPES[type];
                    var title = escapeHtml(customTitle || conf.label);
                    var isCollapsible = collapse === '+' || collapse === '-';
                    var openByDefault = collapse === '+';

                    var inner = quote.slice(firstIdx + 1).join('\n').replace(/^\n+/, '').replace(/\n+$/, '');

                    var headAttrs = isCollapsible
                        ? ' role="button" tabindex="0" aria-expanded="' + (openByDefault ? 'true' : 'false') + '"'
                        : '';
                    var chevron = isCollapsible
                        ? '\n<i class="admonition-chevron ri-arrow-right-s-line" aria-hidden="true"></i>'
                        : '';
                    var boxAttrs = isCollapsible
                        ? ' data-collapsible' + (openByDefault ? ' data-open="true"' : '')
                        : '';

                    out.push(
                        '<div class="admonition admonition-' + type + '"' + boxAttrs + '>' +
                        '\n<div class="admonition-title"' + headAttrs + '>' +
                        '\n<i class="' + conf.icon + '" aria-hidden="true"></i>' +
                        '\n<span class="admonition-title-text">' + title + '</span>' + chevron +
                        '\n</div>' +
                        '\n<div class="admonition-body">' +
                        '\n\n' + inner + '\n\n' +
                        '\n</div>' +
                        '\n</div>'
                    );
                    i = j;
                } else {
                    /* 普通引用块：原样保留 */
                    out.push(lines.slice(i, j).join('\n'));
                    i = j;
                }
            } else {
                out.push(line);
                i++;
            }
        }
        return out.join('\n');
    }

    /* ------------------------------------------------------------------
     * ④ 容器指令变换（栈式解析）
     * ------------------------------------------------------------------ */

    var DIRECTIVE_OPEN_RE = /^([ \t]*)(::+)([a-zA-Z][\w-]*)(?:[ \t]*\{(.*)\})?[ \t]*$/;
    var DIRECTIVE_CLOSE_RE = /^([ \t]*)(::+)[ \t]*$/;

    /* 叶子指令（双冒号、单行、无闭合围栏） */
    var LEAF_DIRECTIVES = ['video', 'linkcard', 'github'];
    /* 容器指令（三冒号及以上、需闭合围栏） */
    var CONTAINER_DIRECTIVES = ['folding', 'tabs', 'tab'];
    /* 无正文指令：三冒号形式同样自足（不消费闭合围栏，正文无意义）。
       文档约定：折叠块内建议使用 :: 叶子形式，避免围栏歧义。 */
    var BODYLESS_DIRECTIVES = ['video', 'linkcard', 'github'];

    var tabsUid = 0;

    /**
     * 渲染视频嵌入节点。attrs：type / id / url|src / poster / title / aspect。
     */
    function renderVideo(attrs) {
        var type = String(attrs.type || '').toLowerCase();
        var id = String(attrs.id || '').trim();
        var url = String(attrs.url || attrs.src || '').trim();
        var poster = attrs.poster ? String(attrs.poster) : '';
        var title = attrs.title ? String(attrs.title) : '';
        var aspect = String(attrs.aspect || '16:9').replace(/[^\d:]/g, '') || '16:9';

        var src = '';
        var isIframe = false;

        if (type === 'bilibili' || (!type && /^BV[a-zA-Z0-9]{8,12}$/.test(id))) {
            isIframe = true;
            src = 'https://player.bilibili.com/player.html?bvid=' + encodeURIComponent(id) + '&autoplay=0&danmaku=0&page=1&high_quality=1';
            if (!title) title = 'bilibili 视频播放器';
        } else if (type === 'youtube' || (!type && /^[\w-]{11}$/.test(id) && !url)) {
            isIframe = true;
            src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0';
            if (!title) title = 'YouTube 视频播放器';
        } else if (url) {
            /* 直链视频：原生 <video> 控件 */
            src = url;
        } else if (id) {
            /* 仅给 id：视作直链 */
            src = id;
        }

        if (!src) return '';

        var inner;
        if (isIframe) {
            inner = '<iframe src="' + escapeHtml(src) + '" title="' + escapeHtml(title || '嵌入视频') + '"' +
                ' loading="lazy" scrolling="no"' +
                ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"' +
                ' allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>';
        } else {
            inner = '<video controls preload="metadata" playsinline src="' + escapeHtml(src) + '"' +
                (poster ? ' poster="' + escapeHtml(poster) + '"' : '') + '></video>' +
                (title ? '\n<span class="video-embed-caption">' + escapeHtml(title) + '</span>' : '');
        }

        return '<div class="video-embed" data-aspect="' + escapeHtml(aspect) + '">' + inner + '</div>';
    }

    /**
     * 渲染链接卡片外壳。图标 / 站内标题由 article.js 运行时填充
     * （SEO 直出 HTML 同样经 article.js 增强，两路径行为一致）。
     */
    function renderLinkcard(attrs) {
        var url = String(attrs.url || attrs.src || '').trim();
        var post = String(attrs.post || '').trim();
        var title = attrs.title ? String(attrs.title) : '';

        if (post && !url) {
            return '<a class="md-linkcard" data-linkcard data-post="' + escapeHtml(post) + '"' +
                ' href="/posts/' + encodeURIComponent(post) + '">' +
                '\n<span class="md-linkcard-icon" data-linkcard-icon aria-hidden="true"><i class="ri-article-line"></i></span>' +
                '\n<span class="md-linkcard-main">' +
                '\n<span class="md-linkcard-title">' + (title ? escapeHtml(title) : '加载标题中…') + '</span>' +
                '\n<span class="md-linkcard-host">本站文章 #' + escapeHtml(post) + '</span>' +
                '\n</span>' +
                '\n<i class="ri-arrow-right-up-line md-linkcard-arrow" aria-hidden="true"></i>' +
                '\n</a>';
        }

        if (!url) return '';

        var host = '';
        try { host = new URL(url).hostname; } catch (e) { host = url.replace(/^https?:\/\//, '').split('/')[0]; }

        return '<a class="md-linkcard" data-linkcard data-url="' + escapeHtml(url) + '"' +
            ' href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
            '\n<span class="md-linkcard-icon" data-linkcard-icon aria-hidden="true"></span>' +
            '\n<span class="md-linkcard-main">' +
            '\n<span class="md-linkcard-title">' + (title ? escapeHtml(title) : escapeHtml(host)) + '</span>' +
            '\n<span class="md-linkcard-host">' + escapeHtml(host) + '</span>' +
            '\n</span>' +
            '\n<i class="ri-arrow-right-up-line md-linkcard-arrow" aria-hidden="true"></i>' +
            '\n</a>';
    }

    /**
     * 渲染 GitHub 仓库卡片外壳（星标等数据运行时经 API 填充）。
     */
    function renderGithubCard(attrs) {
        var repo = String(attrs.repo || '').trim();
        if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return '';
        return '<a class="md-github-card" data-github-card data-repo="' + escapeHtml(repo) + '"' +
            ' href="https://github.com/' + escapeHtml(repo) + '" target="_blank" rel="noopener noreferrer">' +
            '\n<span class="md-github-card-head">' +
            '\n<i class="ri-github-fill" aria-hidden="true"></i>' +
            '\n<span class="md-github-card-repo">' + escapeHtml(repo) + '</span>' +
            '\n<i class="ri-arrow-right-up-line md-github-card-arrow" aria-hidden="true"></i>' +
            '\n</span>' +
            '\n<span class="md-github-card-desc" data-github-desc>View repository on GitHub</span>' +
            '\n<span class="md-github-card-meta">' +
            '\n<span class="md-github-stat" data-github-stars><i class="ri-star-line" aria-hidden="true"></i><span>—</span></span>' +
            '\n<span class="md-github-stat" data-github-forks><i class="ri-git-fork-line" aria-hidden="true"></i><span>—</span></span>' +
            '\n</span>' +
            '\n</a>';
    }

    /** 渲染叶子 / 自闭合指令（video、linkcard、github） */
    function renderLeafDirective(name, attrs) {
        switch (name) {
            case 'video':     return renderVideo(attrs);
            case 'linkcard':  return renderLinkcard(attrs);
            case 'github':    return renderGithubCard(attrs);
            default:          return '';
        }
    }

    /** 折叠面板外壳（结构与运行时 bindCollapsible 绑定协议一致） */
    function renderFoldingOpen(attrs) {
        var title = attrs.title != null && String(attrs.title).trim() !== ''
            ? String(attrs.title)
            : '点击展开';
        var open = attrs.open === true || String(attrs.open).toLowerCase() === 'true';
        return '<div class="details-box' + (open ? ' open' : '') + '" data-fold>' +
            '\n<div class="details-header" role="button" tabindex="0" aria-expanded="' + (open ? 'true' : 'false') + '">' +
            '\n<span class="details-title">' + escapeHtml(title) + '</span>' +
            '\n<i class="details-icon ri-arrow-right-s-line" aria-hidden="true"></i>' +
            '\n</div>' +
            '\n<div class="details-content-wrapper">' +
            '\n<div class="details-inner">';
    }

    var FOLDING_CLOSE = '</div>\n</div>\n</div>';

    /**
     * 指令主变换：栈式解析容器围栏，递归处理帧体。
     * 未闭合围栏 / 未知指令 / tab 脱离 tabs → 原文降级输出 + 告警。
     */
    function transformDirectives(text, opts) {
        var lines = text.split('\n');
        var out = [];
        var stack = [];
        var i = 0;

        var warn = function (msg) {
            if (opts && opts.onWarn) opts.onWarn('[moara-md] ' + msg);
        };

        var findTabsFrame = function () {
            for (var k = stack.length - 1; k >= 0; k--) {
                if (stack[k].name === 'tabs') return stack[k];
            }
            return null;
        };

        var emitBlock = function (html, indent) {
            out.push('\n\n' + indentBlock(html, indent) + '\n\n');
        };

        /** 关闭一个栈帧：folding/tab/tabs/video容器/linkcard容器/github容器 */
        var closeFrame = function (frame) {
            var body = frame.bodyLines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');

            switch (frame.name) {
                case 'folding': {
                    var inner = transformDirectives(body, opts);
                    emitBlock(
                        frame.htmlOpen + '\n\n' + (inner || '') + '\n\n' + FOLDING_CLOSE,
                        frame.indent
                    );
                    break;
                }
                case 'tabs': {
                    var uid = ++tabsUid;
                    var bar = '';
                    var panels = '';
                    frame.panels.forEach(function (p, idx) {
                        var btnId = 'md-tab-' + uid + '-' + idx;
                        var panelId = 'md-tabpanel-' + uid + '-' + idx;
                        bar += '<button class="md-tab-btn" type="button" role="tab" id="' + btnId + '"' +
                            ' aria-controls="' + panelId + '" aria-selected="' + (idx === 0 ? 'true' : 'false') + '"' +
                            (idx === 0 ? '' : ' tabindex="-1"') + '>' + escapeHtml(p.title) + '</button>\n';
                        panels += '<div class="md-tab-panel" role="tabpanel" id="' + panelId + '"' +
                            ' aria-labelledby="' + btnId + '" tabindex="0"' +
                            (p.notoc ? ' data-notoc' : '') +
                            (idx === 0 ? '' : ' hidden') + '>' +
                            '\n\n' + p.html + '\n\n' +
                            '</div>\n';
                    });
                    emitBlock(
                        '<div class="md-tabs" data-md-tabs>' +
                        '\n<div class="md-tabs-bar" role="tablist">' +
                        '\n' + bar +
                        '</div>' +
                        '\n' + panels +
                        '</div>',
                        frame.indent
                    );
                    break;
                }
                default:
                    /* 不可达（未知指令不入栈） */
                    emitBlock(frame.raw + '\n' + body + '\n' + ':::', frame.indent);
            }
        };

        while (i < lines.length) {
            var line = lines[i];
            var openMatch = line.match(DIRECTIVE_OPEN_RE);

            if (openMatch) {
                var indent = openMatch[1];
                var fenceLen = openMatch[2].length;
                var name = openMatch[3].toLowerCase();
                var attrs = parseAttrs(openMatch[4] || '');

                /* 叶子指令（恰好两个冒号）：单行自足 */
                if (fenceLen === 2) {
                    if (LEAF_DIRECTIVES.indexOf(name) !== -1) {
                        var leafHtml = renderLeafDirective(name, attrs);
                        if (leafHtml) {
                            emitBlock(leafHtml, indent);
                            i++;
                            continue;
                        }
                        warn('::' + name + ' 指令参数缺失：' + line.trim());
                        /* 参数缺失 → 原文降级 */
                    }
                    /* 非已知叶子指令：按普通文本继续（交 marked 处理） */
                    out.push(line);
                    i++;
                    continue;
                }

                /* 无正文指令（>= 3 冒号的 video/linkcard/github）：自足渲染，
                   不入栈、不消费后续围栏 —— 其后的 ::: 属于外层容器 */
                if (BODYLESS_DIRECTIVES.indexOf(name) !== -1) {
                    var bodylessHtml = renderLeafDirective(name, attrs);
                    if (bodylessHtml) {
                        emitBlock(bodylessHtml, indent);
                        i++;
                        continue;
                    }
                    warn(':::' + name + ' 指令参数缺失（原样输出）: ' + line.trim());
                    out.push(line);
                    i++;
                    continue;
                }

                /* 容器指令（>= 3 冒号） */
                if (CONTAINER_DIRECTIVES.indexOf(name) === -1) {
                    warn('未知容器指令（原样输出）: ' + line.trim());
                    out.push(line);
                    i++;
                    continue;
                }

                if (name === 'tab') {
                    var tabsFrame = findTabsFrame();
                    if (!tabsFrame) {
                        warn(':::tab 必须位于 ::::tabs 容器内（原样输出）: ' + line.trim());
                        out.push(line);
                        i++;
                        continue;
                    }
                    stack.push({
                        name: 'tab',
                        fenceLen: fenceLen,
                        indent: indent,
                        attrs: attrs,
                        bodyLines: [],
                        raw: line,
                        owner: tabsFrame
                    });
                    i++;
                    continue;
                }

                var htmlOpen = '';
                if (name === 'folding') {
                    htmlOpen = renderFoldingOpen(attrs);
                }

                stack.push({
                    name: name,
                    fenceLen: fenceLen,
                    indent: indent,
                    attrs: attrs,
                    bodyLines: [],
                    panels: [],
                    raw: line,
                    htmlOpen: htmlOpen
                });
                i++;
                continue;
            }

            var closeMatch = line.match(DIRECTIVE_CLOSE_RE);
            if (closeMatch && stack.length > 0) {
                var closeLen = closeMatch[2].length;
                var topFrame = stack[stack.length - 1];
                /* 闭合围栏长度须不小于开启围栏（同 CommonMark 语义） */
                if (closeLen >= topFrame.fenceLen) {
                    var frame = stack.pop();
                    if (frame.name === 'tab') {
                        var innerHtml = transformDirectives(frame.bodyLines.join('\n'), opts);
                        frame.owner.panels.push({
                            title: frame.attrs.title != null && String(frame.attrs.title).trim() !== ''
                                ? String(frame.attrs.title)
                                : ('Tab ' + (frame.owner.panels.length + 1)),
                            notoc: frame.attrs.notoc === true,
                            html: innerHtml
                        });
                    } else {
                        closeFrame(frame);
                    }
                    i++;
                    continue;
                }
                /* 长度不足：视为普通文本（不闭合当前帧） */
            }

            /* 普通行：入栈帧体或直接输出 */
            if (stack.length > 0) {
                stack[stack.length - 1].bodyLines.push(line);
            } else {
                out.push(line);
            }
            i++;
        }

        /* EOF 仍有未闭合帧：原文降级（保证内容不丢） */
        while (stack.length > 0) {
            var unclosed = stack.pop();
            warn('指令未闭合（原文输出）: ' + unclosed.raw.trim());
            var literal = [unclosed.raw].concat(unclosed.bodyLines);
            if (unclosed.name === 'tab' && unclosed.owner) {
                /* tab 未闭合：内容已入帧体，直接原文回填 */
                out.push('\n\n' + literal.join('\n') + '\n\n');
            } else {
                out.push('\n\n' + literal.join('\n') + '\n\n');
            }
        }

        /* 规整多余空行 */
        return out.join('\n').replace(/\n{4,}/g, '\n\n\n');
    }

    /* ------------------------------------------------------------------
     * ⑤ 脚注收集与替换
     * ------------------------------------------------------------------ */

    var FOOTNOTE_DEF_RE = /^[ \t]{0,3}\[\^([^\s\]]+)\]:[ \t]*(.*)$/;

    function transformFootnotes(text, ctx) {
        var lines = text.split('\n');
        var defs = {};
        var defOrder = [];
        var outLines = [];
        var i = 0;

        while (i < lines.length) {
            var m = lines[i].match(FOOTNOTE_DEF_RE);
            if (m) {
                var label = m[1];
                var content = [m[2]];
                i++;
                /* 多行定义：4 空格缩进续行 */
                while (i < lines.length && /^[ \t]{4,}\S/.test(lines[i])) {
                    content.push(lines[i].replace(/^[ \t]{4}/, ''));
                    i++;
                }
                if (!(label in defs)) {
                    defs[label] = content.join(' ').trim();
                    defOrder.push(label);
                }
                continue;
            }
            outLines.push(lines[i]);
            i++;
        }

        /* 引用替换（未知标签保持原文） */
        var refMap = {};
        var pending = ctx.footnotes || (ctx.footnotes = []);
        var body = outLines.join('\n');

        body = body.replace(/\[\^([^\s\]]+)\]/g, function (whole, label) {
            if (!(label in defs)) return whole;
            if (!(label in refMap)) {
                refMap[label] = Object.keys(refMap).length + 1;
            }
            var n = refMap[label];
            return '<sup class="fn-ref" id="fnref-' + escapeHtml(label) + '">' +
                '<a href="#fn-' + escapeHtml(label) + '" aria-label="脚注 ' + escapeHtml(label) + '">' + n + '</a></sup>';
        });

        /* 文末汇总区：仅收录被引用的定义 */
        var used = defOrder.filter(function (l) { return l in refMap; });
        if (used.length === 0) return body;

        var items = used.map(function (label) {
            var token = '%%FN_BODY_' + makeNonce() + '%%';
            pending.push({ token: token, md: defs[label], label: label });
            return '<li id="fn-' + escapeHtml(label) + '" class="footnote-item">' + token +
                '<a class="footnote-backref" href="#fnref-' + escapeHtml(label) + '" aria-label="返回引用处">' +
                '<i class="ri-arrow-left-line" aria-hidden="true"></i></a></li>';
        }).join('\n');

        return body + '\n\n<hr class="footnotes-sep" />\n<section class="footnotes" data-footnotes>' +
            '\n<ol class="footnotes-list">\n' + items + '\n</ol>\n</section>';
    }

    /* ------------------------------------------------------------------
     * ⑥ 行内防剧透 :spoiler[text]
     * ------------------------------------------------------------------ */

    function transformInlineSpoilers(text) {
        return text.replace(/:spoiler\[([^\]\n]*)\]/g, function (whole, inner) {
            return '<span class="spoiler" role="button" tabindex="0" title="防剧透内容，点击显示">' +
                escapeHtml(inner) + '</span>';
        });
    }

    /* ------------------------------------------------------------------
     * 对外 API
     * ------------------------------------------------------------------ */

    /**
     * Markdown 正文前置变换。
     * @param {string} bodyMd - 已剥离 frontmatter 的正文
     * @param {Object} [opts]
     * @param {Function} [opts.onWarn] - 告警回调（浏览器 console / Node stderr）
     * @returns {{ text: string, ctx: Object }}
     */
    function preprocess(bodyMd, opts) {
        var ctx = {};
        var text = String(bodyMd == null ? '' : bodyMd);

        text = text.replace(/\r\n?/g, '\n');
        text = extractCode(text, ctx);
        text = protectLegacyTags(text, ctx);
        text = transformAdmonitions(text, opts);
        text = transformDirectives(text, opts);
        text = transformFootnotes(text, ctx);
        text = transformInlineSpoilers(text);
        text = restoreCode(text, ctx);

        return { text: text, ctx: ctx };
    }

    /**
     * marked.parse 之后的后置处理。
     * @param {string} html
     * @param {Object} ctx - preprocess 返回的 ctx
     * @param {Object} [api]
     * @param {Function} [api.parseInline] - marked.parseInline，用于脚注定义体
     * @returns {string}
     */
    function postprocess(html, ctx, api) {
        api = api || {};
        var out = String(html);

        /* ① 脚注定义体：inline 渲染回填 */
        if (ctx.footnotes && ctx.footnotes.length) {
            ctx.footnotes.forEach(function (fn) {
                var rendered;
                if (typeof api.parseInline === 'function') {
                    try {
                        rendered = api.parseInline(fn.md);
                    } catch (e) {
                        rendered = escapeHtml(fn.md);
                    }
                } else {
                    rendered = escapeHtml(fn.md);
                }
                out = out.split(fn.token).join(rendered);
            });
        }

        /* ② 遗留自定义标签还原 */
        out = restoreLegacyTags(out, ctx);

        return out;
    }

    return {
        version: VERSION,
        preprocess: preprocess,
        postprocess: postprocess
    };
});
