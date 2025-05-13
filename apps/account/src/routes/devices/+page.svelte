<script lang="ts">
import { Button } from "$lib/components/ui/button";
import SvelteSeo from "svelte-seo";
</script>

<SvelteSeo
  title="Devices | Kokoro"
  description="Manage and configure your connected devices and their settings. Connect new devices and control your kokoro experience."
/>

<div class="container mx-auto p-6 space-y-6">
  <div class="flex items-center justify-between">
    <Button variant="outline" href="/">Go Back</Button>
  </div>

  <div class="space-y-4">
    <h1 class="text-4xl font-bold">Devices</h1>
    <p class="text-muted-foreground">
      Manage your connected devices and their settings
    </p>
  </div>

  <div class="text-center text-muted-foreground pt-12">
    <p>No devices connected yet.</p>
    <p>Connect your first device to get started.</p>
  </div>
</div>
