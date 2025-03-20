import { Mascot } from './mascots'

export interface Team {
    name: string,
    mascot: Mascot,
    mascotName: string,
    logo: string,
    seed: number
}

const Teams: Team[] = [
    {
        name: 'Arizona',
        mascot: Mascot.Wildcat,
        mascotName: 'Wilbur',
        logo: 'ArizonaWildcats',
        seed: 4
    },
    {
        name: 'Auburn',
        mascot: Mascot.Tiger,
        mascotName: 'Aubie',
        logo: 'AuburnTigers',
        seed: 1
    },
    {
        name: 'Alabama State',
        mascot: Mascot.Hornet,
        mascotName: 'Hornet',
        logo: 'AlabamaStateHornets',
        seed: 16
    },
    {
        name: 'Louisville',
        mascot: Mascot.SmallBird,
        mascotName: 'Louie',
        logo: 'LouisvilleCardinals',
        seed: 8
    },
    {
        name: 'Creighton',
        mascot: Mascot.SmallBird,
        mascotName: 'Billy Bluejay',
        logo: 'CreightonBluejays',
        seed: 9
    },
    {
        name: 'Michigan',
        mascot: Mascot.Badger,
        mascotName: 'Biff',
        logo: 'MichiganWolverines',
        seed: 5
    },
    {
        name: 'San Diego',
        mascot: Mascot.Mermaid,
        mascotName: 'King Triton',
        logo: 'SanDiegoTritons',
        seed: 12
    },
    {
        name: 'Texas AM',
        mascot: Mascot.Commoner,
        mascotName: 'Reveille',
        logo: 'TexasAMAggies',
        seed: 4
    },
    {
        name: 'Yale',
        mascot: Mascot.Mastiff,
        mascotName: 'Handsome Dan',
        logo: 'YaleBulldogs',
        seed: 13
    },
    {
        name: 'Ole Miss',
        mascot: Mascot.Bandit,
        mascotName: 'Tony',
        logo: 'OleMissRebels',
        seed: 6
    },
    {
        name: 'North Carolina',
        mascot: Mascot.Goat,
        mascotName: 'Rameses',
        logo: 'NorthCarolinaTarHeels',
        seed: 11
    },
    {
        name: 'Iowa State',
        mascot: Mascot.AirElemental,
        mascotName: 'Cy',
        logo: 'IowaStateCyclones',
        seed: 3
    },
    {
        name: 'Lipscomb',
        mascot: Mascot.Boar,
        mascotName: 'Lou',
        logo: 'LipscombBison',
        seed: 14
    },
    {
        name: 'Marquette',
        mascot: Mascot.Eagle,
        mascotName: 'Iggy',
        logo: 'MarquetteGoldenEagles',
        seed: 7
    },
    {
        name: 'New Mexico',
        mascot: Mascot.Wolf,
        mascotName: 'Lobo Louie',
        logo: 'NewMexicoLobos',
        seed: 10
    },
    {
        name: 'Michigan State',
        mascot: Mascot.Gladiator,
        mascotName: 'Sparty',
        logo: 'MichiganStateSpartans',
        seed: 2
    },
    {
        name: 'Bryant',
        mascot: Mascot.Mastiff,
        mascotName: 'Tupper',
        logo: 'BryantBulldogs',
        seed: 15
    },
    {
        name: 'Florida',
        mascot: Mascot.Crocodile,
        mascotName: 'Albert',
        logo: 'FloridaGators',
        seed: 1
    },
    {
        name: 'Norfolk State',
        mascot: Mascot.Gladiator,
        mascotName: 'Spiro',
        logo: 'NorfolkStateSpartans',
        seed: 16
    },
    {
        name: 'UConn',
        mascot: Mascot.Mastiff,
        mascotName: 'Jonathan',
        logo: 'UconnHuskies',
        seed: 8
    },
    {
        name: 'Oklahoma',
        mascot: Mascot.Bandit,
        mascotName: 'Boomer',
        logo: 'OklahomaSooners',
        seed: 9
    },
    {
        name: 'Memphis',
        mascot: Mascot.Tiger,
        mascotName: 'Tom',
        logo: 'MemphisTigers',
        seed: 5
    },
    {
        name: 'Colorado State',
        mascot: Mascot.Goat,
        mascotName: 'Cam',
        logo: 'ColoradoStateRams',
        seed: 12
    },
    {
        name: 'Maryland',
        mascot: Mascot.Turtle,
        mascotName: 'Testudo',
        logo: 'MarylandTerrapins',
        seed: 4
    },
    {
        name: 'Grand Canyon',
        mascot: Mascot.Deer,
        mascotName: 'Thunder',
        logo: 'GrandCanyonAntelopes',
        seed: 13
    },
    {
        name: 'Missouri',
        mascot: Mascot.Tiger,
        mascotName: 'Truman',
        logo: 'MissouriTigers',
        seed: 6
    },
    {
        name: 'Drake',
        mascot: Mascot.Mastiff,
        mascotName: 'Spike',
        logo: 'DrakeBulldogs',
        seed: 11
    },
    {
        name: 'Texas Tech',
        mascot: Mascot.Bandit,
        mascotName: 'Raider Red',
        logo: 'TexasTechRedRaiders',
        seed: 3
    },
    {
        name: 'UNC Wilmington',
        mascot: Mascot.Hawk,
        mascotName: 'Sammy C. Hawk',
        logo: 'UNCWilmingtonSeahawks',
        seed: 14
    },
    {
        name: 'Kansas',
        mascot: Mascot.Hawk,
        mascotName: 'The Jayhawk',
        logo: 'KansasJayhawks',
        seed: 7
    },
    {
        name: 'Arkansas',
        mascot: Mascot.Boar,
        mascotName: 'Tusk',
        logo: 'ArkansasRazorbacks',
        seed: 10
    },
    {
        name: 'St Johns',
        mascot: Mascot.AirElemental,
        mascotName: 'Johnny Thunderbird',
        logo: 'StJohnsRedStorm',
        seed: 2
    },
    {
        name: 'Omaha',
        mascot: Mascot.Bull,
        mascotName: 'Durango',
        logo: 'OmahaMavericks',
        seed: 15
    },
    {
        name: 'Duke',
        mascot: Mascot.HornedDevil,
        mascotName: 'The Blue Devil',
        logo: 'DukeBlueDevils',
        seed: 1
    },
    {
        name: 'Mount Saint Marys',
        mascot: Mascot.Commoner,
        mascotName: 'Emmit S. Burg',
        logo: 'MtStMarysMountaineers',
        seed: 16
    },
    {
        name: 'Mississippi State',
        mascot: Mascot.Mastiff,
        mascotName: 'Bully',
        logo: 'MississippiStateBulldogs',
        seed: 8
    }
]

export default Teams