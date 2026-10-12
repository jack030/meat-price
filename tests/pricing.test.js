import test from 'node:test';
import assert from 'node:assert/strict';
import {
  roundPrice, createBasePrices, changePartPrice, computeRevenue,
  purchaseTotals, sumWeight, pricingSignature,
} from '../src/pricing.js';

const defs = [
  { id: 'first', name: 'شقه', enabled: true, weight: 2 },
  { id: 'second', name: 'ران', enabled: true, weight: 3 },
  { id: 'third', name: 'راسته', enabled: true, weight: 6 },
  { id: 'inactive', name: 'غیرفعال', enabled: false, weight: 100 },
];
const purchase = { pricePerKg: 100_000, profit: 1_100_000 };

const reprice = ({ previous, locks = {}, id = 'first', newPrice = 230_000 }) => changePartPrice({
  defs, previous, locks, id, newPrice,
  baseRate: purchaseTotals(purchase, sumWeight(defs)).baseRate,
  target: purchaseTotals(purchase, sumWeight(defs)).target,
});

test('rounds selling price to the nearest thousand', () => {
  assert.equal(roundPrice(1_124_769.23), 1_125_000);
  assert.equal(roundPrice(1_124_499.99), 1_124_000);
  assert.equal(roundPrice(NaN), 0);
});

test('purchase uses price per kg multiplied by enabled weight plus whole-meat profit', () => {
  assert.equal(sumWeight(defs), 11);
  assert.deepEqual(purchaseTotals(purchase, 11), {
    pricePerKg: 100_000, profit: 1_100_000,
    purchaseCost: 1_100_000, target: 2_200_000, baseRate: 200_000,
  });
});

test('initializes the actual stored prices on 1000-toman grid', () => {
  const result = createBasePrices(defs, {}, purchase);
  assert.equal(result.first.price, 200_000);
  assert.equal(result.second.price, 200_000);
  assert.equal(result.third.price, 200_000);
  assert.equal(computeRevenue(defs, result), 2_200_000);
});

test('changing one slider redistributes to other unlocked rows preserving the target', () => {
  const before = createBasePrices(defs, {}, purchase);
  const after = reprice({ previous: before });
  assert.equal(after.first.price, 230_000);
  assert.equal(after.second.price, 194_000);
  assert.equal(after.third.price, 193_000);
  assert.equal(computeRevenue(defs, after), 2_200_000);
  assert.equal(before.first.price, 200_000); // immutable result
});

test('locks leave fixed prices untouched and exclude weights from balancing', () => {
  const before = createBasePrices(defs, {}, purchase);
  const after = reprice({ previous: before, locks: { third: true } });
  assert.equal(after.first.price, 230_000);
  assert.equal(after.second.price, 180_000);
  assert.equal(after.third.price, 200_000);
  assert.equal(computeRevenue(defs, after), 2_200_000);
  assert.equal(reprice({ previous: after, id: 'third', locks: { third: true } }), after);
});

test('when no other unlocked part exists the target can differ visibly', () => {
  const before = createBasePrices(defs, {}, purchase);
  const after = reprice({ previous: before, locks: { second: true, third: true } });
  assert.equal(after.first.price, 230_000);
  assert.equal(after.second.price, before.second.price);
  assert.equal(after.third.price, before.third.price);
  assert.equal(computeRevenue(defs, after) - purchaseTotals(purchase, 11).target, 60_000);
});

test('prices respect minimum of 1000 toman even when balancing cannot fully compensate', () => {
  const smallPurchase = { pricePerKg: 1000, profit: 0 };
  const baseline = createBasePrices(defs, {}, smallPurchase);
  const changed = changePartPrice({
    defs, previous: baseline, locks: {}, id: 'first', newPrice: 100_000,
    baseRate: 1000, target: 11_000,
  });
  assert.ok(changed.second.price >= 1000);
  assert.ok(changed.third.price >= 1000);
});

test('pricing signature changes when relevant part weight or purchase data changes', () => {
  const one = pricingSignature(defs, purchase);
  assert.notEqual(one, pricingSignature(defs, { ...purchase, pricePerKg: 110_000 }));
  assert.notEqual(one, pricingSignature(defs.map((part) => part.id === 'first' ? { ...part, weight: 4 } : part), purchase));
});
