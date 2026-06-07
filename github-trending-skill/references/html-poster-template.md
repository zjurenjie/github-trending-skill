# HTML Promo Poster and Cover Template

Use this when the user asks to turn a GitHub Trending blog or summary into an HTML poster, cover, social preview, or promotional visual.

## Content Extraction

Condense the blog into:

- Headline: one benefit-driven, visually striking title
- Subtitle: one sentence explaining the trend
- Metadata: date, period, source, ranking basis
- Trend highlights: 3-5 concise chips or cards
- Featured projects: 3-6 repositories with name, language/domain, and star-growth signal
- Footer: subtle source attribution and caveat

## Format Choices

- Poster: use a vertical canvas such as `1200x1600` or `1080x1350`
- Cover/social preview: use a horizontal canvas such as `1200x630`
- Output a complete standalone HTML document with inline CSS
- Avoid external fonts, images, scripts, and CDNs unless explicitly requested
- Keep text readable when exported as a screenshot

## Visual Direction

Create a premium technical editorial look:

- Large, high-impact headline
- Strong hierarchy and generous whitespace
- Dark, deep-neutral, or high-end editorial background
- Restrained gradients, soft glows, thin borders, and data badges
- Project cards that feel curated, not crowded
- Avoid generic centered purple-gradient layouts

## HTML Skeleton

Replace bracketed placeholders with blog-specific content.

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>[Headline]</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #070a12;
      --panel: rgba(255, 255, 255, 0.08);
      --panel-strong: rgba(255, 255, 255, 0.14);
      --text: #f5f7fb;
      --muted: #aab4c4;
      --line: rgba(255, 255, 255, 0.16);
      --accent: #7dd3fc;
      --accent-2: #c4b5fd;
      --gold: #f8d58a;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #02040a;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
    }

    .poster {
      width: 1200px;
      min-height: 1600px;
      position: relative;
      overflow: hidden;
      padding: 72px;
      background:
        radial-gradient(circle at 18% 14%, rgba(125, 211, 252, 0.30), transparent 28%),
        radial-gradient(circle at 82% 8%, rgba(196, 181, 253, 0.26), transparent 30%),
        linear-gradient(145deg, #080b14 0%, #0f172a 48%, #050713 100%);
    }

    .poster::before {
      content: "";
      position: absolute;
      inset: 28px;
      border: 1px solid var(--line);
      pointer-events: none;
    }

    .content {
      position: relative;
      z-index: 1;
      display: flex;
      min-height: 1450px;
      flex-direction: column;
      gap: 44px;
    }

    .eyebrow {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      color: var(--muted);
      font-size: 22px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      max-width: 940px;
      font-size: 104px;
      line-height: 0.96;
      letter-spacing: -0.07em;
    }

    .subtitle {
      max-width: 880px;
      margin: 0;
      color: #d9e2f2;
      font-size: 34px;
      line-height: 1.35;
    }

    .highlights {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }

    .highlight,
    .project {
      border: 1px solid var(--line);
      background: var(--panel);
      backdrop-filter: blur(22px);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
    }

    .highlight {
      min-height: 150px;
      padding: 24px;
    }

    .highlight strong {
      display: block;
      margin-bottom: 14px;
      color: var(--gold);
      font-size: 34px;
    }

    .highlight span {
      color: var(--muted);
      font-size: 20px;
      line-height: 1.35;
    }

    .projects {
      display: grid;
      gap: 18px;
    }

    .project {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 22px;
      align-items: center;
      padding: 28px 32px;
    }

    .project h2 {
      margin: 0 0 10px;
      font-size: 34px;
      letter-spacing: -0.03em;
    }

    .project p {
      margin: 0;
      color: var(--muted);
      font-size: 21px;
      line-height: 1.35;
    }

    .badge {
      border: 1px solid rgba(125, 211, 252, 0.45);
      padding: 12px 16px;
      color: var(--accent);
      font-size: 20px;
      white-space: nowrap;
      background: rgba(125, 211, 252, 0.08);
    }

    .footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-top: 1px solid var(--line);
      padding-top: 26px;
      color: var(--muted);
      font-size: 19px;
    }
  </style>
</head>
<body>
  <!-- Poster format: 1200x1600. For cover format, change .poster width to 1200px and min-height to 630px. -->
  <main class="poster">
    <section class="content">
      <div class="eyebrow">
        <span>GitHub Trending</span>
        <span>[Generated date]</span>
      </div>

      <h1>[Compelling headline]</h1>
      <p class="subtitle">[One-sentence trend summary]</p>

      <section class="highlights" aria-label="Trend highlights">
        <div class="highlight"><strong>[Metric]</strong><span>[Trend highlight]</span></div>
        <div class="highlight"><strong>[Domain]</strong><span>[Trend highlight]</span></div>
        <div class="highlight"><strong>[Signal]</strong><span>[Trend highlight]</span></div>
      </section>

      <section class="projects" aria-label="Featured repositories">
        <article class="project">
          <div>
            <h2>[owner/repo]</h2>
            <p>[Short project positioning]</p>
          </div>
          <div class="badge">+[stars today] stars</div>
        </article>
      </section>

      <footer class="footer">
        <span>Source: github.com/trending</span>
        <span>Popularity signal, not production-readiness proof</span>
      </footer>
    </section>
  </main>
</body>
</html>
```
