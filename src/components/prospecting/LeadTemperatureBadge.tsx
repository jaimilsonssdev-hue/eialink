interface LeadTemperatureBadgeProps {
  score: number
  showScore?: boolean
  className?: string
}

export function LeadTemperatureBadge({ score, showScore = true, className = '' }: LeadTemperatureBadgeProps) {
  if (score >= 80) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_-3px_rgba(16,185,129,0.35)] whitespace-nowrap ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Quente</span>
        <span className="text-xs">🔥</span>
        {showScore && <span className="font-mono text-[10px] opacity-80 tabular-nums">({score})</span>}
      </span>
    )
  }
  if (score >= 40) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_-3px_rgba(245,158,11,0.25)] whitespace-nowrap ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        <span>Morno</span>
        <span className="text-xs">⚡</span>
        {showScore && <span className="font-mono text-[10px] opacity-80 tabular-nums">({score})</span>}
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 whitespace-nowrap ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-blue-400/60" />
      <span>Frio</span>
      <span className="text-xs">❄️</span>
      {showScore && <span className="font-mono text-[10px] opacity-80 tabular-nums">({score})</span>}
    </span>
  )
}

