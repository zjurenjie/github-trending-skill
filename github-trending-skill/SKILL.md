---
name: github-trending-skill
description: Fetches GitHub Trending daily, identifies the top 10 repositories with the fastest current star growth, and turns them into a technical blog overview covering what each project is, use cases, and related domains. This skill should be used when asked for GitHub trending reports, fastest-growing open-source projects, daily developer trend summaries, or a scheduled technical blog overview from https://github.com/trending.
---

# GitHub Trending Skill

## Purpose

Generate a daily technical overview of GitHub Trending projects by collecting the current fastest-growing repositories, enriching each entry with repository metadata, and summarizing what each project does, where it is useful, and which technical domains it belongs to.

## When to Use

Use this skill for requests such as:

- "获取今天 GitHub Trending star 增长最快的 Top 10"
- "每天总结 GitHub Trending 项目并输出技术博客"
- "写一篇 GitHub Trending overview"
- "分析当前增长最快的开源项目"
- "给我生成 GitHub Trending 每日技术简报"

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
   - Identify 2-4 concrete use cases for each project.
   - Assign related domains such as AI agents, developer tools, infrastructure, data engineering, security, frontend, mobile, databases, DevOps, productivity, education, or research.

4. Write the blog overview:
   - Use `references/blog-overview-template.md` as the default article structure.
   - Start with an answer-first summary of the most important trends.
   - Include a ranked Top 10 table with star growth, language, and domain.
   - For each repository, include: what it is, use cases, related domains, and why it is trending now.
   - End with a short trend analysis and practical recommendations for developers or technical teams.

5. For daily automation:
   - Use `references/github-actions-daily.yml` as a starting point when the user wants scheduled generation.
   - Explain that Claude skills do not run by themselves; a scheduler such as GitHub Actions, cron, or another automation runner must invoke the script and writing workflow.

## Output Requirements

Produce a technical blog overview in Markdown unless another format is requested. Keep the writing concise, technical, and useful for developers evaluating which projects deserve attention.

Each repository section must include:

- Project link
- Current star growth metric
- Primary language and notable topics when available
- "是什么" summary
- "使用场景" bullets
- "相关领域" labels
- A short "为什么值得关注" sentence

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
