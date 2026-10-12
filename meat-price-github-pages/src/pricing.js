/** All selling prices are whole multiples of 1,000 toman. */
export const PRICE_STEP = 1_000;
export const MIN_PRICE = 1_000;

// 1,124,769.23 -> 1,125,000
export function roundPrice(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric / PRICE_STEP) * PRICE_STEP : 0;
}

export function validPrice(value) {
  return Math.max(MIN_PRICE, roundPrice(value));
}

export function activeParts(definitions) {
  return definitions.filter((part) => part.enabled && Number(part.weight) > 0);
}

export function sumWeight(definitions) {
  return activeParts(definitions).reduce((sum, part) => sum + Number(part.weight), 0);
}

export function purchaseTotals(purchase, totalWeight) {
  const pricePerKg = Math.max(0, Number(purchase?.pricePerKg) || 0);
  const profit = Math.max(0, Number(purchase?.profit) || 0);
  const purchaseCost = pricePerKg * totalWeight;
  const target = purchaseCost + profit;
  return { pricePerKg, profit, purchaseCost, target, baseRate: totalWeight > 0 ? target / totalWeight : 0 };
}

export function computeRevenue(definitions, parts) {
  return activeParts(definitions).reduce((total, part) =>
    total + (Number(parts[part.id]?.price) || 0) * Number(part.weight), 0);
}

/**
 * Improve a rounded result without changing locked or user-selected prices.
 * A perfectly exact target is not always achievable with 1,000-toman steps
 * and arbitrary decimal kilogram weights. The UI reports any remaining gap.
 */
function improveResidual(next, adjustable, defs, target) {
  let residual = target - computeRevenue(defs, next);
  for (let attempt = 0; attempt < 500 && Math.abs(residual) > 0.000001; attempt += 1) {
    const direction = residual > 0 ? 1 : -1;
    let bestPart = null;
    let bestGap = Math.abs(residual);
    for (const part of adjustable) {
      const price = Number(next[part.id]?.price || 0);
      if (price + direction * PRICE_STEP < MIN_PRICE) continue;
      const newGap = Math.abs(residual - direction * PRICE_STEP * Number(part.weight));
      if (newGap + 0.000001 < bestGap) {
        bestGap = newGap;
        bestPart = part;
      }
    }
    if (!bestPart) break;
    next[bestPart.id] = {
      ...next[bestPart.id],
      price: next[bestPart.id].price + direction * PRICE_STEP,
    };
    residual = target - computeRevenue(defs, next);
  }
  return next;
}

/** Initialize every enabled price from the weighted base rate. */
export function createBasePrices(defs, previous, purchase) {
  const enabled = activeParts(defs);
  const totalWeight = sumWeight(defs);
  const { baseRate, target } = purchaseTotals(purchase, totalWeight);
  const next = { ...previous };
  for (const part of enabled) {
    next[part.id] = { ...next[part.id], id: part.id, price: validPrice(baseRate) };
  }
  return improveResidual(next, enabled, defs, target);
}

/**
 * A selected part is changed by `delta = (new-old)*weight`.
 * All OTHER unlocked parts receive the identical per-kg shift
 * `-delta/sum(other unlocked weights)` before 1,000-toman rounding.
 * Locked parts and the selected part never participate in residual correction.
 */
export function changePartPrice({ defs, previous, locks, id, newPrice, baseRate, target }) {
  const enabled = activeParts(defs);
  const chosen = enabled.find((part) => part.id === id);
  if (!chosen || locks?.[id]) return previous;

  const oldPrice = Number(previous[id]?.price ?? validPrice(baseRate));
  const nextPrice = validPrice(newPrice);
  if (oldPrice === nextPrice) return previous;

  const delta = (nextPrice - oldPrice) * Number(chosen.weight);
  const adjustable = enabled.filter((part) => part.id !== id && !locks?.[part.id]);
  const adjustableWeight = adjustable.reduce((sum, part) => sum + Number(part.weight), 0);
  const next = { ...previous, [id]: { ...previous[id], id, price: nextPrice } };

  if (adjustableWeight > 0) {
    const shiftPerKg = delta / adjustableWeight;
    for (const part of adjustable) {
      const currentPrice = Number(previous[part.id]?.price ?? validPrice(baseRate));
      next[part.id] = { ...previous[part.id], id: part.id, price: validPrice(currentPrice - shiftPerKg) };
    }
    improveResidual(next, adjustable, defs, target);
  }
  return next;
}

export function pricingSignature(defs, purchase) {
  return JSON.stringify({
    enabled: activeParts(defs).map(({ id, weight }) => ({ id, weight: Number(weight) })),
    pricePerKg: Number(purchase?.pricePerKg) || 0,
    profit: Number(purchase?.profit) || 0,
  });
}
