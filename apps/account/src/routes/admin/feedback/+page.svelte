<script lang="ts">
import { enhance } from "$app/forms";
import { goto } from "$app/navigation";
import { Badge } from "$lib/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "$lib/components/ui/card";
import Button from "@/components/ui/button/button.svelte";
import CardFooter from "@/components/ui/card/card-footer.svelte";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
} from "lucide-svelte";

import type { PageData } from "./$types";

const { data }: { data: PageData } = $props();

// Function to update URL parameters
function updateFilters(params: Record<string, string | null>) {
  const url = new URL(window.location.href);

  for (const [key, value] of Object.entries(params)) {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  }

  goto(url.toString(), { replaceState: true });
}

// Calculate pagination values
const currentPage = $derived(
  Math.floor(data.pagination.offset / data.pagination.limit) + 1,
);
const showingStart = $derived(data.pagination.offset + 1);
const showingEnd = $derived(data.pagination.offset + data.feedback.length);

function goToPage(page: number) {
  const newOffset = (page - 1) * data.pagination.limit;
  updateFilters({ offset: newOffset.toString() });
}
</script>

<div class="container mx-auto max-w-7xl px-4">
  <h1 class="text-3xl font-bold mb-6">Feedback</h1>

  <div class="flex gap-2 mb-4">
    <Button
      variant={data.filters.value === "positive" ? "default" : "outline"}
      onclick={() =>
        updateFilters({
          value: data.filters.value === "positive" ? null : "positive",
        })}
    >
      <ThumbsUp class="w-4 h-4 mr-1" />
      Positive
    </Button>
    <Button
      variant={data.filters.value === "negative" ? "default" : "outline"}
      onclick={() =>
        updateFilters({
          value: data.filters.value === "negative" ? null : "negative",
        })}
    >
      <ThumbsDown class="w-4 h-4 mr-1" />
      Negative
    </Button>
    <Button
      variant={data.filters.resolved === "true" ? "default" : "outline"}
      onclick={() =>
        updateFilters({
          resolved: data.filters.resolved === "true" ? null : "true",
        })}
    >
      Resolved
    </Button>
    <Button
      variant={data.filters.resolved === "false" ? "default" : "outline"}
      onclick={() =>
        updateFilters({
          resolved: data.filters.resolved === "false" ? null : "false",
        })}
    >
      Unresolved
    </Button>
    <Button
      variant="outline"
      onclick={() =>
        updateFilters({ sort: data.filters.sort === "asc" ? "desc" : "asc" })}
    >
      <ArrowUpDown class="w-4 h-4 mr-1" />
      {data.filters.sort === "asc" ? "Newest First" : "Oldest First"}
    </Button>
  </div>

  <div class="text-sm text-muted-foreground mb-4">
    Showing {showingStart} to {showingEnd}
  </div>

  <div class="flex flex-col gap-4 w-full">
    {#each data.feedback as feedback}
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            Chat #{feedback.chatId}
            <Badge variant={feedback.value === 1 ? "default" : "destructive"}>
              {#if feedback.value === 1}
                <ThumbsUp class="w-4 h-4 mr-1" />
                Positive
              {:else}
                <ThumbsDown class="w-4 h-4 mr-1" />
                Negative
              {/if}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <p class="text-sm text-muted-foreground">
              {feedback.feedback || "No written feedback provided"}
            </p>
            <p class="text-xs text-muted-foreground">
              {new Date(feedback.createdAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
        <CardFooter class="gap-2">
          <Button
            href={`https://cloud.langfuse.com/project/cm54hrjeq003333cps26ld30x/sessions/${feedback.chatId}`}
            target="_blank"
            variant="outline"
          >
            <MessageSquare class="w-4 h-4 mr-1" />
            View Chat
          </Button>
          <form
            method="POST"
            action="?/toggleResolved"
            use:enhance={() => {
              return async ({ update }) => {
                await update();
              };
            }}
          >
            <input type="hidden" name="id" value={feedback.id} />
            <input type="hidden" name="resolved" value={feedback.resolved} />
            <Button type="submit" variant="outline">
              Mark as {feedback.resolved ? "Unresolved" : "Resolved"}
            </Button>
          </form>
        </CardFooter>
      </Card>
    {/each}
  </div>

  {#if data.feedback.length > 0}
    <div class="flex items-center justify-between mt-4">
      <div class="flex gap-2">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onclick={() => goToPage(currentPage - 1)}
        >
          <ChevronLeft class="w-4 h-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={!data.pagination.hasMore}
          onclick={() => goToPage(currentPage + 1)}
        >
          Next
          <ChevronRight class="w-4 h-4" />
        </Button>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">
          Showing {showingStart} to {showingEnd}
        </span>
        <select
          class="border rounded px-2 py-1"
          value={data.pagination.limit}
          onchange={(e) =>
            updateFilters({
              limit: e.currentTarget.value,
              offset: "0",
            })}
        >
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>
    </div>
  {/if}
</div>
