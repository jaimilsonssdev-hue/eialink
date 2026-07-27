import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageBuilder } from "@/components/page-builder/PageBuilder";
import type { PageBlock } from "@/components/page-builder/types";
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
        .select("id")
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
      <div>
        <h1 className="text-3xl font-bold">Editar Página</h1>
        <p className="text-muted-foreground">Organize sua presença digital com blocos.</p>
      </div>
      <PageBuilder
        initial={q.data.blocks}
        onSave={async (blocks) => {
          await db.from("page_blocks").delete().eq("bio_page_id", q.data!.bio.id);
          if (blocks.length)
            await db
              .from("page_blocks")
              .insert(
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
