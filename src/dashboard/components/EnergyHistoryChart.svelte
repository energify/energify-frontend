<script lang="ts">
  import type { Chart } from "chart.js";
  import { onMount } from "svelte";
  import { createChart } from "../../common/chartjs.util";
  import Card from "../../common/components/card/Card.svelte";
  import IntervalSelector from "../../common/components/interval-selector/IntervalSelector.svelte";
  import { intervalToChartLabel } from "../../common/misc.util";
  import { transactionsService } from "../../common/services/services.injector";
  import { energyHistoryOptions } from "../chart-options/energy-history.options";

  let chart: Chart;

  let dataset = [
    {
      fill: true,
      backgroundColor: "#00966922",
      borderColor: "#009669",
      data: [1, 2, 3, 4, 5, 6],
    },
  ];

  const nowDateRounded = new Date();
  nowDateRounded.setMinutes(0);

  onMount(() => {
    const canvas = document.getElementById("energyChart") as HTMLCanvasElement;
    chart = createChart(canvas.getContext("2d"), "line", dataset, [], energyHistoryOptions);
    updateChart();
  });

  async function updateChart(interval: string = "1h") {
    //const { data } = await transactionsService.fetchEnergyHistory(interval, 12);

    //Static values for IHC
    let data;
    if (interval === "1h") {
      data = [0.37, 0.43, 0.745, 0.859, 1.02, 1.07, 0.893, 0.623, 0.456, 0.56, 0.89, 0.943];
    } else if (interval === "1d") {
      data = [0.589, 0.632, 0.74, 0.889, 0.912, 1.12, 0.442, 0.673, 0.993, 0.568, 0.883, 0.738];
    } else if (interval === "1w") {
      data = [0.755, 0.638, 0.888, 0.612, 0.913, 1.01, 0.935, 0.396, 0.678, 0.518, 0.991, 1.08];
    } else if (interval === "1m") {
      data = [0.898, 0.612, 0.893, 0.854, 0.915, 1.05, 0.912, 0.854, 0.667, 0.831, 0.893, 0.798];
    } else if (interval === "1y") {
      data = [0.901, 0.788, 0.744, 0.819, 0.912, 0.991, 0.835, 0.791, 0.831, 0.918, 0.765, 0.788];
    }
    console.log(data);
    chart.data.datasets[0].data = data;
    chart.data.labels = intervalToChartLabel(interval, 12);
    chart.update();
  }
</script>

<Card title="Energy History">
  <span slot="action">
    <IntervalSelector onChange={(interval) => updateChart(interval)} />
  </span>
  <span class="text-gray-400 mx-0.5 px-0.5 text-xs font-medium">kW</span>
  <canvas id="energyChart" class="w-full" />
</Card>
