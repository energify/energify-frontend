<script>
  import { onMount } from "svelte";

  import { LightningBolt, Cash, Cloud } from "svelte-hero-icons";
  import Stat from "../../common/components/stat/Stat.svelte";
  import { transactionsService } from "../../common/services/transactions.service";

  const resume = transactionsService.getMonthlyResume();

  onMount(() => {
    transactionsService.fetchMontlyResume();
  });
</script>

<div class="flex flex-col">
  <h1 class="mb-3 text-xl font-medium">Monthly Resume</h1>
  <div class="grid grid-cols-12 gap-6">
    <div class="col-span-12 md:col-span-4">
      <Stat icon={LightningBolt} text="Consumed" value={$resume.usedEnergy ?? 0} unit="kWh" />
    </div>
    <div class="col-span-12 md:col-span-4">
      <Stat icon={Cloud} text="Emitted Co2" value={$resume.emmitedCo2 ?? 0} unit="kg" />
    </div>
    <div class="col-span-12 md:col-span-4">
      <Stat icon={Cash} text="Spendings" value={Math.abs($resume.moneySpent) ?? 0} unit="$" />
    </div>
  </div>
</div>
