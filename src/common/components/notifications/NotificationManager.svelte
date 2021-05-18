<script lang="ts">
  import { onMount } from "svelte";
  import { notificationsService } from "../../services/services.injector";
  import Notification from "./Notification.svelte";

  const { notifications } = notificationsService;
</script>

<div class="absolute top-0 right-0 mr-8">
  {#each $notifications as notification, id}
    <Notification {notification} {id} />
  {/each}
</div>
