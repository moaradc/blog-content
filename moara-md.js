/* moara-md.js — 沫然Blog Markdown 扩展层（浏览器 / Node 双端共享）
 * 同一份实现供两条渲染管线使用，保证产物一致：
 * - 浏览器端：article.js（marked 前置变换）
 * - Node 端：blog-content 仓 generate-article-html.js（SEO 直出）
 * 两仓各持副本，改动需手动同步。
 * v1.1：:::gallery{…} 包裹 ![说明](图) 行（栈式解析、可嵌套）；旧 <gallery src> 兜底
 * v1.2：notitle/nocaption/caption-color；[![](图)](链接) 整格锚点；说明浮层两行截断
 * v1.2.3：postprocess 给内容图片统一补 loading="lazy" / decoding="async"（幂等）
 * v1.3：四大新组件——
 *   ① :::file-tree{title} 嵌套列表文件树 / ```file-tree 围栏（tree 终端输出）；
 *     ++ 新增、-- 删除、**粗体** 强调、目录名带 / 默认折叠；可点击/键盘折叠
 *   ② :::code-tree{title height entry} 左侧文件导航 + 右侧代码预览（IDE 布局）；
 *     内部代码块以 title="path" 指定路径，:active 或 entry 指定初始文件；
 *     height 同时作用于桌面端与移动端（两端默认均 420px，超长代码限高滚动）；
 *     工具条提供换行（data-ct-wrap，与普通代码块同功能）与复制按钮
 *   ③ [+label] 内容边注：正文引用 + [+label]: 定义，点击弹出悬浮气泡（复用脚注外观，
 *     标记固定为 "+"），支持多条关联定义与块级富文本；未定义引用保留原文
 *   ④ :::steps[标题] / :::steps{title start} 步骤流：有序列表转数字导轨，
 *     start 可改起始编号；格式不规范时原样降级为普通 Markdown
 */
(function (global, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else {
        global.MoaraMd = factory();
    }
})(typeof window !== 'undefined' ? window : this, function () {
    'use strict';

    var VERSION = '1.3.0';

    /* 基础工具 */

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

    /** 解析指令属性串 {a="1" b='2' c=3 flag}，布尔旗标（无 =）置 true；返回普通对象 */
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

    /** 布尔解析：旗标 / "true"→true，"false"→false，缺省或未识别→undefined（供面板继承） */
    function attrBool(v) {
        if (v === true) return true;
        if (v === false) return false;
        if (typeof v === 'string') {
            var s = v.trim().toLowerCase();
            if (s === 'true') return true;
            if (s === 'false') return false;
        }
        return undefined;
    }

    function indentBlock(text, indent) {
        if (!indent) return text;
        return text.split('\n').map(function (l) { return l ? indent + l : l; }).join('\n');
    }

    /* admonition（> [!TYPE]）类型表 */
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

    /* 标记行语法：[!TYPE] + {attrs}（尾缀前后均可）+ 可选折叠尾缀 + 可选自定义标题 */
    var ADM_MARKER_RE = /^\[!(\w+)\][ \t]*(?:\{([^}]*)\})?[ \t]*([+-]?)[ \t]*(?:\{([^}]*)\})?[ \t]*(.*)$/;

    /* ① 代码区摘离 / ⑦ 归还 */

    /* 围栏 info 串解析：```lang title="..."；title marked 默认丢弃 → 取出后重写为携带 data-title 的<pre><code> HTML（marked 视作 html 块原样透传），标题栏渲染由前端完成。无 title 的围栏原样归还 marked */
    function parseCodeFenceInfo(raw) {
        var rest = String(raw || '').trim();
        if (!rest) return null;
        var title = null;
        rest = rest.replace(/title\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s}]+))/, function (all, a, b, c) {
            title = (a != null && a !== '') ? a : ((b != null && b !== '') ? b : c);
            return ' ';
        });
        if (title == null) return null;
        return { lang: rest.trim().split(/\s+/)[0] || '', title: title };
    }

    function rewriteFenceInfo(fenceText) {
        var fenceLines = fenceText.split('\n');
        var m = fenceLines[0].match(/^[ \t]*(`{3,}|~{3,})[ \t]*(.*)$/);
        if (!m) return fenceText;
        var info = parseCodeFenceInfo(m[2]);
        if (!info) return fenceText;
        var body = fenceLines.slice(1, fenceLines.length - 1).join('\n');
        var langCls = info.lang ? ' class="language-' + escapeHtml(info.lang) + '"' : '';
        return '<pre data-title="' + escapeHtml(info.title) + '"><code' + langCls + '>'
            + escapeHtml(body) + '</code></pre>';
    }

    /** 摘离围栏与行内代码防误处理；nonce 占位符 + split/join 还原（规避 $ 特殊字符）
     * v1.3：①围栏元信息（lang/title/:active/原文）同步记录到 ctx.fenceMetas，
     *         供 :::code-tree 重建左侧文件导航；②```file-tree 围栏在此处直接
     *         解析渲染（tree 终端输出语法），失败则按普通代码块降级。 */
    function extractCode(text, ctx) {
        var codeSpans = [];
        var fenceMetas = [];
        var nonce = makeNonce();
        var ph = function (i) { return '%%MD_CODE_' + nonce + '_' + i + '%%'; };

        var fenceRegex = /^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n[ \t]*\1[ \t]*(?=\n|$)/gm;
        text = text.replace(fenceRegex, function (match) {
            var fenceLines = match.split('\n');
            var m = fenceLines[0].match(/^[ \t]*(`{3,}|~{3,})[ \t]*(.*)$/);
            var infoStr = m ? m[2] : '';
            var body = fenceLines.slice(1, fenceLines.length - 1).join('\n');

            /* file-tree 围栏：tree 终端输出语法，尝试解析为交互文件树 */
            var ftInfo = infoStr.trim().match(/^file-tree\b[ \t]*(.*)$/);
            if (ftInfo) {
                var ftAttrs = parseAttrs(ftInfo[1] || '');
                var ftHtml = renderTerminalFileTree(body, ftAttrs);
                if (ftHtml) {
                    fenceMetas.push({ lang: 'file-tree', title: ftAttrs.title, body: body, active: false });
                    codeSpans.push(ftHtml);
                    return ph(codeSpans.length - 1);
                }
                /* 解析失败 → 普通代码块降级 */
            }

            /* 常规围栏：解析 lang / title / :active 标记，记录元信息 */
            var active = /(^|\s):active\b/.test(infoStr);
            var cleanInfo = infoStr.replace(/(^|\s):active\b/g, ' ').trim();
            var info = parseCodeFenceInfo(cleanInfo);
            var lang = info ? info.lang : (cleanInfo.trim().split(/\s+/)[0] || '');
            fenceMetas.push({ lang: lang, title: info ? info.title : undefined, body: body, active: active });
            codeSpans.push(rewriteFenceInfo(match));
            return ph(codeSpans.length - 1);
        });

        /* 行内 code：成对 1-2 个反引号，3+ 留给围栏（防引用块内围栏误配对） */
        var inlineCodeRegex = /(?<!`)(`{1,2})(?!`)((?:[^`]|\n(?!\n))+?)\1(?!`)/g;
        text = text.replace(inlineCodeRegex, function (match) {
            codeSpans.push(match);
            return ph(codeSpans.length - 1);
        });

        ctx.codeSpans = codeSpans;
        ctx.codeNonce = nonce;
        ctx.fenceMetas = fenceMetas;
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

    /** v1.3：对摘离出主文本的字符串（脚注/边注定义体）单独还原代码占位符（行内代码场景） */
    function restoreCodeInStr(s, ctx) {
        return ctx && ctx.codeSpans ? restoreCode(String(s), ctx) : String(s);
    }

    /* ② 遗留自定义标签保护（与旧版行为等价，旧语法仅作兼容降级） */
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

        /* 裸标签防御：未闭合会吞掉后续内容，统一补闭合 */
        text = text.replace(/<(music|gallery)\b([^>]*?)\s*\/>/gi, '<$1$2></$1>');
        text = text.replace(/<(music|gallery)\b([^>]*?)>(?!<\/\1>)/gi, '<$1$2></$1>');

        /* 旧版折叠框整块 HTML（已废弃，此处仅为防截断保护；渲染走旧 CSS） */
        text = text.replace(/<div\b[^>]*class=["'][^"']*details-box[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, push);

        /* 行内黑幕 <span class='spoiler'>…</span> */
        text = text.replace(/<span\b[^>]*class=['"][^'"]*spoiler[^'"]*['"][^>]*>[\s\S]*?<\/span>/gi, function (match) {
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

    /* ③ admonition 变换（> [!TYPE] 引用块 → 提示框 HTML） */
    function transformAdmonitions(text, opts) {
        var lines = text.split('\n');
        var out = [];
        var i = 0;

        while (i < lines.length) {
            var line = lines[i];

            if (/^[ \t]*>/.test(line)) {
                var j = i;
                var quote = [];
                while (j < lines.length && /^[ \t]*>/.test(lines[j])) {
                    quote.push(lines[j].replace(/^[ \t]*>[ \t]?/, ''));
                    j++;
                }

                /* 标记必须位于引用块首个非空行 */
                var firstIdx = 0;
                while (firstIdx < quote.length && !quote[firstIdx].trim()) firstIdx++;
                var marker = firstIdx < quote.length ? quote[firstIdx].match(ADM_MARKER_RE) : null;

                if (marker) {
                    var rawType = marker[1].toLowerCase();
                    var type = ADM_ALIASES[rawType] || rawType;
                    var admAttrs = parseAttrs(marker[2] != null ? marker[2] : (marker[4] || ''));
                    var collapse = marker[3] || '';
                    var customTitle = marker[5].trim();

                    if (!ADM_TYPES[type]) {
                        if (opts && opts.onWarn) opts.onWarn('[moara-md] 未知 admonition 类型: ' + rawType);
                        out.push(lines.slice(i, j).join('\n'));
                        i = j;
                        continue;
                    }

                    var conf = ADM_TYPES[type];
                    var title = escapeHtml(customTitle || conf.label);
                    var inner = quote.slice(firstIdx + 1).join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
                    var hasBody = inner.trim() !== '';
                    /* 无正文 → 静态信息条，不可折叠 */
                    var isCollapsible = hasBody;
                    var openByDefault = hasBody && collapse === '+';

                    var headAttrs = isCollapsible
                        ? ' role="button" tabindex="0" aria-expanded="' + (openByDefault ? 'true' : 'false') + '"'
                        : '';
                    var chevron = isCollapsible
                        ? '\n<i class="admonition-chevron ri-arrow-right-s-line" aria-hidden="true"></i>'
                        : '';
                    var boxAttrs = (isCollapsible
                        ? ' data-collapsible' + (openByDefault ? ' data-open="true"' : '')
                        : '')
                        + (attrBool(admAttrs.notoc) === true ? ' data-notoc' : '');

                    out.push(
                        '<div class="admonition admonition-' + type + '"' + boxAttrs + '>' +
                        '\n<div class="admonition-title"' + headAttrs + '>' +
                        '\n<i class="' + conf.icon + '" aria-hidden="true"></i>' +
                        '\n<span class="admonition-title-text">' + title + '</span>' + chevron +
                        '\n</div>' +
                        (hasBody
                            ? '\n<div class="admonition-body">' +
                              '\n\n' + inner + '\n\n' +
                              '\n</div>'
                            : '') +
                        '\n</div>'
                    );
                    i = j;
                } else {
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

    /* ④ 容器指令变换（栈式解析） */
    /* v1.3：指令开标签支持 [标题] 简写（等价 title="标题"），:::steps[部署] 之类 */
    var DIRECTIVE_OPEN_RE = /^([ \t]*)(::+)([a-zA-Z][\w-]*)(?:[ \t]*(?:\{([^{}]*)\}|\[([^\]]*)\]))?[ \t]*$/;
    var DIRECTIVE_CLOSE_RE = /^([ \t]*)(::+)[ \t]*$/;

    /* 叶子指令（双冒号、单行、无闭合围栏） */
    var LEAF_DIRECTIVES = ['video', 'linkcard', 'github'];
    /* 容器指令（三冒号及以上、需闭合围栏） */
    var CONTAINER_DIRECTIVES = ['folding', 'tabs', 'tab', 'gallery', 'file-tree', 'code-tree', 'steps'];
    /* 无正文指令：三冒号形式同样自足，不消费闭合围栏 */
    var BODYLESS_DIRECTIVES = ['video', 'linkcard', 'github'];

    var tabsUid = 0;

    /** 视频嵌入。attrs：type / id / url|src / poster / title / aspect */
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

        if (isIframe) {
            /* 点击加载门面：首屏零 iframe，点击后注入播放器 */
            var provider = /player\.bilibili\.com/.test(src) ? 'bilibili' : 'youtube';
            var pIcon = provider === 'bilibili' ? 'ri-bilibili-line' : 'ri-youtube-line';
            var pLabel = provider === 'bilibili' ? 'bilibili' : 'YouTube';
            var autoSrc = provider === 'bilibili'
                ? src.replace('autoplay=0', 'autoplay=1')
                : src + '&autoplay=1';
            return '<div class="video-embed" style="aspect-ratio:' + escapeHtml(aspect.replace(':', ' / ')) + '" data-aspect="' + escapeHtml(aspect) + '" data-video-embed' +
                ' data-src="' + escapeHtml(autoSrc) + '" data-video-title="' + escapeHtml(title || '嵌入视频') + '">' +
                '<button class="video-poster" type="button" aria-label="加载视频：' + escapeHtml(title || '嵌入视频') + '">' +
                '<i class="video-poster-platform ' + pIcon + '" aria-hidden="true"></i>' +
                '<span class="video-poster-title">' + escapeHtml(title || '嵌入视频') + '</span>' +
                '<span class="video-poster-hint"><i class="ri-play-circle-line" aria-hidden="true"></i>点击加载 ' + pLabel + ' 播放器</span>' +
                '</button>' +
                '</div>';
        }

        /* 直链视频：裸 <video>（尺寸由 CSS 处理） */
        return '<video controls preload="metadata" playsinline src="' + escapeHtml(src) + '"' +
            (poster ? ' poster="' + escapeHtml(poster) + '"' : '') +
            (title ? ' title="' + escapeHtml(title) + '"' : '') + '></video>';
    }

    /** 链接卡片外壳；图标 / 站内标题由 article.js 运行时填充 */
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

        var fallbackChar = (title || host).trim().charAt(0).toUpperCase() || '#';
        return '<a class="md-linkcard" data-linkcard data-url="' + escapeHtml(url) + '"' +
            ' href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' +
            '\n<span class="md-linkcard-icon" data-linkcard-icon aria-hidden="true"><span class="md-linkcard-fallback">' + escapeHtml(fallbackChar) + '</span></span>' +
            '\n<span class="md-linkcard-main">' +
            '\n<span class="md-linkcard-title">' + (title ? escapeHtml(title) : escapeHtml(host)) + '</span>' +
            '\n<span class="md-linkcard-host">' + escapeHtml(host) + '</span>' +
            '\n</span>' +
            '\n<i class="ri-arrow-right-up-line md-linkcard-arrow" aria-hidden="true"></i>' +
            '\n</a>';
    }

    /** 渲染 GitHub 仓库卡片外壳（星标等数据运行时经 API 填充） */
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
            '\n<span class="md-github-card-desc" data-github-desc hidden></span>' +
            '\n<span class="md-github-card-meta" data-github-meta hidden></span>' +
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
        return '<div class="details-box' + (open ? ' open' : '') + '"'
            + (attrBool(attrs.notoc) === true ? ' data-notoc' : '')
            + ' data-fold>' +
            '\n<div class="details-header" role="button" tabindex="0" aria-expanded="' + (open ? 'true' : 'false') + '">' +
            '\n<span class="details-title">' + escapeHtml(title) + '</span>' +
            '\n<i class="details-icon ri-arrow-right-s-line" aria-hidden="true"></i>' +
            '\n</div>' +
            '\n<div class="details-content-wrapper">' +
            '\n<div class="details-inner">';
    }

    var FOLDING_CLOSE = '</div>\n</div>\n</div>';

    var GALLERY_IMG_RE = /^[ \t]*!\[([^\]]*)\]\(\s*<?([^()<>\s]+?)>?(?:\s(?:"[^"]*"|'[^']*'))?[ \t]*\)[ \t]*$/;
    /* 链接包裹：[![说明](图片)](链接) → 整格锚点 */
    var GALLERY_LINK_RE = /^[ \t]*\[!\[([^\]]*)\]\(\s*<?([^()<>\s]+?)>?(?:\s(?:"[^"]*"|'[^']*'))?[ \t]*\)\]\(\s*<?([^()<>\s]+?)>?(?:\s(?:"[^"]*"|'[^']*'))?[ \t]*\)[ \t]*$/;

    /** 颜色校验：仅 #hex/色名/rgb(a)（防注入） */
    function safeColorAttr(v) {
        var s = String(v == null ? '' : v).trim();
        if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
        if (/^rgba?\(\s*[\d.,\s%]+\)$/.test(s)) return s;
        if (/^[a-zA-Z]{2,24}$/.test(s)) return s.toLowerCase();
        return '';
    }

    /**
     * 渲染图集容器：:::gallery{…} 包裹 ![说明](图) 行，支持 [![说明](图)](链接) 整格跳转。
     * 属性：title/notitle（标题栏）、caption="false"|nocaption（浮层）、caption-color。
     * 与 folding/tabs 同一套栈式容器解析，支持嵌套于提示框、折叠、选项卡内。
     * 零图片行 → 返回空串（调用方按原文降级输出）；旧 <gallery src> 仍兜底可用。
     */
    function renderGalleryDirective(body, attrs) {
        attrs = attrs || {};
        var items = [];
        String(body).split('\n').forEach(function (ln) {
            var ml = ln.match(GALLERY_LINK_RE);
            if (ml) { items.push({ alt: ml[1].trim(), url: ml[2], link: ml[3] }); return; }
            var m = ln.match(GALLERY_IMG_RE);
            if (m) items.push({ alt: m[1].trim(), url: m[2] });
        });
        if (!items.length) return '';

        var rawTitle = attrs.title != null ? String(attrs.title).trim() : '';
        var hideTitle = attrBool(attrs.notitle) === true || (rawTitle === '' && attrs.title != null);
        var title = rawTitle !== '' ? rawTitle : '图集 / GALLERY';

        var captionOff = attrBool(attrs.nocaption) === true
            || String(attrs.caption).trim() === 'false'
            || String(attrs.caption).trim() === '0';
        var captionColor = safeColorAttr(attrs['caption-color'] != null ? attrs['caption-color'] : attrs.captionColor);
        var capStyle = captionColor ? ' style="color:' + escapeHtml(captionColor) + '"' : '';

        var cells = items.map(function (it) {
            var cap = (!captionOff && it.alt)
                ? '\n<figcaption class="gallery-post-caption"' + capStyle + '><span class="gallery-post-caption-text">' + escapeHtml(it.alt) + '</span></figcaption>'
                : '';
            var img = '\n<img src="' + escapeHtml(it.url) + '" alt="' + escapeHtml(it.alt) + '" loading="lazy">';
            if (it.link) {
                return '<a class="gallery-post-item img-link-wrap" href="' + escapeHtml(it.link) + '" target="_blank" rel="noopener noreferrer" title="' + escapeHtml(it.alt) + '">' +
                    img + cap +
                    '\n</a>';
            }
            return '<figure class="gallery-post-item">' + img + cap + '\n</figure>';
        }).join('\n');

        return '<div class="article-gallery">' +
            (hideTitle ? '' : '\n<div class="gallery-post-title"><i class="ri-gallery-view-2" aria-hidden="true"></i> ' + escapeHtml(title) + '</div>') +
            '\n<div class="gallery-post-grid">' +
            '\n' + cells +
            '\n</div>' +
            '\n</div>';
    }

    /* ═══════════════════════════════════════════════════════════════
     *  v1.3 新组件：文件树 / 代码树 / 步骤流 / 内容边注
     * ═══════════════════════════════════════════════════════════════ */

    /* 文件后缀 → remixicon 图标（moara-md 双端自持映射，与 article.js 的链接卡图标表语义一致） */
    var FT_FILE_ICONS = {
        md: 'ri-markdown-line', markdown: 'ri-markdown-line', mdx: 'ri-markdown-line',
        js: 'ri-javascript-line', mjs: 'ri-javascript-line', cjs: 'ri-javascript-line',
        jsx: 'ri-reactjs-line', ts: 'ri-file-code-line', tsx: 'ri-reactjs-line',
        json: 'ri-braces-line', jsonc: 'ri-braces-line',
        html: 'ri-html5-line', htm: 'ri-html5-line', xhtml: 'ri-html5-line',
        css: 'ri-css3-line', scss: 'ri-css3-line', sass: 'ri-css3-line',
        less: 'ri-css3-line', styl: 'ri-css3-line', stylus: 'ri-css3-line',
        vue: 'ri-vuejs-line', svelte: 'ri-flashlight-line', astro: 'ri-rocket-2-line',
        py: 'ri-code-s-slash-line', rb: 'ri-code-s-slash-line', php: 'ri-code-s-slash-line',
        go: 'ri-code-s-slash-line', rs: 'ri-code-box-line', java: 'ri-code-box-line',
        kt: 'ri-code-box-line', c: 'ri-terminal-box-line', h: 'ri-terminal-box-line',
        cpp: 'ri-terminal-box-line', hpp: 'ri-terminal-box-line', cc: 'ri-terminal-box-line',
        cs: 'ri-terminal-box-line', swift: 'ri-terminal-box-line', dart: 'ri-terminal-box-line',
        sh: 'ri-terminal-line', bash: 'ri-terminal-line', zsh: 'ri-terminal-line',
        fish: 'ri-terminal-line', ps1: 'ri-terminal-line', psm1: 'ri-terminal-line',
        bat: 'ri-terminal-line', cmd: 'ri-terminal-line',
        yml: 'ri-file-list-3-line', yaml: 'ri-file-list-3-line', toml: 'ri-file-list-3-line',
        ini: 'ri-file-list-3-line', env: 'ri-file-list-3-line',
        xml: 'ri-file-code-line', sql: 'ri-database-2-line', graphql: 'ri-database-2-line',
        png: 'ri-image-line', jpg: 'ri-image-line', jpeg: 'ri-image-line', gif: 'ri-image-line',
        webp: 'ri-image-line', svg: 'ri-shape-line', avif: 'ri-image-line', ico: 'ri-shape-line',
        mp3: 'ri-file-music-line', flac: 'ri-file-music-line', wav: 'ri-file-music-line',
        ogg: 'ri-file-music-line', m4a: 'ri-file-music-line',
        mp4: 'ri-file-video-line', mkv: 'ri-file-video-line', webm: 'ri-file-video-line',
        mov: 'ri-file-video-line', avi: 'ri-file-video-line',
        pdf: 'ri-file-pdf-line', txt: 'ri-file-text-line', log: 'ri-file-text-line',
        zip: 'ri-file-zip-line', rar: 'ri-file-zip-line', '7z': 'ri-file-zip-line',
        tar: 'ri-file-zip-line', gz: 'ri-file-zip-line', br: 'ri-file-zip-line',
        doc: 'ri-file-word-line', docx: 'ri-file-word-line',
        xls: 'ri-file-excel-line', xlsx: 'ri-file-excel-line', csv: 'ri-file-excel-line',
        ppt: 'ri-file-ppt-line', pptx: 'ri-file-ppt-line',
        lock: 'ri-lock-line', sum: 'ri-shield-check-line', mod: 'ri-shield-check-line'
    };

    /* 特殊文件名整名匹配（优先于扩展名） */
    var FT_SPECIAL_ICONS = {
        '.gitignore': 'ri-git-repository-line', '.gitattributes': 'ri-git-repository-line',
        '.dockerfile': 'ri-box-3-line', 'dockerfile': 'ri-box-3-line',
        'license': 'ri-shield-line', 'licence': 'ri-shield-line',
        'makefile': 'ri-hammer-line', 'cmakelists.txt': 'ri-hammer-line',
        'package.json': 'ri-npmjs-line', 'pnpm-lock.yaml': 'ri-npmjs-line',
        'package-lock.json': 'ri-npmjs-line', 'yarn.lock': 'ri-npmjs-line',
        'readme.md': 'ri-book-open-line', 'changelog.md': 'ri-history-line',
        'tsconfig.json': 'ri-settings-4-line', 'vite.config.ts': 'ri-settings-4-line',
        'astro.config.mjs': 'ri-settings-4-line', 'eslint.config.js': 'ri-settings-4-line'
    };

    function ftIconFor(name, isDir) {
        if (isDir) return 'ri-folder-line';
        var lower = String(name || '').toLowerCase();
        if (FT_SPECIAL_ICONS[lower]) return FT_SPECIAL_ICONS[lower];
        var m = lower.match(/\.([a-z0-9]+)$/);
        return (m && FT_FILE_ICONS[m[1]]) || 'ri-file-line';
    }

    /** 尺寸属性校验：仅数字+单位（px/rem/em/vh/vw/%），防注入 */
    function safeSizeAttr(v) {
        var s = String(v == null ? '' : v).trim();
        return /^\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(s) ? s : '';
    }

    /**
     * 列表项文本解析：[++] / [--] / **粗体** / 尾部斜杠目录
     * 返回 { name, added, deleted, strong, dir, collapsed }
     */
    function parseTreeEntryText(raw) {
        var t = String(raw == null ? '' : raw).trim();
        var e = { name: '', added: false, deleted: false, strong: false, dir: false, collapsed: false };
        if (!t) return e;
        if (/^\+\+\s+/.test(t)) { e.added = true; t = t.replace(/^\+\+\s+/, ''); }
        else if (/^--\s+/.test(t)) { e.deleted = true; t = t.replace(/^--\s+/, ''); }
        var bm = t.match(/^\*\*(.+?)\*\*$/);
        if (bm) { e.strong = true; t = bm[1].trim(); }
        if (/\/\s*$/.test(t)) { e.dir = true; e.collapsed = true; t = t.replace(/\/\s*$/, '').trim(); }
        e.name = t;
        return e;
    }

    /** 嵌套列表语法 → 树（:::file-tree 容器体）。层级由「唯一缩进宽度排序定级」推断（2/4 空格混排均兼容） */
    function parseListTree(body) {
        var lines = String(body).split('\n');
        var items = [];
        var indents = {};
        lines.forEach(function (ln) {
            var m = ln.match(/^([ \t]*)-[ \t]+(.+?)[ \t]*$/);
            if (!m) return;
            var w = m[1].replace(/\t/g, '    ').length;
            indents[w] = true;
            items.push({ w: w, entry: parseTreeEntryText(m[2]) });
        });
        if (!items.length) return null;
        /* 缩进宽度 → 层级序号 */
        var widths = Object.keys(indents).map(Number).sort(function (a, b) { return a - b; });
        var rank = {};
        widths.forEach(function (w, i) { rank[w] = i; });

        var roots = [];
        var stack = []; /* {node, level} */
        items.forEach(function (it) {
            var e = it.entry;
            if (!e.name) return;
            var node = {
                name: e.name, dir: e.dir, added: e.added, deleted: e.deleted,
                strong: e.strong, collapsed: e.collapsed, children: []
            };
            var level = rank[it.w];
            if (stack.length) {
                /* 层级跳级防御：异常层级挂到最深层级（不丢文件） */
                var maxLevel = stack[stack.length - 1].level;
                if (level > maxLevel + 1) level = maxLevel + 1;
            }
            while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
            if (!stack.length) {
                roots.push(node);
            } else {
                var parent = stack[stack.length - 1].node;
                parent.dir = true; /* 有子级 → 必为目录（保持默认展开） */
                parent.children.push(node);
            }
            stack.push({ node: node, level: level });
        });
        return roots.length ? roots : null;
    }

    /* tree 终端输出行前缀单元：Unicode（├── └── │）与 ASCII（|-- `-- |）各 4/3 字符宽 */
    var FT_UNIT_RE = /^(?:\u251c\u2500\u2500 |\u2514\u2500\u2500 |\u2502   |\|   |    |\|-- |`-- |\u251c\u2500\u2500|\u2514\u2500\u2500|\|--|`--)/;

    /** 终端输出语法 → 树（```file-tree 围栏体）。首行根，其余按分支前缀深度挂载 */
    function parseTerminalTree(body) {
        var lines = String(body).split('\n').filter(function (l) { return l.trim() !== ''; });
        if (!lines.length) return null;
        var rootE = parseTreeEntryText(lines[0]);
        if (!rootE.name || rootE.added || rootE.deleted) return null;

        var root = {
            name: rootE.name, dir: true, added: false, deleted: false,
            strong: rootE.strong, collapsed: false, children: []
        };
        var stack = [{ node: root, depth: 0 }];
        var minDepth = 1;

        for (var i = 1; i < lines.length; i++) {
            var line = lines[i];
            var pos = 0, depth = 0;
            while (pos < line.length) {
                var seg = line.slice(pos, pos + 4);
                var seg3 = line.slice(pos, pos + 3);
                if (FT_UNIT_RE.test(seg)) { depth++; pos += 4; }
                else if (FT_UNIT_RE.test(seg3)) { depth++; pos += 3; }
                else break;
            }
            if (depth < minDepth) return null; /* 无任何分支前缀的裸行 → 非法 */
            var name = line.slice(pos).trim();
            if (!name) return null;
            var e = parseTreeEntryText(name);
            if (!e.name) return null;

            var node = {
                name: e.name, dir: e.dir, added: e.added, deleted: e.deleted,
                strong: e.strong, collapsed: e.collapsed, children: []
            };
            if (depth > stack.length) depth = stack.length; /* 深度跳级防御 */
            while (stack.length > depth) stack.pop();
            if (!stack.length) return null;
            var parent = stack[stack.length - 1].node;
            parent.dir = true;
            parent.children.push(node);
            stack.push({ node: node, depth: depth });
        }
        return root.children.length ? { root: root, children: root.children } : null;
    }

    /**
     * 树节点 → HTML（file-tree 与 code-tree 左栏共用）。
     * opts.forCode：文件行渲染为 button（role=treeitem，点击切换代码面板），data-ft-path 带全路径
     */
    function renderTreeNodes(children, opts, parentPath) {
        opts = opts || {};
        var html = '<ul class="ft-list" role="group">';
        children.forEach(function (node) {
            var path = (parentPath ? parentPath + '/' : '') + node.name;
            if (node.dir) {
                var open = !node.collapsed;
                html += '<li class="ft-item ft-dir' + (open ? '' : ' ft-collapsed') + '"' +
                    (node.added ? ' data-added' : '') + (node.deleted ? ' data-deleted' : '') + '>' +
                    '\n<button type="button" class="ft-row ft-row-dir" data-ft-dir aria-expanded="' + (open ? 'true' : 'false') + '"' +
                    ' aria-label="' + (open ? '折叠' : '展开') + '目录 ' + escapeHtml(node.name) + '">' +
                    '<i class="ft-caret ri-arrow-right-s-line" aria-hidden="true"></i>' +
                    '<i class="ft-icon ' + ftIconFor(node.name, true) + '" aria-hidden="true"></i>' +
                    '<span class="ft-name' + (node.strong ? ' ft-strong' : '') + '">' + escapeHtml(node.name) + '</span>' +
                    '</button>' +
                    '\n' + renderTreeNodes(node.children, opts, path) +
                    '\n</li>';
            } else {
                if (opts.forCode) {
                    html += '<li class="ft-item ft-file' + (node.added ? ' ft-added' : '') + (node.deleted ? ' ft-deleted' : '') + '">' +
                        '\n<button type="button" class="ft-row ft-row-file" data-ft-path="' + escapeHtml(path) + '"' +
                        ' role="treeitem" aria-selected="false">' +
                        '<i class="ft-caret ft-caret-ghost" aria-hidden="true"></i>' +
                        '<i class="ft-icon ' + ftIconFor(node.name, false) + '" aria-hidden="true"></i>' +
                        '<span class="ft-name' + (node.strong ? ' ft-strong' : '') + '">' + escapeHtml(node.name) + '</span>' +
                        '</button>' +
                        '\n</li>';
                } else {
                    html += '<li class="ft-item ft-file' + (node.added ? ' ft-added' : '') + (node.deleted ? ' ft-deleted' : '') + '">' +
                        '\n<span class="ft-row">' +
                        '<i class="ft-caret ft-caret-ghost" aria-hidden="true"></i>' +
                        '<i class="ft-icon ' + ftIconFor(node.name, false) + '" aria-hidden="true"></i>' +
                        '<span class="ft-name' + (node.strong ? ' ft-strong' : '') + '">' + escapeHtml(node.name) + '</span>' +
                        '</span>' +
                        '\n</li>';
                }
            }
        });
        return html + '</ul>';
    }

    /** 文件树外壳（:::file-tree 容器体 → 完整组件 HTML）；roots 为空返回 ''（降级） */
    function renderFileTreeShell(roots, attrs) {
        attrs = attrs || {};
        var rawTitle = attrs.title != null ? String(attrs.title).trim() : '';
        var title = rawTitle !== '' ? rawTitle : '文件树 / FILE TREE';
        return '<div class="md-file-tree" data-file-tree role="group" aria-label="' + escapeHtml(title) + '">' +
            '\n<div class="ft-title"><i class="ri-folder-line" aria-hidden="true"></i><span class="ft-title-text">' + escapeHtml(title) + '</span></div>' +
            '\n' + renderTreeNodes(roots, {}, '') +
            '\n</div>';
    }

    /** ```file-tree 围栏体 → 组件 HTML；解析失败返回 ''（调用方降级为普通代码块） */
    function renderTerminalFileTree(body, attrs) {
        var t = parseTerminalTree(body);
        if (!t) return '';
        /* 根节点（首行）作为顶层目录显示，子级随 children 挂载 */
        return renderFileTreeShell([t.root], attrs);
    }

    /**
     * :::code-tree 容器体 → IDE 布局组件。
     * body 中的代码块此时已是 extractCode 占位符；按出现顺序与 ctx.fenceMetas 对齐，
     * 以围栏 title="path" 重建左侧文件导航 + 右侧代码面板。无 title 的围栏 → 整体降级返回 ''。
     */
    function renderCodeTree(body, attrs, ctx, warn) {
        attrs = attrs || {};
        if (!ctx || !ctx.codeNonce || !ctx.fenceMetas) return '';
        var phRe = /%%MD_CODE_([0-9a-z-]+)_(\d+)%%/g;
        var metas = ctx.fenceMetas;
        var files = [];
        var m, stray = false;
        while ((m = phRe.exec(body))) {
            if (m[1] !== ctx.codeNonce) continue;
            var idx = parseInt(m[2], 10);
            if (!(idx >= 0 && idx < metas.length)) { stray = true; continue; }
            var meta = metas[idx];
            if (meta.lang === 'file-tree') return ''; /* file-tree 围栏语义不兼容，降级 */
            if (meta.title == null || String(meta.title).trim() === '') {
                if (warn) warn(':::code-tree 内代码块缺少 title="路径"（原样输出）');
                return '';
            }
            files.push(meta);
        }
        if (!files.length) return '';

        var seen = {};
        var uniq = files.filter(function (f) {
            var p = String(f.title).trim();
            if (seen[p]) return false;
            seen[p] = true;
            return true;
        });

        /* 路径 → 树 */
        var roots = [];
        var findOrCreateDir = function (children, name) {
            for (var i = 0; i < children.length; i++) {
                if (children[i].name === name && children[i].dir) return children[i];
            }
            var d = { name: name, dir: true, added: false, deleted: false, strong: false, collapsed: false, children: [] };
            children.push(d);
            return d;
        };
        uniq.forEach(function (f) {
            var parts = String(f.title).trim().split('/').filter(function (p) { return p !== ''; });
            if (!parts.length) return;
            var cursor = { children: roots };
            for (var i = 0; i < parts.length - 1; i++) cursor = findOrCreateDir(cursor.children, parts[i]);
            cursor.children.push({
                name: parts[parts.length - 1], dir: false, added: false, deleted: false,
                strong: false, collapsed: false, children: []
            });
        });
        if (!roots.length) return '';

        /* 默认激活：entry > :active > 首个 */
        var entry = String(attrs.entry != null ? attrs.entry : '').trim();
        var activePath = '';
        if (entry && seen[entry]) activePath = entry;
        else {
            for (var k = 0; k < uniq.length; k++) {
                if (uniq[k].active) { activePath = String(uniq[k].title).trim(); break; }
            }
        }
        if (!activePath) activePath = String(uniq[0].title).trim();

        var rawTitle = attrs.title != null ? String(attrs.title).trim() : '';
        var title = rawTitle !== '' ? rawTitle : '代码树 / CODE TREE';
        var height = safeSizeAttr(attrs.height);
        var styleAttr = height ? ' style="--ct-h:' + height + '"' : '';

        var panels = uniq.map(function (f) {
            var p = String(f.title).trim();
            var langCls = f.lang ? ' class="language-' + escapeHtml(f.lang) + '"' : '';
            var isActive = p === activePath;
            /* div 行与 pre 行之间空行隔离：marked 将 <pre> 识别为独立 HTML 块（type 1，
               空行不截断），代码体内的空行不会再把后续代码行挤成段落（实测 P 泄漏修复） */
            return '<div class="ct-panel' + (isActive ? ' active' : '') + '" data-path="' + escapeHtml(p) + '"' +
                (isActive ? '' : ' hidden') + '>' +
                '\n\n' + '<pre><code' + langCls + '>' + escapeHtml(f.body) + '</code></pre>' +
                '\n\n' + '</div>';
        }).join('\n\n');

        return '<div class="md-code-tree" data-code-tree aria-label="' + escapeHtml(title) + '"' + styleAttr + '>' +
            '\n<div class="ct-head">' +
            '<i class="ri-code-s-slash-line" aria-hidden="true"></i>' +
            '<span class="ct-title">' + escapeHtml(title) + '</span>' +
            '<span class="ct-path" data-ct-path>' + escapeHtml(activePath) + '</span>' +
            '<button type="button" class="ct-copy" data-ct-wrap title="自动换行" aria-label="自动换行" aria-pressed="false">' +
            '<i class="ri-text-wrap" aria-hidden="true"></i></button>' +
            '<button type="button" class="ct-copy" data-ct-copy title="复制当前文件代码" aria-label="复制当前文件代码">' +
            '<i class="ri-file-copy-line" aria-hidden="true"></i></button>' +
            '</div>' +
            '\n<div class="ct-body">' +
            '\n<div class="ct-tree" role="tree" aria-label="文件导航">' +
            '\n' + renderTreeNodes(roots, { forCode: true }, '') +
            '\n</div>' +
            '\n<div class="ct-panels">' +
            '\n' + panels +
            '\n</div>' +
            '\n</div>' +
            '\n</div>';
    }

    /** steps 列表头 */
    var STEPS_ITEM_RE = /^(\d{1,9})[.)][ \t]+(.*)$/;

    /**
     * :::steps 容器体校验与解析：必须且仅包含一个有序列表。
     * 规则：首个非空行为列表头；后续行为「列表头 / 缩进体行 / 空行 / 代码占位符行」，
     * 出现顶层裸文本 → 不合法（降级为普通 Markdown，不做启发式解析）。
     * 返回 { items: [{head, lines}], firstNum } 或 null。
     */
    function parseStepsBody(body, ctx) {
        var lines = String(body).split('\n');
        var phRe = ctx && ctx.codeNonce
            ? new RegExp('^%%MD_CODE_' + ctx.codeNonce + '_\\d+%%$')
            : null;
        var items = [];
        var firstNum = null;
        var cur = null;
        var sawOpen = false;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (!line.trim()) continue; /* 空行归当前项（段落分隔） */
            var m = line.match(STEPS_ITEM_RE);
            if (m) {
                if (firstNum === null) firstNum = parseInt(m[1], 10);
                cur = { head: m[2].trim(), lines: [] };
                items.push(cur);
                sawOpen = true;
                continue;
            }
            /* 代码占位符行：extractCode 已归一为顶格，归属当前步骤体 */
            if (phRe && phRe.test(line)) {
                if (!cur) return null;
                cur.lines.push(line);
                continue;
            }
            var indentW = line.replace(/\t/g, '    ').match(/^ */)[0].length;
            if (sawOpen && indentW >= 2 && cur) {
                cur.lines.push(line);
            } else {
                return null; /* 顶层裸文本 / 首行非列表 → 不合法 */
            }
        }
        if (!items.length) return null;
        return { items: items, firstNum: firstNum || 1 };
    }

    /** :::steps 容器体 → 数字导轨 HTML（step 体行剥公共缩进后交 marked 渲染） */
    function renderSteps(parsed, attrs) {
        attrs = attrs || {};
        var rawTitle = attrs.title != null ? String(attrs.title).trim() : '';
        var startNum = parseInt(attrs.start, 10);
        if (!(startNum >= 0)) startNum = parsed.firstNum;

        var inner = '';
        parsed.items.forEach(function (it, idx) {
            /* 体行剥公共缩进（占位符行 0 缩进参与 min 计算 → min=0 不剥，安全）；
               剩余 1-3 前导空格再剥一层，避免 marked 误判 lazy 续行缩进 */
            var bodyLines = it.lines;
            var minIndent = Infinity;
            bodyLines.forEach(function (l) {
                if (!l.trim()) return;
                var w = l.replace(/\t/g, '    ').match(/^ */)[0].length;
                if (w < minIndent) minIndent = w;
            });
            if (!isFinite(minIndent)) minIndent = 0;
            var stripped = bodyLines.map(function (l) {
                if (!l.trim()) return '';
                var out = l.replace(/\t/g, '    ').slice(minIndent);
                return out.replace(/^ {1,3}(?=\S)/, '');
            });

            inner += '\n<li class="step-item">' +
                '\n<span class="step-num">' + (startNum + idx) + '</span>' +
                '\n<div class="step-main">' +
                '\n\n' + (it.head ? it.head + '\n\n' : '') + stripped.join('\n') + '\n\n' +
                '\n</div>' +
                '\n</li>';
        });

        var headHtml = rawTitle
            ? '\n<div class="steps-title"><i class="ri-flask-line" aria-hidden="true"></i><span class="steps-title-text">' + escapeHtml(rawTitle) + '</span></div>'
            : '';

        return '<div class="md-steps" data-md-steps data-steps-start="' + (startNum + '') + '" role="group"' +
            (rawTitle ? ' aria-label="' + escapeHtml(rawTitle) + '"' : '') + '>' +
            headHtml +
            '\n<ol class="steps-list">' +
            inner +
            '\n</ol>' +
            '\n</div>';
    }

    /* ── 内容边注（[+label] 引用 / [+label]: 定义） ── */

    var SIDENOTE_DEF_RE = /^[ \t]{0,3}\[\+([^\s\]]+)\]:[ \t]*(.*)$/;
    var SIDENOTE_REF_RE = /\[\+([^\s\]]+)\]/g;

    /**
     * 边注变换：收集定义（含 4 空格缩进续行，同标签多次定义合并为多条），
     * 替换引用为 "+" 标记（首引用处内嵌隐藏 store，postprocess 填充渲染内容）。
     * 未定义引用保留原文。
     */
    function transformSidenotes(text, ctx) {
        var lines = String(text).split('\n');
        var outLines = [];
        var defs = {}; /* label → [md, md, …] */
        var defOrder = [];
        var i = 0;

        while (i < lines.length) {
            var m = lines[i].match(SIDENOTE_DEF_RE);
            if (m) {
                var label = m[1];
                var content = [m[2]];
                i++;
                /* 多行定义：2 空格及以上缩进续行（规格示例为 2 空格，兼容 tab） */
                while (i < lines.length && /^[ \t]{2,}\S/.test(lines[i])) {
                    content.push(lines[i].replace(/^[ \t]{2}/, ''));
                    i++;
                }
                if (!(label in defs)) {
                    defs[label] = [];
                    defOrder.push(label);
                }
                /* 保留换行结构（join('\n')）：列表 / 多段落定义需要行边界才能被
                   块级渲染正确解析（join(' ') 会把多行列表压成一行丢失结构） */
                var joined = restoreCodeInStr(content.join('\n').trim(), ctx);
                if (joined) defs[label].push(joined);
                continue;
            }
            outLines.push(lines[i]);
            i++;
        }

        if (!defOrder.length) return outLines.join('\n');

        var pending = ctx.sidenotes || (ctx.sidenotes = []);
        var emitted = {};
        var body = outLines.join('\n');

        body = body.replace(SIDENOTE_REF_RE, function (whole, label) {
            if (!(label in defs) || !defs[label].length) return whole;
            var store = '';
            if (!emitted[label]) {
                emitted[label] = true;
                var token = '%%SN_STORE_' + (ctx.snNonce || (ctx.snNonce = makeNonce())) + '_' + pending.length + '%%';
                pending.push({ token: token, label: label, mds: defs[label] });
                /* template 载体：内容惰性解析不参与布局，且块级富文本（p/ul）不会被
                   HTML 解析器从行内容器中剥离（span 场景实测会被吐出到正文） */
                store = '<template class="sn-store" data-sn-label="' + escapeHtml(label) + '">' + token + '</template>';
            }
            return '<sup class="fn-ref sn-ref" data-sn-label="' + escapeHtml(label) + '"' +
                ' role="button" tabindex="0" aria-expanded="false" aria-label="查看边注：' + escapeHtml(label) + '">+</sup>' + store;
        });

        return body;
    }


    /** 指令主变换：栈式解析容器围栏，递归处理帧体。未闭合围栏 / 未知指令 / tab 脱离 tabs → 原文降级输出 + 告警 */
    function transformDirectives(text, opts, ctx) {
        ctx = ctx || {};
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
            var block = '\n\n' + indentBlock(html, indent) + '\n\n';
            if (stack.length > 0) {
                /* 嵌套场景：内层容器闭合时，渲染结果写入父帧体，随父容器递归包裹 */
                stack[stack.length - 1].bodyLines.push(block);
            } else {
                out.push(block);
            }
        };

        /** 叶子指令落点：容器内 → 帧体缓冲（单行压缩），顶层 → 块输出 */
        var emitLeaf = function (html, indent) {
            if (stack.length > 0) {
                stack[stack.length - 1].bodyLines.push(indent + html.replace(/\n+/g, ' '));
            } else {
                emitBlock(html, indent);
            }
        };

        /** 关闭一个栈帧：folding/tab/tabs/gallery/video容器/linkcard卡片/github卡片 */
        var closeFrame = function (frame) {
            var body = frame.bodyLines.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');

            switch (frame.name) {
                case 'gallery': {
                    var galleryHtml = renderGalleryDirective(body, frame.attrs);
                    if (galleryHtml) {
                        emitBlock(galleryHtml, frame.indent);
                    } else {
                        warn(':::gallery 内无 ![说明](地址) 图片行（原样输出）: ' + frame.raw.trim());
                        emitBlock(frame.raw + '\n' + body + '\n' + ':::', frame.indent);
                    }
                    break;
                }
                case 'file-tree': {
                    var ftRoots = parseListTree(body);
                    if (ftRoots) {
                        emitBlock(renderFileTreeShell(ftRoots, frame.attrs), frame.indent);
                    } else {
                        warn(':::file-tree 内无有效嵌套列表（原样输出）: ' + frame.raw.trim());
                        emitBlock(frame.raw + '\n' + body + '\n' + ':::', frame.indent);
                    }
                    break;
                }
                case 'code-tree': {
                    var ctHtml = renderCodeTree(body, frame.attrs, ctx, warn);
                    if (ctHtml) {
                        emitBlock(ctHtml, frame.indent);
                    } else {
                        warn(':::code-tree 结构不合法（原样输出）: ' + frame.raw.trim());
                        emitBlock(frame.raw + '\n' + body + '\n' + ':::', frame.indent);
                    }
                    break;
                }
                case 'steps': {
                    var stepsParsed = parseStepsBody(body, ctx);
                    if (stepsParsed) {
                        emitBlock(renderSteps(stepsParsed, frame.attrs), frame.indent);
                    } else {
                        warn(':::steps 内必须且仅包含一个有序列表（原样输出）: ' + frame.raw.trim());
                        emitBlock(frame.raw + '\n' + body + '\n' + ':::', frame.indent);
                    }
                    break;
                }
                case 'folding': {
                    var inner = transformDirectives(body, opts, ctx);
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
                    /* ::::tabs 默认折叠；{open} 默认展开（与 :::folding 语义一致） */
                    var tabsOpen = !!(frame.attrs &&
                        (frame.attrs.open === true || String(frame.attrs.open).toLowerCase() === 'true'));
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
                        '<div class="md-tabs' + (tabsOpen ? ' open' : '') + '" data-md-tabs>' +
                        '\n<div class="md-tabs-head">' +
                        '\n<div class="md-tabs-bar" role="tablist">' +
                        '\n' + bar +
                        '\n</div>' +
                        '\n<button class="md-tabs-toggle" type="button" aria-expanded="' + (tabsOpen ? 'true' : 'false') + '"' +
                        ' title="展开/收起面板内容" aria-label="展开/收起面板内容">' +
                        '<i class="details-icon ri-arrow-right-s-line" aria-hidden="true"></i></button>' +
                        '\n</div>' +
                        '\n<div class="md-tabs-body">' + panels + '</div>' +
                        '\n</div>',
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
                /* [标题] 简写捕获组：并入 attrs.title */
                if (openMatch[5] != null && String(openMatch[5]).trim() !== '') {
                    attrs.title = String(openMatch[5]).trim();
                }

                /* 叶子指令（恰好两个冒号）：单行自足。否则进入顶层输出。 */
                if (fenceLen === 2) {
                    if (LEAF_DIRECTIVES.indexOf(name) !== -1) {
                        var leafHtml = renderLeafDirective(name, attrs);
                        if (leafHtml) {
                            emitLeaf(leafHtml, indent);
                            i++;
                            continue;
                        }
                        warn('::' + name + ' 指令参数缺失：' + line.trim());
                    }
                    out.push(line);
                    i++;
                    continue;
                }

                /* 无正文指令（>= 3 冒号的 video/linkcard/github）：自足渲染，不入栈、不消费后续围栏。其后的 ::: 属于外层容器 */
                if (BODYLESS_DIRECTIVES.indexOf(name) !== -1) {
                    var bodylessHtml = renderLeafDirective(name, attrs);
                    if (bodylessHtml) {
                        emitLeaf(bodylessHtml, indent);
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
                        var innerHtml = transformDirectives(frame.bodyLines.join("\n"), opts, ctx);
                        /* 面板级 notoc 优先（true/false 显式值）；缺省继承组级 ::::tabs{notoc} 的整组排除 */
                        var panelNotoc = attrBool(frame.attrs.notoc);
                        frame.owner.panels.push({
                            title: frame.attrs.title != null && String(frame.attrs.title).trim() !== ''
                                ? String(frame.attrs.title)
                                : ('Tab ' + (frame.owner.panels.length + 1)),
                            notoc: panelNotoc !== undefined
                                ? panelNotoc
                                : (attrBool(frame.owner.attrs.notoc) === true),
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
                out.push('\n\n' + literal.join('\n') + '\n\n');
            } else {
                out.push('\n\n' + literal.join('\n') + '\n\n');
            }
        }

        /* 规整多余空行 */
        return out.join('\n').replace(/\n{4,}/g, '\n\n\n');
    }

    /* ④b 数学公式摘离/归还：marked breaks 会拆散多行 $$，摘离保持公式整体 */

    function extractMath(text, ctx) {
        if (!/\$|\\\(|\\\[/.test(text)) return text;
        var spans = [];
        var nonce = makeNonce();
        var ph = function (i) { return '%%MD_MATH_' + nonce + '_' + i + '%%'; };
        var push = function (m) { spans.push(m); return ph(spans.length - 1); };

        /* 块级 $$...$$（可跨行）优先，避免被行内规则截断 */
        text = text.replace(/\$\$[\s\S]+?\$\$/g, push);
        /* 行内 $...$（单行、非空、非空白边界） */
        text = text.replace(/\$(?!\s)([^$\n]+?)(?!\s)\$/g, push);
        /* LaTeX 定界符 \[...\] 与 \(...\) */
        text = text.replace(/\\\[[\s\S]+?\\\]/g, push);
        text = text.replace(/\\\([\s\S]+?\\\)/g, push);

        if (spans.length) {
            ctx.mathSpans = spans;
            ctx.mathNonce = nonce;
        }
        return text;
    }

    function restoreMath(html, ctx) {
        if (!ctx.mathSpans || !ctx.mathSpans.length) return html;
        var out = String(html);
        for (var i = 0; i < ctx.mathSpans.length; i++) {
            out = out.split('%%MD_MATH_' + ctx.mathNonce + '_' + i + '%%').join(ctx.mathSpans[i]);
        }
        return out;
    }

    /* ⑤ 脚注收集与替换 */
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
                    defs[label] = restoreCodeInStr(content.join(' ').trim(), ctx);
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
            return '<sup class="fn-ref" id="fnref-' + escapeHtml(label) + '" data-fn-ref="' + escapeHtml(label) + '"' +
                ' role="button" tabindex="0" aria-label="查看注释卡片">' + n + '</sup>';
        });

        /* 文末汇总区：仅收录被引用的定义 */
        var used = defOrder.filter(function (l) { return l in refMap; });
        if (used.length === 0) return body;

        var items = used.map(function (label) {
            var token = '%%FN_BODY_' + makeNonce() + '%%';
            pending.push({ token: token, md: defs[label], label: label });
            return '<li id="fn-' + escapeHtml(label) + '" class="footnote-item">' +
                '<button class="fn-ref fn-jump" type="button" data-fn-jump="fnref-' + escapeHtml(label) + '"' +
                ' aria-label="返回引用处 ' + (refMap[label] || '') + '">' + (refMap[label] || '') + '</button>' +
                '<span class="footnote-text">' + token + '</span>' +
                '</li>';
        }).join('\n');

        return body + '\n\n<section class="footnotes" data-footnotes data-notoc>' +
            '\n<div class="footnotes-title"><i class="ri-book-open-line" aria-hidden="true"></i><span>注释</span></div>' +
            '\n<ol class="footnotes-list">\n' + items + '\n</ol>\n</section>';
    }

    /* ⑥ 行内防剧透 :spoiler[text] */

    function transformInlineSpoilers(text) {
        return text.replace(/:spoiler\[([^\]\n]*)\]/g, function (whole, inner) {
            return '<span class="spoiler" role="button" tabindex="0" title="防剧透内容，点击显示">' +
                escapeHtml(inner) + '</span>';
        });
    }

    /* 对外 API */
    /**
     * Markdown 正文前置变换
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
        text = extractMath(text, ctx);
        text = transformAdmonitions(text, opts);
        text = transformDirectives(text, opts, ctx);
        text = transformFootnotes(text, ctx);
        text = transformSidenotes(text, ctx);
        text = transformInlineSpoilers(text);
        text = restoreCode(text, ctx);

        return { text: text, ctx: ctx };
    }

    /**
     * marked.parse 之后的后置处理
     * @param {string} html
     * @param {Object} ctx - preprocess 返回的 ctx
     * @param {Object} [api]
     * @param {Function} [api.parseInline] - marked.parseInline，用于脚注定义体
     * @returns {string}
     */
    function postprocess(html, ctx, api) {
        api = api || {};
        var out = String(html);

        /* ⓪ 内容图片统一补 loading=lazy / decoding=async（幂等） */
        out = out.replace(/<img\b([^>]*)>/g, function (all, attrs) {
            var a = String(attrs);
            if (!/\sloading\s*=/.test(a)) a += ' loading="lazy"';
            if (!/\sdecoding\s*=/.test(a)) a += ' decoding="async"';
            return '<img' + a + '>';
        });

        /* 脚注、边注共用：外链新标签页打开，并补齐安全 rel；文内锚点不受影响 */
        var enhanceNoteLinks = function (rendered) {
            return String(rendered).replace(
                /<a\b([^>]*?\s+href\s*=\s*)(["'])(https?:\/\/[^"']*)\2([^>]*)>/gi,
                function (match, beforeHref, quote, href, afterHref) {
                    var attrs = beforeHref + quote + href + quote + afterHref;
                    var relPattern = /(^|\s)rel\s*=\s*(["'])(.*?)\2/i;
        
                    if (!/(^|\s)target\s*=/i.test(attrs)) {
                        attrs += ' target="_blank"';
                    }
        
                    if (relPattern.test(attrs)) {
                        attrs = attrs.replace(
                            relPattern,
                            function (relAttr, leading, relQuote, relValue) {
                                var rel = relValue.split(/\s+/).filter(Boolean);
        
                                if (!rel.some(function (item) {
                                    return item.toLowerCase() === 'noopener';
                                })) {
                                    rel.push('noopener');
                                }
        
                                if (!rel.some(function (item) {
                                    return item.toLowerCase() === 'noreferrer';
                                })) {
                                    rel.push('noreferrer');
                                }
        
                                return leading + 'rel=' + relQuote +
                                    rel.join(' ') + relQuote;
                            }
                        );
                    } else {
                        attrs += ' rel="noopener noreferrer"';
                    }
        
                    return '<a' + attrs + '>';
                }
            );
        };
        
        /*  脚注、边注共用：渲染脚注或边注；useBlock 控制是否优先进行块级渲染 */
        var renderNote = function (md, useBlock) {
            var rendered = null;
            md = md == null ? '' : String(md);
        
            if (useBlock && api && typeof api.parseBlock === 'function') {
                try {
                    rendered = api.parseBlock(md);
                } catch (e) {
                    rendered = null;
                }
            }
        
            if (rendered == null && api && typeof api.parseInline === 'function') {
                try {
                    rendered = api.parseInline(md);
                } catch (e) {
                    rendered = null;
                }
            }
        
            if (rendered == null) {
                rendered = useBlock
                    ? '<p>' + escapeHtml(md) + '</p>'
                    : escapeHtml(md);
            }
        
            return enhanceNoteLinks(rendered);
        };
        
        /* ① 脚注定义体：inline 渲染回填 */
        if (ctx && Array.isArray(ctx.footnotes) && ctx.footnotes.length) {
            ctx.footnotes.forEach(function (fn) {
                if (!fn || typeof fn.token !== 'string' || !fn.token) {
                    return;
                }
        
                out = out.split(fn.token).join(renderNote(fn.md, false));
            });
        }
        
        /* ② 边注定义体：块级渲染回填（多段落 / 列表 / 行内代码均支持）。
           多条关联定义：每条按自身 Markdown 原样块级渲染，条目间以间距分隔 */
        if (ctx && Array.isArray(ctx.sidenotes) && ctx.sidenotes.length) {
            ctx.sidenotes.forEach(function (sn) {
                if (!sn || typeof sn.token !== 'string' || !sn.token) {
                    return;
                }
        
                var mds = Array.isArray(sn.mds) ? sn.mds : [];
                var content;
        
                if (mds.length === 1) {
                    content = renderNote(mds[0], true);
                } else {
                    content = mds.map(function (md) {
                        return '<div class="sn-item">' +
                            renderNote(md, true) + '</div>';
                    }).join('');
                }
        
                out = out.split(sn.token).join(content);
            });
        }

        /* ③ 遗留自定义标签还原 */
        out = restoreLegacyTags(out, ctx);

        /* ④ 数学公式还原（置于最后） */
        out = restoreMath(out, ctx);

        return out;
    }

    return {
        version: VERSION,
        preprocess: preprocess,
        postprocess: postprocess
    };
});
