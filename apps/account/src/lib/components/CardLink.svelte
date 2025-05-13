<script lang="ts">
import { Card } from "$lib/components/ui/card";
import AnchorWithDisable from "@/components/AnchorWithDisable.svelte";

const {
  href,
  disabled,
  class: className,
  children,
  ...props
  // biome-ignore lint/suspicious/noExplicitAny: lazy to do props rn
}: any = $props();
</script>

<AnchorWithDisable {href} {disabled} class={className} {...props}>
  <Card class="p-6 hover:bg-muted/50 transition-colors cursor-pointer">
    {@render children()}
  </Card>
</AnchorWithDisable>
