export interface ApiResponse<T> {
  status: number;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

let baseUrl = "http://localhost:8080";

export async function request<T>(
  endpoint: string,
  method: string,
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const req = await fetch(`${baseUrl}${endpoint}`, {
      method: method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });
    if (req.ok) {
      return { status: req.status, data: await req.json().catch(() => {}) };
    }
    return { status: req.status, error: await req.json().catch(() => {}) };
  } catch (e) {
    console.error(e);
  }
}

async function post<T>(endpoint: string, body?: any) {
  return request<T>(endpoint, "POST", body);
}

async function get<T>(endpoint: string) {
  return request<T>(endpoint, "GET");
}

async function put<T>(endpoint: string, body?: any) {
  return request<T>(endpoint, "PUT", body);
}

async function _delete<T>(endpoint: string) {
  return request<T>(endpoint, "DELETE");
}
