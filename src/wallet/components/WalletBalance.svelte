<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../../common/components/card/Card.svelte";
  import { hederaService } from "../../common/services/hedera.service";

  const balance = hederaService.getBalance();

  onMount(() => {
    hederaService.fetchBalance();
  });
</script>

<Card bgColor="bg-gray-900">
  <div class="flex justify-between items-center">
    <div class="flex flex-col">
      <span class="text-3xl text-gray-50 font-semibold">
        {$balance} mℏ
      </span>
      <span class="text-lg text-gray-400 font-medium"
        >≈ ${(parseInt($balance) * 0.2 * 0.001).toFixed(2)}</span
      >
    </div>
    <div>
      <button class="btn flex items-center">Add Funds </button>
    </div>
  </div>
</Card>
