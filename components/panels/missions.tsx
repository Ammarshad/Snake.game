"use client"

import { DAILY_MISSIONS, WEEKLY_MISSIONS, LONGTERM_MISSIONS, type MissionDef } from "@/lib/game-data"
import { useGame } from "@/lib/store"
import { Cost, PanelHeader, ProgressBar } from "../ui-bits"
import { Target, CalendarDays, CalendarRange, Infinity as InfinityIcon } from "lucide-react"

export function MissionsPanel() {
  return (
    <div>
      <PanelHeader title="Missions" subtitle="Daily, weekly and long-term goals for constant rewards." icon={Target} />
      <MissionGroup title="Daily" icon={CalendarDays} color="#7bed9f" missions={DAILY_MISSIONS} scope="daily" />
      <MissionGroup title="Weekly" icon={CalendarRange} color="#3bc9db" missions={WEEKLY_MISSIONS} scope="weekly" />
      <MissionGroup title="Long-Term" icon={InfinityIcon} color="#ffce4d" missions={LONGTERM_MISSIONS} scope="longterm" />
    </div>
  )
}

function MissionGroup({
  title,
  icon: Icon,
  color,
  missions,
  scope,
}: {
  title: string
  icon: React.ComponentType<{ size?: number }>
  color: string
  missions: MissionDef[]
  scope: "daily" | "weekly" | "longterm"
}) {
  const daily = useGame((s) => s.dailyProgress)
  const weekly = useGame((s) => s.weeklyProgress)
  const stats = useGame((s) => s.stats)
  const claimed = useGame((s) => s.claimedMissions)
  const claim = useGame((s) => s.claimMission)

  function progressFor(m: MissionDef) {
    if (scope === "daily") return daily[m.stat] ?? 0
    if (scope === "weekly") return weekly[m.stat] ?? 0
    return (stats as Record<string, number>)[m.stat] ?? 0
  }

  return (
    <div className="mb-7">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide" style={{ color }}>
        <Icon size={16} /> {title}
      </h3>
      <div className="space-y-2.5">
        {missions.map((m) => {
          const val = progressFor(m)
          const complete = val >= m.target
          const isClaimed = claimed.includes(m.id)
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{m.name}</span>
                {isClaimed ? (
                  <span className="text-xs font-bold text-primary">Claimed</span>
                ) : complete ? (
                  <button
                    onClick={() => claim(m.id)}
                    className="rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground transition-transform hover:scale-105"
                  >
                    Claim
                  </button>
                ) : (
                  <Cost coins={m.reward.coins} gems={m.reward.gems} />
                )}
              </div>
              <ProgressBar value={val} max={m.target} color={color} />
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {Math.min(val, m.target).toLocaleString()} / {m.target.toLocaleString()}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
