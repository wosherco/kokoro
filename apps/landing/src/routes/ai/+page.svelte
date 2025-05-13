<script>
  import SvelteSeo from "svelte-seo";
  import { Button } from "$lib/components/ui/button";
  import { Bot, Sparkles } from "lucide-svelte";
</script>

<SvelteSeo
  title="Kokoro AI - Coming Soon | Kokoro"
  description="Kokoro AI is an upcoming personal AI agent that learns from your data to provide personalized assistance."
  canonical="https://kokoro.ws/ai"
  openGraph={{
    title: "Kokoro AI - Coming Soon | Kokoro",
    description:
      "Kokoro AI is an upcoming personal AI agent that learns from your data to provide personalized assistance.",
    images: [{ url: "https://kokoro.ws/og.png" }],
  }}
  twitter={{
    card: "summary_large_image",
    site: "@wosherco",
  }}
/>

<div class="container mx-auto px-4 py-24 mt-16 text-center">
  <div class="max-w-3xl mx-auto">
    <div class="flex justify-center mb-8">
      <div
        class="h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center"
      >
        <Bot class="h-12 w-12 text-primary" />
      </div>
    </div>

    <h1 class="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
      Kokoro AI
    </h1>

    <div
      class="bg-primary/5 rounded-lg p-4 mb-8 inline-flex items-center gap-2"
    >
      <Sparkles class="h-5 w-5 text-primary" />
      <span class="text-sm font-medium">Coming Soon</span>
    </div>

    <p class="text-xl text-muted-foreground mb-12">
      We're working on Kokoro AI, a personal agent that will learn from your
      data to provide truly personalized assistance. Stay tuned for updates.
    </p>

    <div class="flex justify-center">
      <Button size="lg" href="https://tally.so/r/wgJY4J"
        >Join the waitlist</Button
      >
    </div>
  </div>

  <div class="mt-24 max-w-4xl mx-auto bg-muted/30 rounded-lg p-8">
    <h2 class="text-2xl font-bold mb-6">What to expect from Kokoro AI</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-background rounded-lg p-6 shadow-sm">
        <h3 class="text-lg font-medium mb-3">Personalized understanding</h3>
        <p class="text-muted-foreground">
          Kokoro AI will learn from your data, preferences, and behavior to
          provide assistance that feels truly personal and relevant.
        </p>
      </div>
      <div class="bg-background rounded-lg p-6 shadow-sm">
        <h3 class="text-lg font-medium mb-3">Context-aware intelligence</h3>
        <p class="text-muted-foreground">
          Unlike generic AI assistants, Kokoro AI will understand your context,
          your history, and your needs.
        </p>
      </div>
      <div class="bg-background rounded-lg p-6 shadow-sm">
        <h3 class="text-lg font-medium mb-3">Private by design</h3>
        <p class="text-muted-foreground">
          Your data stays yours. Kokoro AI will prioritize privacy and security,
          keeping your information protected at all times.
        </p>
      </div>
      <div class="bg-background rounded-lg p-6 shadow-sm">
        <h3 class="text-lg font-medium mb-3">Seamless integration</h3>
        <p class="text-muted-foreground">
          Kokoro AI will integrate with the entire Kokoro ecosystem and your
          existing tools for a unified experience.
        </p>
      </div>
    </div>
  </div>
</div>
