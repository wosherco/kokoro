<script lang="ts">
import HorizontalIntegrationTypeSelector from "@/components/integrations/HorizontalIntegrationTypeSelector.svelte";
import Button from "@/components/ui/button/button.svelte";
import { INTEGRATIONS_DATA } from "@/integrations";
import SvelteSeo from "svelte-seo";

import type { IntegrationType } from "@kokoro/validators/db";
import {
  CALENDAR_INTEGRATION,
  CALENDAR_SOURCES,
  CONTACT_SOURCES,
  PEOPLE_INTEGRATION,
  TASK_INTEGRATION,
  TASK_SOURCES,
} from "@kokoro/validators/db";

let currentFilter = $state<IntegrationType | undefined>();
</script>

<SvelteSeo
  title="Add an Integration | Kokoro"
  description="Add a new integration to your account"
/>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex items-center justify-between">
    <Button variant="outline" href="/integrations">Go Back</Button>
  </div>

  <div class="flex flex-row gap-4">
    <div class="space-y-4 flex-grow">
      <h1 class="text-4xl font-bold">Add Integration</h1>
      <p class="text-muted-foreground">
        Connect your favorite services to kokoro
      </p>
    </div>
  </div>

  <HorizontalIntegrationTypeSelector bind:selectedType={currentFilter} />

  <div class="space-y-8">
    {#if !currentFilter || currentFilter === CALENDAR_INTEGRATION}
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <h3 class="text-2xl font-semibold">Calendar</h3>
          <div class="h-px flex-1 bg-border"></div>
        </div>

        <div class="grid gap-4">
          {#each CALENDAR_SOURCES as source}
            <div
              class="flex items-center justify-between p-6 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-start gap-6">
                <img
                  src={INTEGRATIONS_DATA[source].icon}
                  alt={INTEGRATIONS_DATA[source].name}
                  class="h-12 w-12 object-contain"
                />
                <div class="space-y-1">
                  <h4 class="font-medium text-lg">
                    {INTEGRATIONS_DATA[source].name}
                  </h4>
                  <p class="text-muted-foreground text-sm max-w-md">
                    {INTEGRATIONS_DATA[source].description}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                href={`/connect/${INTEGRATIONS_DATA[source].reauthorizeUrl}`}
              >
                Add
              </Button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if !currentFilter || currentFilter === TASK_INTEGRATION}
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <h3 class="text-2xl font-semibold">Tasks</h3>
          <div class="h-px flex-1 bg-border"></div>
        </div>

        <div class="grid gap-4">
          {#each TASK_SOURCES as source}
            <div
              class="flex items-center justify-between p-6 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-start gap-6">
                <img
                  src={INTEGRATIONS_DATA[source].icon}
                  alt={INTEGRATIONS_DATA[source].name}
                  class="h-12 w-12 object-contain"
                />
                <div class="space-y-1">
                  <h4 class="font-medium text-lg">
                    {INTEGRATIONS_DATA[source].name}
                  </h4>
                  <p class="text-muted-foreground text-sm max-w-md">
                    {INTEGRATIONS_DATA[source].description}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                href={`/connect/${INTEGRATIONS_DATA[source].reauthorizeUrl}`}
              >
                Add
              </Button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if !currentFilter || currentFilter === PEOPLE_INTEGRATION}
      <div class="space-y-4">
        <div class="flex items-center gap-2">
          <h3 class="text-2xl font-semibold">People</h3>
          <div class="h-px flex-1 bg-border"></div>
        </div>

        <div class="grid gap-4">
          {#each CONTACT_SOURCES as source}
            <div
              class="flex items-center justify-between p-6 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-start gap-6">
                <img
                  src={INTEGRATIONS_DATA[source].icon}
                  alt={INTEGRATIONS_DATA[source].name}
                  class="h-12 w-12 object-contain"
                />
                <div class="space-y-1">
                  <h4 class="font-medium text-lg">
                    {INTEGRATIONS_DATA[source].name}
                  </h4>
                  <p class="text-muted-foreground text-sm max-w-md">
                    {INTEGRATIONS_DATA[source].description}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                href={`/connect/${INTEGRATIONS_DATA[source].reauthorizeUrl}`}
              >
                Add
              </Button>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
