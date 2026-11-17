import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const USERNAME = process.env.GITHUB_REPOSITORY_OWNER || 'KazeDevID';
const TOKEN = process.env.GITHUB_TOKEN || '';

const headers = {
  'User-Agent': `${USERNAME}-Profile-Sync/1.0`,
  Accept: 'application/vnd.github+json',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function ghFetch(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status} on ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function escXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatWitaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date) + ' WITA';
}

function relativeTime(iso) {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

const LANG_COLORS = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Rust: '#DEA584',
  Kotlin: '#A97BFF',
  Python: '#3572A5',
  HTML: '#E34C26',
  CSS: '#563D7C',
  PHP: '#4F5D95',
  Go: '#00ADD8',
  Shell: '#89E051',
};

function buildHeroSvg({ user, totalStars, topLang }) {
  const displayName = user.name?.trim() || user.login;
  const org = user.company?.trim() || '@X-SyntaxError';
  const followers = user.followers ?? 0;
  const repos = user.public_repos ?? 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="230" viewBox="0 0 960 230" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="960" y2="230" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B0F17" />
      <stop offset="60%" stop-color="#111827" />
      <stop offset="100%" stop-color="#0D1320" />
    </linearGradient>
    <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="55%" stop-color="#60A5FA" />
      <stop offset="100%" stop-color="#38BDF8" stop-opacity="0" />
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1E293B" stroke-width="0.7" stroke-opacity="0.55" />
    </pattern>
  </defs>

  <rect width="960" height="230" rx="14" fill="url(#bgGrad)" />
  <rect width="960" height="230" rx="14" fill="url(#grid)" />
  <rect x="0.5" y="0.5" width="959" height="229" rx="13.5" stroke="#1E293B" />
  <rect x="40" y="34" width="220" height="2.5" rx="1.25" fill="url(#accentLine)" />

  <text x="40" y="72" fill="#94A3B8" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif" font-size="13" font-weight="600" letter-spacing="1.4">
    GITHUB DEVELOPER PROFILE · ${escXml(org.toUpperCase())}
  </text>

  <text x="40" y="118" fill="#F8FAFC" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif" font-size="38" font-weight="800" letter-spacing="-0.8">
    ${escXml(user.login)}
    <tspan fill="#64748B" font-size="22" font-weight="600"> / ${escXml(displayName)}</tspan>
  </text>

  <text x="40" y="152" fill="#CBD5E1" font-family="'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif" font-size="16" font-weight="400">
    Full-Stack Engineer · Protocol &amp; Automation Architect · Indonesia
  </text>

  <text x="40" y="192" fill="#94A3B8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="13">
    <tspan fill="#38BDF8" font-weight="600">${repos}</tspan> Public Repos
    <tspan fill="#475569">  ·  </tspan>
    <tspan fill="#38BDF8" font-weight="600">${followers}</tspan> Followers
    <tspan fill="#475569">  ·  </tspan>
    <tspan fill="#38BDF8" font-weight="600">${totalStars}</tspan> Stars
    <tspan fill="#475569">  ·  </tspan>
    Primary: <tspan fill="#E2E8F0" font-weight="600">${escXml(topLang)}</tspan>
  </text>

  <g transform="translate(700, 44)">
    <rect width="220" height="142" rx="10" fill="#0B111D" stroke="#1E293B" />
    <text x="18" y="30" fill="#64748B" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="600">
      LIVE PROFILE STATUS
    </text>
    <line x1="18" y1="42" x2="202" y2="42" stroke="#1E293B" />
    <text x="18" y="68" fill="#94A3B8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12">
      Handle: <tspan fill="#F1F5F9">@${escXml(user.login)}</tspan>
    </text>
    <text x="18" y="92" fill="#94A3B8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12">
      Focus:  <tspan fill="#38BDF8">Bot &amp; Systems</tspan>
    </text>
    <text x="18" y="116" fill="#94A3B8" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12">
      Since:  <tspan fill="#F1F5F9">${new Date(user.created_at).getUTCFullYear()}</tspan>
    </text>
  </g>
</svg>`;
}

function buildTelemetrySvg({ user, totalStars, totalForks, langStats, syncedAt }) {
  const barWidth = 880;
  let cursorX = 40;
  const barSegments = langStats.map((item) => {
    const w = Math.max(4, Math.round((item.pct / 100) * barWidth));
    const seg = `<rect x="${cursorX}" y="138" width="${w}" height="10" fill="${item.color}" />`;
    cursorX += w;
    return seg;
  }).join('\n    ');

  const legendItems = langStats.slice(0, 6).map((item, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 40 + col * 295;
    const y = 176 + row * 28;
    return `<g transform="translate(${x}, ${y})">
      <rect x="0" y="-9" width="10" height="10" rx="2" fill="${item.color}" />
      <text x="18" y="0" fill="#E2E8F0" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600">${escXml(item.lang)}</text>
      <text x="115" y="0" fill="#94A3B8" font-family="ui-monospace, Menlo, monospace" font-size="12">${item.pct.toFixed(1)}% (${item.count} repos)</text>
    </g>`;
  }).join('\n    ');

  const accountYears = Math.max(1, new Date().getUTCFullYear() - new Date(user.created_at).getUTCFullYear());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="245" viewBox="0 0 960 245" fill="none">
  <defs>
    <clipPath id="barClip">
      <rect x="40" y="138" width="880" height="10" rx="5" />
    </clipPath>
  </defs>
  <rect width="960" height="245" rx="14" fill="#0D1117" />
  <rect x="0.5" y="0.5" width="959" height="244" rx="13.5" stroke="#1E293B" />

  <text x="40" y="34" fill="#F8FAFC" font-family="'Segoe UI', -apple-system, sans-serif" font-size="15" font-weight="700">
    Realtime GitHub Telemetry
  </text>
  <text x="920" y="34" text-anchor="end" fill="#64748B" font-family="ui-monospace, Menlo, monospace" font-size="11.5">
    Synced ${escXml(syncedAt)}
  </text>
  <line x1="40" y1="48" x2="920" y2="48" stroke="#1E293B" />

  <g transform="translate(40, 74)">
    <text x="0" y="0" fill="#64748B" font-family="'Segoe UI', sans-serif" font-size="11.5" font-weight="600">PUBLIC REPOS</text>
    <text x="0" y="28" fill="#F8FAFC" font-family="ui-monospace, Menlo, monospace" font-size="24" font-weight="700">${user.public_repos}</text>

    <text x="180" y="0" fill="#64748B" font-family="'Segoe UI', sans-serif" font-size="11.5" font-weight="600">FOLLOWERS</text>
    <text x="180" y="28" fill="#38BDF8" font-family="ui-monospace, Menlo, monospace" font-size="24" font-weight="700">${user.followers}</text>

    <text x="360" y="0" fill="#64748B" font-family="'Segoe UI', sans-serif" font-size="11.5" font-weight="600">TOTAL STARS</text>
    <text x="360" y="28" fill="#F8FAFC" font-family="ui-monospace, Menlo, monospace" font-size="24" font-weight="700">${totalStars}</text>

    <text x="540" y="0" fill="#64748B" font-family="'Segoe UI', sans-serif" font-size="11.5" font-weight="600">FORKS EARNED</text>
    <text x="540" y="28" fill="#F8FAFC" font-family="ui-monospace, Menlo, monospace" font-size="24" font-weight="700">${totalForks}</text>

    <text x="720" y="0" fill="#64748B" font-family="'Segoe UI', sans-serif" font-size="11.5" font-weight="600">TENURE</text>
    <text x="720" y="28" fill="#F8FAFC" font-family="ui-monospace, Menlo, monospace" font-size="24" font-weight="700">${accountYears}+ yrs</text>
  </g>

  <text x="40" y="126" fill="#94A3B8" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600">
    Language Footprint (Active Original Repositories)
  </text>
  <rect x="40" y="138" width="880" height="10" rx="5" fill="#1E293B" />
  <g clip-path="url(#barClip)">
    ${barSegments}
  </g>

  ${legendItems}
</svg>`;
}

function replaceBlock(content, name, replacement) {
  const start = `<!-- REALTIME:${name}:START -->`;
  const end = `<!-- REALTIME:${name}:END -->`;
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`, 'm');
  if (!regex.test(content)) return content;
  return content.replace(regex, `${start}\n${replacement}\n${end}`);
}

async function main() {
  const [user, repos, events] = await Promise.all([
    ghFetch(`https://api.github.com/users/${USERNAME}`),
    ghFetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=100`),
    ghFetch(`https://api.github.com/users/${USERNAME}/events/public?per_page=30`).catch(() => []),
  ]);

  const ownRepos = repos.filter((r) => !r.fork && r.name.toLowerCase() !== USERNAME.toLowerCase());
  const totalStars = repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((acc, r) => acc + (r.forks_count || 0), 0);

  const langCounts = {};
  for (const r of ownRepos) {
    if (!r.language) continue;
    langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  }
  const totalLangRepos = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
  const langStats = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => ({
      lang,
      count,
      pct: (count / totalLangRepos) * 100,
      color: LANG_COLORS[lang] || '#64748B',
    }));

  const topLang = langStats[0]?.lang || 'TypeScript';
  const syncedAt = formatWitaDate(new Date());

  fs.mkdirSync('assets', { recursive: true });
  fs.writeFileSync('assets/hero-banner.svg', buildHeroSvg({ user, totalStars, topLang }));
  fs.writeFileSync('assets/live-telemetry.svg', buildTelemetrySvg({ user, totalStars, totalForks, langStats, syncedAt }));

  const recentRepos = ownRepos
    .sort((a, b) => new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at))
    .slice(0, 6);

  const reposTable = [
    '| Repository | Description | Language | Stars | Updated |',
    '| :--- | :--- | :--- | :---: | :---: |',
    ...recentRepos.map((r) => {
      const rawDesc = (r.description || 'Active engineering repository').replace(/\|/g, '\\|');
      const desc = rawDesc.length > 82 ? rawDesc.slice(0, 79) + '...' : rawDesc;
      const lang = r.language || 'Markdown';
      const updated = relativeTime(r.pushed_at || r.updated_at);
      return `| [**${r.name}**](${r.html_url}) | ${desc} | \`${lang}\` | ${r.stargazers_count} | ${updated} |`;
    }),
  ].join('\n');

  const activityLines = [];
  const seen = new Set();
  for (const ev of events) {
    const key = `${ev.type}:${ev.repo?.name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const repoName = ev.repo?.name || `${USERNAME}/repo`;
    const repoUrl = `https://github.com/${repoName}`;
    const when = relativeTime(ev.created_at);

    if (ev.type === 'PushEvent') {
      const commits = ev.payload?.commits?.length || 1;
      activityLines.push(`- Pushed ${commits} commit${commits > 1 ? 's' : ''} to [**${repoName}**](${repoUrl}) · *${when}*`);
    } else if (ev.type === 'CreateEvent') {
      const refType = ev.payload?.ref_type || 'repository';
      activityLines.push(`- Created ${refType} in [**${repoName}**](${repoUrl}) · *${when}*`);
    } else if (ev.type === 'PublicEvent') {
      activityLines.push(`- Open-sourced [**${repoName}**](${repoUrl}) · *${when}*`);
    } else if (ev.type === 'ReleaseEvent') {
      activityLines.push(`- Published release in [**${repoName}**](${repoUrl}) · *${when}*`);
    } else if (ev.type === 'WatchEvent') {
      activityLines.push(`- Starred [**${repoName}**](${repoUrl}) · *${when}*`);
    }
    if (activityLines.length >= 5) break;
  }
  const activityMd = activityLines.length
    ? activityLines.join('\n')
    : `- Actively shipping code across ${user.public_repos} public repositories · *${syncedAt}*`;

  const readmePath = path.resolve('README.md');
  if (fs.existsSync(readmePath)) {
    let readme = fs.readFileSync(readmePath, 'utf8');
    readme = replaceBlock(readme, 'REPOS', reposTable);
    readme = replaceBlock(readme, 'ACTIVITY', activityMd);
    readme = replaceBlock(readme, 'SYNC', `Last realtime sync: **${syncedAt}** · Automated via GitHub Actions`);
    fs.writeFileSync(readmePath, readme);
  }

  console.log(`Synced profile for ${USERNAME}: ${user.public_repos} repos, ${user.followers} followers, ${totalStars} stars.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
