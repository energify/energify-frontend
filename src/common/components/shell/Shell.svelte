<script lang="ts">
  import Icon, { Menu } from "svelte-hero-icons";
  import Sidebar from "../sidebar/Sidebar.svelte";
  import ShellUser from "./ShellUser.svelte";

  export let title: string;

  let sidebar: any;
</script>

<div class="flex h-screen overflow-hidden">
  <Sidebar bind:this={sidebar} />
  <main class="flex-1 focus:outline-none">
    <div
      class="flex border-b overflow-hidden border-gray-200 justify-between items-center 
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
    <div class="h-full mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-y-auto">
      <slot />
    </div>
  </main>
</div>
