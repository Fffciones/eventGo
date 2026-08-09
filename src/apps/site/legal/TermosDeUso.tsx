import LegalPageLayout from './LegalPageLayout';
import { LegalSection, LegalList } from './LegalSection';
import { COMPANY } from './legalConfig';

/**
 * RASCUNHO TÉCNICO — baseado no que o produto efetivamente faz hoje
 * (auditado no código-fonte em 2026-07-24). Precisa de revisão jurídica
 * antes de ir para produção. Campos [PREENCHER] em legalConfig.ts.
 */
export default function TermosDeUso() {
  return (
    <LegalPageLayout title="Termos de Uso">
      <p>
        Estes Termos de Uso regem o acesso e uso da plataforma EventPro, operada por{' '}
        <strong>{COMPANY.legalName}</strong> ({COMPANY.tradeName}), CNPJ {COMPANY.cnpj}.
        Ao criar uma conta, você declara ter lido, compreendido e aceitado estes termos.
      </p>

      <LegalSection title="1. Definições">
        <LegalList
          items={[
            <><strong>Contratante</strong> — pessoa física ou jurídica que cria eventos e contrata Profissionais pela plataforma.</>,
            <><strong>Profissional</strong> — pessoa física cadastrada como MEI ou diarista que presta serviços (garçom, segurança, DJ, bartender, etc.) através da plataforma.</>,
            <><strong>Evento</strong> — solicitação criada pelo Contratante, com uma ou mais Vagas para funções específicas.</>,
            <><strong>Vaga</strong> — posição aberta dentro de um Evento para uma função (ex.: 2 garçons, 1 segurança).</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Natureza do serviço">
        <p>
          O EventPro é uma plataforma de intermediação (marketplace) que conecta Contratantes a
          Profissionais autônomos de eventos. <strong>O EventPro não é empregador, preposto ou
          representante legal dos Profissionais</strong>, que atuam de forma autônoma e
          independente, na qualidade de microempreendedores individuais (MEI) ou diaristas,
          conforme cadastro.
        </p>
      </LegalSection>

      <LegalSection title="3. Cadastro e conta">
        <p>
          Para usar a plataforma, é necessário criar uma conta com informações verdadeiras,
          completas e atualizadas. Você é responsável por manter a confidencialidade da sua
          senha e por todas as atividades realizadas na sua conta. O EventPro pode recusar,
          suspender ou encerrar cadastros que contenham informações falsas ou que violem estes
          Termos.
        </p>
      </LegalSection>

      <LegalSection title="4. Obrigações do Contratante">
        <LegalList
          items={[
            'Fornecer informações verdadeiras sobre o evento (local, data, horário, funções necessárias).',
            'Tratar os Profissionais com respeito, sem discriminação de qualquer natureza.',
            'Efetuar o pagamento acordado pelo serviço prestado, quando o módulo de pagamento estiver disponível (ver seção 7).',
            'Avaliar o Profissional de forma honesta após o evento.',
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Obrigações do Profissional">
        <LegalList
          items={[
            'Manter os dados cadastrais e de documentação (MEI ou CPF) atualizados e verídicos.',
            'Comparecer aos eventos aceitos no horário combinado, sinalizando o deslocamento com antecedência pelo app.',
            'Prestar o serviço com qualidade e prezar pela segurança dos envolvidos no evento.',
            'Não subcontratar ou repassar a vaga aceita a terceiros sem autorização da plataforma.',
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Matchmaking e aceite de vagas">
        <p>
          Ao criar um Evento, o Contratante define as Vagas necessárias. A plataforma envia
          convites a Profissionais compatíveis por critérios de proximidade, função e
          disponibilidade. Se um convite não for respondido dentro do prazo, a Vaga pode passar
          a "oferta aberta", visível a todos os Profissionais habilitados para aquela função.
          O EventPro não garante que uma Vaga será preenchida dentro de um prazo específico.
        </p>
      </LegalSection>

      <LegalSection title="7. Pagamentos">
        <p>
          <strong>O módulo de pagamento dentro da plataforma ainda não está em produção.</strong>{' '}
          Até que essa funcionalidade seja lançada, a cobrança do Contratante e o repasse ao
          Profissional não são intermediados pelo EventPro. Estes Termos serão atualizados com
          as regras completas (fluxo do dinheiro, retenção em custódia, prazos de repasse,
          política de cancelamento e reembolso) antes da ativação do módulo de pagamento.
        </p>
      </LegalSection>

      <LegalSection title="8. Cancelamentos e não comparecimento">
        <p>
          Cancelamentos feitos com pouca antecedência e o não comparecimento (no-show) de
          qualquer uma das partes podem impactar a pontuação e a reputação do usuário na
          plataforma, e podem levar à suspensão da conta em casos recorrentes.
        </p>
      </LegalSection>

      <LegalSection title="9. Avaliações">
        <p>
          Após cada Evento, Contratante e Profissional podem avaliar um ao outro. As avaliações
          devem refletir a experiência real e não podem conter conteúdo ofensivo, discriminatório
          ou difamatório. O EventPro pode remover avaliações que violem esta regra.
        </p>
      </LegalSection>

      <LegalSection title="10. Condutas proibidas">
        <LegalList
          items={[
            'Fornecer informações falsas no cadastro ou na criação de eventos.',
            'Usar a plataforma para fins ilícitos, discriminatórios ou que coloquem em risco a segurança de terceiros.',
            'Tentar contornar a plataforma para formalizar acordos por fora após o primeiro contato intermediado pelo EventPro.',
            'Acessar ou tentar acessar dados de outros usuários sem autorização.',
          ]}
        />
      </LegalSection>

      <LegalSection title="11. Propriedade intelectual">
        <p>
          A marca EventPro, o layout, o software e demais elementos da plataforma são de
          propriedade da {COMPANY.legalName} ou de seus licenciantes, sendo vedada a reprodução
          sem autorização prévia.
        </p>
      </LegalSection>

      <LegalSection title="12. Limitação de responsabilidade">
        <p>
          O EventPro atua como intermediador entre Contratantes e Profissionais e não se
          responsabiliza por danos decorrentes da prestação do serviço em si, cabendo a
          responsabilidade direta às partes envolvidas em cada Evento, ressalvados os casos de
          culpa comprovada da plataforma.
        </p>
      </LegalSection>

      <LegalSection title="13. Suspensão e encerramento de conta">
        <p>
          O EventPro pode suspender ou encerrar contas que violem estes Termos, mediante
          notificação, sem prejuízo de outras medidas cabíveis. Você pode encerrar sua conta a
          qualquer momento entrando em contato pelo e-mail {COMPANY.supportEmail}.
        </p>
      </LegalSection>

      <LegalSection title="14. Alterações destes Termos">
        <p>
          Podemos atualizar estes Termos para refletir mudanças no produto ou na legislação
          aplicável. Alterações relevantes serão comunicadas na plataforma antes de entrarem em
          vigor.
        </p>
      </LegalSection>

      <LegalSection title="15. Legislação aplicável e foro">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
          foro [PREENCHER: comarca] para dirimir quaisquer controvérsias, com renúncia a
          qualquer outro, por mais privilegiado que seja.
        </p>
      </LegalSection>

      <LegalSection title="16. Contato">
        <p>
          Dúvidas sobre estes Termos podem ser enviadas para <strong>{COMPANY.supportEmail}</strong>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
