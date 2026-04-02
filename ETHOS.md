# Ethos

## Why This Exists

Social media tools are built for the scroll. Open the app, consume, post, close. The whole experience is designed around your attention — grab it, hold it, monetize it.

This plugin is built on a different premise: that you should be able to engage with your audience *without* being swallowed by a feed.

When you run your business, lead your community, or share your work, you shouldn't have to open X just to post. You should be able to say what you want to say, send it, and get back to building.

That's what this does.

---

## Design Principles

### 1. Conversation-first

The interface is natural language. Not a dashboard, not a form, not a command you have to memorize. You tell Claude what you want to do, and it figures out which tool — or sequence of tools — gets it done.

This means the plugin should degrade gracefully when tools aren't the right fit. Not every X interaction needs automation. Claude should know the difference.

### 2. No hidden dependencies

The server is a single `.mjs` file with zero npm dependencies. No build step. No lockfile. No `node_modules` to audit.

xurl handles everything that requires external trust: OAuth signing, token storage, API versioning, TLS. This plugin just shells out to it. If xurl is broken, we surface the error and stop. We do not silently fail or retry indefinitely.

### 3. Transparency over cleverness

Every tool does exactly one thing and says so in its description. There are no "smart" wrappers that guess your intent and make invisible decisions. If a post fails, you get the raw error from xurl — not a sanitized message that hides what went wrong.

When something requires your community ID, it tells you where to find it. When a rate limit is hit, it tells you what the limit is. When a feature requires OAuth 1.0a credentials, the documentation says so plainly.

### 4. Your account, your control

This plugin posts on your behalf. That's serious.

It does not:
- Schedule or queue posts without your explicit instruction
- Auto-reply, auto-follow, or auto-engage anything
- Retry failed posts silently
- Cache credentials in any location beyond what xurl already manages

Every action requires an explicit call. The default is to do nothing.

### 5. Stay close to the platform

This plugin does not attempt to abstract the X API behind friendlier concepts. The tools map closely to actual API endpoints. This means:

- Rate limits are real and visible
- API changes break tools in predictable ways
- Advanced users can drop into `x_raw_api` and do anything the API supports
- Nothing is hidden that you might need to debug

We don't promise what the platform doesn't guarantee.

---

## What This Is Not

This is not a social media management platform. It is not a scheduler, an analytics dashboard, or a growth tool. It does not help you maximize engagement, optimize posting times, or A/B test your copy.

It is a direct line from your conversation to your account. The strategy is yours. This just removes the friction.

---

## On Automation and Trust

Automating social media interactions is a responsibility. X's platform has been flooded by bots, spam, and manipulated engagement for years. This plugin exists to help real people do real things faster — not to make it easier to pollute the platform.

If you're using this to:
- Post authentic content to your community
- Monitor conversations relevant to your work
- Manage your account without getting lost in a feed

That's exactly what it's for.

If you're using this to:
- Spam, bot-follow, or artificially amplify reach
- Scrape users at scale
- Automate engagement in ways that violate X's Developer Agreement

Stop. That's not what this is, and it's not what we want associated with it.

The MIT license gives you freedom. Use it well.

---

## On Building in Public

This plugin is open source because the Claude Code plugin ecosystem should be open. If someone else wants to post to their X community from their own Claude setup, they should be able to — without asking permission or paying for a SaaS subscription.

Plugins like this are small pieces of infrastructure. They work better when they're visible, forkable, and improvable by whoever needs them.

---

*Built by M.R. Dula*
