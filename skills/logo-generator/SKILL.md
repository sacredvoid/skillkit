---
name: logo-generator
description: "Generate custom logos with adaptive brainstorming and full brand kit export. Scans project context (README, package.json, CSS, existing assets) to inform design. Outputs favicons (16-512 + ICO), social images (OG, Twitter), dark/light/mono SVG variants, and an HTML preview."
argument-hint: "[brand description or style hints]"
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion, TaskCreate, TaskUpdate
---

# Logo Generator

Generate custom SVG logos through adaptive brainstorming, then export a full brand asset kit.

<HARD-GATE>
You MUST complete the Context Scan and Brainstorm phases before generating any SVG code. Do NOT skip straight to logo creation even if the user provides detailed descriptions upfront — always validate understanding first.
</HARD-GATE>

## First-Run Setup

Check if sharp is installed in the skill's scripts directory:

```bash
[ -d ~/.claude/skills/logo-generator/scripts/node_modules/sharp ] || (cd ~/.claude/skills/logo-generator/scripts && npm install)
```

Run this silently at the start of every invocation. If it fails, warn the user and continue — the script has a macOS `qlmanage`+`sips` fallback.

## Phase 1: Context Scan

Automatically scan the current working directory for branding signals. Do NOT ask the user for any of this — just read it.

### What to scan

| Source | What to extract |
|--------|----------------|
| `package.json` / `Cargo.toml` / `pyproject.toml` | Project name, description, keywords |
| `README.md` / `README` | Project name, tagline, description |
| `CLAUDE.md` | Project conventions, tech stack |
| `tailwind.config.*` / `theme.config.*` | Brand colors, font choices |
| `*.css` (first 3 files) | CSS custom properties with color values |
| `public/` / `assets/` / `static/` | Existing logos, favicons, brand images |
| `.svg` / `.png` files in root | Existing logo files |
| `manifest.json` / `site.webmanifest` | App name, theme color |

### How to scan

```bash
# Quick scan — run these and read results
ls package.json README.md CLAUDE.md tailwind.config.* manifest.json site.webmanifest 2>/dev/null
```

Use Glob for: `**/*.svg`, `**/favicon*`, `**/logo*`
Use Grep for: `--theme-color`, `--primary`, `--brand`, `color:` in CSS files

### Build a context summary

After scanning, build an internal summary:

```
CONTEXT:
  name: [found or "unknown"]
  description: [found or "none"]
  colors_found: [list of hex codes with where they came from]
  existing_logos: [paths to any existing logo/favicon files]
  tech_stack: [detected from config files]
  has_branding: [yes/partial/no]
```

## Phase 2: Adaptive Brainstorm

Adjust depth based on context richness and any arguments (`$ARGUMENTS`) provided.

### Rich context (name + colors + description all found)

Skip most questions. Present what you found:

> "I scanned your project and found: **[name]**, described as *[description]*. I see brand colors **[colors]** in your [source]. You already have [existing assets].
>
> Based on this, here are 3 logo concepts..."

Jump directly to Phase 3 (Concept Proposals) unless the user provided `--refresh` or `--rebrand` in arguments, in which case ask what they want to change.

### Moderate context (name found, missing colors or description)

Ask 2-3 targeted questions to fill gaps. Use AskUserQuestion with options:

**Question 1** (if no colors found):
```
What color palette fits your brand?
  A) Professional blues/grays — trust, reliability
  B) Bold warm tones (red, orange, gold) — energy, action
  C) Nature greens/earth tones — growth, sustainability
  D) Purple/violet — creativity, premium
  E) Monochrome — minimal, modern
  F) I have specific colors in mind → [ask for hex codes]
```

**Question 2** (if no description/personality found):
```
What personality should the logo convey?
  A) Technical/developer-focused — clean, precise
  B) Playful/friendly — approachable, fun
  C) Premium/luxury — refined, elegant
  D) Bold/disruptive — strong, attention-grabbing
  E) Organic/natural — flowing, warm
```

### Bare context (no name, no colors, no description)

Full guided session. Ask these one at a time:

1. **Brand name** — "What's the name for this logo?"
2. **What it does** — "In one sentence, what does [name] do?"
3. **Logo type preference**:
   ```
   What type of logo?
     A) Icon/symbol only — a standalone mark (like Apple, Nike)
     B) Lettermark — stylized initials (like IBM, HBO)
     C) Wordmark — the full name styled (like Google, Coca-Cola)
     D) Combination — icon + text together (like Slack, Spotify)
     E) Surprise me — pick what fits best
   ```
4. **Personality** (same as moderate Q2 above)
5. **Color palette** (same as moderate Q1 above)
6. **Any specific imagery?** — "Any symbols, shapes, or imagery you associate with [name]? (or 'none, surprise me')"

### Argument hints

If `$ARGUMENTS` contains descriptive text (not flags), treat it as style/brand hints that can skip some questions. For example:
- `/logo-generator modern fintech app called PayFlow` → name=PayFlow, personality=technical/premium, skip those questions
- `/logo-generator --refresh` → scan existing logo, propose updates
- `/logo-generator` → full scan + adaptive questions

## Phase 3: Concept Proposals

Present **2-3 distinct logo concepts** as text descriptions. Each concept should include:

```
### Concept [N]: [Name]

**Style:** [geometric / organic / typographic / abstract / etc.]
**Composition:** [what shapes/elements, how they're arranged]
**Colors:** [specific hex codes and where each is used]
**Rationale:** [why this works for the brand]
**Scalability note:** [how it holds up at 16x16]
```

Ask the user to pick one, mix elements, or request new directions.

## Phase 4: SVG Generation

Once a concept is approved, generate production SVGs.

### SVG Guidelines — CRITICAL

**Scalability rules (the logo MUST work at 16x16):**
- Keep shapes simple — avoid thin lines, tiny details, complex gradients
- Use a square-friendly composition (will be cropped to square for favicons)
- Minimum stroke width: 2px at native viewBox scale
- Test mentally: "Would this be recognizable as a 16px blob?"

**Technical rules:**
- ViewBox: `0 0 512 512` (square, high-res base)
- NO external fonts — convert all text to `<path>` elements, or use only basic geometric letterforms built from `<rect>`, `<circle>`, `<polygon>`, `<path>` primitives
- NO `<image>` or `<use>` elements referencing external files
- NO filters that degrade at small sizes (`<feGaussianBlur>`, `<feDropShadow>`)
- Use `<defs>` for reusable gradients/patterns
- All colors as hex values, never `currentColor` or CSS variables
- Clean, indented, human-readable SVG code

**Generate 3 variants:**

1. **`logo.svg`** — Primary logo, intended for light backgrounds
2. **`logo-dark.svg`** — Optimized for dark backgrounds (not just inverted — thoughtfully adjusted)
3. **`logo-mono.svg`** — Single color (#000000), suitable for watermarks/stamps

Write all three SVGs to a temp location first (e.g., `/tmp/logo-gen/`).

## Phase 5: Preview

Generate a preview using staged generation with task tracking so the user sees progress.

### Staged preview generation

Use `--stage` to run the script in batches and `TaskCreate`/`TaskUpdate` to show progress:

```
1. TaskCreate "Copy SVG variants"       (activeForm: "Copying SVG variants")
2. TaskCreate "Generate favicon PNGs"   (activeForm: "Generating favicons")
3. TaskCreate "Generate preview HTML"   (activeForm: "Generating preview page")
```

Then for each task, set `in_progress`, run the stage, set `completed`:

```bash
# Stage 1: SVGs
node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --svg-dark /tmp/logo-gen/logo-dark.svg \
  --svg-mono /tmp/logo-gen/logo-mono.svg \
  --output /tmp/logo-gen/preview \
  --stage svgs \
  --brand-name "[name]" \
  --primary-color "[hex]" \
  --bg-color "[hex]"

# Stage 2: Favicons
node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --output /tmp/logo-gen/preview \
  --stage favicons

# Stage 3: Preview HTML (needs meta stage too)
node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --svg-dark /tmp/logo-gen/logo-dark.svg \
  --svg-mono /tmp/logo-gen/logo-mono.svg \
  --output /tmp/logo-gen/preview \
  --stage meta \
  --brand-name "[name]" \
  --primary-color "[hex]"

node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --svg-dark /tmp/logo-gen/logo-dark.svg \
  --svg-mono /tmp/logo-gen/logo-mono.svg \
  --output /tmp/logo-gen/preview \
  --stage preview \
  --brand-name "[name]" \
  --primary-color "[hex]" \
  --bg-color "[hex]"
```

Tell the user:
> "Preview generated. Open `/tmp/logo-gen/preview/logo-preview.html` in your browser to see all variants and sizes. Let me know if you'd like any changes, or say **'export'** to generate the full asset kit."

### Iteration loop

If the user requests changes:
- Regenerate the affected SVG variant(s)
- Re-run only the relevant stages (svgs + preview)
- Repeat until approved

## Phase 6: Export

Once approved, run the full export using staged generation with task tracking.

### Target directory detection

Determine output path in this order:
1. If `./public/` exists → use `./public/`
2. If `./assets/` exists → use `./assets/brand/`
3. If `./static/` exists → use `./static/`
4. Otherwise → create `./public/`

### Staged export with task tracking

Create tasks upfront so the user sees the full plan, then execute each stage:

```
TaskCreate "Copy SVG variants to [target]"       (activeForm: "Copying SVG variants")
TaskCreate "Generate favicon PNGs + ICO"          (activeForm: "Generating favicons")
TaskCreate "Generate social images (OG + Twitter)" (activeForm: "Generating social images")
TaskCreate "Generate PWA manifest"                 (activeForm: "Generating manifest")
TaskCreate "Generate preview HTML"                 (activeForm: "Generating preview page")
```

Run each stage, updating tasks as you go:

```bash
# Stage: svgs
node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --svg-dark /tmp/logo-gen/logo-dark.svg \
  --svg-mono /tmp/logo-gen/logo-mono.svg \
  --output "[target_dir]" \
  --stage svgs \
  --brand-name "[name]" --primary-color "[hex]" --bg-color "[hex]"

# Stage: favicons
node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --output "[target_dir]" \
  --stage favicons

# Stage: social
node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --output "[target_dir]" \
  --stage social \
  --bg-color "[hex]"

# Stage: meta
node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --output "[target_dir]" \
  --stage meta \
  --brand-name "[name]" --primary-color "[hex]"

# Stage: preview
node ~/.claude/skills/logo-generator/scripts/generate-assets.js \
  --svg /tmp/logo-gen/logo.svg \
  --svg-dark /tmp/logo-gen/logo-dark.svg \
  --svg-mono /tmp/logo-gen/logo-mono.svg \
  --output "[target_dir]" \
  --stage preview \
  --brand-name "[name]" --primary-color "[hex]" --bg-color "[hex]"
```

### Available stages

| Stage | Flag | What it generates |
|-------|------|-------------------|
| SVGs | `--stage svgs` | logo.svg, logo-dark.svg, logo-mono.svg |
| Favicons | `--stage favicons` | 7 PNGs (16-512) + apple-touch-icon + favicon.ico |
| Social | `--stage social` | og-image.png (1200x630), twitter-card.png (1200x600) |
| Meta | `--stage meta` | site.webmanifest |
| Preview | `--stage preview` | logo-preview.html |
| All | `--stage all` (default) | Everything above in one call |

### What gets generated

```
[target_dir]/
├── logo.svg                    # Primary SVG
├── logo-dark.svg               # Dark background variant
├── logo-mono.svg               # Monochrome variant
├── favicon.ico                 # Multi-size ICO (16, 32, 48)
├── favicon-16x16.png
├── favicon-32x32.png
├── favicon-48x48.png
├── favicon-64x64.png
├── favicon-192x192.png
├── favicon-512x512.png
├── apple-touch-icon.png        # 180x180
├── og-image.png                # 1200x630 (logo centered on brand color bg)
├── twitter-card.png            # 1200x600
├── site.webmanifest            # PWA manifest
└── logo-preview.html           # Visual preview of everything
```

### After export

Print a summary:

```
✓ Brand kit exported to [target_dir]/

Files generated:
  3 SVG variants (light, dark, mono)
  7 favicon PNGs (16-512) + ICO
  1 Apple touch icon
  2 social images (OG + Twitter card)
  1 PWA manifest
  1 HTML preview

Add to your HTML <head>:

  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:image" content="/og-image.png">
  <meta name="twitter:image" content="/twitter-card.png">
```

## Error Handling

- **sharp not installed + qlmanage not available:** Tell the user to run `cd ~/.claude/skills/logo-generator/scripts && npm install`
- **SVG rendering fails:** Check SVG validity, fix syntax, retry
- **Output directory not writable:** Ask user for alternative path
- **User wants to restart:** Jump back to Phase 2, preserve context scan results
