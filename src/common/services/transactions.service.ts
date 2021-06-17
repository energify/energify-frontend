import { writable } from "svelte/store";
import { dateToQuery, NOW_DATE } from "../misc.util";
import { apiService } from "./api.service";
import type {
  EnergyFlow,
  EnergyHistory,
  MonthlyResume,
} from "../interfaces/transactions.interfaces";

export class TransactionsService {
  private amountsHistory = writable<EnergyHistory[]>([]);
  private pricesHistory = writable<number[]>([]);
  private energyFlow = writable<EnergyFlow>({} as EnergyFlow);
  private monthlyResume = writable<MonthlyResume>({} as MonthlyResume);

  fetchPriceLast24Hours() {
    return { pricePerKw: 1.2 };
  }

  async fetchPriceHistory(end: Date, interval: string) {
    const amounts = await apiService.get<number[]>(
      `/transactions/price/history?end=${dateToQuery(end)}&interval=${interval}`
    );
    this.pricesHistory.set(amounts);
  }

  async fetchAmountsHistory(end: Date, interval: string) {
    const amounts = await apiService.get<EnergyHistory[]>(
      `/transactions/amounts/history?end=${dateToQuery(end)}&interval=${interval}`
    );
    this.amountsHistory.set(amounts);
  }

  async fetchEnergyFlow(start: Date, end: Date) {
    const flow = await apiService.get<EnergyFlow>(
      `/transactions/amounts/flow?start=${dateToQuery(start)}&end=${dateToQuery(end)}`
    );
    this.energyFlow.set(flow);
  }

  async fetchMontlyResume() {
    const resume = await apiService.get<MonthlyResume>(
      `/transactions/resume/monthly?month=${NOW_DATE.getMonth() + 1}&year=${NOW_DATE.getFullYear()}`
    );
    this.monthlyResume.set(resume);
  }

  getAmountsHistory() {
    return this.amountsHistory;
  }

  getPricesHistory() {
    return this.pricesHistory;
  }

  getEnergyFlow() {
    return this.energyFlow;
  }

  getMonthlyResume() {
    return this.monthlyResume;
  }
}

export const transactionsService = new TransactionsService();
