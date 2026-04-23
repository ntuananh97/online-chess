# Game Status Popup Design

**Date:** 2026-04-23
**Scope:** Detect chess game-ending states and check, display appropriate popups/toasts on the play page.

---

## Overview

After each move on the play page, the game checks whether a terminal state has been reached (checkmate, stalemate, draw) or whether the next player is in check. Terminal states show a modal dialog; check shows a transient toast. A "Play Again" button resets the board.

---

## Game States Handled

| State | Condition (`chess.js`) | UI |
|---|---|---|
| Checkmate — White won | `isCheckmate()` after black's move | Modal: "White Won!" |
| Checkmate — Black won | `isCheckmate()` after white's move | Modal: "Black Won!" |
| Stalemate | `isStalemate()` | Modal: "Draw — Stalemate" |
| Draw — Insufficient material | `isInsufficientMaterial()` | Modal: "Draw — Insufficient Material" |
| Draw — Threefold repetition | `isThreefoldRepetition()` | Modal: "Draw — Threefold Repetition" |
| Check | `isCheck()` (no terminal state) | Toast: "Check!" (auto-dismisses after 2 s) |

Detection runs in priority order: checkmate → stalemate → insufficient material → threefold repetition → check → playing.

---

## `GameStatus` Type

```ts
type GameStatus =
  | { type: 'playing' }
  | { type: 'check'; player: 'white' | 'black' }
  | { type: 'checkmate'; winner: 'white' | 'black' }
  | { type: 'stalemate' }
  | { type: 'draw'; reason: 'insufficient_material' | 'threefold_repetition' }
```

The `player` field in `check` and `winner` in `checkmate` is derived from `chess.turn()` at the moment of detection:
- After a move, `chess.turn()` returns the color of the player whose turn it now is.
- In checkmate: the player-to-move is mated → the opponent (who just moved) is the winner.
- In check: `chess.turn()` is the player currently in check.

---

## `useChessGame` Hook Changes

**New return fields:**

```ts
gameStatus: GameStatus   // current game state, updated after every move
resetGame: () => void    // resets Chess instance and all state to initial
```

**`gameStatus` state** is computed inside a helper `detectStatus(chess: Chess): GameStatus` and called at the end of every successful move inside both `makeMove` and `onSquareClick`.

**`resetGame`** creates a fresh `Chess()` instance and resets `position`, `moves`, `gameStatus`, `moveFrom`, and `optionSquares` to their initial values.

No changes to `makeMove` or `onSquareClick` return signatures or behavior.

---

## Component: `GameResultModal`

**File:** `components/play/GameResultModal.tsx`

**Props:**
```ts
interface GameResultModalProps {
  gameStatus: GameStatus
  onPlayAgain: () => void
}
```

**Behavior:**
- `open` when `gameStatus.type` is `checkmate`, `stalemate`, or `draw`
- Built with shadcn/ui `<Dialog>` — requires `npx shadcn add dialog`
- `onInteractOutside` and `onEscapeKeyDown` are both blocked (`e.preventDefault()`) — the game is over, user must take action
- Single action button: **"Play Again"** → calls `onPlayAgain`

**Content mapping:**

| `gameStatus` | Title | Subtitle |
|---|---|---|
| `checkmate`, winner: `white` | "White Won!" | "Black is checkmated" |
| `checkmate`, winner: `black` | "Black Won!" | "White is checkmated" |
| `stalemate` | "Draw" | "Stalemate" |
| `draw`, `insufficient_material` | "Draw" | "Insufficient material" |
| `draw`, `threefold_repetition` | "Draw" | "Threefold repetition" |

---

## Component: `CheckToast`

**File:** `components/play/CheckToast.tsx`

**Props:**
```ts
interface CheckToastProps {
  gameStatus: GameStatus
}
```

**Behavior:**
- Renders a small banner with text **"Check!"** positioned above the board
- Visible when `gameStatus.type === 'check'`; hidden otherwise
- Auto-dismisses after **2 seconds** via `useEffect` + `setTimeout`
- Re-triggers on each new `check` status (e.g. after reset and a new check occurs)
- Implemented with local state + CSS opacity transition — no external toast library

---

## `PlayPageClient` Changes

Destructure two new values from `useChessGame()`:

```ts
const { ..., gameStatus, resetGame } = useChessGame()
```

Add to JSX:
- `<CheckToast gameStatus={gameStatus} />` — placed above `<PlayBoard>` inside the board column
- `<GameResultModal gameStatus={gameStatus} onPlayAgain={resetGame} />` — rendered outside the main layout flow (adjacent to the root div)

No chess logic lives in `PlayPageClient`.

---

## Data Flow

```
useChessGame()
  ├── gameStatus: GameStatus   ──→  GameResultModal (open/close + content)
  │                            ──→  CheckToast (show/hide)
  └── resetGame: () => void    ──→  GameResultModal onPlayAgain
```

---

## File Changes Summary

| File | Change |
|---|---|
| `hooks/useChessGame.ts` | Add `GameStatus` type, `gameStatus` state, `detectStatus()` helper, `resetGame` |
| `components/play/GameResultModal.tsx` | New — shadcn Dialog, blocked dismiss, Play Again button |
| `components/play/CheckToast.tsx` | New — transient toast, auto-dismiss after 2 s |
| `components/play/PlayPageClient.tsx` | Wire `gameStatus` and `resetGame` to new components |
| `components/ui/dialog.tsx` | Generated by `npx shadcn add dialog` |

---

## Out of Scope

- Resign / offer draw actions
- Fifty-move rule draw (not selected)
- Animation or sound on game end
- Promotion UI (remains queen auto-promotion per existing spec)

---

## Success Criteria

1. After checkmate, modal appears immediately with the correct winner text; board is non-interactive.
2. "Play Again" resets the board to starting position and closes the modal.
3. Stalemate and both draw variants each show the correct subtitle in the modal.
4. When a king is in check (not checkmate), a "Check!" toast appears and disappears after 2 seconds without blocking interaction.
5. `chess.js` imports remain confined to `useChessGame.ts`; no chess logic in components.
6. `dialog.tsx` comes exclusively from shadcn/ui — no hand-rolled Radix Dialog wiring.
