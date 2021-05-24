<script lang="ts">
  import type { Chart } from "chart.js";
  import { subDays } from "date-fns";
  import { onMount } from "svelte";
  import { createChart } from "../../common/chartjs.util";
  import Card from "../../common/components/card/Card.svelte";
  import { transactionsService } from "../../common/services/services.injector";
  import { energyFlowOptions } from "../chart-options/energy-flow.options";

  let startDate: string;
  let endDate: string;

  let chartIn: Chart;
  let chartOut: Chart;
  let dataset = [{ data: [3, 1], backgroundColor: ["#12B981", "#101827"] }];
  let labels = ["Community", "Public Grid"];

  onMount(() => {
    const canvasIn = document.getElementById("chartIn") as HTMLCanvasElement;
    const canvasOut = document.getElementById("chartOut") as HTMLCanvasElement;
    chartIn = createChart(canvasIn.getContext("2d"), "pie", dataset, labels, energyFlowOptions);
    chartOut = createChart(canvasOut.getContext("2d"), "pie", dataset, labels, energyFlowOptions);
    updateChart();
  });

  async function updateChart() {
    const start = new Date(startDate ?? new Date());
    const end = new Date(endDate ?? subDays(start, 1));
    const { data: chartInData } = await transactionsService.fetchEnergyFlow(start, end);
    const { energyFromCommunity, energyFromPublicGrid, energyToCommunity, energyToPublicGrid } =
      chartInData;
    chartIn.data.datasets[0].data = [
      Math.round((energyToCommunity / (energyToCommunity + energyToPublicGrid)) * 100),
      Math.round((energyToPublicGrid / (energyToCommunity + energyToPublicGrid)) * 100),
    ];
    chartIn.update();
    chartOut.data.datasets[0].data = [
      Math.round((energyFromCommunity / (energyFromCommunity + energyFromPublicGrid)) * 100),
      Math.round((energyFromPublicGrid / (energyFromCommunity + energyFromPublicGrid)) * 100),
    ];
    chartOut.update();
  }
</script>

<Card title="Energy Flow">
  <span slot="action">
    <div class="flex">
      <div class="flex-col m-2">
        <span class="text-gray-500 text-xs font-medium">From</span>
        <input
          type="date"
          class="input-sm mr-2 px-1 py-1"
          bind:value={startDate}
          on:change={updateChart}
        />
      </div>
      <div class="flex-col m-2">
        <span class="text-gray-500 text-xs font-medium">To</span>
        <input
          type="date"
          class="input-sm px-1 py-1"
          bind:value={endDate}
          on:change={updateChart}
        />
      </div>
    </div>
  </span>

  <div class="flex items-center mb-8">
    <div class="flex flex-col items-center mx-8">
      <div>
        <canvas id="chartIn" class="w-52" />
      </div>
      <span class="text-gray-900 font-medium">Consumption</span>
    </div>
    <div class="flex flex-col items-center mx-8">
      <div>
        <canvas id="chartOut" class="w-52" />
      </div>
      <span class="text-gray-900 font-medium">Production</span>
    </div>
  </div>
  <div class="flex items-center justify-center">
    <div class="flex items-center ml-5">
      <div class="w-4 h-4 rounded-sm bg-green-500" />
      <span class="text-gray-500 font-medium ml-1">Community</span>
    </div>
    <div class="flex items-center ml-4">
      <div class="w-4 h-4 rounded-sm bg-black" />
      <span class="text-gray-500 font-medium ml-1">Public Grid</span>
    </div>
  </div>
</Card>
