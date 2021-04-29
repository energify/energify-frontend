<script lang="ts">
  import Sidebar from "../sidebar/Sidebar.svelte";
  import ShellUser from "./ShellUser.svelte";

  export let title: string;
</script>

<div class="h-screen flex overflow-hidden bg-gray-100">
  <Sidebar />
  <main class="flex-1 relative overflow-y-auto focus:outline-none">
    <div
      class="flex border-b border-gray-200 justify-between items-center bg-white mx-auto px-8 py-5"
    >
      <h1 class="text-3xl font-semibold text-gray-900">{title}</h1>
      <ShellUser />
    </div>
    <div class="mx-auto px-4 sm:px-6 md:px-8 py-6">
      <slot />
    </div>
  </main>
</div>
