<script lang="ts">
import { enhance } from "$app/forms";
import * as Avatar from "@/components/ui/avatar/index.js";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CardContent from "@/components/ui/card/card-content.svelte";
import CardFooter from "@/components/ui/card/card-footer.svelte";
import CardHeader from "@/components/ui/card/card-header.svelte";
import CardTitle from "@/components/ui/card/card-title.svelte";

import { cn } from "@/utils";
import type { PageData } from "./$types";

const { data }: { data: PageData } = $props();

function formatUrl(path: string) {
  return `/${path}?${data.redirectTo ? `redirectTo=${data.redirectTo}` : ""}`;
}
</script>

<main class="flex justify-center items-center min-h-[100dvh]">
  <Card>
    <CardHeader>
      <CardTitle class="text-center">Kokoro</CardTitle>
    </CardHeader>
    <hr class="mt-4" />
    <CardContent>
      <div class="flex flex-col gap-4 justify-center items-center">
        {#if data.user !== null}
          <Avatar.Root class="w-24 h-24">
            <!-- Adjust the width and height as needed -->
            <Avatar.Image
              src={data.user.image}
              class="object-cover w-full h-full"
            />
            <Avatar.Fallback
              class="flex items-center justify-center w-full h-full"
            >
              {data.user.name.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar.Root>
          <p>You are logged in as <b>{data.user.name}</b></p>

          <div class="flex flex-col gap-4">
            <a href={formatUrl("redirect")} class={`${buttonVariants()} w-full`}
              >Continue</a
            >
            <form method="post" use:enhance class="w-full">
              <Button class="w-full" variant="destructive" type="submit"
                >Logout</Button
              >
            </form>
          </div>
        {:else}
          <a
            href={formatUrl("google")}
            class={cn(
              buttonVariants(),
              "min-w-[200px] bg-white hover:bg-white/70"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              ><path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              /><path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              /><path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              /><path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              /><path d="M1 1h22v22H1z" fill="none" /></svg
            >
            Sign in with Google</a
          >
        {/if}
      </div>
    </CardContent>
    <CardFooter>
      <p class="text-center text-sm text-muted-foreground">
        By using Kokoro, you agree to our
        <a
          href="https://kokoro.ws/terms-of-service"
          class="underline"
          target="_blank">Terms of Service</a
        >
        and
        <a
          href="https://kokoro.ws/privacy-policy"
          class="underline"
          target="_blank">Privacy Policy</a
        >.
      </p>
    </CardFooter>
  </Card>
</main>
