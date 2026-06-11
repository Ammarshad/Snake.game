"use client"

import { REBIRTH_TIERS } from "@/lib/game-data"
import { useGame } from "@/lib/store"
import { PanelHeader } from "../ui-bits"
import { Sparkles, Check, Lock, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export function PrestigePanel() {
  const rebirthTier = useGame((s) => s.rebirthTier)
  const bestScore = useGame((s) => s.stats.bestScore)
  const rebirth = useGame((s) => s.rebirth)

  const nextTier = REBIRTH_TIERS[rebirthTier]

  return (
    <div>
      <PanelHeader
        title="Prestige & Rebirth"
        subtitle="Reset your best score for permanent bonuses, skill points and exclusive cosmetics."
        icon={Sparkles}
      />

      {nextTier ? (
        <div className="mb-6 rounded-2xl border border-primary/40 bg-card p-5 box-glow">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-black text-glow text-primary">Next: {nextTier.name}</h3>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">Tier {nextTier.tier}</span>
          </div>
          <p className="mb-3 text-sm text-foreground">{nextTier.bonus}</p>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-gold">+{Math.round(nextTier.coinMult * 100)}% coins</span>
            <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-primary">+{nextTier.skillPoints} skill pts</span>
            {nextTier.cosmetic && (
              <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-gem">Exclusive cosmetic</span>
            )}
          </div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Best score requirement</span>
            <span className="font-mono font-semibold text-foreground">
              {bestScore.toLocaleString()} / {nextTier.requiredScore.toLocaleString()}
            </span>
          </div>
          <div className="mb-4 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (bestScore / nextTier.requiredScore) * 100)}%` }}
            />
          </div>
          <button
            onClick={() => rebirth()}
            disabled={bestScore < nextTier.requiredScore}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-transform",
              bestScore >= nextTier.requiredScore
                ? "bg-primary text-primary-foreground hover:scale-[1.02]"
                : "cursor-not-allowed bg-secondary text-muted-foreground",
            )}
          >
            <RotateCcw size={18} /> {bestScore >= nextTier.requiredScore ? "REBIRTH NOW" : "Requirement not met"}
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-primary/40 bg-card p-6 text-center box-glow">
          <Sparkles className="mx-auto mb-2 text-gold" size={32} />
          <h3 className="text-lg font-black text-glow text-gold">Ouroboros Achieved</h3>
          <p className="text-sm text-muted-foreground">You have reached the pinnacle of rebirth. Truly eternal.</p>
        </div>
      )}

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">All Rebirth Tiers</h3>
      <div className="space-y-2">
        {REBIRTH_TIERS.map((t) => {
          const achieved = rebirthTier >= t.tier
          const current = rebirthTier + 1 === t.tier
          return (
            <div
              key={t.tier}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-card p-3",
                achieved && "border-primary/40",
                current && "border-gold/50",
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg font-bold",
                  achieved ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                )}
              >
                {achieved ? <Check size={18} /> : current ? t.tier : <Lock size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">
                  {t.name} <span className="text-xs font-normal text-muted-foreground">· Tier {t.tier}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">{t.bonus}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{t.requiredScore.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
