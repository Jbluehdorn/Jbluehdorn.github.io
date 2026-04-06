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

export function getSlotName(holiday) {
  switch (holiday) {
    case Holiday.VALENTINES:
      return 'The Slots of Love'
    case Holiday.SAINTPATRICKS:
      return "The Lucky Slots"
    case Holiday.EASTER:
      return "The Kng's Slots"
    case Holiday.BIRTHDAY:
      return 'The Birthday Slots'
    case Holiday.INDEPENDENCEDAY:
      return 'The Freedom Slots'
    case Holiday.HALLOWEEN:
      return 'The Spooky Slots'
    case Holiday.THANKSGIVING:
      return 'The Thankful Slots'
    case Holiday.CHRISTMAS:
      return 'The Christmas Slots'
    default:
      return "The Kng's Slots"
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

export function getTitle(holiday) {
  const flairs = getTitleFlairs(holiday)
  const name = getSlotName(holiday)
  return `${flairs[0]} ${name} ${flairs[1]}`
}
