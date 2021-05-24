<script lang="ts">
  import Icon from "svelte-hero-icons";

  export let icon: any;
  export let text: string;
  export let value: string;
</script>

<div class="flex flex-between bg-white pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg">
  <div class="bg-gray-900 rounded-md h-12 2xl:w-10 w-12 flex items-center justify-center">
    <Icon src={icon} class="h-6 w-6 text-green-500" solid />
  </div>
  <div class="flex flex-col ml-4">
    <p class="text-sm font-medium text-gray-500 truncate">{text}</p>
    <div class="flex items-baseline">
      <p class="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
</div>
