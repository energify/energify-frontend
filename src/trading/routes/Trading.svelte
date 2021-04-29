<script>
  import Shell from "../../common/components/shell/Shell.svelte";
  import TradingPriceHistory from "../components/TradingPriceHistory.svelte";
  import TradingPricesLatest from "../components/TradingPricesLatest.svelte";
  import TradingPricesSettings from "../components/TradingPricesSettings.svelte";
</script>

<Shell title="Trading">
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12 lg:col-span-8">
      <TradingPriceHistory />
    </div>
    <div class="col-span-12 lg:col-span-4">
      <div class="flex flex-col">
        <div class="pb-8">
          <TradingPricesLatest />
        </div>
        <TradingPricesSettings />
      </div>
    </div>
  </div>
</Shell>
