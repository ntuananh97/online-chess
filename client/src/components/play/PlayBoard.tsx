'use client'

import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from 'react-chessboard'
import { PromotionPicker } from '@/components/play/PromotionPicker'
import type { GameOrientation, PendingPromotion, PromotionPiece } from '@/hooks/useChessGame'

interface PlayBoardProps {
  position: string
  orientation: GameOrientation
  onMove: (from: string, to: string) => boolean
  pendingPromotion: PendingPromotion | null
  onPromotionSelect: (piece: PromotionPiece) => void
  onPromotionCancel: () => void
  optionSquares: Record<string, React.CSSProperties>
  onSquareClick: (args: SquareHandlerArgs) => void
}

export function PlayBoard({
  position,
  orientation,
  onMove,
  pendingPromotion,
  onPromotionSelect,
  onPromotionCancel,
  optionSquares,
  onSquareClick,
}: PlayBoardProps) {
  const getSquarePosition = (square: string) => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
    const rank = Number(square[1])

    if (Number.isNaN(file) || Number.isNaN(rank)) {
      return { left: 0, top: 0 }
    }

    if (orientation === 'white') {
      return {
        left: file * 12.5,
        top: (8 - rank) * 12.5,
      }
    }

    return {
      left: (7 - file) * 12.5,
      top: (rank - 1) * 12.5,
    }
  }

  const handlePieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (pendingPromotion) {
      return false
    }
    if (!sourceSquare || !targetSquare) {
      return false
    }
    return onMove(sourceSquare, targetSquare)
  }

  const pendingSquarePosition = pendingPromotion ? getSquarePosition(pendingPromotion.to) : null

  return (
    <div className="relative aspect-square w-full">
      <Chessboard
        options={{
          position,
          boardOrientation: orientation,
          squareStyles: optionSquares,
          onPieceDrop: handlePieceDrop,
          onSquareClick: onSquareClick,
        }}
      />
      {pendingPromotion && pendingSquarePosition ? (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: `${pendingSquarePosition.left}%`,
            top: `${pendingSquarePosition.top}%`,
            transform: 'translate(12%, -8%)',
          }}
        >
          <div className="pointer-events-auto">
            <PromotionPicker
              color={pendingPromotion.color}
              onSelect={onPromotionSelect}
              onCancel={onPromotionCancel}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
