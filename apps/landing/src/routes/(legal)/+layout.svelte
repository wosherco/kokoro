<script lang="ts">
import type { Snippet } from "svelte";

const { children }: { children: Snippet } = $props();
</script>

<div class="prose lg:prose-xl mx-auto mt-32">
  {@render children()}
</div>
