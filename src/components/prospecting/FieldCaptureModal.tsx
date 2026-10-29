import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  Sparkles,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Loader2,
  RefreshCw,
  Search,
  Star,
  Zap,
  Building,
  Phone,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  analyzeFieldPhotoFn,
  createFieldProspectFn,
  type FieldPhotoAnalysisResult,
} from "@/modules/prospecting/fieldCapture.functions";
import { fetchPlaceDetailsFn } from "@/modules/prospecting/places.functions";
import { normalizeBusinessQuery } from "@/modules/prospecting/normalizeBusinessLink";
import type { ProspectedCompany } from "@/modules/prospecting/types";

export interface FieldCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateSite: (
    company: ProspectedCompany,
    customPhotoUrl?: string,
  ) => Promise<{ pageId: string; slug: string; url: string }>;
  onSuccessCreated?: () => void;
}

export function FieldCaptureModal({
  isOpen,
  onClose,
  onGenerateSite,
  onSuccessCreated,
}: FieldCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "maps">("camera");

  // Estados Modo Câmera / Foto
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string>("image/jpeg");
  const [quickHint, setQuickHint] = useState("");
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FieldPhotoAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados Modo Google Maps
  const [mapsQuery, setMapsQuery] = useState("");
  const [isSearchingMaps, setIsSearchingMaps] = useState(false);
  const [mapsResult, setMapsResult] = useState<{
    name: string;
    city: string | null;
    address: string;
    rating: number;
    reviewsCount: number;
    phone: string;
    photos: string[];
  } | null>(null);

  // Estados de Geração e Sucesso
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generatedResult, setGeneratedResult] = useState<{
    companyName: string;
    url: string;
    slug: string;
    whatsapp?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset ao fechar
  const handleClose = () => {
    if (isGenerating) return;
    setPhotoBase64(null);
    setAnalysisResult(null);
    setQuickHint("");
    setMapsQuery("");
    setMapsResult(null);
    setGeneratedResult(null);
    onClose();
  };

  // Captura foto da câmera ou arquivo
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma foto válida.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPhotoBase64(result);
        setPhotoMime(file.type || "image/jpeg");
        setAnalysisResult(null);
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  // Analisa a foto com Gemini 3.8 Flash
  const handleAnalyzePhoto = async () => {
    if (!photoBase64) return;
    setIsAnalyzingPhoto(true);
    try {
      const res = await analyzeFieldPhotoFn({
        data: {
          photoBase64,
          mimeType: photoMime,
          quickHint: quickHint.trim() || undefined,
        },
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || "Não foi possível analisar a fachada.");
      }

      setAnalysisResult(res.data);
      toast.success("Fachada e letreiro analisados com Gemini 3.8!");
    } catch (err: any) {
      toast.error(err.message || "Erro na análise da foto.");
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Busca dados oficiais no Google Maps
  const handleSearchMaps = async () => {
    const raw = mapsQuery.trim();
    if (!raw) return;

    setIsSearchingMaps(true);
    setMapsResult(null);
    try {
      const norm = normalizeBusinessQuery(raw);
      const queryName = norm.name || norm.query || raw;
      const queryCity = norm.city || undefined;

      const place = await fetchPlaceDetailsFn({
        data: {
          companyName: queryName,
          city: queryCity,
        },
      });

      if (!place || (!place.address && (!place.photos || place.photos.length === 0))) {
        toast.error("Nenhum dado encontrado para esta busca no Google Maps.");
        return;
      }

      setMapsResult({
        name: queryName,
        city: queryCity || null,
        address: place.address || raw,
        rating: place.rating || 4.9,
        reviewsCount: place.reviewsCount || 45,
        phone: place.whatsapp || place.phone || "",
        photos: place.photos || [],
      });
      toast.success(`Perfil oficial encontrado: ${queryName}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar o Google Maps.");
    } finally {
      setIsSearchingMaps(false);
    }
  };

  // Dispara a criação do lead e geração do site completo com IA
  const handleExecuteGeneration = async (sourceType: "photo" | "maps") => {
    setIsGenerating(true);
    try {
      let targetName = "";
      let targetNiche = "";
      let targetCity = "";
      let targetPhone = "";
      let targetAddress = "";
      let targetRating = 4.9;
      let targetReviews = 35;
      let targetPhotoUrl: string | undefined = undefined;

      if (sourceType === "photo" && analysisResult) {
        targetName = analysisResult.name;
        targetNiche = analysisResult.niche;
        targetCity = analysisResult.city || "Brasil";
        targetPhone = analysisResult.phone || "";
        targetPhotoUrl = analysisResult.publicPhotoUrl || undefined;
      } else if (sourceType === "maps" && mapsResult) {
        targetName = mapsResult.name;
        targetCity = mapsResult.city || "Brasil";
        targetPhone = mapsResult.phone;
        targetAddress = mapsResult.address;
        targetRating = mapsResult.rating;
        targetReviews = mapsResult.reviewsCount;
        targetPhotoUrl = mapsResult.photos[0] || undefined;
      } else {
        throw new Error("Dados insuficientes para geração.");
      }

      setGenerationStep("1/3 Registrando empresa no Radar de Prospecção...");
      const prospectRes = await createFieldProspectFn({
        data: {
          name: targetName,
          niche: targetNiche,
          city: targetCity,
          phone: targetPhone,
          whatsapp: targetPhone,
          address: targetAddress,
          photoUrl: targetPhotoUrl,
          rating: targetRating,
          reviewsCount: targetReviews,
          source: sourceType === "photo" ? "captura_foto" : "captura_maps",
        },
      });

      if (!prospectRes.ok || !prospectRes.company) {
        throw new Error(prospectRes.error || "Erro ao cadastrar empresa no radar.");
      }

      const company = prospectRes.company;

      setGenerationStep("2/3 Gemini 3.8 desenhando arquitetura e código exclusivo...");
      const demoRes = await onGenerateSite(company, targetPhotoUrl);

      setGenerationStep("3/3 Concluindo e preparando prévia para apresentação...");
      setGeneratedResult({
        companyName: company.name,
        url: demoRes.url,
        slug: demoRes.slug,
        whatsapp: targetPhone,
      });

      if (onSuccessCreated) {
        onSuccessCreated();
      }
      toast.success(`Site criado com sucesso para ${company.name}!`);
    } catch (err: any) {
      toast.error(err.message || "Falha na geração do site em campo.");
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  const copyUrlToClipboard = () => {
    if (!generatedResult?.url) return;
    navigator.clipboard.writeText(generatedResult.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    toast.success("Link demonstrativo copiado!");
  };

  const openWhatsAppPitch = () => {
    if (!generatedResult) return;
    const phone = (generatedResult.whatsapp || "").replace(/\D/g, "");
    const text = `Olá! Vi o trabalho da ${generatedResult.companyName} e gostei muito da estrutura. Montei uma proposta exclusiva no ar para vocês verem como ficaria um site moderno de alta conversão para o negócio:\n\n👉 ${generatedResult.url}\n\nPodemos conversar 5 minutos para eu te mostrar como isso pode trazer mais clientes?`;
    const targetUrl = phone.length >= 10
      ? `https://wa.me/55${phone.slice(-11)}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(targetUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-card border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Captura Rápida em Campo
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gere um site exclusivo em segundos para apresentar ao cliente na hora.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Tela de Sucesso */}
        {generatedResult ? (
          <div className="py-6 space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-foreground">
                Site Gerado com Sucesso!
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                A proposta visual para <strong className="text-foreground">{generatedResult.companyName}</strong> está no ar e salva no seu Radar.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-2 max-w-md mx-auto text-left">
              <div className="truncate text-xs font-mono text-emerald-400 font-medium">
                {generatedResult.url}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyUrlToClipboard}
                className="h-8 px-2.5 text-xs shrink-0"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto pt-2">
              <Button
                asChild
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer shadow-sm"
              >
                <a href={generatedResult.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Demonstração
                </a>
              </Button>

              <Button
                type="button"
                onClick={openWhatsAppPitch}
                variant="outline"
                className="w-full border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 font-semibold cursor-pointer"
              >
                <MessageCircle className="h-4 w-4 mr-2 text-emerald-400" />
                Enviar no WhatsApp
              </Button>
            </div>

            <div className="pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Voltar para o Radar de Prospecção
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-3">
            {/* Seletor de Modo (Abas) */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/50 border border-border">
              <button
                type="button"
                onClick={() => setActiveTab("camera")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "camera"
                    ? "bg-card text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>Foto da Fachada</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("maps")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "maps"
                    ? "bg-card text-foreground shadow-sm border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MapPin className="h-3.5 w-3.5 text-sky-400" />
                <span>Link do Google Maps</span>
              </button>
            </div>

            {/* ABA 1: FOTO DA FACHADA */}
            {activeTab === "camera" && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {!photoBase64 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-muted/20 space-y-3"
                  >
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                      <Camera className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Tirar Foto com a Câmera ou Selecionar
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                        Aponte para o letreiro, fachada ou banner da empresa. A IA lê os dados automaticamente.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-border max-h-56 bg-black flex items-center justify-center">
                      <img
                        src={photoBase64}
                        alt="Foto da Fachada"
                        className="w-full h-full object-cover max-h-56"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 text-xs bg-black/70 hover:bg-black/90 text-white backdrop-blur-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1.5" /> Trocar Foto
                      </Button>
                    </div>

                    {!analysisResult && (
                      <div className="space-y-3">
                        <Input
                          placeholder="Dica rápida opcional (ex: Barbearia retrô, cortes e barba)"
                          value={quickHint}
                          onChange={(e) => setQuickHint(e.target.value)}
                          className="text-xs"
                        />
                        <Button
                          type="button"
                          disabled={isAnalyzingPhoto}
                          onClick={handleAnalyzePhoto}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                        >
                          {isAnalyzingPhoto ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Gemini 3.8 analisando letreiro e cores...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2 text-amber-300" />
                              Analisar Fachada com IA
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Resultado da Análise da Foto */}
                {analysisResult && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-emerald-500/30 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Identificado pela IA:
                      </span>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-300">
                        {analysisResult.niche}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">Nome Comercial</label>
                        <Input
                          value={analysisResult.name}
                          onChange={(e) => setAnalysisResult({ ...analysisResult, name: e.target.value })}
                          className="h-8 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">Nicho / Categoria</label>
                        <Input
                          value={analysisResult.niche}
                          onChange={(e) => setAnalysisResult({ ...analysisResult, niche: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">WhatsApp / Telefone</label>
                        <Input
                          placeholder="DDD + Número"
                          value={analysisResult.phone || ""}
                          onChange={(e) => setAnalysisResult({ ...analysisResult, phone: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">Cores Identificadas</label>
                        <div className="h-8 px-3 rounded-md bg-muted/60 border border-border text-xs flex items-center text-foreground font-medium truncate">
                          {analysisResult.primaryColors}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleExecuteGeneration("photo")}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md shadow-emerald-950/20"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {generationStep || "Construindo site instantâneo..."}
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2 text-amber-300" />
                          Gerar Site Instantâneo com a Fachada Real
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ABA 2: GOOGLE MAPS */}
            {activeTab === "maps" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cole o link (maps.app.goo.gl/...) ou Nome + Cidade"
                    value={mapsQuery}
                    onChange={(e) => setMapsQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchMaps()}
                    className="text-xs h-10"
                  />
                  <Button
                    type="button"
                    disabled={isSearchingMaps || !mapsQuery.trim()}
                    onClick={handleSearchMaps}
                    className="h-10 px-4 bg-sky-600 hover:bg-sky-500 text-white shrink-0 cursor-pointer font-semibold"
                  >
                    {isSearchingMaps ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-1.5" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>

                {/* Card de Prévia do Google Maps */}
                {mapsResult && (
                  <div className="p-4 rounded-xl bg-muted/40 border border-sky-500/30 space-y-3 animate-in fade-in duration-300">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <Building className="h-4 w-4 text-sky-400" />
                          {mapsResult.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {mapsResult.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold shrink-0">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {mapsResult.rating}
                        <span className="text-[10px] text-muted-foreground font-normal">({mapsResult.reviewsCount})</span>
                      </div>
                    </div>

                    {mapsResult.phone && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-emerald-400" />
                        WhatsApp: <span className="text-foreground font-medium">{mapsResult.phone}</span>
                      </div>
                    )}

                    {/* Miniaturas das fotos reais do Google */}
                    {mapsResult.photos.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="h-3 w-3 text-sky-400" /> Fotos Reais do Google Meu Negócio:
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {mapsResult.photos.slice(0, 4).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Foto ${i + 1}`}
                              className="h-16 w-full object-cover rounded-lg border border-border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleExecuteGeneration("maps")}
                      className="w-full mt-2 bg-sky-600 hover:bg-sky-500 text-white font-bold cursor-pointer shadow-md shadow-sky-950/20"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {generationStep || "Gerando site com dados do Google..."}
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2 text-amber-300" />
                          Criar Site com Dados e Fotos Reais do Google
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
