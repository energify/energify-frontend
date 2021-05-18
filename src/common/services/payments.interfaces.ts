export interface Payment {
  id: number;
  amount: number;
  hederaTransactionId: string;
  consumerId: number;
  prosumerId: number;
  createdAt: string;
}
