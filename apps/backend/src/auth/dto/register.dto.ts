import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import type { RegisterRequest } from "@payment-flow/shared";

export class RegisterDto implements RegisterRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  merchantName!: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryAccountName!: string;

  @Matches(/^\d{6}$/, { message: "sortCode must be 6 digits" })
  sortCode!: string;

  @Matches(/^\d{8}$/, { message: "accountNumber must be 8 digits" })
  accountNumber!: string;
}
