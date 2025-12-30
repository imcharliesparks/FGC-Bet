/**
 * Format a number as chips with commas
 * @param chips - Number of chips
 * @returns Formatted string (e.g., "10,000")
 */
export function formatChips(chips: number): string {
  return chips.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMs = date.getTime() - now.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffInMinutes) < 1) {
    return 'Just now'
  } else if (Math.abs(diffInMinutes) < 60) {
    return diffInMinutes > 0
      ? `in ${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''}`
      : `${Math.abs(diffInMinutes)} minute${Math.abs(diffInMinutes) !== 1 ? 's' : ''} ago`
  } else if (Math.abs(diffInHours) < 24) {
    return diffInHours > 0
      ? `in ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`
      : `${Math.abs(diffInHours)} hour${Math.abs(diffInHours) !== 1 ? 's' : ''} ago`
  } else {
    return diffInDays > 0
      ? `in ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`
      : `${Math.abs(diffInDays)} day${Math.abs(diffInDays) !== 1 ? 's' : ''} ago`
  }
}

/**
 * Format a game enum to a display name
 * @param game - FightingGame enum value
 * @returns Formatted game name
 */
export function formatGameName(game: string): string {
  const gameNames: Record<string, string> = {
    STREET_FIGHTER_6: 'Street Fighter 6',
    TEKKEN_8: 'Tekken 8',
    GUILTY_GEAR_STRIVE: 'Guilty Gear Strive',
    MORTAL_KOMBAT_1: 'Mortal Kombat 1',
    GRANBLUE_FANTASY_VERSUS: 'Granblue Fantasy Versus',
    KING_OF_FIGHTERS_XV: 'King of Fighters XV',
    UNDER_NIGHT: 'Under Night In-Birth',
    BLAZBLUE: 'BlazBlue',
    DRAGON_BALL_FIGHTERZ: 'Dragon Ball FighterZ',
    SKULLGIRLS: 'Skullgirls',
    MULTIVERSUS: 'MultiVersus',
    OTHER: 'Other',
  }

  return gameNames[game] || game
}

/**
 * Get short name for a fighting game
 * @param game - FightingGame enum value
 * @returns Short game name
 */
export function getGameShortName(game: string): string {
  const shortNames: Record<string, string> = {
    STREET_FIGHTER_6: 'SF6',
    TEKKEN_8: 'T8',
    GUILTY_GEAR_STRIVE: 'GGST',
    MORTAL_KOMBAT_1: 'MK1',
    GRANBLUE_FANTASY_VERSUS: 'GBVS',
    KING_OF_FIGHTERS_XV: 'KOF XV',
    UNDER_NIGHT: 'UNI',
    BLAZBLUE: 'BB',
    DRAGON_BALL_FIGHTERZ: 'DBFZ',
    SKULLGIRLS: 'SG',
    MULTIVERSUS: 'MVS',
    OTHER: 'Other',
  }

  return shortNames[game] || game
}
