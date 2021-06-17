<script lang="ts">
  export let color: string = "gray";
  export let isDarkMode: boolean = false;
</script>

<span
  class="flex bg-{color}-{isDarkMode ? '700' : '100'} text-{color}-{isDarkMode
    ? '50'
    : '800'} px-2 rounded-full font-medium items-center text-sm"
>
  <slot />
</span>
