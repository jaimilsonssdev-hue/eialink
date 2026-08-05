import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Termos de Serviço — EIA Link" },
    { name: "description", content: "Condições de uso da plataforma EIA Link: planos, responsabilidades, conteúdo e cancelamento." },
    { property: "og:title", content: "Termos de Serviço — EIA Link" },
    { property: "og:description", content: "Condições de uso da plataforma EIA Link: planos, responsabilidades, conteúdo e cancelamento." },
    { property: "og:type", content: "article" },
    { property: "og:url", content: "https://eialink.com.br/terms" },
  ], links: [{ rel: "canonical", href: "https://eialink.com.br/terms" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Termos de Serviço" updatedAt="31 de julho de 2026">
      <LegalSection title="1. Aceitação">
        <p>
          Ao criar uma conta ou utilizar a EIA Link, você concorda com estes termos e com a Política
          de Privacidade. Se utilizar a plataforma em nome de uma empresa, declara possuir
          autorização para fazê-lo.
        </p>
      </LegalSection>
      <LegalSection title="2. Conta e conteúdo">
        <p>
          Você é responsável pelas informações inseridas, pelos links publicados e pela proteção das
          credenciais de acesso. Não publique conteúdo ilícito, enganoso, ofensivo, que viole
          direitos de terceiros ou que tente comprometer a segurança da plataforma.
        </p>
      </LegalSection>
      <LegalSection title="3. Planos e disponibilidade">
        <p>
          A EIA Link pode oferecer recursos gratuitos e planos pagos, cada um sujeito aos limites,
          valores e condições apresentados no momento da contratação. Recursos podem evoluir, ser
          atualizados ou descontinuados com aviso razoável quando aplicável.
        </p>
      </LegalSection>
      <LegalSection title="4. Integrações e links externos">
        <p>
          Links, pagamentos, redes sociais e serviços de terceiros são de responsabilidade de seus
          respectivos provedores. A EIA Link não controla o conteúdo ou a disponibilidade de páginas
          externas indicadas pelo usuário.
        </p>
      </LegalSection>
      <LegalSection title="5. Propriedade intelectual">
        <p>
          A plataforma, seus elementos visuais e seu código são protegidos por direitos de
          propriedade intelectual. Você mantém os direitos sobre o conteúdo que enviar e concede a
          licença necessária para hospedá-lo e exibi-lo conforme suas configurações.
        </p>
      </LegalSection>
      <LegalSection title="6. Suspensão e encerramento">
        <p>
          Podemos restringir ou suspender contas em caso de violação destes termos, fraude, risco à
          segurança ou exigência legal. Você pode solicitar o encerramento da conta pelos canais de
          suporte, observadas retenções legais necessárias.
        </p>
      </LegalSection>
      <LegalSection title="7. Limitação de responsabilidade">
        <p>
          Na extensão permitida pela legislação aplicável, a EIA Link não garante resultados
          comerciais, disponibilidade ininterrupta ou conversão de vendas. O usuário é responsável
          pelas ofertas, preços, comunicações e obrigações relacionadas ao próprio negócio.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
