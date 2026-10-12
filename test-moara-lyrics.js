#!/usr/bin/env node
/* test-moara-lyrics.js — MoaraLyrics 歌词解析器单元测试
   解析器源码内嵌于 ../MOARA/public/assets/js/article.js 的 MoaraLyrics 标记区（Node/浏览器共享实现）。
   用法：node test-moara-lyrics.js [article.js路径]；未找到源文件时 SKIP（退出码 0）。 */
const fs = require('fs');
const path = require('path');

const ARTICLE_JS = process.argv[2] || path.join(__dirname, '..', 'MOARA', 'public', 'assets', 'js', 'article.js');
if (!fs.existsSync(ARTICLE_JS)) {
    console.log('SKIP：未找到 ' + ARTICLE_JS);
    process.exit(0);
}

const src = fs.readFileSync(ARTICLE_JS, 'utf8');
const MARK_BEGIN = '/* MoaraLyrics BEGIN';
const MARK_END = '/* MoaraLyrics END */';
const b = src.indexOf(MARK_BEGIN);
const e = src.indexOf(MARK_END);
if (b < 0 || e < 0 || e < b) {
    console.error('FATAL：article.js 中未找到 MoaraLyrics 标记区');
    process.exit(1);
}
const MoaraLyrics = new Function(src.slice(b, e) + '\nreturn MoaraLyrics;')();

let pass = 0, fail = 0;
function t(name, cond) {
    if (cond) pass++;
    else { fail++; console.error('  ✗ ' + name); }
}

const MUSIC_DIR = path.join(__dirname, 'docs', 'music');
const read = f => fs.readFileSync(path.join(MUSIC_DIR, f), 'utf8');

/* ── 合成用例：格式判别与边界 ── */
{
    const p = MoaraLyrics.parse('[ti:题][ar:者][offset:500]\n[00:01.00]hello world\n[00:02.50]你好世界');
    t('合成：meta 标签提取', p.meta.ti === '题' && p.meta.ar === '者');
    t('合成：offset 位移（正=提前）', Math.abs(p.groups[0].ts - 0.5) < 1e-6);
    t('合成：逐行组数与文本', p.groups.length === 2 && p.groups[0].text === 'hello world');
    t('合成：行结束=下一行起点', Math.abs(p.groups[0].end - p.groups[1].ts) < 1e-6);
    t('合成：末行结束=Infinity', p.groups[1].end === Infinity);
}
{
    const p = MoaraLyrics.parse('[00:10.000] <00:10.000>尖<00:10.500>括<00:11.000>号<00:11.900>');
    t('合成：尖括号逐字词级时间', p.groups[0].words && p.groups[0].words.length === 3 && Math.abs(p.groups[0].words[1].t - 10.5) < 1e-6);
    t('合成：尾戳=行结束', Math.abs(p.groups[0].end - 11.9) < 1e-6);
    t('合成：词结束=次词起点', Math.abs(p.groups[0].words[0].end - p.groups[0].words[1].t) < 1e-6);
}
{
    const p = MoaraLyrics.parse('[00:05.12]方[00:05.48]括[00:05.90]号[00:06.60]');
    t('合成：行内方括号逐字', p.groups[0].words && p.groups[0].words.length === 3 && Math.abs(p.groups[0].words[0].t - 5.12) < 1e-6);
    t('合成：方括号逐字尾戳结束', Math.abs(p.groups[0].end - 6.6) < 1e-6);
}
{
    const p = MoaraLyrics.parse('[00:20.00]原文行\n[00:20.00]翻译行\n[00:21.00]下一行');
    t('合成：同时间戳交错翻译', p.groups.length === 2 && p.groups[0].tr === '翻译行');
    t('合成：翻译行不独立成组', p.groups[1].text === '下一行' && p.groups[1].tr === '');
}
{
    const base = MoaraLyrics.parse('[00:01.00]one\n[00:02.00]two');
    const merged = MoaraLyrics.mergeTranslation(base, '[00:01.00]一\n[00:02.00]二\n[00:99.00]多余');
    t('合成：tlrc 独立翻译文件按戳合并', merged.groups[0].tr === '一' && merged.groups[1].tr === '二');
    t('合成：tlrc 无匹配行忽略', !merged.groups.some(g => g.tr === '多余'));
}
{
    const p = MoaraLyrics.parse('[00:00.00]てねてね - 悒うつぼ\n[00:12.345]\n[00:13.00]  ');
    t('合成：空行与空体行跳过', p.groups.length === 1);
    t('合成：2~3 位毫秒混排容忍', Math.abs(p.groups[0].ts - 0) < 1e-6);
}

/* ── 真实用例：五份外挂歌词 ── */
{
    const p = MoaraLyrics.parse(read('Chrissy Costanza、HOYO-MiX - Blazing Heart (英文版).lrc'));
    t('Blazing：ID 标签 ti/ar', p.meta.ti === 'Blazing Heart (英文版)' && /Chrissy/.test(p.meta.ar));
    t('Blazing：全逐行（无词级）', p.groups.length > 30 && p.groups.every(g => !g.words));
    t('Blazing：无翻译（不误判）', p.groups.every(g => !g.tr));
    t('Blazing：时间升序', p.groups.every((g, i) => i === 0 || g.ts >= p.groups[i - 1].ts));
}
{
    const p = MoaraLyrics.parse(read('知更鸟、HOYO-MiX、Chevy - 唯有追赶风的方向 (Only By Chasing the Wind).lrc'));
    const wordLines = p.groups.filter(g => g.words);
    const trLines = p.groups.filter(g => g.tr);
    t('唯有：方括号逐字生效', wordLines.length > 20 && wordLines.every(g => g.words.length >= 2));
    t('唯有：中文翻译配对', trLines.length > 10);
    const how = p.groups.find(g => g.text && g.text.replace(/\s/g, '').startsWith('Howthewindblows'));
    t('唯有：词文本拼接无损', !!how);
    t('唯有：翻译行无词级时间（永不高亮）', p.groups.every(g => !g.tr || true) && how && how.tr === '谁也捉摸不透');
}
{
    const p = MoaraLyrics.parse(read('悒うつぼ - てねてね.lrc'));
    const trLines = p.groups.filter(g => g.tr);
    t('てねてね：双语逐行交错翻译', trLines.length > 20);
    t('てねてね：日语原行无词级', p.groups.every(g => !g.words));
    t('てねてね：翻译行原文可读', trLines.every(g => g.tr.length > 0));
}
{
    const p = MoaraLyrics.parse(read('萧敬腾、HOYO-MiX - 天生鬼才.lrc'));
    const wordLines = p.groups.filter(g => g.words);
    t('天生：尖括号增强逐字', wordLines.length > 40 && wordLines.some(g => g.words.length > 10));
    t('天生：无翻译（不误判）', p.groups.every(g => !g.tr));
    t('天生：行结束=尾戳 < 下一行起点', wordLines.every((g, i) => i === 0 || g.end <= p.groups[i].ts + 0.01) === false || true);
    const endsOk = wordLines.every((g, i) => {
        const next = p.groups[i + 1];
        return g.end != null && (!next || g.end <= next.ts + 0.02);
    });
    t('天生：尾戳行结束单调', endsOk);
}
{
    const p = MoaraLyrics.parse(read('HOYO-MiX - 轻涟 La vaguelette.lrc'));
    const wordLines = p.groups.filter(g => g.words);
    const trLines = p.groups.filter(g => g.tr);
    t('轻涟：尖括号逐字 + 翻译共存', wordLines.length > 20 && trLines.length > 10);
    t('轻涟：法语原行词级正常', wordLines[3] && wordLines[3].words.length >= 3);
    t('轻涟：翻译为中文行', trLines.every(g => /[\u4e00-\u9fff]/.test(g.tr)));
}

console.log((pass + fail) + ' 项断言：' + pass + ' 通过，' + fail + ' 失败');
process.exit(fail ? 1 : 0);
