import { Octokit } from "octokit";
import { GitHubRepository, GitHubRelease } from "../types";

export async function fetchLatestRelease(
  octokit: Octokit,
  repository: GitHubRepository
): Promise<GitHubRelease | null> {
  try {
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/releases/latest",
      {
        owner: repository.full_name.split("/")[0],
        repo: repository.full_name.split("/")[1],
      }
    );

    // Prefer stable releases over pre-releases
    if (data.prerelease) {
      try {
        const { data: allReleases } = await octokit.request(
          "GET /repos/{owner}/{repo}/releases",
          {
            owner: repository.full_name.split("/")[0],
            repo: repository.full_name.split("/")[1],
            per_page: 10,
          }
        );

        const stableRelease = allReleases.find((r: any) => !r.prerelease);
        if (stableRelease) {
          return mapRelease(stableRelease);
        }
      } catch {
        // Fall through to use the pre-release
      }
    }

    return mapRelease(data);
  } catch (error: any) {
    if (error.status === 404) {
      // No releases found for this repository
      return null;
    }
    console.warn(
      `⚠️  Failed to fetch release for ${repository.full_name}:`,
      error.message
    );
    return null;
  }
}

function mapRelease(data: any): GitHubRelease {
  return {
    id: data.id,
    tag_name: data.tag_name,
    name: data.name,
    body: data.body,
    html_url: data.html_url,
    published_at: data.published_at,
    created_at: data.created_at,
    prerelease: data.prerelease,
  };
}

export async function fetchReleasesForRepositories(
  octokit: Octokit,
  repositories: GitHubRepository[]
): Promise<Map<string, GitHubRelease | null>> {
  const releasesMap = new Map<string, GitHubRelease | null>();

  console.log(
    "📦 Fetching latest releases for each repository..."
  );

  // Process with concurrency control to avoid rate limits
  const concurrency = 10;
  for (let i = 0; i < repositories.length; i += concurrency) {
    const batch = repositories.slice(i, i + concurrency);
    const promises = batch.map(async (repo) => {
      const release = await fetchLatestRelease(octokit, repo);
      releasesMap.set(repo.full_name, release);

      if (release) {
        console.log(`   ✓ ${repo.full_name}: ${release.tag_name}`);
      } else {
        console.log(`   ○ ${repo.full_name}: No releases`);
      }
    });

    await Promise.all(promises);

    // Small delay between batches to be nice to the API
    if (i + concurrency < repositories.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`✅ Fetched releases for ${repositories.length} repositories`);
  return releasesMap;
}
