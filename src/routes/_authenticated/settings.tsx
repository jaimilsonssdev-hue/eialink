import { createFileRoute } from "@tanstack/react-router";
import { CompanyBasicSettings } from "@/components/dashboard/CompanyBasicSettings";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Dados da Empresa — EIA Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dados da Empresa & Contato
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Atualize os textos, logotipo, foto de capa, horários e WhatsApp de atendimento da sua empresa de forma rápida.
        </p>
      </div>

      <CompanyBasicSettings />
    </div>
  );
}
