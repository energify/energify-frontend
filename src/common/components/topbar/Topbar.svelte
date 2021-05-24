<script lang="ts">
  import type { SvelteComponent } from "svelte";
  import Icon, { Menu } from "svelte-hero-icons";
  import ShellUser from "../shell/ShellUser.svelte";

  export let title: string;
  export let sidebar: SvelteComponent;
</script>

<div
  class="flex border-b border-gray-200 justify-between items-center 
      bg-white mx-auto px-8 py-5"
>
  <div class="flex items-center">
    <Icon
      src={Menu}
      class="md:hidden text-gray-900 w-8 h-8 mr-4 cursor-pointer"
      on:click={() => sidebar.handleMenuToggle()}
    />
    <h1 class="text-3xl font-semibold text-gray-900">{title}</h1>
  </div>

  <ShellUser />
</div>
