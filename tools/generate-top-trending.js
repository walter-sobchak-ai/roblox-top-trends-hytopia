import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const OUT_PATH = path.resolve('roblox-trends-portal/data.json');
const URL = 'https://www.roblox.com/charts/top-trending?age=all&country=all&device=computer';

function parseCompactNumber(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^([0-9]+(?:\.[0-9]+)?)([KMB])?$/i);
  if (!m) return s;
  const n = Number(m[1]);
  const unit = (m[2] || '').toUpperCase();
  const mult = unit === 'K' ? 1e3 : unit === 'M' ? 1e6 : unit === 'B' ? 1e9 : 1;
  return Math.round(n * mult);
}

function guessTags(name) {
  const n = name.toLowerCase();
  const tags = new Set();
  if (n.includes('escape')) tags.add('escape');
  if (n.includes('obby') || n.includes('obby')) tags.add('obby');
  if (n.includes('simulator')) tags.add('sim');
  if (n.includes('tycoon')) tags.add('tycoon');
  if (n.includes('tower')) tags.add('tower');
  if (n.includes('rng')) tags.add('rng');
  if (n.includes('pvp') || n.includes('fight') || n.includes('brawl')) tags.add('pvp');
  if (n.includes('rp')) tags.add('roleplay');
  if (n.includes('click')) tags.add('clicker');
  if (n.includes('brainrot')) tags.add('meme-keyword');
  if (n.includes('upd') || n.includes('update')) tags.add('update-spike');
  return [...tags];
}

function archetypeFromTags(tags) {
  if (tags.includes('update-spike')) return 'update spike / live-ops';
  if (tags.includes('obby') || tags.includes('escape')) return 'obby/escape (short runs)';
  if (tags.includes('tycoon')) return 'tycoon/progression';
  if (tags.includes('sim')) return 'simulator/grind';
  if (tags.includes('pvp')) return 'pvp/arena';
  if (tags.includes('roleplay')) return 'roleplay/social';
  if (tags.includes('clicker')) return 'clicker/idle-ish';
  return 'variety';
}

function defaultWhyTrending({ name, tags }) {
  const reasons = [];
  if (tags.includes('meme-keyword')) reasons.push('meme keywording + high shareability (titles/thumbnails built for clicks)');
  if (tags.includes('update-spike')) reasons.push('recent update tag drives reactivation + algo lift');
  if (tags.includes('obby') || tags.includes('escape')) reasons.push('low-friction premise; instant understanding; good for groups');
  if (tags.includes('tycoon') || tags.includes('sim')) reasons.push('compounding progression; satisfies “numbers go up”');
  if (tags.includes('pvp')) reasons.push('clipable moments + skill expression');
  if (reasons.length === 0) reasons.push('broad-appeal loop + favorable discovery placement');
  return reasons.join('; ') + '.';
}

function defaultLoop({ archetype }) {
  switch (archetype) {
    case 'obby/escape (short runs)':
      return 'Spawn → attempt a short run (60–180s) → fail/learn → requeue instantly; meta rewards (cosmetics/collection) keep it sticky.';
    case 'tycoon/progression':
      return 'Earn currency → buy upgrades → unlock new earners/areas → rebirth/prestige → repeat with faster growth.';
    case 'simulator/grind':
      return 'Perform simple action → earn resources → upgrade tools/pets → access new zones → repeat; periodic events reset goals.';
    case 'pvp/arena':
      return 'Pick kit/loadout → fight short matches → earn mastery/currency → unlock/optimize builds → return for updates.';
    case 'roleplay/social':
      return 'Join server → socialize/roleplay → customize identity/home → show off + social bonds → come back to maintain status.';
    case 'update spike / live-ops':
      return 'Log in for new content → chase limited items/quests → social comparison → repeat on weekly cadence.';
    default:
      return 'Do core activity → get reward → upgrade/unlock → repeat; sessions stay short and requeue friction is minimized.';
  }
}

function defaultHytopiaTakeaway({ archetype }) {
  switch (archetype) {
    case 'obby/escape (short runs)':
      return 'Build a 2-minute “hazard run” template: instant start, escalating hazards, party requeue, and weekly new hazard sets.';
    case 'tycoon/progression':
      return 'Build a tycoon skeleton: earnings tick + purchase pads + rebirth; emphasize readability and rapid early acceleration.';
    case 'simulator/grind':
      return 'Prototype a simulator loop: one core verb, upgrade cadence every 2–3 minutes, and zone-gated progression.';
    case 'pvp/arena':
      return 'Ship a modular ability/loadout system (8–12 abilities) with short rounds and clear combat feedback.';
    case 'roleplay/social':
      return 'Create a social hub with customization + light activities; prioritize emotes, status items, and friend/party flow.';
    case 'update spike / live-ops':
      return 'Operationalize weekly live-ops: 1 marquee update + 2 small content drops + in-game changelog + limited-time goals.';
    default:
      return 'Replicate the *structure*: fast onboarding, short sessions, persistent meta, and visible progression every few minutes.';
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });

  // Wait for tiles to appear; Roblox renders links to /games/... in a list.
  await page.waitForSelector('a[href*="/games/"]', { timeout: 45000 });

  const items = await page.evaluate(() => {
    // Collect unique game links in order.
    const anchors = Array.from(document.querySelectorAll('a[href*="/games/"]'));
    const seen = new Set();
    const out = [];

    for (const a of anchors) {
      const href = a.href;
      if (!href || seen.has(href)) continue;

      // Tile links tend to have an img alt and/or combined text like: "Name 87% 533.1K".
      const img = a.querySelector('img');
      const nameFromImg = img?.getAttribute('alt') || '';
      const text = (a.innerText || '').replace(/\s+/g, ' ').trim();
      const name = nameFromImg || text;

      // Heuristic: ignore nav/login links.
      if (!/roblox\.com\/games\//.test(href)) continue;
      if (!name || name.length < 2) continue;

      out.push({ url: href.split('?')[0], rawText: text, name });
      seen.add(href);
      if (out.length >= 40) break; // oversample then trim
    }
    return out;
  });

  await browser.close();

  // Normalize into top 25 with parsed rating + players when present.
  const normalized = [];
  for (const it of items) {
    // rawText often ends with "87% 533.1K"; name may repeat.
    const m = (it.rawText || '').match(/(\d{1,3})%\s+([0-9]+(?:\.[0-9]+)?[KMB]?)/i);
    const ratingPercent = m ? Number(m[1]) : null;
    const playersCompact = m ? m[2] : null;
    const players = playersCompact ? parseCompactNumber(playersCompact) : null;

    // Choose best name: if rawText contains the name twice, take first chunk before rating.
    let name = it.name;
    if (m && it.rawText) {
      name = it.rawText.slice(0, it.rawText.indexOf(m[0])).trim() || it.name;
    }

    const tags = guessTags(name);
    const hookArchetype = archetypeFromTags(tags);

    normalized.push({
      name,
      url: it.url,
      ratingPercent,
      players,
      playersDisplay: playersCompact,
      tags,
      hookArchetype,
      whyTrending: defaultWhyTrending({ name, tags }),
      loop: defaultLoop({ archetype: hookArchetype }),
      hytopiaTakeaway: defaultHytopiaTakeaway({ archetype: hookArchetype })
    });

    if (normalized.length >= 25) break;
  }

  const now = new Date();
  const asOf = now.toISOString().slice(0, 10);

  const payload = {
    asOf,
    chart: 'Top Trending',
    sourceUrl: URL,
    items: normalized.map((x, i) => ({
      rank: i + 1,
      name: x.name,
      url: x.url,
      ratingPercent: x.ratingPercent,
      players: x.playersDisplay || x.players,
      hookArchetype: x.hookArchetype,
      tags: x.tags,
      whyTrending: x.whyTrending,
      loop: x.loop,
      hytopiaTakeaway: x.hytopiaTakeaway
    }))
  };

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${payload.items.length} items → ${OUT_PATH}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
