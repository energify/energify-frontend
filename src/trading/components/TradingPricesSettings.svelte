<script lang="ts">
  import Icon, { Exclamation } from "svelte-hero-icons";
  import Card from "../../common/components/card/Card.svelte";
  import Modal from "../../common/components/modal/Modal.svelte";
  import { notificationService } from "../../common/services/notifications.service";
  import { transactionsService } from "../../common/services/transactions.service";
  import { usersService } from "../../common/services/users.service";

  const user = usersService.getUser();
  const prices = transactionsService.getPricesHistory();
  let pricesFormData = { buyPrice: $user.buyPrice ?? 0, sellPrice: $user.sellPrice ?? 0 };
  let modal;
  let checkPriceType = "sell";

  async function handleSave(checkPrices: boolean = false) {
    const avgPrice = $prices.reduce((acc, p) => +acc + p, 0) / $prices.length;

    if (checkPrices && pricesFormData.sellPrice > avgPrice * 1.2) {
      checkPriceType = "sell";
      modal.open();
      return;
    } else if (checkPrices && pricesFormData.buyPrice < avgPrice * 0.8) {
      checkPriceType = "buy";
      modal.open();
      return;
    }

    const { error, message } = await usersService.updatePrices(pricesFormData);
    if (error) {
      notificationService.push({
        title: "Error",
        description: message,
        type: "error",
      });
    } else {
      notificationService.push({
        title: "Success",
        description: "Your price settings were updated.",
        type: "success",
      });
    }
  }

  async function handleProceed() {
    handleSave(false);
    modal.close();
  }

  async function handleCancel() {
    pricesFormData.buyPrice = $user.buyPrice;
    pricesFormData.sellPrice = $user.sellPrice;
    modal.close();
  }
</script>

<Modal bind:this={modal}>
  <div class="flex flex-col">
    <div class="flex p-6 items-center">
      <div class="flex justify-center items-center w-28 h-28 p-4 bg-yellow-100 rounded-full mr-8">
        <Icon src={Exclamation} class="w-28 h-28 text-yellow-500" />
      </div>
      <div class="text-base text-gray-800 max-w-md">
        Your {checkPriceType} price
        <span class="font-medium text-gray-400"
          >${checkPriceType === "sell"
            ? pricesFormData.sellPrice.toFixed(2)
            : pricesFormData.buyPrice.toFixed(2)}/kWh</span
        >
        is a lot {checkPriceType === "sell" ? "higher" : "lower"} than community average. Probably your
        energy is going to be {checkPriceType === "sell" ? "sold to" : "bought from"} public grid for
        a lower price.
      </div>
    </div>
    <div class="mt-4 flex justify-end bg-gray-100 p-4 rounded-b-lg">
      <button on:click={handleProceed} class="mr-4"> Proceed </button>
      <button on:click={handleCancel} class="btn btn-primary"> Cancel </button>
    </div>
  </div>
</Modal>

<Card title="My Prices">
  <form on:submit|preventDefault={() => handleSave(true)}>
    <div class="mb-8">
      <label for="sellPrice" class="text-gray-800">
        Sell Price <span class="text-sm text-gray-500"> $ / kWh</span>
      </label>
      <input
        class="input mt-1"
        type="number"
        min="0.001"
        step="0.001"
        placeholder="1.171"
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
        min="0.001"
        step="0.001"
        placeholder="1.170"
        bind:value={pricesFormData.buyPrice}
      />
    </div>
    <div class="">
      <button class="btn text-lg flex items-center">Save</button>
    </div>
  </form>
</Card>
