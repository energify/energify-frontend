import type { ApiResponse } from "../interfaces/api.interfaces";

export class ApiService {
  public baseUrl = "http://localhost:3000";

  private async request<T>(endpoint: string, method: string, body?: any): Promise<T & ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      const data = (await response.json()) as T & ApiResponse;

      if (data?.statusCode === "401") {
        localStorage.setItem("token", "");
      }

      return data;
    } catch (e) {
      alert(e);
    }
  }

  async post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, "POST", body);
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint, "GET");
  }

  async put<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, "PUT", body);
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, "DELETE");
  }
}

export const apiService = new ApiService();
