<script lang="ts">
  import Card from "../../common/components/card/Card.svelte";
  import { onMount } from "svelte";
  import { createLineChart } from "../../common/chartjs.util";
  import type { Chart } from "chart.js";
  import { intervalToChartLabel, NOW_DATE } from "../../common/misc.util";
  import IntervalSelector from "../../common/components/interval-selector/IntervalSelector.svelte";
  import {
    priceHistoryOptions,
    priceHistoryDataset,
  } from "../chart-options/price-history-chart.options";
  import { transactionsService } from "../../common/services/transactions.service";

  const priceHistory = transactionsService.getPricesHistory();
  let chart: Chart;

  onMount(() => {
    const canvas = document.getElementById("priceHistoryChart") as HTMLCanvasElement;
    chart = createLineChart(canvas.getContext("2d"), priceHistoryDataset, [], priceHistoryOptions);
    updateChart();
  });

  async function updateChart(interval: string = "1h") {
    if (chart) {
      await transactionsService.fetchPriceHistory(NOW_DATE, interval);
      chart.data.datasets[0].data = $priceHistory;
      chart.data.labels = intervalToChartLabel(interval, 12);
      chart.update();
    }
  }
</script>

<Card title="Price History">
  <span slot="action">
    <IntervalSelector onChange={updateChart} />
  </span>
  <canvas id="priceHistoryChart" class="w-full" />
</Card>
