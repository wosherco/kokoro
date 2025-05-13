import { fail } from "@sveltejs/kit";
import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@kokoro/db/client";
import { chatFeedbackTable } from "@kokoro/db/schema";

import type { PageServerLoad } from "./$types";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const load: PageServerLoad = async ({ url }) => {
  // Get filter parameters from URL
  const resolved = url.searchParams.get("resolved");
  const value = url.searchParams.get("value");
  const sort = url.searchParams.get("sort") ?? "desc";

  // Get pagination parameters
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT),
  );

  // Build query conditions
  const conditions = [];

  // Filter by resolved status
  if (resolved === "true") {
    conditions.push(eq(chatFeedbackTable.resolved, true));
  } else if (resolved === "false") {
    conditions.push(eq(chatFeedbackTable.resolved, false));
  }

  // Filter by feedback value (positive/negative)
  if (value === "positive") {
    conditions.push(eq(chatFeedbackTable.value, 1));
  } else if (value === "negative") {
    conditions.push(eq(chatFeedbackTable.value, -1));
  }

  const feedback = await db
    .select()
    .from(chatFeedbackTable)
    .where(and(...conditions))
    .orderBy(
      sort === "asc"
        ? asc(chatFeedbackTable.createdAt)
        : desc(chatFeedbackTable.createdAt),
    )
    .limit(limit + 1) // Fetch one extra to determine if there are more pages
    .offset(offset);

  // Check if there are more pages by looking at the extra item
  const hasMore = feedback.length > limit;

  // Remove the extra item if it exists
  const results = hasMore ? feedback.slice(0, -1) : feedback;

  return {
    feedback: results,
    pagination: {
      offset,
      limit,
      hasMore,
    },
    filters: {
      resolved,
      value,
      sort,
    },
  };
};

export const actions = {
  toggleResolved: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const currentResolved = formData.get("resolved") === "true";

    if (!id) {
      return fail(400, { message: "Missing feedback ID" });
    }

    try {
      await db
        .update(chatFeedbackTable)
        .set({ resolved: !currentResolved })
        .where(eq(chatFeedbackTable.id, id));

      return { success: true };
    } catch {
      return fail(500, { message: "Failed to update feedback status" });
    }
  },
};
