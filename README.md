---
title: md-blog 极简本地博客
created: 2026-09-09
modified: 2026-09-09
author: doubao
tags: 博客, Markdown, GitHub Pages, 极简
category: 项目
summary: 零框架自研的极简 md 博客：内容即 Markdown 文件，构建脚本生成静态站，GitHub Actions 自动发布到 GitHub Pages。
word_count: 940
---

# md-blog · 极简本地博客

不用任何博客框架（Astro / Hexo / Hugo），一个 `build.mjs` 脚本 + 一个 `template.json` 配置，搞定一个极简静态博客。

- **内容 = Markdown 文件**：在 `content/` 新建 `.md` 就是写文章，不需要写 frontmatter
- **标题取文件名**：`雨天读书记.md` → 标题「雨天读书记」；文件名和页面都不显示日期，列表就是纯标题
- **随笔 / 文章两种显示**：标题含「随笔」的是随笔，在列表页**直接展开全文**，标题自动去掉「随笔」字样；其他是文章，列表里以**灰色小字弱化显示**（随笔为主、文章偶然出现），点击进详情
- **详情页**：不显示标题，直接是完整正文
- **无标签、无分类**：就是一张文章列表，按日期倒序
- **模板可换可微调**：`template.json` 一个配置文件切换模板、调整配色字体
- **发布免费免备案**：GitHub Actions 自动构建 → 推到 gh-pages 分支 → GitHub Pages 出站

## 目录结构

```
md-blog/
├── content/            # 你的文章（.md 文件），放这里就行
├── templates/          # 模板库（minimal / paper / dark）
├── template.json       # 模板配置（换模板、微调都在这改）
├── build.mjs           # 构建脚本（唯一的核心代码）
├── package.json        # 依赖：仅 markdown-it
└── .github/workflows/  # GitHub Actions：构建 + 发布
```

## 写文章（日常操作）

1. 在 `content/` 新建一个文件，命名就是标题：`标题.md`
2. 直接写正文，**不用写任何头部信息**（标题取文件名，日期自动取该文件最后提交的时间）

```
content/
├── 雨天读书记.md          ← 文章：列表只显示标题
├── 随笔.md                ← 随笔：列表直接展开全文
└── 一碗深夜的面.md
```

**随笔 / 文章怎么区分**：看标题里有没有「随笔」两个字——有就是随笔（列表直接展开全文，标题里的「随笔」字样会自动去掉，比如「随笔·下班路上的夏夜」显示为「下班路上的夏夜」）；没有就是文章（列表里灰色小字显示标题，弱化存在感）。两种点击标题都能进详情页。

> 页面不显示日期，列表顺序 = 文章最后提交时间倒序（新写的在前）。想显示日期时，把 `template.json` 里 `show_date` 改为 `true`。

## 本地预览

```bash
cd md-blog
npm install
npm run build      # 生成 dist/
npm run preview    # 打开 http://localhost:8080
```

## 部署到 GitHub Pages

1. GitHub 上新建一个仓库（如 `md-blog`），本地执行：

```bash
cd md-blog
git init
git add .
git commit -m "init"
git remote add origin https://github.com/你的用户名/md-blog.git
git push -u origin main
```

2. 等 Actions 跑完（约 1 分钟），去仓库 **Settings → Pages**：
   - Source 选 **Deploy from a branch**
   - Branch 选 **gh-pages** + `/ (root)` → Save

3. 访问 `https://你的用户名.github.io/md-blog/`

之后每次 `git push`，站点自动重新构建发布，无需任何手动操作。

## 模板配置（template.json）

```json
{
  "site": { "name": "JJ 的笔记", "subtitle": "记录日常，写下想法" },
  "template": "minimal",
  "tweak": {
    "accent": "#1a1a1a",
    "bg": "#ffffff",
    "text": "#1a1a1a",
    "font_family": "sans",
    "font_size": 16,
    "show_date": true,
    "show_excerpt": false
  }
}
```

| 字段 | 说明 |
| --- | --- |
| `site.name` | 站点名（页面头部 + 页脚） |
| `site.subtitle` | 副标题，留空不显示 |
| `template` | 模板名：`minimal`（白）/ `paper`（暖纸）/ `dark`（深色） |
| `tweak.accent` | 强调色（链接、引用线等），如 `#8a6f4d` |
| `tweak.bg` / `tweak.text` | 背景色 / 文字色，可覆盖模板默认值 |
| `tweak.font_family` | 字体：`sans`（黑体）/ `serif`（宋体）/ `mono`（等宽） |
| `tweak.font_size` | 正文字号（px） |
| `tweak.show_date` | 是否显示日期（默认 `false`，纯标题列表） |
| `tweak.show_excerpt` | 列表是否显示正文摘要 |

想加新模板：在 `templates/` 新建 `xxx.css`（参考现有模板，定义 `:root` 变量即可），然后在 `template.json` 把 `template` 改成 `xxx`。

## 技术说明

- 唯一依赖：`markdown-it`（Markdown 渲染，约 5 个包）
- 构建脚本纯 Node，无框架、无编译
- 支持文章正文的常用 Markdown：标题、引用、代码块、表格、图片、链接等
- 图片放在 `content/` 同级目录，文章里用相对路径引用（如 `![](images/xx.png)`）
