'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
    const subtitles: Record<'insufficient_material' | 'threefold_repetition', string> = {
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
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
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
