<script lang="ts">
import { Button } from "$lib/components/ui/button";
import HorizontalIntegrationTypeSelector from "@/components/integrations/HorizontalIntegrationTypeSelector.svelte";
import IntegrationAccounts from "@/components/integrations/IntegrationAccounts.svelte";
import SvelteSeo from "svelte-seo";

import type { IntegrationType } from "@kokoro/validators/db";

import type { PageData } from "./$types";

const { data }: { data: PageData } = $props();

let currentFilter: IntegrationType | undefined = $state();
</script>

<SvelteSeo
  title="Integrations | Kokoro"
  description="Manage your connected accounts and integrations with kokoro. View and control all your connected services in one place."
/>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex items-center justify-between">
    <Button variant="outline" href="/">Go Back</Button>
  </div>

  <div class="flex flex-row gap-4">
    <div class="space-y-4 flex-grow">
      <h1 class="text-4xl font-bold">Integrations</h1>
      <p class="text-muted-foreground">
        Manage your connected accounts and services
      </p>
    </div>

    <Button href="/integrations/add">+ Add Integration</Button>
  </div>

  <HorizontalIntegrationTypeSelector bind:selectedType={currentFilter} />

  {#await data.integrations}
    Loading integrations...
  {:then integrations}
    <IntegrationAccounts {integrations} filter={currentFilter} />
  {:catch error}
    <p>Error loading integrations: {error.message}</p>
  {/await}
</div>
