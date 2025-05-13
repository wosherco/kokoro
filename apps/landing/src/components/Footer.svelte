<script lang="ts">
  import * as m from "$lib/paraglide/messages.js";
  import { Github } from "lucide-svelte";
  import xlogo from "../assets/logos/x.svg";
  import { PUBLIC_DEVELOPERS_URL, PUBLIC_ACCOUNT_URL } from "$env/static/public";

  const year = new Date().getFullYear();
</script>

<footer class="mt-10 bg-black text-white">
  <div class="mx-auto max-w-screen-xl p-16">
    <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
      <!-- Services -->
      <div class="flex flex-col gap-4">
        <h3 class="text-lg font-semibold">Services</h3>
        <div class="flex flex-col gap-2">
          <a href="/" class="hover:underline">Kokoro</a>
          <a href="/app" class="hover:underline">Kokoro App</a>
          <a href="/ai" class="hover:underline">Kokoro AI</a>
          <a href={PUBLIC_DEVELOPERS_URL} class="hover:underline"
            >Kokoro API</a
          >
          <a href={PUBLIC_ACCOUNT_URL} class="hover:underline"
            >Account Dashboard</a
          >
        </div>
      </div>

      <!-- Legal -->
      <div class="flex flex-col gap-4">
        <h3 class="text-lg font-semibold">Legal</h3>
        <div class="flex flex-col gap-2">
          <a href="/terms-of-service" class="hover:underline"
            >Terms of Service</a
          >
          <a href="/privacy-policy" class="hover:underline">Privacy Policy</a>
        </div>
      </div>

      <!-- Social -->
      <div class="flex flex-col gap-4">
        <h3 class="text-lg font-semibold">Social</h3>
        <div class="flex flex-row items-center gap-4">
          <a
            href="https://x.com/wosherco"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:opacity-80"
          >
            <img src={xlogo} width="24" height="24" alt="X (Twitter)" />
          </a>
          <a
            href="https://github.com/wosherco/kokoro"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:opacity-80"
          >
            <Github class="h-6 w-6" />
          </a>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div
      class="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400"
    >
      <p>
        © {year}{" "}
        <a
          class="hover:underline"
          href="https://wosher.co"
          target="_blank"
          rel="noopener noreferrer"
        >
          wosher.co
        </a>
        . All rights reserved.
      </p>
    </div>
  </div>
</footer>
