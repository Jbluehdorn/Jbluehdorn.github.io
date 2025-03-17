import { Dice, GetRollResult } from './dice'
import Dictionary from './dictionary'

export enum Mascot {
    Wildcat,
    Bluedevil
}

export function GetMascotBattleStats(mascot: Mascot, seed: number): MascotBattleStats {
    const baseStats = mascotBattleBaseStats.find((stats) => stats.mascot === mascot)
    const level = 17 - seed

    if (!baseStats) {
        throw 'Mascot not found exception'
    }

    const maxHitPoints = GetRollResult(baseStats.hitDie, level, baseStats.consMod * level)

    return {
        attacks: baseStats.attacks,
        attackCount: baseStats.attackCount,
        armorClass: baseStats.armorClass,
        attackMod: baseStats.attackMod,
        maxHp: maxHitPoints,
        currentHp: maxHitPoints,
        initiative: baseStats.initiative
    }
}

interface Attack {
    name: string,
    flavorText: string,
    calculateDamage(diceCount: number, mod: number): number
}

export interface MascotBattleStats {
    attacks: Attack[],
    attackCount: number,
    armorClass: number,
    attackMod: number,
    maxHp: number,
    currentHp: number,
    initiative: number
}

interface MascotBattleStatBase {
    mascot: Mascot,
    initiative: number,
    attackCount: number,
    attackMod: number,
    attacks: Attack[],
    armorClass: number,
    hitDie: Dice,
    consMod: number
}

const attacks: Dictionary<Attack> = {
    rend: {
        name: 'Rend',
        flavorText: 'rends',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D6, diceCount, mod)
    },
    searingFork: {
        name: 'Searing Fork',
        flavorText: 'stabs their searing fork at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D8, diceCount, mod)
    },
    hurlFlame: {
        name: 'Hurl Flame',
        flavorText: 'hurls flame at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D8, diceCount, mod)
    }
}

const mascotBattleBaseStats: MascotBattleStatBase[] = [
    {
        mascot: Mascot.Wildcat,
        attackCount: 2,
        attackMod: 3,
        attacks: [attacks.rend],
        armorClass: 12,
        hitDie: Dice.D10,
        consMod: 2,
        initiative: 2
    },
    {
        mascot: Mascot.Bluedevil,
        attackCount: 3,
        attackMod: 6,
        attacks: [attacks.searingFork, attacks.hurlFlame],
        armorClass: 18,
        hitDie: Dice.D10,
        consMod: 5,
        initiative: 7
    }
]