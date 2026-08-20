import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PLAN_PRICES = {
  "1hour": 200,
  "1day": 250,
  "3months": 800,
  "1year": 1999,
};

export const PLAN_LABELS = {
  "1hour": "1 Hour Pass",
  "1day": "1 Day Unlimited Pass",
  "3months": "3 Months Unlimited Plan",
  "1year": "1 Year Unlimited Plan",
};

export type PlanId = keyof typeof PLAN_PRICES;

export interface KidPlan {
  kidName: string;
  planId: PlanId;
}

export function calculateBilling(kids: KidPlan[]) {
  // Calculate Subtotal
  let subtotal = 0;
  for (const kid of kids) {
    subtotal += PLAN_PRICES[kid.planId] || 0;
  }

  // Sibling Discount: Automatic 10% discount if exactly 2 kids are checked out
  let discountPercentage = 0;
  if (kids.length === 2) {
    discountPercentage = 0.10;
  }

  const discountAmount = subtotal * discountPercentage;
  const taxableAmount = subtotal - discountAmount;
  
  // Tax: 18% GST standard on taxable amount
  const taxAmount = taxableAmount * 0.18;
  
  const grandTotal = taxableAmount + taxAmount;

  return {
    subtotal,
    discountPercentage,
    discountAmount,
    taxableAmount,
    taxAmount,
    grandTotal,
  };
}
