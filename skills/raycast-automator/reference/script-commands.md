# Raycast Script Commands Reference

## What Are Script Commands?

Lightweight scripts that run directly from Raycast's search bar without opening a terminal. Single file, no build step, any scripting language. Ideal for quick personal automation.

## Supported Languages (8)

| Language | Shebang | Extension | Comment |
|----------|---------|-----------|---------|
| Bash | `#!/bin/bash` | `.sh` | `#` |
| Python 3 | `#!/usr/bin/env python3` | `.py` | `#` |
| Node.js | `#!/usr/bin/env node` | `.js` | `//` |
| Ruby | `#!/usr/bin/env ruby` | `.rb` | `#` |
| Swift | `#!/usr/bin/swift` | `.swift` | `//` |
| AppleScript | `#!/usr/bin/osascript` | `.applescript` | `#` |
| PHP | `#!/usr/bin/env php` | `.php` | `#` |
| C# (.NET) | `#!/usr/bin/env dotnet` | `.cs` | `//` |

## All Metadata Fields

### Required

| Field | Description | Example |
|-------|-------------|---------|
| `@raycast.schemaVersion` | Always `1` | `1` |
| `@raycast.title` | Display name in Raycast search | `My Command` |
| `@raycast.mode` | Output mode | `silent`, `compact`, `fullOutput`, `inline` |

### Optional

| Field | Description | Example |
|-------|-------------|---------|
| `@raycast.packageName` | Category/grouping subtitle | `Developer Utilities` |
| `@raycast.icon` | Emoji, file path, or HTTPS URL | `🤖` or `images/icon.png` |
| `@raycast.iconDark` | Dark theme icon variant | `images/icon-dark.png` |
| `@raycast.currentDirectoryPath` | Working directory | `~` or `/path/to/dir` |
| `@raycast.needsConfirmation` | Confirm before running | `true` |
| `@raycast.refreshTime` | Auto-refresh for inline mode (min `10s`) | `10s`, `1m`, `12h`, `1d` |
| `@raycast.description` | What the command does | `Decodes JWT from clipboard` |
| `@raycast.author` | Creator's name | `John Doe` |
| `@raycast.authorURL` | Author link | `https://github.com/johndoe` |
| `@raycast.argument1` | First argument (JSON) | `{ "type": "text", "placeholder": "query" }` |
| `@raycast.argument2` | Second argument | Same format |
| `@raycast.argument3` | Third argument (max 3) | Same format |

## Output Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `silent` | No output; last line as HUD toast | Opening URLs, clipboard ops, background tasks |
| `compact` | Last line as toast overlay | Quick confirmations, short status |
| `fullOutput` | Full stdout in terminal view | Detailed results, formatted output |
| `inline` | First line in search result, auto-refreshes | Live status, timezones, counters |

**Notes:**
- `fullOutput` and `inline` support ANSI color codes
- `inline` REQUIRES `@raycast.refreshTime` (min `10s`), otherwise falls back to `compact`
- Non-zero exit code = failure; last line becomes error message

## Arguments

Max 3 per script. Defined as JSON in metadata comments.

### Argument Properties

| Property | Required | Description |
|----------|----------|-------------|
| `type` | Yes | `"text"`, `"password"`, or `"dropdown"` |
| `placeholder` | Yes | Hint text |
| `optional` | No | `true` makes it optional |
| `percentEncoded` | No | URL-encode before passing |
| `data` | dropdown only | `[{"title": "...", "value": "..."}]` |

### Accessing Arguments

| Language | Arg 1 | Arg 2 | Arg 3 |
|----------|-------|-------|-------|
| Bash | `$1` | `$2` | `$3` |
| Python | `sys.argv[1]` | `sys.argv[2]` | `sys.argv[3]` |
| Node.js | `process.argv[2]` | `process.argv[3]` | `process.argv[4]` |
| Ruby | `ARGV[0]` | `ARGV[1]` | `ARGV[2]` |
| Swift | `CommandLine.arguments[1]` | `CommandLine.arguments[2]` | `CommandLine.arguments[3]` |
| AppleScript | `item 1 of argv` | `item 2 of argv` | `item 3 of argv` |

## Complete Templates

### Bash

```bash
#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title My Command
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.packageName My Scripts
# @raycast.icon 🤖
# @raycast.description What this command does
# @raycast.needsConfirmation false

echo "Hello World"
```

### Python

```python
#!/usr/bin/env python3

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title My Command
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.packageName My Scripts
# @raycast.icon 🐍
# @raycast.description What this command does

import sys

print("Hello World")
```

### Node.js

```javascript
#!/usr/bin/env node

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title My Command
// @raycast.mode fullOutput

// Optional parameters:
// @raycast.packageName My Scripts
// @raycast.icon 📦
// @raycast.description What this command does

console.log("Hello World");
```

### AppleScript

```applescript
#!/usr/bin/osascript

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title My Command
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.packageName My Scripts
# @raycast.icon 🍎
# @raycast.description What this command does

on run argv
  log "Hello World"
end run
```

### Swift

```swift
#!/usr/bin/swift

// Required parameters:
// @raycast.schemaVersion 1
// @raycast.title My Command
// @raycast.mode fullOutput

// Optional parameters:
// @raycast.packageName My Scripts
// @raycast.icon 🦅
// @raycast.description What this command does

print("Hello World")
```

### Ruby

```ruby
#!/usr/bin/env ruby

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title My Command
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.packageName My Scripts
# @raycast.icon 💎
# @raycast.description What this command does

puts "Hello World"
```

## Real-World Examples

### Search Google (Bash, silent, URL argument)

```bash
#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Search Google
# @raycast.mode silent
# @raycast.packageName Web Searches
# @raycast.icon 🔍
# @raycast.argument1 { "type": "text", "placeholder": "query", "percentEncoded": true }

open "https://www.google.com/search?q=$1"
```

### Toggle Wi-Fi (Bash, compact)

```bash
#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Toggle Wi-Fi
# @raycast.mode compact
# @raycast.packageName System
# @raycast.icon 📶

wifi_status=$(networksetup -getairportpower en0 | awk '{print $4}')
if [ "$wifi_status" = "On" ]; then
    networksetup -setairportpower en0 off
    echo "Wi-Fi turned off"
else
    networksetup -setairportpower en0 on
    echo "Wi-Fi turned on"
fi
```

### Decode JWT from Clipboard (Bash, fullOutput)

```bash
#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Decode JWT
# @raycast.mode fullOutput
# @raycast.packageName Developer Utilities
# @raycast.icon 🔐
# @raycast.description Decodes JSON web token from clipboard

function jwt() {
  for part in 1 2; do
    b64="$(cut -f$part -d. <<< "$1" | tr '_-' '/+')"
    len=${#b64}
    n=$((len % 4))
    if [[ 2 -eq n ]]; then b64="${b64}=="; elif [[ 3 -eq n ]]; then b64="${b64}="; fi
    d="$(openssl enc -base64 -d -A <<< "$b64")"
    python3 -mjson.tool <<< "$d"
  done
}

jwt $(pbpaste)
```

### Live Caffeinate Status (Bash, inline with refresh)

```bash
#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Caffeinate Status
# @raycast.mode inline
# @raycast.refreshTime 30s
# @raycast.packageName System
# @raycast.icon ☕️

caffeinate_ps=$(ps aux | grep '\d caffeinate')
if [ -z "$caffeinate_ps" ]; then
    echo "Not active"
else
    echo "Running"
fi
```

### Close All Finder Windows (AppleScript, silent)

```applescript
#!/usr/bin/osascript

# @raycast.schemaVersion 1
# @raycast.title Close All Finder Windows
# @raycast.mode silent
# @raycast.packageName System
# @raycast.icon 🔪

tell application "Finder" to close windows
```

### Google Translate (Python, compact, multiple args)

```python
#!/usr/bin/env python3

# @raycast.schemaVersion 1
# @raycast.title Google Translate
# @raycast.mode compact
# @raycast.packageName Web Searches
# @raycast.icon 🌍
# @raycast.argument1 { "type": "text", "placeholder": "Query" }
# @raycast.argument2 { "type": "text", "placeholder": "From (en)", "optional": true }
# @raycast.argument3 { "type": "text", "placeholder": "To (es)", "optional": true }

import sys
import urllib.request
import json

query = sys.argv[1]
source = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else "en"
target = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else "es"

url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={query}"
response = urllib.request.urlopen(url)
result = json.loads(response.read().decode('utf-8'))
print(result[0][0][0])
```

### API Call with Dropdown (Bash, dropdown argument)

```bash
#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Check Service Status
# @raycast.mode compact
# @raycast.packageName DevOps
# @raycast.icon 🔄
# @raycast.argument1 { "type": "dropdown", "placeholder": "Service", "data": [{"title": "API", "value": "api"}, {"title": "Web", "value": "web"}, {"title": "Database", "value": "db"}] }

curl -s "https://status.example.com/$1" | jq -r '.status'
```

### Destructive Operation with Confirmation (Bash)

```bash
#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Empty Trash
# @raycast.mode silent
# @raycast.packageName System
# @raycast.icon 🗑️
# @raycast.needsConfirmation true
# @raycast.description Permanently empties the Trash

rm -rf ~/.Trash/*
echo "Trash emptied"
```

## Installation

1. Save scripts to `~/Documents/raycast-scripts/`
2. Make executable: `chmod +x script.sh`
3. Open Raycast Preferences > Extensions > + > Add Script Directory
4. Select `~/Documents/raycast-scripts/`
5. Scripts appear in Raycast search by their `@raycast.title`

You only need to add the directory once. New scripts are picked up automatically.

## Best Practices

1. **Use absolute paths** - scripts run in non-login shell, PATH may differ
2. **Use `#!/bin/bash -l`** if you need login shell (for nvm, rbenv, etc.)
3. **Set `needsConfirmation: true`** for destructive operations
4. **Use `percentEncoded: true`** for URL arguments
5. **Exit with non-zero** to signal failure
6. **Files must be executable** (`chmod +x`)
7. **Use ShellCheck** for bash scripts
8. **Group with `packageName`** for organization
9. **`/usr/local/bin`** is appended to PATH automatically
10. **Keep scripts focused** - one task per script
