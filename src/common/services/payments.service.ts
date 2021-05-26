import { request } from "../api.util";

export class PaymentsService {
  constructor() {}

  async fetchPayments(
    type: string = "all",
    minPrice: number = 0,
    maxPrice: number = 10000,
    date: Date = new Date()
  ) {
    return {
      data: [
        {
          id: 1,
          amount: 1.15,
          hederaTransactionId: "1234",
          consumerId: 10,
          prosumerId: 101,
          createdAt: new Date("12-23-2020 18:30"),
        },
        {
          id: 2,
          amount: 1.25,
          hederaTransactionId: "4312",
          consumerId: 10,
          prosumerId: 101,
          createdAt: new Date("12-22-2020 12:30"),
        },
        {
          id: 3,
          amount: 1.17,
          hederaTransactionId: "4321",
          consumerId: 101,
          prosumerId: 10,
          createdAt: new Date("12-22-2020 14:30"),
        },
        {
          id: 4,
          amount: 1.21,
          hederaTransactionId: "4213",
          consumerId: 102,
          prosumerId: 10,
          createdAt: new Date("12-22-2020 19:30"),
        },
        {
          id: 5,
          amount: 1.28,
          hederaTransactionId: "4231",
          consumerId: 10,
          prosumerId: 103,
          createdAt: new Date("12-22-2020 18:30"),
        },
      ].filter((i) => {
        return (
          ((type === "buy" && i.consumerId === 10) ||
            (type === "sell" && i.prosumerId === 10) ||
            type === "all") &&
          i.amount > minPrice &&
          i.amount < maxPrice
        );
      }),
    };
  }
}
