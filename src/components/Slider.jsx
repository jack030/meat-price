import { formatNumber } from '../data';

export default function Slider({ label, value, min, max, step = 1000, onChange, disabled = false, unit = 'تومان' }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <label className="font-medium text-slate-600">{label}</label>
        <strong className="text-emerald-700" dir="rtl">{formatNumber(value)} {unit}</strong>
      </div>
      <input aria-label={label} type="range" className="w-full" min={min} max={max} step={step}
        value={Math.min(max, Math.max(min, Number(value) || 0))}
        onChange={(event) => onChange(Number(event.target.value))} disabled={disabled} />
      <div className="flex justify-between text-xs text-slate-400" dir="ltr">
        <span>{formatNumber(min)}</span><span>{formatNumber(max)}</span>
      </div>
    </div>
  );
}
