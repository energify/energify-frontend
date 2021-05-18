import { Chart, ChartDataset, ChartOptions, ChartTypeRegistry } from "chart.js";

export function createChart(
  ctx: CanvasRenderingContext2D,
  type: keyof ChartTypeRegistry,
  datasets: ChartDataset[],
  labels?: string[],
  options?: ChartOptions
) {
  return new Chart(ctx, {
    type,
    data: { labels, datasets },
    options,
  });
}
