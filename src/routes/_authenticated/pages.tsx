import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FilePlus2, Loader2, Pencil, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { PageService } from "@/modules/page/services/PageService";
import { TemplateService } from "@/modules/templates/services/TemplateService";
import { TemplateThumbnail } from "@/modules/templates/components/TemplateThumbnail";
import { UpgradePrompt } from "@/modules/billing/components/UpgradePrompt";
import { usePlanAccess } from "@/modules/billing/hooks/usePlanAccess";
import { publicPageUrl } from "@/lib/public-page-url";

export const Route = createFileRoute("/_authenticated/pages")({
  component: PagesWorkspace,
  head: () => ({ meta: [{ title: "Meus Biolinks — EIA Link" }] }),
});

function PagesWorkspace() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const access = usePlanAccess();
  const pages = useQuery({
    queryKey: ["owned-bio-pages"],
    queryFn: () => PageService.listOwnedPages(),
  });
  const featuredTemplates = TemplateService.list()
    .filter((item) => item.status === "active" && (item.smart || item.id === "default"))
    .filter((item) => access.data?.features.premium_templates || item.id === "default")
    .slice(0, 3);

  async function createPage(templateId = featuredTemplates[0]?.id ?? TemplateService.get().id) {
    const pageLimit = access.data?.limits.bio_pages ?? 1;
    if (pageLimit !== -1 && (pages.data?.length ?? 0) >= pageLimit) {
      setCreationError(
        "O Eialink Essencial permite uma página. Faça upgrade para criar outros Biolinks.",
      );
      return;
    }
    if (!access.data?.features.premium_templates && templateId !== "default") {
      setCreationError("Este visual é exclusivo do Eialink Pro.");
      return;
    }
    setIsCreating(true);
    setCreationError(null);
    try {
      const page = await PageService.createPage({
        displayName: "Minha nova página",
        templateId,
      });
      await pages.refetch();
      navigate({ to: "/builder", search: { page: page.id } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível criar a página.";
      setCreationError(
        message.includes("bio_pages_user_id_key")
          ? "A base de dados ainda precisa receber a atualização que permite criar mais de um Biolink. A página atual continua segura; aplique a migração pendente no Lovable Cloud antes de tentar novamente."
          : message,
      );
    } finally {
      setIsCreating(false);
    }
  }

  if (pages.isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (pages.isError) {
    return <p role="alert">Não foi possível carregar seus Biolinks. {pages.error.message}</p>;
  }

  return (
    <div className="pages-workspace">
      <header className="pages-workspace-header">
        <div>
          <p className="eyebrow">Seu portfólio digital</p>
          <h1 className="premium-heading">Meus Biolinks</h1>
          <p>Crie uma página para cada negócio, campanha ou presença que você quer divulgar.</p>
        </div>
        <button
          className="premium-cta"
          onClick={() => void createPage()}
          disabled={isCreating || access.isLoading}
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Criar novo Biolink
        </button>
      </header>

      {creationError && (
        <p className="pages-workspace-error" role="alert">
          {creationError}
        </p>
      )}
      {creationError?.includes("upgrade") && <UpgradePrompt compact />}

      <section className="pages-grid" aria-label="Suas páginas">
        <div className="page-library-panel-heading">
          <div>
            <p className="eyebrow">Biblioteca de páginas</p>
            <h2>Suas experiências publicadas</h2>
          </div>
          <span>
            {pages.data?.length ?? 0} {pages.data?.length === 1 ? "página" : "páginas"}
          </span>
        </div>
        <div className="page-library-list">
          {pages.data?.map((page) => (
            <article className="page-library-card" key={page.id}>
              <div
                className="page-library-cover"
                style={page.cover_url ? { backgroundImage: `url(${page.cover_url})` } : undefined}
              >
                <span>{page.published ? "Publicado" : "Rascunho"}</span>
              </div>
              <div className="page-library-profile">
                {page.avatar_url ? (
                  <img src={page.avatar_url} alt="" />
                ) : (
                  <b>{page.display_name.slice(0, 1).toUpperCase()}</b>
                )}
              </div>
              <div className="page-library-body">
                <p className="eyebrow">{TemplateService.get(page.template_id ?? undefined).name}</p>
                <h2>{page.display_name}</h2>
                <p className="line-clamp-2">
                  {page.description || "Personalize esta página para apresentar seu negócio."}
                </p>
                <small className="text-muted-foreground">
                  {access.data?.isPro && access.data.features.custom_domain
                    ? `${page.slug}.eialink.com.br`
                    : `eialink.com.br/p/${page.slug}`}
                </small>
              </div>
              <div className="page-library-actions">
                <Link to="/builder" search={{ page: page.id }} className="btn-primary">
                  <Pencil className="h-4 w-4" /> Editar
                </Link>
                <a
                  href={publicPageUrl(
                    page.slug,
                    Boolean(access.data?.isPro && access.data.features.custom_domain),
                  )}
                  target="_blank"
                  rel="noopener"
                  className="btn-secondary"
                  aria-label={`Abrir ${page.display_name}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
          <button
            type="button"
            className="page-library-create"
            onClick={() => void createPage()}
            disabled={isCreating || access.isLoading}
          >
            <span>
              <FilePlus2 className="h-6 w-6" />
            </span>
            <b>Criar uma nova página</b>
            <small>Escolha um nicho, personalize e publique quando estiver pronto.</small>
          </button>
        </div>
      </section>

      <section className="pages-template-picker" aria-labelledby="choose-template-title">
        <div className="pages-template-picker-header">
          <div>
            <p className="eyebrow">Comece com uma estrutura pronta</p>
            <h2 id="choose-template-title">Escolha um visual para o próximo Biolink</h2>
          </div>
          <p>Você poderá trocar textos, imagens e cores depois.</p>
        </div>
        <div className="pages-template-grid">
          {featuredTemplates.map((template) => (
            <article key={template.id} className="pages-template-card">
              <TemplateThumbnail template={template} />
              <div>
                <p>{template.name}</p>
                <small>{template.description}</small>
                <button
                  className="btn-secondary"
                  disabled={isCreating || access.isLoading}
                  onClick={() => void createPage(template.id)}
                >
                  Usar este visual
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="pages-template-note">
        <Sparkles className="h-5 w-5" />
        <div>
          <b>Modelos feitos para cada negócio</b>
          <p>
            Restaurante, clínica, loja, academia e advocacia ganham estrutura própria. Você continua
            no controle de todo o conteúdo.
          </p>
        </div>
      </section>
    </div>
  );
}
