'use client'

import type { GameStatus } from '@/hooks/useChessGame'

interface CheckToastProps {
  gameStatus: GameStatus
}

export function CheckToast({ gameStatus }: CheckToastProps) {
  if (gameStatus.type !== 'check') return null

  return (
    <div
      key={`${gameStatus.type}-${gameStatus.player}`}
      aria-live="polite"
      className="pointer-events-none mb-2 text-center text-sm font-semibold text-yellow-700 animate-out fade-out duration-2000"
    >
      Check!
    </div>
  )
}
