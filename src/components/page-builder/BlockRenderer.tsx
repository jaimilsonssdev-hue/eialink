import { memo } from "react";
import type { PageBlock } from "./types";
export const BlockRenderer = memo(function BlockRenderer({ block }: { block: PageBlock }) {
  const d = block.data as Record<string, string>;
  if (!block.enabled) return null;
  if (block.type === "banner")
    return (
      <section className="rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-6 text-white">
        <h2 className="text-xl font-bold">{d.title || "Banner"}</h2>
        <p>{d.subtitle}</p>
      </section>
    );
  if (block.type === "about")
    return (
      <section className="text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-slate-300" />
        <h2 className="mt-2 font-bold">{d.name || "Seu negócio"}</h2>
        <p className="text-sm text-slate-500">{d.description}</p>
      </section>
    );
  if (block.type === "whatsapp")
    return (
      <a className="block rounded-xl bg-green-500 p-3 text-center font-semibold text-white">
        Falar no WhatsApp
      </a>
    );
  if (block.type === "pix")
    return (
      <section className="rounded-xl border p-3">
        <b>{d.title || "Pague com Pix"}</b>
        <p className="text-xs text-slate-500">{d.key || "Chave Pix"}</p>
      </section>
    );
  if (block.type === "contact")
    return (
      <section className="rounded-xl border p-3 text-sm">
        {d.phone && <p>{d.phone}</p>}
        {d.email && <p>{d.email}</p>}
        {d.address && <p>{d.address}</p>}
      </section>
    );
  if (block.type === "social")
    return (
      <section className="text-center text-sm text-violet-600">
        Instagram · Facebook · TikTok · LinkedIn · YouTube · Site
      </section>
    );
  if (block.type === "divider") return <hr className="border-slate-200" />;
  if (block.type === "spacer") return <div className="h-8" />;
  return <button className="w-full rounded-xl border p-3 font-medium">Adicionar botão</button>;
});
