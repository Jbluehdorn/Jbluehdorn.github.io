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
