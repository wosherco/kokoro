<script lang="ts">
import CardLink from "@/components/CardLink.svelte";
import SvelteSeo from "svelte-seo";

import type { PageData } from "./$types";

const { data }: { data: PageData } = $props();
</script>

<SvelteSeo
  title="Account | Kokoro"
  description="Manage your kokoro account settings"
/>

<div class="container mx-auto p-6 space-y-6">
  <div class="space-y-4">
    <h1 class="text-4xl font-bold">Welcome Back, {data.user.name}</h1>
    <p class="text-muted-foreground">
      Manage your account, devices, and subscription settings
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <CardLink href="/devices" disabled={!data.subscribed}>
      <h2 class="text-2xl font-semibold mb-2">Devices</h2>
      <p class="text-muted-foreground">
        Manage your connected devices and settings
      </p>
    </CardLink>

    <CardLink href="/integrations" disabled={!data.subscribed}>
      <h2 class="text-2xl font-semibold mb-2">Integrations</h2>
      <p class="text-muted-foreground">
        View and manage your connected accounts and integrations
      </p>
    </CardLink>

    <CardLink href="/subscription" disabled={!data.stripeEnabled}>
      <h2 class="text-2xl font-semibold mb-2">Subscription</h2>
      <p class="text-muted-foreground">
        Manage your subscription and billing details
      </p>
    </CardLink>

    <CardLink href="/settings" disabled={!data.subscribed}>
      <h2 class="text-2xl font-semibold mb-2">Settings</h2>
      <p class="text-muted-foreground">Configure your account preferences</p>
    </CardLink>
  </div>
</div>
