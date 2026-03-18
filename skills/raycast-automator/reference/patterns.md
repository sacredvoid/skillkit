# Raycast Development Patterns & Best Practices

## Script Command vs Extension Decision Matrix

| Signal | Script | Extension |
|--------|--------|-----------|
| Simple system op (open, toggle, copy) | X | |
| Opens URL with query | X | |
| Clipboard transform | X | |
| Runs shell command | X | |
| 1-3 text inputs, no interactive UI | X | |
| Quick personal hack | X | |
| Mac-native automation (AppleScript) | X | |
| Needs searchable list UI | | X |
| Needs forms with validation | | X |
| Needs detail views with markdown | | X |
| Needs image grid | | X |
| Needs OAuth/token management | | X |
| Needs persistent state | | X |
| Needs menu bar presence | | X |
| Needs pagination/infinite scroll | | X |
| Publishing to Store | | X |
| Multiple related commands | | X |
| Background refresh with UI | | X |
| AI tools (@mention) | | X |

## Common Extension Patterns

### 1. Fetch + List (most common)

Search/browse items from an API:

```typescript
import { List, ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";

interface Item {
  id: string;
  title: string;
  url: string;
  description: string;
}

export default function Command() {
  const { data, isLoading } = useFetch<Item[]>("https://api.example.com/items");

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search items...">
      {data?.map((item) => (
        <List.Item
          key={item.id}
          title={item.title}
          subtitle={item.description}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={item.url} />
              <Action.CopyToClipboard content={item.url} shortcut={{ modifiers: ["cmd"], key: "c" }} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
```

### 2. List with Detail Panel

Split view showing details for selected item:

```typescript
import { List } from "@raycast/api";
import { useFetch } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = useFetch<Item[]>("https://api.example.com/items");

  return (
    <List isLoading={isLoading} isShowingDetail>
      {data?.map((item) => (
        <List.Item
          key={item.id}
          title={item.title}
          detail={
            <List.Item.Detail
              markdown={`# ${item.title}\n\n${item.body}`}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Status" text={item.status} />
                  <List.Item.Detail.Metadata.Link title="URL" target={item.url} text="Open" />
                  <List.Item.Detail.Metadata.TagList title="Tags">
                    {item.tags.map((tag) => (
                      <List.Item.Detail.Metadata.TagList.Item key={tag} text={tag} />
                    ))}
                  </List.Item.Detail.Metadata.TagList>
                </List.Item.Detail.Metadata>
              }
            />
          }
        />
      ))}
    </List>
  );
}
```

### 3. Search with API Filtering

Server-side search (disable built-in filtering):

```typescript
import { List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const { data, isLoading } = useFetch<Item[]>(
    `https://api.example.com/search?q=${encodeURIComponent(searchText)}`,
    { execute: searchText.length > 0 }
  );

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search..."
      throttle
    >
      {data?.map((item) => (
        <List.Item key={item.id} title={item.title} />
      ))}
    </List>
  );
}
```

### 4. No-View Command (clipboard transform)

```typescript
import { showToast, Toast, Clipboard, showHUD } from "@raycast/api";

export default async function Command() {
  const text = await Clipboard.readText();
  if (!text) {
    await showToast(Toast.Style.Failure, "Clipboard is empty");
    return;
  }

  try {
    const result = JSON.stringify(JSON.parse(text), null, 2);
    await Clipboard.copy(result);
    await showHUD("Formatted JSON copied");
  } catch {
    await showToast(Toast.Style.Failure, "Invalid JSON in clipboard");
  }
}
```

### 5. Form with Validation

```typescript
import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";

interface FormValues {
  title: string;
  priority: string;
  description: string;
}

export default function Command() {
  const { handleSubmit, itemProps } = useForm<FormValues>({
    async onSubmit(values) {
      await createItem(values);
      await showToast(Toast.Style.Success, "Created", values.title);
    },
    validation: {
      title: FormValidation.Required,
      priority: FormValidation.Required,
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Item" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField title="Title" placeholder="Enter title" {...itemProps.title} />
      <Form.Dropdown title="Priority" {...itemProps.priority}>
        <Form.Dropdown.Item value="high" title="High" />
        <Form.Dropdown.Item value="medium" title="Medium" />
        <Form.Dropdown.Item value="low" title="Low" />
      </Form.Dropdown>
      <Form.TextArea title="Description" placeholder="Optional" {...itemProps.description} />
    </Form>
  );
}
```

### 6. List with Dropdown Filter

```typescript
import { List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";

export default function Command() {
  const [category, setCategory] = useState("all");
  const { data, isLoading } = useFetch<Item[]>(
    `https://api.example.com/items?category=${category}`
  );

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown tooltip="Category" onChange={setCategory}>
          <List.Dropdown.Item value="all" title="All" />
          <List.Dropdown.Item value="active" title="Active" />
          <List.Dropdown.Item value="archived" title="Archived" />
        </List.Dropdown>
      }
    >
      {data?.map((item) => (
        <List.Item key={item.id} title={item.title} />
      ))}
    </List>
  );
}
```

### 7. Menu Bar Command

```typescript
import { MenuBarExtra, open } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = useCachedPromise(fetchNotifications);

  return (
    <MenuBarExtra
      icon={{ source: "bell.png" }}
      title={data?.length ? `${data.length}` : undefined}
      isLoading={isLoading}
      tooltip="Notifications"
    >
      {data?.length === 0 ? (
        <MenuBarExtra.Item title="No notifications" />
      ) : (
        data?.map((n) => (
          <MenuBarExtra.Item
            key={n.id}
            title={n.title}
            subtitle={n.time}
            onAction={() => open(n.url)}
          />
        ))
      )}
    </MenuBarExtra>
  );
}
```

### 8. Paginated List

```typescript
import { List } from "@raycast/api";
import { useFetch } from "@raycast/utils";

export default function Command() {
  const { data, isLoading, pagination } = useFetch(
    (options) => `https://api.example.com/items?page=${options.page + 1}&limit=20`,
    {
      mapResult(result: { items: Item[]; total: number }) {
        return {
          data: result.items,
          hasMore: result.items.length === 20,
        };
      },
    }
  );

  return (
    <List isLoading={isLoading} pagination={pagination}>
      {data?.map((item) => (
        <List.Item key={item.id} title={item.title} />
      ))}
    </List>
  );
}
```

### 9. Grid (Image Gallery)

```typescript
import { Grid, ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = useFetch<Image[]>("https://api.example.com/images");

  return (
    <Grid columns={4} isLoading={isLoading} aspectRatio="3/2" fit={Grid.Fit.Fill}>
      {data?.map((img) => (
        <Grid.Item
          key={img.id}
          content={img.thumbnailUrl}
          title={img.title}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser url={img.fullUrl} />
            </ActionPanel>
          }
        />
      ))}
    </Grid>
  );
}
```

### 10. OAuth-Protected API

```typescript
import { List } from "@raycast/api";
import { useFetch, OAuthService, withAccessToken, getAccessToken } from "@raycast/utils";

const github = OAuthService.github({ scope: "repo read:user" });

function SearchRepos() {
  const { token } = getAccessToken();
  const { data, isLoading } = useFetch<{ items: Repo[] }>(
    "https://api.github.com/user/repos?sort=updated",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return (
    <List isLoading={isLoading}>
      {data?.items?.map((repo) => (
        <List.Item key={repo.id} title={repo.name} subtitle={repo.description} />
      ))}
    </List>
  );
}

export default withAccessToken({ authorize: github.authorize })(SearchRepos);
```

### 11. Shell Command Integration

```typescript
import { List, ActionPanel, Action } from "@raycast/api";
import { useExec } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = useExec("brew", ["list", "--formula"], {
    parseOutput: ({ stdout }) =>
      stdout.split("\n").filter(Boolean).map((name) => ({ id: name, name })),
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Filter packages...">
      {data?.map((pkg) => (
        <List.Item
          key={pkg.id}
          title={pkg.name}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={`brew install ${pkg.name}`} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
```

### 12. Detail View (Single Item)

```typescript
import { Detail, ActionPanel, Action } from "@raycast/api";
import { useFetch } from "@raycast/utils";

export default function Command() {
  const { data, isLoading } = useFetch<Article>("https://api.example.com/article/1");

  const markdown = data
    ? `# ${data.title}\n\n${data.content}`
    : "";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      metadata={
        data ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Author" text={data.author} />
            <Detail.Metadata.Label title="Date" text={data.date} />
            <Detail.Metadata.Separator />
            <Detail.Metadata.Link title="Source" target={data.url} text="Open" />
          </Detail.Metadata>
        ) : undefined
      }
      actions={
        <ActionPanel>
          {data && <Action.OpenInBrowser url={data.url} />}
        </ActionPanel>
      }
    />
  );
}
```

---

## Anti-Patterns

### 1. Don't use `filtering={true}` with `onSearchTextChange`
Setting `onSearchTextChange` implicitly disables built-in filtering. Explicitly setting `filtering={true}` creates a conflict.

### 2. Don't forget `isLoading`
Always set `isLoading` on the top-level component. Without it, users see a blank screen during async ops.

### 3. Don't use large data in LocalStorage
LocalStorage only supports `string | number | boolean`. For complex objects, use JSON serialization. For large datasets, use Node.js file APIs or Cache.

### 4. Don't block the UI with sync operations
Long-running sync code freezes Raycast. Use async operations and show loading states.

### 5. Don't use `console.error` for user-facing errors
Use `showToast(Toast.Style.Failure)` or `showFailureToast` from @raycast/utils.

### 6. Don't use imperative navigation when Action.Push works
`Action.Push` handles the navigation stack cleanly. Use `useNavigation` only for programmatic navigation.

### 7. Don't modify the root `navigationTitle`
Let Raycast handle the navigation title. Override only within pushed views.

### 8. Don't create duplicate MenuBarExtra.Items at the same level
Duplicate items at the same level cause handler conflicts.

### 9. Don't hot-reload during OAuth flows
File changes during authorization cause state mismatch. Save files before starting OAuth.

### 10. Don't skip `environment.canAccess()` checks
Pro features (AI, WindowManagement, BrowserExtension) throw if user lacks access. Always check first.

---

## Store Preparation Checklist

- [ ] License set to `"MIT"` in package.json
- [ ] Using `npm` with `package-lock.json` (not yarn/pnpm)
- [ ] Extension and command titles in Title Case
- [ ] Command titles use `<verb> <noun>` format
- [ ] Custom icon (512x512 PNG), not default Raycast icon
- [ ] Icon generated at icon.ray.so or custom
- [ ] `icon@dark.png` variant included
- [ ] Screenshots: 2000x1250 PNG (16:10), 3-6 recommended
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Using Raycast Preferences API for config (no dotenv, no config files)
- [ ] No external analytics
- [ ] US English only
- [ ] No Keychain Access
- [ ] CHANGELOG.md with `## [Title] - {DATE}` format
- [ ] Categories use exact values from allowed list
- [ ] `author` matches Raycast Store username
- [ ] All text fields have placeholders
- [ ] EmptyView for zero-state
- [ ] Action Panel uses Title Case and consistent icons
- [ ] Errors shown as Toasts, not crashes

---

## File Structure Conventions

### Extension

```
extension-name/
├── package.json          # Manifest with Raycast metadata
├── tsconfig.json         # TypeScript config
├── package-lock.json     # Dependency lock
├── CHANGELOG.md          # Version history
├── assets/
│   ├── command-icon.png  # Extension icon (512x512)
│   └── command-icon@dark.png
├── src/
│   ├── index.tsx         # Main command (name matches manifest)
│   ├── other-command.tsx  # Additional commands
│   └── tools/
│       └── my-tool.ts    # AI tools
├── media/                # Store screenshots
│   ├── screenshot-1.png
│   └── screenshot-2.png
└── node_modules/
```

### Script commands directory

```
~/Documents/raycast-scripts/
├── search-google.sh
├── toggle-wifi.sh
├── decode-jwt.sh
├── format-json.py
├── close-finder-windows.applescript
└── images/               # Optional icons
    ├── google.png
    └── jwt-logo.png
```

---

## Performance Tips

1. **Render immediately** with empty state, load data async
2. **Use `useCachedPromise`** for data that doesn't change often
3. **Use `throttle` prop** on `onSearchTextChange` for API-based search
4. **Use `keepPreviousData`** to avoid flickering between searches
5. **Use Cache API** in menu bar commands for instant rendering on click
6. **Use `execute: false`** to defer API calls until needed
7. **Use pagination** for large datasets instead of loading everything
8. **Use `useFrecencySorting`** to surface frequently-used items

---

## Debugging

- **Console**: `console.log/debug/error` output in terminal during `npm run dev`
- **React DevTools**: Install `react-devtools@6.1.1`, launch with `Cmd+Opt+D`
- **VS Code**: Install Raycast VS Code extension, "Raycast: Attach Debugger"
- **Error overlays**: Stack traces with jump-to-error in dev mode
- **Environment check**: `environment.isDevelopment` or `process.env.NODE_ENV === "development"`
- **Extension Issues**: https://www.raycast.com/extension-issues (post-publish)
