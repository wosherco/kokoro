<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { cn } from "$lib/utils";
import { Maximize2, Undo2 } from "@lucide/svelte";

interface VideoProps {
  mp4Src: string;
  webmSrc: string;
  className?: string;
}

const { mp4Src, webmSrc, className = "" }: VideoProps = $props();

function toggleFullscreen() {
  const video = document.getElementById(mp4Src) as HTMLVideoElement;
  if (!video) return;

  if (!document.fullscreenElement) {
    video.requestFullscreen().catch((err) => {
      console.error("Error attempting to enable fullscreen:", err);
    });
  } else {
    document.exitFullscreen();
  }
}
</script>

<div class="relative group">
  <div
    class="absolute left-4 top-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
  >
    <Button
      variant="secondary"
      size="icon"
      onclick={() => {
        const video = document.getElementById(mp4Src) as HTMLVideoElement;
        if (video) {
          video.currentTime = 0;
          video.play();
        }
      }}
    >
      <Undo2 class="h-4 w-4" />
    </Button>

    <Button variant="secondary" size="icon" onclick={toggleFullscreen}>
      <Maximize2 class="h-4 w-4" />
    </Button>
  </div>

  <video
    id={mp4Src}
    class={cn(
      `w-full aspect-video rounded-lg shadow-lg border bg-muted`,
      className
    )}
    autoplay
    muted
    loop
    playsinline
  >
    <source src={webmSrc} type="video/webm" />
    <source src={mp4Src} type="video/mp4" />
    Your browser does not support the video tag.
  </video>
</div>
