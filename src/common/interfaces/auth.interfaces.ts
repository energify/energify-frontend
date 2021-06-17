export enum Roles {
  Unverified,
  Consumer,
  Prosumer,
  Admin,
}

export interface User {
  _id: string;
  name: string;
  email: string;
  birthdate: string;
  picture: string;
  role: Roles;
  hederaAccountId: string;
  buyPrice: number;
  sellPrice: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  hederaAccountId: string;
}

export interface LoginResponse {
  accessToken: string;
}

export type RegisterResponse = User;
