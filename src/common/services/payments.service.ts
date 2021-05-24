import { request } from "../api.util";

export class PaymentsService {
  constructor() {}

  async fetchPayments() {
    return {
      data: [
        {
          id: 1,
          amount: 1.15,
          hederaTransactionId: "1234",
          consumerId: 10,
          prosumerId: 101,
          createdAt: new Date(),
        },
        {
          id: 2,
          amount: 1.25,
          hederaTransactionId: "4312",
          consumerId: 10,
          prosumerId: 101,
          createdAt: new Date(),
        },
        {
          id: 3,
          amount: 1.17,
          hederaTransactionId: "4321",
          consumerId: 101,
          prosumerId: 10,
          createdAt: new Date(),
        },
        {
          id: 4,
          amount: 1.21,
          hederaTransactionId: "4213",
          consumerId: 102,
          prosumerId: 10,
          createdAt: new Date(),
        },
        {
          id: 5,
          amount: 1.28,
          hederaTransactionId: "4231",
          consumerId: 10,
          prosumerId: 103,
          createdAt: new Date(),
        },
      ],
    };
  }
}
