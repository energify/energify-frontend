<script lang="ts">
  import { Chart, registerables } from "chart.js";
  import { onMount } from "svelte";
  import Router from "svelte-spa-router";
  import authRoutes from "./auth/auth.routes";
  import dashboardRoutes from "./dashboard/dashboard.routes";
  import tradingRoutes from "./trading/trading.routes";
  import walletRoutes from "./wallet/wallet.routes";

  onMount(() => {
    Chart.register(...registerables);
  });
</script>

<div>
  <Router routes={{ ...authRoutes, ...tradingRoutes, ...walletRoutes, ...dashboardRoutes }} />
</div>

<style global lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  .input {
    @apply appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md 
      shadow-sm placeholder-gray-400;
  }

  .input:focus {
    @apply outline-none ring-green-500 border-green-500;
  }

  .btn {
    @apply py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white 
    bg-green-600;
  }

  .btn-secundary {
    @apply py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-gray-800 
    bg-gray-200;
  }

  .btn:hover {
    @apply bg-green-700;
  }

  .btn:focus {
    @apply outline-none ring-2 ring-offset-2 ring-green-500;
  }
</style>
