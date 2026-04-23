# Play Page Design — `/play/[id]`

**Date:** 2026-04-23  
**Scope:** MVP UI + local move validation with drag-drop and click-to-move. No socket/backend integration.

---

## Overview

The play page is where two players face each other on the chessboard. For MVP it supports local two-player interaction (white and black alternate on the same client) with full move validation powered by `chess.js`. Real-time networking (Socket.io) and timers are out of scope for this spec.

---

## File Structure

```
client/src/
├── app/
│   └── play/
│       └── [id]/
│           ├── page.tsx          # Server route entry, reads [id] from params
│           └── PlayPageClient.tsx # Client layout composition + UI state wiring
├── components/
│   └── play/
│       ├── PlayBoard.tsx         # Only file that imports react-chessboard
│       ├── MovesPanel.tsx        # Move history list in SAN notation
│       └── MobileTabBar.tsx      # Tab bar shown below board on mobile
└── hooks/
    └── useChessGame.ts           # All chess.js usage lives here; exposes clean state + actions
```

---

## Layout

### Desktop (`lg` and above)
A two-column layout filling the viewport height:

- **Left column:** `PlayBoard` — square, responsive, max-width capped so the board does not grow too large on wide screens.
- **Right column:** `MovesPanel` — fixed width, scrollable list of moves, sticky within the viewport.
- Light header bar at the top: app name ("Chessium") and the room ID from the URL param.

### Mobile (below `lg`)
A single-column stacked layout:

- `PlayBoard` at the top, full width.
- `MobileTabBar` directly below the board. MVP contains one tab: **Moves**.
- The active tab's content (moves list) renders below the tab bar.

---

## Component Contracts

### `useChessGame` (hook)

All `chess.js` imports are confined to this file.

```ts
// Returns
{
  position: string            // Current board position as FEN
  moves: string[]             // Move history in SAN notation (e.g. ["e4", "e5", "Nf3"])
  orientation: "white" | "black"  // Whose perspective the board is rendered from
  makeMove: (from: string, to: string) => boolean
  optionSquares: Record<string, React.CSSProperties> // Highlight styles for selectable/target squares
  onSquareClick: (args: SquareHandlerArgs) => void   // Click-to-move handler for react-chessboard
  // makeMove returns true on a legal move (updates state), false on illegal (no state change)
}
```

Internally holds a `Chess` instance in state and tracks transient click-to-move UI state:

- `moveFrom`: selected source square (empty when no active selection)
- `optionSquares`: computed square highlight map for legal targets and selected source square

Move handling rules:

- `makeMove(from, to)` handles drag-drop moves and, on success, updates `position` + appends SAN to `moves`.
- `onSquareClick` supports click-to-move by selecting a piece, showing legal destinations, validating target click, then committing the move.
- On successful move, selection/highlights are cleared.
- On invalid target click, the hook either reselects a newly clicked movable piece or clears selection when no legal options exist.

### `PlayBoard`

Only component that imports `react-chessboard`. Exposes a stable prop API so swapping the board library later does not affect any parent.

```ts
interface PlayBoardProps {
  position: string
  orientation: "white" | "black"
  onMove: (from: string, to: string) => boolean
  optionSquares: Record<string, React.CSSProperties>
  onSquareClick: (args: SquareHandlerArgs) => void
}
```

- Passes `position` as the `position` prop to `Chessboard`.
- Wires drag-drop via `onPieceDrop` → calls `onMove(from, to)` → returns the boolean directly so react-chessboard snaps the piece back on `false`.
- Wires click-to-move via `onSquareClick` and applies `optionSquares` through `squareStyles`.
- No internal state; purely controlled.

### `MovesPanel`

```ts
interface MovesPanelProps {
  moves: string[]   // SAN strings in chronological order
}
```

- Groups moves into pairs: `[["e4","e5"], ["Nf3","Nc6"], ...]`.
- Renders as a numbered list: `1. e4 e5`, `2. Nf3 Nc6`, ...
- Shows empty state text ("No moves yet") when `moves` is empty.
- Scrollable container with a max height so it never overflows the panel.

### `MobileTabBar`

```ts
interface MobileTabBarProps {
  activeTab: "moves"          // Union type; extend later for "info" | "chat"
  onTabChange: (tab: "moves") => void
}
```

MVP renders a single "Moves" tab. The tab bar design leaves visual room to add more tabs later without a layout change.

### `page.tsx`

- Receives `params: { id: string }` from Next.js App Router.
- Renders `PlayPageClient` with `roomId`.

### `PlayPageClient.tsx`

- Calls `useChessGame()` to get all state and actions.
- Manages `activeTab` state for mobile tab bar.
- Composes the full layout from the components above.
- Displays the room `id` in the header bar.

---

## Data Flow

```
page.tsx
  └── PlayPageClient
        └── useChessGame()   ←  chess.js
        ├── position: FEN string
        ├── moves: SAN[]
        ├── makeMove(from, to) → boolean
        ├── optionSquares: square highlight styles
        └── onSquareClick(args): click-to-move controller

  ├── <PlayBoard position onMove orientation optionSquares onSquareClick />
  └── <MovesPanel moves />          (desktop panel or mobile tab content)
      <MobileTabBar ... />          (mobile only)
```

No props are passed downward beyond these direct connections. Components do not call `chess.js` directly.

---

## Behavior

| Action | Result |
|--------|--------|
| Player drags a piece to a legal square | `makeMove` returns `true`, FEN updates, SAN appended to moves list |
| Player drags a piece to an illegal square | `makeMove` returns `false`, piece snaps back, no state change |
| Player clicks a movable piece | Source square is highlighted, legal destinations are highlighted |
| Player clicks a valid destination | Move is committed, FEN/SAN update, highlights are cleared |
| Player clicks an invalid destination | If clicked square has another movable piece, selection switches; otherwise highlights clear |
| Board starts | Standard starting position (FEN), moves list empty |
| White moves, then black moves | Turns alternate automatically via `chess.js` internal turn tracking |

---

## Out of Scope (this spec)

- Socket.io real-time sync
- Server-side move validation
- Timers / clocks
- Resign / draw / rematch actions
- Chat
- Player info / avatars
- Board flip control
- Promotion UI (pawn promotion defaults to queen for MVP)

---

## Success Criteria

1. Navigating to `/play/abc123` renders without errors; room ID "abc123" is visible in the header.
2. Both players can make moves on the same board; illegal moves are rejected and pieces snap back.
3. Click-to-move works: selecting a piece shows legal targets, valid target click commits move, invalid click does not corrupt state.
4. Each legal move appears immediately in the moves panel as SAN notation.
5. On mobile, the tab bar appears below the board and the moves list is accessible via the Moves tab.
6. No direct `chess.js` imports outside `useChessGame.ts`; no direct `react-chessboard` imports outside `PlayBoard.tsx`.
