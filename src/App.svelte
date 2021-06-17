<script lang="ts">
  import { Chart, registerables } from "chart.js";
  import { onMount } from "svelte";
  import Router, { push } from "svelte-spa-router";
  import NotificationManager from "./common/components/notifications/NotificationManager.svelte";
  import { hederaService } from "./common/services/hedera.service";
  import routes, { conditionsFailed } from "./routes";

  onMount(() => {
    Chart.register(...registerables);
    hederaService.initClient();
  });
</script>

<Router on:conditionsFailed={conditionsFailed} routes={{ ...routes }} />
<NotificationManager />
