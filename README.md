# GitHub Trending Skill

一个用于 AI 助手的 **Skill 定义**，可自动获取 GitHub Trending 数据，分析增长最快的开源项目，并生成结构化技术博客或高端 HTML 宣传海报/封面。

## 功能

- **双语言脚本** — 提供 PowerShell (`.ps1`) 和 Node.js (`.mjs`) 两种实现，零外部依赖
- **抓取 GitHub Trending** — 支持 `daily` / `weekly` / `monthly` 周期，可按编程语言和自然语言过滤
- **API 元数据增强** — 自动调用 GitHub REST API 获取描述、Topics、许可证、Star/ Fork 数、README 摘要
- **智能排序** — 按 `starsToday`（今日增长）降序排列，自动取 Top N
- **优雅降级** — API 限流或不可用时仍可基于页面数据工作
- **自动化支持** — 提供 GitHub Actions 工作流模板，每日定时抓取
- **结构化博客输出** — 内置 Markdown 模板，按项目定位、核心能力、技术特点、使用场景等要素生成完整文章
- **HTML 视觉封面** — 支持将博客摘要生成单文件 HTML 宣传海报或社交封面，适合发布预览、公众号头图、技术周报封面

## 快速开始

### 前置条件

- **PowerShell 5.1+** 或 **Node.js 18+**
- （可选）`GITHUB_TOKEN` 环境变量 — 提升 API 速率限制（60 → 5000 次/小时）

### 使用

```powershell
# PowerShell
$env:GITHUB_TOKEN = "ghp_xxxxxxxxxxxx"
.\scripts\fetch_github_trending.ps1 -Since daily -Limit 10 -Output trending.json
```

```bash
# Node.js
GITHUB_TOKEN=ghp_xxxxxxxxxxxx node scripts/fetch_github_trending.mjs \
  --since daily --limit 10 --output trending.json
```

### 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-Since` / `--since` | 周期：`daily`, `weekly`, `monthly` | `daily` |
| `-Limit` / `--limit` | 返回仓库数 | `10` |
| `-Language` / `--language` | 编程语言过滤（如 `python`, `rust`） | 全部 |
| `-SpokenLanguage` / `--spoken-language` | 自然语言过滤（如 `zh`, `en`） | 全部 |
| `-Output` / `--output` | JSON 输出路径 | stdout |
| `-NoReadme` / `--no-readme` | 跳过 README 获取 | false |

## 效果展示

### 抓取数据（JSON 输出）

```json
{
  "fetchedAt": "2026-05-15T01:00:00.000Z",
  "sourceUrl": "https://github.com/trending?since=daily",
  "since": "daily",
  "limit": 3,
  "count": 3,
  "rankingBasis": "GitHub Trending star growth for the selected period",
  "repositories": [
    {
      "rank": 1,
      "owner": "anthropics",
      "name": "claude-code",
      "starsToday": 1203,
      "language": "TypeScript",
      "description": "Claude Code is an agentic coding tool...",
      "stars": 15000,
      "forks": 1200,
      "topics": ["ai", "developer-tools", "cli"],
      "license": "MIT",
      "readmeExcerpt": "Claude Code is an agentic coding tool that lives in your terminal..."
    }
  ]
}
```

### 生成的技术博客（Markdown 概览）

使用 `references/blog-overview-template.md` 模板生成的博客包含：

```
# GitHub Trending Daily: Top 10 增长最快的开源项目

## 概览
今日 AI 工具链和开发者基础设施类项目占据主导，
anthropics/claude-code 以 +1203 stars 领跑...

## Top 10 排行榜
| 排名 | 项目 | 今日增长 | 总 Stars | 语言 | 相关领域 |
|------|------|---------|---------|------|---------|
| 1 | claude-code | +1203 | 15k | TypeScript | AI, 开发工具 |

## 项目详解
### 🥇 anthropics/claude-code
- 项目链接: https://github.com/anthropics/claude-code
- Star 增长与基础数据:
  - Stars today: +1203
  - Total stars: 15k
  - License: MIT
- 技术标签:
  - Primary language: TypeScript
  - Topics: AI, developer tools, CLI

**项目定位：**
- What problem it solves: 让开发者在终端中使用 AI 代理完成编码任务
- Project category: AI 编程代理 / 开发者工具
- One-sentence summary: 面向终端工作流的 AI coding agent

**核心能力：**
- 代码生成与解释
- 重构和调试辅助
- 与本地开发环境协作

**技术特点：**
- 终端原生交互
- 面向 agentic coding workflow
- 通过 README 和仓库元数据判断具体架构细节

**使用场景：**
- 快速理解陌生代码库
- 辅助实现功能和修复 bug
- 生成开发者技术简报中的趋势项目解析

**适合人群：**
- 希望把 AI 编程能力嵌入日常终端工作流的开发者和工程团队

**相关领域：**
- AI agents, developer tools, CLI

**为什么值得关注：**
- 代表 AI 辅助编程从 IDE 插件向终端原生 Agent 的演进

**评估建议：**
- 在团队采用前关注权限边界、代码安全、上下文管理和与现有工作流的匹配度

## 趋势分析
本轮 Top 10 中，AI 代理工具占比 40%，基础设施类占 30%...

## 实用建议
- 关注 AI 编程代理领域的工具链成熟度...
```

### 生成 HTML 宣传海报或封面

当用户要求“HTML 海报”“宣传封面”“社交预览图”“公众号头图”等视觉输出时，Skill 会参考 `references/html-poster-template.md`，将博客内容压缩成醒目的标题、趋势摘要、亮点卡片和精选项目卡片。

输出要求：

- 生成完整的单文件 HTML
- 使用内联 CSS，无需外部依赖
- 支持竖版海报尺寸（如 `1200x1600` / `1080x1350`）
- 支持横版封面尺寸（如 `1200x630`）
- 标题醒目、层级清晰、视觉风格偏高端技术编辑风
- 底部保留 GitHub Trending 来源、日期和热度信号说明

示例提示词：

```text
把今天的 GitHub Trending 技术博客总结成一个 1200x630 的 HTML 封面，
标题要醒目吸引人，整体风格高端、精美、适合技术公众号头图。
```

## 自动化部署

将 `references/github-actions-daily.yml` 复制到你的仓库 `.github/workflows/` 目录：

```yaml
# 每天 UTC 01:00 自动抓取，提交 data/github-trending-daily.json
```

## 项目结构

```
.
├── SKILL.md                          # Skill 定义（AI 助手的指令）
├── scripts/
│   ├── fetch_github_trending.ps1     # PowerShell 实现
│   └── fetch_github_trending.mjs     # Node.js 实现
├── references/
│   ├── github-actions-daily.yml      # GitHub Actions 自动化模板
│   ├── blog-overview-template.md     # 博客输出模板
│   └── html-poster-template.md       # HTML 宣传海报/封面模板
└── README.md                         # 本文档
```

## License

MIT
