import type { ChartOptions } from "chart.js";

export const priceHistoryDataset = [
  {
    fill: true,
    backgroundColor: "#00966922",
    borderColor: "#009669",
    data: [],
  },
];

export const priceHistoryOptions: ChartOptions = {
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
      grid: { drawBorder: false, color: "#F3F4F6" },
      ticks: {
        stepSize: 0.001,
        font: { size: 14, family: "Inter" },
        color: "rgb(156, 163, 175)",
      },
    },
  },
};
