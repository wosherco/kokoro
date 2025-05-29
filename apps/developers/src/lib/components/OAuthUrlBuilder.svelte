<script lang="ts">
import { env } from "$env/dynamic/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { OAUTH_SCOPES } from "@kokoro/validators/db";
import { CopyIcon } from "@lucide/svelte";
import { toast } from "svelte-sonner";

let { clientId } = $props<{ clientId: string }>();

let oauthType = $state<"client" | "server">("client");
let redirectUri = $state("");
let scope = $state<string[]>([]);
let stateParam = $state("");
let codeChallenge = $state("");
let codeChallengeMethod = $state<"S256" | "plain">("S256");

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

const oauthUrl = $derived.by(() => {
  const baseUrl = `${env.PUBLIC_AUTHENTICATOR_URL}/authorize`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope.join(" "),
    ...(stateParam && { state: stateParam }),
    ...(oauthType === "server" && {
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
    }),
  });

  return `${baseUrl}?${params.toString()}`;
});

function toggleScope(selectedScope: string) {
  if (scope.includes(selectedScope)) {
    scope = scope.filter((s) => s !== selectedScope);
  } else {
    scope = [...scope, selectedScope];
  }
}
</script>

<div class="grid gap-6 p-6 border rounded-lg bg-card">
  <h3 class="text-lg font-medium">OAuth URL Builder</h3>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Label class="text-sm font-medium">OAuth Type</Label>
      <div class="flex items-center gap-2">
        <Button
          variant={oauthType === "client" ? "default" : "outline"}
          onclick={() => (oauthType = "client")}
        >
          Client-side
        </Button>
        <Button
          variant={oauthType === "server" ? "default" : "outline"}
          onclick={() => (oauthType = "server")}
        >
          Server-side (PKCE)
        </Button>
      </div>
    </div>

    <div class="space-y-2">
      <Label class="text-sm font-medium">Redirect URI</Label>
      <Input
        type="text"
        placeholder="https://your-app.com/callback"
        bind:value={redirectUri}
      />
    </div>

    <div class="space-y-2">
      <Label class="text-sm font-medium">Scopes</Label>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
        {#each OAUTH_SCOPES as scopeOption}
          <Button
            variant={scope.includes(scopeOption) ? "default" : "outline"}
            onclick={() => toggleScope(scopeOption)}
            class="justify-start"
          >
            {scopeOption}
          </Button>
        {/each}
      </div>
    </div>

    <div class="space-y-2">
      <Label class="text-sm font-medium">State (Optional)</Label>
      <Input
        type="text"
        placeholder="Random state for security"
        bind:value={stateParam}
      />
    </div>

    {#if oauthType === "server"}
      <div class="space-y-2">
        <Label class="text-sm font-medium">Code Challenge</Label>
        <Input
          type="text"
          placeholder="Base64 URL encoded SHA-256 hash"
          bind:value={codeChallenge}
        />
      </div>

      <div class="space-y-2">
        <Label class="text-sm font-medium">Code Challenge Method</Label>
        <Select bind:value={codeChallengeMethod} type="single">
          <SelectTrigger>
            {codeChallengeMethod}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="S256">S256</SelectItem>
            <SelectItem value="plain">plain</SelectItem>
          </SelectContent>
        </Select>
      </div>
    {/if}

    <div class="space-y-2">
      <Label class="text-sm font-medium">Generated OAuth URL</Label>
      <div class="flex items-center gap-2">
        <Input type="text" value={oauthUrl} readonly class="font-mono" />
        <Button
          variant="outline"
          onclick={() => copy(oauthUrl)}
          class="shrink-0"
        >
          <CopyIcon class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
</div>
