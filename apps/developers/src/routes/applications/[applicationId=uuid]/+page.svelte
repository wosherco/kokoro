<script lang="ts">
import { goto } from "$app/navigation";
import CardLink from "@/components/CardLink.svelte";
import OAuthUrlBuilder from "@/components/OAuthUrlBuilder.svelte";
import RedirectUrisManager from "@/components/RedirectUrisManager.svelte";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CopyIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
} from "@lucide/svelte";
import SvelteSeo from "svelte-seo";
import { toast } from "svelte-sonner";
import type { PageData } from "./$types";

const { data }: { data: PageData } = $props();

let showClientSecret = $state(false);

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}
</script>

<SvelteSeo
  title={`${data.application.name} | Kokoro API`}
  description="Manage your Kokoro API application credentials"
/>

<div class="container mx-auto p-6 space-y-8">
  <div class="flex items-center gap-4">
    <Button
      variant="outline"
      onclick={() => goto("/")}
      class="flex items-center gap-2"
    >
      <ArrowLeftIcon class="w-4 h-4" />
      Back to Applications
    </Button>
  </div>

  <div class="space-y-6">
    <div class="space-y-2">
      <h1 class="text-4xl font-bold">{data.application.name}</h1>
      <h2 class="text-muted-foreground">Your application</h2>
    </div>

    <RedirectUrisManager
      applicationId={data.application.id}
      redirectUris={data.application.redirectUris}
    />

    <div class="grid gap-6 p-6 border rounded-lg bg-card">
      <h3 class="text-lg font-medium">Application Credentials</h3>
      <div class="space-y-4">
        <div class="space-y-2">
          <Label class="text-sm font-medium">Client ID</Label>
          <div class="flex items-center gap-2">
            <Input
              type="text"
              value={data.application.clientId}
              readonly
              class="font-mono"
            />
            <Button
              variant="outline"
              onclick={() => copy(data.application.clientId)}
              class="shrink-0"
            >
              <CopyIcon class="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label class="text-sm font-medium">Client Secret</Label>
          <div class="flex items-center gap-2">
            <Input
              type={showClientSecret ? "text" : "password"}
              value={data.application.clientSecret}
              readonly
              class="font-mono"
            />
            <Button
              variant="outline"
              onclick={() => copy(data.application.clientSecret)}
              class="shrink-0"
            >
              <CopyIcon class="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onclick={() => (showClientSecret = !showClientSecret)}
              class="shrink-0"
            >
              {#if showClientSecret}
                <EyeOffIcon class="w-4 h-4" />
              {:else}
                <EyeIcon class="w-4 h-4" />
              {/if}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <OAuthUrlBuilder clientId={data.application.clientId} />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <CardLink
        class="hover:bg-accent transition-colors rounded-lg"
        href="https://docs.kokoro.ws/api/#authentication"
        target="_blank"
      >
        <div class="flex items-center gap-4">
          <BookOpenIcon class="w-8 h-8" />
          <div class="space-y-1">
            <h3 class="font-semibold">Documentation & OAuth 2.0</h3>
            <p class="text-sm text-muted-foreground">
              Learn how to integrate with Kokoro API, and implement the OAuth
            </p>
          </div>
          <ExternalLinkIcon class="w-4 h-4 ml-auto" />
        </div>
      </CardLink>

      <CardLink
        class="hover:bg-accent transition-colors rounded-lg"
        href="https://api.kokoro.ws/v1/docs"
        target="_blank"
      >
        <div class="flex items-center gap-4">
          <BookOpenIcon class="w-8 h-8" />
          <div class="space-y-1">
            <h3 class="font-semibold">API Reference</h3>
            <p class="text-sm text-muted-foreground">
              Our API reference, with all the endpoints and their parameters.
            </p>
          </div>
          <ExternalLinkIcon class="w-4 h-4 ml-auto" />
        </div>
      </CardLink>
    </div>
  </div>
</div>
