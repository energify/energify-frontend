<script lang="ts">
  import { onMount } from "svelte";
  import Icon, { X, Exclamation, InformationCircle, CheckCircle } from "svelte-hero-icons";
  import type { Notification } from "../../interfaces/notifications.interfaces";
  import { notificationService } from "../../services/notifications.service";

  export let id: number;
  export let notification: Notification;

  function handleClose() {
    isRendered = false;
    setTimeout(() => notificationService.clearByIndex(id), 100);
  }

  onMount(() => {
    isMounted = true;
    setTimeout(() => (isRendered = true), 100);
    setTimeout(() => handleClose(), 4000);
  });

  let isMounted = false;
  let isRendered = false;
</script>

{#if isMounted}
  <div
    aria-live="assertive"
    class="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start"
  >
    <div
      class="w-full flex flex-col items-center space-y-4 sm:items-end
  transform ease-out duration-300 transition {isRendered
        ? 'translate-y-0 opacity-100 sm:translate-x-0'
        : 'translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2'}"
    >
      <div
        class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 
        ring-black ring-opacity-5 overflow-hidden"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div
              class="flex-shrink-0"
              class:text-green-400={notification.type === "success"}
              class:text-red-400={notification.type === "error"}
              class:text-gray-900={notification.type === "info"}
            >
              <Icon
                src={notification.type === "success"
                  ? CheckCircle
                  : notification.type === "error"
                  ? Exclamation
                  : InformationCircle}
                class="h-6 w-6"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">{notification.title}</p>
              <p class="mt-1 text-sm text-gray-500">{notification.description}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                on:click={handleClose}
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Icon src={X} class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
