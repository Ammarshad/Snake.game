"use client"

import { PETS, PET_BY_ID, petEvolveStage } from "@/lib/game-data"
import { useGame } from "@/lib/store"
import { PanelHeader, RarityBadge, rarityStyle } from "../ui-bits"
import { Check, PawPrint, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function PetsPanel() {
  const pets = useGame((s) => s.pets)
  const activePet = useGame((s) => s.activePet)
  const setActive = useGame((s) => s.setActivePet)
  const upgrade = useGame((s) => s.upgradePet)

  const ownedIds = pets.map((p) => p.id)

  return (
    <div>
      <PanelHeader title="Pet Sanctuary" subtitle="Pets grant passive bonuses. Level them up to evolve." icon={PawPrint} />

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Your Pets</h3>
      {pets.length === 0 ? (
        <div className="mb-6 rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          No pets yet. Open crates to discover companions!
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((p) => {
            const def = PET_BY_ID[p.id]
            if (!def) return null
            const stage = petEvolveStage(p.level)
            const bonus = (def.baseValue * p.level).toFixed(0)
            const isActive = activePet === p.id
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-3" style={rarityStyle(def.rarity)}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: def.color + "22", border: `2px solid ${stage.ring}`, boxShadow: `0 0 14px ${def.color}66` }}
                  >
                    <div className="size-7 rounded-full" style={{ backgroundColor: def.color, boxShadow: `0 0 10px ${def.color}` }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-sm font-bold text-foreground">{def.name}</span>
                      <RarityBadge rarity={def.rarity} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lv {p.level} · {stage.name}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: def.color }}>
                      +{bonus}% {def.bonus}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setActive(isActive ? null : p.id)}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors",
                      isActive ? "bg-primary/20 text-primary" : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground",
                    )}
                  >
                    {isActive ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check size={13} /> Active
                      </span>
                    ) : (
                      "Set Active"
                    )}
                  </button>
                  <button
                    onClick={() => upgrade(p.id)}
                    className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-bold text-gold transition-colors hover:bg-gold hover:text-background"
                  >
                    <ArrowUp size={13} /> {(p.level * 250).toLocaleString()}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">All Companions</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {PETS.map((def) => {
          const found = ownedIds.includes(def.id)
          return (
            <div
              key={def.id}
              className={cn("rounded-xl border border-border bg-card p-3 text-center", !found && "opacity-60")}
              style={found ? rarityStyle(def.rarity) : undefined}
            >
              <div
                className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full"
                style={{ backgroundColor: def.color + "22", boxShadow: found ? `0 0 12px ${def.color}66` : "none" }}
              >
                <div className="size-6 rounded-full" style={{ backgroundColor: found ? def.color : "#444" }} />
              </div>
              <p className="truncate text-xs font-bold text-foreground">{found ? def.name : "???"}</p>
              <div className="mt-1 flex justify-center">
                <RarityBadge rarity={def.rarity} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
