import { useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invokeGeminiGateway } from "@/modules/ai/gemini-gateway";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type KnowledgeSource = {
  id: string;
  title: string;
  kind: "skill" | "reference";
  content: string;
  tags: string[];
  active: boolean;
  updated_at: string;
};

const emptyDraft = {
  title: "",
  kind: "reference" as const,
  content: "",
  tags: "",
  active: true,
};

export function AiKnowledgeLibraryCard() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invokeGeminiGateway<{ sources: KnowledgeSource[] }>(
        supabase,
        { action: "knowledgeList" },
      );
      setSources(result.sources || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar a biblioteca.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  function resetDraft() {
    setDraft(emptyDraft);
    setEditingId(undefined);
  }

  function editSource(source: KnowledgeSource) {
    setDraft({
      title: source.title,
      kind: source.kind,
      content: source.content,
      tags: source.tags.join(", "),
      active: source.active,
    });
    setEditingId(source.id);
  }

  async function saveSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await invokeGeminiGateway(supabase, {
        action: "knowledgeSave",
        source: {
          ...(editingId ? { id: editingId } : {}),
          title: draft.title,
          kind: draft.kind,
          content: draft.content,
          tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          active: draft.active,
        },
      });
      toast.success(editingId ? "Material atualizado." : "Material adicionado à biblioteca.");
      resetDraft();
      await loadSources();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o material.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSource(id: string) {
    if (!window.confirm("Excluir este material da biblioteca da IA?")) return;
    try {
      await invokeGeminiGateway(supabase, { action: "knowledgeDelete", id });
      setSources((current) => current.filter((source) => source.id !== id));
      if (editingId === id) resetDraft();
      toast.success("Material removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o material.");
    }
  }

  return (
    <Card className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-xs">
      <CardHeader className="border-b border-border/60 bg-primary/[0.03] p-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base">Biblioteca de skills e referências da IA</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Gerenciada somente pelo Super Admin. Skills acompanham as solicitações; referências são
              selecionadas conforme o pedido.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <form onSubmit={saveSource} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              required
              maxLength={160}
              placeholder="Título do material"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={draft.kind}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  kind: event.target.value as KnowledgeSource["kind"],
                }))
              }
            >
              <option value="skill">Skill / instrução permanente</option>
              <option value="reference">Referência consultável</option>
            </select>
          </div>
          <Input
            placeholder="Palavras-chave separadas por vírgula"
            value={draft.tags}
            onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
          />
          <Textarea
            required
            maxLength={50000}
            rows={9}
            placeholder="Cole aqui o conteúdo da skill, regra de criação ou referência. Não inclua segredos."
            value={draft.content}
            onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))}
            />
            Disponível para o agente
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingId ? "Salvar material" : "Adicionar material"}
            </Button>
            {editingId && (
              <Button type="button" size="sm" variant="outline" onClick={resetDraft}>
                <X className="mr-2 h-4 w-4" />
                Cancelar edição
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Materiais cadastrados</p>
            <Button type="button" size="sm" variant="ghost" onClick={() => void loadSources()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="sr-only">Atualizar lista</span>
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando biblioteca...</p>
          ) : sources.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nenhuma skill ou referência foi cadastrada ainda.
            </p>
          ) : (
            <ul className="max-h-[30rem] space-y-2 overflow-y-auto">
              {sources.map((source) => (
                <li key={source.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{source.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {source.kind === "skill" ? "Skill" : "Referência"} ·{" "}
                        {source.active ? "Ativa" : "Desativada"}
                        {source.tags.length ? ` · ${source.tags.join(", ")}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" size="icon" variant="ghost" onClick={() => editSource(source)} aria-label={`Editar ${source.title}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => void deleteSource(source.id)} aria-label={`Excluir ${source.title}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
