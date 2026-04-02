# x-twitter MCP Server

[![MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNXYtNEg3bDUtOXY0aDRsLTUgOXoiLz48L3N2Zz4=&logoColor=white)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)
[![Powered by xurl](https://img.shields.io/badge/Powered%20by-xurl-1d9bf0?logo=x&logoColor=white)](https://github.com/xdevplatform/xurl)
[![X API v2](https://img.shields.io/badge/X%20API-v2-black?logo=x&logoColor=white)](https://developer.x.com)
[![Tools](https://img.shields.io/badge/MCP%20Tools-49-purple)](https://github.com/mrdulasolutions/x-tweet--claude-plugin)
[![GitHub Stars](https://img.shields.io/github/stars/mrdulasolutions/x-tweet--claude-plugin?style=social)](https://github.com/mrdulasolutions/x-tweet--claude-plugin)

**Post, read, search, and manage your X account and community from any MCP-compatible AI agent — no browser required.**

A zero-dependency MCP server wrapping [xurl](https://github.com/xdevplatform/xurl), the official X CLI by the X Developer Platform. Exposes 49 tools across the full X API v2 surface: community posts, timeline, search, engagement, DMs, lists, spaces, trends, media upload, and a raw API passthrough for anything else.

Works with **Claude Code**, **Cursor**, **Windsurf**, **Cline**, **Continue**, **Goose**, **OpenAI Agents**, or any host that speaks the [Model Context Protocol](https://modelcontextprotocol.io).

---

## What This Does

Your agent talks to X. You don't have to open the app.

```
Agent prompt:  "Post to my X community: Excited to share our new plugin launch!"
Tool call:     x_community_post({ text: "Excited to share our new plugin launch!" })
Result:        Posted. Tweet ID: 1907654321098765432
```

```
Agent prompt:  "Search X for 'export compliance AI' and summarize the top 5"
Tool call:     x_search({ query: "export compliance AI", count: 5 })
Result:        Here's what's trending in that space...
```

```
Agent prompt:  "Upload this screenshot and post it to my community with a caption"
Tool calls:    x_upload_media({ file_path: "..." }) → x_community_post_with_media({ ... })
Result:        Done. Media ID attached.
```

---

## Architecture

```
AI Agent (any MCP host)
       │
       ▼
  MCP Server (x-mcp-server.mjs)   ← 49 tools, stdio JSON-RPC transport
       │                              zero npm dependencies, single file
       ▼
  xurl binary                     ← official X CLI, handles OAuth + API calls
       │
       ▼
  X API v2  (+v1.1 for trends)
```

The server communicates over stdin/stdout using the MCP JSON-RPC protocol (`2024-11-05`). All OAuth signing and token management is handled by xurl — this server just shells out to it.

---

## MCP Host Setup

### Claude Code

```bash
claude plugin install .
```

Or add to your `claude_desktop_config.json` / `.mcp.json` manually (see Configuration below).

### Cursor / Windsurf / Cline / Continue

Add to your MCP settings file (location varies by host):

```json
{
  "mcpServers": {
    "x-twitter": {
      "command": "node",
      "args": ["/absolute/path/to/x-twitter/servers/x-mcp-server.mjs"],
      "env": {
        "XURL_PATH": "/opt/homebrew/bin/xurl",
        "X_COMMUNITY_ID": "your_community_id_here"
      }
    }
  }
}
```

### OpenAI Agents SDK / Other MCP clients

Point the server at the `.mjs` file via `node`. The server speaks standard MCP over stdio — no custom transport or SDK needed.

```python
# Example: OpenAI Agents SDK
from agents.mcp import MCPServerStdio

server = MCPServerStdio(
    command="node",
    args=["/path/to/x-twitter/servers/x-mcp-server.mjs"],
    env={"XURL_PATH": "/opt/homebrew/bin/xurl", "X_COMMUNITY_ID": "..."}
)
```

### Verify the server starts

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  | node /path/to/x-twitter/servers/x-mcp-server.mjs
```

Should return a JSON response with `serverInfo: { name: "x-twitter", version: "0.2.0" }`.

---

## xurl Setup

xurl handles all X authentication. This only needs to be done once.

### 1. Install xurl

```bash
brew install --cask xdevplatform/tap/xurl
```

Or via npm:

```bash
npm install -g @xdevplatform/xurl
```

```bash
xurl version   # verify
```

### 2. Create an X Developer App

1. Go to [developer.x.com](https://developer.x.com) and create a project + app
2. Under **User authentication settings**, enable **OAuth 2.0**
3. Set **Type of App** to **Web App**
4. Add callback URI: `http://localhost:8080/callback`
5. Set **App permissions** to **Read and Write**
6. Enable scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`
7. Copy your **Client ID** and **Client Secret**

### 3. Register your app with xurl

```bash
xurl auth apps add myapp \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET
```

### 4. Authenticate (OAuth 2.0)

```bash
xurl auth oauth2
```

Opens your browser for authorization. Approve, and xurl stores the token locally.

### 5. (Optional) OAuth 1.0a for trends

`x_trends` and `x_trend_locations` use the v1.1 API and require OAuth 1.0a:

```bash
xurl auth oauth1 \
  --consumer-key YOUR_API_KEY \
  --consumer-secret YOUR_API_SECRET \
  --access-token YOUR_ACCESS_TOKEN \
  --access-token-secret YOUR_ACCESS_TOKEN_SECRET
```

All four values are in Developer Portal → your app → **Keys and Tokens**.

### 6. Set your default app

```bash
xurl auth default "myapp"
```

### 7. Verify

```bash
xurl whoami   # returns your profile JSON
```

---

## Configuration

Configured via environment variables passed by your MCP host:

| Variable         | Required | Default                      | Description                         |
|------------------|----------|------------------------------|-------------------------------------|
| `XURL_PATH`      | No       | `/opt/homebrew/bin/xurl`     | Full path to your xurl binary       |
| `X_COMMUNITY_ID` | No       | *(empty)*                    | Default community ID for all posts  |

### Finding your Community ID

```
https://x.com/i/communities/2039109548405907598
                              ^^^^^^^^^^^^^^^^^^
                              This is your community ID
```

### Per-call override

Every community tool accepts an optional `community_id` argument that overrides the env var for that specific call.

---

## Tools Reference (49 total)

### Community (4)

| Tool | Description |
|------|-------------|
| `x_community_post` | Post text to your community. Supports `share_with_followers` and `reply_settings`. |
| `x_community_post_with_media` | Post text + uploaded media to your community. |
| `x_community_lookup` | Look up a community by ID — name, description, member count. |
| `x_community_search` | Search for X Communities by keyword. |

### Posting & Replies (6)

| Tool | Description |
|------|-------------|
| `x_post` | Post a tweet to your main timeline. |
| `x_reply` | Reply to a specific tweet by ID. |
| `x_quote` | Quote a tweet with your own commentary. |
| `x_post_advanced` | Full-parameter post: polls, geo, reply_settings, super followers, AI disclosure, paid partnership, media, community, quote. |
| `x_edit_post` | Edit an existing post (within X's edit window). |
| `x_delete_tweet` | Delete a tweet by ID. |

### Reading (4)

| Tool | Description |
|------|-------------|
| `x_read` | Read a specific tweet by ID. |
| `x_timeline` | Your home timeline. |
| `x_mentions` | Your recent @mentions. |
| `x_search` | Search recent tweets (7-day window). Supports operators: `from:`, `to:`, `has:media`, `-is:retweet`, etc. |

### Engagement (8)

| Tool | Description |
|------|-------------|
| `x_like` | Like a tweet. |
| `x_unlike` | Unlike a tweet. |
| `x_repost` | Repost (retweet) a tweet. |
| `x_unrepost` | Undo a repost. |
| `x_bookmark` | Bookmark a tweet. |
| `x_unbookmark` | Remove a bookmark. |
| `x_bookmarks` | List all your bookmarked tweets. |
| `x_likes` | List all your liked tweets. |

### Users & Social Graph (10)

| Tool | Description |
|------|-------------|
| `x_whoami` | Your authenticated profile. |
| `x_user` | Look up any user by @username. |
| `x_follow` | Follow a user. |
| `x_unfollow` | Unfollow a user. |
| `x_block` | Block a user. |
| `x_unblock` | Unblock a user. |
| `x_mute` | Mute a user. |
| `x_unmute` | Unmute a user. |
| `x_followers` | List your followers. |
| `x_following` | List who you follow. |

### Direct Messages (2)

| Tool | Description |
|------|-------------|
| `x_dm` | Send a Direct Message to a user. |
| `x_dms` | List your recent Direct Messages. |

### Lists (6)

| Tool | Description |
|------|-------------|
| `x_list_create` | Create a new list (public or private). |
| `x_list_lookup` | Look up a list by ID. |
| `x_list_members` | Get the members of a list. |
| `x_list_add_member` | Add a user to a list by user ID. |
| `x_list_tweets` | Get recent tweets from a list's timeline. |
| `x_my_lists` | Get all lists you own. |

### Spaces (2)

| Tool | Description |
|------|-------------|
| `x_spaces_search` | Search for live or scheduled X Spaces. Filter by state: `live`, `scheduled`, or `all`. |
| `x_space_lookup` | Look up a Space by ID — title, host, participant count, state. |

### Trends (2)

| Tool | Description |
|------|-------------|
| `x_trends` | Get trending topics. Accepts WOEID (`1` = worldwide, `23424977` = US). Requires OAuth 1.0a. |
| `x_trend_locations` | List all locations X has trend data for. |

### Media (1)

| Tool | Description |
|------|-------------|
| `x_upload_media` | Upload an image or video from a local file path. Returns a `media_id` to use in posts. |

### Webhook (1)

| Tool | Description |
|------|-------------|
| `x_webhook_start` | Start a local webhook listener for X API events. Uses ngrok for a public URL. Requires ngrok installed. |

### Utility (3)

| Tool | Description |
|------|-------------|
| `x_raw_api` | Hit any X API endpoint directly. Full GET/POST/PUT/DELETE. Escape hatch for anything not covered above. |
| `x_version` | Show xurl version and build info. |
| `x_auth_status` | Check your current xurl authentication status. |

---

## Rate Limits

The MCP server does not throttle or queue. If you hit a limit, xurl returns a 429 and your agent surfaces it.

| Tier | POST /2/tweets | GET endpoints | Search |
|------|---------------|---------------|--------|
| Free | 17/day | 15–75 req/15min | 60 req/15min |
| Basic ($100/mo) | 100/day | Higher | Higher |
| Pro ($5k/mo) | 10,000/day | Much higher | Much higher |

Polls, quote tweets, and replies all consume your POST quota. Community posts use the same `/2/tweets` endpoint and count against the same limit.

---

## Known Limitations

- **Replies and cold quote tweets may 403** on free/basic tiers due to X's anti-bot enforcement ("Operation Kill the Bots", Feb 2026). Direct posts and community posts are unaffected.
- **Trends require OAuth 1.0a**. The v1.1 trends API doesn't accept OAuth 2.0 tokens. Run `xurl auth oauth1 ...` separately.
- **DMs require elevated access**. Enable "Read, Write, and Direct Messages" in Developer Portal and re-authenticate.
- **Media upload** supports JPEG, PNG, GIF, WEBP (≤5MB) and MP4 (≤512MB).
- **Webhook tool requires ngrok** installed and authenticated separately.

---

## Troubleshooting

Built from real setup failures. Work through these in order — most issues are Developer Portal configuration, not code.

---

### Auth errors during setup

---

**`client-not-enrolled` or all v2 endpoints fail immediately**

Your app exists but isn't inside a Project. X requires all apps to be attached to a Developer Project to access v2 endpoints. The error message does not mention Projects at all.

**Option A — Create a Project and attach your app:**
1. Go to [developer.x.com](https://developer.x.com) → left sidebar → **Projects & Apps**
2. Click **+ Create Project**
3. Name it anything, pick a use case
4. When asked to add an app, select your existing app
5. Save — then re-run `xurl whoami`

**Option B — Load a package directly from your app page (faster):**
1. Go to your app in the Developer Portal
2. Click **Manage Apps**
3. Click **Load Package**
4. Select **Paid** and **Development**
5. Save — then re-run `xurl whoami`

---

**`OAuth2 authentication failed: Auth Error: UsernameNotFound`**

Browser says "Authentication successful!" but the terminal fails. The OAuth2 token was issued but lacks the `users.read` scope, so xurl can't fetch your username after login.

Fix — Developer Portal → your app → **User authentication settings → Edit**:

1. Set **App permissions** to **Read and Write**
2. Enable all of these OAuth 2.0 scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`
3. Save, then re-run `xurl auth oauth2`

Existing tokens won't pick up new scopes — you must re-authenticate after saving.

---

**`Something went wrong — You weren't able to give access to the App`**

Browser error during the OAuth2 login flow. The redirect URI in your Developer Portal doesn't match what xurl expects.

Fix — Developer Portal → your app → **User authentication settings → Edit**:

1. Set **Type of App** to **Web App** (not Native App)
2. Under **Callback URI / Redirect URL**, add exactly:
   ```
   http://localhost:8080/callback
   ```
3. Set **Website URL** to anything (e.g. `https://yoursite.com`)
4. Save, then re-run `xurl auth oauth2`

The redirect URI must match character-for-character including the trailing path. `http://localhost:8080` without `/callback` will not work.

---

**`xurl auth oauth2` opens nothing or hangs**

xurl starts a local server on port 8080 for the OAuth callback. If the browser doesn't open automatically, copy the URL it prints and open it manually. If port 8080 is busy:

```bash
lsof -i :8080   # find what's using it
```

---

**OAuth1 and bearer are set but commands still fail**

Your app might not be the default. Check:

```bash
xurl auth status
```

If credentials are present but the app isn't the default, set it:

```bash
xurl auth default "Your App Name"
```

---

**`xurl oauth1` or `xurl oauth2` returns `{} Error: request failed`**

These aren't valid top-level commands. Auth management lives under `xurl auth`:

```bash
xurl auth oauth2          # run the OAuth2 login flow
xurl auth oauth1 ...      # configure OAuth1 credentials
xurl auth status          # check what's stored
```

Running `xurl oauth1` directly causes xurl to interpret it as a URL — it fails silently.

---

### Runtime errors

---

**`spawnSync /opt/homebrew/bin/xurl ENOENT` — every tool call fails**

The server can't find the xurl binary. This happens in sandboxed environments (Docker, CI, cloud IDEs, Cowork) where `/opt/homebrew/bin/xurl` doesn't exist.

The server resolves xurl at startup in this order:
1. `XURL_PATH` env var (if set)
2. `/opt/homebrew/bin/xurl` (macOS Apple Silicon / Homebrew)
3. `/usr/local/bin/xurl` (macOS Intel / Linux Homebrew)
4. `$(npm config get prefix)/bin/xurl` (npm global install)
5. Bare `xurl` on PATH (last resort)

If none of those exist, set `XURL_PATH` explicitly in your MCP config:

```json
"env": {
  "XURL_PATH": "/your/path/to/xurl"
}
```

Find it with `which xurl`.

In sandboxes where xurl isn't pre-installed, install it via npm and set `HOME` so xurl can find its credential file:

```bash
npm config set prefix ~/.npm-global
npm install -g @xdevplatform/xurl
```

Then set in your MCP config env:
```json
"XURL_PATH": "/root/.npm-global/bin/xurl",
"HOME": "/your/home/dir"
```

**`command not found: xurl`**

Same root cause as above — xurl isn't on the path the MCP server searches. Use `which xurl` to find it and set `XURL_PATH`.

---

**`401 Unauthorized`**

Token missing or expired:

```bash
xurl auth status
xurl auth oauth2
```

---

**`403 Forbidden` on replies or quote tweets**

Expected. X's anti-bot enforcement blocks programmatic replies and cold quote tweets on free and basic tiers. `x_community_post` and `x_post` are unaffected.

---

**`429 Too Many Requests`**

Rate limit hit. GET limits reset every 15 minutes. POST (tweet) limits reset every 24 hours.

---

**Trends return empty or `401`**

Trends use the v1.1 API — OAuth 1.0a required, not OAuth 2.0:

```bash
xurl auth oauth1 \
  --consumer-key YOUR_API_KEY \
  --consumer-secret YOUR_API_SECRET \
  --access-token YOUR_ACCESS_TOKEN \
  --access-token-secret YOUR_TOKEN_SECRET
```

---

**DM tools return `403`**

In Developer Portal → your app → **User authentication settings**, set **App permissions** to **Read, Write, and Direct Messages**. Re-authenticate after saving.

---

## Project Structure

```
x-twitter/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (name, version, author)
├── servers/
│   └── x-mcp-server.mjs    # MCP server — 49 tools, zero npm dependencies
├── skills/
│   └── x-twitter/
│       └── SKILL.md         # Claude Code skill trigger phrases
├── .gitignore
├── .mcp.json                # MCP server config (xurl path, community ID)
├── ETHOS.md
├── LICENSE.md
└── README.md
```

---

## Contributing

The server is intentionally a single dependency-free `.mjs` file. Keep it that way.

When adding tools:
1. Add the tool object to the `TOOLS` array in `servers/x-mcp-server.mjs`
2. Update the tool list and count in `skills/x-twitter/SKILL.md`
3. Add a row to the Tools Reference table above

Issues and PRs welcome at [github.com/mrdulasolutions/x-tweet--claude-plugin](https://github.com/mrdulasolutions/x-tweet--claude-plugin).

---

## License

MIT — see [LICENSE.md](LICENSE.md)

---

*Built by [M.R. Dula](https://github.com/mrdulasolutions) · Powered by [xurl](https://github.com/xdevplatform/xurl) · [Model Context Protocol](https://modelcontextprotocol.io)*
