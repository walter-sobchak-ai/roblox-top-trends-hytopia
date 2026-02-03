# Roblox Top Trends → Hytopia Takeaways

A weekly, shareable portal that pulls **Roblox Charts → Top Trending (Top 25)** and turns it into a lightweight analysis for **transferable** game design patterns you can replicate in Hytopia (mechanics + systems, not IP).

## What it produces
- `roblox-trends-portal/data.json` — auto-generated weekly
- `roblox-trends-portal/index.html` — static portal that renders `data.json`

## Local dev

Install deps:
```bash
npm install
npx playwright install --with-deps chromium
```

Generate data:
```bash
npm run generate
```

Serve the portal:
```bash
npm run serve
# open http://localhost:8787
```

## GitHub Pages
This repo includes a GitHub Action that:
1) Runs the generator weekly (and on manual dispatch)
2) Publishes the portal to GitHub Pages

