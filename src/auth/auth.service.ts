import { get, writable } from "svelte/store";
import { request } from "../common/api.util";
import type { User, LoginDto, LoginResponse, RegisterDto } from "./auth.interfaces";

export class AuthService {
  user = writable({} as User);

  async login(dto: LoginDto) {
    const { data } = await request<LoginResponse>("/users/login", "POST", dto);
    localStorage.setItem("token", data.accessToken);
  }

  async register(dto: RegisterDto) {
    return request("/users/register", "POST", dto);
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
        console.log(this.user);
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}
