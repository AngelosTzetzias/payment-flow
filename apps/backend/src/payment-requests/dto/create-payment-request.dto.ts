import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUppercase,
  Length,
  MaxLength,
  Min,
} from "class-validator";
import type { CreatePaymentRequestDto as CreatePaymentRequestContract } from "@payment-flow/shared";

export class CreatePaymentRequestDto implements CreatePaymentRequestContract {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  description!: string;

  /** Minor units (pence) — integer, at least 1. */
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @IsUppercase()
  currency?: string;
}
