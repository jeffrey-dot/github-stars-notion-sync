import { Client } from "@notionhq/client";
import { RepositoryWithRelease } from "../types";

export async function syncRepositoryToNotion(
  notion: Client,
  databaseId: string,
  repoWithRelease: RepositoryWithRelease,
  existingPageId: string | null
): Promise<void> {
  const { repository, release } = repoWithRelease;
  const now = new Date().toISOString();

  const properties: any = {
    Name: {
      title: [
        {
          text: {
            content: repository.full_name,
          },
        },
      ],
    },
    Description: {
      rich_text: [
        {
          text: {
            content: repository.description || "",
          },
        },
      ],
    },
    URL: {
      url: repository.html_url,
    },
    StarredAt: {
      date: {
        start: repository.starred_at,
      },
    },
    LatestRelease: {
      rich_text: [
        {
          text: {
            content: release?.name || release?.tag_name || "No releases",
          },
        },
      ],
    },
    ReleaseBody: {
      rich_text: [
        {
          text: {
            content: truncateText(release?.body || "", 2000),
          },
        },
      ],
    },
    LastSyncedAt: {
      date: {
        start: now,
      },
    },
  };

  if (release?.published_at) {
    properties.ReleasePublishedAt = {
      date: {
        start: release.published_at,
      },
    };
  } else {
    properties.ReleasePublishedAt = null;
  }

  try {
    if (existingPageId) {
      await notion.pages.update({
        page_id: existingPageId,
        properties,
      });
      console.log(`   ✓ Updated: ${repository.full_name}`);
    } else {
      await notion.pages.create({
        parent: {
          type: "database_id",
          database_id: databaseId,
        },
        properties,
      });
      console.log(`   ✓ Created: ${repository.full_name}`);
    }
  } catch (error: any) {
    console.error(`   ❌ Failed to sync ${repository.full_name}:`, error.message);
    throw error;
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export async function batchSyncToNotion(
  notion: Client,
  databaseId: string,
  reposWithReleases: RepositoryWithRelease[],
  existingPages: Map<string, string>
): Promise<void> {
  console.log(`🔄 Syncing ${reposWithReleases.length} repositories to Notion...`);

  const batchSize = 5;
  for (let i = 0; i < reposWithReleases.length; i += batchSize) {
    const batch = reposWithReleases.slice(i, i + batchSize);

    await Promise.all(
      batch.map((repoWithRelease) =>
        syncRepositoryToNotion(
          notion,
          databaseId,
          repoWithRelease,
          existingPages.get(repoWithRelease.repository.full_name) || null
        )
      )
    );

    if (i + batchSize < reposWithReleases.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`✅ Sync complete!`);
}
