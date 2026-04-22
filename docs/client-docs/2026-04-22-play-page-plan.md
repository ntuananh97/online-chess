# Play Page `/play/[id]` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully playable local chess page at `/play/[id]` with board UI, move validation via `chess.js`, and a moves history panel.

**Architecture:** Page-level layout split into a server entry (`page.tsx`) and a client shell (`PlayPageClient.tsx`). All `chess.js` logic lives in `useChessGame` hook; all `react-chessboard` rendering lives in `PlayBoard`. Desktop shows a right panel; mobile shows a tab bar below the board.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (`cn` util), `chess.js ^1.4`, `react-chessboard ^5.10`, Vitest + React Testing Library for tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `client/src/hooks/useChessGame.ts` | All `chess.js` usage; game state + `makeMove` |
| Create | `client/src/components/play/PlayBoard.tsx` | Only file importing `react-chessboard` |
| Create | `client/src/components/play/MovesPanel.tsx` | Renders SAN move history in paired rows |
| Create | `client/src/components/play/MobileTabBar.tsx` | Tab bar shown below board on mobile |
| Create | `client/src/app/play/[id]/PlayPageClient.tsx` | `'use client'` shell — hooks + layout |
| Create | `client/src/app/play/[id]/page.tsx` | Server component; awaits params; renders client shell |
| Create | `client/src/hooks/useChessGame.test.ts` | Hook unit tests |
| Create | `client/src/components/play/MovesPanel.test.tsx` | Component unit tests |
| Create | `client/vitest.config.ts` | Vitest config with jsdom + `@` alias |
| Create | `client/vitest.setup.ts` | Imports `@testing-library/jest-dom` |
| Modify | `client/package.json` | Add `test` script |

---

## Task 1 — Vitest + React Testing Library setup

**Files:**
- Create: `client/vitest.config.ts`
- Create: `client/vitest.setup.ts`
- Modify: `client/package.json`

- [ ] **Step 1: Install test dependencies**

Run inside `client/`:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Expected: packages added to `devDependencies`, no errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
// client/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
// client/vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add `test` script to `package.json`**

In `client/package.json`, add inside `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify setup works**

Run inside `client/`:
```bash
npm test
```

Expected: `No test files found` (exit 0 or a zero-failure run). No import errors.

- [ ] **Step 6: Commit**

```bash
git add client/vitest.config.ts client/vitest.setup.ts client/package.json client/package-lock.json
git commit -m "test: set up Vitest and React Testing Library"
```

---

## Task 2 — `useChessGame` hook (TDD)

**Files:**
- Create: `client/src/hooks/useChessGame.ts`
- Create: `client/src/hooks/useChessGame.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// client/src/hooks/useChessGame.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useChessGame } from './useChessGame'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('useChessGame', () => {
  it('starts with the standard opening position', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.position).toBe(STARTING_FEN)
  })

  it('starts with an empty moves list', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.moves).toEqual([])
  })

  it('orientation defaults to white', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.orientation).toBe('white')
  })

  it('returns true and updates FEN on a legal move', () => {
    const { result } = renderHook(() => useChessGame())
    let ok: boolean
    act(() => { ok = result.current.makeMove('e2', 'e4') })
    expect(ok!).toBe(true)
    expect(result.current.position).not.toBe(STARTING_FEN)
  })

  it('appends SAN to moves list on a legal move', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.makeMove('e2', 'e4') })
    expect(result.current.moves).toEqual(['e4'])
  })

  it('accumulates multiple moves', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.makeMove('e2', 'e4') })
    act(() => { result.current.makeMove('e7', 'e5') })
    act(() => { result.current.makeMove('g1', 'f3') })
    expect(result.current.moves).toEqual(['e4', 'e5', 'Nf3'])
  })

  it('returns false and does not change state for an illegal move', () => {
    const { result } = renderHook(() => useChessGame())
    const before = result.current.position
    let ok: boolean
    act(() => { ok = result.current.makeMove('e2', 'e5') })
    expect(ok!).toBe(false)
    expect(result.current.position).toBe(before)
    expect(result.current.moves).toEqual([])
  })

  it('returns false when moving the wrong colour', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => { result.current.makeMove('e2', 'e4') }) // white moves
    let ok: boolean
    act(() => { ok = result.current.makeMove('d2', 'd4') }) // white again — wrong turn
    expect(ok!).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- src/hooks/useChessGame.test.ts
```

Expected: All 8 tests fail with "Cannot find module './useChessGame'".

- [ ] **Step 3: Implement `useChessGame`**

```ts
// client/src/hooks/useChessGame.ts
import { useState, useRef } from 'react'
import { Chess } from 'chess.js'

export type GameOrientation = 'white' | 'black'

export interface UseChessGameReturn {
  position: string
  moves: string[]
  orientation: GameOrientation
  makeMove: (from: string, to: string) => boolean
}

export function useChessGame(): UseChessGameReturn {
  const chessRef = useRef(new Chess())
  const [position, setPosition] = useState(() => chessRef.current.fen())
  const [moves, setMoves] = useState<string[]>([])
  const orientation: GameOrientation = 'white'

  function makeMove(from: string, to: string): boolean {
    try {
      const result = chessRef.current.move({ from, to, promotion: 'q' })
      if (result) {
        setPosition(chessRef.current.fen())
        setMoves(prev => [...prev, result.san])
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return { position, moves, orientation, makeMove }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- src/hooks/useChessGame.test.ts
```

Expected: `8 passed`.

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useChessGame.ts client/src/hooks/useChessGame.test.ts
git commit -m "feat: add useChessGame hook with chess.js move validation"
```

---

## Task 3 — `PlayBoard` component

No unit tests needed — it is a thin controlled wrapper around a third-party board lib. Visual verification in Task 7 covers it.

**Files:**
- Create: `client/src/components/play/PlayBoard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// client/src/components/play/PlayBoard.tsx
'use client'
import { Chessboard } from 'react-chessboard'
import type { GameOrientation } from '@/hooks/useChessGame'

interface PlayBoardProps {
  position: string
  orientation: GameOrientation
  onMove: (from: string, to: string) => boolean
}

export function PlayBoard({ position, orientation, onMove }: PlayBoardProps) {
  return (
    <div className="w-full aspect-square">
      <Chessboard
        position={position}
        boardOrientation={orientation}
        onPieceDrop={(from, to) => onMove(from, to)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors for this file.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/play/PlayBoard.tsx
git commit -m "feat: add PlayBoard wrapper component for react-chessboard"
```

---

## Task 4 — `MovesPanel` component (TDD)

**Files:**
- Create: `client/src/components/play/MovesPanel.tsx`
- Create: `client/src/components/play/MovesPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// client/src/components/play/MovesPanel.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MovesPanel } from './MovesPanel'

describe('MovesPanel', () => {
  it('shows empty state when moves array is empty', () => {
    render(<MovesPanel moves={[]} />)
    expect(screen.getByText('No moves yet.')).toBeInTheDocument()
  })

  it('renders move number and white move', () => {
    render(<MovesPanel moves={['e4']} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('e4')).toBeInTheDocument()
  })

  it('renders a full paired move on one row', () => {
    render(<MovesPanel moves={['e4', 'e5']} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('e4')).toBeInTheDocument()
    expect(screen.getByText('e5')).toBeInTheDocument()
  })

  it('renders two pairs across two rows', () => {
    render(<MovesPanel moves={['e4', 'e5', 'Nf3', 'Nc6']} />)
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('Nf3')).toBeInTheDocument()
    expect(screen.getByText('Nc6')).toBeInTheDocument()
  })

  it('handles odd number of moves — last black cell is empty', () => {
    render(<MovesPanel moves={['e4', 'e5', 'Nf3']} />)
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('Nf3')).toBeInTheDocument()
    // No error thrown for missing black move
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- src/components/play/MovesPanel.test.tsx
```

Expected: All 5 tests fail with "Cannot find module './MovesPanel'".

- [ ] **Step 3: Implement `MovesPanel`**

```tsx
// client/src/components/play/MovesPanel.tsx
interface MovesPanelProps {
  moves: string[]
}

function groupMoves(moves: string[]): Array<[string, string | undefined]> {
  const pairs: Array<[string, string | undefined]> = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i], moves[i + 1]])
  }
  return pairs
}

export function MovesPanel({ moves }: MovesPanelProps) {
  if (moves.length === 0) {
    return (
      <p className="p-4 text-sm text-muted-foreground">No moves yet.</p>
    )
  }

  return (
    <div className="overflow-y-auto p-4">
      <table className="w-full text-sm font-mono">
        <tbody>
          {groupMoves(moves).map(([white, black], index) => (
            <tr key={index} className="hover:bg-muted/40">
              <td className="w-8 select-none pr-2 text-muted-foreground">
                {index + 1}.
              </td>
              <td className="w-16 pr-4">{white}</td>
              <td className="w-16">{black ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- src/components/play/MovesPanel.test.tsx
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/play/MovesPanel.tsx client/src/components/play/MovesPanel.test.tsx
git commit -m "feat: add MovesPanel component with SAN move history"
```

---

## Task 5 — `MobileTabBar` component

**Files:**
- Create: `client/src/components/play/MobileTabBar.tsx`

> **Prerequisite:** `@/lib/utils` must exist with a `cn` helper (shadcn/ui standard). Check that `client/src/lib/utils.ts` exists. If it does not, create it:
> ```ts
> // client/src/lib/utils.ts
> import { clsx, type ClassValue } from 'clsx'
> import { twMerge } from 'tailwind-merge'
> export function cn(...inputs: ClassValue[]) {
>   return twMerge(clsx(inputs))
> }
> ```

- [ ] **Step 1: Verify or create `client/src/lib/utils.ts`**

Check if the file exists:
```bash
ls client/src/lib/utils.ts
```

If it does NOT exist, create it with the content above.

- [ ] **Step 2: Create `MobileTabBar`**

```tsx
// client/src/components/play/MobileTabBar.tsx
'use client'
import { cn } from '@/lib/utils'

type Tab = 'moves'

interface MobileTabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div className="flex border-b border-border bg-background">
      <button
        onClick={() => onTabChange('moves')}
        className={cn(
          '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'moves'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        Moves
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/play/MobileTabBar.tsx
git commit -m "feat: add MobileTabBar component for mobile tab navigation"
```

---

## Task 6 — `PlayPageClient` and `page.tsx`

**Files:**
- Create: `client/src/app/play/[id]/PlayPageClient.tsx`
- Create: `client/src/app/play/[id]/page.tsx`

- [ ] **Step 1: Create the route directory**

```bash
mkdir -p client/src/app/play/\[id\]
```

- [ ] **Step 2: Create `PlayPageClient`**

```tsx
// client/src/app/play/[id]/PlayPageClient.tsx
'use client'

import { useState } from 'react'
import { useChessGame } from '@/hooks/useChessGame'
import { PlayBoard } from '@/components/play/PlayBoard'
import { MovesPanel } from '@/components/play/MovesPanel'
import { MobileTabBar } from '@/components/play/MobileTabBar'

interface PlayPageClientProps {
  roomId: string
}

export function PlayPageClient({ roomId }: PlayPageClientProps) {
  const { position, moves, orientation, makeMove } = useChessGame()
  const [activeTab, setActiveTab] = useState<'moves'>('moves')

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <span className="text-lg font-semibold">Chessium</span>
        <span className="font-mono text-sm text-muted-foreground">
          Room: {roomId}
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Board column */}
        <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto p-4 lg:justify-center">
          <div className="aspect-square w-full max-w-[min(calc(100dvh-8rem),600px)]">
            <PlayBoard
              position={position}
              orientation={orientation}
              onMove={makeMove}
            />
          </div>

          {/* Mobile panel — hidden on lg+ */}
          <div className="mt-4 w-full max-w-[min(calc(100dvh-8rem),600px)] lg:hidden">
            <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab === 'moves' && (
              <div className="max-h-48 overflow-y-auto rounded-b border border-t-0 border-border">
                <MovesPanel moves={moves} />
              </div>
            )}
          </div>
        </div>

        {/* Desktop right panel — hidden below lg */}
        <aside className="hidden w-72 flex-col border-l border-border lg:flex">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Moves</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MovesPanel moves={moves} />
          </div>
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `page.tsx`**

```tsx
// client/src/app/play/[id]/page.tsx
import { PlayPageClient } from './PlayPageClient'

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <PlayPageClient roomId={id} />
}
```

- [ ] **Step 4: Confirm TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors across all new files.

- [ ] **Step 5: Commit**

```bash
git add client/src/app/play/
git commit -m "feat: add /play/[id] route with PlayPageClient layout"
```

---

## Task 7 — Full test run + visual verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: `13 passed` (8 hook + 5 panel), 0 failed.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 3: Open the play page**

Navigate to `http://localhost:3000/play/abc123`.

Verify:
- Header shows "Chessium" and "Room: abc123"
- Chessboard renders in the standard starting position
- Dragging a white pawn two squares forward works (piece moves, does not snap back)
- The move appears in the Moves panel as SAN (e.g. `e4`)
- Dragging a white pawn when it is black's turn snaps the piece back
- On a narrow viewport (< 1024px) the tab bar appears below the board
- Clicking "Moves" tab on mobile shows the moves list

- [ ] **Step 4: Commit final**

```bash
git add .
git commit -m "feat: play page /play/[id] complete — board, validation, moves panel"
```

---

## Success Criteria (from spec)

| # | Criterion | Covered by |
|---|-----------|-----------|
| 1 | `/play/abc123` renders; room ID visible | Task 6 + Task 7 step 3 |
| 2 | Legal moves accepted; illegal moves snapped back | Task 2 (tests) + Task 7 step 3 |
| 3 | Each legal move appears as SAN in moves panel | Task 4 (tests) + Task 7 step 3 |
| 4 | Mobile tab bar shows moves list | Task 5 + Task 7 step 3 |
| 5 | `chess.js` only in `useChessGame`; `react-chessboard` only in `PlayBoard` | Code structure enforced by Tasks 2–6 |
