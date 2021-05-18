<script lang="ts">
  import type { Chart } from "chart.js";
  import { parse, subDays } from "date-fns";
  import { onMount } from "svelte";
  import { createChart } from "../../common/chartjs.util";
  import Card from "../../common/components/card/Card.svelte";
  import { transactionsService } from "../../common/services/services.injector";

  let startDate: string;
  let endDate: string;

  let energyFlowInChart: Chart;
  let energyFlowOutChart: Chart;

  let energyFlowInDataset = [{ data: [3, 1], backgroundColor: ["#12B981", "#f87171"] }];
  let energyFlowOutDataset = [{ data: [3, 1], backgroundColor: ["#12B981", "#f87171"] }];

  let options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { display: false, font: { size: 14, family: "Inter" }, color: "rgb(156, 163, 175)" },
      },
      y: {
        grid: { display: false, drawBorder: false, color: "#F3F4F6" },
        ticks: { display: false, font: { size: 14, family: "Inter" }, color: "rgb(156, 163, 175)" },
      },
    },
  };

  let labels = ["Community", "Public Grid"];

  onMount(async () => {
    const energyFlowInCanvas = document.getElementById("energyFlowIn") as HTMLCanvasElement;
    energyFlowInChart = createChart(
      energyFlowInCanvas.getContext("2d"),
      "pie",
      energyFlowInDataset,
      labels,
      options
    );
    const energyFlowOutCanvas = document.getElementById("energyFlowOut") as HTMLCanvasElement;
    energyFlowOutChart = createChart(
      energyFlowOutCanvas.getContext("2d"),
      "pie",
      energyFlowOutDataset,
      labels,
      options
    );

    updateChart();
  });

  async function updateChart() {
    const start = new Date(startDate ?? new Date());
    const end = new Date(endDate ?? subDays(start, 1));
    console.log(start, end);
    const { data } = await transactionsService.fetchEnergyFlow(start, end);

    const { energyFromCommunity, energyFromPublicGrid, energyToCommunity, energyToPublicGrid } =
      data;

    energyFlowOutChart.data.datasets[0].data = [energyToCommunity, energyToPublicGrid];
    energyFlowInChart.data.datasets[0].data = [energyFromCommunity, energyFromPublicGrid];

    energyFlowOutChart.update();
    energyFlowInChart.update();
    energyFlowOutChart.resize();
    energyFlowInChart.resize();
  }
</script>

<Card title="Energy Flow">
  <span slot="action">
    <div class="flex">
      <input type="date" class="input-sm mr-2" bind:value={startDate} on:change={updateChart} />
      <input type="date" class="input-sm" bind:value={endDate} on:change={updateChart} />
    </div>
  </span>
  <div class="flex flex-col items-center justify-center">
    <div class="flex justify-between items-center mb-12">
      <div class="flex flex-col justify-around items-center mx-8">
        <div>
          <canvas id="energyFlowIn" class="w-64" />
        </div>
        <span class="text-gray-900 font-medium">Consumption</span>
      </div>
      <div class="flex flex-col items-center mx-8">
        <div>
          <canvas id="energyFlowOut" class="w-64" />
        </div>
        <span class="text-gray-900 font-medium">Production</span>
      </div>
    </div>
    <div class="flex items-center justify-center">
      <div class="flex items-center mx-4">
        <div class="w-4 h-4 rounded-sm bg-green-500" />
        <span class="text-gray-500 font-medium ml-1">Community</span>
      </div>
      <div class="flex items-center mx-4">
        <div class="w-4 h-4 rounded-sm bg-red-400" />
        <span class="text-gray-500 font-medium ml-1">Public Grid</span>
      </div>
    </div>
  </div>
</Card>
