<script lang="ts">
  import SidebarItem from "./SidebarItem.svelte";
  import Icon, { ChartBar, Cash, Home, X } from "svelte-hero-icons";
  let isMenuOpen = false;

  export function handleMenuToggle() {
    isMenuOpen = !isMenuOpen;
  }
</script>

<div
  class="fixed inset-0 flex z-40 md:hidden transition-opacity ease-linear duration-300"
  class:opacity-0={!isMenuOpen}
  class:opacity-100={isMenuOpen}
>
  <div class="fixed inset-0 bg-gray-900 bg-opacity-75" aria-hidden="true" />
  <div
    class="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gray-900 transition 
      ease-in-out duration-300 transform"
    class:-translate-x-full={!isMenuOpen}
    class:translate-x-0={isMenuOpen}
  >
    <div class="absolute top-0 right-0 -mr-12 pt-2">
      <div
        on:click={handleMenuToggle}
        class="ml-1 flex items-center justify-center h-10 w-10 rounded-full cursor-pointer"
      >
        <Icon src={X} class="text-white" />
      </div>
    </div>

    <div class="flex-shrink-0 flex items-center px-4">
      <img class="h-8 w-auto" src="https://energify.pt/logo-small.png" alt="Energify" />
      <span class="text-gray-50 ml-2 text-2xl font-medium">Energify</span>
    </div>
    <div class="mt-5 flex-1 h-0 overflow-y-auto">
      <nav class="px-2 space-y-1">
        <SidebarItem name="Dashboard" icon={Home} link="#/" />
        <SidebarItem name="Trading" icon={ChartBar} link="#/trading/" />
        <SidebarItem name="Wallet" icon={Cash} link="#/wallet/" />
      </nav>
    </div>
  </div>

  <div class="flex-shrink-0 w-14" aria-hidden="true" />
</div>

<div class="hidden md:flex md:flex-shrink-0 border-r border-gray-200">
  <div class="flex flex-col w-64">
    <div class="flex flex-col h-0 flex-1">
      <div class="flex items-center h-16 flex-shrink-0 px-7 pt-8 bg-gray-900">
        <img class="h-8 w-auto" src="https://energify.pt/logo-small.png" alt="Energify" />
        <span class="text-gray-50 ml-2 text-2xl font-medium">Energify</span>
      </div>
      <div class="flex-1 flex flex-col overflow-y-auto">
        <nav class="flex-1 px-2 py-12 bg-gray-900 space-y-1">
          <span class="uppercase text-sm text-gray-500 font-medium px-4">Navigation</span>
          <SidebarItem name="Dashboard" icon={Home} link="#/" />
          <SidebarItem name="Trading" icon={ChartBar} link="#/trading/" />
          <SidebarItem name="Wallet" icon={Cash} link="#/wallet/" />
        </nav>
      </div>
    </div>
  </div>
</div>
