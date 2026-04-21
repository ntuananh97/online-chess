# Online Chess Development Plan

## Sprint 1: Foundation and Data Schema

**Goal:** Build a solid foundation for both frontend and backend, and establish clear communication standards.

### Project Initialization and CI/CD

- Set up Next.js (App Router), Tailwind CSS, and Radix primitives via `shadcn/ui`.
- Set up NestJS with core modules: `AuthModule`, `GameModule`, and `HistoryModule`.
- Configure linting, Prettier, and Husky to enforce code conventions.

### Database Design (Prisma + PostgreSQL)



### Frontend State Management Preparation

- Initialize a lightweight Zustand store for guest session data (`Nickname`, `GuestID`).
- Configure TanStack Query with native `fetch` to prepare API integration.

## Sprint 2: Core Chess Engine

**Goal:** Ensure chess logic works perfectly in offline/local mode before moving to networked play.

### Build a Chess.js Adapter (Frontend and Backend)

- Create an interface/class wrapper around `chess.js`.
- This adapter should handle:
  - FEN loading
  - Move validation
  - Checkmate/stalemate detection
  - PGN export
- Keep the adapter code shared or mirrored across both Next.js and NestJS.

### Integrate Chessboard UI (Frontend)

- Wrap `react-chessboard` into an isolated component.
- Develop local play flow (both sides on one client) for end-to-end validation:
  - Drag and drop move
  - Validate with adapter
  - Update FEN
  - Re-render board
- Improve UX with sound effects (move, capture, check) and valid-square highlighting.

## Sprint 3: Real-time and Multiplayer

**Goal:** Bring the board online with strict state synchronization. This is the most complex sprint.

### Set Up Socket.io Gateway (NestJS)

- Configure WebSockets in `GameModule`.
- Implement room lifecycle:
  - Create Room
  - Join Room
  - Leave Room
- Manage connection mapping by `GuestID`.

### Synchronize Moves and Game State (Server-Authoritative)

- Client sends a `move_attempt` event (proposed move).
- Server validates with the `chess.js` adapter.
- If valid:
  - Update authoritative state on server
  - Broadcast `move_confirmed` event with new FEN to both clients
- Handle disconnect/reconnect with a grace period.

### Implement Timer System

- Build server-side timestamp authority and remaining-time management.
- Implement a client hook using `requestAnimationFrame` for smooth countdown rendering based on server timing data.

## Sprint 4: Data Management and MVP Polish

**Goal:** Persist results, calculate rating, and polish the overall experience.

### Complete Guest Auth and Game Entry Flow

- Home page flow:
  - Enter nickname
  - Receive JWT from `AuthModule`
  - Store token/session in Zustand and LocalStorage
- Build a waiting room UI with shareable room link copy.

### Store Match History (`HistoryModule`)

- When a game ends (checkmate/draw/resign/timeout), server automatically saves PGN and result to PostgreSQL.
- Provide REST APIs in NestJS and fetch with TanStack Query in Next.js to display played matches.

### Simple Leaderboard

- Implement basic Elo rating update logic on game completion.
- Build a leaderboard page using `shadcn/ui` Table.
