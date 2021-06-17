export const energyBalanceDataset = [
  {
    fill: true,
    borderColor: "#009669",
    backgroundColor: "#00966922",
    data: [1, 2, 3, 4, 5, 6],
  },
  {
    fill: true,
    borderColor: "#101827",
    backgroundColor: "#10182722",
    data: [1, 2, 3, 4, 5, 6],
  },
];

export const energyBalanceOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      grid: { display: false, borderColor: "#F3F4F6" },
      ticks: { font: { size: 14, family: "Inter" }, color: "rgb(156, 163, 175)" },
    },
    y: {
      beginAtZero: true,
      grid: { drawBorder: false, color: "#F3F4F6" },
      ticks: { font: { size: 14, family: "Inter" }, color: "rgb(156, 163, 175)" },
    },
  },
};
