function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function normalizePhone(input: string, defaultCountryCode = "+20") {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const startsWithPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");

  if (!digits) return "";

  if (startsWithPlus) {
    return `+${digits}`;
  }

  if (defaultCountryCode === "+20") {
    if (digits.startsWith("00")) {
      digits = digits.slice(2);
      return `+${digits}`;
    }
    if (digits.startsWith("20")) return `+${digits}`;
    if (digits.startsWith("0")) return `+20${digits.slice(1)}`;
    return `+20${digits}`;
  }

  const countryDigits = defaultCountryCode.replace(/\D/g, "");
  return `+${countryDigits}${digits.replace(/^0+/, "")}`;
}

export function phoneSearchVariants(input: string, defaultCountryCode = "+20") {
  const trimmed = input.trim();
  const normalized = normalizePhone(trimmed, defaultCountryCode);
  const digits = normalized.replace(/\D/g, "");
  const rawDigits = trimmed.replace(/\D/g, "");
  const variants = [trimmed, normalized, digits, rawDigits];

  if (digits.startsWith("20") && digits.length > 2) {
    const national = digits.slice(2);
    variants.push(`0${national}`, national, `+20${national}`);
  }

  if (rawDigits.startsWith("0") && defaultCountryCode === "+20") {
    const national = rawDigits.slice(1);
    variants.push(`+20${national}`, `20${national}`, national);
  }

  return unique(variants);
}
