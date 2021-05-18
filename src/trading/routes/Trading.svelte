<script>
  import Shell from "../../common/components/shell/Shell.svelte";
  import { notificationsService } from "../../common/services/services.injector";
  import TradingPriceHistory from "../components/TradingPriceHistory.svelte";
  import TradingPricesLatest from "../components/TradingPricesLatest.svelte";
  import TradingPricesSettings from "../components/TradingPricesSettings.svelte";
</script>

<Shell title="Trading">
  <div class="grid grid-cols-12 gap-12">
    <div class="col-span-12 lg:col-span-8">
      <TradingPriceHistory />
    </div>
    <div class="col-span-12 lg:col-span-4">
      <div class="flex flex-col h-full">
        <div class="mb-12">
          <TradingPricesLatest />
        </div>
        <div class="h-full">
          <TradingPricesSettings />
        </div>
      </div>
    </div>
  </div>
</Shell>
