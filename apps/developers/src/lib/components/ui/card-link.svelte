<script lang="ts">
import type { HTMLAnchorAttributes } from "svelte/elements";

import { Card } from "./card";

const {
  href,
  class: className,
  children,
  ...props
}: HTMLAnchorAttributes = $props();
</script>

<a {href} class:className {...props}>
  <Card class="p-6 hover:bg-muted/50 transition-colors cursor-pointer">
    {@render children?.()}
  </Card>
</a>
