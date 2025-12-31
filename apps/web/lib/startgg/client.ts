import { GraphQLClient } from 'graphql-request'

const STARTGG_API_URL = 'https://api.start.gg/gql/alpha'

interface TournamentResponse {
  tournament: {
    id: number
    name: string
    slug: string
    startAt: number
    endAt: number | null
    city: string | null
    countryCode: string | null
    images: Array<{ url: string; type: string }> | null
    events: Array<{
      id: number
      name: string
      slug: string
      videogame: {
        id: number
        name: string
      }
      phases: Array<{
        id: number
        name: string
      }>
    }>
  }
}

interface EventSetsResponse {
  event: {
    id: number
    name: string
    sets: {
      pageInfo: {
        total: number
        totalPages: number
      }
      nodes: Array<{
        id: number
        state: number
        fullRoundText: string
        startedAt: number | null
        completedAt: number | null
        winnerId: number | null
        slots: Array<{
          standing: {
            stats: {
              score: {
                value: number
              }
            } | null
          } | null
          entrant: {
            id: number
            name: string
            participants: Array<{
              id: number
              gamerTag: string
              user: {
                id: number
                name: string
              } | null
            }>
          }
        }>
      }>
    }
  }
}

export class StartGGClient {
  private client: GraphQLClient

  constructor(apiKey: string) {
    this.client = new GraphQLClient(STARTGG_API_URL, {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    })
  }

  /**
   * Get tournament details by slug
   */
  async getTournament(slug: string): Promise<TournamentResponse> {
    const query = `
      query GetTournament($slug: String!) {
        tournament(slug: $slug) {
          id
          name
          slug
          startAt
          endAt
          city
          countryCode
          images {
            url
            type
          }
          events {
            id
            name
            slug
            videogame {
              id
              name
            }
            phases {
              id
              name
            }
          }
        }
      }
    `

    return await this.client.request<TournamentResponse>(query, { slug })
  }

  /**
   * Get event sets (matches)
   */
  async getEventSets(
    eventId: number,
    page = 1,
    perPage = 25
  ): Promise<EventSetsResponse> {
    const query = `
      query GetEventSets($eventId: ID!, $page: Int!, $perPage: Int!) {
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
              state
              fullRoundText
              startedAt
              completedAt
              winnerId
              slots {
                standing {
                  stats {
                    score {
                      value
                    }
                  }
                }
                entrant {
                  id
                  name
                  participants {
                    id
                    gamerTag
                  }
                }
              }
            }
          }
        }
      }
    `

    return await this.client.request<EventSetsResponse>(query, {
      eventId,
      page,
      perPage,
    })
  }

  /**
   * Get standings for an event
   */
  async getEventStandings(eventId: number) {
    const query = `
      query GetEventStandings($eventId: ID!) {
        event(id: $eventId) {
          id
          name
          standings(query: {
            perPage: 50
            page: 1
          }) {
            nodes {
              placement
              entrant {
                id
                name
                participants {
                  gamerTag
                  user {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `

    return await this.client.request(query, { eventId })
  }
}
