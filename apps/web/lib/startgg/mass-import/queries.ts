/**
 * Query to find a videogame's ID by name
 */
export const VIDEOGAME_BY_NAME_QUERY = `
  query VideogameByName($name: String!) {
    videogames(query: { filter: { name: $name }, perPage: 5 }) {
      nodes {
        id
        name
        displayName
      }
    }
  }
`

/**
 * Query tournaments by videogame with date filter
 */
export const TOURNAMENTS_BY_VIDEOGAME_QUERY = `
  query TournamentsByVideogame(
    $videogameId: ID!
    $page: Int!
    $perPage: Int!
    $afterDate: Timestamp
  ) {
    tournaments(query: {
      page: $page
      perPage: $perPage
      sortBy: "startAt asc"
      filter: {
        past: false
        videogameIds: [$videogameId]
        afterDate: $afterDate
      }
    }) {
      pageInfo {
        total
        totalPages
        page
        perPage
      }
      nodes {
        id
        name
        slug
        startAt
        endAt
        city
        countryCode
        state
        venueName
        venueAddress
        numAttendees
        primaryContact
        registrationClosesAt
        timezone
        hashtag
        isOnline
        hasOfflineEvents
        images {
          url
          type
        }
        events(filter: { videogameId: [$videogameId] }) {
          id
          name
          slug
          type
          startAt
          numEntrants
          state
          isOnline
          videogame {
            id
            name
          }
        }
      }
    }
  }
`

/**
 * Also query past tournaments
 */
export const PAST_TOURNAMENTS_BY_VIDEOGAME_QUERY = `
  query PastTournamentsByVideogame(
    $videogameId: ID!
    $page: Int!
    $perPage: Int!
    $afterDate: Timestamp
  ) {
    tournaments(query: {
      page: $page
      perPage: $perPage
      sortBy: "startAt asc"
      filter: {
        past: true
        videogameIds: [$videogameId]
        afterDate: $afterDate
      }
    }) {
      pageInfo {
        total
        totalPages
        page
        perPage
      }
      nodes {
        id
        name
        slug
        startAt
        endAt
        city
        countryCode
        state
        venueName
        venueAddress
        numAttendees
        primaryContact
        registrationClosesAt
        timezone
        hashtag
        isOnline
        hasOfflineEvents
        images {
          url
          type
        }
        events(filter: { videogameId: [$videogameId] }) {
          id
          name
          slug
          type
          startAt
          numEntrants
          state
          isOnline
          videogame {
            id
            name
          }
        }
      }
    }
  }
`

/**
 * Query sets for an event with pagination
 */
export const EVENT_SETS_QUERY = `
  query EventSets($eventId: ID!, $page: Int!, $perPage: Int!) {
    event(id: $eventId) {
      id
      name
      sets(page: $page, perPage: $perPage, sortType: STANDARD) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          id
          fullRoundText
          round
          identifier
          state
          startAt
          startedAt
          completedAt
          displayScore
          totalGames
          winnerId
          station {
            number
          }
          phaseGroup {
            id
            phase {
              id
            }
          }
          slots {
            standing {
              placement
              stats {
                score {
                  value
                }
              }
            }
            entrant {
              id
              name
              initialSeedNum
              participants {
                id
                gamerTag
                prefix
                player {
                  id
                }
                user {
                  id
                  images {
                    url
                    type
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

/**
 * Query entrants for an event with pagination
 */
export const EVENT_ENTRANTS_QUERY = `
  query EventEntrants($eventId: ID!, $page: Int!, $perPage: Int!) {
    event(id: $eventId) {
      id
      entrants(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          id
          name
          initialSeedNum
          participants {
            id
            gamerTag
            prefix
            player {
              id
            }
            user {
              id
              images {
                url
                type
              }
            }
          }
        }
      }
    }
  }
`
