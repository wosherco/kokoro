<script lang="ts">
import { Button } from "$lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "$lib/components/ui/card";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { Textarea } from "$lib/components/ui/textarea";
import { trpc } from "$lib/trpc";
import SvelteSeo from "svelte-seo";
import { toast } from "svelte-sonner";

let name = $state("");
let email = $state("");
let message = $state("");
let loading = $state(false);
</script>

<SvelteSeo title="Contact Us | Kokoro" />

<div class="min-h-screen flex items-center justify-center">
  <div class="container px-4 py-8 max-w-2xl">
    <Card>
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
        <CardDescription>
          Fill out the form below and we'll get back to you as soon as possible.
          You can also reach out directly through <a
            href="mailto:contact@kokoro.ws"
            class="text-primary hover:underline">contact@kokoro.ws</a
          >
        </CardDescription>
      </CardHeader>

      <form
        onsubmit={async (e) => {
          e.preventDefault();
          loading = true;

          try {
            await trpc.landing.contact.mutate({
              name,
              email,
              message,
            });
            toast.success("Message sent successfully!");
            name = "";
            email = "";
            message = "";
          } catch (error) {
            toast.error("Failed to send message");
            console.error(error);
          } finally {
            loading = false;
          }
        }}
        class="space-y-6"
      >
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" placeholder="Your name" bind:value={name} />
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              bind:value={email}
            />
          </div>

          <div class="space-y-2">
            <Label for="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Your message here..."
              bind:value={message}
              class="min-h-[150px]"
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button class="w-full" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  </div>
</div>
