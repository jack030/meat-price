import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../data';
import { activeParts, changePartPrice, computeRevenue, createBasePrices, MIN_PRICE, PRICE_STEP, purchaseTotals, roundPrice, sumWeight } from '../pricing';

function DetailModal({ part, locked, price, revenue, baseRate, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);
  if (!part) return null;
  const total = price * Number(part.weight);
  const share = revenue > 0 ? total / revenue * 100 : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="part-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 id="part-dialog-title" className="text-xl font-extrabold">جزئیات {part.name || 'قطعه'}</h3>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="بستن جزئیات" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xl hover:bg-slate-200">×</button>
        </div>
        <dl className="mt-5 divide-y divide-slate-100 text-sm">
          {[
            ['وزن قطعه', `${formatNumber(part.weight)} کیلوگرم`],
            ['قیمت فروش هر کیلو', `${formatNumber(price)} تومان`],
            ['مجموع فروش این قطعه', `${formatNumber(total)} تومان`],
            ['سهم از کل فروش', `${formatNumber(share)}٪`],
            ['نرخ پایه هر کیلو', `${formatNumber(roundPrice(baseRate))} تومان`],
            ['وضعیت قیمت', locked ? 'قفل‌شده 🔒' : 'قابل‌تغییر 🔓'],
          ].map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-4 py-3"><dt className="text-slate-500">{key}</dt><dd className="text-left font-bold text-slate-900">{value}</dd></div>
          ))}
        </dl>
        <button type="button" className="btn-primary mt-5 w-full" onClick={onClose}>بستن</button>
      </section>
    </div>
  );
}

export default function PricingPage({ defs, parts, setParts, locks, setLocks, purchase, onBack, onStart }) {
  const [detailsId, setDetailsId] = useState(null);
  const lastTrigger = useRef(null);
  const enabled = activeParts(defs);
  const totalWeight = sumWeight(defs);
  const { pricePerKg, profit, purchaseCost, target, baseRate } = purchaseTotals(purchase, totalWeight);
  const revenue = computeRevenue(defs, parts);
  const difference = revenue - target;

  const rangeMin = Math.max(MIN_PRICE, Math.ceil(baseRate * 0.3 / PRICE_STEP) * PRICE_STEP);
  const rangeMax = Math.max(rangeMin + PRICE_STEP, Math.floor(baseRate * 2 / PRICE_STEP) * PRICE_STEP);

  const changePrice = (id, newPrice) => {
    setParts((previous) => changePartPrice({
      defs, previous, locks, id, newPrice, baseRate, target,
    }));
  };
  const reset = () => setParts((previous) => createBasePrices(defs, previous, purchase));
  const openDetails = (id, event) => { lastTrigger.current = event.currentTarget; setDetailsId(id); };
  const closeDetails = () => { setDetailsId(null); window.requestAnimationFrame(() => lastTrigger.current?.focus()); };
  const selectedPart = enabled.find((part) => part.id === detailsId);
  const selectedPrice = selectedPart ? Number(parts[selectedPart.id]?.price ?? roundPrice(baseRate)) : 0;

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <div className="panel space-y-4 !p-4 sm:!p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-extrabold">۳. قیمت‌گذاری قطعات</h2><p className="mt-1 text-xs text-slate-500">قیمت هر کیلو به نزدیک‌ترین {formatNumber(PRICE_STEP)} تومان گرد می‌شود.</p></div>
          <button type="button" className="btn-secondary !px-3 !py-2 text-sm" onClick={reset}>↺ بازگشت به نرخ پایه</button>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ['نرخ پایه هر کیلو', roundPrice(baseRate), 'تومان'],
            ['وزن کل', totalWeight, 'کیلوگرم'],
            ['مبلغ هدف فروش', target, 'تومان'],
            ['جمع فروش قطعات', revenue, 'تومان'],
          ].map(([title, value, unit], index) => (
            <div key={title} className={`rounded-xl px-3 py-3 ${index === 3 && Math.abs(difference) > 1000 ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-slate-50'}`}>
              <p className="text-xs font-semibold opacity-75">{title}</p>
              <p className="mt-1 break-words text-base font-extrabold tabular-nums sm:text-lg">{formatNumber(value)} <span className="text-[11px] font-medium">{unit}</span></p>
            </div>
          ))}
        </div>
        {Math.abs(difference) > 1000 && (
          <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">اختلاف با مبلغ هدف: {formatNumber(Math.abs(difference))} تومان. گردکردن قیمت‌ها، حداقل قیمت یا قفل‌ها می‌تواند از توازن دقیق جلوگیری کند.</p>
        )}
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer select-none font-semibold">نمایش محاسبه مبلغ هدف</summary>
          <p className="mt-2">{formatNumber(pricePerKg)} تومان × {formatNumber(totalWeight)} کیلوگرم = {formatNumber(purchaseCost)} تومان هزینه خرید؛ به‌علاوه {formatNumber(profit)} تومان سود.</p>
        </details>
      </div>

      <div className="space-y-2">
        {enabled.map((part) => {
          const locked = Boolean(locks[part.id]);
          const price = Number(parts[part.id]?.price ?? roundPrice(baseRate));
          const outsideSlider = price < rangeMin || price > rangeMax;
          return (
            <article key={part.id} className={`grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 gap-y-2 rounded-xl border px-3 py-2.5 shadow-sm sm:grid-cols-[minmax(110px,1fr)_minmax(120px,2.5fr)_minmax(110px,auto)_auto_auto] sm:gap-x-3 ${locked ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
              <div className="min-w-0"><h3 className="truncate text-sm font-extrabold sm:text-base" title={part.name}>{part.name || 'بدون نام'}</h3><p className="mt-0.5 text-[11px] text-slate-500">{formatNumber(part.weight)} کیلوگرم</p></div>
              <div className="order-last col-span-4 min-w-0 sm:order-none sm:col-span-1">
                <input aria-label={`قیمت فروش هر کیلو ${part.name}`} type="range" min={rangeMin} max={rangeMax} step={PRICE_STEP}
                  value={Math.min(rangeMax, Math.max(rangeMin, price))} disabled={locked}
                  onChange={(event) => changePrice(part.id, Number(event.target.value))}
                  className="block h-5 w-full" />
                {outsideSlider && <p className="text-[10px] text-amber-800">قیمت تعدیل‌شده خارج از محدوده اسلایدر است.</p>}
              </div>
              <div className="whitespace-nowrap text-left"><strong className="text-sm font-extrabold text-emerald-700 sm:text-base">{formatNumber(price)}</strong><p className="text-[10px] text-slate-500">تومان / کیلو</p></div>
              <button type="button" onClick={(event) => openDetails(part.id, event)} aria-label={`جزئیات ${part.name}`} title="نمایش جزئیات"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg font-bold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700">ⓘ</button>
              <button type="button" onClick={() => setLocks((previous) => ({ ...previous, [part.id]: !previous[part.id] }))}
                aria-label={locked ? `بازکردن قفل ${part.name}` : `قفل‌کردن ${part.name}`} aria-pressed={locked} title={locked ? 'بازکردن قفل قیمت' : 'قفل‌کردن قیمت'}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition ${locked ? 'bg-amber-200' : 'bg-slate-100 hover:bg-slate-200'}`}>
                {locked ? '🔒' : '🔓'}
              </button>
            </article>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 pt-1"><button className="btn-secondary flex-1" onClick={onBack}>بازگشت به تنظیم قطعات</button><button className="btn-primary flex-1" onClick={onStart}>اطلاعات خرید</button></div>
      {selectedPart && <DetailModal part={selectedPart} locked={Boolean(locks[selectedPart.id])} price={selectedPrice} revenue={revenue} baseRate={baseRate} onClose={closeDetails} />}
    </section>
  );
}
