# Phase 2: Match Data Integration - IN PROGRESS

## Overview
Phase 2 focuses on integrating external match data sources (start.gg) and providing manual match management tools for administrators.

## Completed Tasks

### Task 2.1: Start.gg API Integration ✅

**Start.gg GraphQL Client** (`/apps/web/lib/startgg/client.ts`)
- ✅ GraphQL client with Bearer token authentication
- ✅ `getTournament(slug)` - Fetch tournament details with events
- ✅ `getEventSets(eventId)` - Fetch matches from tournament events
- ✅ `getEventStandings(eventId)` - Fetch player standings
- ✅ Full TypeScript types for API responses

**Game Mapping Utility** (`/apps/web/lib/startgg/game-mapping.ts`)
- ✅ Maps start.gg game names to FightingGame enum
- ✅ Supports all major fighting games (SF6, T8, GGST, MK1, etc.)
- ✅ `mapGameToEnum()` - Convert game name to enum
- ✅ `isGameSupported()` - Check if game is supported

**Match Importer** (`/apps/web/lib/startgg/import.ts`)
- ✅ `importTournament(slug)` - Import full tournament with all matches
- ✅ `importEvent(eventId)` - Import matches from specific event
- ✅ Automatic player creation/matching
- ✅ Match status mapping (SCHEDULED, LIVE, COMPLETED)
- ✅ Duplicate prevention using startGgId
- ✅ Updates existing matches on re-import

**Admin Import API** (`/apps/web/app/api/admin/import/startgg/route.ts`)
- ✅ POST endpoint for tournament import
- ✅ Admin authentication required
- ✅ Error handling and validation
- ✅ Returns import statistics

**Admin UI** (`/apps/web/app/admin/tournaments/page.tsx`)
- ✅ Tournament list with stats
- ✅ Import form component with slug input
- ✅ Toast notifications for success/errors
- ✅ Real-time feedback on import progress
- ✅ Table showing imported tournaments

**Dependencies Added**
- ✅ graphql (v16.9.0)
- ✅ graphql-request (v7.1.2)
- ✅ react-hot-toast (v2.4.1)

### Task 2.2: Manual Match Management ✅

**Match CRUD API**
- ✅ `POST /api/admin/matches` - Create new match
- ✅ `GET /api/admin/matches` - List matches with filters
- ✅ `GET /api/admin/matches/[id]` - Get match details
- ✅ `PATCH /api/admin/matches/[id]` - Update match
- ✅ `DELETE /api/admin/matches/[id]` - Delete match (if no bets)

**Match Management Features**
- ✅ Zod schema validation for all endpoints
- ✅ Automatic betting closure when match goes live
- ✅ Prevent deletion of matches with bets
- ✅ Support for all match statuses
- ✅ Track match scores and winner
- ✅ Optional stream URL and VOD URL
- ✅ Admin-only access control

**Business Logic**
- ✅ Betting opens by default for new matches
- ✅ Betting closes when match status changes to LIVE
- ✅ Match completion triggers bet settlement (Phase 3)
- ✅ Cascade deletes for matches with no bets

### Task 2.3: Player and Game Management ⏳ (Partially Complete)

**What's Complete**
- ✅ Automatic player creation during import
- ✅ Player lookup by gamerTag and startGgId
- ✅ Player stats tracking (wins, losses, ELO)

**What's Pending**
- ⏳ Manual player create/edit UI
- ⏳ Player profile pages
- ⏳ Player stats dashboard
- ⏳ Game selection in match forms

## File Structure Added

```
apps/web/
├── app/
│   ├── admin/
│   │   └── tournaments/page.tsx (new)
│   └── api/
│       └── admin/
│           ├── import/
│           │   └── startgg/route.ts (new)
│           └── matches/
│               ├── route.ts (new)
│               └── [id]/route.ts (new)
├── components/
│   ├── admin/
│   │   └── import-tournament-form.tsx (new)
│   └── providers/
│       └── toast-provider.tsx (new)
└── lib/
    └── startgg/
        ├── client.ts (new)
        ├── game-mapping.ts (new)
        └── import.ts (new)
```

## Usage Examples

### Importing a Tournament

1. Navigate to `/admin/tournaments`
2. Enter tournament slug (e.g., `tournament/evo-2024/event/street-fighter-6`)
3. Click "Import"
4. System will:
   - Create tournament record
   - Create all players
   - Import all matches
   - Set initial betting status

### Creating a Match Manually

```typescript
POST /api/admin/matches
{
  "game": "STREET_FIGHTER_6",
  "tournamentId": "clx...",
  "player1Id": "clx...",
  "player2Id": "clx...",
  "scheduledStart": "2024-12-31T18:00:00Z",
  "bestOf": 3,
  "round": "Grand Finals",
  "bettingOpen": true
}
```

### Updating Match Status

```typescript
PATCH /api/admin/matches/[id]
{
  "status": "LIVE",
  "actualStart": "2024-12-31T18:05:00Z"
}
// Automatically closes betting
```

### Completing a Match

```typescript
PATCH /api/admin/matches/[id]
{
  "status": "COMPLETED",
  "player1Score": 3,
  "player2Score": 1,
  "winnerId": "clx...",
  "completedAt": "2024-12-31T19:00:00Z"
}
// Will trigger bet settlement in Phase 3
```

## Environment Variables

Add to `/apps/web/.env`:
```env
# Start.gg API
STARTGG_API_KEY=your_api_key_here
```

To get a start.gg API key:
1. Go to https://developer.start.gg/
2. Create an account
3. Generate a personal access token

## Testing Phase 2

### Test start.gg Import
1. ✅ Get a valid tournament slug from start.gg
2. ✅ Import via admin UI
3. ✅ Verify tournament created in database
4. ✅ Verify matches imported
5. ✅ Verify players created
6. ✅ Try re-importing (should update, not duplicate)

### Test Manual Match Management
1. ✅ Create a match via API
2. ✅ Update match status to LIVE
3. ✅ Verify betting closed automatically
4. ✅ Complete match with scores
5. ✅ Try deleting match with bets (should fail)

## Known Limitations

1. **Rate Limiting**: start.gg API has rate limits. Consider implementing caching/queuing for bulk imports.

2. **Game Mapping**: Only supports major fighting games. Tournaments with unsupported games will be rejected.

3. **Player Disambiguation**: Players with same gamerTag across different games are treated as separate entities.

4. **Manual Match UI**: Admin UI for creating matches not yet implemented (API is ready).

5. **Player Management UI**: Player editing and management UI pending.

## Performance Considerations

- Tournament imports can take several seconds for large events
- Each set (match) requires individual player lookups
- Consider background job processing for very large tournaments

## Security Notes

- ✅ All admin endpoints require admin role
- ✅ Input validation on all endpoints
- ✅ Prevent match deletion with existing bets
- ⏳ Rate limiting to be added
- ⏳ Audit logging to be added

## Next Steps

### Complete Phase 2
- [ ] Create admin UI for manual match creation
- [ ] Build player management pages
- [ ] Add player profile views
- [ ] Implement batch match import

### Phase 3 Preview
With match management complete, Phase 3 will focus on:
- Odds calculation engine
- Bet placement system
- Bet settlement automation
- Payout processing

---

**Status**: Phase 2 - 75% Complete
**Date**: December 30, 2024
**Next**: Complete player management, then begin Phase 3
