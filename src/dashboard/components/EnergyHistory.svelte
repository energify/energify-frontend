<script lang="ts">
  import type { Chart } from "chart.js";
  import { onMount } from "svelte";
  import { createLineChart } from "../../common/chartjs.util";
  import Card from "../../common/components/card/Card.svelte";
  import IntervalSelector from "../../common/components/interval-selector/IntervalSelector.svelte";
  import { intervalToChartLabel, NOW_DATE } from "../../common/misc.util";
  import { transactionsService } from "../../common/services/transactions.service";
  import {
    energyBalanceDataset,
    energyBalanceOptions,
  } from "../chart-options/energy-history-chart.options";

  const amountsHistory = transactionsService.getAmountsHistory();
  let chart: Chart;

  onMount(() => {
    const canvas = document.getElementById("energyChart") as HTMLCanvasElement;
    chart = createLineChart(
      canvas.getContext("2d"),
      energyBalanceDataset,
      [],
      energyBalanceOptions
    );
    updateChart("1h");
  });

  async function updateChart(interval: string) {
    if (chart) {
      await transactionsService.fetchAmountsHistory(NOW_DATE, interval);
      chart.data.datasets[0].data = $amountsHistory.map((el) => el.produced);
      chart.data.datasets[1].data = $amountsHistory.map((el) => el.consumed);
      chart.data.labels = intervalToChartLabel(interval, 12);
      chart.update();
    }
  }
</script>

<Card title="Energy History">
  <span slot="action">
    <IntervalSelector onChange={updateChart} />
  </span>
  <canvas id="energyChart" class="w-full" />
  <div class="flex mt-4 ml-2">
    <div class="flex items-center mr-6">
      <div class="w-4 h-4 rounded-sm bg-green-500" />
      <span class="text-gray-500 font-medium ml-1">Produced</span>
    </div>
    <div class="flex items-center">
      <div class="w-4 h-4 rounded-sm bg-black" />
      <span class="text-gray-500 font-medium ml-1">Consumed</span>
    </div>
  </div>
</Card>
