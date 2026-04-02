# X/Twitter Plugin for Cowork

Post to your X Community and manage your X account from Cowork, powered by [xurl](https://github.com/xdevplatform/xurl) — the official X CLI.

## Setup

### 1. Install xurl

```bash
brew install --cask xdevplatform/tap/xurl
```

Or via npm: `npm install -g @xdevplatform/xurl`

### 2. Register your X app

```bash
xurl auth apps add myapp --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
```

### 3. Authenticate

```bash
xurl auth login
```

This opens your browser for OAuth2 authentication. Approve access and you're done.

### 4. Verify

```bash
xurl /2/users/me
```

Should return your profile JSON.

## Components

| Component  | Purpose                                           |
|------------|---------------------------------------------------|
| MCP Server | Node.js server wrapping xurl as 20+ MCP tools    |
| Skill      | Usage guide and trigger phrases for Claude        |

## Environment Variables

| Variable         | Required | Default              | Description                  |
|------------------|----------|----------------------|------------------------------|
| `XURL_PATH`      | No       | `xurl`               | Path to xurl binary          |
| `X_COMMUNITY_ID` | No       | `2039109548405907598`| Default community ID         |

## Usage

Just ask Claude things like:
- "Post 'Hello world' to my X community"
- "Check my recent mentions on X"
- "Search X for 'export compliance'"
- "Who is @elonmusk on X?"
- "Like tweet 1234567890"
