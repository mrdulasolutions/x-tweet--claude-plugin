#!/usr/bin/env node

/**
 * X/Twitter MCP Server — wraps xurl (official X CLI) as MCP tools.
 *
 * Uses xurl's native shortcut commands (post, reply, search, like, etc.)
 * plus raw API access for community posting and anything else.
 *
 * Requires: xurl installed and authenticated (xurl auth oauth1 / oauth2).
 */

import { execFileSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const XURL_BIN = process.env.XURL_PATH || "/opt/homebrew/bin/xurl";
const COMMUNITY_ID = process.env.X_COMMUNITY_ID || "";
const DEFAULT_TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(args, { timeout = DEFAULT_TIMEOUT } = {}) {
  try {
    const stdout = execFileSync(XURL_BIN, args, {
      encoding: "utf-8",
      timeout,
      maxBuffer: 5 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: "1" },
    });
    return { ok: true, output: stdout.trim() };
  } catch (err) {
    const msg =
      err.stderr?.trim() || err.stdout?.trim() || err.message || String(err);
    return { ok: false, output: msg };
  }
}

// ---------------------------------------------------------------------------
// Tool definitions — using xurl shortcut commands where possible
// ---------------------------------------------------------------------------

const TOOLS = [
  // ── Community posting (primary use case) ────────────────────────────
  {
    name: "x_community_post",
    description:
      "Post a tweet to your X Community page. Uses the configured community ID by default.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Tweet text (up to 280 chars)" },
        community_id: {
          type: "string",
          description: "Community ID override. Defaults to X_COMMUNITY_ID env var.",
        },
        share_with_followers: {
          type: "boolean",
          description: "Also share to your main timeline (default false)",
        },
        reply_settings: {
          type: "string",
          enum: ["following", "mentionedUsers", "subscribers", "verified"],
          description: "Who can reply to this post",
        },
      },
      required: ["text"],
    },
    run({ text, community_id, share_with_followers, reply_settings }) {
      const cid = community_id || COMMUNITY_ID;
      if (!cid) {
        return {
          ok: false,
          output:
            "No community_id provided and X_COMMUNITY_ID env var is not set. " +
            "Find your community ID from the URL: https://x.com/i/communities/<ID>",
        };
      }
      const payload = { text, community_id: cid };
      if (share_with_followers) payload.share_with_followers = true;
      if (reply_settings) payload.reply_settings = reply_settings;
      return run(["-X", "POST", "/2/tweets", "-d", JSON.stringify(payload)]);
    },
  },
  {
    name: "x_community_post_with_media",
    description:
      "Post a tweet with media to your X Community. Upload media first with x_upload_media.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Tweet text" },
        media_ids: {
          type: "array",
          items: { type: "string" },
          description: "Media IDs from x_upload_media (up to 4)",
        },
        community_id: {
          type: "string",
          description: "Community ID (uses env var if omitted)",
        },
        share_with_followers: {
          type: "boolean",
          description: "Also share to your main timeline (default false)",
        },
      },
      required: ["text", "media_ids"],
    },
    run({ text, media_ids, community_id, share_with_followers }) {
      const cid = community_id || COMMUNITY_ID;
      if (!cid) {
        return { ok: false, output: "No community_id provided and X_COMMUNITY_ID is not set." };
      }
      const payload = { text, community_id: cid, media: { media_ids } };
      if (share_with_followers) payload.share_with_followers = true;
      return run(["-X", "POST", "/2/tweets", "-d", JSON.stringify(payload)]);
    },
  },
  {
    name: "x_community_lookup",
    description: "Look up a community by ID. Returns name, description, member count, etc.",
    inputSchema: {
      type: "object",
      properties: {
        community_id: {
          type: "string",
          description: "Community ID. Defaults to X_COMMUNITY_ID env var.",
        },
      },
    },
    run({ community_id } = {}) {
      const cid = community_id || COMMUNITY_ID;
      if (!cid) {
        return { ok: false, output: "No community_id provided and X_COMMUNITY_ID is not set." };
      }
      return run([
        `/2/communities/${cid}?community.fields=access,created_at,description,id,join_policy,member_count,name`,
      ]);
    },
  },
  {
    name: "x_community_search",
    description: "Search for X Communities by keyword.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term" },
        count: { type: "number", description: "Number of results (default 10, max 100)" },
      },
      required: ["query"],
    },
    run({ query, count = 10 }) {
      const encoded = encodeURIComponent(query);
      return run([
        `/2/communities/search?query=${encoded}&max_results=${Math.min(count, 100)}&community.fields=access,created_at,description,id,join_policy,member_count,name`,
      ]);
    },
  },

  // ── Posting & replies ───────────────────────────────────────────────
  {
    name: "x_post",
    description: "Post a tweet to your main timeline.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Tweet text (up to 280 chars)" },
      },
      required: ["text"],
    },
    run({ text }) {
      return run(["post", text]);
    },
  },
  {
    name: "x_reply",
    description: "Reply to a specific tweet.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to reply to" },
        text: { type: "string", description: "Reply text" },
      },
      required: ["tweet_id", "text"],
    },
    run({ tweet_id, text }) {
      return run(["reply", tweet_id, text]);
    },
  },
  {
    name: "x_quote",
    description: "Quote a tweet with your own commentary.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to quote" },
        text: { type: "string", description: "Your commentary" },
      },
      required: ["tweet_id", "text"],
    },
    run({ tweet_id, text }) {
      return run(["quote", tweet_id, text]);
    },
  },
  {
    name: "x_delete_tweet",
    description: "Delete a tweet by ID.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to delete" },
      },
      required: ["tweet_id"],
    },
    run({ tweet_id }) {
      return run(["delete", tweet_id]);
    },
  },

  // ── Reading ─────────────────────────────────────────────────────────
  {
    name: "x_read",
    description: "Read a specific tweet by ID.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID" },
      },
      required: ["tweet_id"],
    },
    run({ tweet_id }) {
      return run(["read", tweet_id]);
    },
  },
  {
    name: "x_timeline",
    description: "Get your home timeline.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["timeline"]);
    },
  },
  {
    name: "x_mentions",
    description: "Get your recent @mentions.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["mentions"]);
    },
  },

  // ── Search ──────────────────────────────────────────────────────────
  {
    name: "x_search",
    description: "Search recent tweets (last 7 days). Supports X search operators.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (supports from:, to:, has:media, etc.)",
        },
        count: { type: "number", description: "Number of results (default 10)" },
      },
      required: ["query"],
    },
    run({ query, count }) {
      const args = ["search", query];
      if (count) args.push("-n", String(count));
      return run(args);
    },
  },

  // ── Engagement ──────────────────────────────────────────────────────
  {
    name: "x_like",
    description: "Like a tweet.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to like" },
      },
      required: ["tweet_id"],
    },
    run({ tweet_id }) {
      return run(["like", tweet_id]);
    },
  },
  {
    name: "x_unlike",
    description: "Unlike a tweet.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to unlike" },
      },
      required: ["tweet_id"],
    },
    run({ tweet_id }) {
      return run(["unlike", tweet_id]);
    },
  },
  {
    name: "x_repost",
    description: "Repost (retweet) a tweet.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to repost" },
      },
      required: ["tweet_id"],
    },
    run({ tweet_id }) {
      return run(["repost", tweet_id]);
    },
  },
  {
    name: "x_unrepost",
    description: "Undo a repost.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to un-repost" },
      },
      required: ["tweet_id"],
    },
    run({ tweet_id }) {
      return run(["unrepost", tweet_id]);
    },
  },
  {
    name: "x_bookmark",
    description: "Bookmark a tweet.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to bookmark" },
      },
      required: ["tweet_id"],
    },
    run({ tweet_id }) {
      return run(["bookmark", tweet_id]);
    },
  },
  {
    name: "x_unbookmark",
    description: "Remove a bookmark.",
    inputSchema: {
      type: "object",
      properties: {
        tweet_id: { type: "string", description: "Tweet ID to unbookmark" },
      },
      required: ["tweet_id"],
    },
    run({ tweet_id }) {
      return run(["unbookmark", tweet_id]);
    },
  },
  {
    name: "x_bookmarks",
    description: "List your bookmarked tweets.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["bookmarks"]);
    },
  },
  {
    name: "x_likes",
    description: "List your liked tweets.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["likes"]);
    },
  },

  // ── Users & social graph ────────────────────────────────────────────
  {
    name: "x_whoami",
    description: "Show your authenticated profile.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["whoami"]);
    },
  },
  {
    name: "x_user",
    description: "Look up a user by @username.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username (with or without @)" },
      },
      required: ["username"],
    },
    run({ username }) {
      return run(["user", username]);
    },
  },
  {
    name: "x_follow",
    description: "Follow a user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username to follow (with or without @)" },
      },
      required: ["username"],
    },
    run({ username }) {
      return run(["follow", username]);
    },
  },
  {
    name: "x_unfollow",
    description: "Unfollow a user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username to unfollow" },
      },
      required: ["username"],
    },
    run({ username }) {
      return run(["unfollow", username]);
    },
  },
  {
    name: "x_block",
    description: "Block a user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username to block" },
      },
      required: ["username"],
    },
    run({ username }) {
      return run(["block", username]);
    },
  },
  {
    name: "x_unblock",
    description: "Unblock a user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username to unblock" },
      },
      required: ["username"],
    },
    run({ username }) {
      return run(["unblock", username]);
    },
  },
  {
    name: "x_mute",
    description: "Mute a user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username to mute" },
      },
      required: ["username"],
    },
    run({ username }) {
      return run(["mute", username]);
    },
  },
  {
    name: "x_unmute",
    description: "Unmute a user.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Username to unmute" },
      },
      required: ["username"],
    },
    run({ username }) {
      return run(["unmute", username]);
    },
  },
  {
    name: "x_followers",
    description: "List your followers.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["followers"]);
    },
  },
  {
    name: "x_following",
    description: "List users you follow.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["following"]);
    },
  },

  // ── Direct Messages ─────────────────────────────────────────────────
  {
    name: "x_dm",
    description: "Send a Direct Message.",
    inputSchema: {
      type: "object",
      properties: {
        username: { type: "string", description: "Recipient username" },
        text: { type: "string", description: "Message text" },
      },
      required: ["username", "text"],
    },
    run({ username, text }) {
      return run(["dm", username, text]);
    },
  },
  {
    name: "x_dms",
    description: "List recent Direct Messages.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["dms"]);
    },
  },

  // ── Media ───────────────────────────────────────────────────────────
  {
    name: "x_upload_media",
    description: "Upload media (image/video) for use in a tweet. Returns a media_id.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: { type: "string", description: "Path to the media file" },
      },
      required: ["file_path"],
    },
    run({ file_path }) {
      return run(["media", "upload", file_path]);
    },
  },

  // ── Advanced post (full API params) ──────────────────────────────────
  {
    name: "x_post_advanced",
    description:
      "Create a post with full control over all X API parameters: reply_settings, geo, polls, super followers, AI disclosure, paid partnership, etc.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Tweet text" },
        reply_to: { type: "string", description: "Tweet ID to reply to" },
        quote_tweet_id: { type: "string", description: "Tweet ID to quote" },
        community_id: { type: "string", description: "Community ID to post to" },
        share_with_followers: { type: "boolean", description: "Share community post to timeline" },
        media_ids: {
          type: "array",
          items: { type: "string" },
          description: "Media IDs (up to 4)",
        },
        poll_options: {
          type: "array",
          items: { type: "string" },
          description: "Poll options (2-4 choices)",
        },
        poll_duration_minutes: { type: "number", description: "Poll duration in minutes" },
        reply_settings: {
          type: "string",
          enum: ["following", "mentionedUsers", "subscribers", "verified"],
          description: "Who can reply",
        },
        geo_place_id: { type: "string", description: "Place ID for geolocation" },
        for_super_followers_only: { type: "boolean", description: "Subscribers-only post" },
        made_with_ai: { type: "boolean", description: "AI-generated media disclosure" },
        paid_partnership: { type: "boolean", description: "Label as paid promotion" },
      },
      required: ["text"],
    },
    run(args) {
      const payload = { text: args.text };
      if (args.reply_to) payload.reply = { in_reply_to_tweet_id: args.reply_to };
      if (args.quote_tweet_id) payload.quote_tweet_id = args.quote_tweet_id;
      if (args.community_id) payload.community_id = args.community_id;
      if (args.share_with_followers) payload.share_with_followers = true;
      if (args.media_ids) payload.media = { media_ids: args.media_ids };
      if (args.poll_options) {
        payload.poll = {
          options: args.poll_options,
          duration_minutes: args.poll_duration_minutes || 1440,
        };
      }
      if (args.reply_settings) payload.reply_settings = args.reply_settings;
      if (args.geo_place_id) payload.geo = { place_id: args.geo_place_id };
      if (args.for_super_followers_only) payload.for_super_followers_only = true;
      if (args.made_with_ai) payload.made_with_ai = true;
      if (args.paid_partnership) payload.paid_partnership = true;
      return run(["-X", "POST", "/2/tweets", "-d", JSON.stringify(payload)]);
    },
  },

  // ── Edit post ───────────────────────────────────────────────────────
  {
    name: "x_edit_post",
    description: "Edit an existing post (if within the edit window).",
    inputSchema: {
      type: "object",
      properties: {
        previous_post_id: { type: "string", description: "ID of the post to edit" },
        text: { type: "string", description: "Updated text" },
      },
      required: ["previous_post_id", "text"],
    },
    run({ previous_post_id, text }) {
      return run([
        "-X", "POST", "/2/tweets",
        "-d", JSON.stringify({ text, edit_options: { previous_post_id } }),
      ]);
    },
  },

  // ── Trends ──────────────────────────────────────────────────────────
  {
    name: "x_trends",
    description: "Get trending topics. Optionally by location (WOEID) or personalized.",
    inputSchema: {
      type: "object",
      properties: {
        woeid: {
          type: "string",
          description: "Where On Earth ID (1 = worldwide, 23424977 = US). Default: worldwide.",
        },
      },
    },
    run({ woeid = "1" } = {}) {
      return run([`/1.1/trends/place.json?id=${woeid}`]);
    },
  },
  {
    name: "x_trend_locations",
    description: "List locations that X has trending topic data for.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["/1.1/trends/available.json"]);
    },
  },

  // ── Spaces ──────────────────────────────────────────────────────────
  {
    name: "x_spaces_search",
    description: "Search for live or scheduled X Spaces.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term" },
        state: {
          type: "string",
          enum: ["live", "scheduled", "all"],
          description: "Filter by state (default: all)",
        },
      },
      required: ["query"],
    },
    run({ query, state = "all" }) {
      const encoded = encodeURIComponent(query);
      return run([
        `/2/spaces/search?query=${encoded}&state=${state}&space.fields=created_at,host_ids,participant_count,scheduled_start,state,title,topic_ids`,
      ]);
    },
  },
  {
    name: "x_space_lookup",
    description: "Look up a Space by ID.",
    inputSchema: {
      type: "object",
      properties: {
        space_id: { type: "string", description: "Space ID" },
      },
      required: ["space_id"],
    },
    run({ space_id }) {
      return run([
        `/2/spaces/${space_id}?space.fields=created_at,host_ids,participant_count,scheduled_start,state,title,topic_ids`,
      ]);
    },
  },

  // ── Lists (v2 API) ─────────────────────────────────────────────────
  {
    name: "x_list_create",
    description: "Create a new list.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "List name" },
        description: { type: "string", description: "List description" },
        private: { type: "boolean", description: "Make list private" },
      },
      required: ["name"],
    },
    run({ name, description, private: priv }) {
      const payload = { name };
      if (description) payload.description = description;
      if (priv) payload.private = true;
      return run(["-X", "POST", "/2/lists", "-d", JSON.stringify(payload)]);
    },
  },
  {
    name: "x_list_lookup",
    description: "Look up a list by ID.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: { type: "string", description: "List ID" },
      },
      required: ["list_id"],
    },
    run({ list_id }) {
      return run([
        `/2/lists/${list_id}?list.fields=created_at,description,follower_count,member_count,name,owner_id,private`,
      ]);
    },
  },
  {
    name: "x_list_members",
    description: "Get members of a list.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: { type: "string", description: "List ID" },
      },
      required: ["list_id"],
    },
    run({ list_id }) {
      return run([
        `/2/lists/${list_id}/members?user.fields=name,username,description,public_metrics`,
      ]);
    },
  },
  {
    name: "x_list_add_member",
    description: "Add a user to a list.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: { type: "string", description: "List ID" },
        user_id: { type: "string", description: "User ID to add" },
      },
      required: ["list_id", "user_id"],
    },
    run({ list_id, user_id }) {
      return run([
        "-X", "POST", `/2/lists/${list_id}/members`,
        "-d", JSON.stringify({ user_id }),
      ]);
    },
  },
  {
    name: "x_list_tweets",
    description: "Get recent tweets from a list's timeline.",
    inputSchema: {
      type: "object",
      properties: {
        list_id: { type: "string", description: "List ID" },
        count: { type: "number", description: "Number of tweets (default 10)" },
      },
      required: ["list_id"],
    },
    run({ list_id, count = 10 }) {
      return run([
        `/2/lists/${list_id}/tweets?max_results=${Math.min(count, 100)}&tweet.fields=author_id,created_at,public_metrics,text`,
      ]);
    },
  },
  {
    name: "x_my_lists",
    description: "Get lists owned by you.",
    inputSchema: { type: "object", properties: {} },
    run() {
      const me = run(["whoami"]);
      if (!me.ok) return me;
      try {
        const userId = JSON.parse(me.output)?.data?.id;
        if (!userId) return { ok: false, output: "Could not get user ID" };
        return run([
          `/2/users/${userId}/owned_lists?list.fields=created_at,description,follower_count,member_count,name,private`,
        ]);
      } catch (e) {
        return { ok: false, output: `Parse error: ${e.message}` };
      }
    },
  },

  // ── Raw API passthrough ─────────────────────────────────────────────
  {
    name: "x_raw_api",
    description:
      "Hit any X API endpoint directly via xurl. Use for anything not covered by other tools.",
    inputSchema: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE"],
          description: "HTTP method",
        },
        endpoint: {
          type: "string",
          description: "API endpoint path (e.g. /2/tweets/123)",
        },
        body: {
          type: "string",
          description: "JSON request body (for POST/PUT)",
        },
      },
      required: ["method", "endpoint"],
    },
    run({ method, endpoint, body }) {
      const args = [];
      if (method !== "GET") args.push("-X", method);
      if (body) args.push("-d", body);
      args.push(endpoint);
      return run(args);
    },
  },

  // ── Webhook ──────────────────────────────────────────────────────────
  {
    name: "x_webhook_start",
    description:
      "Start a webhook listener for receiving X API events (uses ngrok for a temporary URL).",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["webhook", "start"], { timeout: 60_000 });
    },
  },

  // ── Version & auth ──────────────────────────────────────────────────
  {
    name: "x_version",
    description: "Show xurl version information.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["version"]);
    },
  },
  {
    name: "x_auth_status",
    description: "Check xurl authentication status.",
    inputSchema: { type: "object", properties: {} },
    run() {
      return run(["auth", "status"]);
    },
  },
];

// ---------------------------------------------------------------------------
// MCP JSON-RPC stdio transport
// ---------------------------------------------------------------------------

const SERVER_INFO = { name: "x-twitter", version: "0.2.0" };
const CAPABILITIES = { tools: {} };

function handleRequest(msg) {
  const { method, params, id } = msg;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: SERVER_INFO,
          capabilities: CAPABILITIES,
        },
      };

    case "notifications/initialized":
      return null;

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS.map(({ name, description, inputSchema }) => ({
            name,
            description,
            inputSchema,
          })),
        },
      };

    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find((t) => t.name === toolName);

      if (!tool) {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
            isError: true,
          },
        };
      }

      const result = tool.run(toolArgs);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: result.output || "(no output)" }],
          isError: !result.ok,
        },
      };
    }

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

let buffer = "";
process.stdin.on("data", (chunk) => {
  buffer += chunk.toString();
  let idx;
  while ((idx = buffer.indexOf("\n")) !== -1) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const msg = JSON.parse(line);
      const res = handleRequest(msg);
      if (res) process.stdout.write(JSON.stringify(res) + "\n");
    } catch (err) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "Parse error: " + err.message },
        }) + "\n"
      );
    }
  }
});

process.stdin.on("end", () => process.exit(0));
