#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const DEFAULT_LIMIT = 10;
const VALID_SINCE = new Set(["daily", "weekly", "monthly"]);

function parseArgs(argv) {
  const args = {
    since: "daily",
    limit: DEFAULT_LIMIT,
    language: "",
    spokenLanguage: "",
    output: "",
    includeReadme: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === "--since") {
      args.since = next;
      i += 1;
    } else if (arg === "--limit") {
      args.limit = Number.parseInt(next, 10);
      i += 1;
    } else if (arg === "--language") {
      args.language = next;
      i += 1;
    } else if (arg === "--spoken-language") {
      args.spokenLanguage = next;
      i += 1;
    } else if (arg === "--output") {
      args.output = next;
      i += 1;
    } else if (arg === "--no-readme") {
      args.includeReadme = false;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!VALID_SINCE.has(args.since)) {
    throw new Error("--since must be one of: daily, weekly, monthly");
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) {
    throw new Error("--limit must be a positive integer");
  }

  return args;
}

function printHelp() {
  console.log(`Fetch GitHub Trending repositories and enrich metadata.

Usage:
  node scripts/fetch_github_trending.mjs [options]

Options:
  --since daily|weekly|monthly     Trending period, default: daily
  --limit <number>                 Number of repositories, default: 10
  --language <slug>                GitHub language slug, e.g. python
  --spoken-language <code>         Spoken language code filter
  --output <path>                  Write JSON to file instead of stdout
  --no-readme                      Skip README excerpt fetching
`);
}

function buildTrendingUrl(args) {
  const languagePath = args.language ? `/${encodeURIComponent(args.language)}` : "";
  const url = new URL(`https://github.com/trending${languagePath}`);
  url.searchParams.set("since", args.since);

  if (args.spokenLanguage) {
    url.searchParams.set("spoken_language_code", args.spokenLanguage);
  }

  return url.toString();
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": "github-trending-skill",
      Accept: "text/html,application/json,text/plain",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} ${response.statusText}: ${url}`);
  }

  return response.text();
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };

  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }

    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }

    return named[entity] ?? match;
  });
}

function numberFromText(value) {
  const match = value.match(/[\d,]+/);
  return match ? Number.parseInt(match[0].replace(/,/g, ""), 10) : null;
}

function parseTrendingHtml(html, since) {
  const articles = html.match(/<article[\s\S]*?<\/article>/g) ?? [];

  return articles.map((article, index) => {
    const repoMatch = article.match(/<h2[\s\S]*?<a[^>]+href="\/([^"?#]+)"[\s\S]*?<\/a>[\s\S]*?<\/h2>/);
    const fullName = repoMatch ? stripTags(repoMatch[1]).replace(/\s+/g, "") : "";
    const [owner, name] = fullName.split("/");

    const descriptionMatch = article.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const languageMatch = article.match(/itemprop="programmingLanguage"[^>]*>([^<]+)</);
    const starLinkMatch = article.match(/href="\/[^"]+\/stargazers"[^>]*>([\s\S]*?)<\/a>/);
    const forkLinkMatch = article.match(/href="\/[^"]+\/network\/members"[^>]*>([\s\S]*?)<\/a>/);
    const growthMatch = article.match(/([\d,]+)\s+stars?\s+(today|this week|this month)/i);

    return {
      rank: index + 1,
      owner,
      name,
      fullName,
      url: fullName ? `https://github.com/${fullName}` : "",
      description: descriptionMatch ? stripTags(descriptionMatch[1]) : "",
      language: languageMatch ? stripTags(languageMatch[1]) : null,
      stars: starLinkMatch ? numberFromText(stripTags(starLinkMatch[1])) : null,
      forks: forkLinkMatch ? numberFromText(stripTags(forkLinkMatch[1])) : null,
      starsToday: growthMatch ? numberFromText(growthMatch[1]) : null,
      trendingPeriod: since,
    };
  }).filter((repo) => repo.fullName && repo.owner && repo.name);
}

function githubHeaders() {
  const headers = {
    "User-Agent": "github-trending-skill",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchRepoMetadata(repo) {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}`;
  const response = await fetch(url, { headers: githubHeaders() });

  if (!response.ok) {
    return {
      apiAvailable: false,
      apiError: `${response.status} ${response.statusText}`,
    };
  }

  const data = await response.json();

  return {
    apiAvailable: true,
    description: data.description ?? repo.description,
    homepage: data.homepage || null,
    topics: Array.isArray(data.topics) ? data.topics : [],
    license: data.license?.spdx_id ?? null,
    stars: data.stargazers_count ?? repo.stars,
    forks: data.forks_count ?? repo.forks,
    openIssues: data.open_issues_count ?? null,
    defaultBranch: data.default_branch ?? null,
    createdAt: data.created_at ?? null,
    updatedAt: data.updated_at ?? null,
    pushedAt: data.pushed_at ?? null,
  };
}

async function fetchReadmeExcerpt(repo) {
  const url = `https://api.github.com/repos/${repo.owner}/${repo.name}/readme`;
  const response = await fetch(url, {
    headers: {
      ...githubHeaders(),
      Accept: "application/vnd.github.raw",
    },
  });

  if (!response.ok) {
    return null;
  }

  const readme = await response.text();
  return readme
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_\-|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1800);
}

async function enrichRepositories(repositories, includeReadme) {
  const enriched = [];

  for (const repo of repositories) {
    const metadata = await fetchRepoMetadata(repo);
    const readmeExcerpt = includeReadme ? await fetchReadmeExcerpt(repo) : null;

    enriched.push({
      ...repo,
      ...metadata,
      description: metadata.description ?? repo.description,
      readmeExcerpt,
    });
  }

  return enriched;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceUrl = buildTrendingUrl(args);
  const html = await fetchText(sourceUrl);
  const repositories = parseTrendingHtml(html, args.since)
    .sort((a, b) => (b.starsToday ?? -1) - (a.starsToday ?? -1))
    .slice(0, args.limit)
    .map((repo, index) => ({ ...repo, rank: index + 1 }));

  const enriched = await enrichRepositories(repositories, args.includeReadme);
  const result = {
    fetchedAt: new Date().toISOString(),
    sourceUrl,
    since: args.since,
    limit: args.limit,
    count: enriched.length,
    rankingBasis: "GitHub Trending star growth for the selected period",
    repositories: enriched,
  };

  const json = `${JSON.stringify(result, null, 2)}\n`;

  if (args.output) {
    await mkdir(dirname(args.output), { recursive: true });
    await writeFile(args.output, json, "utf8");
  } else {
    process.stdout.write(json);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
