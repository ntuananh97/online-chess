# Prisma v7 Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tích hợp Prisma v7 vào NestJS backend với full schema chess MVP, PrismaModule toàn cục, exception filter, migration và seed script.

**Architecture:** `PrismaModule` (@Global) export `PrismaService` dùng chung toàn app. `prisma.config.ts` ở root theo Prisma v7 style. `PrismaExceptionFilter` đăng ký global trong `main.ts`.

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL, TypeScript, Jest, npm

---

## File Structure

| File | Vai trò |
|---|---|
| `backend/prisma.config.ts` | Prisma v7 defineConfig — khai báo schema path + DATABASE_URL |
| `backend/prisma/schema.prisma` | Toàn bộ data model: enums + User, Game, Move |
| `backend/prisma/migrations/` | Auto-generated bởi `prisma migrate dev` |
| `backend/prisma/seed.ts` | Dev seed: 2 user mẫu + 1 game COMPLETED |
| `backend/.env.example` | Template env cho team |
| `backend/src/prisma/prisma.service.ts` | PrismaClient wrapper + NestJS lifecycle hooks |
| `backend/src/prisma/prisma.module.ts` | @Global module export PrismaService |
| `backend/src/prisma/prisma-exception.filter.ts` | Map P2002/P2025 → HTTP 409/404 |
| `backend/src/prisma/prisma.service.spec.ts` | Unit test PrismaService |
| `backend/src/prisma/prisma-exception.filter.spec.ts` | Unit test PrismaExceptionFilter |
| `backend/src/app.module.ts` | Thêm PrismaModule vào imports |
| `backend/src/main.ts` | Đăng ký PrismaExceptionFilter global |
| `backend/package.json` | Thêm prisma scripts + postinstall |

---

## Task 1: Cài đặt dependencies & khởi tạo Prisma

**Files:**
- Modify: `backend/package.json`
- Create: `backend/.env`
- Create: `backend/.env.example`

- [ ] **Step 1.1: Cài @prisma/client và prisma**

Chạy trong thư mục `backend/`:
```bash
npm install @prisma/client
npm install prisma --save-dev
```

Expected output: `added N packages` — không có error.

- [ ] **Step 1.2: Khởi tạo Prisma**

```bash
npx prisma init --db-url "postgresql://user:password@localhost:5432/chessium_dev"
```

Expected: sinh ra `prisma/schema.prisma` và `.env` với `DATABASE_URL`.  
Nếu `.env` đã tồn tại, lệnh sẽ bỏ qua — tự thêm dòng sau vào `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/chessium_dev"
```

- [ ] **Step 1.3: Tạo `.env.example`**

Tạo file `backend/.env.example`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/chessium_dev"
TEST_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/chessium_test"
```

- [ ] **Step 1.4: Đảm bảo `.env` trong `.gitignore`**

Mở `backend/.gitignore`, kiểm tra có dòng `.env` chưa. Nếu chưa có, thêm:
```
.env
```

- [ ] **Step 1.5: Thêm scripts vào `package.json`**

Mở `backend/package.json`, thêm vào block `"scripts"`:
```json
"postinstall": "prisma generate",
"prisma:generate": "prisma generate",
"prisma:migrate:dev": "prisma migrate dev",
"prisma:migrate:deploy": "prisma migrate deploy",
"prisma:studio": "prisma studio",
"prisma:seed": "ts-node prisma/seed.ts"
```

- [ ] **Step 1.6: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "chore: install prisma v7 and add npm scripts"
```

---

## Task 2: Tạo `prisma.config.ts` (Prisma v7 style)

**Files:**
- Create: `backend/prisma.config.ts`

- [ ] **Step 2.1: Tạo `prisma.config.ts` ở root `backend/`**

```typescript
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

> `prisma.config.ts` phải ở cùng level với `package.json` — đây là điểm khác biệt lớn so với Prisma v6 (v6 đọc `DATABASE_URL` trực tiếp từ `schema.prisma`).

- [ ] **Step 2.2: Commit**

```bash
git add prisma.config.ts
git commit -m "chore: add prisma.config.ts for v7 defineConfig"
```

---

## Task 3: Viết Prisma schema

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 3.1: Thay toàn bộ nội dung `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --------------- Enums ---------------

enum GameStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
  ABANDONED
}

enum GameResult {
  WHITE_WIN
  BLACK_WIN
  DRAW
  ONGOING
}

enum EndReason {
  CHECKMATE
  STALEMATE
  TIMEOUT
  RESIGNATION
  DRAW_AGREEMENT
  INSUFFICIENT_MATERIAL
}

enum PieceColor {
  WHITE
  BLACK
}

// --------------- Models ---------------

model User {
  id           String   @id @default(uuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  eloRating    Int      @default(1200)

  gamesAsWhite Game[]   @relation("WhitePlayer")
  gamesAsBlack Game[]   @relation("BlackPlayer")

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([eloRating])
}

model Game {
  id          String     @id @default(uuid())
  slug        String     @unique

  initialTime Int        @default(600)
  increment   Int        @default(0)

  status      GameStatus @default(WAITING)
  result      GameResult @default(ONGOING)
  endReason   EndReason?

  currentFen  String     @default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  pgn         String?    @db.Text

  whitePlayerId       String?
  whitePlayer         User?   @relation("WhitePlayer", fields: [whitePlayerId], references: [id])

  blackPlayerId       String?
  blackPlayer         User?   @relation("BlackPlayer", fields: [blackPlayerId], references: [id])

  ratingSnapshotWhite Int?
  ratingSnapshotBlack Int?

  moves     Move[]

  startTime DateTime?
  endTime   DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([status])
  @@index([slug])
}

model Move {
  id          String     @id @default(uuid())
  gameId      String
  game        Game       @relation(fields: [gameId], references: [id])

  moveNumber  Int
  playerColor PieceColor
  notation    String
  fenBefore   String
  fenAfter    String

  timeLeft    Int
  createdAt   DateTime   @default(now())

  @@index([gameId, moveNumber])
}
```

- [ ] **Step 3.2: Validate schema**

```bash
npx prisma validate
```

Expected output: `The schema at prisma/schema.prisma is valid`.

- [ ] **Step 3.3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: define prisma schema for chess MVP (User, Game, Move)"
```

---

## Task 4: PrismaService + PrismaModule

**Files:**
- Create: `backend/src/prisma/prisma.service.ts`
- Create: `backend/src/prisma/prisma.module.ts`
- Create: `backend/src/prisma/prisma.service.spec.ts`

- [ ] **Step 4.1: Viết failing test trước**

Tạo `backend/src/prisma/prisma.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();
    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expose prisma query methods', () => {
    expect(typeof service.user.findMany).toBe('function');
    expect(typeof service.game.findMany).toBe('function');
    expect(typeof service.move.findMany).toBe('function');
  });
});
```

- [ ] **Step 4.2: Chạy test để xác nhận fail**

```bash
npm test -- --testPathPattern="prisma.service"
```

Expected: FAIL — `Cannot find module './prisma.service'`

- [ ] **Step 4.3: Tạo `prisma.service.ts`**

Tạo `backend/src/prisma/prisma.service.ts`:
```typescript
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

- [ ] **Step 4.4: Generate Prisma Client (cần có trước khi test)**

```bash
npm run prisma:generate
```

Expected: `✔ Generated Prisma Client` — file sinh ra trong `node_modules/@prisma/client`.

- [ ] **Step 4.5: Chạy lại test — phải pass**

```bash
npm test -- --testPathPattern="prisma.service"
```

Expected: PASS (2 tests).

- [ ] **Step 4.6: Tạo `prisma.module.ts`**

Tạo `backend/src/prisma/prisma.module.ts`:
```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> `@Global()` đảm bảo các module khác (AuthModule, GameModule, HistoryModule) chỉ cần import `PrismaModule` một lần ở `AppModule` là đủ, không cần re-import.

- [ ] **Step 4.7: Commit**

```bash
git add src/prisma/prisma.service.ts src/prisma/prisma.module.ts src/prisma/prisma.service.spec.ts
git commit -m "feat: add PrismaService and PrismaModule"
```

---

## Task 5: PrismaExceptionFilter

**Files:**
- Create: `backend/src/prisma/prisma-exception.filter.ts`
- Create: `backend/src/prisma/prisma-exception.filter.spec.ts`

- [ ] **Step 5.1: Viết failing test**

Tạo `backend/src/prisma/prisma-exception.filter.spec.ts`:
```typescript
import { ArgumentsHost } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaExceptionFilter } from './prisma-exception.filter';

function makeHost(mockResponse: object): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
    }),
  } as unknown as ArgumentsHost;
}

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('maps P2002 (unique constraint) to HTTP 409', () => {
    const error = new PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '7.x' },
    );
    filter.catch(error, makeHost(mockResponse));
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it('maps P2025 (record not found) to HTTP 404', () => {
    const error = new PrismaClientKnownRequestError(
      'Record not found',
      { code: 'P2025', clientVersion: '7.x' },
    );
    filter.catch(error, makeHost(mockResponse));
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('falls back to HTTP 500 for unknown Prisma error codes', () => {
    const error = new PrismaClientKnownRequestError(
      'Unknown error',
      { code: 'P9999', clientVersion: '7.x' },
    );
    filter.catch(error, makeHost(mockResponse));
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });
});
```

- [ ] **Step 5.2: Chạy test để xác nhận fail**

```bash
npm test -- --testPathPattern="prisma-exception.filter"
```

Expected: FAIL — `Cannot find module './prisma-exception.filter'`

- [ ] **Step 5.3: Tạo `prisma-exception.filter.ts`**

Tạo `backend/src/prisma/prisma-exception.filter.ts`:
```typescript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        break;
      default:
        this.logger.error(
          `Unhandled Prisma error [${exception.code}]: ${exception.message}`,
        );
    }

    response.status(status).json({ statusCode: status, message });
  }
}
```

- [ ] **Step 5.4: Chạy lại test — phải pass**

```bash
npm test -- --testPathPattern="prisma-exception.filter"
```

Expected: PASS (3 tests).

- [ ] **Step 5.5: Commit**

```bash
git add src/prisma/prisma-exception.filter.ts src/prisma/prisma-exception.filter.spec.ts
git commit -m "feat: add PrismaExceptionFilter mapping P2002/P2025 to HTTP"
```

---

## Task 6: Wire PrismaModule & Filter vào App

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`

- [ ] **Step 6.1: Thêm PrismaModule vào `app.module.ts`**

Thay toàn bộ nội dung `backend/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 6.2: Đăng ký PrismaExceptionFilter global trong `main.ts`**

Thay toàn bộ nội dung `backend/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 6.3: Chạy toàn bộ test suite để đảm bảo không break gì**

```bash
npm test
```

Expected: tất cả tests PASS (bao gồm `app.controller.spec.ts` cũ).

- [ ] **Step 6.4: Commit**

```bash
git add src/app.module.ts src/main.ts
git commit -m "feat: wire PrismaModule and PrismaExceptionFilter into app"
```

---

## Task 7: Chạy migration đầu tiên

**Files:**
- Create: `backend/prisma/migrations/` (auto-generated)

> **Yêu cầu:** PostgreSQL đang chạy và `DATABASE_URL` trong `.env` trỏ đúng tới DB.

- [ ] **Step 7.1: Chạy migration dev**

```bash
npm run prisma:migrate:dev -- --name init_schema
```

Expected output:
```
✔ Generated Prisma Client
The following migration(s) have been applied:

migrations/
  └─ 20260421XXXXXX_init_schema/
       └─ migration.sql
```

- [ ] **Step 7.2: Verify migration SQL được sinh đúng**

Mở file `prisma/migrations/20260421XXXXXX_init_schema/migration.sql`, kiểm tra:
- Có `CREATE TYPE "GameStatus"`, `CREATE TYPE "GameResult"`, `CREATE TYPE "EndReason"`, `CREATE TYPE "PieceColor"`
- Có `CREATE TABLE "User"`, `CREATE TABLE "Game"`, `CREATE TABLE "Move"`
- Có các `CREATE INDEX` cho `eloRating`, `status`, `slug`, `gameId, moveNumber`

- [ ] **Step 7.3: Commit migration**

```bash
git add prisma/migrations/
git commit -m "feat: add initial database migration (User, Game, Move schema)"
```

---

## Task 8: Seed script

**Files:**
- Create: `backend/prisma/seed.ts`

> **Lưu ý:** Seed script dùng `bcrypt` để hash password mẫu. Nếu AuthModule chưa cài `bcrypt`, chạy `npm install bcrypt && npm install @types/bcrypt --save-dev` trước.

- [ ] **Step 8.1: Cài bcrypt nếu chưa có**

```bash
npm install bcrypt
npm install @types/bcrypt --save-dev
```

- [ ] **Step 8.2: Tạo `prisma/seed.ts`**

```typescript
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

  console.log('✔ Seed done: alice (1250), bob (1150), 1 completed game');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 8.3: Thêm seed config vào `package.json`**

Thêm block sau vào root `package.json` (ngoài `scripts`, cùng level `jest`):
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

- [ ] **Step 8.4: Chạy seed**

```bash
npm run prisma:seed
```

Expected: `✔ Seed done: alice (1250), bob (1150), 1 completed game`

- [ ] **Step 8.5: Verify dữ liệu trong DB**

```bash
npm run prisma:studio
```

Mở trình duyệt tại `http://localhost:5555`, kiểm tra bảng `User` có 2 bản ghi, `Game` có 1 bản ghi với `status = COMPLETED`.

- [ ] **Step 8.6: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add dev seed script (alice, bob, 1 completed game)"
```

---

## Verification cuối

Sau khi hoàn thành tất cả tasks, chạy full check:

```bash
# 1. Tất cả tests pass
npm test

# 2. Build thành công
npm run build

# 3. App khởi động
npm run start:dev
```

Expected `npm test`: tất cả spec files pass, không có lỗi TypeScript.  
Expected `npm run build`: `Successfully compiled: X files with tsc`.  
Expected `npm run start:dev`: `Application is running on: http://[::1]:3000` — không có lỗi Prisma connect.
