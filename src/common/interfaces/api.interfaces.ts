export interface ApiResponse {
  error?: string;
  message?: string;
  statusCode?: string;
}

export interface PaginatedData<T> {
  data: Array<T>;
  count: number;
}
