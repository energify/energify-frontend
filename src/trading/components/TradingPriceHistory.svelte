<script lang="ts">
  import Card from "../../common/components/card/Card.svelte";
  import { onMount } from "svelte";
  import { createChart } from "../../common/chartjs.util";
  import type { Chart } from "chart.js";
  import { subHours } from "date-fns";
  import { arrayFromRange } from "../../common/misc.util";

  let chart: Chart;
  let interval: number = 1;

  let labels = arrayFromRange(1, 10)
    .map((_, i: number) => {
      const date = subHours(new Date(), i * interval);
      return `${date.getHours()} h`;
    })
    .reverse();

  console.log(labels);
  let dataset = [
    {
      fill: true,
      backgroundColor: "#00966922",
      borderColor: "#009669",
      data: [0, 10, 5, 2, 20, 30, 45, 30, 30, 50],
    },
  ];

  onMount(() => {
    const canvas = document.getElementById("priceHistoryChart") as HTMLCanvasElement;
    chart = createChart(canvas.getContext("2d"), "line", labels, dataset);
  });
</script>

<Card title="Price History" headerBg="bg-white" headerBorder="border-0">
  <canvas id="priceHistoryChart" class="w-full" />
</Card>
