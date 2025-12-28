import { Octokit } from "octokit";
import { Client } from "@notionhq/client";
import { RepositoryWithRelease } from "../types";
import { fetchStarredRepositories } from "../github/fetchStars";
import { fetchReleasesForRepositories } from "../github/fetchReleases";
import { clearDatabase } from "../notion/schema";
import { batchSyncToNotion } from "../notion/database";
import { checkRateLimit } from "../github/api";

export async function performSync(
  octokit: Octokit,
  notion: Client,
  databaseId: string
): Promise<void> {
  console.log("🚀 Starting GitHub Stars to Notion sync...\n");

  await checkRateLimit(octokit);

  // Clear existing pages before sync
  await clearDatabase(notion, databaseId);

  const repositories = await fetchStarredRepositories(octokit);

  if (repositories.length === 0) {
    console.log("⚠️  No starred repositories found. Exiting.");
    return;
  }

  const releasesMap = await fetchReleasesForRepositories(octokit, repositories);

  const reposWithReleases: RepositoryWithRelease[] = repositories.map((repo) => ({
    repository: repo,
    release: releasesMap.get(repo.full_name) || null,
  }));

  // Database is now empty, no need to check existing pages
  await batchSyncToNotion(notion, databaseId, reposWithReleases, new Map());

  await checkRateLimit(octokit);

  console.log("\n✨ Sync completed successfully!");
}
