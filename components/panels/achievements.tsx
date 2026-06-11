"use client"

import { ACHIEVEMENTS } from "@/lib/game-data"
import { useGame } from "@/lib/store"
import { Cost, PanelHeader } from "../ui-bits"
import { Award, Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export function AchievementsPanel() {
  const stats = useGame((s) => s.stats)
  const unlocked = useGame((s) => s.unlockedAchievements)
  const claimed = useGame((s) => s.claimedAchievements)
  const claim = useGame((s) => s.claimAchievement)

  const total = ACHIEVEMENTS.length
  const done = unlocked.length

  return (
    <div>
      <PanelHeader
        title="Achievements"
        subtitle={`${done} / ${total} unlocked · claim rewards as you progress.`}
        icon={Award}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.includes(a.id)
          const isClaimed = claimed.includes(a.id)
          const val = (stats as Record<string, number>)[a.stat] ?? 0
          const pct = Math.min(100, (val / a.threshold) * 100)
          const secret = a.hidden && !isUnlocked
          return (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-card p-3",
                isUnlocked && "border-primary/40",
              )}
            >
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-lg",
                  isUnlocked ? "bg-primary/15 text-primary box-glow" : "bg-secondary text-muted-foreground",
                )}
              >
                {secret ? <Lock size={18} /> : isUnlocked ? <Check size={18} /> : <Award size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{secret ? "??? Secret" : a.name}</p>
                <p className="truncate text-xs text-muted-foreground">{secret ? "Hidden achievement" : a.desc}</p>
                {!isUnlocked && !secret && (
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                )}
                {!isUnlocked && !secret && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {Math.min(val, a.threshold).toLocaleString()} / {a.threshold.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                {isClaimed ? (
                  <span className="text-xs font-bold text-primary">Claimed</span>
                ) : isUnlocked ? (
                  <button
                    onClick={() => claim(a.id)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-transform hover:scale-105"
                  >
                    Claim
                  </button>
                ) : (
                  <Cost coins={a.reward.coins} gems={a.reward.gems} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
