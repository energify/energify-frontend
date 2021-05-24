import { get, writable } from "svelte/store";
import { request } from "../common/api.util";
import { hederaService } from "../common/services/services.injector";
import {
  User,
  LoginDto,
  LoginResponse,
  RegisterDto,
  Roles,
  CompleteAccountDto,
} from "./auth.interfaces";

export class AuthService {
  user = writable({} as User);

  async login(dto: LoginDto) {
    const { data } = await request<LoginResponse>("/users/login", "POST", dto);
    localStorage.setItem("token", data.accessToken);
  }

  logout() {
    localStorage.removeItem("token");
  }

  async register(dto: RegisterDto) {
    return request("/users/register", "POST", dto);
  }

  async complete(dto: CompleteAccountDto) {
    return request("/users/complete", "PUT", dto);
  }

  async details() {
    return request<User>("/users/details", "GET");
  }

  async isLoggedIn() {
    if (!localStorage.getItem("token")) {
      return false;
    }

    try {
      if (!get(this.user).email) {
        const { data } = await this.details();
        this.user.set(data);
        hederaService.hederaAccountInfo.update((info) => ({
          ...info,
          accountId: data.hederaAccountId,
        }));
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  isAccountComplete() {
    return get(this.user).role !== Roles.Unverified;
  }
}
