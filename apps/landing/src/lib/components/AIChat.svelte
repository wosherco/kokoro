<script lang="ts">
import { Skeleton } from "$lib/components/ui/skeleton";
import { Bot, Clock, Database, FileCode, Send } from "lucide-svelte";

// Color scheme from screenshot
const COLORS = {
  background: "#1e1e1e",
  sidebar: "#252526",
  editor: "#1e1e1e",
  activeTab: "#2d2d2d",
  inactiveTab: "#2d2d2d",
  lineHighlight: "rgba(77, 77, 77, 0.5)",
  textPrimary: "#d4d4d4",
  textSecondary: "#858585",
  accent: "#007acc",
  green: "#4ec9b0",
  blue: "#569cd6",
  yellow: "#dcdcaa",
  orange: "#ce9178",
  purple: "#c586c0",
  red: "#f44747",
  lineNumber: "#858585",
};

let isTyping = $state(false);
let mockResponse = $state("");

function simulateTyping() {
  isTyping = true;
  mockResponse = "";
  const fullResponse =
    "I found task K-237 in Linear. I see it's about a rendering bug in a React dropdown component. I'll help you implement a fix for this issue.";

  let currentChar = 0;
  const typingInterval = setInterval(() => {
    mockResponse += fullResponse[currentChar];
    currentChar++;

    if (currentChar >= fullResponse.length) {
      clearInterval(typingInterval);
      isTyping = false;
    }
  }, 20);
}

// Simulate typing on mount
$effect(() => {
  setTimeout(simulateTyping, 800);
});
</script>

<div
  class="flex h-[650px] rounded-xl overflow-hidden shadow-2xl border border-gray-800"
>
  <!-- Main content area -->
  <div class="flex flex-1 bg-[#1e1e1e]">
    <!-- Left panel (Chat) -->
    <div class="w-1/2 border-r border-gray-800 flex flex-col bg-[#1e1e1e]">
      <!-- Chat header -->
      <div
        class="flex items-center justify-between border-b border-gray-800 px-4 py-2"
      >
        <div class="flex items-center gap-2">
          <Bot class="h-4 w-4 text-[#007acc]" />
          <span class="text-[#d4d4d4] text-sm font-medium">Cursor</span>
        </div>
      </div>

      <!-- Chat content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- User message -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <div
              class="h-6 w-6 rounded-full bg-[#3a3a3a] flex items-center justify-center"
            >
              <span class="text-xs text-[#d4d4d4]">U</span>
            </div>
            <span class="text-xs text-[#858585]">You</span>
          </div>
          <div class="ml-8 text-[#d4d4d4] text-sm">
            Tell me about the linear task ID K-237
          </div>
        </div>

        <!-- AI Response -->
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2">
            <div
              class="h-6 w-6 rounded-full bg-[#007acc]/20 flex items-center justify-center"
            >
              <Bot class="h-3 w-3 text-[#007acc]" />
            </div>
            <span class="text-xs text-[#858585]">Cursor AI</span>
          </div>

          <!-- Loading state -->
          {#if !mockResponse}
            <div class="ml-8 text-[#d4d4d4] text-sm flex items-center gap-2">
              <div class="flex items-center gap-1">
                <div
                  class="h-1.5 w-1.5 rounded-full bg-[#007acc] animate-pulse"
                ></div>
                <div
                  class="h-1.5 w-1.5 rounded-full bg-[#007acc] animate-pulse"
                  style="animation-delay: 0.2s"
                ></div>
                <div
                  class="h-1.5 w-1.5 rounded-full bg-[#007acc] animate-pulse"
                  style="animation-delay: 0.4s"
                ></div>
              </div>
              <span class="text-xs text-[#858585]"
                >Searching your tasks on Kokoro...</span
              >
            </div>
          {:else}
            <div class="ml-8 flex items-center gap-2">
              <span class="relative flex h-3 w-3 justify-center items-center">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007acc] opacity-75"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#007acc]"
                ></span>
              </span>
              <p class=" text-[#d4d4d4] text-sm">Found 1 task on Kokoro</p>
            </div>
            <div
              class="ml-8 mt-2 bg-[#2d2d2d] border border-gray-700 rounded-md p-3 text-sm"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div
                    class="px-1.5 py-0.5 bg-[#007acc]/10 text-[#007acc] rounded text-xs font-medium"
                  >
                    K-237
                  </div>
                  <span class="text-[#d4d4d4] font-medium"
                    >Fix rendering bug in React dropdown</span
                  >
                </div>
                <div
                  class="px-1.5 py-0.5 bg-[#f97316]/10 text-[#f97316] rounded text-xs"
                >
                  To Do
                </div>
              </div>
              <p class="text-[#858585] text-xs mb-2">
                Users reported that the dropdown menu doesn't properly close
                when clicking outside. This happens in Firefox and Safari. Need
                to add an event listener to detect outside clicks and close the
                menu accordingly.
              </p>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-1 text-xs text-[#858585]">
                  <Clock size={12} />
                  <span>Due tomorrow</span>
                </div>
                <div class="flex items-center gap-2">
                  <div
                    class="px-1.5 py-0.5 bg-[#f44747]/10 text-[#f44747] rounded text-xs"
                  >
                    High
                  </div>
                </div>
              </div>
            </div>
            <div class="ml-8 mt-2 text-[#d4d4d4] text-sm whitespace-pre-line">
              {mockResponse}
            </div>
          {/if}
        </div>
      </div>

      <!-- Chat input -->
      <div class="border-t border-gray-800 p-3">
        <div
          class="flex items-center gap-2 bg-[#2d2d2d] rounded-md px-3 py-2 opacity-50 cursor-not-allowed"
        >
          <input
            type="text"
            value="Can we fix it?"
            placeholder="Ask Cursor AI..."
            class="bg-transparent border-none text-[#d4d4d4] text-sm w-full focus:outline-none"
            disabled
          />
          <button class="text-[#007acc]" disabled>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>

    <!-- Right panel (Code Editor) -->
    <div class="w-1/2 flex flex-col bg-[#1e1e1e]">
      <!-- Editor tabs -->
      <div class="flex border-b border-gray-800">
        <div
          class="px-4 py-2 bg-[#2d2d2d] text-[#d4d4d4] text-xs flex items-center gap-2 border-r border-gray-800"
        >
          <FileCode size={14} />
          <span>Dropdown.jsx</span>
        </div>
      </div>

      <!-- Code editor -->
      <div class="flex-1 overflow-y-auto font-mono text-sm p-0">
        <div class="relative">
          <!-- Line numbers -->
          <div
            class="absolute left-0 top-0 bottom-0 w-12 flex flex-col items-end pr-2 text-[#858585] text-xs py-2 select-none"
          >
            {#each Array(25) as _, i}
              <div class="h-6 flex items-center">{i + 1}</div>
            {/each}
          </div>

          <!-- Code content with skeletons -->
          <div class="pl-12 py-2">
            {#each Array(20) as _, i}
              <div class="h-6 mb-1 flex items-center gap-2">
                {#if i % 5 === 0}
                  <!-- Import line -->
                  <Skeleton class="w-16 h-4 bg-[#569cd6]/30" />
                  <Skeleton class="w-24 h-4" />
                  <Skeleton class="w-32 h-4 bg-[#ce9178]/30" />
                {:else if i % 5 === 1}
                  <!-- Variable declaration -->
                  <Skeleton class="w-12 h-4 bg-[#569cd6]/30" />
                  <Skeleton class="w-20 h-4 bg-[#9cdcfe]/30" />
                  <Skeleton class="w-40 h-4" />
                {:else if i % 5 === 2}
                  <!-- Function line -->
                  <Skeleton class="w-28 h-4 bg-[#dcdcaa]/30" />
                  <Skeleton class="w-48 h-4" />
                {:else if i % 5 === 3}
                  <!-- Conditional -->
                  <Skeleton class="w-10 h-4 bg-[#c586c0]/30" />
                  <Skeleton class="w-64 h-4" />
                {:else}
                  <!-- Empty or comment line -->
                  <Skeleton class="w-3/4 h-4 bg-[#6a9955]/20" />
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Status bar -->
      <div
        class="border-t border-gray-800 px-4 py-1 flex items-center justify-between text-xs text-[#858585]"
      >
        <div class="flex items-center gap-4">
          <span>JavaScript React</span>
          <span>UTF-8</span>
        </div>
        <div class="flex items-center gap-4">
          <span>Ln 12, Col 28</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  </div>
</div>
