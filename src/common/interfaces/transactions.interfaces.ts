export interface EnergyFlow {
  toCommunity: number;
  toPublicGrid: number;
  fromCommunity: number;
  fromPublicGrid: number;
}

export interface EnergyHistory {
  consumed: number;
  produced: number;
}

export interface MonthlyResume {
  usedEnergy: number;
  emmitedCo2: number;
  moneySpent: number;
}
