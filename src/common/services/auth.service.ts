import type {
  LoginDto,
  LoginResponse,
  RegisterDto,
  RegisterResponse,
} from "../interfaces/auth.interfaces";
import { apiService } from "./api.service";

export class AuthService {
  async login(dto: LoginDto) {
    const response = await apiService.post<LoginResponse>("/auth/login", dto);

    if (response.accessToken) {
      localStorage.setItem("token", response.accessToken);
    }

    return response;
  }

  async register(dto: RegisterDto) {
    return apiService.post<RegisterResponse>("/auth/register", dto);
  }

  async logout() {
    localStorage.removeItem("token");
  }
}

export const authService = new AuthService();
