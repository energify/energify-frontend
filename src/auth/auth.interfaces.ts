export interface User {
  name: string;
  email: string;
  birthdate: string;
  picture: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  birthdate: string;
  cc: string;
}

export interface LoginResponse {
  accessToken: string;
}
