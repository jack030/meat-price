import { useEffect, useState } from 'react';
import { DEFAULT_COW_PARTS, DEFAULT_SHEEP_PARTS, formatNumber, makePart } from './data';
import { createBasePrices, pricingSignature, purchaseTotals, sumWeight } from './pricing';
import useLocalStorage from './hooks/useLocalStorage';
import PurchaseForm from './components/PurchaseForm';
import Settings from './components/Settings';
import PricingPage from './components/PricingPage';

const KEYS = ['animal', 'purchase', 'sheepDefs', 'cowDefs', 'sheepParts', 'cowParts', 'locks', 'pricingSignatures'];

function reconcileParts(defs, setParts) {
  setParts((previous) => {
    const missing = defs.filter((definition) => !previous[definition.id]);
    if (!missing.length) return previous;
    return { ...previous, ...Object.fromEntries(missing.map((definition) => [definition.id, makePart(definition)])) };
  });
}

export default function App() {
  const [step, setStep] = useState(1);
  const [animal, setAnimal] = useLocalStorage('animal', 'sheep');
  const [purchase, setPurchase] = useLocalStorage('purchase', { pricePerKg: 0, profit: 1_000_000 });
  const [sheepDefs, setSheepDefs] = useLocalStorage('sheepDefs', DEFAULT_SHEEP_PARTS);
  const [cowDefs, setCowDefs] = useLocalStorage('cowDefs', DEFAULT_COW_PARTS);
  const [sheepParts, setSheepParts] = useLocalStorage('sheepParts', {});
  const [cowParts, setCowParts] = useLocalStorage('cowParts', {});
  const [locks, setLocks] = useLocalStorage('locks', { sheep: {}, cow: {} });
  const [pricingSignatures, setPricingSignatures] = useLocalStorage('pricingSignatures', { sheep: null, cow: null });

  useEffect(() => { reconcileParts(sheepDefs, setSheepParts); }, [sheepDefs, setSheepParts]);
  useEffect(() => { reconcileParts(cowDefs, setCowParts); }, [cowDefs, setCowParts]);

  // Older versions saved total purchase cost as `purchase.price`.
  // Convert it using the current animal's configured weight, if available.
  // Without a weight it is unsafe to interpret a total cost as a per-kg price.
  useEffect(() => {
    if (purchase && purchase.pricePerKg === undefined) {
      const currentDefs = animal === 'sheep' ? sheepDefs : cowDefs;
      const weight = sumWeight(currentDefs);
      const converted = weight > 0 ? Number(purchase.price || 0) / weight : 0;
      setPurchase({ pricePerKg: converted, profit: Number(purchase.profit) || 1_000_000 });
    }
  }, [purchase, animal, sheepDefs, cowDefs, setPurchase]);

  const sheep = animal === 'sheep';
  const defs = sheep ? sheepDefs : cowDefs;
  const setDefs = sheep ? setSheepDefs : setCowDefs;
  const parts = sheep ? sheepParts : cowParts;
  const setParts = sheep ? setSheepParts : setCowParts;
  const animalLocks = locks?.[animal] || {};
  const setAnimalLocks = (updater) => setLocks((previous) => {
    const old = previous?.[animal] || {};
    return { ...previous, [animal]: typeof updater === 'function' ? updater(old) : updater };
  });

  const goToPricing = () => {
    const weight = sumWeight(defs);
    if (weight <= 0 || purchaseTotals(purchase, weight).pricePerKg <= 0) return;
    const signature = pricingSignature(defs, purchase);
    const hasValidPrices = defs.filter((def) => def.enabled && Number(def.weight) > 0)
      .every((def) => Number(parts[def.id]?.price) > 0);
    if (pricingSignatures?.[animal] !== signature || !hasValidPrices) {
      setParts((previous) => createBasePrices(defs, previous, purchase));
      setPricingSignatures((previous) => ({ ...previous, [animal]: signature }));
    }
    setStep(3);
  };

  const clearAll = () => {
    if (!window.confirm('همهٔ اطلاعات ذخیره‌شده پاک شود؟')) return;
    for (const key of KEYS) window.localStorage.removeItem(key);
    window.location.reload();
  };

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 pb-12">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div><h1 className="text-lg font-extrabold text-slate-900 sm:text-xl">🥩 ماشین‌حساب قیمت‌گذاری گوشت</h1><p className="mt-1 text-xs text-slate-500">محاسبه هوشمند نرخ فروش قطعات دام</p></div>
          <button className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={clearAll}>پاک‌سازی کامل</button>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <nav aria-label="مراحل محاسبه" className="mx-auto mb-5 grid max-w-4xl grid-cols-3 gap-2">
          {['اطلاعات خرید', 'تنظیم قطعات', 'قیمت‌گذاری'].map((title, index) => (
            <div key={title} aria-current={step === index + 1 ? 'step' : undefined}
              className={`rounded-xl px-2 py-2.5 text-center text-xs font-semibold sm:text-sm ${step === index + 1 ? 'bg-emerald-600 text-white' : step > index + 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-400 ring-1 ring-slate-200'}`}>
              {formatNumber(index + 1)}. {title}
            </div>
          ))}
        </nav>
        {step === 1 && <PurchaseForm animal={animal} setAnimal={setAnimal} purchase={purchase} setPurchase={setPurchase} totalWeight={sumWeight(defs)} onNext={() => setStep(2)} />}
        {step === 2 && <Settings defs={defs} setDefs={setDefs} parts={parts} setParts={setParts} purchase={purchase} setLocks={setAnimalLocks} onBack={() => setStep(1)} onNext={goToPricing} />}
        {step === 3 && <PricingPage defs={defs} parts={parts} setParts={setParts} locks={animalLocks} setLocks={setAnimalLocks} purchase={purchase} onBack={() => setStep(2)} onStart={() => setStep(1)} />}
      </div>
    </main>
  );
}
