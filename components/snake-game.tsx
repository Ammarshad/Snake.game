"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AI_PERSONALITIES,
  BOSSES,
  EVOLUTIONS,
  POWERUPS,
  POWERUP_BY_ID,
  WORLD_EVENTS,
  evolutionForLength,
  type GameModeDef,
  type PowerUpId,
  type Rarity,
} from "@/lib/game-data"

const GRID = 28
const CELL = 20

type Vec = { x: number; y: number }
type Dir = "up" | "down" | "left" | "right"

interface ActiveSnake {
  id: string
  body: Vec[]
  dir: Dir
  nextDir: Dir
  alive: boolean
  color: string
  personality?: (typeof AI_PERSONALITIES)[number]
  isPlayer: boolean
  moveAcc: number
  speed: number // cells/sec
}

interface FoodItem {
  pos: Vec
  golden: boolean
  value: number
}

interface PowerOnBoard {
  pos: Vec
  id: PowerUpId
  rarity: Rarity
  color: string
  ttl: number
}

interface Boss {
  body: Vec[]
  dir: Dir
  hp: number
  maxHp: number
  color: string
  name: string
  moveAcc: number
  reward: { coins: number; gems: number }
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
}

interface Floater {
  x: number
  y: number
  text: string
  color: string
  life: number
}

export interface HudState {
  score: number
  length: number
  coins: number
  gems: number
  time: number
  evolution: string
  evolutionColor: string
  activePowers: { id: PowerUpId; remaining: number; color: string }[]
  combo: number
  shields: number
  aiAlive: number
  boss: { hp: number; max: number; name: string } | null
  event: { name: string; color: string; remaining: number } | null
}

export interface EngineResult {
  score: number
  length: number
  survival: number
  coins: number
  gems: number
  aiDefeated: number
  bossesDefeated: number
  powerups: number
  food: number
  mythicPowerup: boolean
}

interface EngineConfig {
  mode: GameModeDef
  skinColor: string
  skinColor2?: string
  trailColor: string
  foodColor: string
  auraColor?: string
  // multipliers from skills/pets/rebirth
  scoreMult: number
  coinMult: number
  luck: number
  durationMult: number
  magnetBonus: number
  reviveChance: number
}

interface Props {
  config: EngineConfig
  onHud: (h: HudState) => void
  onGameOver: (r: EngineResult) => void
  onEvent?: (name: string) => void
  paused: boolean
}

const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const OPP: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" }

function rndCell(): Vec {
  return { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
}
function eq(a: Vec, b: Vec) {
  return a.x === b.x && a.y === b.y
}

export function SnakeGame({ config, onHud, onGameOver, onEvent, paused }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  const stateRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  // initialize game state once
  const init = useCallback(() => {
    const player: ActiveSnake = {
      id: "player",
      body: [
        { x: 8, y: 14 },
        { x: 7, y: 14 },
        { x: 6, y: 14 },
      ],
      dir: "right",
      nextDir: "right",
      alive: true,
      color: config.skinColor,
      isPlayer: true,
      moveAcc: 0,
      speed: 7,
    }
    const ais: ActiveSnake[] = []
    for (let i = 0; i < config.mode.aiCount; i++) {
      const p = AI_PERSONALITIES[Math.min(i, AI_PERSONALITIES.length - 1)]
      const start = { x: 4 + i * 3, y: 4 + (i % 3) * 6 }
      ais.push({
        id: "ai" + i,
        body: [start, { x: start.x - 1, y: start.y }, { x: start.x - 2, y: start.y }],
        dir: "right",
        nextDir: "right",
        alive: true,
        color: p.color,
        personality: p,
        isPlayer: false,
        moveAcc: 0,
        speed: 6 + p.tier * 0.6,
      })
    }

    stateRef.current = {
      player,
      ais,
      food: [] as FoodItem[],
      powers: [] as PowerOnBoard[],
      particles: [] as Particle[],
      floaters: [] as Floater[],
      boss: null as Boss | null,
      bossSpawned: 0,
      activePowers: {} as Record<string, number>, // id -> remaining ms
      shields: 0,
      ghost: 0,
      score: 0,
      combo: 1,
      comboTimer: 0,
      coins: 0,
      gems: 0,
      time: 0,
      aiDefeated: 0,
      bossesDefeated: 0,
      powerupsCollected: 0,
      foodEaten: 0,
      mythicPowerup: false,
      revived: false,
      foodTimer: 0,
      powerTimer: 0,
      event: null as { id: string; name: string; color: string; remaining: number } | null,
      eventCooldown: 12,
      gameOver: false,
      shake: 0,
    }
    // initial food
    for (let i = 0; i < 4; i++) spawnFood(false)
    if (config.mode.boss) spawnBoss()
    setReady(true)
  }, [config])

  function occupied(pos: Vec): boolean {
    const s = stateRef.current
    if (!s) return false
    const all = [s.player, ...s.ais]
    for (const sn of all) if (sn.alive && sn.body.some((b: Vec) => eq(b, pos))) return true
    if (s.boss && s.boss.body.some((b: Vec) => eq(b, pos))) return true
    if (s.food.some((f: FoodItem) => eq(f.pos, pos))) return true
    return false
  }

  function spawnFood(golden: boolean) {
    const s = stateRef.current
    let pos = rndCell()
    let tries = 0
    while (occupied(pos) && tries++ < 40) pos = rndCell()
    s.food.push({ pos, golden, value: golden ? 5 : 1 })
  }

  function spawnPower() {
    const s = stateRef.current
    // weighted by rarity, biased by luck
    const luck = config.luck
    const weighted: PowerUpId[] = []
    for (const p of POWERUPS) {
      let w =
        p.rarity === "common"
          ? 50
          : p.rarity === "rare"
            ? 24
            : p.rarity === "epic"
              ? 12
              : p.rarity === "legendary"
                ? 5
                : 1.5
      if (p.rarity === "legendary" || p.rarity === "mythic") w *= 1 + luck / 100
      for (let i = 0; i < Math.round(w * 2); i++) weighted.push(p.id)
    }
    const id = weighted[Math.floor(Math.random() * weighted.length)]
    const def = POWERUP_BY_ID[id]
    let pos = rndCell()
    let tries = 0
    while (occupied(pos) && tries++ < 40) pos = rndCell()
    s.powers.push({ pos, id, rarity: def.rarity, color: def.color, ttl: 12 })
  }

  function spawnBoss() {
    const s = stateRef.current
    const def = BOSSES[Math.min(s.bossSpawned, BOSSES.length - 1)]
    const body: Vec[] = []
    for (let i = 0; i < 6; i++) body.push({ x: GRID - 4 - i, y: 4 })
    s.boss = {
      body,
      dir: "left",
      hp: def.hp,
      maxHp: def.hp,
      color: def.color,
      name: def.name,
      moveAcc: 0,
      reward: { ...def.reward },
    }
    s.bossSpawned++
    s.shake = 0.5
  }

  function addParticles(x: number, y: number, color: string, n: number, spread = 3) {
    const s = stateRef.current
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = Math.random() * spread + 1
      s.particles.push({
        x: x * CELL + CELL / 2,
        y: y * CELL + CELL / 2,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        max: 1,
        color,
        size: Math.random() * 3 + 1.5,
      })
    }
  }
  function addFloater(x: number, y: number, text: string, color: string) {
    stateRef.current.floaters.push({ x: x * CELL + CELL / 2, y: y * CELL, text, color, life: 1 })
  }

  function startEvent() {
    const s = stateRef.current
    const def = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)]
    s.event = { id: def.id, name: def.name, color: def.color, remaining: 12 }
    onEvent?.(def.name)
    if (def.id === "invasion" && !s.boss) spawnBoss()
    if (def.id === "goldrain" || def.id === "frenzy") {
      for (let i = 0; i < 6; i++) spawnFood(def.id === "goldrain")
    }
    s.shake = 0.4
  }

  function activatePower(id: PowerUpId) {
    const s = stateRef.current
    const def = POWERUP_BY_ID[id]
    s.powerupsCollected++
    if (def.rarity === "mythic") s.mythicPowerup = true

    if (id === "shield") {
      s.shields += 1
      return
    }
    if (id === "blackhole") {
      // eat all food
      let gained = 0
      for (const f of s.food) {
        gained += f.value
        addParticles(f.pos.x, f.pos.y, "#b07cff", 6)
      }
      s.score += gained * 10 * s.combo * config.scoreMult
      s.coins += gained * 3
      s.food = []
      for (let i = 0; i < 4; i++) spawnFood(false)
      s.shake = 0.5
      return
    }
    if (id === "phoenix") {
      s.activePowers["phoenix"] = 9_999_999 // passive until death
      return
    }
    // timed
    s.activePowers[id] = def.duration * config.durationMult
    if (id === "ghost") s.ghost = def.duration * config.durationMult
  }

  function eatFood(snake: ActiveSnake, idx: number) {
    const s = stateRef.current
    const f: FoodItem = s.food[idx]
    s.food.splice(idx, 1)
    if (snake.isPlayer) {
      s.comboTimer = 3
      s.combo = Math.min(s.combo + 0.25, 10)
      const mult = (s.activePowers["multiplier"] ? 2 : 1) * (s.event?.id === "doublexp" ? 2 : 1)
      const gain = Math.round(f.value * 10 * s.combo * mult * config.scoreMult)
      s.score += gain
      const coinMult = (s.activePowers["coinmult"] ? 3 : 1) * (s.event?.id === "coinstorm" ? 2 : 1)
      const coinGain = Math.round(f.value * coinMult * (f.golden ? 5 : 1))
      s.coins += coinGain
      s.foodEaten++
      addFloater(f.pos.x, f.pos.y, "+" + gain, f.golden ? "#ffce4d" : "#7bed9f")
      addParticles(f.pos.x, f.pos.y, f.golden ? "#ffce4d" : config.foodColor, 8)
    }
    // grow: don't pop tail this tick
    snake.body.push({ ...snake.body[snake.body.length - 1] })
    spawnFood(s.event?.id === "goldrain")
  }

  function killSnake(sn: ActiveSnake) {
    const s = stateRef.current
    sn.alive = false
    for (const seg of sn.body) addParticles(seg.x, seg.y, sn.color, 2)
    // drop food where it died
    for (let i = 0; i < sn.body.length; i += 3) {
      if (Math.random() < 0.5) s.food.push({ pos: { ...sn.body[i] }, golden: false, value: 1 })
    }
    if (!sn.isPlayer) {
      s.aiDefeated++
      s.score += 250 * config.scoreMult
      s.coins += 50
      addFloater(sn.body[0].x, sn.body[0].y, "AI DOWN +250", "#ff5d73")
    }
  }

  function playerDie() {
    const s = stateRef.current
    // phoenix revive
    if (s.activePowers["phoenix"]) {
      delete s.activePowers["phoenix"]
      s.player.body = s.player.body.slice(0, Math.max(3, Math.floor(s.player.body.length / 2)))
      s.activePowers["invincible"] = 3000
      s.shake = 1
      addParticles(s.player.body[0].x, s.player.body[0].y, "#ff5d73", 30, 5)
      addFloater(s.player.body[0].x, s.player.body[0].y, "PHOENIX REVIVE!", "#ff5d73")
      return
    }
    if (!s.revived && Math.random() * 100 < config.reviveChance) {
      s.revived = true
      s.activePowers["invincible"] = 2500
      addFloater(s.player.body[0].x, s.player.body[0].y, "SECOND WIND!", "#7fd4ff")
      return
    }
    endGame()
  }

  function endGame() {
    const s = stateRef.current
    if (s.gameOver) return
    s.gameOver = true
    onGameOver({
      score: Math.round(s.score),
      length: s.player.body.length,
      survival: Math.round(s.time),
      coins: Math.round(s.coins),
      gems: s.gems,
      aiDefeated: s.aiDefeated,
      bossesDefeated: s.bossesDefeated,
      powerups: s.powerupsCollected,
      food: s.foodEaten,
      mythicPowerup: s.mythicPowerup,
    })
  }

  // AI decision
  function aiThink(ai: ActiveSnake) {
    const s = stateRef.current
    const head = ai.body[0]
    const p = ai.personality!
    // target: nearest food, or player tail if aggressive
    let target: Vec | null = null
    let bestD = Infinity
    for (const f of s.food) {
      const d = Math.abs(f.pos.x - head.x) + Math.abs(f.pos.y - head.y)
      if (d < bestD) {
        bestD = d
        target = f.pos
      }
    }
    if (p.aggression > 0.6 && s.player.alive && Math.random() < p.aggression) {
      // try to cut off player head
      const ph = s.player.body[0]
      const ahead = { x: ph.x + DIRS[s.player.dir].x * 2, y: ph.y + DIRS[s.player.dir].y * 2 }
      target = ahead
    }
    const options: Dir[] = (["up", "down", "left", "right"] as Dir[]).filter(
      (d) => d !== OPP[ai.dir],
    )
    let best: Dir = ai.dir
    let bestScore = -Infinity
    for (const d of options) {
      const nx = { x: head.x + DIRS[d].x, y: head.y + DIRS[d].y }
      let score = 0
      // avoid walls/self/others (smarter AIs look ahead more)
      if (nx.x < 0 || nx.y < 0 || nx.x >= GRID || nx.y >= GRID) score -= 1000
      if (isBlockedForAI(nx, ai)) score -= 1000
      // open space heuristic
      score += freeNeighbors(nx) * p.smarts * 5
      if (target) {
        const d2 = Math.abs(target.x - nx.x) + Math.abs(target.y - nx.y)
        score -= d2
      }
      score += Math.random() * (1 - p.smarts) * 6
      if (score > bestScore) {
        bestScore = score
        best = d
      }
    }
    ai.nextDir = best
  }

  function isBlockedForAI(pos: Vec, self: ActiveSnake): boolean {
    const s = stateRef.current
    const all = [s.player, ...s.ais]
    for (const sn of all) {
      if (!sn.alive) continue
      const body = sn === self ? sn.body.slice(0, -1) : sn.body
      if (body.some((b: Vec) => eq(b, pos))) return true
    }
    if (s.boss && s.boss.body.some((b: Vec) => eq(b, pos))) return true
    return false
  }
  function freeNeighbors(pos: Vec): number {
    let n = 0
    for (const d of Object.values(DIRS)) {
      const np = { x: pos.x + d.x, y: pos.y + d.y }
      if (np.x < 0 || np.y < 0 || np.x >= GRID || np.y >= GRID) continue
      if (!isBlockedForAI(np, { body: [] } as any)) n++
    }
    return n
  }

  function stepSnake(sn: ActiveSnake) {
    const s = stateRef.current
    sn.dir = sn.nextDir
    const head = sn.body[0]
    let nx = { x: head.x + DIRS[sn.dir].x, y: head.y + DIRS[sn.dir].y }

    const invincible = sn.isPlayer && (s.activePowers["invincible"] > 0)
    const ghost = sn.isPlayer && s.ghost > 0

    // walls
    if (nx.x < 0 || nx.y < 0 || nx.x >= GRID || nx.y >= GRID) {
      if (invincible) {
        nx = { x: (nx.x + GRID) % GRID, y: (nx.y + GRID) % GRID }
      } else if (sn.isPlayer) {
        if (s.shields > 0) {
          s.shields--
          nx = { x: (nx.x + GRID) % GRID, y: (nx.y + GRID) % GRID }
          s.shake = 0.4
        } else {
          playerDie()
          return
        }
      } else {
        killSnake(sn)
        return
      }
    }

    // collision with snakes
    const all = [s.player, ...s.ais]
    for (const other of all) {
      if (!other.alive) continue
      const selfHit = other === sn
      const body = other.body
      for (let i = 0; i < body.length; i++) {
        if (selfHit && i === 0) continue
        if (eq(body[i], nx)) {
          if (selfHit && ghost) continue
          if (sn.isPlayer && invincible) {
            // smash through AI
            if (!selfHit && !other.isPlayer) killSnake(other)
            continue
          }
          if (sn.isPlayer) {
            if (s.shields > 0) {
              s.shields--
              s.shake = 0.4
            } else {
              playerDie()
              return
            }
          } else {
            // AI head into player body: AI dies. Head-on: longer wins
            killSnake(sn)
            return
          }
        }
      }
    }

    // boss collision
    if (s.boss && !ghost && !invincible) {
      if (s.boss.body.some((b: Vec) => eq(b, nx))) {
        if (sn.isPlayer) {
          if (s.shields > 0) {
            s.shields--
            s.shake = 0.4
          } else {
            playerDie()
            return
          }
        } else {
          killSnake(sn)
          return
        }
      }
    }

    sn.body.unshift(nx)

    // eat food
    const fi = s.food.findIndex((f: FoodItem) => eq(f.pos, nx))
    if (fi >= 0) {
      eatFood(sn, fi)
    } else {
      sn.body.pop()
    }

    // player picks up power
    if (sn.isPlayer) {
      const pi = s.powers.findIndex((pw: PowerOnBoard) => eq(pw.pos, nx))
      if (pi >= 0) {
        const pw = s.powers[pi]
        s.powers.splice(pi, 1)
        activatePower(pw.id)
        addParticles(nx.x, nx.y, pw.color, 14, 4)
        addFloater(nx.x, nx.y, POWERUP_BY_ID[pw.id].name, pw.color)
        s.shake = 0.3
      }
      // damage boss if head adjacent while invincible
      if (s.boss && invincible) {
        // handled in boss step
      }
    }
  }

  function stepBoss() {
    const s = stateRef.current
    const boss: Boss = s.boss
    const head = boss.body[0]
    // chase player
    const ph = s.player.body[0]
    const dx = ph.x - head.x
    const dy = ph.y - head.y
    let dir: Dir = boss.dir
    if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "right" : "left"
    else dir = dy > 0 ? "down" : "up"
    if (dir === OPP[boss.dir]) dir = boss.dir
    boss.dir = dir
    let nx = { x: head.x + DIRS[dir].x, y: head.y + DIRS[dir].y }
    nx = { x: (nx.x + GRID) % GRID, y: (nx.y + GRID) % GRID }
    boss.body.unshift(nx)
    boss.body.pop()

    // player damages boss if invincible/blackhole adjacency or head contact while invincible
    const invincible = s.activePowers["invincible"] > 0
    if (invincible) {
      const phead = s.player.body[0]
      const adj = boss.body.some(
        (b: Vec) => Math.abs(b.x - phead.x) + Math.abs(b.y - phead.y) <= 1,
      )
      if (adj) {
        boss.hp -= 1
        addParticles(phead.x, phead.y, boss.color, 10, 4)
        s.shake = 0.4
        if (boss.hp <= 0) defeatBoss()
      }
    }
  }

  function defeatBoss() {
    const s = stateRef.current
    const boss: Boss = s.boss
    s.bossesDefeated++
    s.coins += boss.reward.coins
    s.gems += boss.reward.gems
    s.score += 2000 * config.scoreMult
    for (const seg of boss.body) addParticles(seg.x, seg.y, boss.color, 4, 5)
    addFloater(boss.body[0].x, boss.body[0].y, "BOSS SLAIN!", "#ffce4d")
    s.boss = null
    s.shake = 1
    if (config.mode.boss) setTimeout(() => stateRef.current && !stateRef.current.gameOver && spawnBoss(), 2500)
  }

  // ---- game tick ----
  function update(dt: number) {
    const s = stateRef.current
    if (!s || s.gameOver) return
    s.time += dt

    // time limit modes
    if (config.mode.timeLimit > 0 && s.time >= config.mode.timeLimit) {
      endGame()
      return
    }

    // combo decay
    if (s.comboTimer > 0) {
      s.comboTimer -= dt
      if (s.comboTimer <= 0) s.combo = 1
    }

    // active powers timers (skip time-frozen handled below)
    for (const k of Object.keys(s.activePowers)) {
      if (k === "phoenix") continue
      s.activePowers[k] -= dt * 1000
      if (s.activePowers[k] <= 0) delete s.activePowers[k]
    }
    if (s.ghost > 0) s.ghost -= dt * 1000

    // events
    if (s.event) {
      s.event.remaining -= dt
      if (s.event.remaining <= 0) s.event = null
    } else {
      s.eventCooldown -= dt
      if (s.eventCooldown <= 0) {
        startEvent()
        s.eventCooldown = 18 + Math.random() * 14
      }
    }

    // spawn food/powers
    s.foodTimer -= dt
    const foodRate = s.event?.id === "frenzy" ? 1.2 : 3
    if (s.foodTimer <= 0 && s.food.length < (s.event?.id === "frenzy" ? 12 : 7)) {
      spawnFood(s.event?.id === "goldrain")
      s.foodTimer = foodRate
    }
    s.powerTimer -= dt
    if (s.powerTimer <= 0 && s.powers.length < 3) {
      spawnPower()
      s.powerTimer = 7 + Math.random() * 6
    }
    // power ttl
    for (let i = s.powers.length - 1; i >= 0; i--) {
      s.powers[i].ttl -= dt
      if (s.powers[i].ttl <= 0) s.powers.splice(i, 1)
    }

    // magnet
    if (s.activePowers["magnet"]) {
      const head = s.player.body[0]
      const radius = 5 + config.magnetBonus
      for (const f of s.food) {
        const d = Math.abs(f.pos.x - head.x) + Math.abs(f.pos.y - head.y)
        if (d <= radius && d > 0) {
          if (Math.random() < 0.5) {
            if (f.pos.x < head.x) f.pos.x++
            else if (f.pos.x > head.x) f.pos.x--
          } else {
            if (f.pos.y < head.y) f.pos.y++
            else if (f.pos.y > head.y) f.pos.y--
          }
        }
      }
    }

    // player speed (skill + boost)
    const baseSpeed = 7 + (s.activePowers["speed"] ? 5 : 0)
    s.player.speed = baseSpeed
    s.player.moveAcc += dt
    const playerInterval = 1 / s.player.speed
    while (s.player.moveAcc >= playerInterval && s.player.alive && !s.gameOver) {
      s.player.moveAcc -= playerInterval
      stepSnake(s.player)
    }

    // AI (frozen by timefreeze)
    const frozen = !!s.activePowers["timefreeze"]
    for (const ai of s.ais) {
      if (!ai.alive) continue
      if (frozen) continue
      ai.moveAcc += dt
      const interval = 1 / ai.speed
      while (ai.moveAcc >= interval && ai.alive) {
        ai.moveAcc -= interval
        aiThink(ai)
        stepSnake(ai)
      }
    }
    // respawn AI in endless-style modes to keep pressure
    if (["endless", "survival", "tournament"].includes(config.mode.id)) {
      const aliveCount = s.ais.filter((a: ActiveSnake) => a.alive).length
      if (aliveCount < config.mode.aiCount && Math.random() < dt * 0.3) {
        const p = AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)]
        const start = rndCell()
        if (!occupied(start)) {
          s.ais.push({
            id: "ai" + Math.random(),
            body: [start, { x: start.x - 1, y: start.y }],
            dir: "right",
            nextDir: "right",
            alive: true,
            color: p.color,
            personality: p,
            isPlayer: false,
            moveAcc: 0,
            speed: 6 + p.tier * 0.6,
          })
        }
      }
    }

    // boss
    if (s.boss) {
      s.boss.moveAcc += dt
      const interval = 1 / 4
      while (s.boss.moveAcc >= interval && s.boss) {
        s.boss.moveAcc -= interval
        stepBoss()
        if (!s.boss) break
      }
    }

    // particles & floaters
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.92
      p.vy *= 0.92
      p.life -= dt * 1.6
      if (p.life <= 0) s.particles.splice(i, 1)
    }
    for (let i = s.floaters.length - 1; i >= 0; i--) {
      const f = s.floaters[i]
      f.y -= 20 * dt
      f.life -= dt * 0.9
      if (f.life <= 0) s.floaters.splice(i, 1)
    }
    if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 2)

    // emit HUD
    const ev = evolutionForLength(s.player.body.length)
    const activePowers = Object.entries(s.activePowers)
      .filter(([k]) => k !== "phoenix")
      .map(([id, rem]) => ({
        id: id as PowerUpId,
        remaining: rem as number,
        color: POWERUP_BY_ID[id as PowerUpId].color,
      }))
    if (s.activePowers["phoenix"])
      activePowers.push({ id: "phoenix", remaining: 0, color: "#ff5d73" })
    onHud({
      score: Math.round(s.score),
      length: s.player.body.length,
      coins: Math.round(s.coins),
      gems: s.gems,
      time: Math.round(config.mode.timeLimit > 0 ? config.mode.timeLimit - s.time : s.time),
      evolution: ev.name,
      evolutionColor: ev.color,
      activePowers,
      combo: Math.round(s.combo * 10) / 10,
      shields: s.shields,
      aiAlive: s.ais.filter((a: ActiveSnake) => a.alive).length,
      boss: s.boss ? { hp: s.boss.hp, max: s.boss.maxHp, name: s.boss.name } : null,
      event: s.event ? { name: s.event.name, color: s.event.color, remaining: Math.ceil(s.event.remaining) } : null,
    })
  }

  // ---- render ----
  function draw() {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!s || !canvas) return
    const ctx = canvas.getContext("2d")!
    const W = GRID * CELL
    ctx.save()
    if (s.shake > 0) {
      ctx.translate((Math.random() - 0.5) * s.shake * 8, (Math.random() - 0.5) * s.shake * 8)
    }
    // bg
    ctx.fillStyle = "#11141f"
    ctx.fillRect(-20, -20, W + 40, W + 40)
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)"
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL, 0)
      ctx.lineTo(i * CELL, W)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL)
      ctx.lineTo(W, i * CELL)
      ctx.stroke()
    }
    // event tint
    if (s.event) {
      ctx.fillStyle = s.event.color + "12"
      ctx.fillRect(0, 0, W, W)
    }

    // food
    for (const f of s.food) {
      const cx = f.pos.x * CELL + CELL / 2
      const cy = f.pos.y * CELL + CELL / 2
      ctx.fillStyle = f.golden ? "#ffce4d" : config.foodColor
      ctx.shadowColor = f.golden ? "#ffce4d" : config.foodColor
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(cx, cy, CELL / 2 - 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // powers
    for (const pw of s.powers) {
      const cx = pw.pos.x * CELL + CELL / 2
      const cy = pw.pos.y * CELL + CELL / 2
      const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3
      ctx.fillStyle = pw.color
      ctx.shadowColor = pw.color
      ctx.shadowBlur = 16 * pulse
      ctx.beginPath()
      const r = CELL / 2 - 2
      // diamond
      ctx.moveTo(cx, cy - r)
      ctx.lineTo(cx + r, cy)
      ctx.lineTo(cx, cy + r)
      ctx.lineTo(cx - r, cy)
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = "#0c0e16"
      ctx.font = "bold 10px monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(pw.rarity[0].toUpperCase(), cx, cy + 0.5)
    }

    // boss
    if (s.boss) {
      drawSnakeBody(ctx, s.boss.body, s.boss.color, s.boss.color, 1.5, true)
    }

    // AI snakes
    for (const ai of s.ais) {
      if (!ai.alive) continue
      drawSnakeBody(ctx, ai.body, ai.color, ai.color, 1, false)
    }

    // player aura
    if (config.auraColor && s.player.alive) {
      const h = s.player.body[0]
      ctx.fillStyle = config.auraColor + "22"
      ctx.beginPath()
      ctx.arc(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, CELL * 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    // player
    if (s.player.alive) {
      const inv = s.activePowers["invincible"] > 0
      const ghost = s.ghost > 0
      ctx.globalAlpha = ghost ? 0.55 : 1
      drawSnakeBody(
        ctx,
        s.player.body,
        inv ? "#ffce4d" : config.skinColor,
        config.skinColor2 ?? config.skinColor,
        1.1,
        true,
        config.trailColor,
      )
      ctx.globalAlpha = 1
      // shield ring
      if (s.shields > 0) {
        const h = s.player.body[0]
        ctx.strokeStyle = "#5fd3e0"
        ctx.lineWidth = 2
        ctx.shadowColor = "#5fd3e0"
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(h.x * CELL + CELL / 2, h.y * CELL + CELL / 2, CELL, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // particles
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // floaters
    for (const f of s.floaters) {
      ctx.globalAlpha = Math.max(0, f.life)
      ctx.fillStyle = f.color
      ctx.font = "bold 13px monospace"
      ctx.textAlign = "center"
      ctx.fillText(f.text, f.x, f.y)
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  function drawSnakeBody(
    ctx: CanvasRenderingContext2D,
    body: Vec[],
    color: string,
    color2: string,
    scale: number,
    glow: boolean,
    trail?: string,
  ) {
    for (let i = body.length - 1; i >= 0; i--) {
      const seg = body[i]
      const cx = seg.x * CELL + CELL / 2
      const cy = seg.y * CELL + CELL / 2
      const t = i / Math.max(1, body.length)
      if (trail && i > 0 && i % 2 === 0) {
        ctx.globalAlpha = 0.25 * (1 - t)
        ctx.fillStyle = trail
        ctx.beginPath()
        ctx.arc(cx, cy, (CELL / 2) * scale + 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
      ctx.fillStyle = i === 0 ? "#ffffff" : t > 0.5 ? color2 : color
      if (glow) {
        ctx.shadowColor = color
        ctx.shadowBlur = i === 0 ? 14 : 6
      }
      const r = (CELL / 2 - 1) * scale * (i === 0 ? 1.05 : 1 - t * 0.25)
      roundRect(ctx, cx - r, cy - r, r * 2, r * 2, 4)
      ctx.fill()
      ctx.shadowBlur = 0
    }
    // eyes on head
    if (body.length) {
      const h = body[0]
      ctx.fillStyle = "#11141f"
      ctx.beginPath()
      ctx.arc(h.x * CELL + CELL / 2 - 3, h.y * CELL + CELL / 2 - 2, 2, 0, Math.PI * 2)
      ctx.arc(h.x * CELL + CELL / 2 + 3, h.y * CELL + CELL / 2 - 2, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  // loop
  useEffect(() => {
    init()
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready) return
    const loop = (t: number) => {
      if (!lastRef.current) lastRef.current = t
      let dt = (t - lastRef.current) / 1000
      lastRef.current = t
      if (dt > 0.1) dt = 0.1
      if (!pausedRef.current) update(dt)
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // controls
  useEffect(() => {
    const setDir = (d: Dir) => {
      const s = stateRef.current
      if (!s) return
      if (d !== OPP[s.player.dir]) s.player.nextDir = d
    }
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
        W: "up",
        S: "down",
        A: "left",
        D: "right",
      }
      if (map[e.key]) {
        e.preventDefault()
        setDir(map[e.key])
      }
    }
    window.addEventListener("keydown", onKey)
    ;(window as any).__snakeSetDir = setDir
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // touch swipe
  const touchRef = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return
    const dx = e.touches[0].clientX - touchRef.current.x
    const dy = e.touches[0].clientY - touchRef.current.y
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
    const setDir = (window as any).__snakeSetDir
    if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? "right" : "left")
    else setDir(dy > 0 ? "down" : "up")
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  return (
    <canvas
      ref={canvasRef}
      width={GRID * CELL}
      height={GRID * CELL}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      className="w-full max-w-[560px] touch-none rounded-xl border border-border bg-[#11141f] box-glow"
      style={{ aspectRatio: "1 / 1", imageRendering: "auto" }}
      aria-label="Snake game board"
    />
  )
}
