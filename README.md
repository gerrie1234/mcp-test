# nodegoat MCP server

MCP server for the [nodegoat](https://nodegoat.net) research platform,
deployed on [Railway](https://railway.com).

## Tools

| Tool | Description |
|------|-------------|
| `get_model` | Fetch the full data model (types, fields, sub-objects) |
| `search_persons` | Find persons by given name and/or family name |
| `get_object` | Fetch any single object by type ID + object ID |
| `filter_objects` | Run an arbitrary nodegoat filter against any type |
| `get_letters_by_sender` | All letters sent by a person (by object ID) |
| `get_letters_by_receiver` | All letters received by a person (by object ID) |
| `get_letters_between` | All letters exchanged between two persons |

## Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new)

1. Push this repo to GitHub
2. Go to [railway.com/new](https://railway.com/new) → Deploy from GitHub repo
3. Select this repository — Railway auto-detects Node.js via Railpack
4. Go to Settings → Networking → Generate Domain
5. Your MCP endpoint: `https://<your-app>.up.railway.app/mcp`

## Environment variables (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODEGOAT_BASE_URL` | `https://demo.nodegoat.io` | nodegoat instance URL |
| `NODEGOAT_PROJECT_ID` | `1` | Project ID |
| `NODEGOAT_API_KEY` | — | API key for authenticated instances |

## Connect to Claude

Settings → Connectors → Add → paste your Railway MCP URL.
