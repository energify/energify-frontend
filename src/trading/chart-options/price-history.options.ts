export const priceHistoryOptions = {
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
      beginAtZero: true,
      grid: { drawBorder: false, color: "#F3F4F6" },
      ticks: {
        font: { size: 14, family: "Inter" },
        color: "rgb(156, 163, 175)",
      },
    },
  },
};
