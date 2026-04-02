# X/Twitter Plugin for Claude Code

**Post, read, search, and manage your X account and community — entirely from conversation.**

Built on top of [xurl](https://github.com/xdevplatform/xurl), the official X CLI by the X Developer Platform. This plugin wraps xurl as a full MCP server, giving Claude Code access to 49 tools that cover the complete X API v2 surface — from community posts to DMs, trending topics, spaces, lists, media uploads, and a raw API passthrough for anything else.

---

## What This Plugin Does

You talk to Claude. Claude talks to X. No browser required.

```
You: "Post to my X community: Excited to share our new plugin launch!"
Claude: [calls x_community_post] → Posted. Tweet ID: 1234567890
```

```
You: "Search X for 'export compliance AI' and summarize the top 5 results"
Claude: [calls x_search] → Here's what's trending in that space...
```

```
You: "Upload this screenshot and post it to my community with a caption"
Claude: [calls x_upload_media, then x_community_post_with_media] → Done.
```

---

## Architecture

```
Claude Code (conversation)
       │
       ▼
  Skill (SKILL.md)           ← triggers Claude to use this plugin
       │
       ▼
  MCP Server (x-mcp-server.mjs)   ← 49 tools, stdio JSON-RPC transport
       │
       ▼
  xurl binary                ← official X CLI, handles OAuth + API calls
       │
       ▼
  X API v2 (+ v1.1 for trends)
```

The MCP server is a single Node.js file with no npm dependencies. It communicates with Claude Code over stdin/stdout using the MCP JSON-RPC protocol. All authentication and API signing is handled by xurl — the server just shells out to it.

---

## Setup

### 1. Install xurl

```bash
brew install --cask xdevplatform/tap/xurl
```

Or via npm:

```bash
npm install -g @xdevplatform/xurl
```

Verify:

```bash
xurl version
```

### 2. Create an X Developer App

1. Go to [developer.x.com](https://developer.x.com) and create a project + app
2. Enable OAuth 2.0 with User Authentication
3. Set callback URL to `http://localhost:3000/callback` (or any localhost URL)
4. Copy your **Client ID** and **Client Secret**

### 3. Register your app with xurl

```bash
xurl auth apps add myapp \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_CLIENT_SECRET
```

### 4. Authenticate (OAuth 2.0)

```bash
xurl auth login
```

This opens your browser. Approve access and xurl stores the token locally.

### 5. (Optional) OAuth 1.0a for trends

The `x_trends` and `x_trend_locations` tools use the v1.1 API, which requires OAuth 1.0a credentials:

```bash
xurl auth oauth1 \
  --consumer-key YOUR_API_KEY \
  --consumer-secret YOUR_API_SECRET \
  --access-token YOUR_ACCESS_TOKEN \
  --token-secret YOUR_ACCESS_TOKEN_SECRET
```

### 6. Set your default app

```bash
xurl auth default "myapp"
```

### 7. Verify everything works

```bash
xurl whoami        # Should return your profile
xurl post "test"   # Delete this after — it will actually post
```

### 8. Install the plugin in Claude Code

From the `x-twitter/` directory (or after cloning this repo):

```bash
claude plugin install .
```

Or point Claude Code at this directory as a local plugin in your settings.

---

## Configuration

The plugin is configured via `.mcp.json` environment variables:

| Variable         | Required | Default                      | Description                          |
|------------------|----------|------------------------------|--------------------------------------|
| `XURL_PATH`      | No       | `/opt/homebrew/bin/xurl`     | Full path to your xurl binary        |
| `X_COMMUNITY_ID` | No       | *(empty)*                    | Default community ID for all posts   |

### Finding your Community ID

Your community ID is in the URL when you visit your community page:

```
https://x.com/i/communities/2039109548405907598
                              ^^^^^^^^^^^^^^^^^^
                              This is your community ID
```

### Overriding per-call

Every community tool accepts an optional `community_id` parameter that overrides the env var for that specific call.

---

## Tools Reference

### Community (4 tools)

| Tool | Description |
|------|-------------|
| `x_community_post` | Post text to your community. Supports `share_with_followers` and `reply_settings`. |
| `x_community_post_with_media` | Post text + uploaded media to your community. |
| `x_community_lookup` | Look up a community by ID — returns name, description, member count. |
| `x_community_search` | Search for X Communities by keyword. |

### Posting & Replies (6 tools)

| Tool | Description |
|------|-------------|
| `x_post` | Post a tweet to your main timeline. |
| `x_reply` | Reply to a specific tweet by ID. |
| `x_quote` | Quote a tweet with your own commentary. |
| `x_post_advanced` | Full-parameter post: polls, geo, reply_settings, super followers, AI disclosure, paid partnership, media, community, quote. |
| `x_edit_post` | Edit an existing post (within X's edit window). |
| `x_delete_tweet` | Delete a tweet by ID. |

### Reading (4 tools)

| Tool | Description |
|------|-------------|
| `x_read` | Read a specific tweet by ID. |
| `x_timeline` | Your home timeline. |
| `x_mentions` | Your recent @mentions. |
| `x_search` | Search recent tweets (7-day window). Supports X operators: `from:`, `to:`, `has:media`, `-is:retweet`, etc. |

### Engagement (8 tools)

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

### Users & Social Graph (10 tools)

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

### Direct Messages (2 tools)

| Tool | Description |
|------|-------------|
| `x_dm` | Send a Direct Message to a user. |
| `x_dms` | List your recent Direct Messages. |

### Lists (6 tools)

| Tool | Description |
|------|-------------|
| `x_list_create` | Create a new list (public or private). |
| `x_list_lookup` | Look up a list by ID. |
| `x_list_members` | Get the members of a list. |
| `x_list_add_member` | Add a user to a list by user ID. |
| `x_list_tweets` | Get recent tweets from a list's timeline. |
| `x_my_lists` | Get all lists you own. |

### Spaces (2 tools)

| Tool | Description |
|------|-------------|
| `x_spaces_search` | Search for live or scheduled X Spaces. Filter by state: `live`, `scheduled`, or `all`. |
| `x_space_lookup` | Look up a Space by ID — returns title, host, participant count, state. |

### Trends (2 tools)

| Tool | Description |
|------|-------------|
| `x_trends` | Get trending topics. Accepts WOEID (`1` = worldwide, `23424977` = US). Requires OAuth 1.0a. |
| `x_trend_locations` | List all locations X has trend data for. |

### Media (1 tool)

| Tool | Description |
|------|-------------|
| `x_upload_media` | Upload an image or video from a local file path. Returns a `media_id` to use in posts. |

### Webhook (1 tool)

| Tool | Description |
|------|-------------|
| `x_webhook_start` | Start a local webhook listener for X API events. Uses ngrok for a public URL. Requires ngrok installed. |

### Utility (3 tools)

| Tool | Description |
|------|-------------|
| `x_raw_api` | Hit any X API endpoint directly. Full GET/POST/PUT/DELETE support. Escape hatch for anything not covered above. |
| `x_version` | Show xurl version and build info. |
| `x_auth_status` | Check your current xurl authentication status. |

---

## Rate Limits

X API v2 rate limits apply. The MCP server does not throttle or queue — if you hit a limit, xurl returns a 429 and Claude will surface the error.

| Tier | POST /2/tweets | GET endpoints | Search |
|------|---------------|---------------|--------|
| Free | 17/day | 15–75 req/15min | 60 req/15min |
| Basic ($100/mo) | 100/day | Higher | Higher |
| Pro ($5k/mo) | 10,000/day | Much higher | Much higher |

Key things that burn your POST quota fast: polls, quote tweets, replies. Community posts use the same `/2/tweets` endpoint and count against your limit.

---

## Known Limitations

- **Replies and cold quote tweets may 403** on free/basic tiers due to X's anti-bot enforcement ("Operation Kill the Bots", Feb 2026). Direct posts and community posts still work reliably.
- **Trends require OAuth 1.0a**. If you only set up OAuth 2.0, `x_trends` will fail. Run `xurl auth oauth1 ...` to add those credentials.
- **DMs require elevated access**. The `x_dm` and `x_dms` tools need your app to have DM permissions enabled in the developer portal.
- **Media upload supports** images (JPEG, PNG, GIF, WEBP) and video (MP4). File size limits: 5MB for images, 512MB for video.
- **Webhook tool requires ngrok** installed and authenticated separately.

---

## Troubleshooting

**`command not found: xurl`**
The MCP server defaults to `/opt/homebrew/bin/xurl`. Set `XURL_PATH` in `.mcp.json` to your actual path (`which xurl`).

**`401 Unauthorized`**
Run `xurl auth status` to check your token. Re-run `xurl auth login` if it's expired.

**`403 Forbidden` on replies/quotes**
Expected on free tier due to X's anti-automation rules. Community posts (`x_community_post`) are not affected.

**`429 Too Many Requests`**
You've hit your rate limit. Check X developer dashboard for your usage. Wait 15 minutes for GET limits; 24 hours for POST limits.

**Trends return empty or 401**
Trends use the v1.1 API and require OAuth 1.0a credentials. See setup step 5.

---

## Project Structure

```
x-twitter/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (name, version, author)
├── servers/
│   └── x-mcp-server.mjs    # MCP server — 49 tools, no npm dependencies
├── skills/
│   └── x-twitter/
│       └── SKILL.md         # Claude trigger phrases and usage guide
├── .gitignore
├── .mcp.json                # MCP server config (paths, env vars)
└── README.md
```

---

## Contributing

This plugin is intentionally dependency-free. The server is a single `.mjs` file and should stay that way.

When adding tools:
1. Add the tool object to the `TOOLS` array in `x-mcp-server.mjs`
2. Update the tool list in `skills/x-twitter/SKILL.md`
3. Update the tool count in the SKILL.md header
4. Add a row to the Tools Reference table in `README.md`

Issues and PRs welcome at [github.com/mrdulasolutions/x-tweet--claude-plugin](https://github.com/mrdulasolutions/x-tweet--claude-plugin).

---

## License

MIT — see [LICENSE.md](LICENSE.md)

---

*Built by [M.R. Dula](https://github.com/mrdulasolutions) · Powered by [xurl](https://github.com/xdevplatform/xurl) · Runs on [Claude Code](https://claude.ai/code)*
