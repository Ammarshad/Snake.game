"use client"

import { useState } from "react"
import type { GameModeDef } from "@/lib/game-data"
import { ProfileHeader } from "./profile-header"
import { PlayScreen } from "./play-screen"
import { ModeSelect } from "./panels/mode-select"
import { ShopPanel } from "./panels/shop"
import { PetsPanel } from "./panels/pets"
import { CratesPanel } from "./panels/crates"
import { AchievementsPanel } from "./panels/achievements"
import { MissionsPanel } from "./panels/missions"
import { SkillsPanel } from "./panels/skills"
import { PrestigePanel } from "./panels/prestige"
import { ProfilePanel } from "./panels/profile"
import {
  Gamepad2,
  ShoppingBag,
  Gift,
  PawPrint,
  Award,
  Target,
  Network,
  Sparkles,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

type TabId =
  | "play"
  | "shop"
  | "crates"
  | "pets"
  | "missions"
  | "achievements"
  | "skills"
  | "prestige"
  | "profile"

const NAV: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "play", label: "Play", icon: Gamepad2 },
  { id: "shop", label: "Shop", icon: ShoppingBag },
  { id: "crates", label: "Crates", icon: Gift },
  { id: "pets", label: "Pets", icon: PawPrint },
  { id: "missions", label: "Missions", icon: Target },
  { id: "achievements", label: "Awards", icon: Award },
  { id: "skills", label: "Skills", icon: Network },
  { id: "prestige", label: "Prestige", icon: Sparkles },
  { id: "profile", label: "Profile", icon: User },
]

export function GameHub() {
  const [tab, setTab] = useState<TabId>("play")
  const [activeMode, setActiveMode] = useState<GameModeDef | null>(null)

  if (activeMode) {
    return <PlayScreen mode={activeMode} onExit={() => setActiveMode(null)} />
  }

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 pb-28 pt-5 sm:pb-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground box-glow">
            <span className="text-lg font-black">S</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-glow text-foreground">NEON SERPENT</h1>
            <p className="-mt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Evolution</p>
          </div>
        </div>
      </div>

      <ProfileHeader />

      {/* desktop nav */}
      <nav className="my-5 hidden flex-wrap gap-2 sm:flex">
        {NAV.map((n) => (
          <NavButton key={n.id} active={tab === n.id} onClick={() => setTab(n.id)} icon={n.icon} label={n.label} />
        ))}
      </nav>

      <div className="mt-5 sm:mt-0">
        {tab === "play" && <ModeSelect onPlay={(m) => setActiveMode(m)} />}
        {tab === "shop" && <ShopPanel />}
        {tab === "crates" && <CratesPanel />}
        {tab === "pets" && <PetsPanel />}
        {tab === "missions" && <MissionsPanel />}
        {tab === "achievements" && <AchievementsPanel />}
        {tab === "skills" && <SkillsPanel />}
        {tab === "prestige" && <PrestigePanel />}
        {tab === "profile" && <ProfilePanel />}
      </div>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-0.5 overflow-x-auto border-t border-border bg-card/95 px-2 py-2 backdrop-blur sm:hidden">
        {NAV.map((n) => {
          const Icon = n.icon
          const active = tab === n.id
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={cn(
                "flex min-w-[3.5rem] flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold transition-colors",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground",
              )}
            >
              <Icon size={18} />
              {n.label}
            </button>
          )
        })}
      </nav>
    </main>
  )
}

function NavButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ size?: number }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground box-glow"
          : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon size={16} /> {label}
    </button>
  )
}
