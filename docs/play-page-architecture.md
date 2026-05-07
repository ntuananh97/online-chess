# Play Page Architecture and Flow

## Scope

This document summarizes the current implementation of the chess play page in the client app:

- Route entry: `client/src/app/play/[id]/page.tsx`
- Page container: `client/src/app/play/[id]/PlayPageClient.tsx`
- Board UI: `client/src/components/play/PlayBoard.tsx`
- Promotion UI: `client/src/components/play/PromotionPicker.tsx`
- Side/mobile panels: `MovesPanel`, `MobileTabBar`, `CheckToast`, `GameResultModal`
- Game logic hook: `client/src/hooks/useChessGame.ts`
- Tests: `client/src/hooks/useChessGame.test.ts`

## High-Level Architecture

Current architecture is local-state, single-client, frontend-authoritative:

1. `page.tsx` reads `roomId` from route params and passes it into `PlayPageClient`.
2. `PlayPageClient` calls `useChessGame()` and receives all game state + actions.
3. `PlayBoard` renders `react-chessboard` with:
   - current FEN position
   - board orientation
   - drag-drop callback (`onPieceDrop`)
   - click-to-move callback (`onSquareClick`)
   - highlighted legal target squares (`squareStyles`)
4. `useChessGame` holds the chess engine (`chess.js`) and controls:
   - move execution
   - SAN move history
   - game end/check status
   - promotion pending/confirm/cancel
   - move option highlighting for click flow
5. Supporting UI components read the same state:
   - `MovesPanel` for move list
   - `CheckToast` when state is check
   - `GameResultModal` when game ends

## State Model in `useChessGame`

Main state variables:

- `chess`: singleton `new Chess()` stored in React state initializer
- `position`: current FEN for board rendering
- `moves`: SAN list, append on each successful move
- `gameStatus`: union state (`playing`, `check`, `checkmate`, `stalemate`, `draw`)
- `pendingPromotion`: temporary selection state when pawn reaches last rank
- `moveFrom`: currently selected source square in click-to-move flow
- `optionSquares`: map of square styles for legal destinations and selected square

Derived/static data:

- `orientation` is currently hardcoded to `"white"`.

## Move Execution Flow

### A) Drag and Drop Path

1. User drags from source to target.
2. `PlayBoard.handlePieceDrop()` validates:
   - reject if promotion picker is currently open
   - reject if source/target missing
3. Calls `onMove` -> `useChessGame.makeMove(from, to)`.
4. `makeMove()`:
   - if promotion needed, sets `pendingPromotion`, clears click-selection state, returns `false`
   - otherwise calls `executeMove()`
5. `executeMove()` tries `chess.move(...)`:
   - on success:
     - update FEN
     - append SAN
     - clear `moveFrom`, `optionSquares`, `pendingPromotion`
     - recompute `gameStatus` via `detectStatus()`
     - return `true`
   - on fail/exception: return `false`

### B) Click-to-Move Path

1. First click on piece:
   - `onSquareClick()` calls `getMoveOptions(square)`
   - if legal moves exist, highlights targets and sets `moveFrom`
2. Second click on destination:
   - validates against verbose legal moves from `moveFrom`
   - if valid, calls `makeMove(moveFrom, square)`
   - if invalid, tries to treat second click as new source selection
3. During pending promotion, click handler returns early (input locked until select/cancel).

## Promotion Flow

1. Promotion candidate is detected in `isPromotionMove(from, to)`:
   - source piece must be pawn
   - destination must be legal
   - destination rank must be `8` for white pawn or `1` for black pawn
2. `pendingPromotion` stores `{ from, to, color }` and move is deferred.
3. `PlayBoard` computes board-relative overlay position from target square and renders `PromotionPicker`.
4. User actions:
   - select piece -> `confirmPromotion(piece)` -> `executeMove(from, to, piece)`
   - cancel -> `cancelPromotion()` (clears pending + selection/highlight)

## UI Composition and Responsiveness

Inside `PlayPageClient`:

- Top header with app title and route `roomId`
- Main content split:
  - center area: board (square aspect ratio) + status toast + mobile moves panel
  - desktop (`lg`): right sidebar move list
- Bottom modal layer:
  - `GameResultModal` opens for checkmate/stalemate/draw and offers `Play Again`

Presentation details:

- `CheckToast` only renders for `gameStatus.type === "check"`
- `MovesPanel` groups SAN list into (white, black) rows
- `MobileTabBar` currently has only one tab (`moves`) but keeps tab shell structure

## Game Status Logic

`detectStatus(chess)` order:

1. `isCheckmate` -> winner is opposite of side to move
2. `isStalemate`
3. `isInsufficientMaterial` -> draw reason
4. `isThreefoldRepetition` -> draw reason
5. `isCheck` -> checked player is current side to move
6. fallback `playing`

This is called after each successful move and after reset.

## Test Coverage Snapshot

`useChessGame.test.ts` currently covers:

- initial state (FEN, moves, orientation, status)
- legal/illegal moves
- turn validation (wrong color move)
- promotion pending, confirm, cancel
- checkmate path (Scholar's mate)
- reset behavior
- direct `detectStatus()` scenarios:
  - playing
  - checkmate
  - check
  - stalemate
  - insufficient material draw
  - threefold repetition draw

## Current Issues and Risks

### 1) No multiplayer synchronization yet

- `roomId` is display-only.
- There is no socket connection, opponent state, server authority, or reconnection logic.
- Current page behaves as local board only.

### 2) Orientation is fixed to white

- `orientation` is hardcoded and not bound to player side.
- Black-side UX is not implemented.

### 3) Local engine state is mutable singleton in hook

- `chess` is kept as a single mutable instance and mirrored into React state via derived fields.
- This is workable, but careful discipline is needed to keep UI state always in sync after every mutation.

### 4) Promotion overlay positioning is custom

- Overlay uses manual percentage positioning + transform.
- May need further QA on different board sizes/orientations and touch devices.

### 5) Limited draw condition handling in status union

- Status explicitly models only:
  - insufficient material
  - threefold repetition
- Other draw paths (for example fifty-move rule) are not represented in `GameStatus`.

### 6) Click flow edge cases can be expanded

- Existing tests mostly validate `makeMove`/status flows.
- More tests can be added for `onSquareClick` path and square highlight lifecycle.

## Suggested Next Steps

1. Introduce server-authoritative game state (WebSocket move attempt/confirm).
2. Bind orientation to assigned player side (`white`/`black`).
3. Expand `GameStatus` to include full draw taxonomy used by product.
4. Add interaction tests for click-to-move and promotion overlay UX.
5. Extract and document network/game-room contract before multiplayer rollout.

