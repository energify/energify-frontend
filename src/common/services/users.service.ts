import { request } from "../api.util";
import type { Prices } from "./users.interfaces";

export class UsersService {
  async updatePrices(prices: Prices) {
    return request("/users/prices", "PUT", prices);
  }

  async fetchPrices() {
    return request<Prices>("/users/prices", "GET");
  }
}
