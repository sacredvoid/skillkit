---
name: icons8
description: "Fetch icons, illustrations, and photos from Icons8. Search 1.5M+ icons across 116 styles, vector illustrations, and 500K+ stock photos. Supports API (with key) and free CDN fallback (no key needed)."
argument-hint: "[type:] [query] e.g. 'icon: shopping cart', 'illustration: teamwork', 'photo: office'"
disable-model-invocation: true
allowed-tools: Bash, Read, Write, Glob, Grep, WebSearch, WebFetch, AskUserQuestion
---

# Icons8 Fetcher

Fetch icons, illustrations, and photos from Icons8's library of 1.5M+ assets.

## Config

Read config from `~/.claude/skills/icons8/config.json`:

```json
{
  "api_key": "",
  "default_count": 10,
  "default_style": "color",
  "default_format": "png",
  "default_size": 128,
  "output_dir": "assets/icons"
}
```

All fields are optional. The skill works without an API key via the CDN for icons.

Load config silently at the start of every invocation:

```bash
cat ~/.claude/skills/icons8/config.json 2>/dev/null || echo '{}'
```

## Available Styles (116 total, most popular listed)

| Style Code | Description |
|------------|-------------|
| `color` | Colorful flat icons (most popular) |
| `ios` / `ios-filled` | Apple iOS style, outline and filled |
| `material` / `material-outlined` | Google Material Design |
| `fluency` | Microsoft Fluency 3D-like |
| `3d-fluency` | Full 3D rendered icons |
| `flat-round` | Flat with rounded shapes |
| `dusk` | Gradient duotone icons |
| `plumpy` | Thick-lined colorful icons |
| `doodle` | Hand-drawn sketch style |
| `stickers` | Sticker/emoji style |
| `emoji` | Platform emoji style |
| `tiny-color` | Small colorful pixel icons |
| `pastel-glyph` | Soft pastel colored |
| `cotton` | Soft rounded style |
| `office` | Microsoft Office style |

Use WebFetch to see the full list: `https://api-icons.icons8.com/api/publicApi/platforms`

## Phase 1: Parse Input

### Determine asset type and query from user input

**Format:** `[type:] query` where type is optional.

| Prefix | Asset Type | Example |
|--------|-----------|---------|
| `icon:` or `icons:` | Icons | `icon: shopping cart` |
| `illustration:` or `illus:` | Illustrations | `illustration: teamwork` |
| `photo:` or `photos:` | Photos | `photo: modern office` |
| (no prefix) | Icons (default) | `rocket ship` |

Also detect style overrides in the input:
- `"shopping cart in material style"` -> query: "shopping cart", style: "material"
- `"3d rocket icon"` -> query: "rocket", style: "3d-fluency"

**If no input was provided**, scan the current directory for context (same as image-fetcher):

| Source | What to extract |
|--------|----------------|
| `README.md` | Project name, description, purpose |
| `package.json` / `pyproject.toml` | Name, description, keywords |
| HTML/JSX/TSX files (first 3) | What UI elements exist, what icons might be needed |
| Existing icons in `assets/`, `public/`, `static/`, `icons/` | What already exists |

Then use AskUserQuestion:

```
What kind of assets do you need from Icons8?
Options:
- Icons (1.5M+ across 116 styles)
- Illustrations (vector SVG/PNG, multiple artistic styles)
- Photos (500K+ stock photos)
```

Follow up with: subject/query, preferred style, quantity needed.

## Phase 2: Fetch Assets

### Route A: Icons (API or CDN)

#### If API key is configured:

**Search endpoint:**
```bash
curl -s "https://api-icons.icons8.com/api/publicApi/icons?term=QUERY&amount=COUNT&platform=STYLE&language=en-US" \
  -H "Api-Key: API_KEY"
```

Response fields to extract:
- `docs[].id` - icon ID
- `docs[].name` - icon name
- `docs[].commonName` - display name
- `docs[].platform` - style code
- `docs[].isFree` - boolean, whether free to use
- `docs[].category` - category name
- `docs[].tags[]` - related tags

**Download endpoint** (for SVG source):
```bash
curl -s "https://api-icons.icons8.com/api/publicApi/icons/ICON_ID" \
  -H "Api-Key: API_KEY"
```

Response includes `icon.svg` field with the full SVG source.

#### If NO API key (CDN fallback, always works):

Icons8 provides a free CDN at `img.icons8.com`. Use this pattern:

```
https://img.icons8.com/{style}/{size}/{icon-name}.png
```

**Examples:**
- `https://img.icons8.com/color/128/shopping-cart.png`
- `https://img.icons8.com/ios-filled/96/home.png`
- `https://img.icons8.com/3d-fluency/128/rocket.png`
- `https://img.icons8.com/material-filled/64/search.png`

**CDN rules:**
- Max free size: 100px (with link attribution) or 512px (with API key)
- Supported sizes: 16, 24, 32, 48, 64, 96, 128, 256, 512
- Icon names use lowercase-hyphenated format: "shopping cart" -> "shopping-cart"
- Format is always PNG via CDN
- Color customization: append color hex to style: `https://img.icons8.com/color/128/FF5733/shopping-cart.png`

**CDN quirks (important):**
- Not all icon names match what you'd expect. "notifications" doesn't exist but "bell" does. "heart" exists in "color" but not in "plumpy".
- `material-filled` is NOT a valid style. Use `material` or `material-outlined` instead.
- A failed CDN request returns either:
  - JSON with `{"success":false,"error":"...","code":"ICON_NAME_NOT_FOUND"}` (wrong icon name)
  - JSON with `{"success":false,"error":"...","code":"PLATFORM_ICON_NOT_FOUND"}` (icon exists but not in that style)
  - HTML error page from CDN77 (style path doesn't exist at all)
- **Always verify** downloads with `file` command. If it's not `PNG image data`, the download failed.

**CDN search strategy** (no API key):
1. Convert the user's query to hyphenated format: "shopping cart" -> "shopping-cart"
2. Try the direct CDN URL first with the default style
3. Verify with `file` command that the result is a valid PNG (not JSON or HTML)
4. If the download failed (JSON error or HTML), use WebSearch to find the correct icon name:
   ```
   WebSearch: "site:icons8.com/icon {QUERY}"
   ```
5. Extract icon slugs from search results (URL pattern: `/icon/{id}/{slug}`)
6. Use those slugs with the CDN pattern
7. If a specific style fails with `PLATFORM_ICON_NOT_FOUND`, try "color" (most complete style) or suggest alternatives

**For multiple icons** (when user wants a set), search for variations:
```
WebSearch: "site:icons8.com/icons/set/{QUERY}/{STYLE}"
```
Then WebFetch that URL to extract icon names from the page.

### Route B: Illustrations

Icons8 illustrations don't have a public CDN. Use WebSearch + WebFetch:

```
WebSearch: "site:icons8.com/illustrations/illustration/{QUERY}"
```

Or fetch the illustrations search page:
```
WebFetch: "https://icons8.com/illustrations/s/{QUERY}"
```

Extract illustration URLs and metadata from the page. Illustrations are available as SVG and PNG.

If the user has an API key, also try:
```bash
curl -s "https://api-icons.icons8.com/api/publicApi/illustrations?term=QUERY&amount=COUNT" \
  -H "Api-Key: API_KEY"
```

### Route C: Photos

Use WebSearch to find Icons8 stock photos:

```
WebSearch: "site:icons8.com/photos {QUERY}"
```

Or fetch the search page:
```
WebFetch: "https://icons8.com/photos/s/{QUERY}"
```

Extract photo URLs and metadata.

## Phase 3: Present Candidates

### For Icons:

```
Found 10 icons for "shopping cart" in Color style:

| # | Name | Style | Free | Preview URL |
|---|------|-------|------|-------------|
| 1 | Shopping Cart | color | Yes | img.icons8.com/color/128/shopping-cart.png |
| 2 | Add Shopping Cart | color | Yes | img.icons8.com/color/128/add-shopping-cart.png |
| 3 | Shopping Cart Loaded | color | Yes | img.icons8.com/color/128/shopping-cart-loaded.png |
...

Want to:
- Download specific ones? (enter numbers: 1, 3, 5)
- Download all?
- See these in a different style? (ios, material, 3d-fluency, etc.)
- Search for something else?
```

### For Illustrations:

```
Found 5 illustrations for "teamwork":

| # | Title | Style | Format |
|---|-------|-------|--------|
| 1 | Team collaboration | Corporate | SVG, PNG |
| 2 | Remote teamwork | 3D | SVG, PNG |
...
```

### For Photos:

```
Found 5 photos for "modern office":

| # | Description | Size | Category |
|---|-------------|------|----------|
| 1 | Open plan office with natural light | 1920x1280 | Business |
...
```

Then ask via AskUserQuestion which to download.

## Phase 4: Download & Save

1. Determine output directory based on asset type:
   - Icons: `{output_dir}/` (default: `assets/icons/`)
   - Illustrations: `assets/illustrations/`
   - Photos: `assets/photos/`

2. Create the output directory:
```bash
mkdir -p ./OUTPUT_DIR
```

3. Generate filenames:
   - Format: `{icon-name}-{style}.{ext}` for icons
   - Format: `{title-slug}.{ext}` for illustrations/photos
   - Lowercase, hyphenated, max 60 chars

4. Download:

**Icons via CDN:**
```bash
curl -sL "https://img.icons8.com/{style}/{size}/{icon-name}.png" -o "./OUTPUT_DIR/{icon-name}-{style}.png"
```

**Icons via API (SVG):**
Extract the SVG content from the API response and write it directly:
```bash
# SVG content from API response
echo 'SVG_CONTENT' > "./OUTPUT_DIR/{icon-name}-{style}.svg"
```

**Illustrations/Photos:**
```bash
curl -sL "ASSET_URL" -o "./OUTPUT_DIR/FILENAME"
```

5. Verify each download:
```bash
file "./OUTPUT_DIR/FILENAME"
```
Confirm it's a valid image file (PNG, SVG, JPEG), not an HTML error page.

6. If a CDN download returns a placeholder/error (< 1KB or HTML content), note it and try alternate icon name spellings.

## Phase 5: Summary

```
Downloaded 5 icons to ./assets/icons/:

  1. shopping-cart-color.png (128x128, 4.2 KB)
     CDN: img.icons8.com/color/128/shopping-cart.png
  2. add-shopping-cart-color.png (128x128, 3.8 KB)
     CDN: img.icons8.com/color/128/add-shopping-cart.png
  3. shopping-cart-ios-filled.png (128x128, 2.1 KB)
     CDN: img.icons8.com/ios-filled/128/shopping-cart.png

Style: Color, iOS Filled | Format: PNG | Size: 128px

License: Free with link attribution to Icons8 (icons8.com).
For attribution-free use, get an API key at https://icons8.com/pricing
```

## Phase 6: Generate Usage Snippets (Optional)

If the project context suggests web/app development, offer ready-to-use code:

**HTML:**
```html
<!-- Option 1: Local file -->
<img src="assets/icons/shopping-cart-color.png" alt="Shopping Cart" width="32" height="32">

<!-- Option 2: CDN embed (requires attribution link) -->
<img src="https://img.icons8.com/color/32/shopping-cart.png" alt="Shopping Cart">
<a href="https://icons8.com">Icons by Icons8</a>
```

**React/JSX:**
```jsx
<img src="/assets/icons/shopping-cart-color.png" alt="Shopping Cart" width={32} height={32} />
```

**CSS:**
```css
.cart-icon {
  background-image: url('assets/icons/shopping-cart-color.png');
  width: 32px;
  height: 32px;
  background-size: contain;
}
```

**Markdown:**
```markdown
![Shopping Cart](assets/icons/shopping-cart-color.png)
```

Only show snippets relevant to the detected project type (check for `.html`, `.jsx`, `.tsx`, `.vue`, `.css` files).

## Batch Mode

If the user requests multiple icons at once (e.g., "I need icons for: home, settings, user, search, notifications"), handle them all in a single run:

1. Parse the list of icon names
2. Fetch all icons in the same style for consistency
3. Download all at once
4. Present a single summary table

```bash
# Batch CDN download example
for icon in home settings user search notifications; do
  curl -sL "https://img.icons8.com/color/128/${icon}.png" -o "./assets/icons/${icon}-color.png"
done
```

## Style Consistency Helper

When fetching multiple icons for the same project, always use the same style across all icons. If the user has already downloaded icons in a specific style, detect that:

```bash
ls ./assets/icons/ 2>/dev/null | head -20
```

If existing icons follow a pattern (e.g., all `*-material.png`), default to that style for new downloads.

## Error Handling

- **CDN returns 404/placeholder**: Try alternate hyphenation or use WebSearch to find the correct slug
- **API rate limit** (1000 req/hr): Note the limit and suggest spacing out requests
- **Icon not found in requested style**: Suggest available styles for that icon
- **Download produces HTML instead of image**: The CDN returned an error page. Check filename was correct, try without special characters
- **No results for query**: Broaden the search terms, suggest related keywords

## Licensing Notes

- **Free tier (CDN, no API key)**: Icons are free to use with a link to Icons8 (`<a href="https://icons8.com">Icons by Icons8</a>`)
- **Paid tier (API key)**: No attribution required. SVG downloads available. $15/month.
- **Illustrations**: Free with attribution
- **Photos**: Free with attribution (similar to Pexels/Unsplash model)
- Always mention the license requirement in the download summary
