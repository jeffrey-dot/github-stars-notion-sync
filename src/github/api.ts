import { Octokit } from "octokit";

export function createGitHubClient(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: "github-stars-notion-sync/1.0.0",
    throttle: {
      enabled: true,
    },
  });
}

export async function checkRateLimit(octokit: Octokit): Promise<void> {
  try {
    const { data } = await octokit.request("GET /rate_limit");
    const core = data.resources.core;
    const remaining = core.remaining;
    const reset = new Date(core.reset * 1000);

    if (remaining < 100) {
      console.warn(
        `⚠️  Low rate limit: ${remaining} remaining. Resets at ${reset.toISOString()}`
      );
    }
  } catch (error) {
    console.error("Failed to check rate limit:", error);
  }
}
