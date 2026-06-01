import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Heart, Star, Calendar, UserCheck,
  ChevronRight, RefreshCw, X, Loader2, Users,
  Utensils, Headphones, Shield, Sparkles, Camera,
  Mic, Settings, UserCheck as UserCheckIcon, MapPin, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../hooks/useProfile';

interface FavoritesViewProps {
  profile?: UserProfile | null;
  onCreateEvent?: () => void;
}

interface FavProfessional {
  professional_id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  category: string;
  stars: number;
  events_count: number;
  hourly_cache: number;
  bio: string | null;
  status: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: { full_name: string; avatar_url: string | null };
}

interface AvailabilitySlot {
  id: string;
  starts_at: string;
  ends_at: string;
  is_available: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  GARCOM:             { label: 'Garçom / Barman',      icon: Utensils,      color: 'bg-amber-50 text-amber-700' },
  DJ:                 { label: 'DJ',                   icon: Headphones,    color: 'bg-purple-50 text-purple-700' },
  SEGURANCA:          { label: 'Segurança',            icon: Shield,        color: 'bg-blue-50 text-blue-700' },
  FAXINEIRO:          { label: 'Limpeza',              icon: Sparkles,      color: 'bg-green-50 text-green-700' },
  FOTOGRAFO:          { label: 'Fotógrafo',            icon: Camera,        color: 'bg-pink-50 text-pink-700' },
  MESTRE_CERIMONIAS:  { label: 'Mestre de Cerimônias', icon: Mic,           color: 'bg-indigo-50 text-indigo-700' },
  PRODUTOR:           { label: 'Produtor',             icon: Settings,      color: 'bg-orange-50 text-orange-700' },
  CONTROLADOR_ACESSO: { label: 'Controle de Acesso',   icon: UserCheckIcon, color: 'bg-teal-50 text-teal-700' },
};

export default function FavoritesView({ profile, onCreateEvent }: FavoritesViewProps) {
  const [favorites, setFavorites]       = useState<FavProfessional[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedPro, setSelectedPro]   = useState<FavProfessional | null>(null);
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  // ── buscar favoritos ──────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.client_id) return;
    fetchFavorites();
  }, [profile?.client_id]);

  const fetchFavorites = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_favorites')
      .select(`
        professional_id,
        professionals (
          id, stars, events_count, hourly_cache, bio, status, category,
          user_id,
          users ( full_name, avatar_url )
        )
      `)
      .eq('client_id', profile!.client_id!);

    setFavorites(
      (data ?? []).map((f: any) => ({
        professional_id: f.professional_id,
        user_id:         f.professionals?.user_id,
        full_name:       f.professionals?.users?.full_name ?? '—',
        avatar_url:      f.professionals?.users?.avatar_url ?? null,
        category:        f.professionals?.category ?? '',
        stars:           f.professionals?.stars ?? 0,
        events_count:    f.professionals?.events_count ?? 0,
        hourly_cache:    f.professionals?.hourly_cache ?? 0,
        bio:             f.professionals?.bio ?? null,
        status:          f.professionals?.status ?? 'ACTIVE',
      }))
    );
    setLoading(false);
  };

  // ── desfavoritar ──────────────────────────────────────────────────
  const removeFavorite = async (professionalId: string) => {
    await supabase
      .from('client_favorites')
      .delete()
      .eq('client_id', profile!.client_id!)
      .eq('professional_id', professionalId);

    setFavorites(prev => prev.filter(f => f.professional_id !== professionalId));
    if (selectedPro?.professional_id === professionalId) setSelectedPro(null);
  };

  // ── abrir detalhe do profissional ─────────────────────────────────
  const openDetail = async (pro: FavProfessional) => {
    setSelectedPro(pro);
    setLoadingDetail(true);

    // buscar avaliações
    const { data: revData } = await supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        reviewer:reviewer_id ( full_name, avatar_url )
      `)
      .eq('reviewee_id', pro.user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    setReviews((revData ?? []).map((r: any) => ({
      id:         r.id,
      rating:     Number(r.rating),
      comment:    r.comment,
      created_at: r.created_at,
      reviewer:   { full_name: r.reviewer?.full_name ?? 'Cliente', avatar_url: r.reviewer?.avatar_url ?? null },
    })));

    // buscar disponibilidade (próximos 14 dias)
    const { data: avData } = await supabase
      .from('professional_availability')
      .select('id, starts_at, ends_at, is_available')
      .eq('professional_id', pro.professional_id)
      .gte('starts_at', new Date().toISOString())
      .lte('starts_at', new Date(Date.now() + 14 * 86400000).toISOString())
      .order('starts_at');

    setAvailability(avData ?? []);
    setLoadingDetail(false);
  };

  // ── LISTA DE FAVORITOS ────────────────────────────────────────────
  if (!selectedPro) {
    return (
      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-4 pb-24 space-y-5">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-primary">Meus Favoritos</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Profissionais que se destacaram nos seus eventos. A plataforma os prioriza nos próximos convites.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white border border-outline-variant/30 rounded-2xl p-10 text-center space-y-3">
            <Heart className="w-10 h-10 text-on-surface-variant mx-auto" />
            <p className="font-display text-lg font-bold text-primary">Nenhum favorito ainda</p>
            <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
              Após seus eventos, favorite os profissionais que se destacaram. Eles aparecem primeiro nos próximos convites.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.map((pro) => {
              const cat = CATEGORY_MAP[pro.category] ?? { label: pro.category, icon: Users, color: 'bg-slate-50 text-slate-700' };
              const CatIcon = cat.icon;

              return (
                <motion.div
                  key={pro.professional_id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                >
                  {/* cabeçalho */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {pro.avatar_url ? (
                        <img src={pro.avatar_url} alt={pro.full_name}
                          className="w-14 h-14 rounded-xl object-cover border border-outline-variant/20" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="font-display text-xl font-bold text-primary">{pro.full_name[0]}</span>
                        </div>
                      )}
                      {pro.status === 'ACTIVE' && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-primary truncate">{pro.full_name}</h4>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${cat.color}`}>
                        <CatIcon className="w-3 h-3" /> {cat.label}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFavorite(pro.professional_id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors shrink-0"
                      title="Remover dos favoritos"
                    >
                      <Heart className="w-4 h-4 fill-rose-400" />
                    </button>
                  </div>

                  {/* stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-outline-variant/20">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-0.5 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span className="font-mono text-sm font-bold">{pro.stars}</span>
                      </div>
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-wide mt-0.5">Estrelas</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-sm font-bold text-primary">{pro.events_count}</p>
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-wide mt-0.5">Eventos</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-sm font-bold text-primary">
                        R$ {Number(pro.hourly_cache).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-[9px] text-on-surface-variant uppercase tracking-wide mt-0.5">Cache/8h</p>
                    </div>
                  </div>

                  {/* ações */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openDetail(pro)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-xs py-2.5 rounded-xl transition-all"
                    >
                      Ver perfil <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onCreateEvent?.()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-on-primary font-semibold text-xs py-2.5 rounded-xl shadow-sm active:scale-[0.98] transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Chamar novamente
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    );
  }

  // ── DETALHE DO PROFISSIONAL ───────────────────────────────────────
  const cat = CATEGORY_MAP[selectedPro.category] ?? { label: selectedPro.category, icon: Users, color: 'bg-slate-50 text-slate-700' };
  const CatIcon = cat.icon;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <main className="max-w-3xl mx-auto pb-24">
      {/* header */}
      <div className="sticky top-0 bg-white border-b border-outline-variant/30 z-10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSelectedPro(null)}
          className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <span className="font-display text-lg font-bold text-primary">Perfil do Profissional</span>
        <button
          onClick={() => removeFavorite(selectedPro.professional_id)}
          className="p-2 rounded-full hover:bg-rose-50 transition-colors"
        >
          <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
        </button>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* hero card */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl p-5 flex gap-4 shadow-sm">
          {selectedPro.avatar_url ? (
            <img src={selectedPro.avatar_url} alt={selectedPro.full_name}
              className="w-20 h-20 rounded-2xl object-cover border border-outline-variant/20 shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="font-display text-3xl font-bold text-primary">{selectedPro.full_name[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold text-primary">{selectedPro.full_name}</h2>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${cat.color}`}>
              <CatIcon className="w-3 h-3" /> {cat.label}
            </span>
            {selectedPro.bio && (
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{selectedPro.bio}</p>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Estrelas', value: selectedPro.stars, icon: '⭐' },
            { label: 'Eventos', value: selectedPro.events_count, icon: '📅' },
            { label: 'Cache 8h', value: `R$${Number(selectedPro.hourly_cache).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, icon: '💰' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-outline-variant/30 rounded-2xl p-3 text-center shadow-sm">
              <p className="text-lg">{s.icon}</p>
              <p className="font-mono font-bold text-primary text-sm mt-1">{s.value}</p>
              <p className="text-[9px] text-on-surface-variant uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => onCreateEvent?.()}
          className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Criar evento e priorizar este profissional
        </button>

        {/* disponibilidade */}
        <div className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setShowAvailability(!showAvailability)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="w-5 h-5" />
              <span className="font-display font-bold">Disponibilidade (14 dias)</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-on-surface-variant transition-transform ${showAvailability ? 'rotate-90' : ''}`} />
          </button>

          <AnimatePresence>
            {showAvailability && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden border-t border-outline-variant/20"
              >
                <div className="p-4 space-y-2">
                  {loadingDetail ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
                  ) : availability.length === 0 ? (
                    <p className="text-xs text-on-surface-variant text-center py-3">Nenhuma disponibilidade cadastrada.</p>
                  ) : (
                    availability.map(slot => (
                      <div key={slot.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs ${
                        slot.is_available ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Clock className={`w-3.5 h-3.5 ${slot.is_available ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <div>
                            <p className={`font-semibold ${slot.is_available ? 'text-emerald-800' : 'text-slate-500'}`}>
                              {new Date(slot.starts_at).toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit', month:'short' })}
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              {new Date(slot.starts_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                              {' – '}
                              {new Date(slot.ends_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                          slot.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {slot.is_available ? 'Disponível' : 'Ocupado'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* avaliações */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-primary">Avaliações</h3>
            {avgRating && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="font-mono font-bold text-sm text-amber-700">{avgRating}</span>
                <span className="text-xs text-amber-600">({reviews.length})</span>
              </div>
            )}
          </div>

          {loadingDetail ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
          ) : reviews.length === 0 ? (
            <div className="bg-white border border-outline-variant/30 rounded-2xl p-6 text-center">
              <p className="text-sm text-on-surface-variant">Nenhuma avaliação ainda.</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className="bg-white border border-outline-variant/30 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {review.reviewer.avatar_url ? (
                      <img src={review.reviewer.avatar_url} alt={review.reviewer.full_name}
                        className="w-7 h-7 rounded-full object-cover border" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{review.reviewer.full_name[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-on-surface">{review.reviewer.full_name}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-xs text-on-surface-variant italic leading-relaxed bg-surface-container-low px-3 py-2 rounded-xl">
                    "{review.comment}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
