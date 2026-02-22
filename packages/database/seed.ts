import { PrismaClient, FightingGame, MatchStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.$executeRawUnsafe('DELETE FROM "UserMatchDismissal"');
  await prisma.bet.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.oddsSnapshot.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.tournament.deleteMany();

  // ── Players ──────────────────────────────────────────────

  const punk = await prisma.player.create({
    data: {
      gamerTag: 'Punk',
      country: 'USA',
      mainCharacter: 'Cammy',
      eloRating: 2100,
      totalMatches: 150,
      wins: 95,
      losses: 55,
    },
  });

  const mena = await prisma.player.create({
    data: {
      gamerTag: 'MenaRD',
      country: 'DOM',
      mainCharacter: 'Luke',
      eloRating: 2050,
      totalMatches: 140,
      wins: 88,
      losses: 52,
    },
  });

  const arslan = await prisma.player.create({
    data: {
      gamerTag: 'Arslan_Ash',
      country: 'PAK',
      mainCharacter: 'Zafina',
      eloRating: 2150,
      totalMatches: 120,
      wins: 80,
      losses: 40,
    },
  });

  const knee = await prisma.player.create({
    data: {
      gamerTag: 'Knee',
      country: 'KOR',
      mainCharacter: 'Bryan',
      eloRating: 2120,
      totalMatches: 130,
      wins: 85,
      losses: 45,
    },
  });

  const sonicFox = await prisma.player.create({
    data: {
      gamerTag: 'SonicFox',
      country: 'USA',
      mainCharacter: 'Johnny Cage',
      eloRating: 2200,
      totalMatches: 200,
      wins: 140,
      losses: 60,
    },
  });

  const tokido = await prisma.player.create({
    data: {
      gamerTag: 'Tokido',
      country: 'JPN',
      mainCharacter: 'Ken',
      eloRating: 2180,
      totalMatches: 180,
      wins: 120,
      losses: 60,
    },
  });

  const leffen = await prisma.player.create({
    data: {
      gamerTag: 'Leffen',
      country: 'SWE',
      mainCharacter: 'Fox',
      eloRating: 2080,
      totalMatches: 160,
      wins: 100,
      losses: 60,
    },
  });

  const hungrybox = await prisma.player.create({
    data: {
      gamerTag: 'Hungrybox',
      country: 'USA',
      mainCharacter: 'Jigglypuff',
      eloRating: 2160,
      totalMatches: 190,
      wins: 130,
      losses: 60,
    },
  });

  console.log('  ✅ 8 players created');

  // ── Tournaments ──────────────────────────────────────────

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);

  const capcomCup = await prisma.tournament.create({
    data: {
      name: 'Capcom Cup 2025',
      slug: 'capcom-cup-2025',
      game: FightingGame.STREET_FIGHTER_6,
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000),
      location: 'Los Angeles, CA',
      isActive: true,
      isFeatured: true,
    },
  });

  const evo = await prisma.tournament.create({
    data: {
      name: 'EVO 2025',
      slug: 'evo-2025',
      game: FightingGame.TEKKEN_8,
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 3 * 24 * 60 * 60 * 1000),
      location: 'Las Vegas, NV',
      isActive: true,
      isFeatured: true,
    },
  });

  console.log('  ✅ 2 tournaments created');

  // ── Matches ──────────────────────────────────────────────

  const slot = (hoursFromNow: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursFromNow);
    return d;
  };

  // Capcom Cup matches (Street Fighter 6)
  const ccMatches = await Promise.all([
    prisma.match.create({
      data: {
        tournamentId: capcomCup.id,
        game: FightingGame.STREET_FIGHTER_6,
        round: 'Winners Round 1',
        player1Id: punk.id,
        player2Id: mena.id,
        bestOf: 3,
        status: MatchStatus.SCHEDULED,
        scheduledStart: slot(2),
        bettingOpen: true,
      },
    }),
    prisma.match.create({
      data: {
        tournamentId: capcomCup.id,
        game: FightingGame.STREET_FIGHTER_6,
        round: 'Winners Round 1',
        player1Id: tokido.id,
        player2Id: sonicFox.id,
        bestOf: 3,
        status: MatchStatus.SCHEDULED,
        scheduledStart: slot(3),
        bettingOpen: true,
      },
    }),
    prisma.match.create({
      data: {
        tournamentId: capcomCup.id,
        game: FightingGame.STREET_FIGHTER_6,
        round: 'Winners Semifinals',
        player1Id: punk.id,
        player2Id: tokido.id,
        bestOf: 3,
        status: MatchStatus.SCHEDULED,
        scheduledStart: slot(6),
        bettingOpen: true,
      },
    }),
    prisma.match.create({
      data: {
        tournamentId: capcomCup.id,
        game: FightingGame.STREET_FIGHTER_6,
        round: 'Grand Finals',
        player1Id: tokido.id,
        player2Id: mena.id,
        bestOf: 5,
        status: MatchStatus.SCHEDULED,
        scheduledStart: slot(10),
        bettingOpen: true,
      },
    }),
  ]);

  // EVO matches (Tekken 8)
  const evoMatches = await Promise.all([
    prisma.match.create({
      data: {
        tournamentId: evo.id,
        game: FightingGame.TEKKEN_8,
        round: 'Winners Round 1',
        player1Id: arslan.id,
        player2Id: knee.id,
        bestOf: 3,
        status: MatchStatus.SCHEDULED,
        scheduledStart: slot(2),
        bettingOpen: true,
      },
    }),
    prisma.match.create({
      data: {
        tournamentId: evo.id,
        game: FightingGame.TEKKEN_8,
        round: 'Winners Round 1',
        player1Id: leffen.id,
        player2Id: hungrybox.id,
        bestOf: 3,
        status: MatchStatus.SCHEDULED,
        scheduledStart: slot(4),
        bettingOpen: true,
      },
    }),
    prisma.match.create({
      data: {
        tournamentId: evo.id,
        game: FightingGame.TEKKEN_8,
        round: 'Winners Semifinals',
        player1Id: arslan.id,
        player2Id: leffen.id,
        bestOf: 3,
        status: MatchStatus.SCHEDULED,
        scheduledStart: slot(7),
        bettingOpen: true,
      },
    }),
    prisma.match.create({
      data: {
        tournamentId: evo.id,
        game: FightingGame.TEKKEN_8,
        round: 'Grand Finals',
        player1Id: knee.id,
        player2Id: hungrybox.id,
        bestOf: 5,
        status: MatchStatus.SCHEDULED,
        scheduledStart: slot(11),
        bettingOpen: true,
      },
    }),
  ]);

  console.log('  ✅ 8 matches created (4 per tournament)');

  // ── Odds Snapshots ───────────────────────────────────────

  const allMatches = [...ccMatches, ...evoMatches];
  const oddsPairs = [
    [-150, 130],
    [-110, -110],
    [120, -140],
    [-200, 170],
    [-130, 110],
    [100, -120],
    [-160, 140],
    [110, -130],
  ];

  await Promise.all(
    allMatches.map((match, i) =>
      prisma.oddsSnapshot.create({
        data: {
          matchId: match.id,
          betType: 'MONEYLINE',
          player1Odds: oddsPairs[i]![0]!,
          player2Odds: oddsPairs[i]![1]!,
        },
      })
    )
  );

  console.log('  ✅ Odds snapshots created for all matches');
  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });