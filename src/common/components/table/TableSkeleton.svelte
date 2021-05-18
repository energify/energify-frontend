<script lang="ts">
  export let headersNum: number;
  export let rowsNum: number = 5;
</script>

{#each Array(rowsNum) as _}
  <tr>
    {#each Array(headersNum) as _}
      <td class="animate-pulse px-6 py-4">
        <div class="h-4 bg-gray-200 rounded" />
      </td>
    {/each}
  </tr>
{/each}
