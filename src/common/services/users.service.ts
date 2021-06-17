import { writable } from "svelte/store";
import type { ApiResponse } from "../interfaces/api.interfaces";
import type { User } from "../interfaces/auth.interfaces";
import type { HederaAccountIdResponse, Prices } from "../interfaces/users.interfaces";
import { apiService } from "./api.service";

export class UsersService {
  private user = writable({} as User);

  async fetchUserHederaAccountIdById(userId: string) {
    return apiService.get<HederaAccountIdResponse>(`/users/${userId}/hederaAccountId`);
  }

  async fetchAuthedUser() {
    const response = await apiService.get<User & ApiResponse>("/users/me");
    if (!response.error) {
      localStorage.setItem("hederaAccountId", response.hederaAccountId);
      this.user.set(response);
    }
  }

  async updatePrices(dto: Prices) {
    return apiService.put<ApiResponse>("/users/prices", dto);
  }

  getUser() {
    return this.user;
  }
}

export const usersService = new UsersService();
