# Phase 3: Betting Engine - COMPLETED

## Overview
Phase 3 implements the core betting functionality including odds calculation, bet placement, and automated settlement. This is the heart of the betting platform.

## Completed Tasks

### Task 3.1: Odds Calculation System ✅

**Odds Calculator** (`/apps/web/lib/betting/odds-calculator.ts`)
- ✅ ELO-based win probability calculation
- ✅ Probability to American odds conversion with 5% house edge
- ✅ Volume-based odds adjustment (market making)
- ✅ Payout and profit calculations
- ✅ Implied probability calculations
- ✅ Expected value calculations
- ✅ Handles favorites (negative odds) and underdogs (positive odds)

**Odds Service** (`/apps/web/lib/betting/odds-service.ts`)
- ✅ Initialize odds for new matches
- ✅ Get current odds with volume data
- ✅ Get odds history (all snapshots)
- ✅ Update odds after bet placement
- ✅ Odds health monitoring
- ✅ Creates OddsSnapshot records for historical tracking

**Key Features**
- American odds format (-150, +200, etc.)
- 5% house edge built into all odds
- Automatic odds adjustment when betting becomes one-sided
- Up to 21% odds adjustment based on volume distribution
- Prevents extreme odds (clamped to ±10,000)

### Task 3.2: Bet Placement System ✅

**Betting Service** (`/apps/web/lib/betting/betting-service.ts`)
- ✅ Place bets with full validation
- ✅ Check match status and betting availability
- ✅ Verify user chip balance
- ✅ Lock in odds at bet placement time
- ✅ Atomic transactions (chips deducted + bet created)
- ✅ Automatic odds update after bet placement
- ✅ Get user active bets
- ✅ Get user bet history
- ✅ Cancel bets (before match starts)
- ✅ User betting statistics

**Betting API Endpoints**
- ✅ `POST /api/bets/place` - Place a bet
- ✅ `GET /api/bets/[id]` - Get bet details
- ✅ `DELETE /api/bets/[id]` - Cancel bet
- ✅ `GET /api/matches/[id]/odds` - Get current odds

**Business Logic**
- Only MONEYLINE bets currently supported
- Can only bet on SCHEDULED matches with betting open
- Minimum bet: 1 chip (enforced by amount > 0)
- Odds locked at placement time (no retroactive changes)
- Bet cancellation only allowed before match starts
- Full wallet integration with transaction records

### Task 3.3: Bet Settlement System ✅

**Settlement Service** (`/apps/web/lib/betting/settlement-service.ts`)
- ✅ Settle all bets for completed match
- ✅ Automatic win/loss determination
- ✅ Payout processing for winning bets
- ✅ Cancel all bets if match cancelled
- ✅ ELO rating updates after match
- ✅ Player statistics tracking (wins/losses)
- ✅ Comprehensive error handling

**Settlement API**
- ✅ `POST /api/admin/matches/[id]/settle` - Settle match bets

**ELO Rating System**
- K-factor: 32 (standard chess rating)
- Formula: newRating = oldRating + K × (actual - expected)
- Expected score based on 400-point difference = 10x likelihood
- Both players' ratings updated after each match
- Win/loss records automatically updated

**Settlement Process**
1. Verify match is COMPLETED with winnerId set
2. Get all PENDING bets for the match
3. For each bet:
   - Determine if selection matches winner
   - If won: Pay out potentialPayout amount
   - If lost: No payout
   - Update bet status and settledAt timestamp
4. Update player ELO ratings
5. Update player win/loss records
6. Return settlement statistics

## File Structure Added

```
apps/web/
├── app/
│   └── api/
│       ├── bets/
│       │   ├── place/route.ts (new)
│       │   └── [id]/route.ts (new)
│       ├── matches/
│       │   └── [id]/
│       │       └── odds/route.ts (new)
│       └── admin/
│           └── matches/
│               └── [id]/
│                   └── settle/route.ts (new)
└── lib/
    └── betting/
        ├── odds-calculator.ts (new)
        ├── odds-service.ts (new)
        ├── betting-service.ts (new)
        └── settlement-service.ts (new)
```

## Usage Examples

### Initialize Odds for a Match

```typescript
const oddsService = new OddsService()
const { player1Odds, player2Odds } = await oddsService.initializeMatchOdds(matchId)

console.log(`Player 1: ${player1Odds > 0 ? '+' : ''}${player1Odds}`)
console.log(`Player 2: ${player2Odds > 0 ? '+' : ''}${player2Odds}`)
// Example output:
// Player 1: -150 (favorite)
// Player 2: +200 (underdog)
```

### Place a Bet

```typescript
POST /api/bets/place
{
  "matchId": "clx...",
  "betType": "MONEYLINE",
  "selection": "PLAYER_1",
  "amount": 100
}

// Response:
{
  "bet": {
    "id": "clx...",
    "amount": 100,
    "odds": -150,
    "potentialPayout": 166.67,
    "status": "PENDING"
  }
}
```

### Get Current Odds

```typescript
GET /api/matches/[id]/odds?betType=MONEYLINE

// Response:
{
  "odds": {
    "player1Odds": -150,
    "player2Odds": +200,
    "player1Volume": 5000,
    "player2Volume": 2000
  }
}
```

### Settle a Match

```typescript
POST /api/admin/matches/[id]/settle

// Response:
{
  "success": true,
  "settlement": {
    "totalBets": 15,
    "settledCount": 15,
    "wonCount": 8,
    "lostCount": 7
  },
  "ratings": {
    "player1": {
      "oldRating": 1500,
      "newRating": 1516,
      "change": 16
    },
    "player2": {
      "oldRating": 1480,
      "newRating": 1464,
      "change": -16
    }
  }
}
```

## Odds Calculation Details

### ELO to Probability
```
P(A beats B) = 1 / (1 + 10^((RB - RA) / 400))

Example: Player with 1600 ELO vs Player with 1400 ELO
Difference: 200 points
Probability: 1 / (1 + 10^(-200/400)) = 1 / (1 + 10^-0.5) ≈ 0.76 (76%)
```

### Probability to American Odds
```
If probability ≥ 0.5 (favorite):
  Odds = -(100 × prob) / (1 - prob) × (1 + house_edge)

If probability < 0.5 (underdog):
  Odds = (100 × (1 - prob)) / prob × (1 + house_edge)

Example: 76% probability with 5% house edge
Adjusted prob = 0.76 × 1.05 = 0.798
Odds = -(100 × 0.798) / (1 - 0.798) ≈ -395
```

### Payout Calculation
```
If odds > 0 (underdog):
  Profit = stake × (odds / 100)
  Payout = stake + profit

If odds < 0 (favorite):
  Profit = stake / (|odds| / 100)
  Payout = stake + profit

Example: $100 bet at -150 odds
Profit = 100 / (150 / 100) = 100 / 1.5 = $66.67
Payout = 100 + 66.67 = $166.67
```

## Security & Validation

### Bet Placement Validation
1. ✅ User authentication required
2. ✅ Match must exist and be SCHEDULED
3. ✅ Betting must be open on match
4. ✅ User must have sufficient chips
5. ✅ Bet amount must be positive
6. ✅ Selection must be valid for bet type

### Settlement Safeguards
1. ✅ Admin authentication required
2. ✅ Match must be COMPLETED
3. ✅ Winner must be set
4. ✅ Each bet settled in transaction
5. ✅ Error recovery (continues on individual bet errors)
6. ✅ Comprehensive logging

### Atomic Operations
- All bet placements use Prisma transactions
- Chip deduction + bet creation happens atomically
- Settlement processes each bet in its own transaction
- Failed individual settlements don't affect others

## Testing Checklist

### Odds Calculation
- [x] ELO probability calculation for equal players
- [x] ELO probability for mismatched players
- [x] American odds conversion (favorites)
- [x] American odds conversion (underdogs)
- [x] House edge application
- [x] Volume-based odds adjustment

### Bet Placement
- [x] Successful bet with sufficient chips
- [x] Rejected bet with insufficient chips
- [x] Rejected bet on closed betting
- [x] Rejected bet on live match
- [x] Odds locked at placement time
- [x] Wallet transaction created
- [x] Odds updated after bet

### Settlement
- [x] Winning bet payout
- [x] Losing bet (no payout)
- [x] ELO rating updates
- [x] Cancelled match refunds
- [x] Multiple bets settled correctly

## Performance Considerations

- Odds calculations are in-memory (very fast)
- OddsSnapshot creates new record per update (intentional for history)
- Settlement processes bets sequentially (reliable but slower for many bets)
- Consider background job queue for large-scale settlements

## Known Limitations

1. **Bet Types**: Only MONEYLINE currently supported
   - HANDICAP and TOTAL_GAMES to be added later

2. **Live Betting**: Not supported
   - All betting must be pre-match

3. **Partial Cashout**: Not implemented
   - Bets can only be fully cancelled or settled

4. **Parlay Bets**: Not supported
   - Only single-match bets allowed

5. **Settlement Timing**: Manual trigger required
   - Automatic settlement on status change to be added

## Next Steps

### Immediate Enhancements
- [ ] Add HANDICAP bet type
- [ ] Add TOTAL_GAMES bet type
- [ ] Automatic settlement trigger
- [ ] Bet limits (min/max per user)
- [ ] Daily/weekly bet limits

### Phase 4 Preview
With betting engine complete, Phase 4 will add:
- WebSocket server for real-time updates
- Live odds updates pushed to clients
- Real-time bet feed
- Live match status updates

---

**Status**: Phase 3 Complete ✅
**Date**: December 30, 2024
**Next**: Phase 4 - Real-Time Features (WebSockets)
