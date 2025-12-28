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

    pages.push(...(response.results as DatabasePage[]));
    hasMore = response.has_more;
    cursor = response.next_cursor ?? undefined;
  }

  console.log(`✅ Found ${pages.length} existing pages`);
  return pages;
}
