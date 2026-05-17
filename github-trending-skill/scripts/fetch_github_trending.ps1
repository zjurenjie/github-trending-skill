param(
  [ValidateSet("daily", "weekly", "monthly")]
  [string]$Since = "daily",

  [int]$Limit = 10,

  [string]$Language = "",

  [string]$SpokenLanguage = "",

  [string]$Output = "",

  [switch]$NoReadme
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertFrom-HtmlText {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }

  $withoutTags = $Value -replace "<[^>]*>", " "
  $decoded = [System.Net.WebUtility]::HtmlDecode($withoutTags)
  return (($decoded -replace "\s+", " ").Trim())
}

function ConvertTo-Number {
  param([string]$Value)

  if ($Value -match "([\d,]+)") {
    return [int]($Matches[1] -replace ",", "")
  }

  return $null
}

function Get-GitHubHeaders {
  $headers = @{
    "User-Agent" = "github-trending-skill"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
  }

  if ($env:GITHUB_TOKEN) {
    $headers["Authorization"] = "Bearer $env:GITHUB_TOKEN"
  }

  return $headers
}

function Get-ReadmeExcerpt {
  param(
    [string]$Owner,
    [string]$Name
  )

  $headers = Get-GitHubHeaders
  $headers["Accept"] = "application/vnd.github.raw"
  $url = "https://api.github.com/repos/$Owner/$Name/readme"

  try {
    $readme = (Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing).Content
    $clean = $readme
    $clean = $clean -replace '```[\s\S]*?```', ' '
    $clean = $clean -replace '`([^`]+)`', '$1'
    $clean = $clean -replace '!\[[^\]]*\]\([^)]+\)', ' '
    $clean = $clean -replace '\[([^\]]+)\]\([^)]+\)', '$1'
    $clean = $clean -replace '[#>*_\-|]+', ' '
    $clean = ($clean -replace '\s+', ' ').Trim()
    return $clean.Substring(0, [Math]::Min(1800, $clean.Length))
  } catch {
    return $null
  }
}

if ($Limit -lt 1) {
  throw "Limit must be a positive integer."
}

$languagePath = ""
if ($Language) {
  $languagePath = "/" + [System.Uri]::EscapeDataString($Language)
}

$query = "since=$Since"
if ($SpokenLanguage) {
  $query += "&spoken_language_code=$([System.Uri]::EscapeDataString($SpokenLanguage))"
}

$sourceUrl = "https://github.com/trending$languagePath`?$query"
$html = (Invoke-WebRequest -Uri $sourceUrl -Headers @{ "User-Agent" = "github-trending-skill" } -UseBasicParsing).Content
$articles = [regex]::Matches($html, "<article[\s\S]*?</article>")
$repositories = New-Object System.Collections.Generic.List[object]

$rank = 1
foreach ($articleMatch in $articles) {
  $article = $articleMatch.Value
  $repoMatch = [regex]::Match($article, '<h2[\s\S]*?<a[^>]+href="/([^"?#]+)"[\s\S]*?</a>[\s\S]*?</h2>')

  if (-not $repoMatch.Success) {
    continue
  }

  $fullName = ($repoMatch.Groups[1].Value -replace "\s+", "")
  $parts = $fullName.Split("/")

  if ($parts.Count -ne 2) {
    continue
  }

  $descriptionMatch = [regex]::Match($article, '<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)</p>')
  $languageMatch = [regex]::Match($article, 'itemprop="programmingLanguage"[^>]*>([^<]+)<')
  $starLinkMatch = [regex]::Match($article, 'href="/[^"]+/stargazers"[^>]*>([\s\S]*?)</a>')
  $forkLinkMatch = [regex]::Match($article, 'href="/[^"]+/network/members"[^>]*>([\s\S]*?)</a>')
  $growthMatch = [regex]::Match($article, '([\d,]+)\s+stars?\s+(today|this week|this month)', "IgnoreCase")

  $description = ""
  if ($descriptionMatch.Success) {
    $description = ConvertFrom-HtmlText $descriptionMatch.Groups[1].Value
  }

  $languageValue = $null
  if ($languageMatch.Success) {
    $languageValue = ConvertFrom-HtmlText $languageMatch.Groups[1].Value
  }

  $stars = $null
  if ($starLinkMatch.Success) {
    $stars = ConvertTo-Number (ConvertFrom-HtmlText $starLinkMatch.Groups[1].Value)
  }

  $forks = $null
  if ($forkLinkMatch.Success) {
    $forks = ConvertTo-Number (ConvertFrom-HtmlText $forkLinkMatch.Groups[1].Value)
  }

  $starsToday = $null
  if ($growthMatch.Success) {
    $starsToday = ConvertTo-Number $growthMatch.Groups[1].Value
  }

  $repositories.Add([pscustomobject]@{
    rank = $rank
    owner = $parts[0]
    name = $parts[1]
    fullName = $fullName
    url = "https://github.com/$fullName"
    description = $description
    language = $languageValue
    stars = $stars
    forks = $forks
    starsToday = $starsToday
    trendingPeriod = $Since
  })

  $rank += 1
}

$selected = $repositories |
  Sort-Object -Property @{ Expression = { if ($null -eq $_.starsToday) { -1 } else { $_.starsToday } }; Descending = $true } |
  Select-Object -First $Limit

$apiHeaders = Get-GitHubHeaders
$enriched = New-Object System.Collections.Generic.List[object]
$newRank = 1

foreach ($repo in $selected) {
  $metadata = $null
  $apiAvailable = $false
  $apiError = $null

  try {
    $metadata = Invoke-RestMethod -Uri "https://api.github.com/repos/$($repo.owner)/$($repo.name)" -Headers $apiHeaders
    $apiAvailable = $true
  } catch {
    $apiError = $_.Exception.Message
  }

  $topics = @()
  $homepage = $null
  $license = $null
  $openIssues = $null
  $defaultBranch = $null
  $createdAt = $null
  $updatedAt = $null
  $pushedAt = $null
  $description = $repo.description
  $stars = $repo.stars
  $forks = $repo.forks

  if ($metadata) {
    $description = $metadata.description
    $homepage = $metadata.homepage
    $topics = @($metadata.topics)
    if ($metadata.license) {
      $license = $metadata.license.spdx_id
    }
    $stars = $metadata.stargazers_count
    $forks = $metadata.forks_count
    $openIssues = $metadata.open_issues_count
    $defaultBranch = $metadata.default_branch
    $createdAt = $metadata.created_at
    $updatedAt = $metadata.updated_at
    $pushedAt = $metadata.pushed_at
  }

  $readmeExcerpt = $null
  if (-not $NoReadme) {
    $readmeExcerpt = Get-ReadmeExcerpt -Owner $repo.owner -Name $repo.name
  }

  $enriched.Add([pscustomobject]@{
    rank = $newRank
    owner = $repo.owner
    name = $repo.name
    fullName = $repo.fullName
    url = $repo.url
    description = $description
    language = $repo.language
    stars = $stars
    forks = $forks
    starsToday = $repo.starsToday
    trendingPeriod = $repo.trendingPeriod
    apiAvailable = $apiAvailable
    apiError = $apiError
    homepage = $homepage
    topics = $topics
    license = $license
    openIssues = $openIssues
    defaultBranch = $defaultBranch
    createdAt = $createdAt
    updatedAt = $updatedAt
    pushedAt = $pushedAt
    readmeExcerpt = $readmeExcerpt
  })

  $newRank += 1
}

$result = [pscustomobject]@{
  fetchedAt = (Get-Date).ToUniversalTime().ToString("o")
  sourceUrl = $sourceUrl
  since = $Since
  limit = $Limit
  count = $enriched.Count
  rankingBasis = "GitHub Trending star growth for the selected period"
  repositories = $enriched
}

$json = $result | ConvertTo-Json -Depth 10

if ($Output) {
  $parent = Split-Path -Parent $Output
  if ($parent) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }
  Set-Content -Path $Output -Value $json -Encoding UTF8
} else {
  Write-Output $json
}
