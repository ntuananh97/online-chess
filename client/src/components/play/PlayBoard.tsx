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
    <div className="aspect-square w-full">
      <Chessboard
        options={{
          position,
          boardOrientation: orientation,
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!sourceSquare || !targetSquare) {
              return false
            }
            return onMove(sourceSquare, targetSquare)
          },
        }}
      />
    </div>
  )
}
