import { FightingGame } from '@repo/database'

/**
 * Map start.gg game names to our FightingGame enum
 */
export function mapGameToEnum(gameName: string): FightingGame {
  const normalized = gameName.toLowerCase()

  if (normalized.includes('2xko') || normalized.includes('project l')) {
    return 'TWOXKO'
  }

  if (normalized.includes('street fighter 6') || normalized.includes('sf6')) {
    return 'STREET_FIGHTER_6'
  }
  if (normalized.includes('tekken 8') || normalized.includes('t8')) {
    return 'TEKKEN_8'
  }
  if (normalized.includes('guilty gear') && normalized.includes('strive')) {
    return 'GUILTY_GEAR_STRIVE'
  }
  if (normalized.includes('mortal kombat 1') || normalized.includes('mk1')) {
    return 'MORTAL_KOMBAT_1'
  }
  if (normalized.includes('granblue')) {
    return 'GRANBLUE_FANTASY_VERSUS'
  }
  if (normalized.includes('king of fighters') || normalized.includes('kof')) {
    return 'KING_OF_FIGHTERS_XV'
  }
  if (normalized.includes('under night')) {
    return 'UNDER_NIGHT'
  }
  if (normalized.includes('blazblue')) {
    return 'BLAZBLUE'
  }
  if (normalized.includes('dragon ball') || normalized.includes('dbfz')) {
    return 'DRAGON_BALL_FIGHTERZ'
  }
  if (normalized.includes('skullgirls')) {
    return 'SKULLGIRLS'
  }
  if (normalized.includes('multiversus')) {
    return 'MULTIVERSUS'
  }
  if (normalized.includes('melee')) {
    return 'SUPER_SMASH_BROS_MELEE'
  }
  if (
    normalized.includes('ultimate') ||
    normalized.includes('smash ultimate') ||
    normalized.includes('ssbu')
  ) {
    return 'SUPER_SMASH_BROS_ULTIMATE'
  }
  if (normalized.includes('brawl')) {
    return 'SUPER_SMASH_BROS_BRAWL'
  }
  if (normalized.includes('smash') || normalized.includes('ssb')) {
    // generic Smash fallback
    return 'SUPER_SMASH_BROS_ULTIMATE'
  }

  // Default to OTHER if no match
  return 'OTHER'
}

/**
 * Check if a game is supported for betting
 */
export function isGameSupported(gameName: string): boolean {
  return mapGameToEnum(gameName) !== 'OTHER'
}
