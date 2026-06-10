/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { useProfile } from './hooks/useProfile';
import { useEvents } from './hooks/useEvents';
import AuthScreen from './components/auth/AuthScreen';
import CreateEventScreen from './components/CreateEventScreen';
import { 
  Home, 
  CalendarCheck, 
  Heart, 
  User, 
  MapPin, 
  Map, 
  PlusCircle, 
  Search, 
  Check, 
  CheckCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { TabType, BookingTeam, ClientEvent, Professional } from './types';
import { INITIAL_BOOKINGS, INITIAL_CLIENT_EVENTS, FAVORITE_PROFESSIONALS, CLIENT_AVATARS } from './data';
import HomeView from './components/HomeView';
import BookingsView from './components/BookingsView';
import FavoritesView from './components/FavoritesView';
import ProfileView from './components/ProfileView';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const { profile, events: dbEvents, favorites: dbFavorites, avgRating } = useProfile(user?.id);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('eventgo_active_tab');
    return (saved as TabType) || 'home';
  });

  const [bookings, setBookings] = useState<BookingTeam[]>(() => {
    const saved = localStorage.getItem('eventgo_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const { createEvent } = useEvents(profile?.client_id);
  const [events, setEvents] = useState<ClientEvent[]>(() => {
    const saved = localStorage.getItem('eventgo_events');
    return saved ? JSON.parse(saved) : INITIAL_CLIENT_EVENTS;
  });

  const [favoritePros, setFavoritePros] = useState<Professional[]>(FAVORITE_PROFESSIONALS);
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [bookingsRefreshKey, setBookingsRefreshKey] = useState(0);

  // Sync to local storage — hooks ANTES de qualquer return condicional
  useEffect(() => {
    localStorage.setItem('eventgo_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('eventgo_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('eventgo_events', JSON.stringify(events));
  }, [events]);

  // Guards — apenas após todos os hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <MapPin className="text-primary w-8 h-8 animate-pulse" />
          <span className="font-display text-xl font-bold text-primary">EventPro</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }


  const activeEvent = events.find(e => e.status === 'ATIVO') || events[0];

  const handleAddBooking = (newBooking: BookingTeam) => {
    setBookings(prev => [newBooking, ...prev]);
    // update total staff count in active event
    setEvents(prev => prev.map(ev => {
      if (ev.status === 'ATIVO') {
        return {
          ...ev,
          proCount: ev.proCount + newBooking.countConfirmed
        };
      }
      return ev;
    }));
  };

  const handleAddEvent = (newEvent: ClientEvent) => {
    setEvents(prev => [newEvent, ...prev]);
  };

  const handleToggleFavorite = (proId: string) => {
    // toggle favorite internally
  };

  const handleSelectPro = (proId: string | null) => {
    setSelectedProId(proId);
    if (proId) {
      setActiveTab('favorites');
    }
  };

  // Tela de criação de evento (full screen)
  if (showCreateEvent && profile) {
    return (
      <CreateEventScreen
        profile={profile}
        onBack={() => setShowCreateEvent(false)}
        onCreated={() => {
          setShowCreateEvent(false);
          setActiveTab('bookings');
          setBookingsRefreshKey(k => k + 1);  // força refetch da lista
        }}
      />
    );
  }

  return (
    <div className="bg-background text-on-background font-sans min-h-screen flex flex-col justify-between overflow-x-hidden antialiased">
      {/* Top Application Header Bar */}
      {/* (Only render on top views that don't have their custom back headers to avoid double headers) */}
      {selectedProId === null && (
        <header className="w-full top-0 sticky bg-white shadow-sm z-40 flex items-center justify-between px-margin-mobile py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2 select-none">
            <MapPin className="text-primary w-6 h-6 animate-pulse" />
            <span className="font-display text-2xl font-black text-primary tracking-tight">EventPro</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateEvent(true)}
              className="text-primary hover:bg-primary/10 p-2 rounded-full transition-all"
              title="Novo evento"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                // TODO: abrir painel de notificações
              alert(`Você tem ${unreadCount} notificação(ões) não lida(s).`);
              }}
              className="text-[#1a1b1e] hover:bg-slate-100 p-2 rounded-full transform active:scale-95 transition-all text-xs relative"
            >
              {unreadCount > 0 && (
                <>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-sky-400 rounded-full animate-ping" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-sky-400 rounded-full" />
                </>
              )}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </button>
            <div 
              onClick={() => {
                setSelectedProId(null);
                setActiveTab('profile');
              }}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-sm"
            >
              {profile?.avatar_url ? (
                <img
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                  src={profile.avatar_url}
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="font-display font-bold text-primary text-sm">
                    {(profile?.full_name ?? user?.email ?? 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main viewport Container with Tab selections */}
      <div className="flex-1 w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedProId || '') + (activeTab === 'bookings' ? `-${bookingsRefreshKey}` : '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === 'home' && (
              <HomeView 
                onAddBooking={handleAddBooking} 
                onSelectPro={handleSelectPro} 
                onNavigate={(tab) => {
                  setSelectedProId(null);
                  setActiveTab(tab);
                }}
              />
            )}
            {activeTab === 'bookings' && (
              <BookingsView
                profile={profile}
                onNavigate={(tab) => {
                  setSelectedProId(null);
                  setActiveTab(tab);
                }}
                onCreateEvent={() => setShowCreateEvent(true)}
              />
            )}
            {activeTab === 'favorites' && (
              <FavoritesView
                profile={profile}
                onCreateEvent={() => setShowCreateEvent(true)}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileView
                events={events}
                dbEvents={dbEvents}
                dbFavorites={dbFavorites}
                avgRating={avgRating}
                onAddEvent={handleAddEvent}
                favoritePros={favoritePros}
                onToggleFavorite={handleToggleFavorite}
                onSelectPro={handleSelectPro}
                profile={profile}
                onSignOut={signOut}
                onCreateEvent={() => setShowCreateEvent(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Persistent Elegant Bottom Tab Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-slate-200/80 px-4 py-2 pb-5 md:pb-3 shadow-lg flex justify-around items-center rounded-t-2xl">
        <button 
          onClick={() => {
            setSelectedProId(null);
            setActiveTab('home');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-300 ${
            activeTab === 'home' 
              ? 'bg-primary-container text-on-primary-container shadow-sm font-bold scale-105' 
              : 'text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-semibold mt-0.5">Home</span>
        </button>

        <button 
          onClick={() => {
            setSelectedProId(null);
            setActiveTab('bookings');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-300 ${
            activeTab === 'bookings' 
              ? 'bg-primary-container text-on-primary-container shadow-sm font-bold scale-105' 
              : 'text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          <CalendarCheck className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-semibold mt-0.5">Bookings</span>
        </button>

        <button 
          onClick={() => {
            setSelectedProId(null);
            setActiveTab('favorites');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-300 ${
            activeTab === 'favorites' 
              ? 'bg-primary-container text-on-primary-container shadow-sm font-bold scale-105' 
              : 'text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-5 h-5 shrink-0 ${activeTab === 'favorites' ? 'fill-on-primary-container' : ''}`} />
          <span className="text-[10px] font-semibold mt-0.5">Favorites</span>
        </button>

        <button 
          onClick={() => {
            setSelectedProId(null);
            setActiveTab('profile');
          }}
          className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-300 ${
            activeTab === 'profile' 
              ? 'bg-primary-container text-on-primary-container shadow-sm font-bold scale-105' 
              : 'text-on-surface-variant hover:bg-slate-50'
          }`}
        >
          <User className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-semibold mt-0.5">Profile</span>
        </button>
      </nav>
    </div>
  );
}

