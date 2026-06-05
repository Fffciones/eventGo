import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, Clock, VolumeX, CheckCircle, X,
  Shirt, Utensils, Navigation, Bus, AlertCircle, Star
} from 'lucide-react';
import type { ProNotification } from '../../hooks/useProNotifications';

interface BannerProps {
  notifications: ProNotification[];
  onDismiss: (eventId: string) => void;
  onGoToAgenda: () => void;
}

// ── Banners empilhados no topo do app ────────────────────────────────────────
export function ProNotificationBanners({ notifications, onDismiss, onGoToAgenda }: BannerProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 px-4 pt-3">
      <AnimatePresence initial={false}>
        {notifications.map(n => (
          <Banner
            key={`${n.kind}-${n.event.bp_id}`}
            notification={n}
            onDismiss={() => onDismiss(n.event.event_id)}
            onGoToAgenda={onGoToAgenda}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Banner({ notification: n, onDismiss, onGoToAgenda }: {
  notification: ProNotification;
  onDismiss: () => void;
  onGoToAgenda: () => void;
}) {
  const config = BANNER_CONFIG[n.kind];
  const briefing = n.event.briefing ?? {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border overflow-hidden shadow-sm ${config.wrapper}`}
    >
      {/* Header */}
      <div className={`flex items-start justify-between gap-2 px-4 py-3 ${config.header}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`shrink-0 ${config.iconColor}`}>{config.icon}</span>
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wide ${config.iconColor}`}>
              {config.title}
            </p>
            <p className="text-sm font-semibold text-slate-800 truncate">{n.event.event_name}</p>
          </div>
        </div>
        <button onClick={onDismiss} className="shrink-0 text-slate-400 hover:text-slate-600 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className={`px-4 pb-3 pt-1 ${config.body}`}>
        <p className="text-sm text-slate-600">{config.message(n)}</p>

        {/* Briefing para alerta de 6h */}
        {n.kind === 'ALERT_6H' && Object.keys(briefing).length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5 pt-2 border-t border-slate-100">
            {briefing.uniforme       && <BriefingLine icon={<Shirt className="w-3 h-3" />}      text={briefing.uniforme} />}
            {briefing.alimentacao    && <BriefingLine icon={<Utensils className="w-3 h-3" />}   text={briefing.alimentacao} />}
            {briefing.ponto_encontro && <BriefingLine icon={<Navigation className="w-3 h-3" />} text={briefing.ponto_encontro} />}
            {briefing.transporte     && <BriefingLine icon={<Bus className="w-3 h-3" />}        text={briefing.transporte} />}
            {briefing.observacoes    && <BriefingLine icon={<AlertCircle className="w-3 h-3" />}text={briefing.observacoes} />}
          </div>
        )}

        {/* CTA */}
        {n.kind !== 'SILENCE' && (
          <button
            onClick={onGoToAgenda}
            className={`mt-2.5 w-full py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${config.cta}`}
          >
            {config.ctaLabel}
          </button>
        )}

        {/* TODO FCM note */}
        <p className="text-[10px] text-slate-300 mt-2 text-center">
          // TODO FCM: substituir por push notification quando virar app nativo
        </p>
      </div>
    </motion.div>
  );
}

function BriefingLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-1.5 text-xs text-slate-600">
      <span className="text-primary mt-0.5 shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ── Modal pós-evento ─────────────────────────────────────────────────────────
interface PostEventModalProps {
  notification: ProNotification;
  onClose: () => void;
}

export function PostEventModal({ notification: n, onClose }: PostEventModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Topo verde */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black text-white">Evento concluído!</h2>
          <p className="text-green-100 text-sm mt-1">{n.event.event_name}</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Pagamento */}
          <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Pagamento confirmado</p>
            <p className="text-2xl font-black text-green-700 mt-1">
              R$ {n.event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-green-500 mt-0.5">A caminho da sua conta</p>
          </div>

          {/* Avaliação */}
          <div className="text-center">
            <p className="text-sm text-slate-600 mb-3">Como foi o evento? Sua avaliação melhora a plataforma.</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="w-8 h-8 text-amber-300 fill-amber-300 cursor-pointer hover:scale-110 transition-transform" />
              ))}
            </div>
            <button className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm active:scale-95 transition-all shadow-sm">
              Enviar avaliação
            </button>
            {/* TODO FCM: substituir por push "Avalie o evento" quando virar app nativo */}
          </div>

          <button onClick={onClose} className="text-sm text-slate-400 font-medium text-center hover:underline">
            Avaliar depois
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Config por tipo ──────────────────────────────────────────────────────────

const BANNER_CONFIG: Record<string, {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  wrapper: string;
  header: string;
  body: string;
  cta: string;
  ctaLabel: string;
  message: (n: ProNotification) => string;
}> = {
  ALERT_6H: {
    title:     'Evento em 6 horas',
    icon:      <Bell className="w-4 h-4" />,
    iconColor: 'text-blue-600',
    wrapper:   'bg-blue-50 border-blue-200',
    header:    'bg-blue-50',
    body:      'bg-blue-50',
    cta:       'bg-blue-600 text-white hover:bg-blue-700',
    ctaLabel:  'Ver na agenda',
    message:   n => `Seu evento começa em ${Math.round(n.minutesLeft / 60)}h. Confira o briefing abaixo e se prepare!`,
  },
  ALERT_60MIN: {
    title:     'Atenção — menos de 1 hora!',
    icon:      <Clock className="w-4 h-4" />,
    iconColor: 'text-amber-600',
    wrapper:   'bg-amber-50 border-amber-200',
    header:    'bg-amber-50',
    body:      'bg-amber-50',
    cta:       'bg-amber-500 text-white hover:bg-amber-600',
    ctaLabel:  'Marcar que estou a caminho',
    message:   n => `Faltam ${n.minutesLeft} minutos para o início. Marque que está a caminho!`,
  },
  SILENCE: {
    title:     'Modo silencioso ativo',
    icon:      <VolumeX className="w-4 h-4" />,
    iconColor: 'text-slate-500',
    wrapper:   'bg-slate-50 border-slate-200',
    header:    'bg-slate-50',
    body:      'bg-slate-50',
    cta:       '',
    ctaLabel:  '',
    message:   () => 'Você está em evento. Notificações pausadas até 30 min após o término. Bom trabalho! 💪',
  },
  POST_EVENT: {
    title:     'Evento concluído',
    icon:      <CheckCircle className="w-4 h-4" />,
    iconColor: 'text-green-600',
    wrapper:   'bg-green-50 border-green-200',
    header:    'bg-green-50',
    body:      'bg-green-50',
    cta:       'bg-green-600 text-white hover:bg-green-700',
    ctaLabel:  'Ver pagamento e avaliar',
    message:   n => `Pagamento de R$ ${n.event.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} confirmado e a caminho da sua conta.`,
  },
};
