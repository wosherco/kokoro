<script lang="ts">
import { enhance } from "$app/forms";
import { Button } from "$lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "$lib/components/ui/card";
import { Bell, CalendarDays } from "lucide-svelte";
import { toast } from "svelte-sonner";
</script>

<div class="container mx-auto p-6 space-y-6">
  <h1 class="text-3xl font-bold">Admin Tasks</h1>

  <div class="grid gap-6 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <CalendarDays class="h-5 w-5" />
          Refresh Calendars
        </CardTitle>
        <CardDescription>
          Manually trigger a refresh of all Google Calendars
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          method="POST"
          action="?/refreshCalendars"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === "success") {
                toast.success("Calendars refresh triggered successfully");
              } else {
                toast.error("Failed to refresh calendars");
              }
            };
          }}
        >
          <Button type="submit" variant="default">Refresh Calendars</Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Bell class="h-5 w-5" />
          Refresh Calendar Watchers
        </CardTitle>
        <CardDescription>
          Manually trigger a refresh of Google Calendar watchers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          method="POST"
          action="?/refreshWatchers"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === "success") {
                toast.success(
                  "Calendar watchers refresh triggered successfully",
                );
              } else {
                toast.error("Failed to refresh calendar watchers");
              }
            };
          }}
        >
          <Button type="submit" variant="default">Refresh Watchers</Button>
        </form>
      </CardContent>
    </Card>
  </div>
</div>
