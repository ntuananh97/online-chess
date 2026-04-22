import { useState } from 'react'
import { Chess } from 'chess.js'

export type GameOrientation = 'white' | 'black'

export interface UseChessGameReturn {
  position: string
  moves: string[]
  orientation: GameOrientation
  makeMove: (from: string, to: string) => boolean
}

export function useChessGame(): UseChessGameReturn {
  const [chess] = useState(() => new Chess())
  const [position, setPosition] = useState(() => chess.fen())
  const [moves, setMoves] = useState<string[]>([])
  const orientation: GameOrientation = 'white'

  function makeMove(from: string, to: string): boolean {
    try {
      const result = chess.move({ from, to, promotion: 'q' })
      if (!result) {
        return false
      }

      setPosition(chess.fen())
      setMoves((previousMoves) => [...previousMoves, result.san])
      return true
    } catch {
      return false
    }
  }

  return { position, moves, orientation, makeMove }
}
