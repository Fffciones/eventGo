import LegalPageLayout from './LegalPageLayout';
import { LegalSection, LegalList } from './LegalSection';
import { COMPANY } from './legalConfig';

/**
 * RASCUNHO TÉCNICO — baseado no que o produto efetivamente coleta e faz
 * hoje (auditado no código-fonte em 2026-07-24). Precisa de revisão
 * jurídica antes de ir para produção. Campos [PREENCHER] em legalConfig.ts.
 */
export default function PoliticaPrivacidade() {
  return (
    <LegalPageLayout title="Política de Privacidade">
      <p>
        Esta política explica quais dados o EventPro coleta, para quê os usa, com quem
        compartilha e quais direitos você tem sobre eles, em conformidade com a Lei Geral de
        Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <LegalSection title="1. Quem somos">
        <p>
          O EventPro é operado por <strong>{COMPANY.legalName}</strong> ({COMPANY.tradeName}),
          inscrita no CNPJ {COMPANY.cnpj}, com sede em {COMPANY.address}, na qualidade de
          controladora dos dados pessoais tratados na plataforma.
        </p>
      </LegalSection>

      <LegalSection title="2. Quais dados coletamos">
        <p>Coletamos apenas os dados necessários para operar o marketplace:</p>
        <LegalList
          items={[
            <><strong>Dados de cadastro:</strong> nome completo, e-mail, telefone/WhatsApp e senha (armazenada de forma criptografada pelo nosso provedor de autenticação, nunca em texto puro).</>,
            <><strong>Documentos:</strong> CPF (Contratante pessoa física ou Profissional diarista) ou CNPJ (Contratante pessoa jurídica ou Profissional MEI).</>,
            <><strong>Dados de localização:</strong> endereço aproximado de atuação do Profissional e raio de deslocamento; localização do evento informada pelo Contratante; localização em tempo real do Profissional (GPS), coletada apenas entre o momento em que ele marca "Em deslocamento" até o check-out do evento — nunca de forma contínua ou em segundo plano.</>,
            <><strong>Dados financeiros do Profissional:</strong> tipo e valor da chave Pix, usados para o repasse da remuneração.</>,
            <><strong>Histórico de uso:</strong> eventos criados, vagas aceitas, avaliações mútuas entre Contratante e Profissional, pontualidade.</>,
            <><strong>Dados de login social:</strong> quando você usa "Continuar com Google", recebemos nome, e-mail e foto de perfil que o Google compartilha com o app, conforme sua autorização naquele momento.</>,
            <><strong>Dados técnicos armazenados no seu navegador:</strong> ver seção 6 (Cookies e armazenamento local).</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Para que usamos seus dados">
        <LegalList
          items={[
            'Viabilizar o cadastro e a autenticação na plataforma.',
            'Conectar Contratantes e Profissionais (matchmaking) com base em função, localização e disponibilidade.',
            'Enviar notificações operacionais sobre eventos, vagas e pagamentos (push no app e, em emergências, WhatsApp).',
            'Processar o repasse da remuneração ao Profissional via Pix.',
            'Exibir avaliações e histórico para dar segurança a ambas as partes.',
            'Cumprir obrigações legais e responder a autoridades quando exigido por lei.',
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Com quem compartilhamos seus dados">
        <p>Não vendemos dados pessoais. Compartilhamos apenas com operadores estritamente necessários para o funcionamento da plataforma:</p>
        <LegalList
          items={[
            <><strong>Supabase</strong> — infraestrutura de banco de dados, autenticação e hospedagem dos dados da plataforma.</>,
            <><strong>Google (Google Maps Platform e Google Sign-In)</strong> — geocodificação de endereços, exibição de mapas e, opcionalmente, login social. O uso desses serviços está sujeito também à política de privacidade do Google.</>,
            <><strong>Provedor de WhatsApp Business</strong> — [PREENCHER quando o provedor da Etapa 5B for contratado] usado para notificações e cadastro via WhatsApp.</>,
            <><strong>Processador de pagamento</strong> — ainda não contratado; esta política será atualizada antes da Fase 7 (pagamentos) entrar em produção.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Cookies e armazenamento local">
        <p>
          O EventPro <strong>não usa cookies de rastreamento ou publicidade próprios</strong>.
          Usamos o <code>localStorage</code> do navegador — um mecanismo de armazenamento local
          equivalente a cookies para fins de proteção de dados — para:
        </p>
        <LegalList
          items={[
            'Manter sua sessão de login ativa entre visitas (token de autenticação).',
            'Lembrar preferências de navegação, como a última aba aberta no app do Contratante ou do Profissional.',
          ]}
        />
        <p>
          Serviços de terceiros incorporados na plataforma — como o Google Maps e o login com
          Google — podem definir cookies próprios, regidos pelas políticas de privacidade
          desses terceiros, fora do nosso controle direto.
        </p>
      </LegalSection>

      <LegalSection title="6. Base legal para o tratamento">
        <p>
          Tratamos seus dados com base na execução do contrato entre você e o EventPro
          (viabilizar o serviço que você contratou), no seu consentimento (ex.: login social,
          opt-in de WhatsApp) e no cumprimento de obrigações legais e regulatórias, conforme
          os arts. 7º e 11 da LGPD.
        </p>
      </LegalSection>

      <LegalSection title="7. Seus direitos como titular dos dados">
        <p>Nos termos do art. 18 da LGPD, você pode a qualquer momento solicitar:</p>
        <LegalList
          items={[
            'Confirmação da existência de tratamento e acesso aos seus dados.',
            'Correção de dados incompletos, inexatos ou desatualizados.',
            'Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei.',
            'Portabilidade dos dados a outro fornecedor de serviço.',
            'Eliminação dos dados tratados com base no seu consentimento.',
            'Revogação do consentimento e informação sobre com quem compartilhamos seus dados.',
          ]}
        />
        <p>
          Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
          <strong>{COMPANY.dpoEmail}</strong>.
        </p>
      </LegalSection>

      <LegalSection title="8. Retenção e exclusão">
        <p>
          Mantemos seus dados enquanto sua conta estiver ativa e pelo período necessário para
          cumprir obrigações legais, fiscais e regulatórias após o encerramento da conta.
          Você pode solicitar a exclusão da sua conta e dos dados associados a qualquer momento,
          respeitadas as retenções exigidas por lei.
        </p>
      </LegalSection>

      <LegalSection title="9. Segurança da informação">
        <p>
          Adotamos medidas técnicas e administrativas para proteger seus dados contra acessos
          não autorizados e situações acidentais ou ilícitas de destruição, perda, alteração,
          comunicação ou difusão, incluindo controle de acesso por perfil (Contratante,
          Profissional, Administrador) e políticas de segurança em nível de banco de dados.
        </p>
      </LegalSection>

      <LegalSection title="10. Uso por menores de idade">
        <p>
          O EventPro não se destina a menores de 18 anos. Não coletamos intencionalmente dados
          de crianças ou adolescentes.
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações desta política">
        <p>
          Podemos atualizar esta política para refletir mudanças no produto ou na legislação.
          Alterações relevantes serão comunicadas na plataforma antes de entrarem em vigor.
        </p>
      </LegalSection>

      <LegalSection title="12. Contato">
        <p>
          Dúvidas sobre esta política ou sobre o tratamento dos seus dados podem ser enviadas
          para <strong>{COMPANY.dpoEmail}</strong>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
