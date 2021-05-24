<script lang="ts">
  import Dropdown from "../../common/components/dropdown/Dropdown.svelte";

  let type = "buy";
</script>

<div class="flex items-center">
  <Dropdown name="Filter" buttonClass="btn-secundary" width={96}>
    <div class="p-4">
      <span class="uppercase text-xs text-gray-500 mb-2 font-semibold">Type</span>
      <div class="flex items-center pb-2 border-b border-gray-200">
        <div class="flex items-center mr-4">
          <input value="buy" bind:group={type} type="radio" class="mr-2" />
          <span class="text-gray-900">Buy</span>
        </div>
        <div class="flex items-center mr-4">
          <input value="sells" bind:group={type} type="radio" class="mr-2" />
          <span class="text-gray-900">Sell</span>
        </div>
        <div class="flex items-center">
          <input value="all" bind:group={type} type="radio" class="mr-2" />
          <span class="text-gray-900">All</span>
        </div>
      </div>
      <div class="uppercase text-xs text-gray-500 mt-2 font-semibold">Min. Price</div>
      <div class="mt-2">
        <input class="input" value={3} step={0.01} min={0} type="number" />
      </div>
      <div class="uppercase text-xs text-gray-500 mt-2 font-semibold">Max. Price</div>
      <div class="mt-2">
        <input class="input" value={5} step={0.01} min={0} type="number" />
      </div>
      <div class="uppercase text-xs text-gray-500 mt-2 font-semibold">Date</div>
      <div class="mt-2">
        <input class="input" type="date" />
      </div>
    </div>
  </Dropdown>
</div>
