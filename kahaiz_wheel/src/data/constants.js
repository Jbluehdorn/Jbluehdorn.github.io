export const WheelType = Object.freeze({
  BOSS: 'BOSS',
  SOTW: 'SOTW',
  BOTW: 'BOTW',
})

export const Holiday = Object.freeze({
  BIRTHDAY: 'BIRTHDAY',
  HALLOWEEN: 'HALLOWEEN',
  CHRISTMAS: 'CHRISTMAS',
  THANKSGIVING: 'THANKSGIVING',
  INDEPENDENCEDAY: 'INDEPENDENCEDAY',
  SAINTPATRICKS: 'STPATRICKS',
  EASTER: 'EASTER',
  VALENTINES: 'VALENTINES',
  NONE: 'NONE',
})

export function getCurrentHoliday() {
  const today = new Date()
  const month = today.getMonth()
  switch (month) {
    case 1:
      return today.getDate() < 15 ? Holiday.VALENTINES : Holiday.NONE
    case 2:
      return today.getDate() < 18 ? Holiday.SAINTPATRICKS : Holiday.NONE
    case 3:
      return Holiday.EASTER
    case 5:
      return today.getDate() < 8 ? Holiday.BIRTHDAY : Holiday.NONE
    case 6:
      return today.getDate() < 8 ? Holiday.INDEPENDENCEDAY : Holiday.NONE
    case 9:
      return Holiday.HALLOWEEN
    case 10:
      return Holiday.THANKSGIVING
    case 11:
      return Holiday.CHRISTMAS
    default:
      return Holiday.NONE
  }
}

export function getBossWheelName(holiday) {
  switch (holiday) {
    case Holiday.VALENTINES:
      return 'The Wheel of Love'
    case Holiday.SAINTPATRICKS:
      return "The Wheel o' Bossin'"
    case Holiday.EASTER:
      return 'The Boss Wheel'
    case Holiday.BIRTHDAY:
      return 'The Birthday Boy Wheel'
    case Holiday.INDEPENDENCEDAY:
      return 'The Freedom Wheel'
    case Holiday.HALLOWEEN:
      return 'The Spooky Wheel'
    case Holiday.THANKSGIVING:
      return 'The Thankful Wheel'
    case Holiday.CHRISTMAS:
      return 'The Christmas Wheel'
    default:
      return 'The Boss Wheel'
  }
}

export function getTitleFlairs(holiday) {
  switch (holiday) {
    case Holiday.VALENTINES:
      return ['❤️', '❤️']
    case Holiday.SAINTPATRICKS:
      return ['🍀', '🍻']
    case Holiday.EASTER:
      return ['🐰', '🥚']
    case Holiday.BIRTHDAY:
      return ['🎂', '🎁']
    case Holiday.INDEPENDENCEDAY:
      return ['🎆', '🦅']
    case Holiday.HALLOWEEN:
      return ['🎃', '👻']
    case Holiday.THANKSGIVING:
      return ['🦃', '🍗']
    case Holiday.CHRISTMAS:
      return ['🎄', '🎅']
    default:
      return ['👑', '👑']
  }
}

export function getTitle(wheelType, holiday) {
  const flairs = getTitleFlairs(holiday)
  let name = ''
  switch (wheelType) {
    case WheelType.BOSS:
      name = getBossWheelName(holiday)
      break
    case WheelType.BOTW:
      name = 'Boss of the Week'
      break
    case WheelType.SOTW:
      name = 'Skill of the Week'
      break
  }
  return `${flairs[0]} ${name} ${flairs[1]}`
}

// Alternating OSRS-themed segment colors
export const SEGMENT_COLORS = [
  '#1a3a1a', // dark green (like OSRS chatbox)
  '#2a1a0a', // dark brown
  '#0a2a3a', // dark teal
  '#2a0a1a', // dark maroon
  '#1a2a0a', // olive
  '#0a1a2a', // navy
  '#2a1a2a', // plum
  '#1a0a0a', // dark red-brown
]
