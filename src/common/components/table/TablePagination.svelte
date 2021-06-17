<script lang="ts">
  export let itemsLength: number;
  export let onPageChange: (page: number) => void;
  let currentPage = 1;

  function changeCurrentPage(page: number) {
    currentPage = page;
    onPageChange(page);
  }
</script>

{#if itemsLength > 10}
  <div class="flex my-4 w-full items-center justify-end">
    {#if itemsLength !== 0}
      <button
        on:click={() => changeCurrentPage(1)}
        class:btn={currentPage === 1}
        class="mr-4 text-lg"
      >
        1
      </button>
      {#each Array(Math.min(Math.ceil(itemsLength / 10), 6)) as _, i}
        {#if i + currentPage !== 1 && i + currentPage !== Math.min(Math.ceil(itemsLength / 10), 6)}
          <button
            on:click={() => changeCurrentPage(i + currentPage)}
            class:btn={i + currentPage === currentPage}
            class="mr-4 text-lg">{currentPage + i}</button
          >
        {/if}
      {/each}
      {#if Math.min(Math.ceil(itemsLength / 10), 6) < Math.ceil(itemsLength / 10)}
        <span class="text-lg mr-4">...</span>
      {/if}
      <button
        on:click={() => changeCurrentPage(Math.min(Math.ceil(itemsLength / 10), 6))}
        class:btn={currentPage === Math.min(Math.ceil(itemsLength / 10), 6)}
        class="text-lg"
      >
        {Math.ceil(itemsLength / 10)}
      </button>
    {/if}
  </div>
{/if}
