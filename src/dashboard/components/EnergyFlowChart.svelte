<script lang="ts">
  import type { Chart } from "chart.js";
  import { format, subDays } from "date-fns";
  import { onMount } from "svelte";
  import { createBarChart } from "../../common/chartjs.util";
  import Card from "../../common/components/card/Card.svelte";
  import { NOW_DATE } from "../../common/misc.util";
  import { transactionsService } from "../../common/services/transactions.service";
  import { energyFlowDataset, energyFlowOptions } from "../chart-options/energy-flow.options";

  const energyFlow = transactionsService.getEnergyFlow();
  let startDate: string = format(subDays(NOW_DATE, 7), "yyyy-MM-dd");
  let endDate: string = format(NOW_DATE, "yyyy-MM-dd");

  let chart: Chart;
  let labels = ["To Community", "To Public Grid ", "From Community", "From Public Grid"];

  onMount(() => {
    const canvas = document.getElementById("chart") as HTMLCanvasElement;
    chart = createBarChart(canvas.getContext("2d"), energyFlowDataset, labels, energyFlowOptions);
    updateChart();
  });

  async function updateChart() {
    await transactionsService.fetchEnergyFlow(new Date(startDate), new Date(endDate));
    chart.data.datasets[0].data = [
      $energyFlow.toCommunity ?? 0,
      $energyFlow.toPublicGrid ?? 0,
      $energyFlow.fromCommunity ?? 0,
      $energyFlow.fromPublicGrid ?? 0,
    ];
    chart.update();
  }
</script>

<Card title="Energy Flow">
  <span slot="action">
    <div class="flex">
      <div class="flex flex-col mr-4">
        <span class="text-gray-500 text-xs font-medium">From</span>
        <input
          type="date"
          max={endDate}
          class="input-sm mr-2 px-1 py-1"
          bind:value={startDate}
          on:change={updateChart}
        />
      </div>
      <div class="flex flex-col">
        <span class="text-gray-500 text-xs font-medium">To</span>
        <input
          type="date"
          min={startDate}
          class="input-sm px-1 py-1"
          bind:value={endDate}
          on:change={updateChart}
        />
      </div>
    </div>
  </span>

  <div class="flex items-center justify-center mb-6">
    <canvas id="chart" width="100%" class="w-full" />
  </div>
</Card>
