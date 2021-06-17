import { format, subDays, subHours, subMonths, subWeeks, subYears } from "date-fns";

export const NOW_DATE = new Date("01-01-2020 00:00:00");

export function arrayFromRange(j, k): Array<number> {
  return Array.apply(null, Array(k - j + 1)).map(function (_, n) {
    return n + j;
  });
}

export function dateToQuery(date: Date) {
  return format(date, "MM-dd-yyyy HH:mm:ss");
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
    NOW_DATE.setMinutes(0);
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subHours(NOW_DATE, i), "HH:mm"))
      .reverse();
  } else if (interval === "1d") {
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subDays(NOW_DATE, i), "dd/MM"))
      .reverse();
  } else if (interval === "1w") {
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subWeeks(NOW_DATE, i), "dd/MM"))
      .reverse();
  } else if (interval === "1m") {
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subMonths(NOW_DATE, i), "MM/yy"))
      .reverse();
  } else {
    return arrayFromRange(0, scale - 1)
      .map((_, i) => format(subYears(NOW_DATE, i), "yyyy"))
      .reverse();
  }
}

export function i2hex(i: number) {
  return ("0" + i.toString(16)).slice(-2);
}
