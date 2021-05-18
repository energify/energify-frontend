<script lang="ts">
  export let headersNum: number;
</script>

<tr>
  <td class="px-6 py-4 text-gray-500">No results found.</td>
  {#each Array(headersNum - 1) as _}
    <td class="px-6 py-4" />
  {/each}
</tr>
