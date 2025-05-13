// Handling enums (type, status, visibility)
export function checkEnum<T extends string>(
  value: string | null | undefined,
  enumValues: readonly T[],
): T | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  const enumValue = enumValues.find((enumValue) => enumValue === value);

  return enumValue ?? undefined;
}
