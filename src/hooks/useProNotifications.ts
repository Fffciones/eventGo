import { useMemo } from 'react';
import type { AgendaEvent } from './useProfessionalProfile';

export type NotificationKind =
  | 'ALERT_6H'       // evento em até 6h, profissional ainda não saiu
  | 'ALERT_60MIN'    // evento em até 60min, profissional ainda não saiu
  | 'SILENCE'        // durante o evento — modo silencioso
  | 'POST_EVENT';    // evento concluído — pagamento + avaliação

export interface ProNotification {
  kind:       NotificationKind;
  event:      AgendaEvent;
  minutesLeft: number; // negativo = já passou
}

export function useProNotifications(agenda: AgendaEvent[]): ProNotification[] {
  return useMemo(() => {
    const now   = new Date();
    const alerts: ProNotification[] = [];

    for (const ev of agenda) {
      const starts   = new Date(ev.starts_at);
      const ends     = new Date(ev.ends_at);
      const silenceEnd = new Date(ends.getTime() + 30 * 60_000);
      const minutesLeft = Math.round((starts.getTime() - now.getTime()) / 60_000);

      // ── Modo silencioso (starts_at → ends_at + 30min) ──────────────
      if (now >= starts && now <= silenceEnd) {
        // TODO FCM: suspender todos os pushes para este profissional
        alerts.push({ kind: 'SILENCE', event: ev, minutesLeft });
        continue; // silêncio total — não empilha outros alertas
      }

      // ── Pós-evento (checkout feito OU ends_at já passou) ───────────
      if (
        ev.status === 'CHECKED_OUT' ||
        (now > silenceEnd && ['ACCEPTED','IN_TRANSIT','CHECKED_IN'].includes(ev.status))
      ) {
        // TODO FCM: push "Pagamento confirmado + link de avaliação"
        alerts.push({ kind: 'POST_EVENT', event: ev, minutesLeft });
        continue;
      }

      // Só alertas de pré-evento para quem ainda não saiu (ACCEPTED)
      if (ev.status !== 'ACCEPTED') continue;

      // ── Alerta 60 min ──────────────────────────────────────────────
      if (minutesLeft > 0 && minutesLeft <= 60) {
        // TODO FCM: push "Seu evento começa em menos de 1h! Marque que está a caminho."
        alerts.push({ kind: 'ALERT_60MIN', event: ev, minutesLeft });
        continue;
      }

      // ── Alerta 6h ─────────────────────────────────────────────────
      if (minutesLeft > 60 && minutesLeft <= 360) {
        // TODO FCM: push com briefing completo (uniforme, alimentação, transporte)
        alerts.push({ kind: 'ALERT_6H', event: ev, minutesLeft });
      }
    }

    // Prioridade: SILENCE > ALERT_60MIN > ALERT_6H > POST_EVENT
    const priority: Record<NotificationKind, number> = {
      SILENCE: 0, ALERT_60MIN: 1, ALERT_6H: 2, POST_EVENT: 3,
    };
    return alerts.sort((a, b) => priority[a.kind] - priority[b.kind]);
  }, [agenda]);
}
