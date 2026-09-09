#!/usr/bin/env node
/**
 * 极简 md 博客构建脚本（零框架）
 * 扫描 content/ 下的 .md 文件 → 生成静态站到 dist/
 * 标题取文件名（支持 "YYYY-MM-DD-标题.md" 命名，日期从文件名解析）
 * 模板与微调：template.json 驱动
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const contentDir = path.join(root, 'content');
const distDir = path.join(root, 'dist');
const templatesDir = path.join(root, 'templates');

// ---------- 读取配置 ----------
const config = JSON.parse(fs.readFileSync(path.join(root, 'template.json'), 'utf8'));
const site = config.site || {};
const tplName = config.template || 'minimal';
const tplFile = path.join(templatesDir, `${tplName}.css`);
if (!fs.existsSync(tplFile)) {
  console.error(`模板不存在: ${tplName}（templates/ 目录下可用的：${fs.readdirSync(templatesDir).map(f => f.replace('.css', '')).join(', ')}）`);
  process.exit(1);
}
const tplCss = fs.readFileSync(tplFile, 'utf8');

// 微调参数 → CSS 变量覆盖
const t = config.tweak || {};
const fontStacks = {
  sans: "'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif",
  serif: "'Songti SC','Noto Serif SC','SimSun',serif",
  mono: "'SF Mono','JetBrains Mono',Consolas,monospace",
};
const overrides = [];
if (t.accent) overrides.push(`--accent:${t.accent}`);
if (t.bg) overrides.push(`--bg:${t.bg}`);
if (t.text) overrides.push(`--text:${t.text}`);
if (t.font_family && fontStacks[t.font_family]) overrides.push(`--font-family:${fontStacks[t.font_family]}`);
if (t.font_size) overrides.push(`--font-size:${t.font_size}px`);
const tweakCss = overrides.length ? `:root{${overrides.join(';')}}` : '';

// ---------- 基础布局 CSS（所有模板共用） ----------
const baseCss = `
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:var(--font-family);font-size:var(--font-size);line-height:1.8;-webkit-font-smoothing:antialiased;}
.wrap{max-width:var(--width);margin:0 auto;padding:0 24px;}
header.site{padding:72px 0 28px;border-bottom:1px solid var(--line);}
.site-name{font-size:24px;font-weight:600;letter-spacing:0.04em;}
.site-name a{color:var(--text);text-decoration:none;}
.subtitle{margin-top:8px;font-size:13px;color:var(--muted);}
main{padding:36px 0 64px;}
article.post{padding:22px 0;border-bottom:1px solid var(--line);}
article.post:last-child{border-bottom:none;}
article.post.essay{cursor:pointer;}
article.post.essay:hover{background:rgba(0,0,0,.015);}
.post .title{flex:1 1 auto;min-width:0;font-size:16px;color:var(--text);text-decoration:none;}
.post .title:hover{color:var(--accent);}
.post.article .title{display:inline-block;background:rgba(0,0,0,.045);padding:5px 14px;border-radius:8px;transition:background .15s;}
.post.article .title:hover{background:rgba(0,0,0,.08);color:var(--text);}
.post .date{font-size:12px;color:var(--muted);white-space:nowrap;}
.post .excerpt{flex:1 1 100%;margin-top:4px;font-size:13px;color:var(--muted);}
.essay-body{flex:1 1 100%;margin-top:0;font-size:14px;color:var(--text);}
.essay-body p{margin:.7em 0;}
.essay-body h1,.essay-body h2,.essay-body h3{line-height:1.5;margin:1em 0 .4em;font-size:1.1em;}
.essay-body blockquote{margin:.8em 0;padding:.1em .8em;border-left:3px solid var(--accent);color:var(--muted);}
.essay-body code{background:rgba(0,0,0,.06);padding:.1em .35em;border-radius:4px;font-size:.9em;}
.essay-body pre{background:rgba(0,0,0,.05);padding:10px 14px;border-radius:8px;overflow-x:auto;}
.essay-body img{max-width:100%;height:auto;border-radius:6px;}
.essay-body a{color:var(--accent);}
.essay-body ul,.essay-body ol{margin:.6em 0;padding-left:1.5em;}
.post-full{padding:8px 0 40px;}
.post-full .p-title{font-size:26px;font-weight:600;line-height:1.5;}
.post-full .p-date{font-size:13px;color:var(--muted);margin-top:10px;}
.md-body{margin-top:28px;font-size:1em;}
.md-body h1,.md-body h2,.md-body h3{line-height:1.5;margin:1.6em 0 .6em;}
.md-body h1{font-size:1.5em;}.md-body h2{font-size:1.3em;}.md-body h3{font-size:1.15em;}
.md-body p{margin:1em 0;}
.md-body blockquote{margin:1.2em 0;padding:.2em 1em;border-left:3px solid var(--accent);color:var(--muted);}
.md-body code{background:rgba(0,0,0,.06);padding:.15em .4em;border-radius:4px;font-size:.9em;}
.md-body pre{background:rgba(0,0,0,.05);padding:14px 16px;border-radius:8px;overflow-x:auto;}
.md-body pre code{background:none;padding:0;}
.md-body img{max-width:100%;height:auto;border-radius:6px;}
.md-body a{color:var(--accent);}
.md-body ul,.md-body ol{margin:1em 0;padding-left:1.6em;}
.md-body table{border-collapse:collapse;margin:1em 0;}
.md-body th,.md-body td{border:1px solid var(--line);padding:6px 12px;}
.back{display:inline-block;margin-top:36px;font-size:13px;color:var(--muted);text-decoration:none;}
.back:hover{color:var(--accent);}
footer.site{border-top:1px solid var(--line);padding:24px 0 56px;font-size:12px;color:var(--muted);}
@media (max-width:480px){.wrap{padding:0 18px;}header.site{padding:48px 0 20px;}.post-full .p-title{font-size:22px;}}
`;

// ---------- Markdown 渲染 ----------
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

// 剥离正文开头的 "# 标题"（页面已用文件名当标题，避免重复）
function stripLeadingH1(raw) {
  const lines = raw.split('\n');
  if (lines[0] && /^#\s+/.test(lines[0])) lines.shift();
  return lines.join('\n');
}

// 列表显示用标题：去掉"随笔"字样（随笔是常态，标题不再重复出现"随笔"）
function displayTitle(title) {
  const t = title.replace(/随笔/g, '').replace(/^[\s·\-—_、，,]+/, '').trim();
  return t || title;
}

// ---------- 扫描并解析文章 ----------
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// 取文件最后一次提交的时间（git，完整 ISO 含时分秒），拿不到返回 null
function gitDate(f) {
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${f}"`, { cwd: root, encoding: 'utf8' }).trim();
    return iso || null;
  } catch {
    return null;
  }
}

function parseFile(f) {
  const rel = path.relative(contentDir, f).replace(/\.md$/, '');
  const base = path.basename(f, '.md');
  // 兼容：文件名带日期前缀（YYYY-MM-DD-标题.md）时仍解析
  const m = base.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (m) return { date: m[1] + 'T00:00:00', title: m[2], slug: rel };
  // 常规：标题 = 文件名，日期 = 该文件最后提交时间
  const g = gitDate(f);
  if (g) return { date: g, title: base, slug: rel };
  // 兜底：未提交过的文件用修改时间
  return { date: fs.statSync(f).mtime.toISOString(), title: base, slug: rel };
}

// ---------- 页面骨架 ----------
function page(title, body) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
${tplCss}
${tweakCss}
${baseCss}
</style>
</head>
<body>
<div class="wrap">
  <header class="site">
    <div class="site-name"><a href="index.html">${site.name || '我的博客'}</a></div>
    ${site.subtitle ? `<div class="subtitle">${site.subtitle}</div>` : ''}
  </header>
  <main>
${body}
  </main>
  <footer class="site">
    <p>© ${new Date().getFullYear()} ${site.name || ''}</p>
  </footer>
</div>
</body>
</html>`;
}

// ---------- 主流程 ----------
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(path.join(distDir, 'posts'), { recursive: true });

const files = walk(contentDir).sort();
const posts = files.map(parseFile).sort((a, b) => (a.date === b.date ? 0 : (a.date < b.date ? 1 : -1)));
// 分类：标题含"随笔" → 随笔（列表内联全文），其余 → 文章（列表只显示标题）
for (const p of posts) p.isEssay = p.title.includes('随笔');

// 列表页
const listItems = posts.map((p) => {
  const href = `posts/${encodeURI(p.slug)}.html`;
  const dateHtml = (t.show_date === true) ? `<span class="date">${p.date.slice(0, 10)}</span>` : '';
  if (p.isEssay) {
    // 随笔：主体内容，不显示标题，点击整个区块进详情
    const raw = fs.readFileSync(path.join(contentDir, p.slug + '.md'), 'utf8');
    const bodyHtml = md.render(stripLeadingH1(raw));
    const jsHref = href.replace(/'/g, '%27');
    return `<article class="post essay" onclick="location.href='${jsHref}'" role="link">
  <div class="essay-body">${bodyHtml}</div>
</article>`;
  }
  // 文章：标题用《》包裹、浅灰背景块区分，点击进详情
  const raw = fs.readFileSync(path.join(contentDir, p.slug + '.md'), 'utf8');
  const bodyHtml = md.render(stripLeadingH1(raw));
  const m = bodyHtml.match(/<p>([\s\S]*?)<\/p>/);
  const excerpt = (m ? m[1] : bodyHtml).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const excerptHtml = (t.show_excerpt && excerpt) ? `<p class="excerpt">${excerpt.length > 80 ? excerpt.slice(0, 80) + '…' : excerpt}</p>` : '';
  return `<article class="post article">
  <a class="title" href="${href}">《${displayTitle(p.title)}》</a>
  ${dateHtml}
  ${excerptHtml}
</article>`;
}).join('\n');

const indexHtml = page(
  `${site.name || '我的博客'}${site.subtitle ? ' · ' + site.subtitle : ''}`,
  listItems || '<p style="color:var(--muted)">还没有文章。在 content/ 目录新建 .md 文件即可。</p>'
);
fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

// 文章页
for (const p of posts) {
  const raw = fs.readFileSync(path.join(contentDir, p.slug + '.md'), 'utf8');
  const bodyHtml = md.render(stripLeadingH1(raw));
  const postHtml = `<article class="post-full">
  <div class="md-body">${bodyHtml}</div>
  <a class="back" href="../index.html">← 返回列表</a>
</article>`;
  fs.writeFileSync(path.join(distDir, 'posts', p.slug + '.html'), page(`${displayTitle(p.title)} · ${site.name || '我的博客'}`, postHtml));
}

console.log(`✔ 构建完成：${posts.length} 篇文章 → dist/（模板：${tplName}）`);
console.log(`  - 列表页：index.html`);
console.log(`  - 文章页：${posts.map(p => 'posts/' + p.slug + '.html').join('、')}`);
