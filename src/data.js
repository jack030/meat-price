export const DEFAULT_SHEEP_PARTS = [
  'شقه', 'گرد ران', 'ران و راسته', 'سردست', 'راسته', 'گردن',
  'ماهیچه', 'قلوه گاه', 'جگر کامل', 'جگر خالی', 'کله پاچه', 'پاچه',
].map((name, index) => ({ id: `sheep-${index + 1}`, name, enabled: true, weight: 0 }));

export const DEFAULT_COW_PARTS = [
  'مغز ران', 'ماهیچه', 'سردست', 'راسته', 'فیله',
  'قلوه گاه', 'زبان', 'جگر', 'پاچه', 'سیرابی',
].map((name, index) => ({ id: `cow-${index + 1}`, name, enabled: true, weight: 0 }));

export const PROFIT_MIN = 1_000_000;
export const PROFIT_MAX = 4_000_000;
export const PROFIT_STEP = 500_000;
export const formatNumber = (value) => Number(value || 0).toLocaleString('fa-IR', { maximumFractionDigits: 2 });
export const makePart = (definition) => ({ id: definition.id, price: 0 });
export const uid = () => `part-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
