import { Octokit } from "octokit";
import { Client } from "@notionhq/client";
import { RepositoryWithRelease } from "../types";
import { fetchStarredRepositories } from "../github/fetchStars";
import { fetchReleasesForRepositories } from "../github/fetchReleases";
import { queryAllPages } from "../notion/schema";
import { batchSyncToNotion } from "../notion/database";
import { checkRateLimit } from "../github/api";

export async function performSync(
  octokit: Octokit,
  notion: Client,
  databaseId: string
): Promise<void> {
  console.log("🚀 Starting GitHub Stars to Notion sync...\n");

  await checkRateLimit(octokit);

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

  const existingPages = await queryAllPages(notion, databaseId);

  const pageMap = new Map<string, string>();
  for (const page of existingPages) {
    const name = page.properties.Name.title[0]?.text.content;
    if (name) {
      pageMap.set(name, page.id);
    }
  }

  await batchSyncToNotion(notion, databaseId, reposWithReleases, pageMap);

  await checkRateLimit(octokit);

  console.log("\n✨ Sync completed successfully!");
}
