<script lang="ts">
  import SidebarItem from "./SidebarItem.svelte";
  import { ChartBar, Cash, Home } from "svelte-hero-icons";
  let isMenuOpen = false;
</script>

<!-- Off-canvas menu for mobile, show/hide based on off-canvas menu state. -->
<div class="fixed inset-0 flex z-40 md:hidden" role="dialog" aria-modal="true">
  <!--
          Off-canvas menu overlay, show/hide based on off-canvas menu state.
    
          Entering: "transition-opacity ease-linear duration-300"
            From: "opacity-0"
            To: "opacity-100"
          Leaving: "transition-opacity ease-linear duration-300"
            From: "opacity-100"
            To: "opacity-0"
        -->
  <div class="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" />

  <!--
          Off-canvas menu, show/hide based on off-canvas menu state.
    
          Entering: "transition ease-in-out duration-300 transform"
            From: "-translate-x-full"
            To: "translate-x-0"
          Leaving: "transition ease-in-out duration-300 transform"
            From: "translate-x-0"
            To: "-translate-x-full"
        -->
  <div class="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-gray-800">
    <!--
            Close button, show/hide based on off-canvas menu state.
    
            Entering: "ease-in-out duration-300"
              From: "opacity-0"
              To: "opacity-100"
            Leaving: "ease-in-out duration-300"
              From: "opacity-100"
              To: "opacity-0"
          -->
    <div class="absolute top-0 right-0 -mr-12 pt-2">
      <button
        class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
      >
        <span class="sr-only">Close sidebar</span>
        <!-- Heroicon name: outline/x -->
        <svg
          class="h-6 w-6 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <div class="flex-shrink-0 flex items-center px-4">
      <img
        class="h-8 w-auto"
        src="https://tailwindui.com/img/logos/workflow-logo-indigo-500-mark-white-text.svg"
        alt="Workflow"
      />
    </div>
    <div class="mt-5 flex-1 h-0 overflow-y-auto">
      <nav class="px-2 space-y-1" />
    </div>
  </div>

  <div class="flex-shrink-0 w-14" aria-hidden="true">
    <!-- Dummy element to force sidebar to shrink to fit close icon -->
  </div>
</div>

<!-- Static sidebar for desktop -->
<div class="hidden md:flex md:flex-shrink-0 border-r border-gray-200">
  <div class="flex flex-col w-64">
    <!-- Sidebar component, swap this element with another sidebar if you like -->
    <div class="flex flex-col h-0 flex-1">
      <div class="flex items-center h-16 flex-shrink-0 px-7 pt-8 bg-white">
        <img class="h-8 w-auto" src="https://energify.pt/logo-small.png" alt="Workflow" />
        <span class="ml-2 text-2xl font-medium">Energify</span>
      </div>
      <div class="flex-1 flex flex-col overflow-y-auto">
        <nav class="flex-1 px-2 py-12 bg-white space-y-1">
          <span class="uppercase text-sm text-gray-400 font-medium px-4">Navigation</span>
          <SidebarItem name="Dashboard" icon={Home} link="#/dashboard/" />
          <SidebarItem name="Trading" icon={ChartBar} link="#/trading/" />
          <SidebarItem name="Wallet" icon={Cash} link="#/wallet/" />
        </nav>
      </div>
    </div>
  </div>
</div>
