<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { Card } from "$lib/components/ui/card";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import {
  EyeIcon,
  EyeOffIcon,
  MoreVerticalIcon,
  RefreshCw,
} from "lucide-svelte";
import type { ComponentType } from "svelte";

interface Props {
  title: string;
  description?: string;
  lastSynced: Date | null;
  hidden: boolean;
  icon: ComponentType;
  color?: string;
  loading?: boolean;
  onColorChange?: (() => Promise<void>) | (() => void);
  onToggleVisibility?: (() => Promise<void>) | (() => void);
  onRefresh?: (() => Promise<void>) | (() => void);
}

const {
  title,
  description,
  lastSynced,
  hidden,
  icon: Icon,
  color,
  loading = false,
  onColorChange,
  onToggleVisibility,
  onRefresh,
}: Props = $props();

function getLastSyncText(date: Date | null) {
  if (!date) return "Never synced";
  return `Last synced ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
</script>

<Card class="p-6">
  <div class="flex items-center gap-4">
    <div
      class="w-10 h-10 rounded-full flex items-center justify-center bg-primary"
      style="background-color: {color}"
    >
      <Icon class="h-5 w-5 text-white" />
    </div>

    <div class="flex-grow">
      <h3 class="font-semibold">{title}</h3>
      {#if description}
        <p class="text-sm text-muted-foreground">
          {description}
        </p>
      {/if}
      <p class="text-xs text-muted-foreground">
        {getLastSyncText(lastSynced)}
      </p>
    </div>

    <div>
      {#if onToggleVisibility}
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          title={hidden ? "Show" : "Hide"}
          disabled={loading}
          onclick={onToggleVisibility}
        >
          {#if hidden}
            <EyeOffIcon class="h-4 w-4" />
          {:else}
            <EyeIcon class="h-4 w-4" />
          {/if}
        </Button>
      {/if}

      {#if onRefresh}
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={loading}
          onclick={onRefresh}
        >
          <RefreshCw class="h-4 w-4" />
        </Button>
      {/if}

      {#if onColorChange}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon class="h-4 w-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={onColorChange} disabled={loading}>
              Change Color
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>
  </div>
</Card>
