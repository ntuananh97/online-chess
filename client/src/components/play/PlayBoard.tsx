'use client'

import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard'
import type { GameOrientation } from '@/hooks/useChessGame'

interface PlayBoardProps {
  position: string
  orientation: GameOrientation
  onMove: (from: string, to: string) => boolean
  optionSquares: Record<string, React.CSSProperties>
  onSquareClick: (args: SquareHandlerArgs) => void
}

export function PlayBoard({ position, orientation, onMove, optionSquares, onSquareClick }: PlayBoardProps) {

  const handlePieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (!sourceSquare || !targetSquare) {
      return false
    }
    return onMove(sourceSquare, targetSquare)
  }

  return (
    <div className="aspect-square w-full">
      <Chessboard
        options={{
          position,
          boardOrientation: orientation,
          squareStyles: optionSquares,
          onPieceDrop: handlePieceDrop,
          onSquareClick: onSquareClick,
        }}
      />
    </div>
  )
}
