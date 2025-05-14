<script>
import Video from "$lib/components/Video.svelte";
import { Button } from "$lib/components/ui/button";
import { Brain, ListTodo, Mail, TrendingUp } from "lucide-svelte";
import posthog from "posthog-js";
import SvelteSeo from "svelte-seo";

import heroImage from "../../assets/hero.png";

// const clickbait = posthog.getFeatureFlag("hero-section") === "clickbait";
const clickbait = true;
</script>

<SvelteSeo
  title="Kokoro App - Productivity Assistant | Kokoro"
  description="Kokoro App is an upcoming productivity assistant that helps you manage your day-to-day tasks efficiently."
  canonical="https://kokoro.ws/app"
  openGraph={{
    title: "Kokoro App - Productivity Assistant | Kokoro",
    description:
      "Kokoro App is an upcoming productivity assistant that helps you manage your day-to-day tasks efficiently.",
    images: [{ url: "https://kokoro.ws/og.png" }],
  }}
  twitter={{
    card: "summary_large_image",
    site: "@wosherco",
  }}
/>

<div
  class="mt-16 bg-secondary m-8 rounded-sm min-h-[calc(100dvh-90px)] flex items-center overflow-hidden relative"
>
  <div class="container mx-auto px-4 text-center text-primary-foreground">
    <h1 class="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
      Coming Soon: Your Digital Productivity Hub
    </h1>
    <h2 class="text-xl mb-10">
      Introducing Kokoro App, a productivity assistant that will <b
        >transform how you work</b
      >.
    </h2>

    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
      <Button size="lg" href="#beta">Join the waitlist</Button>
      <Button
        size="lg"
        variant="outline"
        class="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
        href="#features"
      >
        Discover features
      </Button>
    </div>

    <div class="max-w-5xl mx-auto -mb-32">
      <img src={heroImage} alt="Kokoro App" class="rounded-lg w-full border" />
    </div>
  </div>
</div>

<!-- Features Sections -->
<div class="container mx-auto px-4" id="features">
  <div class="max-w-screen-xl mx-auto space-y-40 py-16">
    <!-- Cmd K -->
    <section class="space-y-8 text-center">
      <h2 class="text-4xl font-bold">Cmd K, type, boom</h2>
      <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
        Double your productivity without having to deal with clunky UIs. Just
        Cmd + K, type what you want to do, and get it done.
      </p>
      <Video mp4Src={"/video/video1.mp4"} webmSrc={"/video/video1.webm"} />
    </section>

    <!-- AI Assistant -->
    <section class="space-y-8 text-center">
      <h2 class="text-4xl font-bold">AI that works</h2>
      <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
        Cmd K isn't enough? Just ask Kokoro App what you need done, and it'll
        get done for you.
      </p>
      <Video mp4Src={"/video/video2.mp4"} webmSrc={"/video/video2.webm"} />
    </section>
  </div>
</div>

<!-- Future Section -->
<section class="container mx-auto px-4 py-12 sm:py-24 bg-muted/30 rounded-lg">
  <div class="max-w-screen-xl mx-auto">
    <div class="text-center mb-8 sm:mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold mb-4">Upcoming Features</h2>
      <p class="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
        Here's what we're building for the Kokoro App ecosystem.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
      <!-- Email Card -->
      <div class="bg-background rounded-xl p-8 border shadow-sm">
        <div
          class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6"
        >
          <Mail class="h-6 w-6 text-primary" />
        </div>
        <h3 class="text-xl font-semibold mb-3">Smart Email Management</h3>
        <p class="text-muted-foreground">
          Kokoro App will handle and filter your emails, providing intelligent
          notifications and helping you focus on what matters.
        </p>
      </div>

      <!-- Lists Card -->
      <div class="bg-background rounded-xl p-8 border shadow-sm">
        <div
          class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6"
        >
          <ListTodo class="h-6 w-6 text-primary" />
        </div>
        <h3 class="text-xl font-semibold mb-3">Universal Lists</h3>
        <p class="text-muted-foreground">
          Create lists for any purpose or sync them with Linear, Trello, Jira,
          Teams - you name it. All your tasks in one place.
        </p>
      </div>

      <!-- Brain Card -->
      <div class="bg-background rounded-xl p-8 border shadow-sm">
        <div
          class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6"
        >
          <Brain class="h-6 w-6 text-primary" />
        </div>
        <h3 class="text-xl font-semibold mb-3">Contextual Intelligence</h3>
        <p class="text-muted-foreground">
          Conversation and location aware, Kokoro App provides smart
          recommendations based on your context and interactions.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="container mx-auto px-4 py-12 sm:py-24" id="beta">
  <div
    class="max-w-screen-lg mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12"
  >
    <div class="flex-1 space-y-6 sm:space-y-8 text-center md:text-left">
      <h2 class="text-3xl sm:text-5xl font-bold leading-tight">
        Be the first to experience Kokoro App
      </h2>
      <p class="text-lg sm:text-xl text-muted-foreground">
        Kokoro App is currently in development. Join our waitlist for early
        access.
      </p>
      <div class="flex justify-center md:justify-start gap-4">
        <Button
          size="lg"
          variant="default"
          href="https://tally.so/r/wgJY4J"
          class="w-full md:w-auto"
        >
          Join the waitlist
        </Button>
      </div>
      <p class="text-sm text-muted-foreground">
        Or you can contact us at <a
          href="mailto:contact@kokoro.so"
          class="text-primary hover:underline">contact@kokoro.so</a
        >
      </p>
    </div>

    <div class="relative w-[200px] md:w-[240px] mt-8 md:mt-0">
      <div class="absolute -top-4 -left-4">
        <svg
          class="w-8 h-8 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12 3L14.5 9L21 9L16 13.5L18 21L12 17L6 21L8 13.5L3 9L9.5 9L12 3Z"
          />
        </svg>
      </div>
      <div
        class="aspect-square rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center"
      >
        <TrendingUp class="w-20 h-20 text-primary" strokeWidth={2.5} />
      </div>
      <div class="absolute -bottom-4 -right-4">
        <svg
          class="w-8 h-8 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12 3L14.5 9L21 9L16 13.5L18 21L12 17L6 21L8 13.5L3 9L9.5 9L12 3Z"
          />
        </svg>
      </div>
    </div>
  </div>
</section>
