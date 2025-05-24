import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createClient } from "./client";

export async function migrateDatabase(uri: string) {
  const db = createClient(uri);

  await migrate(db, {
    migrationsFolder: path.join(__dirname, "../drizzle"),
  });
}
