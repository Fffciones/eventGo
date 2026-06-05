import { useState, useRef } from 'react';
import {
  User, Star, CalendarCheck, Radio, ChevronRight,
  Camera, Loader2, Check, Edit3, X, Home, Radius, Briefcase
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { useGeocoding } from '../../hooks/useGeocoding';
import { useFunctions, setProfessionalFunctions } from '../../hooks/useFunctions';
import type { ProfessionalProfile } from '../../hooks/useProfessionalProfile';

const RADIUS_OPTIONS = [5, 10, 15, 20, 30, 50];

interface Props {
  profile: ProfessionalProfile | null;
  userId?: string;
  onToggleAvailability: () => Promise<void>;
  onUpdateHomeAddress: (address: string, lat: number, lng: number) => Promise<void>;
  onUpdateRadius: (km: number) => Promise<void>;
  onRefetch: () => void;
  onSignOut: () => void;
}

export default function ProfileViewPro({
  profile, userId, onToggleAvailability, onUpdateHomeAddress, onUpdateRadius, onRefetch, onSignOut,
}: Props) {
  const { upload, uploading } = useAvatarUpload(userId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setAvatarUrl(url);
  };

  if (!profile) return null;

  return (
    <div className="pb-32">
      {/* Hero — avatar + nome + disponibilidade */}
      <div className="bg-white border-b border-slate-100 px-4 pt-6 pb-5 flex flex-col items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-3xl font-black text-primary">
                  {profile.full_name[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md border-2 border-white"
          >
            {uploading
              ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              : <Camera className="w-3.5 h-3.5 text-white" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800">{profile.full_name}</h2>
          <p className="text-sm text-slate-400">
            {profile.functions.length > 0
              ? profile.functions.map(f => f.name).join(' · ')
              : profile.category}
          </p>
        </div>

        {/* Toggle disponibilidade */}
        <button
          onClick={onToggleAvailability}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border font-semibold text-sm transition-all ${
            profile.is_available
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-slate-100 border-slate-300 text-slate-500'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${profile.is_available ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          {profile.is_available ? 'Disponível para eventos' : 'Indisponível'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
        <Stat icon={<Star className="w-4 h-4 text-amber-400 fill-amber-300" />} label="Estrelas" value={`${profile.stars}/5`} />
        <Stat icon={<CalendarCheck className="w-4 h-4 text-primary" />} label="Eventos" value={profile.events_count} />
        <Stat icon={<Radio className="w-4 h-4 text-green-500" />} label="Score online" value={profile.online_score} />
      </div>

      {/* Seções editáveis */}
      <div className="px-4 pt-5 flex flex-col gap-3">

        <FunctionsSection profile={profile} onRefetch={onRefetch} />
        <BioSection profile={profile} onRefetch={onRefetch} />
        <AddressSection profile={profile} onUpdateHomeAddress={onUpdateHomeAddress} />
        <RadiusSection profile={profile} onUpdateRadius={onUpdateRadius} />
        <InfoSection profile={profile} />

      </div>

      {/* Sign out */}
      <div className="px-4 mt-8">
        <button
          onClick={onSignOut}
          className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}

// ── Stat ────────────────────────────────────────────────────────────────────

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white flex flex-col items-center gap-1 py-4">
      {icon}
      <p className="text-base font-black text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-400 font-medium">{label}</p>
    </div>
  );
}

// ── Funções ──────────────────────────────────────────────────────────────────

function FunctionsSection({ profile, onRefetch }: { profile: ProfessionalProfile; onRefetch: () => void }) {
  const { functions: allFunctions, loading } = useFunctions();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(profile.functions.map(f => f.id));
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const save = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    await setProfessionalFunctions(profile.professional_id, selected);
    setSaving(false);
    setEditing(false);
    onRefetch();
  };

  return (
    <Section title="Minhas funções" icon={<Briefcase className="w-4 h-4" />}>
      {editing ? (
        <div className="flex flex-col gap-3">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {allFunctions.map(f => (
                <button
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    selected.includes(f.id)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setSelected(profile.functions.map(f => f.id)); }}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm font-semibold">
              <X className="w-3.5 h-3.5 inline mr-1" />Cancelar
            </button>
            <button onClick={save} disabled={saving || selected.length === 0}
              className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 inline animate-spin" /> : <Check className="w-3.5 h-3.5 inline mr-1" />}
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {profile.functions.length > 0
              ? profile.functions.map(f => (
                  <span key={f.id} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    {f.name}
                  </span>
                ))
              : <p className="text-sm text-slate-400">Nenhuma função selecionada.</p>
            }
          </div>
          <button onClick={() => setEditing(true)} className="shrink-0 text-primary">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ── Bio ─────────────────────────────────────────────────────────────────────

function BioSection({ profile, onRefetch }: { profile: ProfessionalProfile; onRefetch: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(profile.bio ?? '');
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from('professionals').update({ bio: value }).eq('user_id', profile.user_id);
    setSaving(false);
    setEditing(false);
    onRefetch();
  };

  return (
    <Section title="Bio" icon={<User className="w-4 h-4" />}>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={value}
            onChange={e => setValue(e.target.value)}
            rows={3}
            maxLength={300}
            className="w-full text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm font-semibold">
              <X className="w-3.5 h-3.5 inline mr-1" />Cancelar
            </button>
            <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 inline animate-spin" /> : <Check className="w-3.5 h-3.5 inline mr-1" />}
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-600 flex-1">{profile.bio ?? 'Adicione uma bio para se destacar.'}</p>
          <button onClick={() => setEditing(true)} className="shrink-0 text-primary">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ── Endereço residencial ─────────────────────────────────────────────────────

function AddressSection({ profile, onUpdateHomeAddress }: {
  profile: ProfessionalProfile;
  onUpdateHomeAddress: Props['onUpdateHomeAddress'];
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(profile.home_address ?? '');
  const { geocode, loading, error } = useGeocoding();

  const save = async () => {
    const result = await geocode(value);
    if (!result) return;
    await onUpdateHomeAddress(result.formatted, result.lat, result.lng);
    setEditing(false);
  };

  return (
    <Section title="Endereço residencial" icon={<Home className="w-4 h-4" />}>
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Ex: Vila Madalena, São Paulo, SP"
            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm font-semibold">
              <X className="w-3.5 h-3.5 inline mr-1" />Cancelar
            </button>
            <button onClick={save} disabled={loading} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-60">
              {loading ? <Loader2 className="w-3.5 h-3.5 inline animate-spin" /> : <Check className="w-3.5 h-3.5 inline mr-1" />}
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-600 flex-1">
            {profile.home_address ?? 'Adicione seu endereço para receber convites próximos.'}
          </p>
          <button onClick={() => setEditing(true)} className="shrink-0 text-primary">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Section>
  );
}

// ── Raio de atuação ──────────────────────────────────────────────────────────

function RadiusSection({ profile, onUpdateRadius }: {
  profile: ProfessionalProfile;
  onUpdateRadius: Props['onUpdateRadius'];
}) {
  const [saving, setSaving] = useState(false);

  const select = async (km: number) => {
    if (km === profile.action_radius_km) return;
    setSaving(true);
    await onUpdateRadius(km);
    setSaving(false);
  };

  return (
    <Section title="Raio de atuação" icon={<Radius className="w-4 h-4" />}>
      <div className="flex flex-wrap gap-2">
        {RADIUS_OPTIONS.map(km => (
          <button
            key={km}
            disabled={saving}
            onClick={() => select(km)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              profile.action_radius_km === km
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'
            }`}
          >
            {km} km
          </button>
        ))}
      </div>
    </Section>
  );
}

// ── Infos fixas ──────────────────────────────────────────────────────────────

function InfoSection({ profile }: { profile: ProfessionalProfile }) {
  return (
    <Section title="Dados cadastrais" icon={<ChevronRight className="w-4 h-4" />}>
      <div className="flex flex-col gap-2">
        <InfoRow label="E-mail"    value={profile.email} />
        <InfoRow label="Telefone"  value={profile.phone ?? '—'} />
        <InfoRow label="Tipo"      value={profile.professional_type === 'MEI' ? 'MEI' : 'Diarista'} />
        {profile.professional_type === 'MEI' && (
          <InfoRow label="CNPJ MEI" value={profile.mei_number ?? '—'} />
        )}
        <InfoRow label="Status"    value={profile.status} />
        <InfoRow label="WhatsApp"  value={profile.whatsapp_opt_in ? 'Ativado' : 'Desativado'} />
      </div>
    </Section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-sm text-slate-700 font-medium">{value}</span>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
        <span className="text-primary">{icon}</span>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
