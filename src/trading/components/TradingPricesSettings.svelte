<script>
  import Card from "../../common/components/card/Card.svelte";
  import TradingPricesLatest from "./TradingPricesLatest.svelte";
</script>

<Card title="My Prices">
  <form>
    <div class="mb-8">
      <label for="sellPrice" class="text-gray-800"
        >Sell Price <span class="text-sm text-gray-500"> $ / kWh</span></label
      >
      <input class="input mt-1" type="number" min="0.01" step="0.01" placeholder="1.02" />
    </div>
    <div class="mb-8">
      <label for="sellPrice" class="text-gray-800"
        >Buy Price <span class="text-sm text-gray-500"> $ / kWh</span></label
      >
      <input class="input mt-1" type="number" min="0.01" step="0.01" placeholder="1.02" />
    </div>
    <div class="">
      <button class="btn text-lg">Save</button>
    </div>
  </form>
</Card>
