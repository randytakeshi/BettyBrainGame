# 🧠 Betty Brain

Daily brain-training games built for Betty — 92 years old, sharp as a tack, with impaired vision. Inspired by Lumosity's daily-workout format.

## How it's built for Betty

- **Warm light theme** — cream background reduces glare; no light-on-dark halation.
- **Atkinson Hyperlegible** typeface, designed by the Braille Institute for low-vision readers.
- **Huge type and targets** — ~24px+ base font, 72px+ touch targets everywhere.
- **Lumosity structure** — every game: how-to-play screen → fixed set of rounds → big ✓/✗ feedback that reveals the right answer → results with stars, points, and accuracy.
- **No sudden death, no color-only cues** — partial credit everywhere; anything she must tell apart differs by shape, not just color.
- **Gentle pacing** — slow-moving targets, generous timers, an optional Speed Bonus she can turn off entirely.

## The daily workout

Five games a day (customizable in Settings & Routine): Word Bubbles (language), Star Search (attention), Trouble Brewing (working memory), Tidal Treasures (memory), Color Match (flexibility). **Motion Mode** swaps each for an animated Lumosity-style variant. A perfect game levels that exercise up for next time (5 levels).

Plus 20+ bonus practice games: trivia, Wordle, word search, Simon, blackjack, bingo, and more.

## Development

```bash
npm install
npm run dev        # local dev server on port 6173
npm run build      # production build to dist/
npm run deploy     # publish to GitHub Pages
```

React 19 + Vite. All progress is stored in `localStorage` — no accounts, no server.
