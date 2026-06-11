"use client"

import { GAME_MODES, WORLD_EVENTS, AI_PERSONALITIES, type GameModeDef } from "@/lib/game-data"
import { PanelHeader } from "../ui-bits"
import * as Icons from "lucide-react"
import { Gamepad2 } from "lucide-react"

function Icon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const C = (Icons as any)[pascal(name)] ?? Icons.Circle
  return <C size={size} color={color} />
}
function pascal(s: string) {
  return s
    .split("-")
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("")
}

export function ModeSelect({ onPlay }: { onPlay: (mode: GameModeDef) => void }) {
  return (
    <div>
      <PanelHeader title="Choose Your Arena" subtitle="Eight modes. Endless glory." icon={Gamepad2} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GAME_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onPlay(mode)}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-secondary"
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-110"
              style={{ backgroundColor: mode.color + "1f", color: mode.color }}
            >
              <Icon name={mode.icon} size={22} color={mode.color} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{mode.name}</h3>
                {mode.rewardMult > 1 && (
                  <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold">
                    {mode.rewardMult}x rewards
                  </span>
                )}
              </div>
              <p className="text-pretty text-xs text-muted-foreground">{mode.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* AI roster */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">AI Opponents</h3>
        <div className="flex flex-wrap gap-2">
          {AI_PERSONALITIES.map((ai) => (
            <span
              key={ai.id}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold"
              style={{ color: ai.color }}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: ai.color, boxShadow: `0 0 6px ${ai.color}` }} />
              {ai.name}
              <span className="text-muted-foreground">T{ai.tier}</span>
            </span>
          ))}
        </div>
      </div>

      {/* events teaser */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Random World Events</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {WORLD_EVENTS.map((ev) => (
            <div key={ev.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
              <Icon name={ev.icon === "meteor" ? "sparkles" : ev.icon} size={16} color={ev.color} />
              <span className="truncate text-xs font-medium text-foreground">{ev.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
