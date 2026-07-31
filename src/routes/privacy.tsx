import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Política de Privacidade — EIA Link" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidade" updatedAt="31 de julho de 2026">
      <LegalSection title="1. Visão geral">
        <p>
          A EIA Link fornece ferramentas para criação e publicação de páginas digitais. Esta
          política explica como tratamos dados pessoais relacionados à conta, ao uso da plataforma e
          às páginas públicas criadas por nossos usuários.
        </p>
      </LegalSection>
      <LegalSection title="2. Dados tratados">
        <p>
          Podemos tratar dados de cadastro, contato, informações do perfil, conteúdo publicado pelo
          usuário, registros de acesso, dados técnicos de navegação e informações necessárias para
          suporte, segurança e cobrança.
        </p>
      </LegalSection>
      <LegalSection title="3. Finalidades">
        <p>
          Usamos esses dados para fornecer a plataforma, autenticar contas, publicar páginas,
          prevenir abuso, responder a solicitações, melhorar o serviço e cumprir obrigações legais.
          O conteúdo inserido em uma página pública é exibido conforme a configuração escolhida pelo
          titular da conta.
        </p>
      </LegalSection>
      <LegalSection title="4. Compartilhamento e fornecedores">
        <p>
          Podemos utilizar provedores de infraestrutura, autenticação, hospedagem, armazenamento,
          métricas e pagamentos. O compartilhamento ocorre somente quando necessário para operar o
          serviço, cumprir obrigação legal ou proteger direitos e segurança.
        </p>
      </LegalSection>
      <LegalSection title="5. Seus direitos">
        <p>
          Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção,
          anonimização, bloqueio, eliminação quando aplicável, portabilidade e informações sobre
          compartilhamento. Para exercer seus direitos, utilize o canal de suporte informado na
          plataforma.
        </p>
      </LegalSection>
      <LegalSection title="6. Segurança e retenção">
        <p>
          Adotamos medidas técnicas e organizacionais proporcionais ao serviço. Conservamos dados
          pelo período necessário às finalidades descritas, obrigações legais, solução de disputas e
          segurança. Nenhum sistema é totalmente imune a riscos; mantenha suas credenciais
          protegidas.
        </p>
      </LegalSection>
      <LegalSection title="7. Alterações">
        <p>
          Esta política poderá ser atualizada para refletir mudanças no serviço ou na legislação. A
          versão vigente ficará disponível nesta página.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
