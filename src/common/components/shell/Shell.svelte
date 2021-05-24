<script lang="ts">
  import Sidebar from "../sidebar/Sidebar.svelte";
  import Topbar from "../topbar/Topbar.svelte";

  export let title: string;

  let sidebar: any;
</script>

<div class="flex h-screen overflow-hidden">
  <Sidebar bind:this={sidebar} />
  <main class="flex-1 focus:outline-none">
    <Topbar {sidebar} {title} />
    <div class="h-full mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-y-auto">
      <slot />
    </div>
  </main>
</div>
