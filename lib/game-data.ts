// Central game content + type definitions for Neon Serpent

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic"

export const RARITY_META: Record<
  Rarity,
  { label: string; color: string; glow: string; weight: number }
> = {
  common: { label: "Common", color: "#9aa5b1", glow: "rgba(154,165,177,0.5)", weight: 60 },
  rare: { label: "Rare", color: "#3bc9db", glow: "rgba(59,201,219,0.6)", weight: 25 },
  epic: { label: "Epic", color: "#b07cff", glow: "rgba(176,124,255,0.6)", weight: 10 },
  legendary: { label: "Legendary", color: "#ffce4d", glow: "rgba(255,206,77,0.7)", weight: 4 },
  mythic: { label: "Mythic", color: "#ff5d73", glow: "rgba(255,93,115,0.75)", weight: 1 },
}

// ---------------- Ranks ----------------
export interface Rank {
  id: string
  name: string
  minScore: number
  color: string
  reward: { coins: number; gems: number; title?: string }
}

export const RANKS: Rank[] = [
  { id: "bronze", name: "Bronze", minScore: 0, color: "#cd7f32", reward: { coins: 0, gems: 0 } },
  { id: "silver", name: "Silver", minScore: 1500, color: "#c0c0c0", reward: { coins: 500, gems: 5, title: "Silvertongue" } },
  { id: "gold", name: "Gold", minScore: 5000, color: "#ffce4d", reward: { coins: 1200, gems: 10, title: "Golden Coil" } },
  { id: "platinum", name: "Platinum", minScore: 12000, color: "#5fd3e0", reward: { coins: 2500, gems: 20, title: "Platinum Fang" } },
  { id: "diamond", name: "Diamond", minScore: 25000, color: "#7fd4ff", reward: { coins: 5000, gems: 35, title: "Diamond Scale" } },
  { id: "master", name: "Master", minScore: 50000, color: "#b07cff", reward: { coins: 9000, gems: 60, title: "Serpent Master" } },
  { id: "grandmaster", name: "Grandmaster", minScore: 90000, color: "#ff8fb3", reward: { coins: 15000, gems: 100, title: "Grandmaster" } },
  { id: "legendary", name: "Legendary", minScore: 160000, color: "#ffce4d", reward: { coins: 30000, gems: 200, title: "Living Legend" } },
  { id: "mythic", name: "Mythic", minScore: 300000, color: "#ff5d73", reward: { coins: 75000, gems: 500, title: "Mythic Wyrm" } },
]

export function rankForScore(best: number): { rank: Rank; next: Rank | null; index: number } {
  let index = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (best >= RANKS[i].minScore) index = i
  }
  return { rank: RANKS[index], next: RANKS[index + 1] ?? null, index }
}

// ---------------- Power-ups ----------------
export type PowerUpId =
  | "speed"
  | "multiplier"
  | "shield"
  | "magnet"
  | "invincible"
  | "ghost"
  | "coinmult"
  | "timefreeze"
  | "blackhole"
  | "phoenix"

export interface PowerUpDef {
  id: PowerUpId
  name: string
  desc: string
  rarity: Rarity
  color: string
  icon: string // lucide name
  duration: number // ms, 0 = instant
}

export const POWERUPS: PowerUpDef[] = [
  { id: "speed", name: "Speed Boost", desc: "Move faster for a short burst.", rarity: "common", color: "#3bc9db", icon: "zap", duration: 6000 },
  { id: "multiplier", name: "Score x2", desc: "Double all score gains.", rarity: "common", color: "#7bed9f", icon: "x", duration: 8000 },
  { id: "shield", name: "Shield", desc: "Absorb one fatal collision.", rarity: "rare", color: "#5fd3e0", icon: "shield", duration: 0 },
  { id: "magnet", name: "Magnet", desc: "Pull nearby food toward you.", rarity: "rare", color: "#ff9f43", icon: "magnet", duration: 9000 },
  { id: "coinmult", name: "Coin Rush", desc: "Triple coins from food.", rarity: "rare", color: "#ffce4d", icon: "coins", duration: 9000 },
  { id: "ghost", name: "Ghost Mode", desc: "Pass through your own tail.", rarity: "epic", color: "#b07cff", icon: "ghost", duration: 7000 },
  { id: "timefreeze", name: "Time Freeze", desc: "Freeze AI snakes in place.", rarity: "epic", color: "#7fd4ff", icon: "snowflake", duration: 5000 },
  { id: "invincible", name: "Invincibility", desc: "Nothing can kill you.", rarity: "legendary", color: "#ffce4d", icon: "star", duration: 6000 },
  { id: "blackhole", name: "Black Hole", desc: "Devour every food on the board.", rarity: "legendary", color: "#b07cff", icon: "circle-dot", duration: 0 },
  { id: "phoenix", name: "Phoenix Heart", desc: "Revive once on death with full glory.", rarity: "mythic", color: "#ff5d73", icon: "flame", duration: 0 },
]

export const POWERUP_BY_ID: Record<PowerUpId, PowerUpDef> = Object.fromEntries(
  POWERUPS.map((p) => [p.id, p]),
) as Record<PowerUpId, PowerUpDef>

// ---------------- Snake evolution ----------------
export interface EvolutionStage {
  id: string
  name: string
  minLength: number
  color: string
  accent: string
  desc: string
}

export const EVOLUTIONS: EvolutionStage[] = [
  { id: "hatchling", name: "Hatchling", minLength: 0, color: "#7bed9f", accent: "#2ed573", desc: "A humble newborn serpent." },
  { id: "garter", name: "Garter Snake", minLength: 12, color: "#2ed573", accent: "#ffce4d", desc: "Quick and curious." },
  { id: "python", name: "Python", minLength: 24, color: "#26c6da", accent: "#7fd4ff", desc: "Powerful constrictor." },
  { id: "cobra", name: "King Cobra", minLength: 40, color: "#5fd3e0", accent: "#ffce4d", desc: "Hooded and deadly." },
  { id: "viper", name: "Crimson Viper", minLength: 60, color: "#ff6b81", accent: "#ff5d73", desc: "Venom-fanged predator." },
  { id: "serpent", name: "Sea Serpent", minLength: 85, color: "#7fd4ff", accent: "#3bc9db", desc: "Ancient ocean leviathan." },
  { id: "dragon", name: "Wyrm Dragon", minLength: 115, color: "#b07cff", accent: "#ff5d73", desc: "Scaled in living flame." },
  { id: "mythic", name: "Celestial Wyrm", minLength: 160, color: "#ffce4d", accent: "#ff5d73", desc: "A myth made manifest." },
]

export function evolutionForLength(len: number): EvolutionStage {
  let stage = EVOLUTIONS[0]
  for (const e of EVOLUTIONS) if (len >= e.minLength) stage = e
  return stage
}

// ---------------- Shop cosmetics ----------------
export type CosmeticType = "skin" | "trail" | "food" | "effect" | "aura"

export interface Cosmetic {
  id: string
  name: string
  type: CosmeticType
  rarity: Rarity
  cost: { coins?: number; gems?: number }
  color: string
  color2?: string
  desc: string
}

export const COSMETICS: Cosmetic[] = [
  // skins
  { id: "skin_default", name: "Neon Green", type: "skin", rarity: "common", cost: { coins: 0 }, color: "#2ed573", desc: "The classic serpent." },
  { id: "skin_aqua", name: "Aqua Pulse", type: "skin", rarity: "common", cost: { coins: 800 }, color: "#3bc9db", desc: "Cool flowing waves." },
  { id: "skin_amber", name: "Amber Glow", type: "skin", rarity: "rare", cost: { coins: 2200 }, color: "#ffce4d", desc: "Warm golden scales." },
  { id: "skin_rose", name: "Rose Venom", type: "skin", rarity: "rare", cost: { coins: 2600 }, color: "#ff6b81", desc: "Sleek crimson sheen." },
  { id: "skin_void", name: "Void Walker", type: "skin", rarity: "epic", cost: { gems: 45 }, color: "#b07cff", color2: "#7fd4ff", desc: "Shifting cosmic hues." },
  { id: "skin_prism", name: "Prismatic", type: "skin", rarity: "legendary", cost: { gems: 120 }, color: "#ffce4d", color2: "#ff5d73", desc: "Refracts every color." },
  { id: "skin_eclipse", name: "Eclipse Mythic", type: "skin", rarity: "mythic", cost: { gems: 400 }, color: "#ff5d73", color2: "#b07cff", desc: "Forged from a dying star." },
  // trails
  { id: "trail_none", name: "No Trail", type: "trail", rarity: "common", cost: { coins: 0 }, color: "#9aa5b1", desc: "Clean and simple." },
  { id: "trail_spark", name: "Spark Trail", type: "trail", rarity: "rare", cost: { coins: 1800 }, color: "#ffce4d", desc: "Leaves glowing sparks." },
  { id: "trail_frost", name: "Frost Trail", type: "trail", rarity: "epic", cost: { gems: 40 }, color: "#7fd4ff", desc: "Icy shimmering wake." },
  { id: "trail_inferno", name: "Inferno Trail", type: "trail", rarity: "legendary", cost: { gems: 110 }, color: "#ff5d73", desc: "Burning ember path." },
  // food
  { id: "food_apple", name: "Classic Apple", type: "food", rarity: "common", cost: { coins: 0 }, color: "#ff5d73", desc: "Default treat." },
  { id: "food_gem", name: "Gem Fruit", type: "food", rarity: "rare", cost: { coins: 1500 }, color: "#7fd4ff", desc: "Glittering snacks." },
  { id: "food_star", name: "Star Morsel", type: "food", rarity: "epic", cost: { gems: 35 }, color: "#ffce4d", desc: "Twinkling food bites." },
  // effects
  { id: "fx_none", name: "No Effect", type: "effect", rarity: "common", cost: { coins: 0 }, color: "#9aa5b1", desc: "Minimalist." },
  { id: "fx_glow", name: "Pulse Glow", type: "effect", rarity: "rare", cost: { coins: 2000 }, color: "#2ed573", desc: "Soft pulsing aura." },
  { id: "fx_lightning", name: "Lightning Field", type: "effect", rarity: "legendary", cost: { gems: 130 }, color: "#7fd4ff", desc: "Crackling energy field." },
  // auras
  { id: "aura_none", name: "No Aura", type: "aura", rarity: "common", cost: { coins: 0 }, color: "#9aa5b1", desc: "No aura." },
  { id: "aura_gold", name: "Golden Aura", type: "aura", rarity: "epic", cost: { gems: 60 }, color: "#ffce4d", desc: "Radiant gold halo." },
  { id: "aura_cosmic", name: "Cosmic Aura", type: "aura", rarity: "mythic", cost: { gems: 450 }, color: "#b07cff", color2: "#ff5d73", desc: "Bends light around you." },
]

// ---------------- Pets ----------------
export interface PetDef {
  id: string
  name: string
  rarity: Rarity
  color: string
  bonus: string
  bonusType: "score" | "coin" | "magnet" | "luck" | "shield"
  baseValue: number // % per level
  desc: string
}

export const PETS: PetDef[] = [
  { id: "pet_sparrow", name: "Glow Sparrow", rarity: "common", color: "#7bed9f", bonus: "Score", bonusType: "score", baseValue: 3, desc: "+score per food." },
  { id: "pet_kit", name: "Coin Kit", rarity: "rare", color: "#ffce4d", bonus: "Coins", bonusType: "coin", baseValue: 5, desc: "+coin gain." },
  { id: "pet_orb", name: "Magnet Orb", rarity: "rare", color: "#3bc9db", bonus: "Magnet", bonusType: "magnet", baseValue: 6, desc: "+pickup radius." },
  { id: "pet_fox", name: "Lucky Fox", rarity: "epic", color: "#ff9f43", bonus: "Luck", bonusType: "luck", baseValue: 4, desc: "+rare drop luck." },
  { id: "pet_golem", name: "Aegis Golem", rarity: "epic", color: "#5fd3e0", bonus: "Shield", bonusType: "shield", baseValue: 5, desc: "+shield chance." },
  { id: "pet_phoenix", name: "Ember Phoenix", rarity: "legendary", color: "#ff5d73", bonus: "Score", bonusType: "score", baseValue: 8, desc: "Big score boost." },
  { id: "pet_drake", name: "Astral Drake", rarity: "mythic", color: "#b07cff", bonus: "Luck", bonusType: "luck", baseValue: 12, desc: "Massive luck boost." },
]

export const PET_BY_ID: Record<string, PetDef> = Object.fromEntries(PETS.map((p) => [p.id, p]))

export function petEvolveStage(level: number) {
  if (level >= 20) return { name: "Ascended", ring: "#ff5d73" }
  if (level >= 10) return { name: "Evolved", ring: "#ffce4d" }
  if (level >= 5) return { name: "Grown", ring: "#b07cff" }
  return { name: "Baby", ring: "#9aa5b1" }
}

// ---------------- Crates ----------------
export interface CrateDef {
  id: string
  name: string
  rarity: Rarity
  cost: { coins?: number; gems?: number }
  color: string
  // odds per item rarity
  odds: Record<Rarity, number>
}

export const CRATES: CrateDef[] = [
  { id: "crate_common", name: "Common Crate", rarity: "common", cost: { coins: 1000 }, color: "#9aa5b1", odds: { common: 70, rare: 23, epic: 6, legendary: 0.9, mythic: 0.1 } },
  { id: "crate_rare", name: "Rare Crate", rarity: "rare", cost: { coins: 4000 }, color: "#3bc9db", odds: { common: 40, rare: 40, epic: 16, legendary: 3.5, mythic: 0.5 } },
  { id: "crate_epic", name: "Epic Crate", rarity: "epic", cost: { gems: 50 }, color: "#b07cff", odds: { common: 15, rare: 40, epic: 33, legendary: 10, mythic: 2 } },
  { id: "crate_legendary", name: "Legendary Crate", rarity: "legendary", cost: { gems: 150 }, color: "#ffce4d", odds: { common: 0, rare: 25, epic: 45, legendary: 25, mythic: 5 } },
  { id: "crate_mythic", name: "Mythic Crate", rarity: "mythic", cost: { gems: 500 }, color: "#ff5d73", odds: { common: 0, rare: 0, epic: 40, legendary: 45, mythic: 15 } },
]

// ---------------- Achievements ----------------
export interface AchievementDef {
  id: string
  name: string
  desc: string
  hidden?: boolean
  reward: { coins?: number; gems?: number }
  // stat key + threshold, evaluated against profile.stats
  stat: string
  threshold: number
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_blood", name: "First Slither", desc: "Play your first game.", reward: { coins: 100 }, stat: "gamesPlayed", threshold: 1 },
  { id: "score_1k", name: "Getting Warm", desc: "Score 1,000 in a single run.", reward: { coins: 300 }, stat: "bestScore", threshold: 1000 },
  { id: "score_10k", name: "High Roller", desc: "Score 10,000 in a single run.", reward: { coins: 1500, gems: 10 }, stat: "bestScore", threshold: 10000 },
  { id: "score_50k", name: "Score Demon", desc: "Score 50,000 in a single run.", reward: { gems: 50 }, stat: "bestScore", threshold: 50000 },
  { id: "len_50", name: "Long Boy", desc: "Reach a length of 50.", reward: { coins: 600 }, stat: "bestLength", threshold: 50 },
  { id: "len_120", name: "Titan Serpent", desc: "Reach a length of 120.", reward: { gems: 30 }, stat: "bestLength", threshold: 120 },
  { id: "survive_300", name: "Survivor", desc: "Survive 5 minutes in one run.", reward: { coins: 1000 }, stat: "bestSurvival", threshold: 300 },
  { id: "coins_100k", name: "Coin Hoarder", desc: "Earn 100,000 coins total.", reward: { gems: 25 }, stat: "totalCoinsEarned", threshold: 100000 },
  { id: "ai_10", name: "AI Hunter", desc: "Defeat 10 AI snakes.", reward: { coins: 1200 }, stat: "aiDefeated", threshold: 10 },
  { id: "ai_100", name: "AI Apex", desc: "Defeat 100 AI snakes.", reward: { gems: 60 }, stat: "aiDefeated", threshold: 100 },
  { id: "boss_1", name: "Giant Slayer", desc: "Defeat your first boss.", reward: { gems: 20 }, stat: "bossesDefeated", threshold: 1 },
  { id: "boss_10", name: "Boss Breaker", desc: "Defeat 10 bosses.", reward: { gems: 100 }, stat: "bossesDefeated", threshold: 10 },
  { id: "crates_25", name: "Crate Cracker", desc: "Open 25 crates.", reward: { coins: 2000 }, stat: "cratesOpened", threshold: 25 },
  { id: "rebirth_1", name: "Reborn", desc: "Prestige for the first time.", reward: { gems: 50 }, stat: "rebirths", threshold: 1 },
  { id: "rebirth_5", name: "Eternal Cycle", desc: "Prestige 5 times.", reward: { gems: 250 }, stat: "rebirths", threshold: 5 },
  { id: "powerups_500", name: "Power Junkie", desc: "Collect 500 power-ups.", reward: { coins: 3000 }, stat: "powerupsCollected", threshold: 500 },
  // hidden / secret
  { id: "secret_mythic", name: "??? Touched by Myth", desc: "Find a Mythic power-up in the wild.", hidden: true, reward: { gems: 150 }, stat: "mythicPowerups", threshold: 1 },
  { id: "secret_ouroboros", name: "??? Ouroboros", desc: "Reach length 250 in one run.", hidden: true, reward: { gems: 300 }, stat: "bestLength", threshold: 250 },
]

// ---------------- Missions ----------------
export interface MissionDef {
  id: string
  type: "daily" | "weekly" | "longterm"
  name: string
  stat: string // accumulator key
  target: number
  reward: { coins?: number; gems?: number }
}

export const DAILY_MISSIONS: MissionDef[] = [
  { id: "d_play3", type: "daily", name: "Play 3 games", stat: "games", target: 3, reward: { coins: 300 } },
  { id: "d_food100", type: "daily", name: "Eat 100 food", stat: "food", target: 100, reward: { coins: 400 } },
  { id: "d_ai5", type: "daily", name: "Defeat 5 AI snakes", stat: "ai", target: 5, reward: { coins: 500, gems: 3 } },
  { id: "d_power10", type: "daily", name: "Collect 10 power-ups", stat: "power", target: 10, reward: { coins: 350 } },
]

export const WEEKLY_MISSIONS: MissionDef[] = [
  { id: "w_score100k", type: "weekly", name: "Score 100k total", stat: "score", target: 100000, reward: { coins: 4000, gems: 15 } },
  { id: "w_boss3", type: "weekly", name: "Defeat 3 bosses", stat: "boss", target: 3, reward: { gems: 30 } },
  { id: "w_crate5", type: "weekly", name: "Open 5 crates", stat: "crate", target: 5, reward: { coins: 3000 } },
]

export const LONGTERM_MISSIONS: MissionDef[] = [
  { id: "l_ai500", type: "longterm", name: "Defeat 500 AI snakes", stat: "aiDefeated", target: 500, reward: { gems: 200 } },
  { id: "l_games500", type: "longterm", name: "Play 500 games", stat: "gamesPlayed", target: 500, reward: { gems: 150 } },
  { id: "l_score1m", type: "longterm", name: "Earn 1,000,000 lifetime score", stat: "totalScore", target: 1000000, reward: { gems: 500 } },
]

// ---------------- Skill tree ----------------
export interface SkillDef {
  id: string
  name: string
  branch: "speed" | "economy" | "score" | "survival" | "luck" | "power"
  desc: string
  maxLevel: number
  costPerLevel: number // skill points
  valuePerLevel: number
}

export const SKILLS: SkillDef[] = [
  { id: "sk_speed", name: "Swift Coil", branch: "speed", desc: "+control speed cap", maxLevel: 5, costPerLevel: 1, valuePerLevel: 4 },
  { id: "sk_accel", name: "Adrenaline", branch: "speed", desc: "Longer speed boosts", maxLevel: 5, costPerLevel: 1, valuePerLevel: 8 },
  { id: "sk_coins", name: "Midas Touch", branch: "economy", desc: "+% coins earned", maxLevel: 8, costPerLevel: 1, valuePerLevel: 5 },
  { id: "sk_gems", name: "Gem Sense", branch: "economy", desc: "+% gem find chance", maxLevel: 5, costPerLevel: 2, valuePerLevel: 3 },
  { id: "sk_score", name: "Combo Mastery", branch: "score", desc: "+% score per food", maxLevel: 8, costPerLevel: 1, valuePerLevel: 6 },
  { id: "sk_multi", name: "Multiplier Lord", branch: "score", desc: "Longer score multipliers", maxLevel: 5, costPerLevel: 2, valuePerLevel: 10 },
  { id: "sk_armor", name: "Iron Scales", branch: "survival", desc: "+shield duration", maxLevel: 5, costPerLevel: 1, valuePerLevel: 8 },
  { id: "sk_revive", name: "Second Wind", branch: "survival", desc: "+revive chance on death", maxLevel: 3, costPerLevel: 3, valuePerLevel: 8 },
  { id: "sk_luck", name: "Fortune", branch: "luck", desc: "+% rare power-up spawn", maxLevel: 6, costPerLevel: 2, valuePerLevel: 4 },
  { id: "sk_crate", name: "Lucky Crates", branch: "luck", desc: "+% crate luck", maxLevel: 5, costPerLevel: 2, valuePerLevel: 5 },
  { id: "sk_power", name: "Potent Boosts", branch: "power", desc: "+% power-up effectiveness", maxLevel: 6, costPerLevel: 2, valuePerLevel: 6 },
  { id: "sk_pdur", name: "Lingering Power", branch: "power", desc: "+power-up duration", maxLevel: 5, costPerLevel: 1, valuePerLevel: 7 },
]

export const SKILL_BRANCHES = {
  speed: { name: "Speed", color: "#3bc9db", icon: "wind" },
  economy: { name: "Economy", color: "#ffce4d", icon: "coins" },
  score: { name: "Score", color: "#7bed9f", icon: "trending-up" },
  survival: { name: "Survival", color: "#ff6b81", icon: "shield" },
  luck: { name: "Luck", color: "#b07cff", icon: "clover" },
  power: { name: "Power", color: "#7fd4ff", icon: "zap" },
} as const

// ---------------- Prestige / Rebirth ----------------
export interface RebirthTier {
  tier: number
  name: string
  requiredScore: number
  bonus: string
  coinMult: number
  gemMult: number
  skillPoints: number
  cosmetic?: string
}

export const REBIRTH_TIERS: RebirthTier[] = [
  { tier: 1, name: "Ascendant", requiredScore: 50000, bonus: "+25% coins, +2 skill pts", coinMult: 0.25, gemMult: 0.1, skillPoints: 2, cosmetic: "aura_gold" },
  { tier: 2, name: "Transcendent", requiredScore: 150000, bonus: "+60% coins, +4 skill pts", coinMult: 0.6, gemMult: 0.25, skillPoints: 4 },
  { tier: 3, name: "Celestial", requiredScore: 400000, bonus: "+120% coins, +6 skill pts", coinMult: 1.2, gemMult: 0.5, skillPoints: 6, cosmetic: "skin_prism" },
  { tier: 4, name: "Eternal", requiredScore: 1000000, bonus: "+250% coins, +10 skill pts", coinMult: 2.5, gemMult: 1, skillPoints: 10 },
  { tier: 5, name: "Ouroboros", requiredScore: 2500000, bonus: "+500% coins, mythic aura", coinMult: 5, gemMult: 2, skillPoints: 15, cosmetic: "aura_cosmic" },
]

// ---------------- Game modes ----------------
export interface GameModeDef {
  id: string
  name: string
  desc: string
  icon: string
  color: string
  // config flags consumed by engine
  lives: number
  aiCount: number
  boss: boolean
  timeLimit: number // seconds, 0 = none
  rewardMult: number
}

export const GAME_MODES: GameModeDef[] = [
  { id: "classic", name: "Classic", desc: "The pure snake experience with power-ups.", icon: "gamepad-2", color: "#2ed573", lives: 1, aiCount: 2, boss: false, timeLimit: 0, rewardMult: 1 },
  { id: "endless", name: "Endless", desc: "Survive as long as you can, escalating chaos.", icon: "infinity", color: "#3bc9db", lives: 1, aiCount: 3, boss: false, timeLimit: 0, rewardMult: 1.2 },
  { id: "hardcore", name: "Hardcore", desc: "One life. No mercy. Triple rewards.", icon: "skull", color: "#ff5d73", lives: 1, aiCount: 4, boss: false, timeLimit: 0, rewardMult: 3 },
  { id: "timeattack", name: "Time Attack", desc: "Score as much as possible in 90 seconds.", icon: "timer", color: "#ffce4d", lives: 1, aiCount: 2, boss: false, timeLimit: 90, rewardMult: 1.5 },
  { id: "tournament", name: "AI Tournament", desc: "Outlast a swarm of elite AI snakes.", icon: "trophy", color: "#b07cff", lives: 1, aiCount: 6, boss: false, timeLimit: 0, rewardMult: 2 },
  { id: "bossrush", name: "Boss Rush", desc: "Face wave after wave of giant bosses.", icon: "flame", color: "#ff8fb3", lives: 1, aiCount: 1, boss: true, timeLimit: 0, rewardMult: 2.5 },
  { id: "challenge", name: "Challenge", desc: "Tight arena, fast pace, big payouts.", icon: "target", color: "#7fd4ff", lives: 1, aiCount: 3, boss: false, timeLimit: 120, rewardMult: 1.8 },
  { id: "survival", name: "Survival", desc: "Hordes close in. How long can you last?", icon: "heart-pulse", color: "#7bed9f", lives: 1, aiCount: 5, boss: false, timeLimit: 0, rewardMult: 2 },
]

// ---------------- World events ----------------
export interface WorldEventDef {
  id: string
  name: string
  desc: string
  color: string
  icon: string
}

export const WORLD_EVENTS: WorldEventDef[] = [
  { id: "goldrain", name: "Golden Food Rain", desc: "Food everywhere, all worth bonus coins!", color: "#ffce4d", icon: "cloud-rain" },
  { id: "coinstorm", name: "Coin Storm", desc: "Every pickup showers extra coins.", color: "#ffce4d", icon: "coins" },
  { id: "meteor", name: "Meteor Shower", desc: "Dodge falling hazards for big score.", color: "#ff5d73", icon: "meteor" },
  { id: "frenzy", name: "Food Frenzy", desc: "Food spawns at double speed.", color: "#7bed9f", icon: "utensils" },
  { id: "doublexp", name: "Double XP", desc: "All score doubled for a while.", color: "#3bc9db", icon: "sparkles" },
  { id: "invasion", name: "Boss Invasion", desc: "A rare boss appears! Defeat it for loot.", color: "#b07cff", icon: "flame" },
]

// ---------------- AI personalities ----------------
export const AI_PERSONALITIES = [
  { id: "rookie", name: "Rookie", color: "#9aa5b1", aggression: 0.2, smarts: 0.3, tier: 1 },
  { id: "hunter", name: "Hunter", color: "#ff9f43", aggression: 0.7, smarts: 0.5, tier: 2 },
  { id: "guardian", name: "Guardian", color: "#5fd3e0", aggression: 0.3, smarts: 0.6, tier: 2 },
  { id: "reaper", name: "Reaper", color: "#ff5d73", aggression: 0.9, smarts: 0.75, tier: 3 },
  { id: "phantom", name: "Phantom", color: "#b07cff", aggression: 0.5, smarts: 0.9, tier: 4 },
] as const

export type AIPersonality = (typeof AI_PERSONALITIES)[number]

// ---------------- Bosses ----------------
export const BOSSES = [
  { id: "giant", name: "Giant Serpent", color: "#2ed573", hp: 8, reward: { coins: 3000, gems: 10 } },
  { id: "hydra", name: "Hydra", color: "#7fd4ff", hp: 12, reward: { coins: 5000, gems: 20 } },
  { id: "dragon", name: "Elder Dragon", color: "#ff5d73", hp: 18, reward: { coins: 9000, gems: 40 } },
  { id: "wyrm", name: "Void Wyrm", color: "#b07cff", hp: 26, reward: { coins: 15000, gems: 80 } },
] as const

export function rarityFromOdds(odds: Record<Rarity, number>, luck = 0): Rarity {
  // luck shifts weight toward higher rarities
  const adj = { ...odds }
  const boost = 1 + luck / 100
  adj.legendary *= boost
  adj.mythic *= boost * boost
  adj.epic *= 1 + luck / 200
  const total = Object.values(adj).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  const order: Rarity[] = ["mythic", "legendary", "epic", "rare", "common"]
  for (const rar of order) {
    if (r < adj[rar]) return rar
    r -= adj[rar]
  }
  return "common"
}
