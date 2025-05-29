<script lang="ts">
import { invalidateAll } from "$app/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/orpc";
import { Copy, Loader2 } from "@lucide/svelte";
import type { Snippet } from "svelte";
import { toast } from "svelte-sonner";

interface Props {
  integrationAccountId: string;
  webhookBaseUrl: string;
  workspaceId: string;
  children: Snippet;
}

const { integrationAccountId, workspaceId, webhookBaseUrl, children }: Props =
  $props();

let webhookSecret = $state("");
let open = $state(false);
let loading = $state(false);

const isValid = $derived(webhookSecret.startsWith("lin_wh_"));

const webhookUrl = $derived(`${webhookBaseUrl}/webhooks/linear/${workspaceId}`);

function handleClose() {
  open = false;
  webhookSecret = "";
}

async function handleSave() {
  if (!isValid || loading) {
    return;
  }

  loading = true;

  try {
    await orpc.v1.integrations.linear.setupWebhook({
      integrationAccountId,
      webhookSecret,
    });

    open = false;
    webhookSecret = "";
    toast.success("Webhook secret saved");
    invalidateAll();
  } catch (error) {
    console.error(error);
    toast.error("Failed to save webhook secret");
  } finally {
    loading = false;
  }
}
</script>

<Dialog
  {open}
  onOpenChange={(newState) => {
    if (!newState) {
      handleClose();
    }
  }}
>
  <DialogTrigger>
    {@render children()}
  </DialogTrigger>
  <DialogContent>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Configure Webhook</DialogTitle>
        <DialogDescription>
          Please, follow our <a
            href="https://docs.kokoro.ws/integrations/linear#webhook"
            target="_blank"
            class="underline">documentation</a
          > to configure the webhook for Linear.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <Label for="webhook-url">Webhook Url</Label>
        <div class="flex items-center gap-2">
          <Input id="webhook-url" type="text" value={webhookUrl} readonly />
          <Button
            variant="outline"
            onclick={() => {
              navigator.clipboard.writeText(webhookUrl);
              toast.success("Copied to clipboard");
            }}
          >
            <Copy class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="webhook-secret">Webhook Secret</Label>
        <Input id="webhook-secret" type="password" bind:value={webhookSecret} />
      </div>

      <DialogFooter>
        <DialogClose>
          <Button variant="outline">Discard</Button>
        </DialogClose>
        <Button disabled={loading || !isValid} onclick={handleSave}>
          {#if loading}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}

          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </DialogContent>
</Dialog>
