<script lang="ts">
import { goto } from "$app/navigation";
import { orpc } from "@/orpc";
import type { Snippet } from "svelte";
import { toast } from "svelte-sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface Props {
  children: Snippet;
}

const { children }: Props = $props();

let loading = $state(false);
let name = $state("");

const isNameValid = $derived(
  name.trim().length >= 5 && name.trim().length <= 100,
);

async function createApplication() {
  loading = true;

  try {
    const createdApplication = await orpc.v1.developers.applications.create({
      name,
    });

    goto(`/applications/${createdApplication.id}`);
    toast.success("Application created successfully");
  } catch (error) {
    toast.error("Failed to create application");
  } finally {
    loading = false;
  }
}
</script>

<Dialog>
  <DialogTrigger>
    {@render children()}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Application</DialogTitle>
      <DialogDescription>
        Create a new application to access the Kokoro API.
      </DialogDescription>
    </DialogHeader>

    <div class="space-y-2">
      <Label for="name">Name</Label>
      <Input
        id="name"
        bind:value={name}
        placeholder="Application Name"
        class="w-full"
      />

      {#if !isNameValid && name.length > 0}
        <p class="text-red-500 text-sm">
          Name must be between 5 and 100 characters
        </p>
      {/if}
    </div>

    <DialogFooter>
      <Button disabled={!isNameValid || loading} onclick={createApplication}>
        {loading ? "Creating..." : "Create"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
