-- CreateEnum
CREATE TYPE "FightingGame" AS ENUM ('STREET_FIGHTER_6', 'TEKKEN_8', 'GUILTY_GEAR_STRIVE', 'MORTAL_KOMBAT_1', 'GRANBLUE_FANTASY_VERSUS', 'KING_OF_FIGHTERS_XV', 'UNDER_NIGHT', 'BLAZBLUE', 'DRAGON_BALL_FIGHTERZ', 'SKULLGIRLS', 'MULTIVERSUS', 'SUPER_SMASH_BROS_MELEE', 'SUPER_SMASH_BROS_ULTIMATE', 'SUPER_SMASH_BROS_BRAWL', 'OTHER');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "BetType" AS ENUM ('MONEYLINE', 'HANDICAP', 'TOTAL_GAMES');

-- CreateEnum
CREATE TYPE "BetSelection" AS ENUM ('PLAYER_1', 'PLAYER_2', 'OVER', 'UNDER');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'CANCELLED', 'PUSHED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BET_PLACED', 'BET_WON', 'BET_LOST', 'BET_REFUND', 'ADMIN_ADJUSTMENT', 'DAILY_BONUS', 'WELCOME_BONUS');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "chipBalance" DECIMAL(10,2) NOT NULL DEFAULT 10000,
    "preferredGames" "FightingGame"[],
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "startGgId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "game" "FightingGame" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "streamUrl" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "startGgId" TEXT,
    "gamerTag" TEXT NOT NULL,
    "country" TEXT,
    "mainCharacter" TEXT,
    "imageUrl" TEXT,
    "twitterHandle" TEXT,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "eloRating" INTEGER NOT NULL DEFAULT 1500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "startGgId" TEXT,
    "tournamentId" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "game" "FightingGame" NOT NULL,
    "bestOf" INTEGER NOT NULL DEFAULT 3,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "winnerId" TEXT,
    "player1Score" INTEGER,
    "player2Score" INTEGER,
    "bettingOpen" BOOLEAN NOT NULL DEFAULT false,
    "bettingClosedAt" TIMESTAMP(3),
    "streamUrl" TEXT,
    "vodUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OddsSnapshot" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "betType" "BetType" NOT NULL,
    "player1Odds" DECIMAL(6,2) NOT NULL,
    "player2Odds" DECIMAL(6,2) NOT NULL,
    "line" DECIMAL(3,1),
    "overOdds" DECIMAL(6,2),
    "underOdds" DECIMAL(6,2),
    "player1Volume" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "player2Volume" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "overVolume" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "underVolume" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OddsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "betType" "BetType" NOT NULL,
    "selection" "BetSelection" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "odds" DECIMAL(6,2) NOT NULL,
    "potentialPayout" DECIMAL(10,2) NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "actualPayout" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balanceBefore" DECIMAL(10,2) NOT NULL,
    "balanceAfter" DECIMAL(10,2) NOT NULL,
    "relatedBetId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_startGgId_key" ON "Tournament"("startGgId");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE INDEX "Tournament_game_startDate_idx" ON "Tournament"("game", "startDate");

-- CreateIndex
CREATE INDEX "Tournament_isActive_isFeatured_idx" ON "Tournament"("isActive", "isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "Player_startGgId_key" ON "Player"("startGgId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_gamerTag_key" ON "Player"("gamerTag");

-- CreateIndex
CREATE INDEX "Player_gamerTag_idx" ON "Player"("gamerTag");

-- CreateIndex
CREATE INDEX "Player_eloRating_idx" ON "Player"("eloRating");

-- CreateIndex
CREATE UNIQUE INDEX "Match_startGgId_key" ON "Match"("startGgId");

-- CreateIndex
CREATE INDEX "Match_tournamentId_scheduledStart_idx" ON "Match"("tournamentId", "scheduledStart");

-- CreateIndex
CREATE INDEX "Match_status_bettingOpen_idx" ON "Match"("status", "bettingOpen");

-- CreateIndex
CREATE INDEX "Match_game_status_idx" ON "Match"("game", "status");

-- CreateIndex
CREATE INDEX "OddsSnapshot_matchId_timestamp_idx" ON "OddsSnapshot"("matchId", "timestamp");

-- CreateIndex
CREATE INDEX "OddsSnapshot_matchId_betType_idx" ON "OddsSnapshot"("matchId", "betType");

-- CreateIndex
CREATE INDEX "Bet_userId_status_idx" ON "Bet"("userId", "status");

-- CreateIndex
CREATE INDEX "Bet_matchId_status_idx" ON "Bet"("matchId", "status");

-- CreateIndex
CREATE INDEX "Bet_placedAt_idx" ON "Bet"("placedAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_type_createdAt_idx" ON "Transaction"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OddsSnapshot" ADD CONSTRAINT "OddsSnapshot_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
