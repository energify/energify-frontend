import { get, writable } from "svelte/store";
import type { ApiResponse, PaginatedData } from "../interfaces/api.interfaces";
import type { Payment } from "../interfaces/payments.interfaces";
import { dateToQuery } from "../misc.util";
import { apiService } from "./api.service";
import { hederaService } from "./hedera.service";
import { notificationService } from "./notifications.service";
import { usersService } from "./users.service";

export class PaymentsService {
  private payments = writable<PaginatedData<Payment>>({ data: [], count: 0 });

  async fetchPayments(
    page: number = 1,
    type: string = "all",
    minPrice: number = 0,
    maxPrice: number = 5,
    date?: Date
  ) {
    let query = `page=${page}&type=${type}&min-price=${minPrice}&max-price=${maxPrice}`;

    if (date) {
      query += `&date=${dateToQuery(date)}`;
    }

    console.log(date);

    this.payments.set(
      await apiService.get<PaginatedData<Payment> & ApiResponse>(`/payments/?${query}`)
    );
  }

  async pay(payment: Payment) {
    const { hederaAccountId } = await usersService.fetchUserHederaAccountIdById(payment.prosumerId);
    try {
      const { status, hash } = await hederaService.transfer(
        hederaAccountId,
        payment.amount * 0.2 * 1000
      );

      if (status.toString() === "SUCCESS") {
        await new Promise((resolve) => {
          setTimeout(async () => {
            const { error, message } = await apiService.put(`/payments/${payment._id}/complete`, {
              hederaTransactionHash: hash,
            });
            if (error || message) return;
            this.payments.update((store) => {
              return {
                data: store.data.map((p) =>
                  p._id === payment._id
                    ? { ...p, paidAt: new Date().toISOString(), hederaTransactionHash: hash }
                    : p
                ),
                count: store.count,
              };
            });
            resolve(null);
          }, 5000);
        });
      }
    } catch (e) {
      throw Error(e);
    }
  }

  getPayments() {
    return this.payments;
  }
}

export const paymentsService = new PaymentsService();
