import React, { useState, useEffect } from "react";
import {
  Settings2,
  Coins,
  Gift,
  Star,
  Plus,
  Trash2,
  Check,
  Sparkles,
  ShieldCheck,
  Clock,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LoyaltyService,
  type LoyaltyProgramSettings,
  type LoyaltyReward,
  type LoyaltyMission,
} from "@/modules/loyalty";

export interface LoyaltySettingsModalProps {
  bioPageId: string;
  settings: LoyaltyProgramSettings | null;
  onSaved?: (updated: LoyaltyProgramSettings) => void;
  triggerButton?: React.ReactNode;
}

export function LoyaltySettingsModal({
  bioPageId,
  settings,
  onSaved,
  triggerButton,
}: LoyaltySettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados Locais de Edição
  const [pointsRatio, setPointsRatio] = useState(settings?.pointsRatio ?? 1);
  const [expirationDays, setExpirationDays] = useState(settings?.pointsExpirationDays ?? 180);
  const [rewards, setRewards] = useState<LoyaltyReward[]>(settings?.rewards ?? []);
  const [missions, setMissions] = useState<LoyaltyMission[]>(settings?.missions ?? []);

  // Novo prêmio no formulário
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDesc, setNewRewardDesc] = useState("");
  const [newRewardPoints, setNewRewardPoints] = useState("");

  // Sincroniza se settings mudar
  useEffect(() => {
    if (settings) {
      setPointsRatio(settings.pointsRatio);
      setExpirationDays(settings.pointsExpirationDays);
      setRewards(settings.rewards);
      setMissions(settings.missions);
    }
  }, [settings]);

  // Adicionar novo prêmio
  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newRewardTitle.trim();
    const cost = parseInt(newRewardPoints, 10);

    if (!title || isNaN(cost) || cost <= 0) {
      toast.error("Informe o nome do prêmio e a quantidade de pontos (maior que zero).");
      return;
    }

    const newRew: LoyaltyReward = {
      id: `rew-${Date.now()}`,
      title,
      description: newRewardDesc.trim() || "Resgate válido para apresentação no balcão.",
      pointsCost: cost,
      badge: cost <= 100 ? "Fácil" : cost <= 250 ? "Especial" : "VIP",
    };

    setRewards((prev) => [...prev, newRew]);
    setNewRewardTitle("");
    setNewRewardDesc("");
    setNewRewardPoints("");
    toast.success(`Prêmio "${title}" adicionado!`);
  };

  // Remover prêmio
  const handleRemoveReward = (rewardId: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== rewardId));
  };

  // Atualizar pontos de uma missão existente
  const handleUpdateMissionPoints = (missionId: string, newPoints: number) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, pointsReward: newPoints } : m))
    );
  };

  // Salvar tudo
  const handleSave = async () => {
    if (!bioPageId) return;
    setSaving(true);
    try {
      const updated = await LoyaltyService.saveProgramSettings(bioPageId, {
        pointsRatio: Number(pointsRatio),
        pointsExpirationDays: Number(expirationDays),
        rewards,
        missions,
      });

      toast.success("Regras do Clube de Fidelidade salvas com sucesso!");
      onSaved?.(updated);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  // Exemplo dinâmico: Quanto R$ 50 dá em pontos
  const sampleSpend = 50;
  const samplePointsEarned = Math.round(sampleSpend * pointsRatio);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs gap-1.5 cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5 text-amber-400" />
            <span>Configurar Regras & Prêmios</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-xl border-zinc-800 bg-zinc-950 text-zinc-100 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Settings2 className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-zinc-100">
                Regras do Clube de Pontos & Prêmios
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Defina o valor de cada ponto, o prazo de validade e seu catálogo de recompensas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 pt-3">
          <Tabs defaultValue="ratio" className="w-full">
            <TabsList className="grid grid-cols-3 bg-zinc-900 border border-zinc-800 mb-4 h-9">
              <TabsTrigger value="ratio" className="text-xs gap-1">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                Valor do Ponto
              </TabsTrigger>
              <TabsTrigger value="rewards" className="text-xs gap-1">
                <Gift className="h-3.5 w-3.5 text-pink-400" />
                Catálogo de Prêmios ({rewards.length})
              </TabsTrigger>
              <TabsTrigger value="missions" className="text-xs gap-1">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                Missões ({missions.length})
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: VALOR DO PONTO & VALIDADE */}
            <TabsContent value="ratio" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-300">
                  Taxa de Conversão (Quantos pontos por R$ gasto?):
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "R$ 1,00 = 1 Ponto", value: 1, desc: "Padrão recomendado" },
                    { label: "R$ 2,00 = 1 Ponto", value: 0.5, desc: "Tíquete médio" },
                    { label: "R$ 5,00 = 1 Ponto", value: 0.2, desc: "Tíquete alto" },
                    { label: "R$ 1,00 = 2 Pontos", value: 2, desc: "Pontos em dobro" },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setPointsRatio(preset.value)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        pointsRatio === preset.value
                          ? "bg-amber-500/15 border-amber-500/50 text-amber-200"
                          : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{preset.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SIMULADOR VISUAL DE PONTOS */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Simulação para o cliente:</span>
                  <span className="font-semibold text-zinc-200">
                    Ao gastar R$ {sampleSpend.toFixed(2).replace(".", ",")} no balcão:
                  </span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold text-xs px-2.5 py-1">
                  +{samplePointsEarned} Pontos VIP
                </Badge>
              </div>

              {/* VALIDADE DOS PONTOS */}
              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <Label className="text-xs font-semibold text-zinc-300">
                  Prazo de Validade dos Pontos:
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "90 dias (3 meses)", value: 90 },
                    { label: "180 dias (6 meses)", value: 180 },
                    { label: "365 dias (1 ano)", value: 365 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExpirationDays(opt.value)}
                      className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                        expirationDays === opt.value
                          ? "bg-amber-500/15 border-amber-500/50 text-amber-200"
                          : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Após esse período, pontos não resgatados expiram automaticamente para proteger seu caixa.
                </p>
              </div>
            </TabsContent>

            {/* ABA 2: CATÁLOGO DE PRÊMIOS */}
            <TabsContent value="rewards" className="space-y-4 mt-0">
              {/* LISTA DE PRÊMIOS ATUAIS */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {rewards.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">
                    Nenhum prêmio cadastrado. Adicione seu primeiro prêmio abaixo!
                  </p>
                ) : (
                  rewards.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-100 truncate">{r.title}</span>
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[10px] px-1.5 py-0">
                            {r.pointsCost} pts
                          </Badge>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{r.description}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveReward(r.id)}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        title="Remover Prêmio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* FORMULÁRIO DE ADICIONAR NOVO PRÊMIO */}
              <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2.5">
                <span className="text-xs font-bold text-zinc-200 block">
                  + Adicionar Nova Recompensa
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <Input
                      type="text"
                      placeholder="Nome do prêmio (ex: Batata Frita, Café Expresso)"
                      value={newRewardTitle}
                      onChange={(e) => setNewRewardTitle(e.target.value)}
                      className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-100"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Pontos (ex: 80)"
                      value={newRewardPoints}
                      onChange={(e) => setNewRewardPoints(e.target.value)}
                      className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-100 font-mono"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Descrição / Regra (ex: Válido para consumo no local)"
                    value={newRewardDesc}
                    onChange={(e) => setNewRewardDesc(e.target.value)}
                    className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-100 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddReward}
                    className="h-8 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ABA 3: MISSÕES & BÔNUS */}
            <TabsContent value="missions" className="space-y-3 mt-0">
              <p className="text-xs text-zinc-400">
                Defina quantos pontos bônus o cliente ganha ao realizar ações sem necessariamente gastar:
              </p>
              <div className="space-y-2.5">
                {missions.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-zinc-100 block">{m.title}</span>
                      <span className="text-[11px] text-zinc-400">{m.description}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        value={m.pointsReward}
                        onChange={(e) =>
                          handleUpdateMissionPoints(m.id, parseInt(e.target.value, 10) || 0)
                        }
                        className="h-8 w-18 text-xs bg-zinc-900 border-zinc-700 text-amber-400 font-bold font-mono text-center"
                      />
                      <span className="text-xs text-zinc-500 font-semibold">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* BOTÃO DE SALVAR */}
          <div className="pt-4 border-t border-zinc-900 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs border-zinc-800 text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs gap-1.5 px-4 shadow-md"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
