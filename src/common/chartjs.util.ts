import { Chart, ChartDataset, ChartOptions, ChartTypeRegistry } from "chart.js";

export function createLineChart(
  ctx: CanvasRenderingContext2D,
  datasets: ChartDataset[],
  labels?: string[],
  options?: ChartOptions
) {
  return new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options,
  });
}

export function createPieChart(
  ctx: CanvasRenderingContext2D,
  datasets: ChartDataset[],
  labels?: string[],
  options?: ChartOptions
) {
  return new Chart(ctx, {
    type: "pie",
    data: { labels, datasets },
    options,
  });
}

export function createBarChart(
  ctx: CanvasRenderingContext2D,
  datasets: ChartDataset[],
  labels?: string[],
  options?: ChartOptions
) {
  return new Chart(ctx, {
    type: "bar",
    data: { labels, datasets },
    options,
  });
}
