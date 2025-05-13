<script lang="ts">
import { enhance } from "$app/forms";
import { goto } from "$app/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CardContent from "@/components/ui/card/card-content.svelte";
import CardFooter from "@/components/ui/card/card-footer.svelte";
import CardHeader from "@/components/ui/card/card-header.svelte";
import CardTitle from "@/components/ui/card/card-title.svelte";
import { Check, Shield, User } from "lucide-svelte";
import type { PageData } from "./$types";

const { data }: { data: PageData } = $props();
</script>

<main class="flex justify-center items-center min-h-[100dvh] p-4">
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-center">Authorize Application</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex flex-col gap-6">
        <!-- Client Info -->
        <div class="flex items-center gap-3">
          <Shield class="w-6 h-6" />
          <div>
            <h3 class="font-semibold">{data.client.name}</h3>
            <p class="text-sm text-muted-foreground">
              wants to access your account
            </p>
          </div>
        </div>

        <!-- User Info -->
        <div class="flex items-center gap-3">
          <User class="w-6 h-6" />
          <div>
            <h3 class="font-semibold">Authorizing as</h3>
            <p class="text-sm text-muted-foreground">
              {data.user?.name || "Not logged in"}
            </p>
            <Button variant="outline" onclick={() => goto("/?redirectTo=oauth")}
              >Switch User</Button
            >
          </div>
        </div>

        <!-- Scopes -->
        <div class="space-y-2">
          <h3 class="font-semibold">Requested Permissions</h3>
          <div class="space-y-2">
            {#each data.client.scopes as scope}
              <div class="flex items-center gap-2 text-sm">
                <Check class="w-4 h-4 text-green-500" />
                <span>{scope}</span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col gap-3 pt-4">
          <form method="post" use:enhance>
            <Button type="submit" class="w-full">Authorize</Button>
          </form>
          <a
            href="https://kokoro.ws"
            class={buttonVariants({ variant: "outline" })}>Cancel</a
          >
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <p class="text-center text-sm text-muted-foreground">
        By authorizing, you agree to share your information with {data.client
          .name}
      </p>
    </CardFooter>
  </Card>
</main>
