import { Octokit } from "octokit";

export function createGitHubClient(token: string): Octokit {
  return new Octokit({
    auth: token || undefined,
    throttle: {
      onRateLimit: (_retryAfter: number, options: any) => {
        console.warn(
          `⚠️  Rate limit hit. Request quota exhausted for ${options.method} ${options.url}`
        );
        return true;
      },
      onSecondaryRateLimit: (_retryAfter: number, _options: any) => {
        console.warn(
          `⚠️  Secondary rate limit hit. Retrying after ${_retryAfter} seconds`
        );
        return true;
      },
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
