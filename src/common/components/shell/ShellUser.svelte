<script lang="ts">
  import Icon, { ChevronDown } from "svelte-hero-icons";
  import { authService } from "../../../main";

  const { user } = authService;
</script>

<div class="flex items-center">
  <img
    alt="Profile"
    src="https://uifaces.co/our-content/donated/gPZwCbdS.jpg"
    class="w-12 h-12 rounded-full"
  />
  <div class="flex flex-col ml-2">
    <span class="text-md text-gray-900">{$user.name}</span>
    <span class="text-base text-gray-400">$40.12</span>
  </div>
  <Icon src={ChevronDown} class="w-6 h-6 ml-2 text-gray-900" solid />
</div>
