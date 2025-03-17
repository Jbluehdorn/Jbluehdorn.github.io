import { Dice } from './dice'
import { Mascot } from './mascots'

export interface Team {
    name: string,
    mascot: Mascot,
    logo: string,
    seed: number
}

const Teams: Team[] = [
    {
        name: 'Arizona',
        mascot: Mascot.Wildcat,
        logo: 'ArizonaWildcats',
        seed: 1
    },
    {
        name: 'Duke',
        mascot: Mascot.Bluedevil,
        logo: 'DukeBlueDevils',
        seed: 4
    }
]

export default Teams