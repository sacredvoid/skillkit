---
name: raycast-automator
description: |
  Use when the user asks to automate a task with Raycast, build a Raycast extension,
  create a Raycast script command, or mentions Raycast in the context of building
  something. Triggers on: "automate X with Raycast", "build a Raycast extension",
  "create a raycast script", "make a raycast command", or any task where Raycast
  is the target platform.
---

# Raycast Automator

Build Raycast extensions and script commands from natural language task descriptions. Handles the full lifecycle: analysis, code generation, setup, and dev launch.

## Output Directory

All output goes to `~/Documents/raycast-scripts/`:
- **Script commands**: files directly in the root (e.g., `my-script.sh`)
- **Extensions**: subdirectories (e.g., `my-extension/src/index.tsx`)

Create the directory if it doesn't exist. For extensions, create the subdirectory named after the extension.

## Decision Flow

```
User describes a task
  │
  ├─ Analyze complexity
  │   ├─ Needs rich UI (lists, forms, grids, detail views)?  → Extension
  │   ├─ Needs OAuth or token management?                     → Extension
  │   ├─ Needs persistent state across runs?                  → Extension
  │   ├─ Needs menu bar presence?                             → Extension
  │   ├─ Needs pagination or streaming data?                  → Extension
  │   ├─ Simple system operation (open, toggle, copy)?        → Script Command
  │   ├─ Opens URL or does clipboard work?                    → Script Command
  │   ├─ Runs a shell command or API call with simple output? → Script Command
  │   └─ 1-3 simple text inputs, no interactive UI?           → Script Command
  │
  ├─ Present recommendation with reasoning to user
  ├─ User confirms or overrides
  │
  ├─ IF Script Command:
  │   ├─ Pick language:
  │   │   ├─ macOS + simple task       → Bash
  │   │   ├─ Windows + simple task     → Batch/PowerShell
  │   │   ├─ Complex logic / API calls → Python
  │   │   └─ Mac-native automation     → AppleScript
  │   ├─ Generate script with full metadata block
  │   ├─ chmod +x the file
  │   ├─ Ensure ~/Documents/raycast-scripts/ is created
  │   └─ Tell user to add script directory in Raycast if first time
  │
  └─ IF Extension:
      ├─ Scaffold project structure
      ├─ Generate package.json with full manifest
      ├─ Generate src/ entry point(s)
      ├─ Run npm install
      ├─ Run npm run dev
      └─ Confirm extension appears in Raycast
```

## Before Writing Code

1. **Read the reference files** in `reference/` directory of this skill:
   - `reference/extension-api.md` - for extensions (manifest, UI components, hooks, APIs)
   - `reference/script-commands.md` - for script commands (metadata, templates, examples)
   - `reference/patterns.md` - for best practices and common patterns

2. **Check platform**: Use `uname` to detect macOS vs other. This affects:
   - Script language defaults (bash vs bat)
   - Available APIs (MenuBarExtra, BrowserExtension are macOS-only)
   - AppleScript availability

## Script Command Generation

### Required metadata block (ALWAYS include all of these):

```bash
#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title <Title Case Name>
# @raycast.mode <silent|compact|fullOutput|inline>

# Optional parameters:
# @raycast.packageName <Category>
# @raycast.icon <emoji or path>
# @raycast.description <What it does>
# @raycast.needsConfirmation <true for destructive ops>
# @raycast.argument1 { "type": "text", "placeholder": "..." }
```

### Mode selection:

| Mode | When to use |
|------|------------|
| `silent` | Opens URL, clipboard ops, launches app, background task |
| `compact` | Short confirmation message, quick status |
| `fullOutput` | Multi-line output, formatted results, logs |
| `inline` | Live status display (requires `refreshTime`, min 10s) |

### Language shebangs:

| Language | Shebang | Extension |
|----------|---------|-----------|
| Bash | `#!/bin/bash` | `.sh` |
| Python 3 | `#!/usr/bin/env python3` | `.py` |
| Node.js | `#!/usr/bin/env node` | `.js` |
| AppleScript | `#!/usr/bin/osascript` | `.applescript` |
| Ruby | `#!/usr/bin/env ruby` | `.rb` |
| Swift | `#!/usr/bin/swift` | `.swift` |

### Argument access by language:

| Language | Arg 1 | Arg 2 | Arg 3 |
|----------|-------|-------|-------|
| Bash | `$1` | `$2` | `$3` |
| Python | `sys.argv[1]` | `sys.argv[2]` | `sys.argv[3]` |
| Node.js | `process.argv[2]` | `process.argv[3]` | `process.argv[4]` |
| AppleScript | `item 1 of argv` | `item 2 of argv` | `item 3 of argv` |
| Ruby | `ARGV[0]` | `ARGV[1]` | `ARGV[2]` |
| Swift | `CommandLine.arguments[1]` | `CommandLine.arguments[2]` | `CommandLine.arguments[3]` |

### Script rules:
- Max 3 arguments per script
- Use `percentEncoded: true` for URL arguments
- Use `needsConfirmation: true` for destructive operations
- Non-zero exit code = failure (last line becomes error message)
- Scripts run in non-login shell; use `#!/bin/bash -l` if login shell needed
- `inline` mode REQUIRES `refreshTime` (min `10s`)
- Use absolute paths since PATH may differ from user's shell

## Extension Generation

### Minimum project structure:

```
extension-name/
├── package.json          # Manifest (see reference/extension-api.md)
├── tsconfig.json         # TypeScript config
├── src/
│   └── index.tsx         # Main command entry point
└── assets/
    └── icon.png          # 512x512 PNG (or use command-icon.png)
```

### package.json template:

```json
{
  "$schema": "https://www.raycast.com/schemas/extension.json",
  "name": "extension-name",
  "title": "Extension Title",
  "description": "What it does",
  "icon": "command-icon.png",
  "author": "author-name",
  "categories": ["Productivity"],
  "license": "MIT",
  "platforms": ["macOS"],
  "commands": [
    {
      "name": "index",
      "title": "Command Title",
      "description": "What the command does",
      "mode": "view"
    }
  ],
  "dependencies": {
    "@raycast/api": "^1.98.0",
    "@raycast/utils": "^1.19.0"
  },
  "devDependencies": {
    "@raycast/eslint-config": "^1.0.11",
    "typescript": "^5.4.5",
    "@types/node": "22.14.0",
    "@types/react": "19.0.0",
    "eslint": "^8.57.0"
  },
  "scripts": {
    "build": "ray build",
    "dev": "ray dev",
    "fix-lint": "ray lint --fix",
    "lint": "ray lint",
    "prepublishOnly": "echo \"Error: no publish script\" && exit 1",
    "publish": "npx @raycast/api@latest publish"
  }
}
```

### tsconfig.json template:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "lib": ["ES2023"],
    "module": "Node16",
    "moduleResolution": "node16",
    "target": "ES2022",
    "resolveJsonModule": true,
    "strict": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*", "env.d.ts", "raycast-env.d.ts"]
}
```

### Command modes:

| Mode | Export | Use case |
|------|--------|----------|
| `view` | React component (default export) | Interactive UI with List/Detail/Form/Grid |
| `no-view` | Async function (default export) | Background tasks, clipboard ops, no UI |
| `menu-bar` | MenuBarExtra component | Persistent menu bar item (macOS only) |

### Choosing the right UI component:

| Component | When to use |
|-----------|------------|
| `List` | Searchable items, most common. Use `isShowingDetail` for split view |
| `Detail` | Single item display with markdown + metadata sidebar |
| `Form` | User input collection. Use `useForm` hook for validation |
| `Grid` | Image-heavy content (icons, thumbnails, galleries) |
| `MenuBarExtra` | Always-visible menu bar status/actions |

### Essential hooks (from @raycast/utils):

| Hook | When to use |
|------|------------|
| `useFetch` | HTTP requests with caching |
| `usePromise` | Any async operation |
| `useCachedPromise` | Async with stale-while-revalidate caching |
| `useExec` | Shell command execution |
| `useForm` | Form state + validation |
| `useLocalStorage` | Persistent key-value state |
| `useCachedState` | State that persists across command runs |
| `useAI` | Raycast AI integration (requires Pro) |
| `useSQL` | SQLite database queries |

### Extension rules:
- Always set `isLoading` prop on top-level components during async ops
- Use `showToast(Toast.Style.Failure)` for errors, not console.error
- Use `showFailureToast` from @raycast/utils for standardized errors
- First action in ActionPanel = primary (Enter key)
- Use `Action.Push` for navigation, not imperative `useNavigation`
- Use `List.EmptyView` / `Grid.EmptyView` for zero-state
- Validate forms on `onBlur`, clear errors on `onChange`
- Don't use `filtering={true}` when you have `onSearchTextChange`
- Use `environment.canAccess()` before using Pro features (AI, WindowManagement)

## After Generation

### For script commands:
1. Create the file in `~/Documents/raycast-scripts/`
2. Run `chmod +x` on the file
3. Tell the user:
   - "Open Raycast Preferences > Extensions > + > Add Script Directory"
   - Point to `~/Documents/raycast-scripts/`
   - "You only need to do this once"
4. The command will appear in Raycast search by its `@raycast.title`

### For extensions:
1. Create the project in `~/Documents/raycast-scripts/<extension-name>/`
2. Run `npm install` in the project directory
3. Run `npm run dev` to start dev mode
4. Tell the user:
   - The extension appears at the top of Raycast search in dev mode
   - Hot reload is active (saves auto-refresh)
   - Stop dev with Ctrl+C in terminal
   - To publish: `npm run publish`

## Icon Guidance

- Script commands: use emoji (simplest) or 64px PNG
- Extensions: need 512x512 PNG. Generate at https://icon.ray.so or use a placeholder
- Support dark mode variant with `icon@dark.png` suffix
- For extensions, always include a `command-icon.png` in assets/ as fallback

## Categories (for extensions)

Use exactly one of: `Applications`, `Communication`, `Data`, `Design Tools`, `Developer Tools`, `Documentation`, `Finance`, `Fun`, `Media`, `News`, `Other`, `Productivity`, `Security`, `System`, `Web`

## Common Patterns Quick Reference

### Fetch + List pattern (most common extension):
```typescript
import { List } from "@raycast/api";
import { useFetch } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = useFetch<Result[]>("https://api.example.com/items");
  return (
    <List isLoading={isLoading}>
      {data?.map((item) => (
        <List.Item key={item.id} title={item.name} />
      ))}
    </List>
  );
}
```

### No-view command pattern:
```typescript
import { showToast, Toast, Clipboard } from "@raycast/api";

export default async function Command() {
  const text = await Clipboard.readText();
  if (!text) {
    await showToast(Toast.Style.Failure, "Clipboard is empty");
    return;
  }
  const result = transform(text);
  await Clipboard.copy(result);
  await showToast(Toast.Style.Success, "Copied to clipboard");
}
```

### Form + submission pattern:
```typescript
import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";

interface FormValues {
  name: string;
  description: string;
}

export default function Command() {
  const { handleSubmit, itemProps } = useForm<FormValues>({
    onSubmit(values) {
      showToast(Toast.Style.Success, "Submitted", values.name);
    },
    validation: {
      name: FormValidation.Required,
    },
  });
  return (
    <Form actions={<ActionPanel><Action.SubmitForm onSubmit={handleSubmit} /></ActionPanel>}>
      <Form.TextField title="Name" placeholder="Enter name" {...itemProps.name} />
      <Form.TextArea title="Description" placeholder="Enter description" {...itemProps.description} />
    </Form>
  );
}
```

### Script command - open URL with argument:
```bash
#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Search Google
# @raycast.mode silent
# @raycast.icon 🔍
# @raycast.packageName Web Searches
# @raycast.argument1 { "type": "text", "placeholder": "query", "percentEncoded": true }

open "https://www.google.com/search?q=$1"
```
