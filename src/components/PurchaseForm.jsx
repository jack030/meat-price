import Slider from './Slider';
import { PROFIT_MIN, PROFIT_MAX, PROFIT_STEP, formatNumber } from '../data';
import { purchaseTotals } from '../pricing';

export default function PurchaseForm({ animal, setAnimal, purchase, setPurchase, totalWeight, onNext }) {
  const { pricePerKg, profit, purchaseCost, target } = purchaseTotals(purchase, totalWeight);

  return (
    <section className="panel mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">۱. اطلاعات خرید</h2>
        <p className="mt-1 text-sm text-slate-500">قیمت خرید هر کیلو گوشت و سود موردنظر برای کل گوشت را وارد کنید.</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="font-bold">نوع دام</legend>
        <div className="grid grid-cols-2 gap-3">
          {[['sheep', '🐑 گوسفند'], ['cow', '🐄 گاو']].map(([id, label]) => (
            <label key={id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${animal === id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
              <input type="radio" name="animal" checked={animal === id} onChange={() => setAnimal(id)} className="accent-emerald-600" />{label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="pricePerKg" className="block font-bold">قیمت خرید هر کیلو (تومان)</label>
        <input id="pricePerKg" type="number" min="0" step="1000" inputMode="numeric" className="field" value={purchase?.pricePerKg ?? 0}
          onChange={(event) => setPurchase((previous) => ({ ...previous, pricePerKg: Math.max(0, Number(event.target.value) || 0) }))} />
        <p className="text-xs text-slate-500">قیمت خرید کل پس از واردکردن وزن قطعات محاسبه می‌شود.</p>
      </div>

      <Slider label="سود برای کل گوشت" min={PROFIT_MIN} max={PROFIT_MAX} step={PROFIT_STEP}
        value={profit} onChange={(value) => setPurchase((previous) => ({ ...previous, profit: value }))} />

      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
        {totalWeight > 0 ? (
          <div className="space-y-2">
            <div className="flex justify-between gap-3"><span>وزن قطعات فعال</span><strong>{formatNumber(totalWeight)} کیلوگرم</strong></div>
            <div className="flex justify-between gap-3"><span>هزینه خرید کل ({formatNumber(pricePerKg)} × {formatNumber(totalWeight)})</span><strong>{formatNumber(purchaseCost)} تومان</strong></div>
            <div className="flex justify-between gap-3 border-t border-emerald-200 pt-2"><span className="font-semibold">مبلغ هدف فروش با سود</span><strong className="text-base">{formatNumber(target)} تومان</strong></div>
          </div>
        ) : (
          <p>وزن قطعات در مرحله بعد تعیین می‌شود؛ مبلغ کل خرید و فروش پس از آن نمایش داده خواهد شد.</p>
        )}
      </div>
      <button onClick={onNext} className="btn-primary w-full" disabled={pricePerKg <= 0}>مرحله بعد: تنظیم قطعات ←</button>
    </section>
  );
}
