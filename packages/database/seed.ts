import { PrismaClient, FightingGame, MatchStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.bet.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.oddsSnapshot.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.tournament.deleteMany();

  // Create players
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
    },
  });

  const knee = await prisma.player.create({
    data: {
      gamerTag: 'Knee',
      country: 'KOR',
      mainCharacter: 'Bryan',
      eloRating: 2120,
    },
  });

  // Create tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Capcom Cup 2025',
      slug: 'capcom-cup-2025',
      game: FightingGame.STREET_FIGHTER_6,
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-17'),
      location: 'Los Angeles, CA',
      isActive: true,
      isFeatured: true,
    },
  });

  // Create matches
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0);

  const match1 = await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      game: FightingGame.STREET_FIGHTER_6,
      round: 'Winners Semifinals',
      player1Id: punk.id,
      player2Id: mena.id,
      bestOf: 3,
      status: MatchStatus.SCHEDULED,
      scheduledStart: tomorrow,
      bettingOpen: true,
    },
  });

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      game: FightingGame.STREET_FIGHTER_6,
      round: 'Grand Finals',
      player1Id: punk.id,
      player2Id: mena.id,
      bestOf: 5,
      status: MatchStatus.SCHEDULED,
      scheduledStart: dayAfter,
      bettingOpen: true,
    },
  });

  // Create initial odds
  await prisma.oddsSnapshot.create({
    data: {
      matchId: match1.id,
      betType: 'MONEYLINE',
      player1Odds: -150,
      player2Odds: 130,
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });