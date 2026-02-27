---
name: image-fetcher
description: "Fetch relevant, high-quality, free-to-use images from the web. Accepts a description/query, or scans the current directory for context. Sources from Unsplash, Pexels, and Pixabay APIs (if keys configured) with a zero-config WebSearch fallback."
argument-hint: "[description of images needed, e.g. 'hero image for a coffee shop website']"
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, WebSearch, WebFetch, AskUserQuestion
---

# Image Fetcher

Fetch relevant, free-to-use images from the web for any project context.

## Config

Read config from `~/.claude/skills/image-fetcher/config.json`:

```json
{
  "unsplash_key": "",
  "pexels_key": "",
  "pixabay_key": "",
  "default_count": 5,
  "output_dir": "assets/images"
}
```

All fields are optional. The skill works with zero configuration via the WebSearch fallback.

Load config silently at the start of every invocation:

```bash
cat ~/.claude/skills/image-fetcher/config.json 2>/dev/null || echo '{}'
```

## Phase 1: Determine What to Search For

**If the user provided input** (argument after the skill name), use that directly as the search context. Skip to Phase 2.

**If no input was provided**, scan the current directory for context signals:

| Source | What to extract |
|--------|----------------|
| `README.md` / `README` | Project name, description, purpose |
| `package.json` / `Cargo.toml` / `pyproject.toml` | Name, description, keywords |
| `CLAUDE.md` | Project conventions, domain |
| HTML/CSS files (first 3) | Page titles, headings, color themes |
| Existing images in `assets/`, `public/`, `static/`, `images/` | What already exists (to avoid duplicates) |

Use Glob and Read to scan. Build a brief internal context summary:

```
CONTEXT:
  project: [name or "unknown"]
  domain: [web app / game / docs / CLI / etc.]
  keywords: [extracted keywords]
  existing_images: [list of what's already there]
```

**If the directory scan yields nothing useful** (empty dir, no descriptive files), use AskUserQuestion:

```
"What kind of images are you looking for?"
Options:
- Hero/banner images
- Product photos
- Abstract/background textures
- Icons/illustrations
- Other (describe)
```

Then ask a follow-up for specifics: subject, mood, color preference.

From the context, generate 1-3 concise search queries (e.g., "minimalist coffee shop interior", "abstract tech gradient background").

Present the queries to the user:

> Based on your project context, I'll search for:
> 1. "minimalist coffee shop interior"
> 2. "coffee beans close-up warm tones"
> 3. "cozy cafe atmosphere"
>
> Want me to adjust any of these?

Proceed when the user confirms (or adjust if they give feedback).

## Phase 2: Fetch Images

Use the first available source from this priority chain:

### Source 1: Unsplash API (if `unsplash_key` is set and non-empty)

```bash
curl -s "https://api.unsplash.com/search/photos?query=QUERY&per_page=COUNT&orientation=landscape" \
  -H "Authorization: Client-ID UNSPLASH_KEY"
```

Extract from JSON response:
- `results[].urls.regular` — download URL (good quality, ~1080px wide)
- `results[].alt_description` — image description
- `results[].width`, `results[].height` — dimensions
- `results[].user.name` — photographer name
- `results[].links.html` — source page URL

### Source 2: Pexels API (if `pexels_key` is set and non-empty)

```bash
curl -s "https://api.pexels.com/v1/search?query=QUERY&per_page=COUNT&orientation=landscape" \
  -H "Authorization: PEXELS_KEY"
```

Extract from JSON response:
- `results[].src.large` — download URL
- `results[].alt` — image description
- `results[].width`, `results[].height` — dimensions
- `results[].photographer` — photographer name
- `results[].url` — source page URL

### Source 3: Pixabay API (if `pixabay_key` is set and non-empty)

```bash
curl -s "https://pixabay.com/api/?key=PIXABAY_KEY&q=QUERY&per_page=COUNT&image_type=photo&orientation=horizontal"
```

Extract from JSON response:
- `hits[].largeImageURL` — download URL
- `hits[].tags` — image description
- `hits[].imageWidth`, `hits[].imageHeight` — dimensions
- `hits[].user` — photographer name
- `hits[].pageURL` — source page URL

### Source 4: WebSearch Fallback (zero config, always available)

If no API keys are configured, use WebSearch:

```
WebSearch: "free stock photo {QUERY} site:unsplash.com OR site:pexels.com OR site:pixabay.com"
```

From the search results, extract individual photo page URLs (e.g., `pexels.com/photo/TITLE-ID/`).

**Important:** Stock sites block WebFetch scraping (return 403). Do NOT attempt to WebFetch individual photo pages. Instead, use known CDN URL patterns to construct direct download URLs:

#### Pexels CDN Pattern
Extract the numeric photo ID from the Pexels URL (e.g., `417074` from `/photo/lake-and-mountain-417074/`), then construct:
```
https://images.pexels.com/photos/{ID}/pexels-photo-{ID}.jpeg?auto=compress&cs=tinysrgb&w=1920
```

#### Unsplash CDN Pattern
Extract the photo slug from the Unsplash URL (e.g., `abc123` from `/photos/abc123`), then construct:
```
https://images.unsplash.com/photo-{SLUG}?w=1920&q=80
```
Note: Unsplash slugs can be complex. If the direct CDN URL doesn't work, search for individual photo pages on Pexels instead — their CDN pattern is more reliable.

#### Pixabay
Pixabay CDN URLs are not predictable without the API. If only Pixabay results are found, suggest the user configure a free API key.

If no individual photo URLs are found, try a second search:
```
WebSearch: "pexels free stock photo {QUERY}"
```

Collect up to `default_count` (default 5) image candidates from whatever source was used.

## Phase 3: Present Candidates

Present the fetched images to the user in a clear table:

```
Found 5 images for "minimalist coffee shop interior":

| # | Description | Size | Source | Photographer |
|---|-------------|------|--------|-------------|
| 1 | Cozy cafe with wooden tables and warm lighting | 1920x1280 | Unsplash | John Doe |
| 2 | Modern coffee bar with espresso machine | 1800x1200 | Unsplash | Jane Smith |
| 3 | Minimalist white cafe interior | 2000x1333 | Unsplash | Alex Chen |
| 4 | Coffee shop window seat with natural light | 1920x1080 | Unsplash | Maria Garcia |
| 5 | Rustic coffee house with brick walls | 1600x1067 | Unsplash | Sam Wilson |
```

Then ask:

```
AskUserQuestion: "Which images would you like to download?"
Options:
- All of them
- Pick specific ones (enter numbers like 1, 3, 5)
- None — search again with different terms
```

## Phase 4: Download & Save

For each selected image:

1. Create the output directory if it doesn't exist:
```bash
mkdir -p ./OUTPUT_DIR
```

2. Generate a descriptive filename from the image description:
   - Lowercase, hyphenated, max 50 chars
   - Append a number suffix if needed to avoid collisions
   - Keep the original file extension (`.jpg`, `.png`, `.webp`)
   - Example: `cozy-cafe-warm-lighting-01.jpg`

3. Download with curl:
```bash
curl -sL "IMAGE_URL" -o "./OUTPUT_DIR/FILENAME"
```

4. Verify the download:
```bash
file "./OUTPUT_DIR/FILENAME"
```
Confirm it's a valid image file (not an HTML error page).

5. If the download fails or produces an invalid file, skip it and note the failure.

## Phase 5: Summary

Print a final summary:

```
Downloaded 3 images to ./assets/images/:

  1. assets/images/cozy-cafe-warm-lighting-01.jpg (1920x1280, 245 KB)
     Source: unsplash.com/photos/abc123 | Photo by John Doe
  2. assets/images/modern-coffee-bar-02.jpg (1800x1200, 198 KB)
     Source: unsplash.com/photos/def456 | Photo by Jane Smith
  3. assets/images/minimalist-white-cafe-03.jpg (2000x1333, 312 KB)
     Source: unsplash.com/photos/ghi789 | Photo by Alex Chen

License: Free to use (Unsplash License)
```

If using Pexels or Pixabay, note attribution requirements:

```
Note: Pexels license requires attribution. Consider adding credit in your project.
```

## Error Handling

- **No API keys and WebSearch returns no usable results**: Tell the user to configure at least one API key in `~/.claude/skills/image-fetcher/config.json` for better results. Offer to help them get a free key (link to signup pages).
- **API rate limit hit**: Fall back to the next source in the chain.
- **Download fails**: Skip the image, note it in the summary, continue with others.
- **All downloads fail**: Report the issue, suggest trying different search terms.

## Important Notes

- All image sources used by this skill (Unsplash, Pexels, Pixabay) provide free-to-use images with permissive licenses.
- Unsplash License: Free for commercial and non-commercial use, no attribution required (but appreciated).
- Pexels License: Free for commercial and non-commercial use, attribution not required but appreciated.
- Pixabay License: Free for commercial and non-commercial use, no attribution required.
- The WebSearch fallback specifically targets these three sites to ensure license compliance.
- Never download images from sources with unclear licensing.
