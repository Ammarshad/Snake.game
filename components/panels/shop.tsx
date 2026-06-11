"use client"

import { useState } from "react"
import { COSMETICS, type CosmeticType } from "@/lib/game-data"
import { useGame } from "@/lib/store"
import { Cost, PanelHeader, RarityBadge, rarityStyle } from "../ui-bits"
import { Check, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS: { id: CosmeticType; label: string }[] = [
  { id: "skin", label: "Skins" },
  { id: "trail", label: "Trails" },
  { id: "food", label: "Food" },
  { id: "effect", label: "Effects" },
  { id: "aura", label: "Auras" },
]

export function ShopPanel() {
  const [tab, setTab] = useState<CosmeticType>("skin")
  const owned = useGame((s) => s.ownedCosmetics)
  const equipped = useGame((s) => s.equipped)
  const buy = useGame((s) => s.buyCosmetic)
  const equip = useGame((s) => s.equip)

  const items = COSMETICS.filter((c) => c.type === tab)

  return (
    <div>
      <PanelHeader title="Cosmetic Shop" subtitle="Spend coins and gems on style." icon={ShoppingBag} />
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => {
          const isOwned = owned.includes(c.id)
          const isEquipped = equipped[c.type] === c.id
          return (
            <div
              key={c.id}
              className="flex flex-col rounded-xl border border-border bg-card p-3"
              style={rarityStyle(c.rarity)}
            >
              <div
                className="mb-3 flex h-20 items-center justify-center rounded-lg"
                style={{
                  background: c.color2
                    ? `linear-gradient(135deg, ${c.color}, ${c.color2})`
                    : `radial-gradient(circle at 50% 40%, ${c.color}cc, ${c.color}22)`,
                }}
              >
                <div className="size-9 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 16px ${c.color}` }} />
              </div>
              <div className="mb-1 flex items-center justify-between gap-1">
                <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
                <RarityBadge rarity={c.rarity} />
              </div>
              <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{c.desc}</p>
              <div className="mt-auto">
                {isOwned ? (
                  <button
                    onClick={() => equip(c)}
                    disabled={isEquipped}
                    className={cn(
                      "w-full rounded-lg py-1.5 text-xs font-bold transition-colors",
                      isEquipped ? "bg-primary/20 text-primary" : "bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground",
                    )}
                  >
                    {isEquipped ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check size={13} /> Equipped
                      </span>
                    ) : (
                      "Equip"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => buy(c.id)}
                    className="w-full rounded-lg bg-secondary py-1.5 transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <span className="flex items-center justify-center">
                      <Cost coins={c.cost.coins} gems={c.cost.gems} />
                    </span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
