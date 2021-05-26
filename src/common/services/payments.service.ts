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
          createdAt: new Date("12-22-2020 12:30"),
        },
        {
          id: 6,
          amount: 1.35,
          hederaTransactionId: "4831",
          consumerId: 101,
          prosumerId: 10,
          createdAt: new Date("12-22-2020 20:30"),
        },
        {
          id: 7,
          amount: 1.12,
          hederaTransactionId: "3231",
          consumerId: 104,
          prosumerId: 10,
          createdAt: new Date("12-22-2020 19:30"),
        },
        {
          id: 8,
          amount: 1.28,
          hederaTransactionId: "4131",
          consumerId: 10,
          prosumerId: 103,
          createdAt: new Date("05-25-2021 14:30"),
        },
        {
          id: 9,
          amount: 1.21,
          hederaTransactionId: "1131",
          consumerId: 108,
          prosumerId: 10,
          createdAt: new Date("05-21-2021 11:00"),
        },
        {
          id: 10,
          amount: 1.09,
          hederaTransactionId: "1111",
          consumerId: 108,
          prosumerId: 10,
          createdAt: new Date("09-20-2020 19:00"),
        },
        {
          id: 11,
          amount: 1.15,
          hederaTransactionId: "2131",
          consumerId: 10,
          prosumerId: 106,
          createdAt: new Date("09-29-2020 10:00"),
        },
        {
          id: 12,
          amount: 1.29,
          hederaTransactionId: "1331",
          consumerId: 101,
          prosumerId: 10,
          createdAt: new Date("12-12-2020 18:00"),
        },
        {
          id: 13,
          amount: 1.08,
          hederaTransactionId: "89",
          consumerId: 107,
          prosumerId: 10,
          createdAt: new Date("07-12-2020 09:00"),
        },
        {
          id: 14,
          amount: 1.24,
          hederaTransactionId: "31",
          consumerId: 10,
          prosumerId: 101,
          createdAt: new Date("07-30-2020 15:00"),
        },
        {
          id: 15,
          amount: 1.18,
          hederaTransactionId: "9131",
          consumerId: 104,
          prosumerId: 10,
          createdAt: new Date("05-09-2020 13:00"),
        },
        {
          id: 16,
          amount: 1.11,
          hederaTransactionId: "111",
          consumerId: 10,
          prosumerId: 103,
          createdAt: new Date("11-24-2020 11:30"),
        },
        {
          id: 17,
          amount: 1.21,
          hederaTransactionId: "1091",
          consumerId: 10,
          prosumerId: 102,
          createdAt: new Date("12-31-2020 11:00"),
        },
        {
          id: 18,
          amount: 1.11,
          hederaTransactionId: "1281",
          consumerId: 108,
          prosumerId: 10,
          createdAt: new Date("01-12-2021 21:00"),
        },
        {
          id: 19,
          amount: 1.2,
          hederaTransactionId: "1101",
          consumerId: 10,
          prosumerId: 101,
          createdAt: new Date("03-22-2021 15:00"),
        },
        {
          id: 20,
          amount: 1.07,
          hederaTransactionId: "1221",
          consumerId: 108,
          prosumerId: 10,
          createdAt: new Date("05-01-2021 18:30"),
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
