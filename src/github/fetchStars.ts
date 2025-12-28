import { Octokit } from "octokit";
import { GitHubRepository } from "../types";

export async function fetchStarredRepositories(
  octokit: Octokit,
  username?: string
): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  console.log(
    `📥 Fetching starred repositories${username ? ` for ${username}` : ""}...`
  );

  while (hasMore) {
    try {
      const endpoint = username
        ? `GET /users/{username}/starred`
        : `GET /user/starred`;

      const { data } = await octokit.request(endpoint, {
        username,
        per_page: perPage,
        page,
        sort: "created",
        direction: "desc",
      });

      if (data.length === 0) {
        hasMore = false;
        break;
      }

      for (const item of data) {
        const repo = item as any;
        repositories.push({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          starred_at: repo.starred_at || new Date().toISOString(),
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          updated_at: repo.updated_at,
        });
      }

      console.log(`   Fetched ${data.length} repositories (page ${page})`);
      page++;

      if (data.length < perPage) {
        hasMore = false;
      }
    } catch (error: any) {
      if (error.message?.includes("404")) {
        console.error(`❌ User not found or no starred repositories`);
      } else if (error.message?.includes("403")) {
        console.error(`❌ Rate limit exceeded or authentication failed`);
      }
      throw error;
    }
  }

  console.log(`✅ Total starred repositories: ${repositories.length}`);
  return repositories;
}
