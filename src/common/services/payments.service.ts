import { request } from "../api.util";

export class PaymentsService {
  constructor() {}

  fetchPayments() {
    return {
      data: [
        { id: 1, amount: 9, hederaTransactionId: "1234", createdAt: new Date() },
        { id: 2, amount: 3, hederaTransactionId: "4312", createdAt: new Date() },
        { id: 3, amount: 5, hederaTransactionId: "4312", createdAt: new Date() },
        { id: 4, amount: 1, hederaTransactionId: "4312", createdAt: new Date() },
      ],
    };
  }
}
