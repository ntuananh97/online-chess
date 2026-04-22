import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const passwordHash = await hash('123qwe', 10);

  await prisma.user.upsert({
    where: { email: 'alice@chessium.dev' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@chessium.dev',
      passwordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'bob@chessium.dev' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@chessium.dev',
      passwordHash,
    },
  });

  // await prisma.game.upsert({
  //   where: { slug: 'seed-scholars-mate' },
  //   update: {},
  //   create: {
  //     slug: 'seed-scholars-mate',
  //     status: GameStatus.COMPLETED,
  //     result: GameResult.WHITE_WIN,
  //     endReason: EndReason.CHECKMATE,
  //     whitePlayerId: alice.id,
  //     blackPlayerId: bob.id,
  //     currentFen:
  //       'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
  //     pgn: '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#',
  //     startTime: new Date('2026-04-01T10:00:00Z'),
  //     endTime: new Date('2026-04-01T10:05:00Z'),
  //   },
  // });

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
