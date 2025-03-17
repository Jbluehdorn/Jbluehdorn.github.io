import React from 'react'

import { Team } from '../utils/teams'
import { GetMascotBattleStats, MascotBattleStats } from '../utils/mascots'
import { GetRollResult, Dice } from '../utils/dice'
import LoadImageSrc from '../utils/imageLoader'

import TeamPortrait from './teamportrait'
import HealthBar from './healthbar'

interface FightSimulatorProps {
    teams: Team[],
    onConfirmFinish(): void
}

interface Round {
    number: number,
    events: string[],
    attacker?: Team,
    defender?: Team,
    damage: number
}

enum Target {
    firstMascot,
    secondMascot
}

const FightSimulator = ({ teams, onConfirmFinish }: FightSimulatorProps) => {
    const [firstMascot, setFirstMascot] = React.useState<MascotBattleStats>(undefined)
    const [secondMascot, setSecondMascot] = React.useState<MascotBattleStats>(undefined)
    const [round, setRound] = React.useState(0)
    const [currentInitiativeState, setCurrentInitiativeState] = React.useState([''])
    const [turns, setTurns] = React.useState<Target[]>([])
    const [script, setScript] = React.useState<Round[]>([])

    React.useEffect(() => {
        const interval = setInterval(() => {
            if (combatOver())
            {
                clearInterval(interval)
            }
            runRound(round)
        }, 1000);
    
        return () => clearInterval(interval);
    }, [round, firstMascot])

    React.useEffect(() => {
        loadMascots()
    }, [])

    const loadMascots = () => {
        setFirstMascot(GetMascotBattleStats(teams[0].mascot, teams[0].seed))
        setSecondMascot(GetMascotBattleStats(teams[1].mascot, teams[1].seed))
    }

    const determineInitiative = () => {
        const firstMascotInit = GetRollResult(Dice.D20, firstMascot.initiative)
        const secondMascotInit = GetRollResult(Dice.D20, secondMascot.initiative)

        if (firstMascotInit > secondMascotInit) {
            setTurns([Target.firstMascot, Target.secondMascot])
            setCurrentInitiativeState([`${teams[0].name} goes first!`])
        } else {
            setTurns([Target.secondMascot, Target.firstMascot])
            setCurrentInitiativeState([`${teams[1].name} goes first!`])
        }

        setRound(1)
    }

    const runRound = (round: number) => {
        if (!mascotsReady())
            return

        if (round === 0) {
            determineInitiative()
            return
        }

        let attacker = round % 2 === 0 ? Target.firstMascot : Target.secondMascot

        if (true) {
            let attackInfo = [`${teams[0].name} attacks!`]
            for (let i = 0; i < firstMascot.attackCount; i++) {
                let attack = getRandomElement(firstMascot.attacks)
                attackInfo.push(`${teams[0].name} ${attack.flavorText} ${teams[1].name}`)
                damageMascot(Target.secondMascot, attack.calculateDamage(firstMascot.attackCount, firstMascot.attackMod))
            }
            console.log(attackInfo)
            setCurrentInitiativeState(attackInfo)
        }
    }

    const mascotsReady = () => {
        return !!firstMascot && !!secondMascot
    }

    const combatOver = () => {
        return firstMascot.currentHp <= 0 || secondMascot.currentHp <= 0
    }

    const getRandomElement = (arr: any[]) => {
        if (arr.length === 0) {
          return undefined; // Return undefined for empty arrays
        }
        const randomIndex = Math.floor(Math.random() * arr.length);
        return arr[randomIndex];
    }

    const damageMascot = (target: Target, damage: number) => { 
        if (target === Target.firstMascot) {
            setFirstMascot({...firstMascot, currentHp: Math.max(firstMascot.currentHp - damage, 0)})
        } 

        if (target === Target.secondMascot) {
            setSecondMascot({...secondMascot, currentHp: Math.max(secondMascot.currentHp - damage, 0)})
        }
    }

    return (
        <div className="container-fluid">
            {
                mascotsReady() &&
                <div className="row">
                    <div className="col-5">
                        <TeamPortrait team={teams[0]} />
                        <HealthBar currentHp={firstMascot.currentHp} maxHp={firstMascot.maxHp} />
                    </div>
                    <div className="col-2">
                        <img src={LoadImageSrc('effects', 'versus')} style={{ margin: 'auto', height: '250px' }} />

                        {
                            currentInitiativeState.map((state: string) => {
                                return <h2>{state}</h2>
                            })
                        }
                    </div>
                    <div className="col-5">
                        <TeamPortrait team={teams[1]} />
                        <HealthBar currentHp={secondMascot.currentHp} maxHp={secondMascot.maxHp} />
                    </div>
                </div>
            }
        </div>
    )
}

export default FightSimulator

