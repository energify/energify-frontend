export interface Payment {
  _id: string;
  amount: number;
  hederaTransactionHash: string;
  consumerId: string;
  prosumerId: string;
  issuedAt: string;
  paidAt: string;
}
