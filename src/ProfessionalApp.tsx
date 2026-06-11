import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CalendarCheck, User, MapPin, Map } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { useProfessionalProfile } from './hooks/useProfessionalProfile';
import { useProNotifications } from './hooks/useProNotifications';
import ConviteView from './components/pro/ConviteView';
import AgendaView from './components/pro/AgendaView';
import ProfileViewPro from './components/pro/ProfileViewPro';
import HomeViewPro from './components/pro/HomeViewPro';
import { ProNotificationBanners, PostEventModal } from './components/pro/ProNotifications';
import AuthScreen from './components/auth/AuthScreen';
import ResetPasswordScreen from './components/auth/ResetPasswordScreen';

type ProTab = 'map' | 'invites' | 'agenda' | 'profile';

export default function ProfessionalApp() {
  const { user, loading: authLoading, signOut, recovery, updatePassword, exitRecovery } = useAuth();
  const {
    profile, invites, agenda, loading,
    toggleAvailability, respondToInvite, refetch,
    updateHomeAddress, updateRadius,
  } = useProfessionalProfile(user?.id);

  const notifications = useProNotifications(agenda);
  const [dismissedIds, setDismissedIds]     = useState<Set<string>>(new Set());
  const [postEventDone, setPostEventDone]   = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab]           = useState<ProTab>('map');

  // Motor do matchmaking: enquanto o app do profissional está aberto, damos
  // "ticks" periódicos que avançam a fila de ofertas direcionadas e expiram
  // vagas para o mural. Em produção isto vira um pg_cron/edge function.
  useEffect(() => {
    if (!user) return;
    const tick = () => { supabase.rpc('process_matchmaking'); };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [user]);

  const visibleBanners = notifications.filter(
    n => n.kind !== 'POST_EVENT' && !dismissedIds.has(n.event.event_id)
  );
  const postEventNotif = notifications.find(
    n => n.kind === 'POST_EVENT' && !postEventDone.has(n.event.event_id)
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MapPin className="text-primary w-8 h-8 animate-pulse" />
          <span className="font-display text-xl font-bold text-primary">EventPro Pro</span>
        </div>
      </div>
    );
  }

  if (recovery) {
    return <ResetPasswordScreen onSubmit={updatePassword} onDone={exitRecovery} />;
  }

  if (!user) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MapPin className="text-primary w-8 h-8 animate-pulse" />
          <span className="font-display text-xl font-bold text-primary">EventPro Pro</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-sans min-h-screen flex flex-col justify-between overflow-x-hidden antialiased">
      {/* Header */}
      <header className="w-full top-0 sticky bg-white shadow-sm z-40 flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2 select-none">
          <MapPin className="text-primary w-6 h-6 animate-pulse" />
          <span className="font-display text-2xl font-black text-primary tracking-tight">EventPro</span>
          <span className="text-xs font-semibold text-white bg-primary rounded-full px-2 py-0.5 ml-1">PRO</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAvailability}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              profile?.is_available
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${profile?.is_available ? 'bg-green-500' : 'bg-slate-400'}`} />
            {profile?.is_available ? 'Online' : 'Offline'}
          </button>
          <div
            onClick={() => setActiveTab('profile')}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary-fixed cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-sm"
          >
            {profile?.avatar_url ? (
              <img alt={profile.full_name} className="w-full h-full object-cover" src={profile.avatar_url} />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="font-display font-bold text-primary text-sm">
                  {(profile?.full_name ?? user?.email ?? 'P')[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 w-full pb-24">

        {/* Banners de notificação (topo de qualquer aba) */}
        <ProNotificationBanners
          notifications={visibleBanners}
          onDismiss={id => setDismissedIds(prev => new Set([...prev, id]))}
          onGoToAgenda={() => setActiveTab('agenda')}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === 'map' && profile && (
              <HomeViewPro profile={profile} />
            )}
            {activeTab === 'invites' && (
              <ConviteView invites={invites} onRespond={respondToInvite} />
            )}
            {activeTab === 'agenda' && (
              <AgendaView agenda={agenda} onRefetch={refetch} />
            )}
            {activeTab === 'profile' && (
              <ProfileViewPro
                profile={profile}
                userId={user?.id}
                onToggleAvailability={toggleAvailability}
                onUpdateHomeAddress={updateHomeAddress}
                onUpdateRadius={updateRadius}
                onRefetch={refetch}
                onSignOut={signOut}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modal pós-evento */}
      <AnimatePresence>
        {postEventNotif && (
          <PostEventModal
            notification={postEventNotif}
            onClose={() => setPostEventDone(prev => new Set([...prev, postEventNotif.event.event_id]))}
          />
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-slate-200/80 px-4 py-2 pb-5 md:pb-3 shadow-lg flex justify-around items-center rounded-t-2xl">
        <NavButton
          label="Mapa"
          icon={<Map className="w-5 h-5 shrink-0" />}
          active={activeTab === 'map'}
          onClick={() => setActiveTab('map')}
        />
        <NavButton
          label="Convites"
          icon={<Bell className="w-5 h-5 shrink-0" />}
          active={activeTab === 'invites'}
          badge={invites.length}
          onClick={() => setActiveTab('invites')}
        />
        <NavButton
          label="Agenda"
          icon={<CalendarCheck className="w-5 h-5 shrink-0" />}
          active={activeTab === 'agenda'}
          onClick={() => setActiveTab('agenda')}
        />
        <NavButton
          label="Perfil"
          icon={<User className="w-5 h-5 shrink-0" />}
          active={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
        />
      </nav>
    </div>
  );
}

function NavButton({
  label, icon, active, badge, onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-1.5 px-5 rounded-full transition-all duration-300 ${
        active
          ? 'bg-primary-container text-on-primary-container shadow-sm font-bold scale-105'
          : 'text-on-surface-variant hover:bg-slate-50'
      }`}
    >
      {icon}
      <span className="text-[10px] font-semibold mt-0.5">{label}</span>
      {badge != null && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
