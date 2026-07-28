import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageBuilder } from "@/components/page-builder/PageBuilder";
import type { PageBlock } from "@/components/page-builder/types";
// The generated Supabase types predate page_blocks; keep the compatibility adapter local.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as never as { from: (table: "page_blocks") => any };
export const Route = createFileRoute("/_authenticated/builder")({
  component: BuilderPage,
  head: () => ({ meta: [{ title: "Editor visual — EIA Digital" }] }),
});
function BuilderPage() {
  const q = useQuery({
    queryKey: ["page-builder"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data: bio } = await supabase
        .from("bio_pages")
        .select("id, slug")
        .eq("user_id", u.user!.id)
        .maybeSingle();
      if (!bio) return null;
      const { data } = await db
        .from("page_blocks")
        .select("*")
        .eq("bio_page_id", bio.id)
        .order("position");
      return { bio, blocks: (data ?? []) as PageBlock[] };
    },
  });
  if (q.isLoading) return <Loader2 className="animate-spin" />;
  if (!q.data) return <p>Crie sua Bio antes de editar a página.</p>;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[color:var(--primary)]">
            Minha Página
          </p>
          <h1 className="mt-1 text-3xl font-bold">Sua página, do seu jeito.</h1>
          <p className="mt-2 text-muted-foreground">
            Personalize como sua página aparece para seus clientes.
          </p>
        </div>
        <a
          href={`/p/${q.data.bio.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Ver página
        </a>
      </div>
      <PageBuilder
        initial={q.data.blocks}
        onSave={async (blocks) => {
          await db.from("page_blocks").delete().eq("bio_page_id", q.data!.bio.id);
          if (blocks.length)
            await db.from("page_blocks").insert(
              blocks.map((b, i) => ({
                id: b.id,
                bio_page_id: q.data!.bio.id,
                type: b.type,
                enabled: b.enabled,
                position: i,
                data: b.data,
              })),
            );
        }}
      />
    </div>
  );
}
