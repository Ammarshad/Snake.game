"use client"

import { useMemo, useRef, useState } from "react"
import { SnakeGame, type EngineResult, type HudState } from "./snake-game"
import { useGame } from "@/lib/store"
import {
  COSMETICS,
  PET_BY_ID,
  POWERUP_BY_ID,
  REBIRTH_TIERS,
  type GameModeDef,
  type PowerUpId,
} from "@/lib/game-data"
import type { RunRewards } from "@/lib/store"
import { CurrencyPill, ProgressBar } from "./ui-bits"
import {
  ArrowLeft,
  Coins,
  Gem,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Swords,
  Trophy,
  Zap,
} from "lucide-react"

const PU_LABEL: Record<PowerUpId, string> = Object.fromEntries(
  Object.entries(POWERUP_BY_ID).map(([k, v]) => [k, v.name]),
) as Record<PowerUpId, string>

export function PlayScreen({ mode, onExit }: { mode: GameModeDef; onExit: () => void }) {
  const game = useGame()
  const [hud, setHud] = useState<HudState | null>(null)
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState<EngineResult | null>(null)
  const [rewards, setRewards] = useState<RunRewards | null>(null)
  const [eventToast, setEventToast] = useState<string | null>(null)
  const [runKey, setRunKey] = useState(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const config = useMemo(() => {
    const eq = game.equipped
    const skin = COSMETICS.find((c) => c.id === eq.skin)
    const trail = COSMETICS.find((c) => c.id === eq.trail)
    const food = COSMETICS.find((c) => c.id === eq.food)
    const aura = COSMETICS.find((c) => c.id === eq.aura)
    // pet bonuses
    const pet = game.activePet ? game.pets.find((p) => p.id === game.activePet) : null
    const petDef = pet ? PET_BY_ID[pet.id] : null
    const petVal = pet && petDef ? (petDef.baseValue * pet.level) / 100 : 0
    const sl = game.skillLevels
    const rebirthBonus = REBIRTH_TIERS.slice(0, game.rebirthTier).reduce((a, t) => a + t.coinMult, 0)
    return {
      mode,
      skinColor: skin?.color ?? "#2ed573",
      skinColor2: skin?.color2,
      trailColor: eq.trail === "trail_none" ? "" : trail?.color ?? "",
      foodColor: food?.color ?? "#ff5d73",
      auraColor: eq.aura === "aura_none" ? undefined : aura?.color,
      scoreMult:
        1 +
        ((sl["sk_score"] ?? 0) * 6) / 100 +
        (petDef?.bonusType === "score" ? petVal : 0),
      coinMult: 1 + ((sl["sk_coins"] ?? 0) * 5) / 100 + rebirthBonus + (petDef?.bonusType === "coin" ? petVal : 0),
      luck: (sl["sk_luck"] ?? 0) * 4 + (petDef?.bonusType === "luck" ? petDef.baseValue * pet!.level : 0),
      durationMult: 1 + ((sl["sk_pdur"] ?? 0) * 7) / 100,
      magnetBonus: Math.round((sl["sk_power"] ?? 0) * 0.5) + (petDef?.bonusType === "magnet" ? Math.round(petVal * 10) : 0),
      reviveChance: (sl["sk_revive"] ?? 0) * 8 + (petDef?.bonusType === "shield" ? petDef.baseValue * pet!.level : 0),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, runKey])

  function handleGameOver(r: EngineResult) {
    setResult(r)
    const rw = game.recordRun({ ...r, mode: mode.id, rewardMult: mode.rewardMult })
    setRewards(rw)
  }

  function restart() {
    setResult(null)
    setRewards(null)
    setHud(null)
    setPaused(false)
    setRunKey((k) => k + 1)
  }

  function showEvent(name: string) {
    setEventToast(name)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setEventToast(null), 2600)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* top bar */}
      <header className="flex items-center justify-between border-b border-border bg-sidebar/80 px-4 py-3 backdrop-blur">
        <button
          onClick={onExit}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft size={16} /> Hub
        </button>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{ color: mode.color, backgroundColor: mode.color + "1f" }}
          >
            {mode.name}
          </span>
        </div>
        <CurrencyPill coins={game.coins} gems={game.gems} size="sm" />
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 lg:flex-row lg:items-start">
        {/* left: stats */}
        <aside className="order-2 flex flex-row flex-wrap gap-3 lg:order-1 lg:w-56 lg:flex-col">
          <StatCard label="Score" value={hud?.score.toLocaleString() ?? "0"} icon={Trophy} color="#ffce4d" />
          <StatCard label="Length" value={String(hud?.length ?? 3)} icon={Zap} color="#7bed9f" />
          <StatCard
            label={mode.timeLimit > 0 ? "Time Left" : "Survived"}
            value={`${hud?.time ?? 0}s`}
            icon={Play}
            color="#3bc9db"
          />
          <StatCard label="AI Alive" value={String(hud?.aiAlive ?? 0)} icon={Swords} color="#ff5d73" />
          <div className="hidden rounded-xl border border-border bg-card p-3 lg:block">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Evolution</p>
            <p className="text-sm font-bold" style={{ color: hud?.evolutionColor ?? "#7bed9f" }}>
              {hud?.evolution ?? "Hatchling"}
            </p>
          </div>
        </aside>

        {/* center: board */}
        <main className="order-1 flex flex-1 flex-col items-center gap-3 lg:order-2">
          {/* event toast */}
          {eventToast && (
            <div className="animate-pop rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-sm font-bold text-accent">
              {eventToast}!
            </div>
          )}
          {/* combo + shields */}
          <div className="flex w-full max-w-[560px] items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-primary">x{hud?.combo ?? 1} combo</span>
              {(hud?.shields ?? 0) > 0 && (
                <span className="flex items-center gap-1 text-gem">
                  <Shield size={14} /> {hud?.shields}
                </span>
              )}
            </div>
            <button
              onClick={() => setPaused((p) => !p)}
              className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
              {paused ? "Resume" : "Pause"}
            </button>
          </div>

          <div className="relative w-full max-w-[560px]">
            {!result && (
              <SnakeGame
                key={runKey}
                config={config}
                onHud={setHud}
                onGameOver={handleGameOver}
                onEvent={showEvent}
                paused={paused}
              />
            )}

            {/* boss bar */}
            {hud?.boss && !result && (
              <div className="absolute inset-x-0 top-2 mx-auto w-[90%]">
                <div className="mb-1 flex items-center justify-between text-xs font-bold text-accent">
                  <span>{hud.boss.name}</span>
                  <span>
                    {hud.boss.hp}/{hud.boss.max}
                  </span>
                </div>
                <ProgressBar value={hud.boss.hp} max={hud.boss.max} color="#ff5d73" />
              </div>
            )}

            {/* pause overlay */}
            {paused && !result && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
                <p className="text-lg font-bold text-foreground">Paused</p>
              </div>
            )}

            {result && <GameOverCard result={result} rewards={rewards} onRestart={restart} onExit={onExit} mode={mode} />}
          </div>

          {/* active powerups */}
          {!result && (
            <div className="flex min-h-9 flex-wrap items-center justify-center gap-2">
              {hud?.activePowers.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ color: p.color, backgroundColor: p.color + "1f", border: `1px solid ${p.color}55` }}
                >
                  {PU_LABEL[p.id]}
                  {p.remaining > 0 && <span className="font-mono">{Math.ceil(p.remaining / 1000)}s</span>}
                </span>
              ))}
            </div>
          )}

          {/* mobile dpad */}
          {!result && <DPad />}
          <p className="hidden text-center text-xs text-muted-foreground sm:block">
            Arrow keys or WASD to move. Grab diamonds for power-ups.
          </p>
        </main>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ size?: number }>
  color: string
}) {
  return (
    <div className="flex min-w-[88px] flex-1 items-center gap-2.5 rounded-xl border border-border bg-card p-3">
      <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: color + "1f", color }}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-mono text-base font-bold leading-tight text-foreground">{value}</p>
      </div>
    </div>
  )
}

function DPad() {
  const press = (d: "up" | "down" | "left" | "right") => {
    const fn = (window as any).__snakeSetDir
    if (fn) fn(d)
  }
  const btn = "flex size-14 items-center justify-center rounded-xl border border-border bg-card text-foreground active:bg-primary active:text-primary-foreground transition select-none"
  return (
    <div className="mt-2 grid grid-cols-3 gap-2 sm:hidden">
      <span />
      <button className={btn} onClick={() => press("up")} aria-label="Up">↑</button>
      <span />
      <button className={btn} onClick={() => press("left")} aria-label="Left">←</button>
      <button className={btn} onClick={() => press("down")} aria-label="Down">↓</button>
      <button className={btn} onClick={() => press("right")} aria-label="Right">→</button>
    </div>
  )
}

function GameOverCard({
  result,
  rewards,
  onRestart,
  onExit,
  mode,
}: {
  result: EngineResult
  rewards: RunRewards | null
  onRestart: () => void
  onExit: () => void
  mode: GameModeDef
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/85 p-4 backdrop-blur">
      <div className="w-full max-w-sm animate-pop rounded-2xl border border-border bg-card p-6 box-glow">
        <h3 className="text-center text-2xl font-extrabold tracking-tight text-glow text-foreground">Run Over</h3>
        <p className="mb-4 text-center text-sm text-muted-foreground">{mode.name} Mode</p>

        <div className="grid grid-cols-2 gap-2 text-center">
          <Mini label="Score" value={result.score.toLocaleString()} color="#ffce4d" />
          <Mini label="Length" value={String(result.length)} color="#7bed9f" />
          <Mini label="Survived" value={`${result.survival}s`} color="#3bc9db" />
          <Mini label="AI Slain" value={String(result.aiDefeated)} color="#ff5d73" />
        </div>

        {rewards && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-primary">Rewards Earned</p>
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1.5 font-mono font-bold text-gold">
                <Coins size={16} /> +{rewards.coins.toLocaleString()}
              </span>
              {rewards.gems > 0 && (
                <span className="flex items-center gap-1.5 font-mono font-bold text-gem">
                  <Gem size={16} /> +{rewards.gems}
                </span>
              )}
            </div>
            {rewards.newRank && (
              <p className="mt-2 text-center text-sm font-bold text-accent">Rank Up: {rewards.rankName}!</p>
            )}
            {rewards.newAchievements?.length > 0 && (
              <p className="mt-1 text-center text-xs text-primary">
                {rewards.newAchievements.length} new achievement{rewards.newAchievements.length > 1 ? "s" : ""} unlocked!
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onRestart}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
          >
            <RotateCcw size={16} /> Play Again
          </button>
          <button
            onClick={onExit}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-foreground transition hover:bg-muted"
          >
            <ArrowLeft size={16} /> Hub
          </button>
        </div>
      </div>
    </div>
  )
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-secondary p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
