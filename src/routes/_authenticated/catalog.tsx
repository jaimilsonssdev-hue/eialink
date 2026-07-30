import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PackagePlus, Save, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { CatalogEditor } from "@/modules/products/components/CatalogEditor";
import { ProductService } from "@/modules/products/services/ProductService";
import type { CatalogItem } from "@/modules/products/types";
import { PageService } from "@/modules/page/services/PageService";

export const Route = createFileRoute("/_authenticated/catalog")({
  component: CatalogPage,
  head: () => ({ meta: [{ title: "Catálogo — EIA Link" }] }),
});

function CatalogPage() {
  const [selectedPageId, setSelectedPageId] = useState<string>();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [savedItems, setSavedItems] = useState<CatalogItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const pages = useQuery({ queryKey: ["owned-bio-pages"], queryFn: () => PageService.listOwnedPages() });

  useEffect(() => {
    if (!selectedPageId && pages.data?.[0]) setSelectedPageId(pages.data[0].id);
  }, [pages.data, selectedPageId]);

  const products = useQuery({
    queryKey: ["catalog-workspace", selectedPageId],
    enabled: Boolean(selectedPageId),
    queryFn: () => ProductService.list(selectedPageId!),
  });

  useEffect(() => {
    if (!products.data) return;
    setItems(products.data);
    setSavedItems(products.data);
  }, [products.data]);

  async function saveCatalog() {
    if (!selectedPageId) return;
    setSaving(true);
    setMessage(undefined);
    try {
      const saved = await ProductService.sync(selectedPageId, items);
      setItems(saved);
      setSavedItems(saved);
      setMessage("Catálogo salvo. Sua página pública já está atualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o catálogo.");
    } finally {
      setSaving(false);
    }
  }

  if (pages.isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (pages.isError) return <p role="alert">Não foi possível carregar seus Biolinks.</p>;
  if (!pages.data?.length) {
    return <div className="premium-page"><div className="premium-panel text-center py-14"><ShoppingBag className="mx-auto h-8 w-8 text-[color:var(--primary)]" /><h1 className="mt-4 text-xl font-semibold">Crie seu primeiro Biolink</h1><p className="mt-2 text-sm text-muted-foreground">Seu catálogo pertence a uma página.</p><Link className="btn-primary mt-5" to="/pages"><PackagePlus className="h-4 w-4" /> Criar Biolink</Link></div></div>;
  }

  const changed = JSON.stringify(items) !== JSON.stringify(savedItems);
  return (
    <div className="premium-page catalog-premium-page">
      <header className="catalog-workspace-header">
        <div className="premium-page-heading"><p className="eyebrow">Produtos e serviços</p><h1>Catálogo</h1><p>Organize o que você oferece e leve seus clientes direto para a próxima ação.</p></div>
        <div className="catalog-workspace-actions">
          <label><span>Biolink ativo</span><select className="input-base" value={selectedPageId} onChange={(event) => setSelectedPageId(event.target.value)}>{pages.data.map((page) => <option key={page.id} value={page.id}>{page.display_name}</option>)}</select></label>
          <button className="btn-primary" onClick={() => void saveCatalog()} disabled={saving || !changed}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Salvando" : changed ? "Salvar alterações" : "Tudo salvo"}</button>
        </div>
      </header>
      <div className="catalog-workspace-intro"><ShoppingBag className="h-5 w-5" /><p><b>Dica rápida:</b> use uma imagem quadrada, um título direto e uma ação clara. As mudanças aparecem no seu Biolink após salvar.</p></div>
      <div className="catalog-workspace-grid">
        <section className="premium-panel">
          {products.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CatalogEditor items={items} onChange={setItems} />}
        </section>
        <aside className="catalog-workspace-tip"><ShoppingBag className="h-5 w-5" /><b>Catálogo desta página</b><p>Imagens, ordem e visibilidade ficam vinculadas somente a este Biolink.</p><Link to="/builder" search={{ page: selectedPageId }} className="btn-secondary">Personalizar página</Link></aside>
      </div>
      {message && <p className="catalog-workspace-message" role="status">{message}</p>}
    </div>
  );
}
