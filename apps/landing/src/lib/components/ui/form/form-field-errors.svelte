<script lang="ts">
import { cn } from "$lib/utils.js";
import type { WithoutChild } from "bits-ui";
import * as FormPrimitive from "formsnap";

let {
  ref = $bindable(null),
  class: className,
  errorClasses,
  children: childrenProp,
  ...restProps
}: WithoutChild<FormPrimitive.FieldErrorsProps> & {
  errorClasses?: string | undefined | null;
} = $props();
</script>

<FormPrimitive.FieldErrors
  bind:ref
  class={cn("text-destructive text-sm font-medium", className)}
  {...restProps}
>
  {#snippet children({ errors, errorProps })}
    {#if childrenProp}
      {@render childrenProp({ errors, errorProps })}
    {:else}
      {#each errors as error}
        <div {...errorProps} class={cn(errorClasses)}>{error}</div>
      {/each}
    {/if}
  {/snippet}
</FormPrimitive.FieldErrors>
