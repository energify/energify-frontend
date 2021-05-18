<script lang="ts">
  import Card from "../../common/components/card/Card.svelte";
  import { hederaService } from "../../common/services/services.injector";
</script>

<Card bgColor="bg-gray-900">
  <div class="flex justify-between items-center">
    <div class="flex flex-col">
      <span class="text-3xl text-gray-50 font-semibold">
        {#await hederaService.fetchBalance()}
          Loading...
        {:then { hbars }}
          {hbars.toString()}
        {/await}
      </span>
      <span class="text-lg text-gray-400 font-medium">≈ $15.0</span>
    </div>
    <div>
      <button class="btn flex items-center">Add Funds </button>
    </div>
  </div>
</Card>
