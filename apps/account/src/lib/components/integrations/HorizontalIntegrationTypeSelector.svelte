<script lang="ts">
import { INTEGRATION_TYPES_DATA } from "$lib/integrations";
import { cn } from "@/utils";

import type { IntegrationType } from "@kokoro/validators/db";
import { INTEGRATION_TYPES } from "@kokoro/validators/db";

import { Button } from "../ui/button";

interface Props {
  /**
   * @bindable
   */
  selectedType?: IntegrationType;
  onSelect?: (type?: IntegrationType) => void;
  showAll?: boolean;
}

let { selectedType = $bindable(), onSelect, showAll = true }: Props = $props();
</script>

<div class="flex flex-row overflow-x-auto items-center gap-2">
  {#if showAll}
    <Button
      variant="outline"
      class={cn(
        "rounded-full",
        !selectedType && "bg-primary text-primary-foreground",
      )}
      onclick={() => {
        onSelect?.(undefined);
        selectedType = undefined;
      }}
    >
      All
    </Button>
  {/if}
  {#each INTEGRATION_TYPES as integrationType}
    <Button
      variant="outline"
      class={cn(
        "rounded-full",
        selectedType === integrationType &&
          "bg-primary text-primary-foreground",
      )}
      onclick={() => {
        onSelect?.(integrationType);
        selectedType = integrationType;
      }}
      disabled={INTEGRATION_TYPES_DATA[integrationType].disabled}
    >
      {INTEGRATION_TYPES_DATA[integrationType].name}
    </Button>
  {/each}
</div>
