---
title: md-blog 极简本地博客
created: 2026-09-09
modified: 2026-09-09
author: doubao
tags: 博客, Markdown, GitHub Pages, 极简
category: 项目
summary: 零框架自研的极简 md 博客：内容即 Markdown 文件，构建脚本生成静态站，GitHub Actions 自动发布到 GitHub Pages。
word_count: 900
---

# md-blog · 极简本地博客

不用任何博客框架（Astro / Hexo / Hugo），一个 `build.mjs` 脚本 + 一个 `template.json` 配置，搞定一个极简静态博客。

- **内容 = Markdown 文件**：在 `content/` 新建 `.md` 就是写文章，不需要写 frontmatter
- **标题取文件名**：`2026-09-09-雨天读书记.md` → 标题「雨天读书记」，日期从文件名解析
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

1. 在 `content/` 新建一个文件，命名格式：`YYYY-MM-DD-标题.md`
2. 直接写正文，**不用写任何头部信息**（标题、日期都自动从文件名取）

```
content/
├── 2026-09-09-雨天读书记.md
├── 2026-08-27-在公园散步的三十分钟.md
└── 2026-08-19-一碗深夜的面.md
```

> 文件名不带日期也可以（如 `随笔.md`），此时日期取文件的修改时间。命名建议统一用日期前缀，保证排序稳定。

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
| `tweak.show_date` | 列表是否显示日期（标题旁小字） |
| `tweak.show_excerpt` | 列表是否显示正文摘要 |

想加新模板：在 `templates/` 新建 `xxx.css`（参考现有模板，定义 `:root` 变量即可），然后在 `template.json` 把 `template` 改成 `xxx`。

## 技术说明

- 唯一依赖：`markdown-it`（Markdown 渲染，约 5 个包）
- 构建脚本纯 Node，无框架、无编译
- 支持文章正文的常用 Markdown：标题、引用、代码块、表格、图片、链接等
- 图片放在 `content/` 同级目录，文章里用相对路径引用（如 `![](images/xx.png)`）
