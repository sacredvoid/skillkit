# Raycast Extension API Reference

## Manifest (package.json)

### Extension-Level Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | `string` | Unique ID, URL-compatible |
| `title` | Yes | `string` | Display name in Store/search |
| `description` | Yes | `string` | Full description |
| `icon` | Yes | `string` | PNG 512x512 in `assets/`, supports `icon@dark.png` |
| `author` | Yes | `string` | Raycast Store username |
| `platforms` | Yes | `string[]` | `["macOS"]` and/or `["Windows"]` |
| `categories` | Yes | `string[]` | From allowed list |
| `commands` | Yes | `Command[]` | Array of command objects |
| `tools` | No | `Tool[]` | AI tools |
| `ai` | No | `object` | AI instructions and evals |
| `owner` | No | `string` | Organization (makes private) |
| `access` | No | `"public" \| "private"` | Visibility |
| `contributors` | No | `string[]` | Co-maintainer usernames |
| `keywords` | No | `string[]` | Search terms |
| `preferences` | No | `Preference[]` | Extension-level preferences |
| `external` | No | `string[]` | Packages excluded from bundling |

### Command Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | `string` | Maps to `src/{name}.{ts,tsx}` |
| `title` | Yes | `string` | Display name |
| `description` | Yes | `string` | What it does |
| `mode` | Yes | `"view" \| "no-view" \| "menu-bar"` | Rendering mode |
| `subtitle` | No | `string` | Updatable via `updateCommandMetadata` |
| `icon` | No | `string` | Overrides extension icon |
| `interval` | No | `string` | Background refresh: `"90s"`, `"1m"`, `"5m"`, `"12h"`, `"1d"` |
| `keywords` | No | `string[]` | Search terms |
| `arguments` | No | `Argument[]` | Inline user inputs |
| `preferences` | No | `Preference[]` | Command-level settings |
| `disabledByDefault` | No | `boolean` | User must enable |

### Preference Fields

| Field | Required | Type |
|-------|----------|------|
| `name` | Yes | `string` |
| `title` | Yes | `string` |
| `description` | Yes | `string` |
| `type` | Yes | `"textfield" \| "password" \| "checkbox" \| "dropdown" \| "appPicker" \| "file" \| "directory"` |
| `required` | Yes | `boolean` |
| `placeholder` | No | `string` |
| `default` | No | varies |
| `label` | Yes (checkbox) | `string` |
| `data` | Yes (dropdown) | `{title: string, value: string}[]` |

**Type to value mapping:** textfield/password -> `string`, checkbox -> `boolean`, dropdown -> `string`, appPicker -> `Application`, file/directory -> `string`

### Argument Fields

| Field | Required | Type |
|-------|----------|------|
| `name` | Yes | `string` |
| `type` | Yes | `"text" \| "password" \| "dropdown"` |
| `placeholder` | Yes | `string` |
| `required` | No | `boolean` (default false) |
| `data` | Yes (dropdown) | `{title: string, value: string}[]` |

---

## UI Components

### List

**Props:** `filtering`, `isLoading`, `isShowingDetail`, `navigationTitle`, `onSearchTextChange`, `onSelectionChange`, `pagination: {hasMore, onLoadMore, pageSize}`, `searchBarAccessory`, `searchBarPlaceholder`, `searchText`, `selectedItemId`, `throttle`

**Sub-components:**
- `List.Item` - `title*`, `accessories`, `actions`, `detail`, `icon`, `id`, `keywords`, `quickLook`, `subtitle`
- `List.Item.Detail` - `isLoading`, `markdown`, `metadata` (with Label, Link, TagList, Separator)
- `List.Section` - `children`, `subtitle`, `title`
- `List.EmptyView` - `actions`, `description`, `icon`, `title`
- `List.Dropdown` - `tooltip*`, `onChange`, `storeValue`, `value`, `filtering`, `throttle`

**List.Item.Accessory:** `{ tag?, text?, date?, icon?, tooltip? }` - each with optional color.

### Detail

**Props:** `actions`, `isLoading`, `markdown` (CommonMark + LaTeX), `metadata`, `navigationTitle`

Markdown extras: `?raycast-width=250&raycast-height=250` for image sizing, `?raycast-tint-color=blue` for tinting.

**Metadata sub-components:**
- `Detail.Metadata.Label` - `title*`, `text`, `icon`
- `Detail.Metadata.Link` - `target*`, `text*`, `title*`
- `Detail.Metadata.TagList` - `children*`, `title*`
- `Detail.Metadata.TagList.Item` - `text`, `color`, `icon`, `onAction`
- `Detail.Metadata.Separator`

### Form

**Props:** `actions`, `children`, `enableDrafts`, `isLoading`, `navigationTitle`, `searchBarAccessory`

**Form items (all share `id*`, `autoFocus`, `defaultValue`/`value`, `error`/`info`, `onChange`/`onBlur`/`onFocus`, `storeValue`, `title`):**

| Component | Specific Props | Returns |
|-----------|---------------|---------|
| `Form.TextField` | `placeholder` | `string` |
| `Form.PasswordField` | `placeholder` | `string` |
| `Form.TextArea` | `enableMarkdown` | `string` |
| `Form.Checkbox` | `label*` | `boolean` |
| `Form.DatePicker` | `type`, `min`, `max` | `Date` |
| `Form.Dropdown` | `filtering`, `isLoading`, `onSearchTextChange`, `placeholder`, `throttle` | `string` |
| `Form.TagPicker` | `placeholder` | `string[]` |
| `Form.FilePicker` | `allowMultipleSelection`, `canChooseFiles`, `canChooseDirectories` | `string[]` |
| `Form.Separator` | none | - |
| `Form.Description` | `text` | - |

### Grid

**Props:** `columns` (1-8), `aspectRatio` (`"1"`, `"3/2"`, `"2/3"`, `"4/3"`, `"3/4"`, `"16/9"`, `"9/16"`), `fit` (`Grid.Fit.Contain`/`Fill`), `inset` (`Grid.Inset.Small`/`Medium`/`Large`), plus same filtering/pagination/search props as List.

**Grid.Item:** `content*` (Image.ImageLike | {color} | {tooltip, value}), `accessory`, `actions`, `id`, `keywords`, `quickLook`, `subtitle`, `title`

### ActionPanel

**Props:** `children`, `title`. First action = primary (Enter), second = secondary (Cmd+Enter).

**ActionPanel.Section:** `children`, `title`
**ActionPanel.Submenu:** `title*`, `autoFocus`, `children`, `filtering`, `icon`, `isLoading`, `shortcut`

### Built-in Actions

| Action | Required Props | Key Optional Props |
|--------|---------------|-------------------|
| `Action` | `title` | `onAction`, `icon`, `shortcut`, `style` |
| `Action.CopyToClipboard` | `content` | `concealed`, `onCopy` |
| `Action.OpenInBrowser` | `url` | `onOpen` |
| `Action.Open` | `target`, `title` | `application`, `onOpen` |
| `Action.OpenWith` | `path` | `onOpen` |
| `Action.Paste` | `content` | `onPaste` |
| `Action.Push` | `target`, `title` | `onPush`, `onPop` |
| `Action.ShowInFinder` | `path` | `onShow` |
| `Action.SubmitForm` | - | `onSubmit`, `style` |
| `Action.Trash` | `paths` | `onTrash` |
| `Action.CreateSnippet` | `snippet: {text*, name?, keyword?}` | - |
| `Action.CreateQuicklink` | `quicklink: {link*, name?, icon?}` | - |
| `Action.ToggleQuickLook` | - | - |
| `Action.PickDate` | `title`, `onChange` | `type`, `min`, `max` |

**Action.Style:** `Regular`, `Destructive`

### MenuBarExtra (macOS only)

**Props:** `children`, `icon`, `isLoading`, `title`, `tooltip`

**Sub-components:**
- `MenuBarExtra.Item` - `title*`, `alternate`, `icon`, `onAction`, `shortcut`, `subtitle`, `tooltip`
- `MenuBarExtra.Submenu` - `title*`, `children`, `icon`
- `MenuBarExtra.Section` - `children`, `title`
- `MenuBarExtra.Separator`

Must set `isLoading` to `false` when async ops complete. Return `null` to hide from menu bar.

### Navigation

```typescript
const { push, pop } = useNavigation();
push(component: React.ReactNode, onPop?: () => void): void
pop(): void
```

Prefer `Action.Push` over imperative navigation.

### Toast & HUD

```typescript
await showToast({ style: Toast.Style.Animated, title: "Loading..." });
await showToast({ style: Toast.Style.Success, title: "Done!" });
await showToast({ style: Toast.Style.Failure, title: "Error", message: "Details here" });

// Toast with actions:
await showToast({
  style: Toast.Style.Failure,
  title: "Failed",
  primaryAction: { title: "Retry", onAction: (toast) => { /* retry */ } },
});

// HUD (non-blocking):
await showHUD("Copied to clipboard");
```

### Alert

```typescript
const confirmed = await confirmAlert({
  title: "Delete item?",
  message: "This cannot be undone",
  primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
});
```

---

## Core APIs

### Clipboard

```typescript
await Clipboard.copy("text");                           // Copy text
await Clipboard.copy({ file: "/path/to/file" });        // Copy file
await Clipboard.copy({ html: "<b>bold</b>" });          // Copy HTML
await Clipboard.paste("text");                          // Paste to frontmost app
const { text } = await Clipboard.read();                // Read clipboard
const text = await Clipboard.readText();                // Read as string
await Clipboard.clear();                                // Clear
```

### LocalStorage

```typescript
await LocalStorage.setItem("key", "value");             // string | number | boolean
const val = await LocalStorage.getItem<string>("key");  // typed get
await LocalStorage.removeItem("key");
const all = await LocalStorage.allItems();              // { [key: string]: any }
await LocalStorage.clear();
```

Encrypted, per-extension, shared across commands.

### Cache

```typescript
const cache = new Cache({ capacity: 10 * 1024 * 1024, namespace: "my-cmd" });
cache.set("key", JSON.stringify(data));
const val = cache.get("key");  // string | undefined
cache.has("key");              // boolean
cache.remove("key");           // boolean
cache.clear();
```

Disk-based LRU. Manual JSON serialization. Default 10MB.

### Environment

```typescript
environment.isDevelopment     // boolean
environment.appearance        // "dark" | "light"
environment.commandMode       // "view" | "no-view" | "menu-bar"
environment.extensionName     // string
environment.commandName       // string
environment.assetsPath        // string (path to assets/)
environment.supportPath       // string (writable path for extension data)
environment.launchType        // LaunchType.UserInitiated | LaunchType.Background
environment.canAccess(AI)     // check Pro feature access
```

### Preferences

```typescript
const prefs = getPreferenceValues<{ apiKey: string; debug: boolean }>();
await openExtensionPreferences();
await openCommandPreferences();
```

### System Utilities

```typescript
const apps = await getApplications();
const app = await getFrontmostApplication();
await showInFinder("/path/to/file");
await trash("/path/to/file");
await open("https://example.com");
await open("/path/to/file", "com.apple.TextEdit");
```

### Command Communication

```typescript
// Launch another command in same extension
await launchCommand({ name: "other-command", type: LaunchType.UserInitiated, context: { key: "value" } });

// Launch command in different extension
await launchCommand({
  name: "search",
  type: LaunchType.UserInitiated,
  extensionName: "github",
  ownerOrAuthorName: "raycast",
});

// Update command subtitle at runtime
await updateCommandMetadata({ subtitle: "3 items" });
```

### LaunchProps

```typescript
export default function Command(props: LaunchProps<{
  arguments: { query: string };
  launchContext: { source: string };
}>) {
  const { query } = props.arguments;
  const launchType = props.launchType;    // UserInitiated | Background
  const fallback = props.fallbackText;    // root search text if fallback command
  const drafts = props.draftValues;       // saved form drafts
  const context = props.launchContext;    // data from launchCommand
}
```

### Browser Extension API (macOS only)

```typescript
if (environment.canAccess(BrowserExtension)) {
  const content = await BrowserExtension.getContent({ format: "markdown" });
  const tabs = await BrowserExtension.getTabs();
}
```

### Window Management (macOS, Pro)

```typescript
if (environment.canAccess(WindowManagement)) {
  const window = await getActiveWindow();
  await setWindowBounds({ id: window.id, bounds: { size: { width: 800, height: 600 } } });
}
```

---

## OAuth

### PKCE Client

```typescript
const client = new OAuth.PKCEClient({
  providerName: "GitHub",
  redirectMethod: OAuth.RedirectMethod.Web,
  description: "Connect your GitHub account",
  providerIcon: { source: "github.png" },
  providerId: "github",
});
```

### Built-in OAuth Services (@raycast/utils)

```typescript
import { OAuthService } from "@raycast/utils";

const github = OAuthService.github({ scope: "repo read:user" });
// Built-in: asana, github, google, jira, linear, slack, zoom

// Custom:
const service = new OAuthService({
  client,
  clientId: "xxx",
  scope: "read write",
  authorizeUrl: "https://provider.com/authorize",
  tokenUrl: "https://provider.com/token",
});
```

### withAccessToken wrapper

```typescript
import { withAccessToken, getAccessToken } from "@raycast/utils";

function MyCommand() {
  const { token } = getAccessToken();
  // use token for API calls
}

export default withAccessToken({ authorize: github.authorize })(MyCommand);
```

---

## AI API (Raycast Pro)

```typescript
if (environment.canAccess(AI)) {
  const answer = await AI.ask("Summarize this text", {
    model: AI.Model["Anthropic_Claude_Sonnet"],
    creativity: "low",
  });

  // Streaming:
  const stream = AI.ask("Generate a story");
  stream.on("data", (chunk) => console.log(chunk));
  const full = await stream;
}
```

---

## AI Extensions (Tools)

### Tool definition (src/tools/my-tool.ts)

```typescript
type Input = {
  /** Description for AI to understand the parameter */
  query: string;
};

/** Tool description - AI uses this to decide when to call the tool */
export default async function tool(input: Input) {
  const results = await fetchResults(input.query);
  return JSON.stringify(results);
}
```

### Tool confirmation

```typescript
import { Tool } from "@raycast/api";

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `Search for "${input.query}"?`,
    info: [{ name: "Query", value: input.query }],
  };
};
```

### Manifest for AI tools

```json
{
  "tools": [
    { "name": "search", "title": "Search", "description": "Search for items" }
  ],
  "ai": {
    "instructions": "When the user asks to find items, use the search tool.",
    "evals": [
      {
        "input": "@my-ext find raycast",
        "expected": [{ "callsTool": "search" }]
      }
    ]
  }
}
```

---

## Utility Hooks (@raycast/utils)

### useFetch

```typescript
const { data, isLoading, error, revalidate, mutate } = useFetch<T>("https://api.example.com/items", {
  parseResponse: async (response) => await response.json(),
  keepPreviousData: true,
  execute: true,
  onError: (error) => showFailureToast(error),
});

// Paginated:
const { data, isLoading, pagination } = useFetch(
  (options) => `https://api.example.com/items?page=${options.page + 1}`,
  {
    mapResult: (result) => ({ data: result.items, hasMore: result.hasMore }),
  }
);
return <List isLoading={isLoading} pagination={pagination}>...</List>;
```

### usePromise

```typescript
const { data, isLoading, revalidate } = usePromise(
  async (query: string) => { return await fetchItems(query); },
  ["initial-query"],
  { onError: (error) => showFailureToast(error) }
);
```

### useCachedPromise

Same API as `usePromise` but caches results between command runs. Values must be JSON serializable.

### useExec

```typescript
// Preferred: file + args array (no escaping needed)
const { data, isLoading } = useExec("brew", ["list", "--formula"], {
  parseOutput: ({ stdout }) => stdout.split("\n").filter(Boolean),
});

// Single command string
const { data } = useExec("echo hello world", { shell: true });
```

Default timeout: 10 seconds.

### useForm

```typescript
const { handleSubmit, itemProps, setValue, values, focus, reset } = useForm<{
  name: string;
  email: string;
}>({
  onSubmit: (values) => { console.log(values); },
  initialValues: { name: "", email: "" },
  validation: {
    name: FormValidation.Required,
    email: (value) => {
      if (!value?.includes("@")) return "Invalid email";
    },
  },
});
```

### useLocalStorage

```typescript
const { value, setValue, removeValue, isLoading } = useLocalStorage<string[]>("recent-items", []);
```

### useCachedState

```typescript
const [items, setItems] = useCachedState<Item[]>("items", []);
```

Persists across command runs. JSON serializable values only.

### useSQL

```typescript
const { data, isLoading, permissionView } = useSQL<Message>(
  "/path/to/database.db",
  "SELECT * FROM messages LIMIT 100",
  { permissionPriming: "This extension needs access to read your messages." }
);
if (permissionView) return permissionView;
```

### useAI

```typescript
const { data, isLoading } = useAI("Summarize: " + text, {
  model: AI.Model["Anthropic_Claude_Haiku"],
  creativity: 0.5,
  stream: true,
});
```

### useFrecencySorting

```typescript
const { data: sortedItems, visitItem, resetRanking } = useFrecencySorting(items, {
  key: (item) => item.id,
});
// Call visitItem(item) when user selects an item
```

### Utility Functions

```typescript
import { showFailureToast, getFavicon, getProgressIcon, createDeeplink, runAppleScript } from "@raycast/utils";

await showFailureToast(error, { title: "Failed to load" });

const favicon = getFavicon("https://example.com");              // Image.ImageLike
const progress = getProgressIcon(0.5);                          // half-filled circle
const link = createDeeplink({ command: "search", arguments: { query: "test" } });
const result = await runAppleScript('tell application "Finder" to get name of every window');
```

---

## Deeplinks

```typescript
import { createDeeplink, DeeplinkType } from "@raycast/utils";

// Same extension
createDeeplink({ command: "search", arguments: { query: "test" } });

// Other extension
createDeeplink({
  ownerOrAuthorName: "raycast",
  extensionName: "github",
  command: "search-repos",
});

// Script command
createDeeplink({
  type: DeeplinkType.ScriptCommand,
  command: "my-script",
  arguments: ["arg1"],
});
```

---

## Colors & Icons

### Color enum
`Blue`, `Green`, `Magenta`, `Orange`, `Purple`, `Red`, `Yellow`, `PrimaryText`, `SecondaryText`

### Dynamic colors
```typescript
{ light: "#000000", dark: "#FFFFFF", adjustContrast: true }
```

### Raw colors
HEX (`#FF0000`), RGB (`rgb(255,0,0)`), HSL, CSS keywords

### Icon enum (300+ members)
Common: `AddPerson`, `ArrowRight`, `Bell`, `Bolt`, `Book`, `Bug`, `Calendar`, `Check`, `CheckCircle`, `Clipboard`, `Clock`, `Cloud`, `Code`, `Cog`, `Compass`, `CopyClipboard`, `Document`, `Download`, `Envelope`, `Eye`, `Filter`, `Finder`, `Folder`, `Gear`, `Globe`, `Heart`, `House`, `Key`, `Link`, `List`, `MagicWand`, `Message`, `Note`, `Pencil`, `Person`, `Pin`, `Play`, `Plus`, `Search`, `Star`, `Terminal`, `Trash`, `Warning`, `Wrench`

### Image types
```typescript
{ source: "icon.png", tintColor: Color.Blue, mask: Image.Mask.Circle, fallback: Icon.Globe }
```

---

## Keyboard Shortcuts

```typescript
shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}

// Platform-specific:
shortcut={{
  macOS: { modifiers: ["cmd"], key: "n" },
  Windows: { modifiers: ["ctrl"], key: "n" }
}}
```

**Modifiers:** `cmd`, `ctrl`, `opt`, `shift`, `alt`, `windows`

### Common built-in shortcuts
`Keyboard.Shortcut.Common.Copy`, `Save`, `Edit`, `New`, `Open`, `Pin`, `Refresh`, `Remove`, `RemoveAll`, `ToggleQuickLook`, `MoveUp`, `MoveDown`, `Duplicate`
