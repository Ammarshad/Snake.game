"use client"

import { useState } from "react"
import { CRATES, RARITY_META } from "@/lib/game-data"
import { useGame, type CratePull } from "@/lib/store"
import { Cost, PanelHeader, RarityBadge, rarityStyle } from "../ui-bits"
import { Gift, Sparkles } from "lucide-react"

export function CratesPanel() {
  const buyCrate = useGame((s) => s.buyCrate)
  const [opening, setOpening] = useState(false)
  const [pull, setPull] = useState<CratePull | null>(null)
  const [pullColor, setPullColor] = useState("#fff")

  function open(crateId: string) {
    const result = buyCrate(crateId)
    if (!result) return
    setOpening(true)
    setPull(null)
    setTimeout(() => {
      setPull(result)
      setPullColor(RARITY_META[result.rarity].color)
    }, 1100)
  }

  return (
    <div>
      <PanelHeader title="Loot Crates" subtitle="Open crates for skins, pets, currency, titles and rare collectibles." icon={Gift} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CRATES.map((crate) => {
          const m = RARITY_META[crate.rarity]
          return (
            <div key={crate.id} className="flex flex-col rounded-xl border border-border bg-card p-4" style={rarityStyle(crate.rarity)}>
              <div
                className="mb-3 flex h-28 items-center justify-center rounded-lg"
                style={{ background: `radial-gradient(circle at 50% 40%, ${crate.color}40, transparent 70%)` }}
              >
                <Gift size={52} style={{ color: crate.color, filter: `drop-shadow(0 0 12px ${crate.color})` }} />
              </div>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold text-foreground">{crate.name}</span>
                <RarityBadge rarity={crate.rarity} />
              </div>
              <div className="mb-3 space-y-1">
                {(["mythic", "legendary", "epic"] as const).map((r) =>
                  crate.odds[r] > 0 ? (
                    <div key={r} className="flex items-center justify-between text-[11px]">
                      <span style={{ color: RARITY_META[r].color }}>{RARITY_META[r].label}</span>
                      <span className="font-mono text-muted-foreground">{crate.odds[r]}%</span>
                    </div>
                  ) : null,
                )}
              </div>
              <button
                onClick={() => open(crate.id)}
                className="mt-auto w-full rounded-lg py-2 font-bold text-background transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: m.color, boxShadow: `0 0 16px ${m.glow}` }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={15} /> <Cost coins={crate.cost.coins} gems={crate.cost.gems} />
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {opening && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          onClick={() => pull && setOpening(false)}
        >
          {!pull ? (
            <div className="flex flex-col items-center gap-4">
              <div className="size-28 animate-spin rounded-2xl border-4 border-primary/30 border-t-primary" />
              <p className="animate-pulse text-lg font-bold text-primary">Opening...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <div
                className="flex size-36 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: pullColor + "22",
                  border: `2px solid ${pullColor}`,
                  boxShadow: `0 0 60px ${pullColor}`,
                }}
              >
                <div className="size-16 rounded-full" style={{ backgroundColor: pullColor, boxShadow: `0 0 30px ${pullColor}` }} />
              </div>
              <RarityBadge rarity={pull.rarity} />
              <h3 className="text-2xl font-black text-glow" style={{ color: pullColor }}>
                {pull.name}
              </h3>
              <p className="text-sm capitalize text-muted-foreground">{pull.type} unlocked!</p>
              <button
                onClick={() => setOpening(false)}
                className="mt-2 rounded-lg bg-primary px-8 py-2.5 font-bold text-primary-foreground transition-transform hover:scale-105"
              >
                Awesome!
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
