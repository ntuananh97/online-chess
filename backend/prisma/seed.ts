import { EndReason, GameResult, GameStatus, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@chessium.dev' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@chessium.dev',
      passwordHash,
      eloRating: 1250,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@chessium.dev' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@chessium.dev',
      passwordHash,
      eloRating: 1150,
    },
  });

  await prisma.game.upsert({
    where: { slug: 'seed-scholars-mate' },
    update: {},
    create: {
      slug: 'seed-scholars-mate',
      status: GameStatus.COMPLETED,
      result: GameResult.WHITE_WIN,
      endReason: EndReason.CHECKMATE,
      whitePlayerId: alice.id,
      blackPlayerId: bob.id,
      ratingSnapshotWhite: 1250,
      ratingSnapshotBlack: 1150,
      currentFen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
      pgn: '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#',
      startTime: new Date('2026-04-01T10:00:00Z'),
      endTime: new Date('2026-04-01T10:05:00Z'),
    },
  });

  console.log('Seed done: alice (1250), bob (1150), 1 completed game');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
