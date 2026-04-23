# Game Status Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect chess game-ending states (checkmate, stalemate, draw) and the check state after every move, then surface a modal dialog or a transient toast to the player.

**Architecture:** All detection logic lives in `useChessGame` as an exported pure function `detectStatus(chess)` plus a `gameStatus` state field. Two new presentational components (`GameResultModal`, `CheckToast`) consume `gameStatus` and are wired in `PlayPageClient` with no chess logic of their own.

**Tech Stack:** chess.js (already installed), React hooks, shadcn/ui Dialog (to be added), Tailwind CSS, Vitest + React Testing Library.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `client/src/hooks/useChessGame.ts` | Modify | Add `GameStatus` type, `detectStatus`, `gameStatus` state, `resetGame` |
| `client/src/hooks/useChessGame.test.ts` | Modify | Tests for `detectStatus`, `gameStatus`, `resetGame` |
| `client/src/components/play/GameResultModal.tsx` | Create | shadcn Dialog shown on checkmate/stalemate/draw |
| `client/src/components/play/CheckToast.tsx` | Create | Transient "Check!" banner, auto-dismisses after 2 s |
| `client/src/app/play/[id]/PlayPageClient.tsx` | Modify | Wire `gameStatus` + `resetGame` into new components |
| `client/src/components/ui/dialog.tsx` | Create (generated) | shadcn Dialog primitive |

---

## Task 1: Add `GameStatus` type and `detectStatus` to `useChessGame`

**Files:**
- Modify: `client/src/hooks/useChessGame.ts`
- Modify: `client/src/hooks/useChessGame.test.ts`

- [ ] **Step 1: Write the failing tests for `detectStatus`**

Add the following block to the **bottom** of `client/src/hooks/useChessGame.test.ts`, below the existing `describe('useChessGame', ...)` block:

```ts
import { Chess } from 'chess.js'
import { detectStatus } from './useChessGame'

describe('detectStatus', () => {
  it('returns playing for the initial position', () => {
    const chess = new Chess()
    expect(detectStatus(chess)).toEqual({ type: 'playing' })
  })

  it('returns checkmate with winner white after Scholar\'s mate', () => {
    const chess = new Chess()
    // 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#
    chess.move({ from: 'e2', to: 'e4' })
    chess.move({ from: 'e7', to: 'e5' })
    chess.move({ from: 'f1', to: 'c4' })
    chess.move({ from: 'b8', to: 'c6' })
    chess.move({ from: 'd1', to: 'h5' })
    chess.move({ from: 'g8', to: 'f6' })
    chess.move({ from: 'h5', to: 'f7' })
    expect(detectStatus(chess)).toEqual({ type: 'checkmate', winner: 'white' })
  })

  it('returns check with the correct player', () => {
    // Bb5+ gives check to black king along the b5-e8 diagonal
    // 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Na5 6.Bb5+
    const chess = new Chess()
    chess.move({ from: 'e2', to: 'e4' })
    chess.move({ from: 'e7', to: 'e5' })
    chess.move({ from: 'g1', to: 'f3' })
    chess.move({ from: 'b8', to: 'c6' })
    chess.move({ from: 'f1', to: 'c4' })
    chess.move({ from: 'g8', to: 'f6' })
    chess.move({ from: 'f3', to: 'g5' })
    chess.move({ from: 'd7', to: 'd5' })
    chess.move({ from: 'e4', to: 'd5' })
    chess.move({ from: 'c6', to: 'a5' })
    chess.move({ from: 'c4', to: 'b5' })
    expect(detectStatus(chess)).toEqual({ type: 'check', player: 'black' })
  })

  it('returns stalemate', () => {
    // King on a1, white queen on b3, white king on c1 — black has no moves
    const chess = new Chess()
    chess.load('8/8/8/8/8/1Q6/8/k1K5 b - - 0 1')
    expect(detectStatus(chess)).toEqual({ type: 'stalemate' })
  })

  it('returns draw with reason insufficient_material for lone kings', () => {
    const chess = new Chess()
    chess.load('k7/8/8/8/8/8/8/7K w - - 0 1')
    expect(detectStatus(chess)).toEqual({ type: 'draw', reason: 'insufficient_material' })
  })

  it('returns draw with reason threefold_repetition after knights shuttle', () => {
    // 1.Nf3 Nf6 2.Ng1 Ng8 3.Nf3 Nf6 4.Ng1 Ng8 — starting position repeats 3 times
    const chess = new Chess()
    chess.move({ from: 'g1', to: 'f3' })
    chess.move({ from: 'g8', to: 'f6' })
    chess.move({ from: 'f3', to: 'g1' })
    chess.move({ from: 'f6', to: 'g8' })
    chess.move({ from: 'g1', to: 'f3' })
    chess.move({ from: 'g8', to: 'f6' })
    chess.move({ from: 'f3', to: 'g1' })
    chess.move({ from: 'f6', to: 'g8' })
    expect(detectStatus(chess)).toEqual({ type: 'draw', reason: 'threefold_repetition' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run from the `client` directory:
```
npm test
```

Expected: FAIL — `detectStatus` is not exported from `useChessGame`.

- [ ] **Step 3: Add `GameStatus` type and `detectStatus` to `useChessGame.ts`**

Insert the following **before** the `useChessGame` function declaration in `client/src/hooks/useChessGame.ts`:

```ts
export type GameStatus =
  | { type: 'playing' }
  | { type: 'check'; player: 'white' | 'black' }
  | { type: 'checkmate'; winner: 'white' | 'black' }
  | { type: 'stalemate' }
  | { type: 'draw'; reason: 'insufficient_material' | 'threefold_repetition' }

export function detectStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    return { type: 'checkmate', winner: chess.turn() === 'w' ? 'black' : 'white' }
  }
  if (chess.isStalemate()) return { type: 'stalemate' }
  if (chess.isInsufficientMaterial()) return { type: 'draw', reason: 'insufficient_material' }
  if (chess.isThreefoldRepetition()) return { type: 'draw', reason: 'threefold_repetition' }
  if (chess.isCheck()) {
    return { type: 'check', player: chess.turn() === 'w' ? 'white' : 'black' }
  }
  return { type: 'playing' }
}
```

Note on `winner` derivation: after a move, `chess.turn()` returns the color of the player who must move next. On checkmate that player is the one who is mated, so the winner is the opposite color.

- [ ] **Step 4: Run tests to verify they pass**

```
npm test
```

Expected: all `detectStatus` tests PASS. Existing `useChessGame` tests also still PASS.

---

## Task 2: Add `gameStatus` state and `resetGame` to the hook

**Files:**
- Modify: `client/src/hooks/useChessGame.ts`
- Modify: `client/src/hooks/useChessGame.test.ts`

- [ ] **Step 1: Write failing tests for `gameStatus` and `resetGame`**

Append to the existing `describe('useChessGame', ...)` block in `client/src/hooks/useChessGame.test.ts`:

```ts
  it('gameStatus starts as playing', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.gameStatus).toEqual({ type: 'playing' })
  })

  it('gameStatus becomes checkmate after Scholar\'s mate via makeMove', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.makeMove('e2', 'e4') })
    act(() => { result.current.makeMove('e7', 'e5') })
    act(() => { result.current.makeMove('f1', 'c4') })
    act(() => { result.current.makeMove('b8', 'c6') })
    act(() => { result.current.makeMove('d1', 'h5') })
    act(() => { result.current.makeMove('g8', 'f6') })
    act(() => { result.current.makeMove('h5', 'f7') })
    expect(result.current.gameStatus).toEqual({ type: 'checkmate', winner: 'white' })
  })

  it('resetGame resets the board and gameStatus', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.makeMove('e2', 'e4') })
    act(() => { result.current.resetGame() })
    expect(result.current.position).toBe(STARTING_FEN)
    expect(result.current.moves).toEqual([])
    expect(result.current.gameStatus).toEqual({ type: 'playing' })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test
```

Expected: FAIL — `gameStatus` and `resetGame` not in hook return value.

- [ ] **Step 3: Update `useChessGame` to expose `gameStatus` and `resetGame`**

Replace the `useChessGame` function in `client/src/hooks/useChessGame.ts` with the version below. Changes are: new `gameStatus` state, `setGameStatus(detectStatus(chess))` call at the end of each successful move branch in both `makeMove` and `onSquareClick`, and new `resetGame` function:

```ts
export interface UseChessGameReturn {
  position: string;
  moves: string[];
  orientation: GameOrientation;
  gameStatus: GameStatus;
  makeMove: (from: string, to: string) => boolean;
  optionSquares: Record<string, React.CSSProperties>;
  onSquareClick: (args: SquareHandlerArgs) => void;
  resetGame: () => void;
}

export function useChessGame(): UseChessGameReturn {
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState(() => chess.fen());
  const [moves, setMoves] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>({ type: 'playing' });
  const [optionSquares, setOptionSquares] = useState({});
  const [moveFrom, setMoveFrom] = useState("");

  const orientation: GameOrientation = "white";

  function makeMove(from: string, to: string): boolean {
    try {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) return false;

      setPosition(chess.fen());
      setMoves((prev) => [...prev, result.san]);
      setMoveFrom("");
      setOptionSquares({});
      setGameStatus(detectStatus(chess));
      return true;
    } catch {
      return false;
    }
  }

  function getMoveOptions(square: Square) {
    const moves = chess.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }
    const newSquares: Record<string, React.CSSProperties> = {};
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chess.get(move.to) &&
          chess.get(move.to)?.color !== chess.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      };
    }
    newSquares[square] = { background: "rgba(255, 255, 0, 0.4)" };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    const legalMoves = chess.moves({ square: moveFrom as Square, verbose: true });
    const foundMove = legalMoves.find((m) => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square as Square);
      setMoveFrom(hasMoveOptions ? square : "");
      return;
    }

    try {
      const result = chess.move({ from: moveFrom, to: square, promotion: "q" });
      setPosition(chess.fen());
      setMoves((prev) => [...prev, result.san]);
      setMoveFrom("");
      setOptionSquares({});
      setGameStatus(detectStatus(chess));
    } catch {
      const hasMoveOptions = getMoveOptions(square as Square);
      if (hasMoveOptions) setMoveFrom(square);
    }
  }

  function resetGame() {
    chess.reset();
    setPosition(chess.fen());
    setMoves([]);
    setGameStatus({ type: 'playing' });
    setMoveFrom("");
    setOptionSquares({});
  }

  return {
    position,
    moves,
    orientation,
    gameStatus,
    optionSquares,
    onSquareClick,
    makeMove,
    resetGame,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```
git add client/src/hooks/useChessGame.ts client/src/hooks/useChessGame.test.ts
git commit -m "feat: add GameStatus detection and resetGame to useChessGame"
```

---

## Task 3: Install shadcn Dialog

**Files:**
- Create (generated): `client/src/components/ui/dialog.tsx`

- [ ] **Step 1: Add the shadcn Dialog component**

Run from the `client` directory:

```
npx shadcn add dialog
```

When prompted whether to overwrite any existing file, choose **Yes**.

- [ ] **Step 2: Verify the file was created**

Check that `client/src/components/ui/dialog.tsx` exists and exports `Dialog`, `DialogContent`, and `DialogTitle`.

- [ ] **Step 3: Commit**

```
git add client/src/components/ui/dialog.tsx
git commit -m "feat: add shadcn Dialog component"
```

---

## Task 4: Create `GameResultModal`

**Files:**
- Create: `client/src/components/play/GameResultModal.tsx`

- [ ] **Step 1: Create the component**

Create `client/src/components/play/GameResultModal.tsx` with the following content:

```tsx
'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { GameStatus } from '@/hooks/useChessGame'

interface GameResultModalProps {
  gameStatus: GameStatus
  onPlayAgain: () => void
}

interface ModalContent {
  title: string
  subtitle: string
}

function getModalContent(gameStatus: GameStatus): ModalContent | null {
  if (gameStatus.type === 'checkmate') {
    return {
      title: gameStatus.winner === 'white' ? 'White Won!' : 'Black Won!',
      subtitle:
        gameStatus.winner === 'white' ? 'Black is checkmated' : 'White is checkmated',
    }
  }
  if (gameStatus.type === 'stalemate') {
    return { title: 'Draw', subtitle: 'Stalemate' }
  }
  if (gameStatus.type === 'draw') {
    const subtitles: Record<string, string> = {
      insufficient_material: 'Insufficient material',
      threefold_repetition: 'Threefold repetition',
    }
    return { title: 'Draw', subtitle: subtitles[gameStatus.reason] }
  }
  return null
}

export function GameResultModal({ gameStatus, onPlayAgain }: GameResultModalProps) {
  const content = getModalContent(gameStatus)

  return (
    <Dialog open={content !== null}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="flex flex-col items-center gap-4 text-center sm:max-w-sm"
      >
        <DialogTitle className="text-2xl font-bold">{content?.title}</DialogTitle>
        <p className="text-muted-foreground text-sm">{content?.subtitle}</p>
        <Button onClick={onPlayAgain} className="mt-2 w-full">
          Play Again
        </Button>
      </DialogContent>
    </Dialog>
  )
}
```

Note: `getModalContent` returns `null` when the game is not over. `Dialog` with `open={false}` renders nothing, so the modal is invisible while the game is in progress.

- [ ] **Step 2: Check for linter errors**

```
npm run lint
```

Expected: no errors in `GameResultModal.tsx`.

- [ ] **Step 3: Commit**

```
git add client/src/components/play/GameResultModal.tsx
git commit -m "feat: add GameResultModal component"
```

---

## Task 5: Create `CheckToast`

**Files:**
- Create: `client/src/components/play/CheckToast.tsx`

- [ ] **Step 1: Create the component**

Create `client/src/components/play/CheckToast.tsx` with the following content:

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { GameStatus } from '@/hooks/useChessGame'

interface CheckToastProps {
  gameStatus: GameStatus
}

export function CheckToast({ gameStatus }: CheckToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (gameStatus.type !== 'check') return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 2000)
    return () => clearTimeout(timer)
  }, [gameStatus])

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none mb-2 text-center text-sm font-semibold text-yellow-700 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      Check!
    </div>
  )
}
```

The `useEffect` dependency on the full `gameStatus` object means it re-fires every time a new status arrives. Re-receiving `{ type: 'check' }` after a reset restarts the timer correctly.

- [ ] **Step 2: Commit**

```
git add client/src/components/play/CheckToast.tsx
git commit -m "feat: add CheckToast component"
```

---

## Task 6: Wire components into `PlayPageClient`

**Files:**
- Modify: `client/src/app/play/[id]/PlayPageClient.tsx`

- [ ] **Step 1: Update `PlayPageClient.tsx`**

Replace the entire content of `client/src/app/play/[id]/PlayPageClient.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import { MobileTabBar } from '@/components/play/MobileTabBar'
import { MovesPanel } from '@/components/play/MovesPanel'
import { PlayBoard } from '@/components/play/PlayBoard'
import { GameResultModal } from '@/components/play/GameResultModal'
import { CheckToast } from '@/components/play/CheckToast'
import { useChessGame } from '@/hooks/useChessGame'

interface PlayPageClientProps {
  roomId: string
}

export function PlayPageClient({ roomId }: PlayPageClientProps) {
  const {
    position,
    moves,
    orientation,
    makeMove,
    optionSquares,
    onSquareClick,
    gameStatus,
    resetGame,
  } = useChessGame()
  const [activeTab, setActiveTab] = useState<'moves'>('moves')

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <span className="text-lg font-semibold">Chessium</span>
        <span className="font-mono text-sm text-muted-foreground">Room: {roomId}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto p-4 lg:justify-center">
          <div className="w-full max-w-[min(calc(100dvh-8rem),600px)]">
            <CheckToast gameStatus={gameStatus} />
            <div className="aspect-square w-full">
              <PlayBoard
                position={position}
                orientation={orientation}
                onMove={makeMove}
                optionSquares={optionSquares}
                onSquareClick={onSquareClick}
              />
            </div>
          </div>

          <div className="mt-4 w-full max-w-[min(calc(100dvh-8rem),600px)] lg:hidden">
            <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab === 'moves' && (
              <div className="max-h-48 overflow-y-auto rounded-b border border-t-0 border-border">
                <MovesPanel moves={moves} />
              </div>
            )}
          </div>
        </div>

        <aside className="hidden w-72 flex-col border-l border-border lg:flex">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Moves</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MovesPanel moves={moves} />
          </div>
        </aside>
      </div>

      <GameResultModal gameStatus={gameStatus} onPlayAgain={resetGame} />
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite**

```
npm test
```

Expected: all tests PASS.

- [ ] **Step 3: Run the dev server and manually verify**

```
npm run dev
```

Open `http://localhost:3000/play/test` and verify:

1. Play Scholar's mate (1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#) — modal "White Won!" appears.
2. Click "Play Again" — board resets, modal closes.
3. Play a move that puts the opponent in check — "Check!" toast appears for 2 seconds then fades.
4. Moves panel updates correctly throughout.

- [ ] **Step 4: Commit**

```
git add client/src/app/play/[id]/PlayPageClient.tsx
git commit -m "feat: wire GameResultModal and CheckToast into PlayPageClient"
```
