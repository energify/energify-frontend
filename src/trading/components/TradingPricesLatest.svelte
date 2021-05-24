<script>
  import Card from "../../common/components/card/Card.svelte";
  import Icon, { ArrowUp } from "svelte-hero-icons";
  import Badge from "../../common/components/badge/Badge.svelte";
  import { transactionsService } from "../../common/services/services.injector";
</script>

<Card bgColor="bg-gray-900">
  <div class="flex justify-between items-center">
    <div class="flex flex-col">
      <span class="text-2xl font-semibold text-gray-50">
        {#await transactionsService.fetchPriceLast24Hours()}
          ...
        {:then { data }}
          $1.17<!--${data.toFixed(2)}-->
          <span class="text-sm text-gray-400 font-normal"> / kWh</span>
        {/await}
      </span>
      <span class="text-sm text-gray-400">Last 24 hours</span>
    </div>
    <div>
      <Badge color="green" isDarkMode>
        <Icon src={ArrowUp} class="w-4 h-4 text-green-400 mr-1" solid />
        3.53%
      </Badge>
    </div>
  </div>
</Card>
