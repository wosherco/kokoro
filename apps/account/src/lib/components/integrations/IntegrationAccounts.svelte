<script lang="ts">
import { INTEGRATIONS_DATA } from "@/integrations";
import { AlertTriangle, ChevronRight } from "lucide-svelte";

import type { IntegrationType } from "@kokoro/validators/db";
import { RELAXED_MAPPED_INTEGRATION_SOURCES } from "@kokoro/validators/db";

import CardLink from "../CardLink.svelte";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

interface Props {
  integrations: {
    id: string;
    integrationType: "GOOGLE_CALENDAR" | "GOOGLE_PEOPLE" | "LINEAR";
    platformAccountId: string;
    email: string;
    profilePicture: string | null;
    platformDisplayName: string;
    invalidGrant: boolean;
  }[];

  filter?: IntegrationType;
}

const { integrations, filter }: Props = $props();

const actualIntegrations = $derived(
  filter
    ? integrations.filter((integration) =>
        RELAXED_MAPPED_INTEGRATION_SOURCES[filter].includes(
          integration.integrationType,
        ),
      )
    : integrations,
);
</script>

{#if actualIntegrations.length > 0}
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each actualIntegrations as integration}
      <CardLink href="/integrations/account/{integration.id}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="relative">
              <Avatar>
                <AvatarImage src={integration.profilePicture} />
                <AvatarFallback>
                  {integration.email[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <img
                src={INTEGRATIONS_DATA[integration.integrationType].icon}
                alt={INTEGRATIONS_DATA[integration.integrationType].name}
                class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background bg-background"
              />
            </div>

            <div>
              <p class="text-xs text-muted-foreground">
                {INTEGRATIONS_DATA[integration.integrationType].name}
              </p>
              <h3 class="font-semibold">
                {integration.platformDisplayName}
              </h3>
              <p class="text-sm text-muted-foreground">
                {integration.email}
              </p>
              {#if integration.invalidGrant}
                <p
                  class="text-sm text-destructive flex items-center gap-1 mt-1"
                >
                  <AlertTriangle class="h-4 w-4" />
                  Reauthorization needed
                </p>
              {/if}
            </div>
          </div>
          <div class="flex items-center gap-2">
            {#if integration.invalidGrant}
              <Button
                variant="destructive"
                size="sm"
                href="/connect/{integration.integrationType}"
              >
                Reauthorize
              </Button>
            {/if}
            <Button variant="ghost" size="icon" class="pointer-events-none">
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardLink>
    {/each}
  </div>
{:else}
  <div class="text-center text-muted-foreground pt-6">
    <p>No integrations connected yet.</p>
    <p>Add your first integration to get started.</p>
  </div>
{/if}
