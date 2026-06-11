"use client"

import { SKILLS, SKILL_BRANCHES } from "@/lib/game-data"
import { useGame } from "@/lib/store"
import { PanelHeader } from "../ui-bits"
import { Network, Plus, Coins as CoinsIcon, TrendingUp, Shield, Clover, Zap, Wind } from "lucide-react"
import { cn } from "@/lib/utils"

const BRANCH_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  wind: Wind,
  coins: CoinsIcon,
  "trending-up": TrendingUp,
  shield: Shield,
  clover: Clover,
  zap: Zap,
}

export function SkillsPanel() {
  const skillPoints = useGame((s) => s.skillPoints)
  const levels = useGame((s) => s.skillLevels)
  const buy = useGame((s) => s.buySkill)

  const branches = Object.entries(SKILL_BRANCHES) as [keyof typeof SKILL_BRANCHES, (typeof SKILL_BRANCHES)[keyof typeof SKILL_BRANCHES]][]

  return (
    <div>
      <PanelHeader
        title="Skill Tree"
        subtitle="Spend skill points (earned via Prestige) to specialize your playstyle."
        icon={Network}
      />
      <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 font-bold text-primary box-glow">
        <Network size={16} /> {skillPoints} Skill Points
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map(([key, branch]) => {
          const Icon = BRANCH_ICONS[branch.icon] ?? Zap
          const branchSkills = SKILLS.filter((s) => s.branch === key)
          return (
            <div key={key} className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 font-bold" style={{ color: branch.color }}>
                <Icon size={18} /> {branch.name}
              </h3>
              <div className="space-y-3">
                {branchSkills.map((sk) => {
                  const lvl = levels[sk.id] ?? 0
                  const maxed = lvl >= sk.maxLevel
                  const affordable = skillPoints >= sk.costPerLevel && !maxed
                  return (
                    <div key={sk.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{sk.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {lvl}/{sk.maxLevel}
                        </span>
                      </div>
                      <p className="mb-1.5 text-xs text-muted-foreground">
                        {sk.desc} (+{sk.valuePerLevel * lvl || sk.valuePerLevel})
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 gap-1">
                          {Array.from({ length: sk.maxLevel }).map((_, i) => (
                            <div
                              key={i}
                              className="h-1.5 flex-1 rounded-full"
                              style={{ backgroundColor: i < lvl ? branch.color : "var(--secondary)" }}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => buy(sk.id)}
                          disabled={!affordable}
                          className={cn(
                            "flex items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-bold transition-colors",
                            maxed
                              ? "bg-secondary text-muted-foreground"
                              : affordable
                                ? "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground"
                                : "cursor-not-allowed bg-secondary text-muted-foreground opacity-50",
                          )}
                        >
                          {maxed ? "MAX" : (<><Plus size={11} /> {sk.costPerLevel}</>)}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
