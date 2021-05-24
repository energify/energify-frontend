import { request } from "../api.util";
import { format as formatDate } from "date-fns";

export class TransactionsService {
  fetchPriceLast24Hours() {
    return { data: 1.2 };
  }

  fetchPriceHistory(interval: string, scale: number) {
    const data = new Array();
    for (let i = 0; i < scale; i++) data.push(Math.random() * 1.2);
    return { data };
  }

  fetchEnergyHistory(interval: string, scale: number) {
    const data = new Array();
    for (let i = 0; i < scale; i++) data.push(Math.random() * 1.2);
    return { data };
  }

  fetchEnergyFlow(start: Date, end: Date) {
    const formatedStart = formatDate(start, "MM-dd-yyyy HH:mm:ss");
    const formatedEnd = formatDate(end, "MM-dd-yyyy HH:mm:ss");

    return {
      data: {
        energyFromCommunity: 100,
        energyFromPublicGrid: 20,
        energyToCommunity: 120,
        energyToPublicGrid: 80,
      },
    };
  }
}
