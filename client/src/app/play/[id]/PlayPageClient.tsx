'use client'

import { useState } from 'react'
import { MobileTabBar } from '@/components/play/MobileTabBar'
import { MovesPanel } from '@/components/play/MovesPanel'
import { PlayBoard } from '@/components/play/PlayBoard'
import { CheckToast } from '@/components/play/CheckToast'
import { GameResultModal } from '@/components/play/GameResultModal'
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
