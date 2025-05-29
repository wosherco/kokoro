<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { Card, CardContent } from "$lib/components/ui/card";
import { Check, Copy, Eye, EyeOff } from "@lucide/svelte";

import type { PageProps } from "./$types";

const { data }: PageProps = $props();
let copied = $state(false);
let showToken = $state(false);

async function copyToken() {
  await navigator.clipboard.writeText(data.token);
  copied = true;
  setTimeout(() => {
    copied = false;
  }, 2000);
}
</script>

<div class="container mx-auto max-w-md p-6">
  <Card class="mb-8">
    <CardContent class="pt-6">
      <div class="flex items-center gap-2 text-green-600 mb-2">
        <Check size={24} />
        <h1 class="text-xl font-bold">Successfully Logged In</h1>
      </div>
      <p class="text-muted-foreground">
        You've been successfully logged in to the Kokoro MCP. Please, copy the
        token below and paste it into your terminal.
      </p>
    </CardContent>
  </Card>

  <div class="mt-4 p-4 border rounded-md bg-muted/50">
    <p class="mb-2 text-sm text-muted-foreground">
      Copy this token and paste it into your terminal:
    </p>
    <div class="relative">
      <input
        value={data.token}
        readonly
        class="p-3 bg-muted rounded-md font-mono text-sm w-full pr-20"
        type={showToken ? "text" : "password"}
      />
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          onclick={() => (showToken = !showToken)}
        >
          {#if showToken}
            <EyeOff size={16} />
          {:else}
            <Eye size={16} />
          {/if}
        </Button>
        <Button variant="ghost" size="icon" class="h-8 w-8" onclick={copyToken}>
          {#if copied}
            <Check size={16} class="text-green-600" />
          {:else}
            <Copy size={16} />
          {/if}
        </Button>
      </div>
    </div>
  </div>
</div>
