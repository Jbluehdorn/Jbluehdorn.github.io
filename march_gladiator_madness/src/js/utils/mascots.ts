import { Dice, GetRollResult } from './dice'
import Dictionary from './dictionary'

export enum Mascot {
    Wildcat,
    HornedDevil,
    Tiger,
    Hornet,
    SmallBird,
    Badger,
    Mermaid,
    Commoner,
    Mastiff,
    Bandit,
    Goat,
    AirElemental,
    Boar,
    Eagle,
    Wolf,
    Gladiator,
    Crocodile,
    Turtle,
    Deer,
    Hawk,
    Bull,
    Solar
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
        attackDiceCount: baseStats.attackDiceCount,
        maxHp: maxHitPoints,
        currentHp: maxHitPoints,
        initiative: baseStats.initiative
    }
}

export interface Attack {
    name: string,
    flavorText: string,
    calculateDamage(diceCount: number, mod: number): number
}

export interface MascotBattleStats {
    attacks: Attack[],
    attackCount: number,
    armorClass: number,
    attackMod: number,
    attackDiceCount: number,
    maxHp: number,
    currentHp: number,
    initiative: number
}

interface MascotBattleStatBase {
    mascot: Mascot,
    initiative: number,
    attackCount: number,
    attackDiceCount: number,
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
    },
    sting: {
        name: 'Sting',
        flavorText: 'stings',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D6, diceCount, mod) + GetRollResult(Dice.D4, 2)
    },
    beak: {
        name: 'Beak',
        flavorText: 'snaps their beak at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D4, diceCount, mod)
    },
    bite: {
        name: 'Bite',
        flavorText: 'bites',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D8, diceCount, mod)
    },
    trident: {
        name: 'Trident',
        flavorText: 'stabs their trident at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D6, diceCount, mod) + GetRollResult(Dice.D4, 1)
    },
    pitchfork: {
        name: 'Pitch Fork',
        flavorText: 'stabs their pitch fork at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D6, diceCount, mod)
    },
    scimitar: {
        name: 'Scimitar',
        flavorText: 'swings their blade at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D6, diceCount, mod)
    },
    pistol: {
        name: 'Pistol',
        flavorText: 'fires their pistol at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D8, diceCount, mod)
    },
    ram: {
        name: 'Ram',
        flavorText: 'rams',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D4, diceCount, mod)
    },
    thunderousSlam: {
        name: 'Thunderous Slam',
        flavorText: 'thunderously slams',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D8, diceCount, mod)
    },
    gore: {
        name: 'Gore',
        flavorText: 'gores',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D6, diceCount, mod)
    },
    talons: {
        name: 'Talons',
        flavorText: 'slashes with their talons at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D4, diceCount, mod)
    },
    spear: {
        name: 'Spear',
        flavorText: 'stabs their spear at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D6, diceCount, mod)
    },
    flyingSword: {
        name: 'Flying Sword',
        flavorText: 'slashes their flying sword at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D6, diceCount, mod) + GetRollResult(Dice.D8, 2 * diceCount)
    },
    slayingBow: {
        name: 'Slaying Bow',
        flavorText: 'fires their slaying bow at',
        calculateDamage: (diceCount: number, mod: number): number => GetRollResult(Dice.D8, diceCount, mod) + GetRollResult(Dice.D8, 2 * diceCount)
    }
}

const mascotBattleBaseStats: MascotBattleStatBase[] = [
    {
        mascot: Mascot.Wildcat,
        attackCount: 2,
        attackMod: 5,
        attacks: [attacks.rend],
        attackDiceCount: 1,
        armorClass: 12,
        hitDie: Dice.D10,
        consMod: 2,
        initiative: 2
    },
    {
        mascot: Mascot.HornedDevil,
        attackCount: 3,
        attackMod: 9,
        attacks: [attacks.searingFork, attacks.hurlFlame],
        attackDiceCount: 3,
        armorClass: 18,
        hitDie: Dice.D10,
        consMod: 5,
        initiative: 7
    },
    {
        mascot: Mascot.Tiger,
        attackCount: 1,
        attackMod: 5,
        attacks: [attacks.rend],
        attackDiceCount: 2,
        armorClass: 13,
        hitDie: Dice.D10,
        consMod: 2,
        initiative: 3
    },
    {
        mascot: Mascot.Hornet,
        attackCount: 1,
        attackMod: 4,
        attacks: [attacks.sting],
        attackDiceCount: 1,
        armorClass: 13,
        hitDie: Dice.D8,
        consMod: 0,
        initiative: 2
    },
    {
        mascot: Mascot.SmallBird,
        attackCount: 1,
        attackMod: 2,
        attacks: [attacks.beak],
        attackDiceCount: 1,
        armorClass: 10,
        hitDie: Dice.D8,
        consMod: 1,
        initiative: 0
    },
    {
        mascot: Mascot.Badger,
        attackCount: 1,
        attackMod: 2,
        attacks: [attacks.bite],
        attackDiceCount: 1,
        armorClass: 11,
        hitDie: Dice.D4,
        consMod: 3,
        initiative: 0
    },
    {
        mascot: Mascot.Mermaid,
        attackCount: 1,
        attackMod: 2,
        attacks: [attacks.trident],
        attackDiceCount: 1,
        armorClass: 11,
        hitDie: Dice.D8,
        consMod: 2,
        initiative: 1
    },
    {
        mascot: Mascot.Commoner,
        attackCount: 1,
        attackMod: 2,
        attacks: [attacks.pitchfork],
        attackDiceCount: 1,
        armorClass: 10,
        hitDie: Dice.D8,
        consMod: 0,
        initiative: 0
    },
    {
        mascot: Mascot.Mastiff,
        attackCount: 1,
        attackMod: 3,
        attacks: [attacks.bite],
        attackDiceCount: 1,
        armorClass: 12,
        hitDie: Dice.D8,
        consMod: 1,
        initiative: 2
    },
    {
        mascot: Mascot.Bandit,
        attackCount: 1,
        attackMod: 3,
        attacks: [attacks.scimitar, attacks.pistol],
        attackDiceCount: 1,
        armorClass: 12,
        hitDie: Dice.D8,
        consMod: 1,
        initiative: 1
    },
    {
        mascot: Mascot.Goat,
        attackCount: 1,
        attackMod: 2,
        attacks: [attacks.ram],
        attackDiceCount: 1,
        armorClass: 10,
        hitDie: Dice.D8,
        consMod: 0,
        initiative: 0
    },
    {
        mascot: Mascot.AirElemental,
        attackCount: 2,
        attackMod: 8,
        attacks: [attacks.thunderousSlam],
        attackDiceCount: 2,
        armorClass: 15,
        hitDie: Dice.D10,
        consMod: 2,
        initiative: 5
    },
    {
        mascot: Mascot.Boar,
        attackCount: 1,
        attackMod: 3,
        attacks: [attacks.gore],
        attackDiceCount: 1,
        armorClass: 11,
        hitDie: Dice.D8,
        consMod: 2,
        initiative: 0
    },
    {
        mascot: Mascot.Eagle,
        attackCount: 1,
        attackMod: 4,
        attacks: [attacks.talons],
        attackDiceCount: 1,
        armorClass: 12,
        hitDie: Dice.D6,
        consMod: 1,
        initiative: 2
    },
    {
        mascot: Mascot.Wolf,
        attackCount: 1,
        attackMod: 4,
        attacks: [attacks.bite],
        attackDiceCount: 1,
        armorClass: 12,
        hitDie: Dice.D8,
        consMod: 1,
        initiative: 2
    },
    {
        mascot: Mascot.Gladiator,
        attackCount: 2,
        attackMod: 7,
        attacks: [attacks.spear],
        attackDiceCount: 2,
        armorClass: 16,
        hitDie: Dice.D8,
        consMod: 6,
        initiative: 5
    },
    {
        mascot: Mascot.Crocodile,
        attackCount: 1,
        attackMod: 4,
        attacks: [attacks.bite],
        attackDiceCount: 1,
        armorClass: 12,
        hitDie: Dice.D10,
        consMod: 3,
        initiative: 0
    },
    {
        mascot: Mascot.Turtle,
        attackCount: 1,
        attackMod: 0,
        attacks: [attacks.bite],
        attackDiceCount: 1,
        armorClass: 17,
        hitDie: Dice.D4,
        consMod: 0,
        initiative: -3
    },
    {
        mascot: Mascot.Deer,
        attackCount: 1,
        attackMod: 2,
        attacks: [attacks.ram],
        attackDiceCount: 1,
        armorClass: 13,
        hitDie: Dice.D8,
        consMod: 0,
        initiative: 3
    },
    {
        mascot: Mascot.Hawk,
        attackCount: 1,
        attackMod: 5,
        attacks: [attacks.talons],
        attackDiceCount: 1,
        armorClass: 13,
        hitDie: Dice.D4,
        consMod: -1,
        initiative: 3
    },
    {
        mascot: Mascot.Bull,
        attackCount: 1,
        attackMod: 8,
        attacks: [attacks.gore],
        attackDiceCount: 2,
        armorClass: 12,
        hitDie: Dice.D10,
        consMod: 4,
        initiative: 0
    },
    {
        mascot: Mascot.Solar,
        attackCount: 2,
        attackMod: 15,
        attacks: [attacks.flyingSword, attacks.slayingBow],
        attackDiceCount: 4,
        armorClass: 21,
        hitDie: Dice.D10,
        consMod: 8,
        initiative: 20
    }
]