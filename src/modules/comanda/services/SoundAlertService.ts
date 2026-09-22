/**
 * SoundAlertService
 * Sintetizador nativo de alertas sonoros via Web Audio API.
 * 100% livre de dependências externas, arquivos mp3 remotos ou falhas de rede.
 */

let audioCtx: AudioContext | null = null;
let activeLoopTimer: NodeJS.Timeout | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SoundAlertService = {
  /**
   * Toca o sino clássico "ding-dong" de chamada de garçom
   */
  playWaiterCallChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primeiro tom (Ding - 784 Hz / G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(784, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.7);

    // Segundo tom harmônico (Dong - 659.25 Hz / E5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.9);

    // Vibração suave no celular se suportado
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  },

  /**
   * Toca o alerta sonoro para a Cozinha (novo pedido para preparo)
   */
  playKitchenNewOrderChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.12;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.4, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.45);
    });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([300, 150, 300]);
    }
  },

  /**
   * Toca o alerta de "Pedido Pronto" para o garçom levar à mesa
   */
  playOrderReadyChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [880, 1174.66]; // A5, D6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + idx * 0.14;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.55);
    });

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([150, 80, 150, 80, 300]);
    }
  },

  /**
   * Inicia repetição do alerta a cada X segundos até ser silenciado
   */
  startLoopingAlert(type: "call" | "kitchen" | "ready", intervalSeconds = 5) {
    this.stopLoopingAlert();
    const play = () => {
      if (type === "call") this.playWaiterCallChime();
      else if (type === "kitchen") this.playKitchenNewOrderChime();
      else if (type === "ready") this.playOrderReadyChime();
    };

    play();
    activeLoopTimer = setInterval(play, intervalSeconds * 1000);
  },

  /**
   * Para qualquer som contínuo imediatamente
   */
  stopLoopingAlert() {
    if (activeLoopTimer) {
      clearInterval(activeLoopTimer);
      activeLoopTimer = null;
    }
  },
};

