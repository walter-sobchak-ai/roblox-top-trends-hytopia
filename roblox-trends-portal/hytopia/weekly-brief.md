# Weekly Hytopia Build Brief (Roblox Top Trending)
**Date (source asOf):** 2026-02-16  
**Data:** https://www.roblox.com/charts/top-trending?age=all&country=all&device=computer  
**Constraint:** Mechanics-only; no Roblox IP/branding/assets.

## 1) Top patterns observed (from Top 25)
1) **Update framing / live-ops packaging** (reactivation + limited goals + visible changelog).
2) **Low-friction sessions** (clear CTA, minimal menus, short rounds).
3) **Persistent meta rewards** (tokens/cosmetics/collections; visible progress every few minutes).

## 2) Top 25 clustered into archetypes

### Live-Ops / Update Reactivation
- Count: **3**
- Ranks: #1, #16, #20

### Arena PvP / FPS
- Count: **1**
- Ranks: #5

### Creature/Avatar Sim & Survival
- Count: **1**
- Ranks: #3

### Progression Variety (meta-structure)
- Count: **20**
- Ranks: #2, #4, #6, #7, #8, #9, #10, #11, #12, #13, #14, #15, #17, #18, #19, #21, #22, #23, #24, #25

## 3) Ranked Hytopia-safe prototype ideas (mechanics-only)
### 1) **Rising Hazard Sprint (2-minute co-op escape)**
**Why:** Strong demand signal from multiple hazard/escape entries; fastest speed-to-fun; easy to iterate via new hazard schedules.
**Hook:** Survive 120 seconds of escalating hazards; instant requeue; tokens for cosmetics + weekly quests.

### 2) **Weekly Update Board + 3 Weekly Challenges (wrapper)**
**Why:** Live-ops packaging appears repeatedly and can lift retention across any prototype.
**Hook:** In-game changelog + 3 weekly quests + limited-time cosmetic/badge.

### 3) **Quick-Craft Vehicle Trial (build → run → vote)**
**Why:** Expressive building creates player-generated replay value and social sharing.
**Hook:** 30s build phase → 90s trial → vote/iterate loop.

### 4) **Precision Arena (short aim duels)**
**Why:** Clear skill loop + spectatorship; compulsion via “one more round”.
**Hook:** 45s rounds, first to 5, spectate + rematch.

### 5) **Social Venue + Minigame Rotator**
**Why:** Social hubs retain when paired with low-stakes activities and identity systems.
**Hook:** Hangout space + rotating microgames + cosmetics.

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
- `round:start`, `round:phase`, `player:eliminated`, `round:end`
- `rewards:grant`, `quest:progress`

## Data schemas (examples)
`HazardSchedule`:
```json
{ "version": 1, "roundDurationMs": 120000, "phases": [ {"tMs":0,"add":[{"type":"rising_fluid","params":{"startHeight":0,"riseRate":0.02}}]} ] }
```

`PlayerProfile`:
```json
{ "playerId":"string", "tokens":0, "cosmetics": {"owned":[],"equipped":{}}, "stats": {"plays":0,"bestSurvivalMs":0}, "weekly": {"weekKey":"YYYY-Www","quests":[]} }
```

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
