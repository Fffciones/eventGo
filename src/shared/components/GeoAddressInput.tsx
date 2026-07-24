import { useState } from 'react';
import { MapPin, Search, Loader2, CheckCircle, X } from 'lucide-react';
import { useGeocoding, type GeoResult } from '../hooks/useGeocoding';

interface Props {
  initialValue?: string;
  placeholder?: string;
  onConfirm: (result: GeoResult) => void;
  inputClassName?: string;
}

export default function GeoAddressInput({ initialValue = '', placeholder, onConfirm, inputClassName }: Props) {
  const [value, setValue]       = useState(initialValue);
  const [result, setResult]     = useState<GeoResult | null>(null);
  const { geocode, loading, error } = useGeocoding();

  const search = async () => {
    const r = await geocode(value);
    if (r) { setResult(r); onConfirm(r); }
  };

  const clear = () => { setResult(null); };

  const base = inputClassName ?? 'w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={e => { setValue(e.target.value); setResult(null); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); search(); } }}
          placeholder={placeholder ?? 'Ex: Vila Madalena, São Paulo, SP'}
          className={`${base} pl-9 pr-12`}
        />
        <button
          type="button"
          onClick={search}
          disabled={!value.trim() || loading}
          className="absolute right-2 top-2 p-1.5 bg-primary text-white rounded-lg disabled:opacity-40 transition-all"
          title="Buscar endereço"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </button>
      </div>

      {result && (
        <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-800">Endereço confirmado</p>
            <p className="text-xs text-emerald-700 truncate">{result.formatted}</p>
          </div>
          <button type="button" onClick={clear} className="text-emerald-500 hover:text-emerald-700 shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {error && !result && (
        <p className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">{error}</p>
      )}

      {!result && (
        <p className="text-[11px] text-slate-400 flex items-center gap-1">
          Digite e clique em <Search className="w-3 h-3 inline" /> ou pressione Enter.
        </p>
      )}
    </div>
  );
}
