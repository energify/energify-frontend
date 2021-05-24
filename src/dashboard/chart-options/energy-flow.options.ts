export const energyFlowOptions = {
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
