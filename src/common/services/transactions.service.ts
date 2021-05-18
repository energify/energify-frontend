import { request } from "../api.util";
import { format as formatDate } from "date-fns";
import type { TransactionsStats } from "./transactions.interfaces";

export class TransactionsService {
  fetchPriceLast24Hours() {
    return request<number>(`/transactions/price-24hours`, "GET");
  }

  fetchPriceHistory(interval: string, scale: number) {
    return request<number[]>(`/transactions/price-history/${interval}/${scale}`, "GET");
  }

  fetchEnergyHistory(interval: string, scale: number) {
    return request<number[]>(`/transactions/energy-history/${interval}/${scale}`, "GET");
  }

  fetchEnergyFlow(start: Date, end: Date) {
    const formatedStart = formatDate(start, "MM-dd-yyyy HH:mm:ss");
    const formatedEnd = formatDate(end, "MM-dd-yyyy HH:mm:ss");
    return request<TransactionsStats>(
      `/transactions/energy-flow/${formatedStart}/${formatedEnd}`,
      "GET"
    );
  }
}
