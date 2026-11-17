# Fit Track

A local-only PWA that helps an older adult follow a weekly food plan and a
simple exercise routine by ticking things off. Built from
*Fit Track – Project Plan.pdf* (in this folder) — see that document for the
full design rationale.

Everything lives in the phone's browser storage (IndexedDB). No server, no
account, no tracking. After the first load it works offline.

## Run it

```bash
npm install
npm run dev        # develop at http://localhost:5173
npm run build      # static files in dist/ — deploy to any static host
npm run preview    # serve the production build locally
```

Deploy `dist/` to GitHub Pages / Netlify / Cloudflare Pages (HTTPS is required
for the service worker). On an iPhone, open the link in Safari and follow the
in-app **Add to Home Screen** guide — the app asks for this first because
Safari and Home Screen apps have separate storage.

## What's inside

- **Today** — tick off today's planned meals, quick-add unplanned food,
  see the routine's progress ring, optional water glasses, gentle
  celebration when the whole day is done.
- **Exercise** — a Hevy-style routines home: Quick start, routine cards
  with Start buttons, and a routine player with thumbnail rows. Tick each
  move or "I did it all". Every exercise has a full-screen how-to page
  (tap the row, or press-and-hold) with an illustration or photo, numbered
  steps, a "Stay safe" note and **Read it to me** (offline speech
  synthesis). **Add exercise** opens a searchable library of 1,324
  exercises (search + body-part filters) built from the
  [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset)
  (data MIT; exercise images © Gym visual — gymvisual.com, hotlinked at
  180×180 with attribution per the dataset's media terms).
- **Food** — the week plan, Mon–Sun. Presets are read-only; **Copy & edit**
  clones one into "my plan" where meals can be added/removed per day.
- **Progress** — bars per day for meals, tick dots for exercise days,
  a streak nudge, optional weekly nutrition totals, and **backup**
  (export/import a single JSON file via the share sheet or download).
- **Settings** — name, text size (scales the whole UI), nutrition and
  water toggles, backup, plain-language privacy note.

### Tux, Paw Points and the golden theme

- The app is themed **golden & white** (tokens in `src/styles/tokens.css`).
- **Tux** is the mascot: a cartoon tuxedo cat (SVG, `src/components/TuxCat.svelte`)
  modelled on the owner's cat. He appears in onboarding, the Today header,
  the day-complete celebration and his own screen, **Tux's corner**.
- **Tux is alive**: he blinks, and his mood follows the day's progress —
  neutral to start, a soft smile at half done, beaming when everything is
  ticked. Pat him in Tux's corner and he gets sassy, licks whichever paw
  is nearer to where you touched, wipes that exact spot clean, and
  finishes with a little sparkle.
- **Paw Points**: ticking meals (+5), exercises (+10), quick-added food (+3)
  and water (+1) earns points, with a +15 bonus on days with both a meal and
  an exercise. Points are *derived from the logs*, so Undo takes them back
  automatically. Spend them in Tux's wardrobe on outfits (scarf, top hat,
  monocle, chef hat, golden crown).
- **Tap (or press-and-hold) any meal on Today** to see its ingredients with
  grams, calories and protein per item.
- **Protein goal**: a progress bar on Today fills as meals are ticked;
  reaching the daily goal earns +20 Paw Points. The goal (20–200 g, in 5 g
  steps) is adjusted at the bottom of the Food tab.
- **Weight**: a simple once-a-day weight entry on Today (stored as logs, so
  it's in backups and undoable).
- **Share my day** (in Settings): renders a square picture of the day —
  Tux in his current outfit, meals/exercise/water/protein/weight and the
  day's Paw Points — and opens the share sheet (downloads as a fallback).

### Extras beyond the plan's MVP

- Illustrated two-pose SVG animations for every built-in exercise
  (the plan's "Illustrated SVG" media option) — tiny, offline, and they
  freeze under Reduce Motion.
- Water tracking (8 big glasses, one tap each; can be turned off).
- Streak counter and day-complete celebration, worded gently.
- Time-of-day greeting with the user's name.

### Tech

Vite + Svelte 4, Dexie (IndexedDB), vite-plugin-pwa (offline + install),
Atkinson Hyperlegible bundled via Fontsource. Design tokens from the plan
live in `src/styles/tokens.css`; the text-size setting scales everything
through one `--scale` CSS variable.

### Honest caveats

- The preset meals, calorie shortcut values and exercises are **sample
  content** — the plan calls for a dietitian / physio to review them before
  real use.
- Reminders/notifications are intentionally left out (later feature in the
  plan; iOS 16.4+ only).
- No sync between devices: the backup file is the only way to move data.
