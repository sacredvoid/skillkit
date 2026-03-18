# Skillkit

A collection of AI coding skills. Each skill lives in `skills/<skill-name>/SKILL.md`.

## GitHub Pages

The landing page at `docs/index.html` is published to https://sacredvoid.github.io/skillkit.

**When adding a new skill, always update `docs/index.html`:**

1. Add a new CSS card class (`.card-<name>`) with grid span, gradient, hover shadow, icon, title, and tag color styles
2. Add the card HTML to the bento grid (before the full-width Local Image Gen card at the bottom)
3. Update the skill count in the section title ("Nine skills. One install." etc.)
4. Update the `<meta>` description tags in `<head>` to mention the new skill
5. Update the responsive media query to include the new card class
6. Pick a unique color from the existing CSS variables or add a new one to `:root`

Also update `README.md` to add the new skill to the skills table and add a details section.

## Skill File Format

Each skill has YAML frontmatter:

```yaml
---
name: skill-name
description: "What the skill does"
argument-hint: "[usage example]"
disable-model-invocation: true
allowed-tools: [tool list]
---
```

## Git Remote

Uses `git@github.com:sacredvoid/skillkit.git` (personal-git SSH alias may also be used).
