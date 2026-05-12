# Backend — Socket.IO (NestJS) — Progress & usage

**Last updated:** 2026-05-08  
**Status:** Socket.IO gateway wires **room lifecycle** (create / join / leave) with in-memory rooms and socket ↔ `guestId` mapping. **Not implemented:** server-authoritative moves (`move_attempt` / `move_confirmed`), timer, disconnect grace period, Prisma persistence for rooms.

---

## What is done


| Area         | Details                                                                                                                                                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependencies | `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`, `class-validator`, `class-transformer` in `backend/package.json`                                                                                |
| Bootstrap    | `IoAdapter` in `backend/src/main.ts` — required so Socket.IO attaches correctly to the Nest HTTP server                                                                                                          |
| Module       | `GameModule` — `providers: [GameGateway, GameService]`                                                                                                                                                           |
| Gateway      | `GameGateway` — `handleDisconnect`, `@SubscribeMessage('create_room' | 'join_room' | 'leave_room')`, Socket.IO room joins, emits `room_created`, `game_ready`, `opponent_left`, `opponent_disconnected`, `error` |
| Room service | `GameService` — in-memory `rooms` / `sockets` maps, `GuestID`-aware join rules                                                                                                                                   |
| App wiring   | `AppModule` imports `GameModule` alongside `PrismaModule`                                                                                                                                                        |


---

## Related files


| File                                                                                       | Role                                                          |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `[backend/src/main.ts](../../backend/src/main.ts)`                                         | `app.useWebSocketAdapter(new IoAdapter(app))` before `listen` |
| `[backend/src/game/game.gateway.ts](../../backend/src/game/game.gateway.ts)`               | WebSocket (Socket.IO) entry point for the game domain         |
| `[backend/src/game/game.service.ts](../../backend/src/game/game.service.ts)`               | In-memory room lifecycle and socket metadata                  |
| `[backend/src/game/dto/create-room.dto.ts](../../backend/src/game/dto/create-room.dto.ts)` | Payload validation for `create_room`                          |
| `[backend/src/game/dto/join-room.dto.ts](../../backend/src/game/dto/join-room.dto.ts)`     | Payload validation for `join_room`                            |
| `[backend/src/game/dto/leave-room.dto.ts](../../backend/src/game/dto/leave-room.dto.ts)`   | Payload validation for `leave_room`                           |
| `[backend/src/game/game.module.ts](../../backend/src/game/game.module.ts)`                 | Registers gateway + service with Nest DI                      |
| `[backend/src/app.module.ts](../../backend/src/app.module.ts)`                             | `imports: [PrismaModule, GameModule]`                         |


---

## Socket event contract (room phase)

**Client → server**


| Event         | Payload                                           |
| ------------- | ------------------------------------------------- |
| `create_room` | `{ guestId, nickname, initialTime?, increment? }` |
| `join_room`   | `{ guestId, nickname, roomId }`                   |
| `leave_room`  | `{ roomId }`                                      |


**Server → client**


| Event                   | Payload                                         | Audience                      |
| ----------------------- | ----------------------------------------------- | ----------------------------- |
| `room_created`          | `{ roomId, color: 'white' }`                    | creator                       |
| `game_ready`            | `{ roomId, fen, whiteNickname, blackNickname }` | both players (Socket.IO room) |
| `opponent_left`         | `{ roomId }`                                    | remaining player              |
| `opponent_disconnected` | `{ roomId }`                                    | remaining player              |
| `error`                 | `{ message }`                                   | emitting socket               |


---

## How to use next time

1. **Run the backend:** from `backend`, `npm run start:dev` (default port `process.env.PORT ?? 3000`).
2. **Connect from a client:** point the Socket.IO client at the same HTTP origin/port (e.g. `http://localhost:3000`). Default namespace is `/`.
3. **Extend:** add `move_attempt` / `move_confirmed`, timers, reconnect grace, and tighten `cors.origin` when the frontend has a fixed domain in production.

---

## Not done yet (Sprint 3 plan)

- Server-authoritative move sync (`move_attempt` / `move_confirmed`)  
- Timer, disconnect grace period  
- Persist rooms / games to PostgreSQL (schema exists; not wired here)

For product behaviour, see `[docs/development-plan.md](../development-plan.md)`.

---

## Environment notes (Prisma + Node)

- `backend/package.json` has `postinstall`: `prisma generate`. **Prisma 7** requires a supported Node version per official docs (e.g. 20.19+, 22.12+, or 24+). If `npm install` or `npm run build` fails with missing `PrismaClient` or generate errors, **upgrade Node** to a supported release, then run `npx prisma generate` in `backend`.
- If you ever installed with `npm install --ignore-scripts`, run `npx prisma generate` once the environment is valid so a full `npm run build` succeeds.

---

## Related docs in this repo

- `[docs/development-plan.md](../development-plan.md)` — Sprint 3 real-time roadmap  
- `[docs/backend/2026-04-21-prisma-v7-integration-plan.md](2026-04-21-prisma-v7-integration-plan.md)` — Prisma / database

