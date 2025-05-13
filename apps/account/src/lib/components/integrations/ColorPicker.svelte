<script lang="ts">
import * as Dialog from "$lib/components/ui/dialog";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface Props {
  open: boolean;
  color?: string;
  onSubmit: (color: string) => Promise<void>;
  onClose: () => void;
  title?: string;
  description?: string;
}

const { open, color, onSubmit, onClose, title, description }: Props = $props();

let localColor = $state(color ?? "#ff0000");
</script>

<Dialog.Root
  {open}
  onOpenChange={(newState) => {
    if (!newState) {
      onClose();
    }
  }}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{title ?? "Change Color"}</Dialog.Title>
      <Dialog.Description
        >{description ?? "Choose a new color"}</Dialog.Description
      >
    </Dialog.Header>

    <div class="space-y-2">
      <Label for="color">Color</Label>
      <Input type="color" name="color" id="color" bind:value={localColor} />
    </div>

    <Dialog.Footer>
      <Dialog.Close>
        <Button type="button" variant="outline" onclick={onClose}>
          Cancel
        </Button>
      </Dialog.Close>
      <Button type="submit" onclick={() => onSubmit(localColor)}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
