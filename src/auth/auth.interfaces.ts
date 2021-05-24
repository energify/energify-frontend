export enum Roles {
  Unverified,
  Consumer,
  Prosumer,
  Admin,
}

export interface User {
  name: string;
  email: string;
  birthdate: string;
  picture: string;
  role: Roles;
  hederaAccountId: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  birthday: string;
  cc: string;
}

export interface CompleteAccountDto {
  hederaAccountId: string;
  nif: string;
  address: string;
}

export interface LoginResponse {
  accessToken: string;
}
