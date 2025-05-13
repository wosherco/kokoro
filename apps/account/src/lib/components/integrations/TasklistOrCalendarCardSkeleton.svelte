<script lang="ts">
import { Skeleton } from "$lib/components/ui/skeleton";
</script>

<div class="p-6 border rounded-lg bg-card">
  <div class="flex items-center gap-4">
    <Skeleton class="w-10 h-10 rounded-full" />

    <div class="flex-grow space-y-2">
      <Skeleton class="h-4 w-3/4" />
      <Skeleton class="h-3 w-1/2" />
      <Skeleton class="h-3 w-1/3" />
    </div>

    <div class="flex gap-2">
      <Skeleton class="h-8 w-8 rounded-md" />
      <Skeleton class="h-8 w-8 rounded-md" />
      <Skeleton class="h-8 w-8 rounded-md" />
    </div>
  </div>
</div>
