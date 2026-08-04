import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({ meta: [
    { title: "Política de Reembolso — EIA Link" },
    { name: "description", content: "Regras de reembolso e cancelamento das assinaturas da EIA Link, com prazos e como solicitar." },
    { property: "og:title", content: "Política de Reembolso — EIA Link" },
    { property: "og:description", content: "Regras de reembolso e cancelamento das assinaturas da EIA Link, com prazos e como solicitar." },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <LegalPage title="Política de Reembolso" updatedAt="31 de julho de 2026">
      <LegalSection title="1. Plano gratuito">
        <p>O plano gratuito não gera cobrança e, portanto, não possui reembolso.</p>
      </LegalSection>
      <LegalSection title="2. Assinaturas pagas">
        <p>
          Quando planos pagos estiverem disponíveis, os valores, período de renovação e recursos
          incluídos serão informados antes da confirmação da compra. A solicitação de cancelamento
          interromperá futuras cobranças conforme as regras do plano e do meio de pagamento.
        </p>
      </LegalSection>
      <LegalSection title="3. Direito de arrependimento">
        <p>
          Para contratações realizadas fora de estabelecimento comercial, consumidores poderão
          exercer o direito de arrependimento no prazo legal aplicável, contado da contratação,
          salvo hipóteses legalmente excepcionadas. A análise será realizada caso a caso pelo
          suporte.
        </p>
      </LegalSection>
      <LegalSection title="4. Como solicitar">
        <p>
          Envie a solicitação pelo canal de suporte associado à sua conta, com e-mail de cadastro,
          identificação da cobrança e motivo do pedido. Poderemos solicitar informações adicionais
          para confirmar a titularidade e prevenir fraude.
        </p>
      </LegalSection>
      <LegalSection title="5. Prazo e forma">
        <p>
          Quando aprovado, o reembolso será processado pelo mesmo meio de pagamento, observados os
          prazos operacionais do provedor financeiro. Taxas cobradas diretamente por instituições
          financeiras podem seguir regras próprias.
        </p>
      </LegalSection>
      <LegalSection title="6. Serviços profissionais">
        <p>
          Serviços personalizados, como criação de sites, design, tráfego ou automação, possuem
          escopo e condições próprios apresentados antes da contratação. Reembolsos desses serviços
          seguem a proposta ou contrato específico.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
