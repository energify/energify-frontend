import { format, subDays, subHours, subMonths, subWeeks, subYears } from "date-fns";

export function arrayFromRange(j, k): Array<number> {
  return Array.apply(null, Array(k - j + 1)).map(function (_, n) {
    return n + j;
  });
}

export function weekDayName(code: number) {
  if (code == 0) return "Sunday";
  else if (code == 1) return "Monday";
  else if (code == 2) return "Tuesday";
  else if (code == 3) return "Wednesday";
  else if (code == 4) return "Thursday";
  else if (code == 5) return "Friday";
  return "Saturday";
}

export function intervalToChartLabel(interval: string, scale: number) {
  if (interval === "1h") {
    const now = new Date();
    now.setMinutes(0);
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subHours(now, i), "HH:mm"))
      .reverse();
  } else if (interval === "1d") {
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subDays(new Date(), i), "dd/MM"))
      .reverse();
  } else if (interval === "1w") {
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subWeeks(new Date(), i), "dd/MM"))
      .reverse();
  } else if (interval === "1m") {
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subMonths(new Date(), i), "MM/yy"))
      .reverse();
  } else {
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subYears(new Date(), i), "yyyy"))
      .reverse();
  }
}
