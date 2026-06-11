"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  ACHIEVEMENTS,
  COSMETICS,
  CRATES,
  DAILY_MISSIONS,
  LONGTERM_MISSIONS,
  PETS,
  PET_BY_ID,
  REBIRTH_TIERS,
  SKILLS,
  WEEKLY_MISSIONS,
  rankForScore,
  rarityFromOdds,
  type Cosmetic,
  type Rarity,
} from "./game-data"

export interface PetState {
  id: string
  level: number
  xp: number
}

export interface MissionProgress {
  [missionId: string]: number
}

export interface ProfileStats {
  gamesPlayed: number
  bestScore: number
  bestLength: number
  bestSurvival: number
  totalScore: number
  totalCoinsEarned: number
  aiDefeated: number
  bossesDefeated: number
  cratesOpened: number
  rebirths: number
  powerupsCollected: number
  mythicPowerups: number
  foodEaten: number
}

const defaultStats: ProfileStats = {
  gamesPlayed: 0,
  bestScore: 0,
  bestLength: 0,
  bestSurvival: 0,
  totalScore: 0,
  totalCoinsEarned: 0,
  aiDefeated: 0,
  bossesDefeated: 0,
  cratesOpened: 0,
  rebirths: 0,
  powerupsCollected: 0,
  mythicPowerups: 0,
  foodEaten: 0,
}

export interface GameState {
  coins: number
  gems: number
  skillPoints: number
  stats: ProfileStats
  rebirthTier: number
  ownedCosmetics: string[]
  equipped: { skin: string; trail: string; food: string; effect: string; aura: string }
  pets: PetState[]
  activePet: string | null
  skillLevels: Record<string, number>
  unlockedAchievements: string[]
  claimedAchievements: string[]
  title: string | null
  unlockedTitles: string[]
  // missions
  dailyProgress: MissionProgress
  weeklyProgress: MissionProgress
  claimedMissions: string[]
  lastDailyReset: string
  lastWeeklyReset: string
  // collection
  inventory: string[] // crate-pulled collectibles (cosmetic ids + pet ids + special)
  // actions
  addCurrency: (coins: number, gems: number) => void
  spend: (coins: number, gems: number) => boolean
  recordRun: (data: RunResult) => RunRewards
  buyCosmetic: (id: string) => boolean
  equip: (c: Cosmetic) => void
  buyCrate: (crateId: string) => CratePull | null
  upgradePet: (id: string) => void
  setActivePet: (id: string | null) => void
  buySkill: (id: string) => boolean
  claimAchievement: (id: string) => void
  claimMission: (id: string) => void
  setTitle: (t: string | null) => void
  rebirth: () => boolean
  resetSave: () => void
  _checkAchievements: () => void
  _checkDailyReset: () => void
}

export interface RunResult {
  mode: string
  score: number
  length: number
  survival: number // seconds
  coins: number
  gems: number
  aiDefeated: number
  bossesDefeated: number
  powerups: number
  food: number
  mythicPowerup: boolean
  rewardMult: number
}

export interface RunRewards {
  coins: number
  gems: number
  newRank: boolean
  rankName?: string
  newAchievements: string[]
}

export interface CratePull {
  rarity: Rarity
  type: "cosmetic" | "pet" | "coins" | "gems" | "title"
  itemId?: string
  name: string
  color: string
  amount?: number
}

function todayKey() {
  return new Date().toDateString()
}
function weekKey() {
  const d = new Date()
  const onejan = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      coins: 500,
      gems: 10,
      skillPoints: 0,
      stats: { ...defaultStats },
      rebirthTier: 0,
      ownedCosmetics: ["skin_default", "trail_none", "food_apple", "fx_none", "aura_none"],
      equipped: { skin: "skin_default", trail: "trail_none", food: "food_apple", effect: "fx_none", aura: "aura_none" },
      pets: [],
      activePet: null,
      skillLevels: {},
      unlockedAchievements: [],
      claimedAchievements: [],
      title: null,
      unlockedTitles: [],
      dailyProgress: {},
      weeklyProgress: {},
      claimedMissions: [],
      lastDailyReset: todayKey(),
      lastWeeklyReset: weekKey(),
      inventory: [],

      addCurrency: (coins, gems) =>
        set((s) => ({
          coins: s.coins + coins,
          gems: s.gems + gems,
          stats: { ...s.stats, totalCoinsEarned: s.stats.totalCoinsEarned + Math.max(0, coins) },
        })),

      spend: (coins, gems) => {
        const s = get()
        if (s.coins < coins || s.gems < gems) return false
        set({ coins: s.coins - coins, gems: s.gems - gems })
        return true
      },

      recordRun: (data) => {
        get()._checkDailyReset()
        const s = get()
        const skillCoin = (s.skillLevels["sk_coins"] ?? 0) * 5
        const rebirthBonus = REBIRTH_TIERS.slice(0, s.rebirthTier).reduce((a, t) => a + t.coinMult, 0)
        const coinMult = data.rewardMult * (1 + skillCoin / 100 + rebirthBonus)
        const earnedCoins = Math.round(data.coins * coinMult)
        const earnedGems = data.gems

        const prevBest = s.stats.bestScore
        const newStats: ProfileStats = {
          ...s.stats,
          gamesPlayed: s.stats.gamesPlayed + 1,
          bestScore: Math.max(s.stats.bestScore, data.score),
          bestLength: Math.max(s.stats.bestLength, data.length),
          bestSurvival: Math.max(s.stats.bestSurvival, data.survival),
          totalScore: s.stats.totalScore + data.score,
          totalCoinsEarned: s.stats.totalCoinsEarned + earnedCoins,
          aiDefeated: s.stats.aiDefeated + data.aiDefeated,
          bossesDefeated: s.stats.bossesDefeated + data.bossesDefeated,
          powerupsCollected: s.stats.powerupsCollected + data.powerups,
          mythicPowerups: s.stats.mythicPowerups + (data.mythicPowerup ? 1 : 0),
          foodEaten: s.stats.foodEaten + data.food,
        }

        // rank check
        const before = rankForScore(prevBest)
        const after = rankForScore(newStats.bestScore)
        let bonusCoins = 0
        let bonusGems = 0
        let rankName: string | undefined
        const newTitles = [...s.unlockedTitles]
        if (after.index > before.index) {
          for (let i = before.index + 1; i <= after.index; i++) {
            bonusCoins += RANKS_REWARD(i).coins
            bonusGems += RANKS_REWARD(i).gems
            const t = RANKS_REWARD(i).title
            if (t && !newTitles.includes(t)) newTitles.push(t)
          }
          rankName = after.rank.name
        }

        // mission progress
        const dp = { ...s.dailyProgress }
        dp["games"] = (dp["games"] ?? 0) + 1
        dp["food"] = (dp["food"] ?? 0) + data.food
        dp["ai"] = (dp["ai"] ?? 0) + data.aiDefeated
        dp["power"] = (dp["power"] ?? 0) + data.powerups
        const wp = { ...s.weeklyProgress }
        wp["score"] = (wp["score"] ?? 0) + data.score
        wp["boss"] = (wp["boss"] ?? 0) + data.bossesDefeated
        wp["crate"] = wp["crate"] ?? 0

        set({
          coins: s.coins + earnedCoins + bonusCoins,
          gems: s.gems + earnedGems + bonusGems,
          stats: newStats,
          unlockedTitles: newTitles,
          dailyProgress: dp,
          weeklyProgress: wp,
        })
        get()._checkAchievements()
        const after2 = get()
        const newAch = after2.unlockedAchievements.filter((a) => !s.unlockedAchievements.includes(a))
        return {
          coins: earnedCoins + bonusCoins,
          gems: earnedGems + bonusGems,
          newRank: !!rankName,
          rankName,
          newAchievements: newAch,
        }
      },

      buyCosmetic: (id) => {
        const s = get()
        if (s.ownedCosmetics.includes(id)) return false
        const c = COSMETICS.find((x) => x.id === id)
        if (!c) return false
        if (!get().spend(c.cost.coins ?? 0, c.cost.gems ?? 0)) return false
        set((st) => ({ ownedCosmetics: [...st.ownedCosmetics, id] }))
        return true
      },

      equip: (c) =>
        set((s) => ({ equipped: { ...s.equipped, [c.type]: c.id } })),

      buyCrate: (crateId) => {
        const s = get()
        const crate = CRATES.find((c) => c.id === crateId)
        if (!crate) return null
        if (!get().spend(crate.cost.coins ?? 0, crate.cost.gems ?? 0)) return null
        const luck = (s.skillLevels["sk_crate"] ?? 0) * 5 + (s.skillLevels["sk_luck"] ?? 0) * 4
        const rarity = rarityFromOdds(crate.odds, luck)
        const pull = rollCrateContent(rarity, s)
        set((st) => {
          const next: Partial<GameState> = {
            stats: { ...st.stats, cratesOpened: st.stats.cratesOpened + 1 },
            weeklyProgress: { ...st.weeklyProgress, crate: (st.weeklyProgress["crate"] ?? 0) + 1 },
          }
          if (pull.type === "coins") next.coins = st.coins + (pull.amount ?? 0)
          if (pull.type === "gems") next.gems = st.gems + (pull.amount ?? 0)
          if (pull.type === "cosmetic" && pull.itemId && !st.ownedCosmetics.includes(pull.itemId))
            next.ownedCosmetics = [...st.ownedCosmetics, pull.itemId]
          if (pull.type === "title" && pull.name && !st.unlockedTitles.includes(pull.name))
            next.unlockedTitles = [...st.unlockedTitles, pull.name]
          if (pull.type === "pet" && pull.itemId) {
            if (!st.pets.find((p) => p.id === pull.itemId))
              next.pets = [...st.pets, { id: pull.itemId, level: 1, xp: 0 }]
          }
          if (pull.itemId || pull.type === "title")
            next.inventory = [...st.inventory, pull.itemId ?? pull.name]
          return next
        })
        get()._checkAchievements()
        return pull
      },

      upgradePet: (id) => {
        const s = get()
        const pet = s.pets.find((p) => p.id === id)
        if (!pet) return
        const cost = pet.level * 250
        if (!get().spend(cost, 0)) return
        set((st) => ({
          pets: st.pets.map((p) =>
            p.id === id ? { ...p, level: p.level + 1, xp: 0 } : p,
          ),
        }))
      },

      setActivePet: (id) => set({ activePet: id }),

      buySkill: (id) => {
        const s = get()
        const def = SKILLS.find((x) => x.id === id)
        if (!def) return false
        const cur = s.skillLevels[id] ?? 0
        if (cur >= def.maxLevel) return false
        if (s.skillPoints < def.costPerLevel) return false
        set({
          skillPoints: s.skillPoints - def.costPerLevel,
          skillLevels: { ...s.skillLevels, [id]: cur + 1 },
        })
        return true
      },

      claimAchievement: (id) => {
        const s = get()
        if (!s.unlockedAchievements.includes(id) || s.claimedAchievements.includes(id)) return
        const def = ACHIEVEMENTS.find((a) => a.id === id)
        if (!def) return
        set({
          claimedAchievements: [...s.claimedAchievements, id],
          coins: s.coins + (def.reward.coins ?? 0),
          gems: s.gems + (def.reward.gems ?? 0),
        })
      },

      claimMission: (id) => {
        const s = get()
        if (s.claimedMissions.includes(id)) return
        const all = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS, ...LONGTERM_MISSIONS]
        const def = all.find((m) => m.id === id)
        if (!def) return
        const progress =
          def.type === "daily"
            ? s.dailyProgress[def.stat] ?? 0
            : def.type === "weekly"
              ? s.weeklyProgress[def.stat] ?? 0
              : (s.stats as any)[def.stat] ?? 0
        if (progress < def.target) return
        set({
          claimedMissions: [...s.claimedMissions, id],
          coins: s.coins + (def.reward.coins ?? 0),
          gems: s.gems + (def.reward.gems ?? 0),
        })
      },

      setTitle: (t) => set({ title: t }),

      rebirth: () => {
        const s = get()
        const nextTier = REBIRTH_TIERS[s.rebirthTier]
        if (!nextTier) return false
        if (s.stats.bestScore < nextTier.requiredScore) return false
        const cosmetics = [...s.ownedCosmetics]
        if (nextTier.cosmetic && !cosmetics.includes(nextTier.cosmetic)) cosmetics.push(nextTier.cosmetic)
        set({
          rebirthTier: s.rebirthTier + 1,
          skillPoints: s.skillPoints + nextTier.skillPoints,
          coins: 500,
          gems: s.gems + Math.round(50 * nextTier.gemMult),
          ownedCosmetics: cosmetics,
          stats: { ...s.stats, rebirths: s.stats.rebirths + 1, bestScore: 0 },
        })
        get()._checkAchievements()
        return true
      },

      resetSave: () =>
        set({
          coins: 500,
          gems: 10,
          skillPoints: 0,
          stats: { ...defaultStats },
          rebirthTier: 0,
          ownedCosmetics: ["skin_default", "trail_none", "food_apple", "fx_none", "aura_none"],
          equipped: { skin: "skin_default", trail: "trail_none", food: "food_apple", effect: "fx_none", aura: "aura_none" },
          pets: [],
          activePet: null,
          skillLevels: {},
          unlockedAchievements: [],
          claimedAchievements: [],
          title: null,
          unlockedTitles: [],
          dailyProgress: {},
          weeklyProgress: {},
          claimedMissions: [],
          inventory: [],
        }),

      _checkAchievements: () => {
        const s = get()
        const unlocked = [...s.unlockedAchievements]
        for (const a of ACHIEVEMENTS) {
          if (unlocked.includes(a.id)) continue
          const val = (s.stats as any)[a.stat] ?? 0
          if (val >= a.threshold) unlocked.push(a.id)
        }
        if (unlocked.length !== s.unlockedAchievements.length) set({ unlockedAchievements: unlocked })
      },

      _checkDailyReset: () => {
        const s = get()
        const t = todayKey()
        const w = weekKey()
        const patch: Partial<GameState> = {}
        if (s.lastDailyReset !== t) {
          patch.dailyProgress = {}
          patch.lastDailyReset = t
          patch.claimedMissions = s.claimedMissions.filter(
            (id) => !DAILY_MISSIONS.some((m) => m.id === id),
          )
        }
        if (s.lastWeeklyReset !== w) {
          patch.weeklyProgress = {}
          patch.lastWeeklyReset = w
          patch.claimedMissions = (patch.claimedMissions ?? s.claimedMissions).filter(
            (id) => !WEEKLY_MISSIONS.some((m) => m.id === id),
          )
        }
        if (Object.keys(patch).length) set(patch)
      },
    }),
    { name: "neon-serpent-save" },
  ),
)

// rank reward helper (avoid circular import quirks)
import { RANKS } from "./game-data"
function RANKS_REWARD(i: number) {
  return RANKS[i]?.reward ?? { coins: 0, gems: 0 }
}

function rollCrateContent(rarity: Rarity, s: GameState): CratePull {
  // choose between cosmetic / pet / currency / title weighted
  const roll = Math.random()
  // higher rarity -> more likely cosmetic/pet
  if (roll < 0.18) {
    // coins
    const base = { common: 500, rare: 1500, epic: 4000, legendary: 10000, mythic: 30000 }[rarity]
    return { rarity, type: "coins", name: `${base.toLocaleString()} Coins`, color: "#ffce4d", amount: base }
  }
  if (roll < 0.3) {
    const base = { common: 2, rare: 5, epic: 15, legendary: 40, mythic: 120 }[rarity]
    return { rarity, type: "gems", name: `${base} Gems`, color: "#7fd4ff", amount: base }
  }
  if (roll < 0.55) {
    const pet = PETS.filter((p) => p.rarity === rarity)
    const pick = pet[Math.floor(Math.random() * pet.length)] ?? PETS[0]
    return { rarity, type: "pet", itemId: pick.id, name: pick.name, color: pick.color }
  }
  if (roll < 0.62) {
    const titles = ["Crate Lord", "The Lucky", "Treasure Seeker", "Fortune's Child", "Vault Breaker"]
    const t = titles[Math.floor(Math.random() * titles.length)]
    return { rarity, type: "title", name: t, color: "#b07cff" }
  }
  // cosmetic of matching rarity (fallback down)
  let pool = COSMETICS.filter((c) => c.rarity === rarity && !s.ownedCosmetics.includes(c.id))
  if (pool.length === 0) pool = COSMETICS.filter((c) => !s.ownedCosmetics.includes(c.id))
  if (pool.length === 0) {
    // everything owned -> give gems
    return { rarity, type: "gems", name: "25 Gems", color: "#7fd4ff", amount: 25 }
  }
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return { rarity, type: "cosmetic", itemId: pick.id, name: pick.name, color: pick.color }
}

// re-export for convenience
export { PET_BY_ID }
