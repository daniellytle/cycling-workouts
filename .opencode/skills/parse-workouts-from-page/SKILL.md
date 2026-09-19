---
name: parse-workouts-from-page
description: Use when the user wants to parse/add workouts described in a webpage, blog article, or URL (e.g. "add the workouts from this page", "scope adding the workouts from <url>"). Extracts rider, tags, and interval structure and produces .zwo files plus manifest.json entries following this repo's schema.
---

# Parse Workouts From a Page

Turn a webpage (blog post, article, interview) that describes pro cyclists'
training sessions into structured workout entries in this repo. Each workout
becomes a `.zwo` file in `workouts/` plus a `manifest.json` entry.

## Repo schema (source of truth)

- `workouts/<name>.zwo` — defines the workout intervals (Zwift XML).
- `workouts/manifest.json` — maps each zwo filename to curated metadata:
  ```json
  {
    "TheGanna.zwo": { "rider": "Filippo Ganna", "tags": ["time-trial", "VO2"] }
  }
  ```
- `src/types.tsx` — `ZwiftWorkout`: `name`, `description`, `source`, `rider`,
  `tags: string[]`, `intervals`, `category`, `rawXML`, `duration`.
- `src/zwo.ts` — parser. Powers are **% of FTP as decimals** (it multiplies by
  100): `Power="0.9"` → 90% FTP.
- `src/aggregator.mjs` — reads `workouts/*.zwo` + `manifest.json`, writes
  `src/dist/workouts.json`.

## Workflow

1. **Fetch the page** (WebFetch, markdown format). Read the whole thing before
   extracting — sessions are often spread across sections.
2. **Identify the rider(s)**. Articles usually focus on one rider (or a few).
   `rider` is required for every workout.
3. **Identify each distinct workout session** and its key stats: interval
   count, duration, power (watts), cadence, and rest. Keep a 1:1 mapping of
   "session described" → "one `.zwo` file".
4. **Determine FTP and convert watts → %FTP.** Articles give absolute watts
   (e.g. 500W) and often state or imply FTP (e.g. "approximately FTP",
   "~90% of FTP", "65% of FTP"). Compute `%FTP = watts / FTP`. Use ONE
   consistent FTP value per rider across all their workouts. If FTP isn't
   stated, infer it from a session that gives both watts and a %FTP reference,
   and note the assumption.
5. **Assign tags** (free-form; any number). Suggested vocabulary:
   - Specialty: `climbing`, `time-trial`, `sprint`, `classics`, `all-rounder`
   - Type: `VO2`, `Tempo`, `Endurance`, `Sweet Spot`, `Threshold`, `Recovery`,
     `Strength`, `Race Prep`, `Lactate Clearance`
   - Other: `base`, `low-cadence`, `torque`, `over-under`
   Tags merge into `workout.tags` (deduped with any `.zwo` `<tags>`).
6. **Write the `.zwo` file** (see format below), then **add the `manifest.json`
   entry** keyed by the exact filename.
7. **Rebuild + verify**:
   ```bash
   node src/aggregator.mjs
   npx tsc --noEmit
   ```
   The aggregator reads only `*.zwo` (manifest.json is ignored as a workout).

## Naming conventions

Apply these to the `.zwo` filename, the `<name>` field, and the `rider`
metadata:

- **Capitalize** proper nouns and title words. Rider names and workout titles
  start with uppercase (e.g. `Van der Poel Full Gas`, `Van Vleuten VO2max`,
  `Roglic Under-Over`).
- **ASCII only.** Strip/transliterate diacritics and other non-alphabet
  characters: `Primož Roglič` → `Primoz Roglic`, `č/š/ž/é/ø` → `c/s/z/e/o`.
  No `é`, `ö`, `ü`, etc. anywhere in names or filenames.
- **Hyphens instead of slashes** in titles: `Under/Over` → `Under-Over`.
- Filenames use PascalCase with no spaces: `VanDerPoelFullGas.zwo`,
  `RoglicUnderOver.zwo`.

## .zwo format

Standard structure (see `src/zwo.ts` for what the parser reads):

```xml
<workout_file>
  <name> Workout Name</name>
  <description>What this session trains, in the rider's own context.</description>
  <author>https://source-article.url</author>
  <sportType>bike</sportType>
  <tags>
    <tag name="easy"></tag>
  </tags>
  <workout>
    <Warmup Duration="300" PowerLow="0.55" PowerHigh="0.75" />
    <SteadyState Duration="300" Power="0.75" />
    <IntervalsT Repeat="4" OnDuration="240" OffDuration="120" OnPower="1.1" OffPower="0.5"/>
    <Cooldown Duration="300" PowerLow="0.65" PowerHigh="0.5" />
  </workout>
</workout_file>
```

Block types and how the parser reads them:

- `<SteadyState Duration="…" Power="0.x" />` — constant %FTP.
- `<IntervalsT Repeat="N" OnDuration="s" OffDuration="s" OnPower="0.x" OffPower="0.y"/>` — N repeats of on/off. `OnPower`/`OffPower` are %FTP decimals.
- `<Warmup ...>` / `<Cooldown ...>` use `PowerLow`/`PowerHigh` (ramp start→end).
- `<Ramp ...>` also uses `PowerLow`/`PowerHigh`.
- Over/unders, ladders, etc. are expressed as a sequence of `SteadyState` and
  `IntervalsT` blocks in order.

Notes:

- `Duration` is in **seconds**.
- `Power` (and `OnPower`/`OffPower`) is **% FTP as a decimal**: 90% FTP = `0.9`,
  120% = `1.2`, 45% = `0.45`.
- The `source` link goes in the `<author>` tag (this repo's convention).
- Cadence (e.g. 40rpm low-cadence work) can be recorded with the `Cadence`
  attribute on a block, but the current parser does **not** read it — put the
  cadence info in the `<description>` so it isn't lost.

## Decisions / gaps to flag

- **Rest/recovery durations** are often omitted in articles. Pick a sensible
  default (e.g. full recovery for VO2/anaerobic, ~2-3 min for threshold) and
  say so rather than guessing silently.
- **Inconsistent numbers**: article watts and stated %FTP sometimes don't line
  up. Reconcile against the chosen FTP and note any fudge.
- If a session doesn't fit the tag vocabulary, just add a clear descriptive tag
  (tags are free-form now) — don't force it into a mismatched category.

## Scope vs. add

"Scope adding …" means present the extracted sessions as a plan (rider, tags,
structure, %FTP, gaps) and wait for confirmation before writing files.
"Add/parse …" means go ahead and write the `.zwo` files, update
`manifest.json`, rebuild, and typecheck.
