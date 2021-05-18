<script lang="ts">
  import type { Chart } from "chart.js";
  import { onMount } from "svelte";
  import { createChart } from "../../common/chartjs.util";
  import Card from "../../common/components/card/Card.svelte";
  import IntervalSelector from "../../common/components/interval-selector/IntervalSelector.svelte";
  import { intervalToChartLabel } from "../../common/misc.util";
  import { transactionsService } from "../../common/services/services.injector";

  let chart: Chart;

  let dataset = [
    {
      fill: true,
      backgroundColor: "#00966922",
      borderColor: "#009669",
      data: [1, 2, 3, 4, 5, 6],
    },
  ];

  let options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false, borderColor: "#F3F4F6" },
        ticks: { font: { size: 14, family: "Inter" }, color: "rgb(156, 163, 175)" },
      },
      y: {
        beginAtZero: true,
        grid: { drawBorder: false, color: "#F3F4F6" },
        ticks: { font: { size: 14, family: "Inter" }, color: "rgb(156, 163, 175)" },
      },
    },
  };

  const nowDateRounded = new Date();
  nowDateRounded.setMinutes(0);

  onMount(async () => {
    const canvas = document.getElementById("energyChart") as HTMLCanvasElement;
    chart = createChart(canvas.getContext("2d"), "line", dataset, [], options);
    updateChart();
  });

  async function updateChart(interval: string = "1h") {
    const { data } = await transactionsService.fetchEnergyHistory(interval, 12);
    chart.data.datasets[0].data = data;
    chart.data.labels = intervalToChartLabel(interval, 12);
    chart.update();
  }
</script>

<Card title="Energy History">
  <span slot="action">
    <IntervalSelector onChange={(interval) => updateChart(interval)} />
  </span>
  <canvas id="energyChart" class="w-full" />
</Card>
