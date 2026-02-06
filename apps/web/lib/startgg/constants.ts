/**
 * Start.gg videogame IDs
 * To find a game's ID, query: https://api.start.gg/gql/alpha
 *
 * query VideogameQuery {
 *   videogames(query: { filter: { name: "2XKO" }, perPage: 5 }) {
 *     nodes { id name displayName }
 *   }
 * }
 */
export const STARTGG_VIDEOGAME_IDS = {
  TWOXKO: 0, // TODO: Replace with actual ID from start.gg query
  STREET_FIGHTER_6: 43868,
  TEKKEN_8: 49783,
  GUILTY_GEAR_STRIVE: 33945,
  MORTAL_KOMBAT_1: 49481,
} as const

export const TWOXKO_VIDEOGAME_ID = STARTGG_VIDEOGAME_IDS.TWOXKO
export const TWOXKO_VIDEOGAME_NAME = '2XKO'

export const STARTGG_VIDEOGAME_NAMES: Record<number, string> = {
  [STARTGG_VIDEOGAME_IDS.TWOXKO]: TWOXKO_VIDEOGAME_NAME,
  [STARTGG_VIDEOGAME_IDS.STREET_FIGHTER_6]: 'Street Fighter 6',
  [STARTGG_VIDEOGAME_IDS.TEKKEN_8]: 'Tekken 8',
  [STARTGG_VIDEOGAME_IDS.GUILTY_GEAR_STRIVE]: 'Guilty Gear Strive',
  [STARTGG_VIDEOGAME_IDS.MORTAL_KOMBAT_1]: 'Mortal Kombat 1',
}

export function resolveStartggVideogameName(videogameId: number): string {
  return STARTGG_VIDEOGAME_NAMES[videogameId] ?? 'Unknown'
}

// Rate limiting configuration
export const STARTGG_RATE_LIMIT = {
  MAX_REQUESTS: 80,
  WINDOW_MS: 60000,
  MAX_OBJECTS_PER_REQUEST: 1000,
}

// Pagination defaults
export const STARTGG_PAGINATION = {
  TOURNAMENTS_PER_PAGE: 50,
  SETS_PER_PAGE: 50,
  ENTRANTS_PER_PAGE: 50,
}

// Import start date
export const TWOXKO_IMPORT_START_DATE = new Date('2026-01-01T00:00:00Z')
