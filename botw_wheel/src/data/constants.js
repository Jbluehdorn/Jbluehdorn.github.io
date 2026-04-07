export const EpisodeType = Object.freeze({
  WHEEL: 'wheel',
  PLINKETTO: 'plinketto',
  SPOTLIGHT: 'spotlight',
  JUNKA: 'junka',
  REGULAR: 'regular',
})

export const EpisodeTypeLabels = {
  [EpisodeType.WHEEL]: 'Wheel of the Worst',
  [EpisodeType.PLINKETTO]: 'Plinketto',
  [EpisodeType.SPOTLIGHT]: 'Spotlight',
  [EpisodeType.JUNKA]: 'Junka',
  [EpisodeType.REGULAR]: 'Regular',
}

export const EpisodeTypeColors = {
  [EpisodeType.WHEEL]: '#cc0000',
  [EpisodeType.PLINKETTO]: '#e67e22',
  [EpisodeType.SPOTLIGHT]: '#9b59b6',
  [EpisodeType.JUNKA]: '#27ae60',
  [EpisodeType.REGULAR]: '#2980b9',
}
