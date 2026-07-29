import { createFileRoute } from "@tanstack/react-router";
import { whatsappLink } from "@/lib/constants";
import { Globe, Search, MessageCircle, Megaphone, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/growth")({
  head: () => ({ meta: [{ title: "Centro de Crescimento — EIA Digital" }, { name: "robots", content: "noindex" }] }),
  component: GrowthPage,
});

const OPPS = [
  { icon: Globe, title: "Você ainda não tem um site profissional", desc: "Um site próprio transmite mais credibilidade e aparece no Google.", cta: "Solicitar criação de site", msg: "Olá, tenho interesse em criar um site. Vim pela plataforma EIA Digital." },
  { icon: Search, title: "Melhore sua presença no Google", desc: "Configure Google Meu Negócio e apareça nas buscas locais.", cta: "Melhorar Google Meu Negócio", msg: "Olá, quero melhorar meu Google Meu Negócio. Vim pela plataforma EIA Digital." },
  { icon: MessageCircle, title: "Automatize seu atendimento no WhatsApp", desc: "Respostas automáticas 24/7 e chatbot com IA.", cta: "Conhecer automação de WhatsApp", msg: "Olá, quero automatizar meu WhatsApp. Vim pela plataforma EIA Digital." },
  { icon: Megaphone, title: "Traga mais clientes com tráfego pago", desc: "Campanhas segmentadas em Instagram, Google e Meta.", cta: "Criar campanhas", msg: "Olá, quero fazer anúncios online. Vim pela plataforma EIA Digital." },
];

function GrowthPage() {
  return (
    <div className="premium-page space-y-5">
      <div className="premium-page-heading">
        <p className="eyebrow">Próximos passos</p>
        <h1>Centro de Crescimento</h1>
        <p>Oportunidades para levar seu negócio para o próximo nível.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {OPPS.map(({ icon: Icon, title, desc, cta, msg }) => (
          <div key={title} className="premium-growth-card flex flex-col">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
                <Icon className="h-5 w-5 text-[color:var(--primary-foreground)]" />
              </div>
              <h3 className="font-semibold">{title}</h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground flex-1">{desc}</p>
            <a href={whatsappLink(msg)} target="_blank" rel="noopener" className="btn-primary mt-4 self-start">
              {cta} <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
