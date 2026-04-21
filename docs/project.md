# Chessium - Online Real-time Chess Platform (Phase 1)

## 📌 Project Overview
Chessium is a real-time online chess application designed to provide a seamless competitive experience. This project serves as a key milestone in transitioning to Fullstack development, focusing on high-performance real-time communication, strict business logic validation, and a clean Modular Monolith architecture.

## 🏗 Architecture
The project follows a **Modular Monolith** pattern to ensure maintainability and scalability while keeping the deployment simple.

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) for components, TanStack Query (React Query) with the native `fetch` API for server state, Zustand for global client state, Lucide Icons.
- **Backend:** NestJS (Modular structure).
- **Database:** PostgreSQL (via Prisma ORM).
- **Real-time:** Socket.io.
- **Chess Logic:** `chess.js` for move validation and FEN/PGN handling in Phase 1; board UI via `react-chessboard`. Both are wrapped behind small adapters (ports/interfaces) so the implementation can be swapped for custom vanilla TypeScript later without rewriting game or API layers.

---

## 🚀 Phase 1: Minimum Viable Product (MVP) Features

### 1. Core Chess Engine
- **Interactive Board:** A responsive chessboard with drag-and-drop using `react-chessboard` in Phase 1. Rendering and input are isolated behind a board "view" boundary (props/events only) so a custom canvas- or SVG-based board can replace the library later.
- **Move Validation:** `chess.js` backs rules and position updates behind a dedicated **rules engine** interface used by both client (UX, optimistic feedback) and server (authoritative validation to prevent illegal moves and cheating). The concrete `chess.js` adapter is the only place that should import that library.
- **Game State Detection:** Automatic detection of Checkmate, Stalemate, Draw, and Resignation.
- **Timer System:** Server-authoritative countdown timers (e.g., 10-minute rapid) to ensure synchronization between players.

### 2. Real-time Networking
- **Room Management:** Players can create a private game room and share a unique Room ID with an opponent.
- **Live Synchronization:** Instant move updates across clients using WebSockets (Socket.io).
- **Player Status:** Basic detection of connection/disconnection events.

### 3. User & Data Management
- **Guest Authentication:** Quick-start play by entering a nickname.
- **Basic Persistence:** Storing completed matches in PostgreSQL using PGN (Portable Game Notation).
- **Simple Leaderboard:** Ranking players based on a basic Elo rating system.

---

## 🛠 Tech Stack Details

### Frontend (Next.js)
- **Language:** TypeScript throughout the app.
- **UI:** [shadcn/ui](https://ui.shadcn.com/) (Radix primitives + Tailwind) for application chrome, forms, dialogs, and layout; Lucide for icons where needed.
- **Global State:** Zustand for cross-cutting client state (e.g., session, UI preferences, ephemeral game-room UI). Keep stores thin; derive what you can from server data via React Query.
- **Server State / API:** TanStack Query (React Query) as the single pattern for HTTP data; use the native `fetch` API as the transport (custom thin client or `queryFn` wrappers), with typed responses.
- **Chess UI & Rules (replaceable):**
  - **Board:** `react-chessboard` only inside a board component module; expose a stable API (e.g., position, orientation, legal-move highlights, `onMove`) so swapping implementations does not leak into pages or sockets code.
  - **Rules / validation:** `chess.js` only inside an adapter implementing the shared rules-engine contract; no direct `chess.js` imports in React components or Nest gateways beyond that boundary.

### Backend (NestJS)
- **Modules:**
    - `AuthModule`: Handling guest and basic JWT sessions.
    - `GameModule`: Core logic, move validation, and Socket.io gateways.
    - `HistoryModule`: Managing PostgreSQL records for past games.
- **Reliability:** Class-validator for DTOs and global exception filters.

---

## 📅 Roadmap for Next Phases
- **Phase 2:** AI Opponent (Stockfish integration) and AI Game Analysis (using MCP/Mastra).
- **Phase 3:** Advanced Matchmaking (Auto-queue) and Spectator Mode.
- **Phase 4:** Social features (Friends list, Chat, User profiles).

---
