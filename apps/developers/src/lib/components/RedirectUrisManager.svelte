<script lang="ts">
import { orpc } from "$lib/orpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, Trash2Icon } from "@lucide/svelte";
import { toast } from "svelte-sonner";

interface Props {
  applicationId: string;
  redirectUris: string[];
}

let { applicationId, redirectUris = [] }: Props = $props();

let newUri = $state("");
let isSubmitting = $state(false);

function validateUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function addUri() {
  if (!newUri) return;

  if (!validateUri(newUri)) {
    toast.error("Invalid redirect URI format");
    return;
  }

  if (redirectUris.includes(newUri)) {
    toast.error("This redirect URI already exists");
    return;
  }

  redirectUris = [...redirectUris, newUri];
  newUri = "";
  saveUris();
}

function removeUri(uri: string) {
  redirectUris = redirectUris.filter((u) => u !== uri);
  saveUris();
}

async function saveUris() {
  isSubmitting = true;
  try {
    await orpc.v1.developers.applications.updateRedirectUris({
      applicationId,
      redirectUris,
    });
    toast.success("Redirect URIs updated successfully");
  } catch (error) {
    toast.error("Failed to update redirect URIs");
    console.error(error);
  } finally {
    isSubmitting = false;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    addUri();
  }
}
</script>

<div class="grid gap-6 p-6 border rounded-lg bg-card">
  <h3 class="text-lg font-medium">Redirect URIs</h3>
  <div class="space-y-4">
    <div class="space-y-2">
      <Label class="text-sm font-medium">Add Redirect URI</Label>
      <div class="flex items-center gap-2">
        <Input
          type="text"
          placeholder="https://your-app.com/callback"
          bind:value={newUri}
          onkeydown={handleKeydown}
          disabled={isSubmitting}
        />
        <Button
          variant="outline"
          onclick={addUri}
          disabled={isSubmitting || !newUri}
          class="shrink-0"
        >
          <PlusIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>

    {#if redirectUris.length > 0}
      <div class="space-y-2">
        <Label class="text-sm font-medium">Current Redirect URIs</Label>
        <div class="space-y-2">
          {#each redirectUris as uri}
            <div class="flex items-center gap-2">
              <Input type="text" value={uri} readonly class="font-mono" />
              <Button
                variant="outline"
                onclick={() => removeUri(uri)}
                disabled={isSubmitting}
                class="shrink-0"
              >
                <Trash2Icon class="w-4 h-4" />
              </Button>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <p class="text-sm text-muted-foreground">No redirect URIs configured</p>
    {/if}
  </div>
</div>
