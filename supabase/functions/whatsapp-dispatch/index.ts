// =====================================================================
// Edge Function: whatsapp-dispatch  (Etapa 5A — stub, sem provedor)
// =====================================================================
// Varre a fila de notifications (channel = 'WHATSAPP', sent_at IS NULL),
// resolve o telefone do destinatário e "entrega" a mensagem através de um
// adapter de provedor. Na 5A o único adapter é o `stub`, que apenas loga.
//
// Trocar de provedor (5B) = setar a env WHATSAPP_PROVIDER (meta|twilio|zapi)
// e implementar o adapter correspondente abaixo. Nada mais no app muda.
//
// Deploy:   supabase functions deploy whatsapp-dispatch
// Agendar:  cron pg_net (select net.http_post(...)) OU Database Webhook em
//           notifications. Ver docs/etapa5_whatsapp_plano.md.
// =====================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ── Adapter de provedor ──────────────────────────────────────────────
interface WhatsAppMessage {
  to: string;          // telefone normalizado (só dígitos, com DDI)
  text: string;        // corpo já renderizado
  templateKey?: string;// nome do template (relevante para Meta Cloud API, 5B)
  params?: string[];   // params ordenados do template (5B)
}

interface WhatsAppAdapter {
  readonly name: string;
  send(msg: WhatsAppMessage): Promise<{ ok: boolean; detail?: string }>;
}

// 5A: não envia nada, só registra no log para validar a fila ponta a ponta.
const stubAdapter: WhatsAppAdapter = {
  name: 'stub',
  async send(msg) {
    console.log(`[whatsapp:stub] -> ${msg.to} :: ${msg.text.replace(/\n/g, ' ⏎ ')}`);
    return { ok: true, detail: 'stub: not actually sent' };
  },
};

// 5B: implementar quando houver provedor.
// const metaAdapter: WhatsAppAdapter = { name: 'meta', async send(msg) { /* Cloud API */ } };
// const twilioAdapter: WhatsAppAdapter = { name: 'twilio', async send(msg) { /* Twilio */ } };
// const zapiAdapter: WhatsAppAdapter = { name: 'zapi', async send(msg) { /* Z-API (suporta grupo) */ } };

function pickAdapter(): WhatsAppAdapter {
  const provider = (Deno.env.get('WHATSAPP_PROVIDER') ?? 'stub').toLowerCase();
  switch (provider) {
    // case 'meta':   return metaAdapter;
    // case 'twilio': return twilioAdapter;
    // case 'zapi':   return zapiAdapter;
    case 'stub':
    default:
      return stubAdapter;
  }
}

// ── Normalização de telefone (espelha src/lib/whatsapp.ts) ────────────
function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return null;
  if (!digits.startsWith('55') && digits.length >= 10 && digits.length <= 11) {
    digits = '55' + digits;
  }
  return digits || null;
}

// Quantas notificações processar por execução (evita rodadas muito longas).
const BATCH = 50;

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const adapter = pickAdapter();

  // 1) Puxa a fila pendente, já trazendo o telefone do destinatário.
  const { data: pending, error } = await supabase
    .from('notifications')
    .select('id, title, body, payload, users ( phone, whatsapp_opt_in )')
    .eq('channel', 'WHATSAPP')
    .is('sent_at', null)
    .order('created_at', { ascending: true })
    .limit(BATCH);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let sent = 0, skipped = 0, failed = 0;

  for (const n of pending ?? []) {
    const user = (n as any).users;
    const phone = normalizePhone(user?.phone);

    // Sem opt-in ou sem telefone: marca como processada para não travar a fila.
    if (!user?.whatsapp_opt_in || !phone) {
      await supabase.from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', (n as any).id);
      skipped++;
      continue;
    }

    const payload = (n as any).payload ?? {};
    const text = payload.whatsapp_text ?? `${(n as any).title}\n${(n as any).body}`;

    const res = await adapter.send({
      to: phone,
      text,
      templateKey: payload.whatsapp_template,
      params: payload.whatsapp_params,
    });

    if (res.ok) {
      await supabase.from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', (n as any).id);
      sent++;
    } else {
      // Deixa sent_at NULL para reprocessar na próxima rodada.
      console.error(`[whatsapp] falha ao enviar notification ${(n as any).id}: ${res.detail}`);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ provider: adapter.name, processed: pending?.length ?? 0, sent, skipped, failed }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
