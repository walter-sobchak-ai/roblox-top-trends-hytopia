# Weekly Hytopia Build Brief (Roblox Top Trending)
**Date (source asOf):** 2026-02-03  
**Data:** https://walter-sobchak-ai.github.io/roblox-top-trends-hytopia/data.json  
**Constraint:** Mechanics-only; no Roblox IP/branding/assets.

## 1) Top patterns observed (from Top 25)
1) **2–3 minute “hazard run / escape” loops**
   - Instant premise, instant start, fast failure/retry, party-friendly requeue.
2) **Live-ops / update-spike packaging**
   - “Update” framing drives reactivation; players return for limited goals + visible changelog.
3) **Low-friction session design**
   - Quick onboarding, clear next action, minimal menus, short rounds.
4) **Persistent meta progression**
   - Cosmetics/collections/unlocks granted every few minutes; visible progress bars.
5) **Shareable titles + meme keywording** (mechanic takeaway: *clarity + novelty*)
   - The *mechanical* lesson is not the meme itself, but: “one-sentence premise” + spectacle.
6) **Light social hubs & identity customization**
   - Roleplay spaces work when paired with small activities and status items.
7) **Creator/expressive interaction hooks**
   - “Draw/build something quickly, then immediately test it” is a strong loop.

## 2) Top 25 clustered into 6 archetypes
> Note: Some entries are “variety” in the dataset; clustering below uses the title signals + the dataset’s hookArchetype/tags.

### A) Micro-Run Hazard Escapes (short obby/escape)
**Core:** 60–180s runs, escalating hazards, fast reset, group play.
- #1 Escape Tsunami…
- #6 Escape Waves…
- #20 Escape Police…
- #23 +1 Speed Keyboard Escape…

### B) Update Spikes / Live-Ops Reactivation
**Core:** update framing, limited goals, reactivation, weekly cadence.
- #4 [UPD] Forsaken
- #5 [UPD] Break a Lucky Block
- #9 [UPD] Prison Life
- #10 [UPDATE] Jump Showdown
- #23 [UPD2] +1 Speed Keyboard Escape (also in A)

### C) Tight Arena PvP (FPS/1-tap/sniper)
**Core:** ultra-clear combat loop, short matches, weapon mastery.
- #17 [FPS] One Tap
- #22 [FPS] Sniper Arena

### D) Creature/Avatar Simulation & Survival
**Core:** be a creature, survive, grow, unlock, social comparison.
- #14 Creature survival/collection sim
- #19 Dinosaur simulation

### E) Expressive Building / Physics Crafting
**Core:** create quickly → test immediately → iterate → share.
- #11 Draw a Raft & Set Sail
- #24 Infinite Blocks: Alpha

### F) Social Hub / Roleplay Venue
**Core:** hangout + customization + light activities.
- #16 My Waterpark

### (Cross-genre “Progression Variety” bucket)
A large portion of the list is best explained by the **meta-structure** (short sessions + frequent rewards) rather than one genre:
- #2, #3, #7, #8, #12, #13, #15, #18, #21, #25

## 3) Ranked Hytopia-safe prototype ideas (mechanics-only)
### 1) **Rising Hazard Sprint (2-minute co-op escape)**
**Why:** #1/#6/#20/#23 indicate strong demand; easiest to ship in 1–2 days.
**Hook:** “Survive 120 seconds of escalating hazards; one more try is instant.”

### 2) **Update-Board + Weekly Challenges wrapper for any mode**
**Why:** live-ops packaging repeatedly appears; can lift retention across prototypes.
**Hook:** in-game changelog, 3 weekly quests, limited-time badge/cosmetic.

### 3) **Quick-Craft Vehicle Trial (draw/build → race through gates)**
**Why:** expressive crafting is sticky; creates player-generated replay value.
**Hook:** 30s build phase → 90s trial run → vote/iterate.

### 4) **Precision Arena (fast aim duels, round-based)**
**Why:** simple to understand; skill loop; spectate adds social glue.
**Hook:** 45s rounds, “first to 5 points,” anti-camp design.

### 5) **Social Venue + Minigame Rotator**
**Why:** roleplay hubs retain when paired with small activities.
**Hook:** hangout space + 2 rotating microgames + cosmetics shop.

---

# 4) Detailed Hytopia Build Spec (Prototype #1): Rising Hazard Sprint
## Elevator pitch
A **server-based 2-minute survival sprint**: players spawn on a simple course while hazards escalate (rising fluid, sweeping walls, falling tiles). You die → **instant requeue** (or spectate) → earn **tokens** for cosmetics and weekly challenges.

## Game loop
1) **Matchmaking/Lobby (10–20s)**
2) **Run (120s)**: hazards escalate every 15–20s
3) **End screen (10s)**: rewards, quick “Play Again”
4) Meta: tokens → cosmetics; weekly quests; personal best time/score

## Core systems
### A) Match & Round System
- States: `LOBBY` → `COUNTDOWN` → `RUNNING` → `RESULTS`
- Autostart when `minPlayers` met; otherwise idle loop
- Late join: enters as spectator until next round

### B) Hazard Director (Escalation)
- Timeline-driven hazard schedule (data-driven JSON)
- Difficulty ramps by:
  - increasing hazard speed
  - adding hazard types
  - shortening safe windows
- Deterministic seed per round for fairness + debuggability

### C) Player Progression & Rewards
- Rewards per round:
  - `tokens` for participation
  - bonus tokens for finish / survival time milestones
  - streak bonus for consecutive plays
- Weekly quests (3) reset on a cadence

### D) Respawn / Spectate / Requeue
- On death: ragdoll/KO → spectator cam follows living players
- “Requeue” button always available; no long walkbacks

### E) Anti-stall / Flow
- No long lobby browsing
- Always-visible “Next round in X”
- One-click “Play Again”

## Entities & Components (suggested)
### Entities
- `GameController`
- `HazardDirector`
- `HazardInstance` (many)
- `Checkpoint` (optional MVP skip)
- `PlayerAvatar`
- `SpectatorCameraAnchor`
- `RewardChest` (end-of-round popup trigger)

### Components (examples)
- `RoundStateComponent { state, timeRemaining, seed }`
- `HazardComponent { type, phaseStart, phaseEnd, params }`
- `DamageOnTouchComponent { damage, knockback, cooldownMs }`
- `MovingPlatformComponent { pathId, speed, easing }`
- `RisingFluidComponent { height, riseRate }`
- `PlayerStatsComponent { alive, deathsThisRound, survivalMs }`

## Events (server authoritative)
- `round:start { seed, durationMs }`
- `round:phase { phaseIndex, hazardAdds[] }`
- `player:eliminated { playerId, reason, tMs }`
- `round:end { results[] }`
- `rewards:grant { playerId, tokens, xp, reasons[] }`
- `quest:progress { playerId, questId, delta }`

## Data schemas (JSON examples)
### 1) Hazard schedule
```json
{
  "version": 1,
  "roundDurationMs": 120000,
  "phases": [
    { "tMs": 0, "add": [{"type":"rising_fluid","params":{"startHeight":0,"riseRate":0.02}}] },
    { "tMs": 20000, "add": [{"type":"sweeper","params":{"speed":1.2,"radius":8}}] },
    { "tMs": 45000, "add": [{"type":"falling_tiles","params":{"intervalMs":900,"tileCount":12}}] },
    { "tMs": 75000, "add": [{"type":"wind_gust","params":{"strength":0.8,"periodMs":6000}}] }
  ]
}
```

### 2) Player profile (persistent)
```json
{
  "playerId": "string",
  "tokens": 0,
  "cosmetics": { "owned": ["trail_01"], "equipped": {"trail":"trail_01"} },
  "stats": { "plays": 0, "wins": 0, "bestSurvivalMs": 0 },
  "weekly": { "weekKey": "2026-W06", "quests": [{"id":"q1","progress":0,"goal":10}] }
}
```

### 3) Round results
```json
{
  "seed": 12345,
  "placements": [
    {"playerId":"p1","survivalMs":120000,"aliveAtEnd":true,"tokensEarned":30},
    {"playerId":"p2","survivalMs":84500,"aliveAtEnd":false,"tokensEarned":18}
  ]
}
```

## UI (minimal but sticky)
### Lobby
- Big CTA: **Play**
- Small panel: Weekly quests (3), “New this week” (changelog)

### In-run HUD
- Timer bar (120s)
- Phase indicator (“Hazard Level 3/6”)
- Buttons: Spectate (if dead), Requeue

### Results
- Survival time, tokens earned
- “Play Again” (default focused)
- Progress ticks for quests + cosmetics teaser

## MVP scope (1–2 days)
**Day 1 (core playable):**
- Round state machine + autostart
- One simple map
- HazardDirector with 3 hazards (rising fluid + sweeper + falling tiles)
- Death handling + spectator + instant requeue
- Basic reward tokens (in-memory or simple persistence)

**Day 2 (retention polish):**
- 3 weekly quests (survive X seconds, play N rounds, finish once)
- Simple cosmetics: trails or nameplates purchasable with tokens
- End screen + “Play Again” flow
- Admin/dev panel to tweak hazard schedule JSON

## Acceptance criteria
1) **Time-to-fun ≤ 10 seconds** from join to first movement in a round (on an active server).
2) Rounds last **120s** and transition reliably through all states.
3) Hazards spawn on schedule and are **server authoritative** (no desync kills).
4) Death triggers spectator + requeue; no softlocks.
5) Rewards grant and persist at least `tokens` + `bestSurvivalMs`.
6) Weekly quests progress and display in UI.
7) Average replay loop (end → next round) **≤ 15 seconds**.
