<script lang="ts">
  import Card from "../../common/components/card/Card.svelte";
  import { onMount } from "svelte";
  import { createChart } from "../../common/chartjs.util";
  import type { Chart } from "chart.js";
  import { subHours } from "date-fns";
  import { arrayFromRange, intervalToChartLabel } from "../../common/misc.util";
  import { transactionsService } from "../../common/services/services.injector";
  import IntervalSelector from "../../common/components/interval-selector/IntervalSelector.svelte";

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

  let options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false, borderColor: "#F3F4F6" },
        ticks: {
          font: { size: 14, family: "Inter" },
          color: "rgb(156, 163, 175)",
        },
      },
      y: {
        beginAtZero: true,
        grid: { drawBorder: false, color: "#F3F4F6" },
        ticks: {
          font: { size: 14, family: "Inter" },
          color: "rgb(156, 163, 175)",
        },
      },
    },
  };

  onMount(async () => {
    const canvas = document.getElementById("priceHistoryChart") as HTMLCanvasElement;
    chart = createChart(canvas.getContext("2d"), "line", dataset, labels, options);
    updateChart();
  });

  async function updateChart(interval: string = "1h") {
    const { data } = await transactionsService.fetchPriceHistory(interval, 12);
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
