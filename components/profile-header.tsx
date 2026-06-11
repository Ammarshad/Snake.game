"use client"

import { useGame } from "@/lib/store"
import { RANKS, REBIRTH_TIERS, rankForScore } from "@/lib/game-data"
import { CurrencyPill, ProgressBar } from "./ui-bits"
import { Crown } from "lucide-react"

export function ProfileHeader() {
  const { stats, coins, gems, title, rebirthTier } = useGame()
  const { rank, next, index } = rankForScore(stats.bestScore)
  const rebirth = rebirthTier > 0 ? REBIRTH_TIERS[rebirthTier - 1] : null

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* rank crest */}
          <div
            className="relative flex size-16 shrink-0 items-center justify-center rounded-xl text-2xl font-black"
            style={{
              color: rank.color,
              backgroundColor: rank.color + "1a",
              boxShadow: `0 0 0 1px ${rank.color}55, 0 0 22px ${rank.color}44`,
            }}
          >
            {rank.name[0]}
            {rebirthTier > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {rebirthTier}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-pretty text-lg font-extrabold tracking-tight text-foreground sm:text-xl" style={{ color: rank.color }}>
                {rank.name}
              </h1>
              {rebirth && (
                <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                  <Crown size={11} /> {rebirth.name}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {title ?? "No title equipped"}
            </p>
          </div>
        </div>
        <CurrencyPill coins={coins} gems={gems} />
      </div>

      {/* rank progress */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">Best: {stats.bestScore.toLocaleString()}</span>
          <span className="font-medium" style={{ color: next?.color }}>
            {next ? `Next: ${next.name} (${next.minScore.toLocaleString()})` : "Max Rank Achieved"}
          </span>
        </div>
        <ProgressBar
          value={stats.bestScore - rank.minScore}
          max={next ? next.minScore - rank.minScore : 1}
          color={rank.color}
        />
        {/* rank pips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {RANKS.map((r, i) => (
            <span
              key={r.id}
              title={r.name}
              className="h-1.5 flex-1 rounded-full"
              style={{
                minWidth: 14,
                backgroundColor: i <= index ? r.color : "var(--secondary)",
                boxShadow: i <= index ? `0 0 6px ${r.color}` : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
