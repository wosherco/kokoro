import type { AnyColumn } from "drizzle-orm";
import { sql } from "drizzle-orm";

export { sql, getTableColumns, getViewSelectedFields } from "drizzle-orm";
export type { AnyColumn, InferInsertModel } from "drizzle-orm";
export { alias, union, unionAll } from "drizzle-orm/pg-core";
export * from "drizzle-orm/sql";
export type { SubqueryWithSelection, PgColumn } from "drizzle-orm/pg-core";
export type { ColumnsSelection } from "drizzle-orm/sql";

export const increment = (column: AnyColumn, value = 1) => {
  return sql`${column} + ${value}`;
};

export const decrement = (column: AnyColumn, value = 1) => {
  return sql`${column} - ${value}`;
};

export const lower = (column: AnyColumn) => {
  return sql<string>`LOWER(${column})`;
};

export const unaccent = (column: AnyColumn) => {
  return sql<string>`unaccent_string(${column})`;
};
