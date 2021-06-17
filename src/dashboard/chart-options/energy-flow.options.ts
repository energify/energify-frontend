import type { ChartOptions } from "chart.js";

export const energyFlowDataset = [
  {
    data: [0, 0, 0, 0],
    backgroundColor: ["#12B981", "#101827"],
  },
];

export const energyFlowOptions: ChartOptions = {
  responsive: true,
  indexAxis: "y",
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      grid: { display: true, drawBorder: false },
      ticks: { display: true, font: { size: 14, family: "Inter" }, color: "rgb(156, 163, 175)" },
    },
    y: {
      grid: { display: false, drawBorder: false, color: "#F3F4F6" },
      ticks: { display: true, font: { size: 14, family: "Inter" }, color: "rgb(156, 163, 175)" },
    },
  },
};
