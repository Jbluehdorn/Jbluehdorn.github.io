export enum Dice {
    D4,
    D6,
    D8,
    D10,
    D12,
    D20
}

export function GetRollResult(die: Dice, diceCount: number = 1, mod: number = 0) {
    const min = 1;
    let max;

    switch (die) {
        case Dice.D4:
            max = 4;
            break;
        case Dice.D6:
            max = 6;
            break;
        case Dice.D8:
            max = 8;
            break;
        case Dice.D10:
            max = 10;
            break;
        case Dice.D12:
            max = 12;
            break;
        case Dice.D20:
            max = 20;
            break;
    }

    return (diceCount * (Math.floor(Math.random() * (max - min + 1) + min))) + mod;
}