<script lang="ts">
import { goto, invalidateAll } from "$app/navigation";
import TasklistOrCalendarCardSkeleton from "$lib/components/integrations/TasklistOrCalendarCardSkeleton.svelte";
import * as AlertDialog from "$lib/components/ui/alert-dialog";
import { Button } from "$lib/components/ui/button";
import { INTEGRATIONS_DATA } from "$lib/integrations";
import ColorPicker from "@/components/integrations/ColorPicker.svelte";
import TasklistOrCalendarCard from "@/components/integrations/TasklistOrCalendarCard.svelte";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { orpc } from "@/orpc";
import { Calendar, ListTodo, RefreshCw, Trash2 } from "lucide-svelte";
import SvelteSeo from "svelte-seo";
import { toast } from "svelte-sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { LINEAR } from "@kokoro/validators/db";
import type { PageData } from "./$types";
import WebhookSecretDialog from "./WebhookSecretDialog.svelte";

const { data }: { data: PageData } = $props();

let loadingSomething = $state(false);
let colorDialogOpen = $state<{
  open: boolean;
  title: string;
  description: string;
  color: string;
  onSubmit: (color: string) => Promise<void>;
} | null>(null);

const platformDetails =
  INTEGRATIONS_DATA[data.integrationAccount.integrationType];

async function processRequest(request: () => Promise<void>) {
  if (loadingSomething) return;
  loadingSomething = true;

  try {
    await request();
    void invalidateAll();
  } catch (error) {
    toast.error("Failed to process request");
  } finally {
    loadingSomething = false;
  }
}

const linearWebhookStatusPromise = $derived.by<
  Promise<"not_created" | "unknown" | "active" | "invalid" | undefined>
>(async () => {
  if (data.integrationAccount.integrationType === LINEAR) {
    return orpc.v1.integrations.linear
      .getWebhookStatus({
        integrationAccountId: data.integrationAccount.id,
      })
      .then(({ status }) => status);
  }
});

async function deleteAccount() {
  if (loadingSomething) return;
  loadingSomething = true;

  try {
    await orpc.v1.integrations.deleteAccount({
      integrationAccountId: data.integrationAccount.id,
    });
    await goto("/integrations");
    toast.success("Account deleted");
  } catch (error) {
    toast.error("Failed to delete account");
  } finally {
    loadingSomething = false;
  }
}
</script>

<SvelteSeo
  title="Integration Account | Kokoro"
  description="View and manage your integration account details"
/>

{#await linearWebhookStatusPromise then linearWebhookStatus}
  {#if linearWebhookStatus === "not_created" || linearWebhookStatus === "invalid"}
    <div class="w-full bg-red-500 p-4 text-white">
      {#if linearWebhookStatus === "not_created"}
        For realtime syncs to work with linear, you need to create a webhook
        manually. <a
          href="https://docs.kokoro.ws/integrations/linear#webhook"
          target="_blank"
          class="underline">Please, follow our documentation to do so.</a
        >
      {:else}
        <p>
          We cannot verify your linear webhook. Realtime syncs will not work
          until this is fixed. <a
            href="https://docs.kokoro.ws/integrations/linear#webhook"
            target="_blank"
            class="underline">Please, follow our documentation to fix it.</a
          >
        </p>
      {/if}
    </div>
  {/if}
{/await}

<div class="container mx-auto p-6 space-y-6">
  <div class="flex items-center justify-between">
    <Button variant="outline" href="/integrations">Go Back</Button>
    <div class="flex gap-2">
      <Button
        type="submit"
        onclick={() =>
          processRequest(async () => {
            await orpc.v1.integrations.queueAccountSync({
              integrationAccountId: data.integrationAccount.id,
            });
            toast.success("Account sync queued");
          })}
      >
        <RefreshCw class="mr-2 h-4 w-4" />
        Sync Account
      </Button>
      <AlertDialog.Root>
        <AlertDialog.Trigger>
          <Button variant="destructive">
            <Trash2 class="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Header>
            <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
            <AlertDialog.Description>
              This will permanently delete the {platformDetails.name} account "{data
                .integrationAccount.email}" and remove all associated data. This
              action cannot be undone.
            </AlertDialog.Description>
          </AlertDialog.Header>
          <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
              onclick={deleteAccount}
              disabled={loadingSomething}
            >
              {#if loadingSomething}
                Deleting...
              {:else}
                Delete Account
              {/if}
            </AlertDialog.Action>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog.Root>
      {#if data.integrationAccount.integrationType === LINEAR && data.integrationAccount.platformData && "workspaceId" in data.integrationAccount.platformData}
        {#await linearWebhookStatusPromise}
          <Button variant="outline" disabled>
            <div
              class="w-2 h-2 rounded-full"
              style="background-color: gray"
            ></div>
            <Skeleton class="h-2 w-24" />
          </Button>
        {:then linearWebhookStatus}
          <WebhookSecretDialog
            integrationAccountId={data.integrationAccount.id}
            workspaceId={data.integrationAccount.platformData.workspaceId}
            webhookBaseUrl={data.webhookBaseUrl}
          >
            <Button variant="outline">
              <div
                class="w-2 h-2 rounded-full"
                style="background-color: {linearWebhookStatus === 'active'
                  ? 'green'
                  : linearWebhookStatus === 'invalid'
                    ? 'red'
                    : linearWebhookStatus === 'unknown'
                      ? 'yellow'
                      : 'gray'}"
              ></div>
              Configure Webhook
            </Button>
          </WebhookSecretDialog>
        {/await}
      {/if}
    </div>
  </div>

  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <div class="flex flex-col items-center gap-2">
        <div class="relative">
          <Avatar>
            <AvatarImage src={data.integrationAccount.profilePicture} />
            <AvatarFallback>
              {data.integrationAccount.email[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <img
            src={INTEGRATIONS_DATA[data.integrationAccount.integrationType]
              .icon}
            alt={INTEGRATIONS_DATA[data.integrationAccount.integrationType]
              .name}
            class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background bg-background"
          />
        </div>
      </div>

      <div>
        {#if platformDetails}
          <p class="text-sm text-muted-foreground">{platformDetails.name}</p>
        {/if}
        <h1 class="text-4xl font-bold">
          {data.integrationAccount.platformDisplayName ||
            data.integrationAccount.email}
        </h1>
        <p class="text-muted-foreground">
          {data.integrationAccount.email}
        </p>
        {#if data.integrationAccount.invalidGrant}
          <div class="flex items-center gap-2 mt-2">
            <p class="text-destructive flex items-center gap-1">
              This account needs to be reauthorized
            </p>
            <Button
              variant="destructive"
              size="sm"
              href={`/connect/${INTEGRATIONS_DATA[data.integrationAccount.integrationType].reauthorizeUrl}`}
            >
              Reauthorize Now
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>

  {#if data.calendars}
    <div class="space-y-4">
      <h2 class="text-2xl font-bold">Calendars</h2>
      {#await data.calendars}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each Array(4) as _}
            <TasklistOrCalendarCardSkeleton />
          {/each}
        </div>
      {:then calendars}
        {#if calendars && calendars.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each [...calendars].sort((a, b) => {
              if (a.hidden && !b.hidden) return 1;
              if (!a.hidden && b.hidden) return -1;

              const nameA = (a.summaryOverride ?? a.summary ?? "Unknown").toLowerCase();
              const nameB = (b.summaryOverride ?? b.summary ?? "Unknown").toLowerCase();
              return nameA.localeCompare(nameB);
            }) as calendar}
              <TasklistOrCalendarCard
                title={calendar.summaryOverride ??
                  calendar.summary ??
                  "Unknown"}
                description={calendar.description ?? undefined}
                lastSynced={calendar.lastSynced}
                hidden={calendar.hidden}
                icon={Calendar}
                loading={loadingSomething}
                color={calendar.colorOverride ?? calendar.color ?? undefined}
                onColorChange={() =>
                  (colorDialogOpen = {
                    open: true,
                    title: `Change Color of ${
                      calendar.summaryOverride ?? calendar.summary ?? "Unknown"
                    }`,
                    description: "Choose a new color for this calendar",
                    color: calendar.color ?? "#00ff00",
                    onSubmit: async (color) =>
                      processRequest(async () => {
                        await orpc.v1.integrations.changeCalendarColor({
                          integrationAccountId: data.integrationAccount.id,
                          calendarId: calendar.id,
                          color,
                        });
                        toast.success("Calendar color changed");
                      }),
                  })}
                onToggleVisibility={() =>
                  processRequest(async () => {
                    await orpc.v1.integrations.toggleCalendarVisibility({
                      integrationAccountId: data.integrationAccount.id,
                      calendarId: calendar.id,
                      hidden: !calendar.hidden,
                    });
                    toast.success("Calendar visibility toggled");
                  })}
                onRefresh={() =>
                  processRequest(async () => {
                    await orpc.v1.integrations.queueCalendarSync({
                      integrationAccountId: data.integrationAccount.id,
                      calendarId: calendar.id,
                    });
                    toast.success("Calendar sync queued");
                  })}
              />
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground">No calendars found</p>
        {/if}
      {:catch error}
        <p class="text-destructive">Error loading calendars: {error.message}</p>
      {/await}
    </div>
  {/if}

  {#if data.tasklists}
    <div class="space-y-4">
      <h2 class="text-2xl font-bold">Task Lists</h2>
      {#await data.tasklists}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each Array(4) as _}
            <TasklistOrCalendarCardSkeleton />
          {/each}
        </div>
      {:then tasklists}
        {#if tasklists && tasklists.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {#each [...tasklists].sort((a, b) => {
              if (a.hidden && !b.hidden) return 1;
              if (!a.hidden && b.hidden) return -1;

              const nameA = a.name.toLowerCase();
              const nameB = b.name.toLowerCase();
              return nameA.localeCompare(nameB);
            }) as tasklist}
              <TasklistOrCalendarCard
                title={tasklist.name}
                lastSynced={tasklist.lastSynced}
                hidden={tasklist.hidden}
                icon={ListTodo}
                color={tasklist.colorOverride ?? tasklist.color ?? undefined}
                loading={loadingSomething}
                onColorChange={() =>
                  (colorDialogOpen = {
                    open: true,
                    title: `Change Color of ${tasklist.name}`,
                    description: "Choose a new color for this task list",
                    color: tasklist.color ?? "#00ff00",
                    onSubmit: async (color) =>
                      processRequest(async () => {
                        await orpc.v1.integrations.changeTasklistColor({
                          integrationAccountId: data.integrationAccount.id,
                          tasklistId: tasklist.id,
                          color,
                        });
                        toast.success("Task list color changed");
                      }),
                  })}
                onToggleVisibility={() =>
                  processRequest(async () => {
                    await orpc.v1.integrations.toggleTasklistVisibility({
                      integrationAccountId: data.integrationAccount.id,
                      tasklistId: tasklist.id,
                      hidden: !tasklist.hidden,
                    });
                    toast.success("Task list visibility toggled");
                  })}
                onRefresh={() =>
                  processRequest(async () => {
                    await orpc.v1.integrations.queueTasklistSync({
                      integrationAccountId: data.integrationAccount.id,
                      tasklistId: tasklist.id,
                    });
                    toast.success("Task list sync queued");
                  })}
              />
            {/each}
          </div>
        {:else}
          <p class="text-muted-foreground">No task lists found</p>
        {/if}
      {:catch error}
        <p class="text-destructive">
          Error loading task lists: {error.message}
        </p>
      {/await}
    </div>
  {/if}

  {#if data.contacts}
    <div class="space-y-4">
      <h2 class="text-2xl font-bold">Contacts</h2>

      <p>You'll be able to see all the people that Kokoro knows pretty soon!</p>
    </div>
  {/if}
</div>

<ColorPicker
  open={colorDialogOpen !== null && colorDialogOpen.open}
  color={colorDialogOpen?.color}
  onSubmit={async (color) => {
    if (colorDialogOpen) {
      colorDialogOpen.open = false;
      await colorDialogOpen.onSubmit(color);
    }
  }}
  onClose={() => {
    if (colorDialogOpen) {
      colorDialogOpen.open = false;
    }
  }}
  title={colorDialogOpen?.title}
  description={colorDialogOpen?.description}
/>
