"use client"

import { RARITY_META, type Rarity } from "@/lib/game-data"
import { Coins, Gem } from "lucide-react"
import { cn } from "@/lib/utils"

export function CurrencyPill({
  coins,
  gems,
  size = "md",
}: {
  coins?: number
  gems?: number
  size?: "sm" | "md"
}) {
  const txt = size === "sm" ? "text-xs" : "text-sm"
  const ic = size === "sm" ? 13 : 15
  return (
    <div className="flex items-center gap-2">
      {coins !== undefined && (
        <span className={cn("flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-mono font-semibold text-gold", txt)}>
          <Coins size={ic} /> {coins.toLocaleString()}
        </span>
      )}
      {gems !== undefined && (
        <span className={cn("flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-mono font-semibold text-gem", txt)}>
          <Gem size={ic} /> {gems.toLocaleString()}
        </span>
      )}
    </div>
  )
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const m = RARITY_META[rarity]
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{ color: m.color, backgroundColor: m.color + "1f", border: `1px solid ${m.color}55` }}
    >
      {m.label}
    </span>
  )
}

export function rarityStyle(rarity: Rarity) {
  const m = RARITY_META[rarity]
  return {
    borderColor: m.color + "66",
    boxShadow: `0 0 0 1px ${m.color}22, 0 0 18px ${m.glow}`,
  }
}

export function PanelHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string
  subtitle?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {Icon && (
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary box-glow">
          <Icon size={20} />
        </div>
      )}
      <div>
        <h2 className="text-pretty text-xl font-bold tracking-tight text-glow text-foreground sm:text-2xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

export function Cost({ coins, gems }: { coins?: number; gems?: number }) {
  if (!coins && !gems) return <span className="text-xs font-semibold text-primary">FREE</span>
  return (
    <span className="flex items-center gap-2 font-mono text-xs font-semibold">
      {coins ? (
        <span className="flex items-center gap-1 text-gold">
          <Coins size={12} /> {coins.toLocaleString()}
        </span>
      ) : null}
      {gems ? (
        <span className="flex items-center gap-1 text-gem">
          <Gem size={12} /> {gems.toLocaleString()}
        </span>
      ) : null}
    </span>
  )
}

export function ProgressBar({
  value,
  max,
  color = "var(--primary)",
  className,
}: {
  value: number
  max: number
  color?: string
  className?: string
}) {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100)
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
    </div>
  )
}
