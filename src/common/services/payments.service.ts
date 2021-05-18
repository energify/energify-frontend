import { request } from "../api.util";
import type { Payment } from "./payments.interfaces";

export class PaymentsService {
  constructor() {}

  fetchPayments() {
    return request<Payment[]>("/payments/user", "GET");
  }
}
