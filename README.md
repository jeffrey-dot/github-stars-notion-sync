# GitHub Stars to Notion Sync

Automatically sync your GitHub starred repositories to a Notion database with latest release information and Chinese translations.

## Features

- ⭐ Sync all starred repositories from GitHub to Notion
- 🚀 Include latest release information (version, content, publish date)
- 🇨🇳 Auto-translate descriptions to Chinese
- 🗑️ Auto-clear database before each sync
- ⏰ Runs hourly via GitHub Actions cron

## Notion Database Schema

Create a Notion database with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| Name | `title` | Repository full name (e.g., "facebook/react") |
| Description | `text` | Repository description |
| 中文描述 | `text` | Chinese translation of description (optional) |
| URL | `url` | GitHub repository link |
| StarredAt | `date` | When you starred the repo |
| LatestRelease | `text` | Latest release version/tag |
| ReleaseBody | `text` | Release notes |
| ReleasePublishedAt | `date` | Release publish date |
| LastSyncedAt | `date` | Last sync timestamp |

## Setup

### 1. Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Create a new integration
3. Copy the **Internal Integration Token**

### 2. Create Notion Database

1. Create a new database in Notion with the schema above
2. Click **Share** → **Add integrations**
3. Select your integration
4. Copy the **Database ID** from the URL (32-char UUID after `/` and before `?`)

### 3. Configure GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Add the following secrets:

| Name | Description |
|------|-------------|
| `NOTION_TOKEN` | Notion Integration Token |
| `NOTION_DATABASE_ID` | Notion Database ID |
| `GH_PAT` | GitHub Personal Access Token (classic) with `public_repo` scope |

> **Why GH_PAT?** The default `GITHUB_TOKEN` doesn't have access to user stars. You need a Personal Access Token.

### 4. Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Give it a name (e.g., "Notion Sync")
4. Check the `public_repo` scope
5. Copy the token and add it as `GH_PAT` secret

## Usage

### Manual Trigger

Go to **Actions** → **Sync Stars** → **Run workflow** → **Run workflow**

### Schedule

The workflow runs automatically every hour at the top of the hour (`0 * * * *`).

## Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
export NOTION_TOKEN="your_token"
export NOTION_DATABASE_ID="your_database_id"
export GITHUB_TOKEN="your_pat"
npm start
```

## How It Works

1. **Fetch Stars**: Fetches all starred repositories via GitHub API
2. **Fetch Releases**: Gets the latest release for each repository
3. **Translate**: Translates descriptions to Chinese using MyMemory API
4. **Clear Database**: Archives all existing pages
5. **Sync**: Creates new pages with fresh data

## Project Structure

```
src/
├── index.ts              # Main entry point
├── github/               # GitHub API integration
│   ├── api.ts            # Client factory
│   ├── fetchStars.ts     # Fetch starred repos
│   └── fetchReleases.ts  # Fetch releases
├── notion/               # Notion API integration
│   ├── database.ts       # Database operations
│   └── schema.ts         # Schema helpers
├── sync/                 # Sync logic
│   └── sync.ts           # Main orchestrator
├── translate.ts          # Translation module
└── types/
    └── index.ts          # TypeScript types
```

## License

MIT
