import { createGitHubClient } from "./github/api";
import { createNotionClient, validateDatabaseAccess } from "./notion/api";
import { performSync } from "./sync/sync";
import { SyncConfig } from "./types";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getConfig(): SyncConfig {
  return {
    githubToken: getEnvVar("GITHUB_TOKEN"),
    notionToken: getEnvVar("NOTION_TOKEN"),
    notionDatabaseId: getEnvVar("NOTION_DATABASE_ID"),
    githubUsername: process.env.GITHUB_USERNAME,
  };
}

export async function main(): Promise<void> {
  try {
    const config = getConfig();

    const octokit = createGitHubClient(config.githubToken);
    const notion = createNotionClient(config.notionToken);

    await validateDatabaseAccess(notion, config.notionDatabaseId);
    await performSync(octokit, notion, config.notionDatabaseId, config.githubUsername);
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
