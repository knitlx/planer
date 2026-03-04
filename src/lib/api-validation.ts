import { NextResponse } from "next/server";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function apiError(status: number, code: ApiErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function validationError(message: string) {
  return apiError(400, "VALIDATION_ERROR", message);
}

export function assertRecord(value: unknown, message = "Некорректное тело запроса"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(message);
  }
  return value as Record<string, unknown>;
}

export function parseRequiredString(
  value: unknown,
  fieldName: string,
  minLength = 1,
  maxLength = 500,
) {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  const normalized = value.trim();
  if (normalized.length < minLength) {
    throw new ValidationError(`${fieldName} is required`);
  }
  if (normalized.length > maxLength) {
    throw new ValidationError(`${fieldName} is too long`);
  }
  return normalized;
}

export function parseOptionalString(
  value: unknown,
  fieldName: string,
  maxLength = 500,
) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ValidationError(`${fieldName} is too long`);
  }
  return normalized;
}

export function parseOptionalInt(
  value: unknown,
  fieldName: string,
  minValue: number,
  maxValue: number,
) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  const normalized = Math.round(value);
  if (normalized < minValue || normalized > maxValue) {
    throw new ValidationError(`${fieldName} must be between ${minValue} and ${maxValue}`);
  }
  return normalized;
}

export function parseOptionalNonNegativeInt(
  value: unknown,
  fieldName: string,
) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  const normalized = Math.round(value);
  if (normalized < 0) {
    throw new ValidationError(`${fieldName} must be >= 0`);
  }
  return normalized;
}

export function parseEnumValue<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
) {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(`${fieldName} has invalid value`);
  }
  return value as T;
}

export function parseOptionalEnumValue<T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
) {
  if (value === undefined || value === null) return undefined;
  return parseEnumValue(value, fieldName, allowedValues);
}

export function parseOptionalBoolean(value: unknown, fieldName: string) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new ValidationError(`${fieldName} must be a boolean`);
  }
  return value;
}
