import { Client } from "@notionhq/client";

export function createNotionClient(token: string): Client {
  return new Client({
    auth: token,
  });
}

export async function validateDatabaseAccess(
  notion: Client,
  databaseId: string
): Promise<void> {
  try {
    await notion.databases.retrieve({ database_id: databaseId });
    console.log("✅ Successfully connected to Notion database");
  } catch (error: any) {
    if (error.code === "object_not_found") {
      throw new Error(
        "Database not found. Ensure NOTION_DATABASE_ID is correct and the integration has access."
      );
    } else if (error.code === "unauthorized") {
      throw new Error(
        "Unauthorized. Ensure NOTION_TOKEN is valid and the integration has access to this database."
      );
    }
    throw error;
  }
}
