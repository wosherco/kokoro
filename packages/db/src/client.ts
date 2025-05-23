import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "../env";
import * as schema from "./schema";

export function createClient(uri: string) {
  const connection = postgres(uri);

  return drizzle(connection, {
    schema,
    casing: "snake_case",
  });
}

export const db = createClient(env.POSTGRES_URL);

export type DBType = typeof db;
export type TransactionClient = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type TransactableDBType = TransactionClient | typeof db;
