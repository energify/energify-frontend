import { request } from "../api.util";

export class UsersService {
  async fetchPrices() {
    return { data: { buyPrice: 1.2, sellPrice: 1.18 } };
  }
}
