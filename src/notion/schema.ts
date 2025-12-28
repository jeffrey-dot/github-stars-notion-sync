import { Client } from "@notionhq/client";

export interface DatabasePage {
  id: string;
  properties: any;
}

export async function queryAllPages(
  notion: Client,
  databaseId: string
): Promise<DatabasePage[]> {
  const pages: DatabasePage[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  console.log("📋 Fetching existing pages from Notion...");

  while (hasMore) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });

    // Filter out archived pages
    const activePages = (response.results as any[]).filter((page) => !page.archived);
    pages.push(...activePages);
    hasMore = response.has_more;
    cursor = response.next_cursor ?? undefined;
  }

  console.log(`✅ Found ${pages.length} existing pages`);
  return pages;
}

export async function clearDatabase(
  notion: Client,
  databaseId: string
): Promise<void> {
  const pages = await queryAllPages(notion, databaseId);

  if (pages.length === 0) {
    console.log("✅ Database is already empty");
    return;
  }

  console.log(`🗑️  Deleting ${pages.length} existing pages...`);

  // Delete in batches of 10
  const batchSize = 10;
  for (let i = 0; i < pages.length; i += batchSize) {
    const batch = pages.slice(i, i + batchSize);

    await Promise.all(
      batch.map((page) =>
        notion.pages.update({
          page_id: page.id,
          archived: true,
        })
      )
    );

    // Small delay between batches
    if (i + batchSize < pages.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`✅ Deleted ${pages.length} pages`);
}
