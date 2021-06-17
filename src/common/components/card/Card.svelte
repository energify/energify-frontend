<script lang="ts">
  export let title: string = undefined;
  export let bgColor: string = "bg-white";
</script>

<div class="{bgColor} shadow overflow-hidden rounded-md w-full ">
  {#if title}
    <div class="flex justify-between mx-4 pt-6 pb-3 sm:mx-6">
      <div class="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
        <div class="ml-4 mt-2">
          <h3 class="text-xl leading-6 font-medium text-gray-900">{title}</h3>
        </div>
      </div>
      <div>
        <slot name="action" />
      </div>
    </div>
  {/if}
  <div class="px-4 py-5 sm:px-6">
    <slot />
  </div>
</div>
