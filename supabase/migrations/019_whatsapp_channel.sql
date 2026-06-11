-- =====================================================================
-- 019 - ETAPA 5A: Canais WhatsApp (fila de envio + grupo do evento)
-- =====================================================================
-- Base para a entrega via WhatsApp sem ainda plugar um provedor.
--   - notifications.sent_at  → controle da fila de envio (NULL = pendente)
--   - events.whatsapp_group_link → link de convite do grupo (fallback manual,
--                                  enquanto não há provedor que crie grupos)
-- Aditivo e retrocompatível: campos opcionais, nada quebra.
-- Ver docs/etapa5_whatsapp_plano.md (fase 5A).
-- =====================================================================

alter table notifications add column if not exists sent_at timestamptz;

alter table events add column if not exists whatsapp_group_link text;

comment on column notifications.sent_at is
  'Quando a notificação foi efetivamente entregue pelo dispatcher. NULL = ainda na fila. Usado só para channel = WHATSAPP na fase 5A.';
comment on column events.whatsapp_group_link is
  'Link de convite (https://chat.whatsapp.com/...) do grupo do evento, colado manualmente pelo contratante. Fallback até haver provedor que crie grupos (fase 5B).';

-- Índice para o dispatcher varrer a fila de WhatsApp pendente de forma barata.
create index if not exists idx_notifications_whatsapp_queue
  on notifications (created_at)
  where channel = 'WHATSAPP' and sent_at is null;
