import { createGitHubClient } from "./github/api";
import { createNotionClient, validateDatabaseAccess } from "./notion/api";
import { performSync } from "./sync/sync";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function main(): Promise<void> {
  try {
    const githubToken = getEnvVar("GITHUB_TOKEN");
    const notionToken = getEnvVar("NOTION_TOKEN");
    const notionDatabaseId = getEnvVar("NOTION_DATABASE_ID");

    const octokit = createGitHubClient(githubToken);
    const notion = createNotionClient(notionToken);

    await validateDatabaseAccess(notion, notionDatabaseId);
    await performSync(octokit, notion, notionDatabaseId);
  } catch (error) {
    console.error("\n❌ Sync failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
