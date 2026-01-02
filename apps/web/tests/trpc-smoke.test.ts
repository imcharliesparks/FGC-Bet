import { describe, expect, test } from 'bun:test'
import { appRouter } from '@/server/trpc/routers'

describe('tRPC router', () => {
  test('exposes expected router namespaces', () => {
    const namespaces = Object.keys(appRouter._def.procedures)

    expect(namespaces).toContain('wallet')
    expect(namespaces).toContain('bets')
    expect(namespaces).toContain('matches')
    expect(namespaces).toContain('admin')
  })
})
