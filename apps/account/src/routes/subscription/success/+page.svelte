<script lang="ts">
import { Button } from "$lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "$lib/components/ui/card";
import { CheckCircle2 } from "@lucide/svelte";
import SvelteSeo from "svelte-seo";
</script>

<SvelteSeo
  title="Subscription Successful | Kokoro"
  description="Your subscription to kokoro has been successfully activated."
/>

<div class="container mx-auto p-6 space-y-6">
  <Card class="max-w-md mx-auto">
    <CardHeader>
      <div class="flex justify-center mb-4">
        <CheckCircle2 class="h-12 w-12 text-green-500" />
      </div>
      <CardTitle class="text-center">Subscription Successful!</CardTitle>
      <CardDescription class="text-center">
        Thank you for subscribing to kokoro. Your subscription has been
        successfully activated.
      </CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <Button href="/subscription">View Subscription Details</Button>
      <Button variant="outline" href="/">Return Home</Button>
    </CardContent>
  </Card>
</div>
