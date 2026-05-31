import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import type { LoginRequest } from "@payment-flow/shared";

export class LoginDto implements LoginRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
