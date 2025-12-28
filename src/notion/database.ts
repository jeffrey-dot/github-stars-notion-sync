import { Client } from "@notionhq/client";
import { RepositoryWithRelease } from "../types";

interface PropertyIds {
  Name: string;
  Description: string;
  DescriptionZh: string;
  URL: string;
  StarredAt: string;
  LatestRelease: string;
  ReleaseBody: string;
  ReleasePublishedAt: string;
  LastSyncedAt: string;
}

let cachedPropertyIds: PropertyIds | null = null;

async function getPropertyIds(notion: Client, databaseId: string): Promise<PropertyIds> {
  if (cachedPropertyIds) {
    return cachedPropertyIds;
  }

  const db = await notion.databases.retrieve({ database_id: databaseId });
  const props: any = db.properties;

  const ids: PropertyIds = {
    Name: props.Name.id,
    Description: props.Description.id,
    DescriptionZh: props.DescriptionZh?.id || null,
    URL: props.URL.id,
    StarredAt: props.StarredAt.id,
    LatestRelease: props.LatestRelease.id,
    ReleaseBody: props.ReleaseBody.id,
    ReleasePublishedAt: props.ReleasePublishedAt.id,
    LastSyncedAt: props.LastSyncedAt.id,
  };

  cachedPropertyIds = ids;
  return ids;
}

export async function syncRepositoryToNotion(
  notion: Client,
  databaseId: string,
  repoWithRelease: RepositoryWithRelease,
  existingPageId: string | null
): Promise<void> {
  const { repository, release, descriptionZh } = repoWithRelease;
  const now = new Date().toISOString();

  const propIds = await getPropertyIds(notion, databaseId);

  const properties: any = {
    [propIds.Name]: {
      title: [
        {
          text: {
            content: repository.full_name,
          },
        },
      ],
    },
    [propIds.Description]: {
      rich_text: [
        {
          text: {
            content: repository.description || "",
          },
        },
      ],
    },
    [propIds.URL]: {
      url: repository.html_url,
    },
    [propIds.StarredAt]: {
      date: {
        start: repository.starred_at,
      },
    },
    [propIds.LatestRelease]: {
      rich_text: [
        {
          text: {
            content: release?.name || release?.tag_name || "No releases",
          },
        },
      ],
    },
    [propIds.ReleaseBody]: {
      rich_text: [
        {
          text: {
            content: truncateText(release?.body || "", 2000),
          },
        },
      ],
    },
    [propIds.LastSyncedAt]: {
      date: {
        start: now,
      },
    },
  };

  // Add Chinese description if the field exists
  if (propIds.DescriptionZh && descriptionZh) {
    properties[propIds.DescriptionZh] = {
      rich_text: [
        {
          text: {
            content: descriptionZh,
          },
        },
      ],
    };
  }

  if (release?.published_at) {
    properties[propIds.ReleasePublishedAt] = {
      date: {
        start: release.published_at,
      },
    };
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
  _existingPages: Map<string, string>
): Promise<void> {
  console.log(`🔄 Syncing ${reposWithReleases.length} repositories to Notion...`);

  const batchSize = 5;
  for (let i = 0; i < reposWithReleases.length; i += batchSize) {
    const batch = reposWithReleases.slice(i, i + batchSize);

    await Promise.all(
      batch.map((repoWithRelease) =>
        syncRepositoryToNotion(notion, databaseId, repoWithRelease, null)
      )
    );

    if (i + batchSize < reposWithReleases.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`✅ Sync complete!`);
}
