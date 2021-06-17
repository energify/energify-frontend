<script lang="ts">
  import { fade } from "svelte/transition";

  let isOpen: boolean = false;

  export function close() {
    isOpen = false;
  }

  export function open() {
    isOpen = true;
  }
</script>

{#if isOpen}
  <div
    transition:fade={{ duration: 300 }}
    class="absolute top-0 left-0 w-full h-screen bg-gray-900 bg-opacity-50 p-24 z-30"
  >
    <div class="flex justify-center items-center w-full">
      <div class="bg-white shadow-md rounded-lg">
        <slot />
      </div>
    </div>
  </div>
{/if}
