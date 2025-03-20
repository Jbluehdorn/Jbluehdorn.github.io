import React from 'react'

import { Team } from '../utils/teams'
import { GetMascotBattleStats, MascotBattleStats, Attack } from '../utils/mascots'
import { GetRollResult, Dice } from '../utils/dice'
import LoadImageSrc from '../utils/imageLoader'

import TeamPortrait from './teamportrait'
import HealthBar from './healthbar'

interface FightSimulatorProps {
    teams: Team[],
    onConfirmFinish(): void
}

interface Event {
    displayInfo: string,
    attacker?: Team,
    defender?: Team,
    defenderHp?: number,
    damage: number
}

interface Round {
    number: number,
    events: Event[]
}

enum Target {
    firstMascot,
    secondMascot
}

const FightSimulator = ({ teams, onConfirmFinish }: FightSimulatorProps) => {
    const [firstMascot, setFirstMascot] = React.useState<MascotBattleStats>()
    const [secondMascot, setSecondMascot] = React.useState<MascotBattleStats>()
    const [script, setScript] = React.useState<Round[]>([])
    const [display, setDisplay] = React.useState<string>()
    const [scriptRunFinished, setScriptRunFinished] = React.useState<boolean>(false)


    React.useEffect(() => {
        generateCombatReport()
    }, [])

    // Run the display
    React.useEffect(() => {
        let timerRef: NodeJS.Timeout
        let currIndex = 0
        let eventQueue: Event[] = []

        if (!!script.length) {
            for (let i = 0; i < script.length; i++) {
                let currRound: Round = script[i]

                for (let k = 0; k < currRound.events.length; k++) {
                    eventQueue.push(currRound.events[k])
                }
            }

            timerRef = setInterval(() => {
                let currEvent: Event = eventQueue[currIndex]

                if (!currEvent) {
                    setScriptRunFinished(true)
                    clearInterval(timerRef)
                }

                // Safety valve
                if (currIndex > 1000) {
                    clearInterval(timerRef)
                }

                if (!!currEvent.attacker) {
                    let target = currEvent.attacker === teams[0] ? Target.secondMascot : Target.firstMascot
                    
                    setMascotHp(target, Math.max(currEvent.defenderHp!, 0))
                }

                setDisplay(`${currEvent.displayInfo}`)

                currIndex++
            }, 2000)
        }

        
    }, [script])

    const mascotsReady = () => {
        return !!firstMascot && !!secondMascot
    }

    const generateCombatReport = () => {
        let round = 0;
        let script: Round[] = []

        let turns: Target[] = []
    
        let firstMascot = GetMascotBattleStats(teams[0].mascot, teams[0].seed)
        let secondMascot = GetMascotBattleStats(teams[1].mascot, teams[1].seed)

        setFirstMascot({ ...firstMascot, currentHp: firstMascot.maxHp })
        setSecondMascot({ ...secondMascot, currentHp: secondMascot.maxHp })

        while (true) {
            let currentRoundInfo: Round = {
                number: round,
                events: [],
            }

            // Someones dead so we can just end
            if (firstMascot.currentHp <= 0 || secondMascot.currentHp <= 0) {
                break
            }

            // Fail safe
            if (round > 100) {
                break
            }

            // Determine Initiative
            if (round === 0) {
                const firstMascotInit = GetRollResult(Dice.D20, 1, firstMascot.initiative)
                const secondMascotInit = GetRollResult(Dice.D20, 1, secondMascot.initiative)

                if (firstMascotInit > secondMascotInit) {
                    turns = [Target.firstMascot, Target.secondMascot]
                } else {
                    turns = [Target.secondMascot, Target.firstMascot]
                }
                
                let firstTeam = turns[0] === Target.firstMascot ? teams[0].name : teams[1].name

                let initiativeEvent: Event = {
                    displayInfo: `${firstTeam} goes first!`,
                    damage: 0
                }

                currentRoundInfo.events.push(initiativeEvent)
            } else {
                // Iterate through the turns
                for (let i = 0; i < turns.length; i++) {
                    let attacker: MascotBattleStats = turns[i] === Target.firstMascot ? firstMascot : secondMascot
                    let attackerTeam: Team = attacker === firstMascot ? teams[0] : teams[1]

                    let defender: MascotBattleStats = turns[i] === Target.firstMascot ? secondMascot : firstMascot
                    let defenderTeam: Team = defender === firstMascot ? teams[0] : teams[1]

                    for (let k = 0; k < attacker.attackCount; k++) {
                        let attack: Attack = getRandomElement(attacker.attacks)

                        let attackRoll = GetRollResult(Dice.D20, 1, attacker.attackMod)

                        if (attackRoll < defender.armorClass) {
                            let missEvent: Event = {
                                displayInfo: `${attackerTeam.mascotName}'s ${attack.name} attack misses!`,
                                damage: 0
                            }

                            currentRoundInfo.events.push(missEvent)
                        } else {
                            let damage = attack.calculateDamage(attacker.attackDiceCount, attacker.attackMod)
    
                            defender.currentHp -= damage
    
                            let attackEvent: Event = {
                                displayInfo: `${attackerTeam.mascotName} ${attack.flavorText} ${defenderTeam.mascotName} for ${damage} damage!`,
                                attacker: attackerTeam,
                                defender: defenderTeam,
                                defenderHp: defender.currentHp,
                                damage: damage
                            }
    
                            currentRoundInfo.events.push(attackEvent)

                        }
                    }

                    if (defender.currentHp <= 0) {
                        currentRoundInfo.events.push({
                            displayInfo: `${attackerTeam.name} wins!`,
                            defenderHp: 0,
                            damage: 0
                        } as Event)

                        break
                    }
                }
            }

            script.push(currentRoundInfo)
            round++
        }

        setScript(script)
    }

    const getRandomElement = (arr: any[]) => {
        if (arr.length === 0) {
          return undefined; // Return undefined for empty arrays
        }
        const randomIndex = Math.floor(Math.random() * arr.length);
        return arr[randomIndex];
    }

    const setMascot = (target: Target, mascot: MascotBattleStats) => {
        switch (target) {
            case Target.firstMascot:
                setFirstMascot(mascot)
                break
            case Target.secondMascot:
                setSecondMascot(mascot)
                break
        }
    }

    const setMascotHp = (target: Target, hp: number) => {
        let mascot: MascotBattleStats = target === Target.firstMascot ? firstMascot! : secondMascot!

        mascot.currentHp = hp

        setMascot(target, mascot)
    }

    const getMascotHp = (mascot: MascotBattleStats | undefined) => {
        if (!mascot) {
            return 0
        }

        return Math.max(mascot!.currentHp, 0)
    }

    return (
        <div className="container-fluid" id="fightSimulator">
            {
                mascotsReady() &&
                <div className="row">
                    <div className="col-4">
                        <TeamPortrait team={teams[0]} name={teams[0].mascotName} />
                        <HealthBar currentHp={getMascotHp(firstMascot)} maxHp={firstMascot?.maxHp} />
                    </div>
                    <div className="col-4" style={{textAlign: 'center'}}>
                        { !display &&
                            <img src={LoadImageSrc('effects', 'versus')} style={{ margin: 'auto', height: '250px' }} />
                        }
                        
                        { !!display &&
                            <div className="card fightInfo">
                                <div className="card-body">
                                    <h1>{display}</h1>
                                    
                                    {scriptRunFinished &&
                                        <button className="btn btn-primary" onClick={onConfirmFinish}>
                                            Reset
                                        </button>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                    <div className="col-4">
                        <TeamPortrait team={teams[1]} name={teams[1].mascotName} />
                        <HealthBar currentHp={getMascotHp(secondMascot)} maxHp={secondMascot?.maxHp} />
                    </div>
                </div>
            }
        </div>
    )
}

export default FightSimulator

