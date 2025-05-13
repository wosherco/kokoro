<script lang="ts">
import CardLink from "@/components/CardLink.svelte";
import CreateApplicationModal from "@/components/modals/CreateApplicationModal.svelte";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-svelte";
import SvelteSeo from "svelte-seo";
import type { PageData } from "./$types";

const { data }: { data: PageData } = $props();
</script>

<SvelteSeo
  title="Developers | Kokoro API"
  description="Manage Kokoro API account settings"
/>

<div class="container mx-auto p-6 space-y-6">
  <div class="space-y-4">
    <h1 class="text-4xl font-bold">Welcome Back, {data.user.name}</h1>
    <p class="text-muted-foreground">
      Manage your Kokoro API applications here.
    </p>
  </div>

  <div>
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold">Applications</h2>
      <CreateApplicationModal>
        <Button>Create Application</Button>
      </CreateApplicationModal>
    </div>

    {#await data.applications}
      <div class="flex justify-center items-center h-96">
        <Loader2 class="w-4 h-4 animate-spin" />
      </div>
    {:then value}
      {#if value.length > 0}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {#each value as application}
            <CardLink href={`/applications/${application.id}`}>
              <h3 class="text-lg font-bold">{application.name}</h3>
              <p>Created {application.createdAt.toLocaleDateString()}</p>
            </CardLink>
          {/each}
        </div>
      {:else}
        <div class="flex justify-center items-center h-96">
          <p>No applications found</p>
        </div>
      {/if}
    {:catch error}
      <p>Error loading applications</p>
    {/await}
  </div>
</div>
