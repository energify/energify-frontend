<script>
  import { onMount } from "svelte";

  import Card from "../../common/components/card/Card.svelte";
  import { notificationsService, usersService } from "../../common/services/services.injector";

  let pricesFormData = {
    buyPrice: 0,
    sellPrice: 0,
  };

  async function handleSave() {
    try {
      await usersService.updatePrices(pricesFormData);
      notificationsService.push({
        title: "Prices updated",
        description: "Your price settings were updated with success",
        type: "success",
      });
    } catch {}
  }

  onMount(async () => {
    const { data, error } = await usersService.fetchPrices();
    if (!error) {
      pricesFormData = data;
    }
  });
</script>

<Card title="My Prices">
  <form on:submit|preventDefault={handleSave}>
    <div class="mb-8">
      <label for="sellPrice" class="text-gray-800">
        Sell Price <span class="text-sm text-gray-500"> $ / kWh</span>
      </label>
      <input
        class="input mt-1"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="1.02"
        bind:value={pricesFormData.sellPrice}
      />
    </div>
    <div class="mb-8">
      <label for="sellPrice" class="text-gray-800">
        Buy Price <span class="text-sm text-gray-500"> $ / kWh</span>
      </label>
      <input
        class="input mt-1"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="1.02"
        bind:value={pricesFormData.buyPrice}
      />
    </div>
    <div class="">
      <button class="btn text-lg flex items-center">Save</button>
    </div>
  </form>
</Card>
