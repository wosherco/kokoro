<script>
import { PUBLIC_ACCOUNT_URL } from "$env/static/public";
import AIChat from "$lib/components/AIChat.svelte";
import { Button } from "$lib/components/ui/button";
import {
  ArrowRight,
  Bot,
  Calendar,
  Database,
  Github,
  Lock,
  Server,
  Smartphone,
} from "lucide-svelte";
import SvelteSeo from "svelte-seo";
</script>

<SvelteSeo
  title="Kokoro - Central Platform for Your Digital Life"
  description="Connect all your services, unlock your data, and leverage AI to supercharge your workflow."
  canonical="https://kokoro.ws"
  openGraph={{
    title: "Kokoro - Central Platform for Your Digital Life",
    description:
      "Connect all your services, unlock your data, and leverage AI to supercharge your workflow.",
    images: [{ url: "https://kokoro.ws/og.png" }],
  }}
  twitter={{
    card: "summary_large_image",
    site: "@wosherco",
  }}
/>

<!-- Hero Section -->
<section
  class="relative mx-auto px-4 py-20 lg:py-32 flex flex-col min-h-[90vh]"
>
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1 justify-center items-center"
  >
    <div class="flex flex-col justify-center w-fit mx-auto">
      <h1
        class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
      >
        Your Data.<br />
        Your AI.<br />
        <span class="text-primary">Your Control.</span>
      </h1>
      <p class="text-xl text-muted-foreground mb-8 max-w-xl">
        Kokoro connects your favorite services and structures your data for
        powerful AI interactions, all while keeping you in control.
      </p>
      <div class="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          href="https://docs.kokoro.ws/introduction/getting-started"
          >Get Started</Button
        >
        <Button variant="outline" size="lg" href="#pricing">
          View Pricing
        </Button>
        <Button variant="ghost" size="lg" href={PUBLIC_ACCOUNT_URL}>
          Sign In
        </Button>
      </div>

      <div class="mt-8 flex items-center text-sm text-muted-foreground">
        <Lock class="h-4 w-4 mr-2" />
        <span>Your data stays private. Always.</span>
      </div>
    </div>

    <div class="flex items-center justify-center">
      <div class="w-full">
        <AIChat />
      </div>
    </div>
  </div>

  <!-- Animated Learn More Arrow -->
  <div class="absolute bottom-0 left-0 right-0 flex justify-center mb-4">
    <a
      href="#how-it-works"
      class="flex flex-row gap-4 items-center text-muted-foreground hover:text-primary transition-colors"
    >
      <span class="text-sm font-medium mb-2">Learn more!</span>
      <div class="bounce-arrow">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5L12 19M12 19L19 12M12 19L5 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </a>
  </div>
</section>

<!-- Data Flow Animation Section -->
<section class="py-20" id="how-it-works">
  <div class="container mx-auto px-4">
    <div class="text-center mb-12">
      <h2 class="text-3xl sm:text-4xl font-bold mb-4">How Kokoro Works</h2>
      <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
        Centralize your data sources, process with our AI, communicate with any
        AI.
      </p>
      <div class="mt-6">
        <Button href={PUBLIC_ACCOUNT_URL} class="group">
          Try it today
          <ArrowRight class="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>

    <div class="relative max-w-3xl mx-auto">
      <!-- Three step process -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
        <!-- Step 1: Connect -->
        <div class="bg-card rounded-xl p-6 border shadow-sm relative z-10">
          <div
            class="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto"
          >
            <svg
              class="w-6 h-6 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 2H15M12 10V16M12 22V16M12 16H18M12 16H6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="text-center font-medium mb-2">Connect</h3>
          <p class="text-sm text-muted-foreground text-center">
            Link your services and platforms to Kokoro to centralize your data.
          </p>

          <div class="mt-4 grid grid-cols-3 gap-2">
            {#each ["/cdn/brands/google-calendar.svg", "/cdn/brands/notion.svg", "/cdn/brands/slack.svg", "/cdn/brands/linear.svg", "/cdn/brands/trello.svg", "/cdn/brands/microsoft.svg"] as logo, i}
              <div
                class="connector-icon h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-medium mx-auto"
                style="animation-delay: {i * 0.1}s"
              >
                <img
                  src={logo}
                  alt={logo.split("/").pop()?.split(".")[0] ?? "logo"}
                  class="h-4 w-4"
                />
              </div>
            {/each}
          </div>
        </div>

        <!-- Step 2: Process -->
        <div
          class="bg-primary/10 rounded-xl p-6 border-2 border-primary shadow-sm relative z-20"
        >
          <div
            class="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto brain-pulse"
          >
            <svg
              class="w-6 h-6 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="text-center font-medium mb-2">Process</h3>
          <p class="text-sm text-muted-foreground text-center">
            Kokoro structures your data and makes it accessible for AI.
          </p>

          <div class="data-processing-animation mt-4 p-3 bg-card rounded-lg">
            <div
              class="h-4 w-full mb-2 overflow-hidden rounded-full bg-muted/50"
            >
              <div class="processing-bar h-full bg-primary rounded-full"></div>
            </div>
            <div class="grid grid-cols-3 gap-1">
              <div class="h-2 bg-muted/50 rounded-full processing-item"></div>
              <div class="h-2 bg-muted/50 rounded-full processing-item"></div>
              <div class="h-2 bg-muted/50 rounded-full processing-item"></div>
            </div>
          </div>
        </div>

        <!-- Step 3: Interact -->
        <div class="bg-card rounded-xl p-6 border shadow-sm relative z-10">
          <div
            class="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto"
          >
            <svg
              class="w-6 h-6 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="text-center font-medium mb-2">Interact</h3>
          <p class="text-sm text-muted-foreground text-center">
            Use Kokoro's MCP with any AI to access and interact with your data.
          </p>

          <div class="mt-4 space-y-2 ai-interaction-container">
            {#each ["C", "G", "P"] as letter, i}
              <div
                class="ai-interaction-item flex gap-2 items-center p-2 rounded-lg bg-muted/30"
                style="animation-delay: {i * 0.15 + 0.3}s"
              >
                <span
                  class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary"
                >
                  {letter}
                </span>
                <div class="h-2 flex-1 bg-muted rounded-full"></div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Connection lines for larger screens -->
      <div class="hidden md:block">
        <!-- Left to center connection -->
        <div
          class="absolute left-[28%] top-1/2 transform -translate-y-1/2 w-[12%] h-[2px] bg-primary/30"
        >
          <div class="flow-dot"></div>
          <div class="flow-dot" style="animation-delay: 0.5s"></div>
        </div>

        <!-- Center to right connection -->
        <div
          class="absolute right-[28%] top-1/2 transform -translate-y-1/2 w-[12%] h-[2px] bg-primary/30"
        >
          <div class="flow-dot-reverse"></div>
          <div class="flow-dot-reverse" style="animation-delay: 0.5s"></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Integration Section -->
<section
  class="px-4 py-16 bg-gradient-to-b from-background to-muted/30 flex flex-col items-center w-full"
  id="integrations"
>
  <div class="text-center mb-12">
    <h2 class="text-3xl sm:text-4xl font-bold mb-4">Connect Everything</h2>
    <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
      Kokoro seamlessly integrates with your favorite tools and services.
    </p>
  </div>

  <!-- Integration Cards Container - Responsive Layout -->
  <div class="w-full max-w-6xl">
    <!-- Responsive Grid/Carousel Container -->
    <div
      class="flex flex-nowrap md:flex-wrap md:grid
             md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6
             overflow-x-auto pb-4 md:pb-0 md:overflow-visible
             snap-x snap-mandatory"
    >
      <!-- Calendar Category -->
      <div
        class="flex-shrink-0 w-[85%] min-w-[250px]
               md:w-full md:min-w-0 snap-center
               bg-card rounded-xl shadow-sm border p-6
               transition-all hover:shadow-md hover:border-primary/20"
      >
        <div class="flex items-center gap-3 mb-4 md:mb-6">
          <div
            class="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <Calendar class="h-5 w-5 text-primary" />
          </div>
          <h3 class="font-semibold text-lg">Calendars</h3>
        </div>

        <div class="space-y-3 md:space-y-3">
          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors"
          >
            <img
              src="/cdn/brands/google-calendar.svg"
              alt="Google"
              class="h-6 w-6"
            />
            <span>Google Calendar</span>
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img
              src="/cdn/brands/microsoft.svg"
              alt="Outlook"
              class="h-6 w-6"
            />
            <span>Outlook</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/apple.svg" alt="Apple" class="h-6 w-6" />
            <span>Apple Calendar</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>
        </div>
      </div>

      <!-- Tasks Category -->
      <div
        class="flex-shrink-0 w-[85%] min-w-[250px]
               md:w-full md:min-w-0 snap-center
               bg-card rounded-xl shadow-sm border p-6
               transition-all hover:shadow-md hover:border-primary/20"
      >
        <div class="flex items-center gap-3 mb-4 md:mb-6">
          <div
            class="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="text-primary"
            >
              <path
                d="M9 11L12 14L20 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M20 12V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4H15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="font-semibold text-lg">Tasks</h3>
        </div>

        <div class="space-y-3 md:space-y-3">
          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors"
          >
            <img src="/cdn/brands/linear.svg" alt="Linear" class="h-6 w-6" />
            <span>Linear</span>
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/trello.svg" alt="Trello" class="h-6 w-6" />
            <span>Trello</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/asana.svg" alt="Asana" class="h-6 w-6" />
            <span>Asana</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>
        </div>
      </div>

      <!-- Email Category -->
      <div
        class="flex-shrink-0 w-[85%] min-w-[250px]
               md:w-full md:min-w-0 snap-center
               bg-card rounded-xl shadow-sm border p-6
               transition-all hover:shadow-md hover:border-primary/20"
      >
        <div class="flex items-center gap-3 mb-4 md:mb-6">
          <div
            class="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="text-primary"
            >
              <path
                d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="font-semibold text-lg">Email</h3>
        </div>

        <div class="space-y-3 md:space-y-3">
          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/gmail.svg" alt="Gmail" class="h-6 w-6" />
            <span>Gmail</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img
              src="/cdn/brands/microsoft.svg"
              alt="Outlook"
              class="h-6 w-6"
            />
            <span>Outlook</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img
              src="/cdn/brands/proton.svg"
              alt="Proton Mail"
              class="h-6 w-6"
            />
            <span>Proton Mail</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>
        </div>
      </div>

      <!-- Messages Category -->
      <div
        class="flex-shrink-0 w-[85%] min-w-[250px]
               md:w-full md:min-w-0 snap-center
               bg-card rounded-xl shadow-sm border p-6
               transition-all hover:shadow-md hover:border-primary/20"
      >
        <div class="flex items-center gap-3 mb-4 md:mb-6">
          <div
            class="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="text-primary"
            >
              <path
                d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.9706 20 12 20C10.4607 20 9.01172 19.6565 7.74467 19.0511L3 20L4.39499 16.28C3.51156 15.0423 3 13.5743 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="font-semibold text-lg">Messages</h3>
        </div>

        <div class="space-y-3 md:space-y-3">
          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/slack.svg" alt="Slack" class="h-6 w-6" />
            <span>Slack</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/microsoft.svg" alt="Teams" class="h-6 w-6" />
            <span>Teams</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/discord.svg" alt="Discord" class="h-6 w-6" />
            <span>Discord</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>
        </div>
      </div>

      <!-- Knowledge Category -->
      <div
        class="flex-shrink-0 w-[85%] min-w-[250px]
               md:w-full md:min-w-0 snap-center
               bg-card rounded-xl shadow-sm border p-6
               transition-all hover:shadow-md hover:border-primary/20"
      >
        <div class="flex items-center gap-3 mb-4 md:mb-6">
          <div
            class="bg-primary/10 p-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="text-primary"
            >
              <path
                d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3 class="font-semibold text-lg">Knowledge</h3>
        </div>

        <div class="space-y-3 md:space-y-3">
          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/notion.svg" alt="Notion" class="h-6 w-6" />
            <span>Notion</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img src="/cdn/brands/slite.svg" alt="Slite" class="h-6 w-6" />
            <span>Slite</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>

          <div
            class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-accent transition-colors relative"
          >
            <img
              src="/cdn/brands/confluence.svg"
              alt="Confluence"
              class="h-6 w-6"
            />
            <span>Confluence</span>
            <span
              class="absolute -top-2 -right-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-sm"
              >Coming Soon</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Features Section -->
<section class="bg-muted/30 py-20">
  <div class="container mx-auto px-4">
    <div class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold mb-4">Why Kokoro?</h2>
      <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
        A single platform that brings structure and intelligence to your digital
        life.
      </p>
      <div class="mt-6">
        <Button href="https://docs.kokoro.ws/introduction/getting-started" class="group">
          See how it works
          <ArrowRight class="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
      <!-- Feature 1 -->
      <div class="bg-card p-8 rounded-xl shadow-sm border">
        <div
          class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <Database class="h-6 w-6 text-primary" />
        </div>
        <h3 class="text-xl font-semibold mb-3">Structured Data</h3>
        <p class="text-muted-foreground">
          Kokoro organizes information from all your services into a coherent
          structure that AI can understand and act upon.
        </p>
      </div>

      <!-- Feature 2 -->
      <div class="bg-card p-8 rounded-xl shadow-sm border">
        <div
          class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <Bot class="h-6 w-6 text-primary" />
        </div>
        <h3 class="text-xl font-semibold mb-3">AI-Powered Actions</h3>
        <p class="text-muted-foreground">
          Let AI handle the boring stuff. Kokoro can create events, update
          tasks, draft emails, and more—all based on your natural language
          instructions.
        </p>
      </div>

      <!-- Feature 3 -->
      <div class="bg-card p-8 rounded-xl shadow-sm border">
        <div
          class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <Lock class="h-6 w-6 text-primary" />
        </div>
        <h3 class="text-xl font-semibold mb-3">Privacy First</h3>
        <p class="text-muted-foreground">
          Your data stays yours. Kokoro is designed with privacy in mind, giving
          you full control over what's shared and processed.
        </p>
      </div>
    </div>
  </div>
</section>

<!-- Open Source Section -->
<section class="container mx-auto px-4 py-20">
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
    <div class="order-2 lg:order-1">
      <div class="bg-card p-6 rounded-xl border shadow-sm overflow-hidden">
        <div class="flex items-center gap-2 mb-4">
          <div class="h-3 w-3 rounded-full bg-red-500"></div>
          <div class="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div class="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <div class="font-mono text-sm overflow-x-auto p-2 bg-muted rounded">
          <pre>git clone https://github.com/wosherco/kokoro.git
cd kokoro
docker compose up -d -f docker-compose.deploy.yaml</pre>
        </div>
      </div>
    </div>

    <div class="order-1 lg:order-2">
      <h2 class="text-3xl sm:text-4xl font-bold mb-4">
        Open Source & Self-Hostable
      </h2>
      <p class="text-lg text-muted-foreground mb-6">
        Kokoro is fully open source and can be self-hosted for personal use.
        Take control of your data infrastructure and customize it to your needs.
      </p>
      <div class="flex flex-col sm:flex-row gap-4">
        <Button target="_blank" href="https://github.com/wosherco/kokoro">
          <Github class="mr-2 h-4 w-4" />
          GitHub
        </Button>
        <Button
          variant="outline"
          target="_blank"
          href="https://docs.kokoro.ws/introduction/self-hosting-kokoro"
        >
          Learn how to self-host
        </Button>
      </div>
    </div>
  </div>
</section>

<!-- Pricing Section -->
<section class="bg-muted/30 py-20" id="pricing">
  <div class="container mx-auto px-4">
    <div class="text-center mb-16">
      <h2 class="text-3xl sm:text-4xl font-bold mb-4">Simple Pricing</h2>
      <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
        Choose the option that works best for you.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <!-- Self-hosted option -->
      <div class="bg-card rounded-xl p-8 border shadow-sm">
        <h3 class="text-2xl font-semibold mb-2">Self-Hosted</h3>
        <div class="text-3xl font-bold mb-6">
          Free
          <span class="text-base font-normal text-muted-foreground"
            >forever</span
          >
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Full access to all features</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Personal use only</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Self-managed infrastructure</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Community support</span>
          </li>
        </ul>
        <Button
          variant="outline"
          class="w-full"
          href="https://docs.kokoro.ws/introduction/self-hosting-kokoro"
        >
          <Server class="mr-2 h-4 w-4" />
          Self-Host Now
        </Button>
      </div>

      <!-- Cloud option -->
      <div class="bg-card rounded-xl p-8 border shadow-sm relative">
        <div
          class="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full"
        >
          Recommended
        </div>
        <h3 class="text-2xl font-semibold mb-2">Kokoro Cloud</h3>
        <div class="text-3xl font-bold mb-6">
          $6
          <span class="text-base font-normal text-muted-foreground"
            >/ month</span
          >
        </div>
        <ul class="space-y-3 mb-8">
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Everything in self-hosted</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>No setup required</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Automatic updates</span>
          </li>
          <li class="flex items-start">
            <svg
              class="h-5 w-5 text-green-500 mr-2 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span>Priority support</span>
          </li>
        </ul>
        <Button class="w-full" href={PUBLIC_ACCOUNT_URL}
          >Create an account today!</Button
        >
      </div>
    </div>
  </div>
</section>

<!-- Coming Soon Section -->
<section class="container mx-auto px-4 py-20">
  <div class="text-center mb-16">
    <h2 class="text-3xl sm:text-4xl font-bold mb-4">Coming Soon</h2>
    <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
      We're constantly expanding the Kokoro ecosystem.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
    <!-- Kokoro App -->
    <div
      class="bg-card rounded-xl p-8 border shadow-sm hover:shadow-md transition-all"
    >
      <div
        class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6"
      >
        <Smartphone class="h-6 w-6 text-primary" />
      </div>
      <h3 class="text-2xl font-semibold mb-3">Kokoro App</h3>
      <p class="text-muted-foreground mb-6">
        Access all your data and AI capabilities on the go with our mobile
        application. Stay connected wherever you are.
      </p>
      <Button variant="outline" href="/app" class="group">
        Learn more
        <ArrowRight
          class="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"
        />
      </Button>
    </div>

    <!-- Kokoro AI -->
    <div
      class="bg-card rounded-xl p-8 border shadow-sm hover:shadow-md transition-all"
    >
      <div
        class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6"
      >
        <Bot class="h-6 w-6 text-primary" />
      </div>
      <h3 class="text-2xl font-semibold mb-3">Kokoro AI</h3>
      <p class="text-muted-foreground mb-6">
        A powerful AI assistant that learns from your connected services to
        provide personalized, context-aware help.
      </p>
      <Button variant="outline" href="/ai" class="group">
        Learn more
        <ArrowRight
          class="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"
        />
      </Button>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="bg-primary text-primary-foreground py-16 rounded-lg my-8 mx-4">
  <div class="container mx-auto px-4 text-center">
    <h2 class="text-3xl sm:text-4xl font-bold mb-6">
      Ready to unlock your data?
    </h2>
    <p class="text-lg max-w-2xl mx-auto mb-8 text-primary-foreground/80">
      Join thousands of users who are already supercharging their productivity
      with Kokoro.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        size="lg"
        variant="secondary"
        href="https://docs.kokoro.ws/introduction/getting-started"
      >
        Get Started right now
      </Button>
      <Button
        size="lg"
        variant="outline"
        class="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20"
        href="#pricing"
      >
        View Pricing
      </Button>
    </div>
  </div>
</section>

<!-- Add these styles at the bottom of the component -->
<style>
  /* Brain animation */
  .brain-pulse {
    animation: gentlePulse 2s infinite alternate;
  }

  @keyframes gentlePulse {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(1.05);
    }
  }

  /* Processing animation */
  .processing-bar {
    width: 30%;
    animation: processData 2s infinite;
  }

  .processing-item {
    opacity: 0;
    animation: fadeInOut 2s infinite;
  }

  .processing-item:nth-child(2) {
    animation-delay: 0.3s;
  }

  .processing-item:nth-child(3) {
    animation-delay: 0.6s;
  }

  @keyframes processData {
    0% {
      width: 0%;
    }
    50% {
      width: 100%;
    }
    100% {
      width: 0%;
    }
  }

  @keyframes fadeInOut {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }

  /* Connection icons animation */
  .connector-icon {
    animation: popAndFade 2s infinite;
    opacity: 0;
  }

  @keyframes popAndFade {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    20% {
      opacity: 1;
      transform: scale(1);
    }
    80% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  /* AI interaction animation */
  .ai-interaction-item {
    opacity: 0;
    transform: translateY(10px);
    animation: slideUp 3s infinite;
  }

  @keyframes slideUp {
    0% {
      opacity: 0;
      transform: translateY(10px);
    }
    10% {
      opacity: 1;
      transform: translateY(0);
    }
    80% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-10px);
    }
  }

  /* Flow dots animation */
  .flow-dot {
    position: absolute;
    width: 6px;
    height: 6px;
    background-color: hsl(var(--primary));
    border-radius: 50%;
    top: 50%;
    transform: translateY(-50%);
    animation: flowLeft 2s infinite linear;
  }

  .flow-dot-reverse {
    position: absolute;
    width: 6px;
    height: 6px;
    background-color: hsl(var(--primary));
    border-radius: 50%;
    top: 50%;
    transform: translateY(-50%);
    animation: flowRight 2s infinite linear;
  }

  @keyframes flowLeft {
    0% {
      left: 0;
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      left: 100%;
      opacity: 0;
    }
  }

  @keyframes flowRight {
    0% {
      right: 0;
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      right: 100%;
      opacity: 0;
    }
  }

  /* Bouncing arrow animation */
  .bounce-arrow {
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-12px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  /* Remove the scrollbar-hide class and add custom scrollbar styling */
  .overflow-x-auto {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--primary) / 0.3) transparent;
  }

  .overflow-x-auto::-webkit-scrollbar {
    height: 6px;
    display: block;
  }

  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb {
    background-color: hsl(var(--primary) / 0.3);
    border-radius: 3px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--primary) / 0.5);
  }

  /* Integration carousel animations */
  .integration-carousel > div {
    transition: transform 0.3s ease;
  }

  .integration-carousel > div:hover {
    transform: translateY(-5px);
  }
</style>
