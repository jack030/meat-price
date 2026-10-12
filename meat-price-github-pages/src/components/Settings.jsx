import { formatNumber, uid } from '../data';
import { purchaseTotals } from '../pricing';

export default function Settings({ defs, setDefs, parts, setParts, purchase, setLocks, onBack, onNext }) {
  const update = (id, patch) => setDefs((prev) => prev.map((part) => part.id === id ? { ...part, ...patch } : part));
  const add = () => {
    const id = uid();
    setDefs((prev) => [...prev, { id, name: 'قطعه جدید', enabled: true, weight: 0 }]);
    // Immediately create corresponding price record; the useEffect also reconciles missing data.
    setParts((prev) => ({ ...prev, [id]: { id, price: 0 } }));
  };
  const remove = (id) => {
    setDefs((prev) => prev.filter((part) => part.id !== id));
    setParts((prev) => { const next = { ...prev }; delete next[id]; return next; });
    setLocks((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };
  const totalWeight = defs.reduce((sum, part) => sum + (part.enabled ? Math.max(0, Number(part.weight) || 0) : 0), 0);
  const { purchaseCost, target } = purchaseTotals(purchase, totalWeight);

  return (
    <section className="panel mx-auto max-w-4xl space-y-5">
      <div><h2 className="text-xl font-extrabold">۲. تنظیم قطعات</h2><p className="mt-1 text-sm text-slate-500">قطعات قابل‌فروش را فعال کنید و وزن آن‌ها را بنویسید.</p></div>
      <div className="space-y-2">
        {defs.map((part) => (
          <div key={part.id} className={`grid grid-cols-[auto_minmax(0,1fr)_minmax(88px,120px)_auto] items-center gap-2 rounded-xl border p-2.5 sm:gap-3 ${part.enabled ? 'border-slate-200' : 'border-slate-100 bg-slate-50'}`}>
            <input type="checkbox" aria-label={`فعال‌سازی ${part.name}`} className="h-5 w-5 accent-emerald-600" checked={part.enabled} onChange={(event) => update(part.id, { enabled: event.target.checked })} />
            <input aria-label="نام قطعه" className="field min-w-0" value={part.name} onChange={(event) => update(part.id, { name: event.target.value })} />
            <div><input aria-label={`وزن ${part.name} به کیلوگرم`} type="number" min="0" step="0.01" className="field" value={part.weight} onChange={(event) => update(part.id, { weight: Math.max(0, Number(event.target.value) || 0) })} /><p className="mt-1 text-center text-xs text-slate-400">کیلوگرم</p></div>
            <button type="button" aria-label={`حذف ${part.name}`} title="حذف قطعه" onClick={() => remove(part.id)} className="rounded-lg px-2 py-2 text-xl text-rose-500 hover:bg-rose-50">×</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-secondary w-full border-dashed border-emerald-400 text-emerald-700" onClick={add}>+ افزودن قطعه</button>
      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <div className="flex justify-between gap-3"><span>مجموع وزن قطعات فعال</span><strong className="text-emerald-700">{formatNumber(totalWeight)} کیلوگرم</strong></div>
        {totalWeight > 0 && <>
          <div className="mt-2 flex justify-between gap-3"><span>هزینه خرید کل</span><strong>{formatNumber(purchaseCost)} تومان</strong></div>
          <div className="mt-2 flex justify-between gap-3"><span>مبلغ هدف فروش</span><strong>{formatNumber(target)} تومان</strong></div>
        </>}
      </div>
      <div className="flex flex-wrap gap-3"><button className="btn-secondary flex-1" onClick={onBack}>بازگشت</button><button className="btn-primary flex-[2]" onClick={onNext} disabled={totalWeight <= 0}>مرحله بعد: قیمت‌گذاری ←</button></div>
    </section>
  );
}
