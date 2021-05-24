<script lang="ts">
  import Icon, { ChevronDown } from "svelte-hero-icons";

  export let name: string;
  export let buttonClass: string;
  export let width: number = 56;

  let isMenuOpen = false;
  let isMenuRendered = false;

  function handleMenuToggle() {
    if (isMenuRendered) {
      isMenuOpen = !isMenuOpen;
      setTimeout(() => (isMenuRendered = false), 500);
    } else {
      isMenuRendered = true;
      setTimeout(() => (isMenuOpen = true), 100);
    }
  }
</script>

<div class="relative inline-block text-left">
  <div>
    <button on:click={handleMenuToggle} class="inline-flex justify-center w-full {buttonClass}">
      {#if name}
        {name}
      {/if}
      <Icon src={ChevronDown} class="{name ? '-mr-1 ml-2' : ''} h-5 w-5" />
    </button>
  </div>

  <div
    class:opacity-0={!isMenuOpen}
    class:opacity-100={isMenuOpen}
    class:hidden={!isMenuRendered}
    class="transition ease-out duration-100 origin-top-right absolute right-0 mt-2 w-{width}
     rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30"
    role="menu"
    aria-orientation="vertical"
    aria-labelledby="menu-button"
    tabindex="-1"
  >
    <div class="py-1" role="none">
      <slot />
    </div>
  </div>
</div>
