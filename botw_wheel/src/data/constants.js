export const EpisodeType = Object.freeze({
  WHEEL: 'wheel',
  PLINKETTO: 'plinketto',
  SPOTLIGHT: 'spotlight',
  BLACK_SPINE: 'black_spine',
  REGULAR: 'regular',
})

export const EpisodeTypeLabels = {
  [EpisodeType.WHEEL]: 'Wheel of the Worst',
  [EpisodeType.PLINKETTO]: 'Plinketto',
  [EpisodeType.SPOTLIGHT]: 'Spotlight',
  [EpisodeType.BLACK_SPINE]: 'Black Spine',
  [EpisodeType.REGULAR]: 'Regular',
}

export const EpisodeTypeColors = {
  [EpisodeType.WHEEL]: '#cc0000',
  [EpisodeType.PLINKETTO]: '#e67e22',
  [EpisodeType.SPOTLIGHT]: '#9b59b6',
  [EpisodeType.BLACK_SPINE]: '#27ae60',
  [EpisodeType.REGULAR]: '#2980b9',
}

export const EpisodeTag = Object.freeze({
  CHRISTMAS: 'christmas',
  HALLOWEEN: 'halloween',
})

export const EpisodeTagLabels = {
  [EpisodeTag.CHRISTMAS]: 'Christmas',
  [EpisodeTag.HALLOWEEN]: 'Halloween',
}

export const EpisodeTagColors = {
  [EpisodeTag.CHRISTMAS]: '#c0392b',
  [EpisodeTag.HALLOWEEN]: '#e67e22',
}

const TAG_PATTERNS = {
  [EpisodeTag.CHRISTMAS]: /christmas|xmas|holiday special|santa claus|elves,/i,
  [EpisodeTag.HALLOWEEN]: /halloween|spooktacular|spooky/i,
}

export function detectTags(title) {
  const tags = []
  for (const [tag, pattern] of Object.entries(TAG_PATTERNS)) {
    if (pattern.test(title)) tags.push(tag)
  }
  return tags
}
