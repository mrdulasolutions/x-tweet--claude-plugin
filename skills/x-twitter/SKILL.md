---
name: x-twitter
description: >
  This skill should be used when the user asks to "post to X", "tweet",
  "post to my community", "check my X mentions", "search X", "look up a user on Twitter",
  "post to Twitter", "check my timeline", "upload media to X", "bookmark a tweet",
  "search communities", "find trending topics", "search Spaces", "create a list",
  "create a poll", "edit a post", or any task involving their X/Twitter account or community page.
metadata:
  version: "0.3.0"
---

# X/Twitter via xurl

This plugin wraps **xurl** (X's official CLI) as MCP tools. It covers the full X API v2
surface: community posting, timeline, search, engagement, DMs, lists, spaces, trends,
media upload, and raw API passthrough.

## Community Posting (Primary Use Case)

The user's default community ID is baked into .mcp.json as `X_COMMUNITY_ID`.

Use `x_community_post` for text-only community posts. For posts with images or video,
first use `x_upload_media` to get a media_id, then use `x_community_post_with_media`.

Both support `share_with_followers` (boolean) to also post to main timeline, and
`reply_settings` to control who can reply.

For full control over every post parameter (polls, geo, AI disclosure, super followers,
paid partnership, etc.), use `x_post_advanced`.

**Important**: X's "Operation Kill the Bots" (Feb 2026) blocks programmatic replies
and cold quote tweets with 403 errors. Direct posts and community posts still work.

## Available MCP Tools (49 total)

### Community
- `x_community_post` — Post text to community (with share_with_followers, reply_settings)
- `x_community_post_with_media` — Post text + media to community
- `x_community_lookup` — Look up a community by ID (name, description, member count)
- `x_community_search` — Search for communities by keyword

### Posting & Replies
- `x_post` — Post to main timeline
- `x_reply` — Reply to a tweet
- `x_quote` — Quote tweet
- `x_post_advanced` — Full-parameter post (polls, geo, reply_settings, super followers, AI flag, paid partnership, community_id, media, etc.)
- `x_edit_post` — Edit an existing post
- `x_delete_tweet` — Delete a tweet

### Reading
- `x_read` — Read a specific tweet by ID
- `x_timeline` — Home timeline
- `x_mentions` — Your @mentions
- `x_search` — Search recent tweets (7-day window, supports operators)

### Engagement
- `x_like` / `x_unlike` — Like or unlike
- `x_repost` / `x_unrepost` — Repost or undo
- `x_bookmark` / `x_unbookmark` — Manage bookmarks
- `x_bookmarks` — List bookmarks
- `x_likes` — List your likes

### Users & Social Graph
- `x_whoami` — Your profile
- `x_user` — Look up any user by @username
- `x_follow` / `x_unfollow` — Follow or unfollow
- `x_block` / `x_unblock` — Block or unblock
- `x_mute` / `x_unmute` — Mute or unmute
- `x_followers` — List your followers
- `x_following` — List who you follow

### Direct Messages
- `x_dm` — Send a DM
- `x_dms` — List recent DMs

### Lists
- `x_list_create` — Create a new list
- `x_list_lookup` — Look up a list by ID
- `x_list_members` — Get list members
- `x_list_add_member` — Add a user to a list
- `x_list_tweets` — Get tweets from a list
- `x_my_lists` — Get your owned lists

### Spaces
- `x_spaces_search` — Search for live/scheduled Spaces
- `x_space_lookup` — Look up a Space by ID

### Trends
- `x_trends` — Get trending topics (by location WOEID)
- `x_trend_locations` — List locations with trend data

### Media
- `x_upload_media` — Upload image/video, returns media_id

### Webhook
- `x_webhook_start` — Start a webhook listener (uses ngrok)

### Utility
- `x_raw_api` — Hit any X API endpoint directly (GET/POST/PUT/DELETE)
- `x_version` — Show xurl version
- `x_auth_status` — Check auth status

## Setup Requirements

1. **Install xurl**: `brew install --cask xdevplatform/tap/xurl`
2. **Register your app**: `xurl auth apps add myapp --client-id YOUR_ID --client-secret YOUR_SECRET`
3. **Authenticate OAuth1**: `xurl auth oauth1 --consumer-key X --consumer-secret X --access-token X --token-secret X`
4. **Set bearer token**: `xurl auth app --bearer-token YOUR_BEARER`
5. **Set default app**: `xurl auth default "Your App Name"`
6. **Verify**: `xurl whoami` should return your profile

## Rate Limits

X API v2 rate limits apply. Key limits for the free tier:
- POST /2/tweets: 17 tweets per 24 hours (free), 100/day (basic)
- GET endpoints: 15-75 requests per 15 minutes
- Search: 60 requests per 15 minutes

The MCP server does not handle rate limiting internally. If a request fails
with a 429, wait and retry.
