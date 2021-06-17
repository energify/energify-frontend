<script lang="ts">
  import { isValid } from "date-fns";

  import Dropdown from "../../common/components/dropdown/Dropdown.svelte";
  import { NOW_DATE } from "../../common/misc.util";

  let type = "all";
  let minPrice = "0";
  let maxPrice = "5";
  let date = "";

  export let onFiltered: (type: string, minPrice: number, maxPrice: number, date: Date) => void;

  function handleFilter() {
    const parsedDate = new Date(date);
    onFiltered(
      type,
      parseFloat(minPrice),
      parseFloat(maxPrice),
      isValid(parsedDate) ? parsedDate : undefined
    );
  }

  function handleReset() {
    type = "all";
    minPrice = "0";
    maxPrice = "5";
    date = undefined;
    handleFilter();
  }
</script>

<div class="flex items-center">
  <Dropdown name="Filter" buttonClass="btn-secundary" width={96}>
    <div class="p-4">
      <span class="uppercase text-xs text-gray-500 mb-2 font-semibold">Type</span>
      <div class="flex items-center pb-2 border-b border-gray-200">
        <div class="flex items-center mr-4">
          <input value="buy" bind:group={type} on:change={handleFilter} type="radio" class="mr-2" />
          <span class="text-gray-900">Buy</span>
        </div>
        <div class="flex items-center mr-4">
          <input
            value="sell"
            bind:group={type}
            on:change={handleFilter}
            type="radio"
            class="mr-2"
          />
          <span class="text-gray-900">Sell</span>
        </div>
        <div class="flex items-center">
          <input value="all" bind:group={type} on:change={handleFilter} type="radio" class="mr-2" />
          <span class="text-gray-900">All</span>
        </div>
      </div>
      <div class="uppercase text-xs text-gray-500 mt-2 font-semibold">Min. Price</div>
      <div class="mt-2">
        <input
          bind:value={minPrice}
          on:change={handleFilter}
          class="input"
          step={0.01}
          min={0}
          type="number"
        />
      </div>
      <div class="uppercase text-xs text-gray-500 mt-2 font-semibold">Max. Price</div>
      <div class="mt-2">
        <input
          bind:value={maxPrice}
          on:change={handleFilter}
          class="input"
          step={0.01}
          min={0}
          type="number"
        />
      </div>
      <div class="uppercase text-xs text-gray-500 mt-2 font-semibold">Date</div>
      <div class="mt-2">
        <input bind:value={date} on:change={handleFilter} class="input" type="date" />
      </div>
    </div>
    <div class="flex mr-8 mb-4 justify-end">
      <button on:click={handleReset} class="">Reset</button>
    </div>
  </Dropdown>
</div>
