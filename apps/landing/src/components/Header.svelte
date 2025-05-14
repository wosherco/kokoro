<script lang="ts">
import { page } from "$app/stores";
import { PUBLIC_ACCOUNT_URL, PUBLIC_DEVELOPERS_URL } from "$env/static/public";
import { clickOutside } from "$lib/actions/click-outside";
import { Button } from "$lib/components/ui/button";
import * as m from "$lib/paraglide/messages.js";
import { cn } from "$lib/utils";
import { Github, Menu, X } from "lucide-svelte";
import { fade, slide } from "svelte/transition";

let isMenuOpen = $state(false);
const { pathname } = $props();
let scrollY = $state(0);

const isTransparent = $derived(pathname === "/" && scrollY === 0);

function toggleMenu() {
  isMenuOpen = !isMenuOpen;
}

function closeMenu() {
  isMenuOpen = false;
}
</script>

<svelte:window bind:scrollY />

<header
  class={cn(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
    isTransparent
      ? "bg-transparent"
      : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
    isTransparent ? "border-b-0" : "border-b"
  )}
>
  <nav class="container flex h-14 items-center justify-between">
    <div class="flex flex-row items-center gap-4">
      <!-- Logo -->
      <a href="/" class="text-xl font-bold"> Kokoro </a>
      <a
        href="https://github.com/wosherco/kokoro"
        target="_blank"
        class="text-sm font-medium transition-colors hover:text-primary"
      >
        <Github class="h-4 w-4" />
      </a>
    </div>

    <!-- Desktop Navigation -->
    <div class="hidden md:flex items-center justify-between flex-1">
      <div class="flex items-center justify-center flex-1 gap-4">
        <div class="flex gap-8 items-center">
          <a
            href="/app"
            class="text-sm font-medium transition-colors hover:text-primary"
            class:text-primary={$page.url.pathname.startsWith("/app")}
          >
            App
          </a>
          <a
            href="/ai"
            class="text-sm font-medium transition-colors hover:text-primary"
            class:text-primary={$page.url.pathname.startsWith("/ai")}
          >
            AI
          </a>
          <a
            href="/#pricing"
            class="text-sm font-medium transition-colors hover:text-primary"
          >
            Pricing
          </a>
          <a
            href="/contact"
            class="text-sm font-medium transition-colors hover:text-primary"
            class:text-primary={$page.url.pathname.startsWith("/contact")}
          >
            {m.nav_contact()}
          </a>
          <a
            href={PUBLIC_DEVELOPERS_URL}
            target="_blank"
            class="text-sm font-medium transition-colors hover:text-primary"
          >
            Developers
          </a>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Button href={PUBLIC_ACCOUNT_URL}>{m.nav_login()}</Button>
      </div>
    </div>

    <!-- Mobile Menu Button -->
    <button class="md:hidden p-2" onclick={toggleMenu} aria-label="Toggle menu">
      {#if isMenuOpen}
        <X class="h-6 w-6" />
      {:else}
        <Menu class="h-6 w-6" />
      {/if}
    </button>
  </nav>

  <!-- Mobile Navigation -->
  {#if isMenuOpen}
    <div
      class="md:hidden fixed inset-0 top-14 bg-background/80 backdrop-blur-sm z-40"
      transition:fade={{ duration: 200 }}
    >
      <div
        class="fixed left-0 right-0 border-b bg-background"
        transition:slide={{ duration: 200 }}
        use:clickOutside={{ enabled: isMenuOpen, cb: closeMenu }}
      >
        <div class="container flex flex-col gap-4">
          <div class="flex flex-col">
            <a
              href="/"
              class="text-sm font-medium transition-colors hover:text-primary py-3"
              class:text-primary={$page.url.pathname === "/"}
              onclick={closeMenu}
            >
              Kokoro
            </a>
            <a
              href="/app"
              class="text-sm font-medium transition-colors hover:text-primary py-3"
              class:text-primary={$page.url.pathname.startsWith("/app")}
              onclick={closeMenu}
            >
              App
            </a>
            <a
              href="/ai"
              class="text-sm font-medium transition-colors hover:text-primary py-3"
              class:text-primary={$page.url.pathname.startsWith("/ai")}
              onclick={closeMenu}
            >
              AI
            </a>
            <a
              href="/blog"
              class="text-sm font-medium transition-colors hover:text-primary py-3"
              class:text-primary={$page.url.pathname.startsWith("/blog")}
              onclick={closeMenu}
            >
              {m.nav_blog()}
            </a>
            <a
              href="/contact"
              class="text-sm font-medium transition-colors hover:text-primary py-3"
              class:text-primary={$page.url.pathname.startsWith("/contact")}
              onclick={closeMenu}
            >
              {m.nav_contact()}
            </a>
            <a
              href={PUBLIC_DEVELOPERS_URL}
              target="_blank"
              class="text-sm font-medium transition-colors hover:text-primary py-3"
              onclick={closeMenu}
            >
              Developers
            </a>
          </div>
          <div class="flex flex-col gap-2 pb-4">
            <Button href={PUBLIC_ACCOUNT_URL} onclick={closeMenu}>
              {m.nav_login()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</header>
