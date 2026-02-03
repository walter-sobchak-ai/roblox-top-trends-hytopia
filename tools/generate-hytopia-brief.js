import fs from 'node:fs/promises';
import path from 'node:path';

const IN_PATH = path.resolve('roblox-trends-portal/data.json');
const OUT_DIR = path.resolve('roblox-trends-portal/hytopia');
const OUT_MD = path.join(OUT_DIR, 'weekly-brief.md');

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function cluster(items) {
  // Use hookArchetype + title signals to cluster into stable buckets.
  const buckets = {
    'Micro-Run Hazard Escapes': [],
    'Live-Ops / Update Reactivation': [],
    'Arena PvP / FPS': [],
    'Expressive Build / Physics Craft': [],
    'Creature/Avatar Sim & Survival': [],
    'Social Hub / Roleplay Venue': [],
    'Progression Variety (meta-structure)': []
  };

  for (const it of items) {
    const name = (it.name || '').toLowerCase();
    const tags = (it.tags || []).map(t => String(t).toLowerCase());
    const arch = String(it.hookArchetype || '').toLowerCase();

    const isEscape = arch.includes('escape') || tags.includes('escape') || name.includes('escape') || name.includes('obby') || name.includes('tower');
    const isUpdate = arch.includes('live-ops') || tags.includes('update-spike') || name.includes('upd') || name.includes('update');
    const isPvp = tags.includes('pvp') || name.includes('fps') || name.includes('one tap') || name.includes('sniper') || arch.includes('pvp');
    const isBuild = name.includes('draw') || name.includes('raft') || name.includes('blocks') || arch.includes('building') || arch.includes('craft');
    const isCreature = name.includes('creature') || name.includes('dino') || name.includes('kaiju') || name.includes('survive');
    const isRoleplay = tags.includes('roleplay') || name.includes('rp') || arch.includes('roleplay');

    if (isUpdate) buckets['Live-Ops / Update Reactivation'].push(it);
    else if (isEscape) buckets['Micro-Run Hazard Escapes'].push(it);
    else if (isPvp) buckets['Arena PvP / FPS'].push(it);
    else if (isBuild) buckets['Expressive Build / Physics Craft'].push(it);
    else if (isCreature) buckets['Creature/Avatar Sim & Survival'].push(it);
    else if (isRoleplay) buckets['Social Hub / Roleplay Venue'].push(it);
    else buckets['Progression Variety (meta-structure)'].push(it);
  }

  // Drop empty buckets for presentation.
  return Object.entries(buckets).filter(([, v]) => v.length > 0);
}

function topPatterns(clusters) {
  const present = new Set(clusters.map(([k]) => k));
  const patterns = [];
  if (present.has('Micro-Run Hazard Escapes')) patterns.push('**2–3 minute hazard/escape loops** (instant start, fast retry, party-friendly requeue).');
  if (present.has('Live-Ops / Update Reactivation')) patterns.push('**Update framing / live-ops packaging** (reactivation + limited goals + visible changelog).');
  patterns.push('**Low-friction sessions** (clear CTA, minimal menus, short rounds).');
  patterns.push('**Persistent meta rewards** (tokens/cosmetics/collections; visible progress every few minutes).');
  if (present.has('Expressive Build / Physics Craft')) patterns.push('**Expressive creation hooks** (build quickly → test immediately → iterate/share).');
  if (present.has('Social Hub / Roleplay Venue')) patterns.push('**Light social hubs + identity** (cosmetics/status items paired with small activities).');
  return patterns;
}

function prototypes() {
  return [
    {
      rank: 1,
      name: 'Rising Hazard Sprint (2-minute co-op escape)',
      why: 'Strong demand signal from multiple hazard/escape entries; fastest speed-to-fun; easy to iterate via new hazard schedules.',
      hook: 'Survive 120 seconds of escalating hazards; instant requeue; tokens for cosmetics + weekly quests.'
    },
    {
      rank: 2,
      name: 'Weekly Update Board + 3 Weekly Challenges (wrapper)',
      why: 'Live-ops packaging appears repeatedly and can lift retention across any prototype.',
      hook: 'In-game changelog + 3 weekly quests + limited-time cosmetic/badge.'
    },
    {
      rank: 3,
      name: 'Quick-Craft Vehicle Trial (build → run → vote)',
      why: 'Expressive building creates player-generated replay value and social sharing.',
      hook: '30s build phase → 90s trial → vote/iterate loop.'
    },
    {
      rank: 4,
      name: 'Precision Arena (short aim duels)',
      why: 'Clear skill loop + spectatorship; compulsion via “one more round”.',
      hook: '45s rounds, first to 5, spectate + rematch.'
    },
    {
      rank: 5,
      name: 'Social Venue + Minigame Rotator',
      why: 'Social hubs retain when paired with low-stakes activities and identity systems.',
      hook: 'Hangout space + rotating microgames + cosmetics.'
    }
  ];
}

function specRisingHazardSprint() {
  return `# 4) Detailed Hytopia Build Spec (Prototype #1): Rising Hazard Sprint

## Elevator pitch
A **server-based 2-minute survival sprint**: players spawn on a simple course while hazards escalate (rising fluid, sweeping walls, falling tiles). You die → **instant requeue** (or spectate) → earn **tokens** for cosmetics and weekly challenges.

## Game loop
1) **Matchmaking/Lobby (10–20s)**
2) **Run (120s)**: hazards escalate every 15–20s
3) **End screen (10s)**: rewards, quick “Play Again”
4) Meta: tokens → cosmetics; weekly quests; personal best time/score

## Core systems
### A) Match & Round System
- States: \`LOBBY\` → \`COUNTDOWN\` → \`RUNNING\` → \`RESULTS\`
- Autostart when \`minPlayers\` met; otherwise idle loop
- Late join: enters as spectator until next round

### B) Hazard Director (Escalation)
- Timeline-driven hazard schedule (data-driven JSON)
- Deterministic seed per round for fairness + debuggability
- Difficulty ramps by:
  - increasing hazard speed
  - adding hazard types
  - shortening safe windows

### C) Rewards + Meta
- Rewards per round: participation + survival milestones + streak bonus
- Weekly quests (3): survive X seconds, play N rounds, finish once
- Cosmetics: trails/nameplates (simple, visible)

### D) Death / Spectate / Requeue
- On death: spectator cam follows living players
- Requeue button always available; no long walkbacks

## Entities & events (server authoritative)
**Entities:** GameController, HazardDirector, HazardInstance, PlayerAvatar, SpectatorAnchor

**Events:**
- \`round:start\`, \`round:phase\`, \`player:eliminated\`, \`round:end\`
- \`rewards:grant\`, \`quest:progress\`

## Data schemas (examples)
\`HazardSchedule\`:
\`\`\`json
{ "version": 1, "roundDurationMs": 120000, "phases": [ {"tMs":0,"add":[{"type":"rising_fluid","params":{"startHeight":0,"riseRate":0.02}}]} ] }
\`\`\`

\`PlayerProfile\`:
\`\`\`json
{ "playerId":"string", "tokens":0, "cosmetics": {"owned":[],"equipped":{}}, "stats": {"plays":0,"bestSurvivalMs":0}, "weekly": {"weekKey":"YYYY-Www","quests":[]} }
\`\`\`

## UI (minimal but sticky)
- Lobby: big **Play** CTA; weekly quests panel; “New this week” changelog
- In-run HUD: timer bar, hazard level, requeue
- Results: survival time + tokens; **Play Again** default-focused; quest progress ticks

## MVP scope (1–2 days)
**Day 1:** round system + one map + 3 hazards + death/spectate + basic tokens

**Day 2:** weekly quests + cosmetics + results screen + dev tuning for hazard schedule

## Acceptance criteria
1) Time-to-fun ≤ 10s (active server)
2) 120s rounds transition reliably
3) Hazards server authoritative; no desync kills
4) Death → spectate + requeue; no softlocks
5) Tokens + bestSurvivalMs persist
6) Weekly quests progress + display
7) End → next round ≤ 15s avg
`;
}

async function run() {
  const raw = await fs.readFile(IN_PATH, 'utf8');
  const data = JSON.parse(raw);
  const asOf = data.asOf || new Date().toISOString().slice(0, 10);
  const items = Array.isArray(data.items) ? data.items : [];
  const clusters = cluster(items);

  const lines = [];
  lines.push('# Weekly Hytopia Build Brief (Roblox Top Trending)');
  lines.push(`**Date (source asOf):** ${asOf}  `);
  lines.push(`**Data:** ${data.sourceUrl || 'https://www.roblox.com/charts'}  `);
  lines.push('**Constraint:** Mechanics-only; no Roblox IP/branding/assets.');
  lines.push('');

  lines.push('## 1) Top patterns observed (from Top 25)');
  topPatterns(clusters).forEach((p, i) => lines.push(`${i + 1}) ${p}`));
  lines.push('');

  lines.push('## 2) Top 25 clustered into archetypes');
  lines.push('');
  for (const [name, group] of clusters) {
    const ranks = group.map(g => `#${g.rank}`).join(', ');
    lines.push(`### ${name}`);
    lines.push(`- Count: **${group.length}**`);
    lines.push(`- Ranks: ${ranks}`);
    lines.push('');
  }

  lines.push('## 3) Ranked Hytopia-safe prototype ideas (mechanics-only)');
  for (const p of prototypes()) {
    lines.push(`### ${p.rank}) **${p.name}**`);
    lines.push(`**Why:** ${p.why}`);
    lines.push(`**Hook:** ${p.hook}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(specRisingHazardSprint());

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_MD, lines.join('\n'));
  console.log(`Wrote ${OUT_MD}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
