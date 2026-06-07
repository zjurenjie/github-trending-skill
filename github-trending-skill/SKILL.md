---
name: github-trending-skill
description: Fetches GitHub Trending daily, identifies the top 10 repositories with the fastest current star growth, and turns them into a technical blog overview or HTML promo cover. This skill should be used when asked for GitHub trending reports, fastest-growing open-source projects, daily developer trend summaries, technical blog overviews, or visual blog posters/covers from https://github.com/trending.
---

# GitHub Trending Skill

## Purpose

Generate a daily technical overview of GitHub Trending projects by collecting the current fastest-growing repositories, enriching each entry with repository metadata, and summarizing what each project does, where it is useful, and which technical domains it belongs to. When requested, turn the blog summary into a polished single-file HTML promotional poster or cover.

## When to Use

Use this skill for requests such as:

- "获取今天 GitHub Trending star 增长最快的 Top 10"
- "每天总结 GitHub Trending 项目并输出技术博客"
- "写一篇 GitHub Trending overview"
- "分析当前增长最快的开源项目"
- "给我生成 GitHub Trending 每日技术简报"
- "把这篇 GitHub Trending 博客生成 HTML 宣传海报"
- "生成一个高端精美的技术博客封面"

## Workflow

1. Fetch the current trending data:
   - Run `scripts/fetch_github_trending.ps1 -Since daily -Limit 10`.
   - Use `scripts/fetch_github_trending.mjs --since daily --limit 10` when Node.js is available and preferred.
   - Prefer daily trending for "当前 star 增长最快"; use `--since weekly` or `--since monthly` only when explicitly requested.
   - Set `GITHUB_TOKEN` when available to improve GitHub API rate limits and fetch richer metadata.

2. Verify ranking:
   - Sort by `starsToday` from GitHub Trending.
   - If `starsToday` is unavailable for some projects, keep GitHub Trending order and note the limitation.
   - Treat the result as a snapshot because GitHub Trending changes during the day.

3. Enrich and interpret each project:
   - Use repository description, language, homepage, topics, stars, forks, license, and README excerpt when available.
   - Infer "what it is" from the README and repository metadata, not just the repository name.
   - Identify the project's positioning, core capabilities, technical characteristics, target users, and 2-4 concrete use cases.
   - Assign related domains such as AI agents, developer tools, infrastructure, data engineering, security, frontend, mobile, databases, DevOps, productivity, education, or research.
   - If README or metadata is sparse, say the information is limited instead of over-inferring implementation details.

4. Write the blog overview:
   - Use `references/blog-overview-template.md` as the default article structure.
   - Start with an answer-first summary of the most important trends.
   - Include a ranked Top 10 table with star growth, language, and domain.
   - For each repository, use the required itemized project article framework below.
   - End with a short trend analysis and practical recommendations for developers or technical teams.

5. Generate an HTML promo poster or cover when requested:
   - Use `references/html-poster-template.md` as the default visual structure.
   - Summarize the blog into one striking headline, one short subtitle, 3-5 trend highlights, and 3-6 featured projects.
   - Produce a self-contained HTML document with inline CSS. Do not rely on remote fonts, images, scripts, or CDNs unless the user explicitly asks.
   - Prefer a premium technical style: strong typography, clear hierarchy, dark or editorial-grade background, restrained gradients, precise spacing, and high-contrast data badges.
   - Make the title visually dominant and benefit-driven, not generic. Example: "10 Open-Source Projects Developers Are Starring Today".
   - Support both poster and cover formats:
     - Poster: vertical 1200x1600 or 1080x1350 layout.
     - Cover/social preview: horizontal 1200x630 layout.
   - Include source, date, and "GitHub Trending" attribution in a subtle footer.

6. For daily automation:
   - Use `references/github-actions-daily.yml` as a starting point when the user wants scheduled generation.
   - Explain that Claude skills do not run by themselves; a scheduler such as GitHub Actions, cron, or another automation runner must invoke the script and writing workflow.

## Output Requirements

Produce a technical blog overview in Markdown unless another format is requested. Keep the writing concise, technical, and useful for developers evaluating which projects deserve attention.

Each repository section must use itemized bullets and include these article elements:

- Project link
- Star growth and baseline repository metrics
- Primary language, notable topics, and license when available
- "项目定位": what problem it solves and how to classify it
- "核心能力": 2-4 concrete capabilities
- "技术特点": implementation signals from README, language, architecture, framework, model, protocol, or integration points
- "使用场景": 2-4 practical scenarios
- "适合人群": developers, teams, or organizations most likely to benefit
- "相关领域": concise domain labels
- "为什么值得关注": the current trend signal in one concise sentence
- "评估建议": maturity, maintenance, security, ecosystem fit, or adoption caveats

When generating HTML poster or cover output, include:

- A complete single-file HTML document
- Inline CSS only
- Clear poster dimensions in a comment or wrapper class
- A visually dominant title
- Short subtitle summarizing the trend
- Trend highlight chips or cards
- Featured project cards with repo name, language/domain, and star-growth signal
- Subtle footer with source and generated date

## Script Usage

```bash
pwsh github-trending-skill/scripts/fetch_github_trending.ps1 -Since daily -Limit 10 -Output trending.json
```

Supported options:

- `-Since daily|weekly|monthly`
- `-Limit <number>`
- `-Language <github-language-slug>`
- `-SpokenLanguage <code>`
- `-Output <path>`
- `-NoReadme`

If no output path is provided, the script prints JSON to stdout.
