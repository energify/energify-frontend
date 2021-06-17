<script lang="ts">
  import { notificationService } from "../../services/notifications.service";
  import Notification from "./Notification.svelte";

  const notifications = notificationService.getNotifications();
</script>

<div class="absolute top-0 right-0 mr-8">
  {#each $notifications as notification, id}
    <Notification {notification} {id} />
  {/each}
</div>
