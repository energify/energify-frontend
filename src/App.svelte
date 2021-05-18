<script lang="ts">
  import { Chart, registerables } from "chart.js";
  import { onMount } from "svelte";
  import Router from "svelte-spa-router";
  import authRoutes from "./auth/auth.routes";
  import NotificationManager from "./common/components/notifications/NotificationManager.svelte";
  import dashboardRoutes from "./dashboard/dashboard.routes";
  import tradingRoutes from "./trading/trading.routes";
  import walletRoutes from "./wallet/wallet.routes";

  onMount(() => {
    Chart.register(...registerables);
  });
</script>

<div>
  <Router routes={{ ...authRoutes, ...tradingRoutes, ...walletRoutes, ...dashboardRoutes }} />
  <NotificationManager />
</div>
