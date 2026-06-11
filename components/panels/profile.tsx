"use client"

import { RANKS, EVOLUTIONS, AI_PERSONALITIES, BOSSES, rankForScore } from "@/lib/game-data"
import { useGame } from "@/lib/store"
import { PanelHeader } from "../ui-bits"
import { User, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProfilePanel() {
  const stats = useGame((s) => s.stats)
  const title = useGame((s) => s.title)
  const unlockedTitles = useGame((s) => s.unlockedTitles)
  const setTitle = useGame((s) => s.setTitle)
  const resetSave = useGame((s) => s.resetSave)
  const { index } = rankForScore(stats.bestScore)

  const statItems: { label: string; value: string }[] = [
    { label: "Games Played", value: stats.gamesPlayed.toLocaleString() },
    { label: "Best Score", value: stats.bestScore.toLocaleString() },
    { label: "Best Length", value: stats.bestLength.toLocaleString() },
    { label: "Best Survival", value: `${stats.bestSurvival}s` },
    { label: "Total Score", value: stats.totalScore.toLocaleString() },
    { label: "Coins Earned", value: stats.totalCoinsEarned.toLocaleString() },
    { label: "AI Defeated", value: stats.aiDefeated.toLocaleString() },
    { label: "Bosses Defeated", value: stats.bossesDefeated.toLocaleString() },
    { label: "Crates Opened", value: stats.cratesOpened.toLocaleString() },
    { label: "Rebirths", value: stats.rebirths.toLocaleString() },
    { label: "Power-ups", value: stats.powerupsCollected.toLocaleString() },
    { label: "Food Eaten", value: stats.foodEaten.toLocaleString() },
  ]

  return (
    <div>
      <PanelHeader title="Profile & Stats" subtitle="Your lifetime accomplishments and equippable titles." icon={User} />

      <div className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {statItems.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-mono text-lg font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Titles</h3>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTitle(null)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            title === null ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          None
        </button>
        {unlockedTitles.length === 0 && (
          <span className="self-center text-xs text-muted-foreground">Earn titles by ranking up and opening crates.</span>
        )}
        {unlockedTitles.map((t) => (
          <button
            key={t}
            onClick={() => setTitle(t)}
            className={cn(
              "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              title === t ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-primary/20",
            )}
          >
            {title === t && <Check size={12} />} {t}
          </button>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Rank Ladder</h3>
      <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {RANKS.map((r, i) => (
          <div
            key={r.id}
            className={cn("rounded-lg border border-border bg-card p-2 text-center", i > index && "opacity-50")}
            style={i <= index ? { borderColor: r.color + "66" } : undefined}
          >
            <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-full font-black" style={{ color: r.color, backgroundColor: r.color + "1a" }}>
              {r.name[0]}
            </div>
            <p className="text-[11px] font-semibold text-foreground">{r.name}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Snake Evolutions</h3>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EVOLUTIONS.map((e) => {
          const reached = stats.bestLength >= e.minLength
          return (
            <div key={e.id} className={cn("rounded-lg border border-border bg-card p-3", !reached && "opacity-50")}>
              <div className="mb-1.5 flex items-center gap-2">
                <div className="size-4 rounded-full" style={{ backgroundColor: e.color, boxShadow: reached ? `0 0 8px ${e.color}` : "none" }} />
                <span className="text-sm font-bold text-foreground">{e.name}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Length {e.minLength}+</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{e.desc}</p>
            </div>
          )
        })}
      </div>

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">AI Opponents</h3>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {AI_PERSONALITIES.map((ai) => (
          <div key={ai.id} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: ai.color }} />
              <span className="text-sm font-bold text-foreground">{ai.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Tier {ai.tier}</p>
            <p className="text-[11px] text-muted-foreground">
              {ai.aggression > 0.6 ? "Aggressive" : ai.aggression < 0.35 ? "Defensive" : "Balanced"} · {Math.round(ai.smarts * 100)}% IQ
            </p>
          </div>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Bosses</h3>
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BOSSES.map((b) => (
          <div key={b.id} className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="size-4 rounded-full" style={{ backgroundColor: b.color, boxShadow: `0 0 8px ${b.color}` }} />
              <span className="text-sm font-bold text-foreground">{b.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">{b.hp} HP · {b.reward.coins.toLocaleString()} coins</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          if (confirm("Reset ALL progress? This cannot be undone.")) resetSave()
        }}
        className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        Reset Save Data
      </button>
    </div>
  )
}
