# Skillkit

[![MIT License](https://img.shields.io/github/license/sacredvoid/skillkit)](LICENSE)

A curated collection of AI coding skills for creative and productivity workflows. Each skill is a standalone markdown file that works with any AI coding assistant.

## Skills

| Skill | What it does |
|-------|-------------|
| [**Image Fetcher**](skills/image-fetcher/) | Context-aware image search from Unsplash, Pexels, Pixabay. Zero-config with WebSearch fallback. |
| [**Logo Generator**](skills/logo-generator/) | Adaptive brainstorming, SVG logo creation, full brand kit export (favicons, social images, PWA manifest). |
| [**Presentation Chef**](skills/presentation-chef/) | Apple Keynote-style HTML presentations with cinematic animations, glassmorphism, and 5 themes. Single `.html` file. |
| [**Video/Audio Processor**](skills/video-audio-processor/) | Transcribe recordings with Whisper, extract visual frames with ffmpeg, synthesize meeting notes. |

## Installation

<details open>
<summary><strong>Claude Code</strong></summary>

Install the entire collection as a plugin:

```
/plugin marketplace add sacredvoid/skillkit
/plugin install skillkit@sacredvoid-skillkit
```

Or install individual skills by copying the SKILL.md file to `~/.claude/skills/<skill-name>/SKILL.md`.

Then invoke any skill:

```
/image-fetcher hero image for a landing page
/logo-generator
/presentation-chef
/video-audio-processor
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Copy the skill's `SKILL.md` into your project as a Cursor Rule:

```
.cursor/rules/<skill-name>.mdc
```

Add frontmatter:

```yaml
---
description: "<skill description>"
alwaysApply: false
---
```

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Copy `SKILL.md` to `.windsurf/rules/<skill-name>.md` and set activation mode to **Manual** or **Model Decision**.

</details>

<details>
<summary><strong>GitHub Copilot</strong></summary>

Copy `SKILL.md` to `.github/instructions/<skill-name>.instructions.md` with frontmatter:

```yaml
---
applyTo: ""
---
```

</details>

<details>
<summary><strong>Cline / Continue / Aider / Zed / Other</strong></summary>

Each skill is a standalone markdown file. Copy the `SKILL.md` into your tool's instruction/rule format:

- **Cline**: `.clinerules/<skill-name>.md`
- **Continue**: `.continue/rules/<skill-name>.md`
- **Aider**: `aider --read skills/<skill-name>/SKILL.md`
- **Zed**: `.zed/prompts/<skill-name>.md`
- **Any tool**: Paste or reference the SKILL.md contents as custom instructions

</details>

## Skill Details

### Image Fetcher

Scans your project directory for context (README, package.json, CSS) and generates relevant search queries. Fetches from Unsplash, Pexels, and Pixabay via API keys or zero-config WebSearch fallback. Presents curated picks with descriptions, sizes, and source info before downloading.

**Config** (optional): `skills/image-fetcher/config.json` for API keys.

### Logo Generator

Interactive workflow: context scan, adaptive brainstorming (skips questions it can infer), 2-3 concept proposals, SVG generation (light/dark/mono variants), and full brand kit export.

**Output**: 3 SVG variants, 7 favicon PNGs + ICO, Apple touch icon, OG + Twitter social images, PWA manifest, and HTML preview.

**Requires**: Node.js for the export script (`cd skills/logo-generator/scripts && npm install`). Falls back to macOS native tools if sharp is unavailable.

### Presentation Chef

Guided workflow: content source, theme selection (with AI recommendations), slide structure review, then generation. 5 themes (Dark Cinematic, Light Minimal, Warm Editorial, Neon Cyberpunk, Earth Organic), 13 slide types, speaker notes, PDF export.

**Output**: A single self-contained `.html` file with zero dependencies.

### Video/Audio Processor

Extracts visual frames with ffmpeg (1 per minute), transcribes audio with OpenAI Whisper (local, no API key), and synthesizes findings into structured notes.

**Requires**: `brew install ffmpeg` and `pip3 install openai-whisper`.

## License

[MIT](LICENSE)
