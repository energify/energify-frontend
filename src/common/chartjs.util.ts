import { Chart, ChartOptions, ChartTypeRegistry } from "chart.js";

export function createChart(
  ctx: CanvasRenderingContext2D,
  type: keyof ChartTypeRegistry,
  labels: string[],
  datasets: any[],
  options?: ChartOptions
) {
  return new Chart(ctx, {
    type,
    data: { labels, datasets },
    options: {
      ...options,
      plugins: {
        legend: { display: false, labels: { font: { size: 18 } } },
        tooltip: { enabled: false },
      },
      scales: {
        x: {
          grid: { display: false, borderColor: "#F3F4F6" },
          ticks: { font: { size: 16, family: "Inter" }, color: "rgb(156, 163, 175)" },
        },
        y: {
          grid: { drawBorder: false, color: "#F3F4F6" },
          ticks: { font: { size: 16, family: "Inter" }, color: "rgb(156, 163, 175)" },
        },
      },
    },
  });
}
