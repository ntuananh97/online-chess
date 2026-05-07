'use client'

import type { PromotionPiece } from '@/hooks/useChessGame'

interface PromotionPickerProps {
  color: 'white' | 'black'
  onSelect: (piece: PromotionPiece) => void
  onCancel: () => void
}

const PIECES: Array<{ id: PromotionPiece; label: string }> = [
  { id: 'q', label: 'Queen' },
  { id: 'r', label: 'Rook' },
  { id: 'b', label: 'Bishop' },
  { id: 'n', label: 'Knight' },
]

export function PromotionPicker({ color, onSelect, onCancel }: PromotionPickerProps) {
  return (
    <div className="w-36 rounded-md border border-border bg-background p-2 shadow-lg">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        Promote {color === 'white' ? 'White' : 'Black'} pawn
      </div>
      <div className="grid gap-1">
        {PIECES.map((piece) => (
          <button
            key={piece.id}
            type="button"
            className="rounded px-2 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => onSelect(piece.id)}
          >
            {piece.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 w-full rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  )
}
