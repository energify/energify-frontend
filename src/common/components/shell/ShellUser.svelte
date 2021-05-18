<script lang="ts">
  import { authService, hederaService } from "../../services/services.injector";
  import Dropdown from "../dropdown/Dropdown.svelte";

  const { user } = authService;
</script>

<div class="flex items-center">
  <img
    alt="Profile"
    src="https://uifaces.co/our-content/donated/gPZwCbdS.jpg"
    class="w-10 h-10 rounded-full  hidden md:flex"
  />
  <div class="flex flex-col mx-2">
    <span class="text-base text-gray-900">{$user.name}</span>
    <span class="text-sm text-gray-500">
      {#await hederaService.fetchBalance()}
        ...
      {:then { hbars }}
        {hbars.toString()}
      {/await}
    </span>
  </div>
  <Dropdown>
    <div
      class="hover:bg-gray-100 hover:text-gray-900 text-gray-800 block px-4 py-2 text-sm
      cursor-pointer"
    >
      Settings
    </div>
    <div
      on:click={() => authService.logout()}
      class="hover:bg-gray-100 hover:text-gray-900 text-gray-800 block px-4 
    py-2 text-sm cursor-pointer"
    >
      Logout
    </div>
  </Dropdown>
</div>
