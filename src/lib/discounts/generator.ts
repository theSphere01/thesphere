import { nanoid } from "nanoid";
import { DEFAULT_DISCOUNT_CONFIG } from "@/lib/constants";
import type { DiscountType, DiscountConfig } from "@/lib/types";
import { addDays, format } from "date-fns";

export function generateCode(): string {
  return `SPH-${nanoid(8).toUpperCase()}`;
}

export function getVisitDiscount(
  visitCount: number,
  config: DiscountConfig = DEFAULT_DISCOUNT_CONFIG
): { percent: number; type: DiscountType } | null {
  if (visitCount >= 4) return { percent: config.visit_4_plus, type: "loyalty" };
  if (visitCount === 3) return { percent: config.visit_3, type: "loyalty" };
  if (visitCount === 2) return { percent: config.visit_2, type: "loyalty" };
  return null;
}

export function buildDiscountRecord(
  profileId: string,
  percent: number,
  type: DiscountType,
  validDays: number
) {
  return {
    profile_id: profileId,
    code: generateCode(),
    discount_percent: percent,
    discount_type: type,
    valid_until: format(addDays(new Date(), validDays), "yyyy-MM-dd"),
    is_used: false,
  };
}
