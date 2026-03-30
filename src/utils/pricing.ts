/**
 * Pricing configuration for Starbiz Academy
 * Mirrors hub-central/src/lib/pricing/config.ts
 */

export const PRICING = {
  basePrice: 17,
  perChildPrice: 10,
  minChildren: 1,
  maxChildren: 10,
  annualDiscount: 0.25,
};

export type BillingCycle = 'monthly' | 'yearly';

export function calculateMonthlyPrice(children: number): number {
  const validChildren = Math.max(PRICING.minChildren, Math.min(children, PRICING.maxChildren));
  return PRICING.basePrice + (validChildren - 1) * PRICING.perChildPrice;
}

export function calculateYearlyPrice(children: number): number {
  const monthly = calculateMonthlyPrice(children);
  return Math.round(monthly * 12 * (1 - PRICING.annualDiscount));
}

export function calculateAnnualSavings(children: number): number {
  const monthly = calculateMonthlyPrice(children);
  return monthly * 12 - calculateYearlyPrice(children);
}

export function getPrice(children: number, billingCycle: BillingCycle): number {
  return billingCycle === 'monthly'
    ? calculateMonthlyPrice(children)
    : calculateYearlyPrice(children);
}

export const PLAN_FEATURES = [
  '1 perfil de padre',
  'Acceso a todas las aplicaciones',
  'Metodologia Genesis 7i',
  'Mentorias semanales',
  'Contenido actualizado constantemente',
  '+50 cursos disponibles',
];
