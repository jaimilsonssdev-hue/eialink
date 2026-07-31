import { Link } from "@tanstack/react-router";
import { Link2 } from "lucide-react";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#07060b] px-5 py-8 text-[#f8f5ff] md:py-14">
      <article className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#0d0a12] p-6 shadow-[0_20px_80px_rgba(0,0,0,.3)] md:p-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/20">
            <Link2 className="h-4 w-4" />
          </span>
          EIA LINK
        </Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[.18em] text-fuchsia-300">
          Informações legais
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-[#bcb2c8]">Última atualização: {updatedAt}</p>
        <div className="legal-content mt-9 space-y-7 text-sm leading-7 text-[#d8d0e1]">
          {children}
        </div>
        <section className="mt-9 rounded-2xl border border-violet-300/20 bg-violet-500/[.06] p-5 text-sm leading-6 text-[#d8d0e1]">
          <h2 className="font-display text-lg font-semibold text-white">
            Responsável pela plataforma
          </h2>
          <p className="mt-2">
            <strong>Jaimilson Santos Silva</strong>, representante da Talento Marketing Digital
            <br />
            CPF: 048.299.655-25
            <br />
            Rua Dr. José André da Cruz, 437, Vila Vargas
            <br />
            Teixeira de Freitas — Bahia, Brasil — CEP 45993-042
          </p>
        </section>
        <p className="mt-10 border-t border-white/10 pt-5 text-xs leading-5 text-[#a99fb5]">
          Este texto é uma base operacional para a plataforma. Antes de iniciar cobrança ou operação
          comercial, revise-o com assessoria jurídica e complete os dados da empresa e do canal de
          atendimento.
        </p>
      </article>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
