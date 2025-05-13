<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { Card } from "$lib/components/ui/card";

import "../app.css";

import Header from "$lib/components/Header.svelte";
import { Toaster } from "@/components/ui/sonner";
import SvelteSeo from "svelte-seo";

import type { LayoutData } from "./$types";

export let data: LayoutData;
</script>

<SvelteSeo
  title="Account | Kokoro"
  description="Manage your kokoro account settings"
  noindex={true}
/>

<Toaster />

<div class="min-h-screen flex flex-col">
  <Header user={data.user} />
  <main class="flex-1">
    <slot />
  </main>
</div>
