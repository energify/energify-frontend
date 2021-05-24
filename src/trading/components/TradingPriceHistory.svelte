<script lang="ts">
  import Card from "../../common/components/card/Card.svelte";
  import { onMount } from "svelte";
  import { createChart } from "../../common/chartjs.util";
  import type { Chart } from "chart.js";
  import { subHours } from "date-fns";
  import { arrayFromRange, intervalToChartLabel } from "../../common/misc.util";
  import { transactionsService } from "../../common/services/services.injector";
  import IntervalSelector from "../../common/components/interval-selector/IntervalSelector.svelte";
  import { priceHistoryOptions } from "../chart-options/price-history.options";

  let chart: Chart;
  let interval: number = 1;

  let labels = arrayFromRange(1, 10)
    .map((_, i: number) => {
      const date = subHours(new Date(), i * interval);
      return `${date.getHours()} h`;
    })
    .reverse();

  let dataset = [
    {
      fill: true,
      backgroundColor: "#00966922",
      borderColor: "#009669",
      data: [],
    },
  ];

  onMount(() => {
    const canvas = document.getElementById("priceHistoryChart") as HTMLCanvasElement;
    chart = createChart(canvas.getContext("2d"), "line", dataset, labels, priceHistoryOptions);
    updateChart();
  });

  async function updateChart(interval: string = "1h") {
    //const { data } = await transactionsService.fetchPriceHistory(interval, 12);
    let data;
    //Static Values for IHC
    if (interval === "1h") {
      data = [1.12, 1.13, 1.25, 1.2, 1.12, 1.07, 1.05, 0.98, 1.05, 1.09, 1.13, 1.17];
    } else if (interval === "1d") {
      data = [1.01, 1.13, 1.28, 1.22, 1.22, 1.12, 1.05, 0.98, 1.15, 1.39, 1.13, 1.2];
    } else if (interval === "1w") {
      data = [1.02, 1.03, 1.05, 1.12, 1.14, 1.19, 1.05, 1, 1.09, 1.18, 1.23, 1.27];
    } else if (interval === "1m") {
      data = [0.95, 0.81, 0.99, 1.01, 1.05, 1.07, 1.05, 0.91, 1.15, 1.29, 1.13, 1.27];
    } else if (interval === "1y") {
      data = [0.58, 0.6, 0.69, 0.74, 0.99, 0.75, 0.85, 0.95, 1.05, 1.09, 1.18, 1.23];
    }
    chart.data.datasets[0].data = data;
    chart.data.labels = intervalToChartLabel(interval, 12);
    chart.update();
  }
</script>

<Card title="Price History">
  <span slot="action">
    <IntervalSelector onChange={(interval) => updateChart(interval)} />
  </span>
  <canvas id="priceHistoryChart" class="w-full" />
</Card>
