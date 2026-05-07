import { act, renderHook } from '@testing-library/react'
import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { detectStatus, useChessGame } from './useChessGame'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('useChessGame', () => {
  function playMoves(
    result: { current: { makeMove: (from: string, to: string) => boolean } },
    moves: Array<[string, string]>,
  ) {
    for (const [from, to] of moves) {
      act(() => {
        result.current.makeMove(from, to)
      })
    }
  }

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
    let ok = false
    act(() => {
      ok = result.current.makeMove('e2', 'e4')
    })
    expect(ok).toBe(true)
    expect(result.current.position).not.toBe(STARTING_FEN)
  })

  it('appends SAN to moves list on a legal move', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => {
      result.current.makeMove('e2', 'e4')
    })
    expect(result.current.moves).toEqual(['e4'])
  })

  it('accumulates multiple moves', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => {
      result.current.makeMove('e2', 'e4')
    })
    act(() => {
      result.current.makeMove('e7', 'e5')
    })
    act(() => {
      result.current.makeMove('g1', 'f3')
    })
    expect(result.current.moves).toEqual(['e4', 'e5', 'Nf3'])
  })

  it('returns false and does not change state for an illegal move', () => {
    const { result } = renderHook(() => useChessGame())
    const before = result.current.position
    let ok = true
    act(() => {
      ok = result.current.makeMove('e2', 'e5')
    })
    expect(ok).toBe(false)
    expect(result.current.position).toBe(before)
    expect(result.current.moves).toEqual([])
  })

  it('returns false when moving the wrong colour', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => {
      result.current.makeMove('e2', 'e4')
    })
    let ok = true
    act(() => {
      ok = result.current.makeMove('d2', 'd4')
    })
    expect(ok).toBe(false)
  })

  it('sets pendingPromotion and does not move immediately when promotion is required', () => {
    const { result } = renderHook(() => useChessGame())

    playMoves(result, [
      ['a2', 'a4'],
      ['h7', 'h5'],
      ['a4', 'a5'],
      ['h5', 'h4'],
      ['a5', 'a6'],
      ['h4', 'h3'],
      ['a6', 'b7'],
      ['h3', 'g2'],
    ])

    const beforePromotion = result.current.position
    let ok = false
    act(() => {
      ok = result.current.makeMove('b7', 'c8')
    })

    expect(ok).toBe(false)
    expect(result.current.position).toBe(beforePromotion)
    expect(result.current.pendingPromotion).toEqual({
      from: 'b7',
      to: 'c8',
      color: 'white',
    })
  })

  it('confirmPromotion executes pending move with selected piece', () => {
    const { result } = renderHook(() => useChessGame())

    playMoves(result, [
      ['a2', 'a4'],
      ['h7', 'h5'],
      ['a4', 'a5'],
      ['h5', 'h4'],
      ['a5', 'a6'],
      ['h4', 'h3'],
      ['a6', 'b7'],
      ['h3', 'g2'],
    ])

    act(() => {
      result.current.makeMove('b7', 'c8')
    })

    let ok = false
    act(() => {
      ok = result.current.confirmPromotion('n')
    })

    const promotedPosition = new Chess(result.current.position)
    expect(ok).toBe(true)
    expect(promotedPosition.get('c8')).toMatchObject({ type: 'n', color: 'w' })
    expect(result.current.pendingPromotion).toBeNull()
    expect(result.current.moves[result.current.moves.length - 1]).toContain('=N')
  })

  it('cancelPromotion clears pending promotion and keeps board unchanged', () => {
    const { result } = renderHook(() => useChessGame())

    playMoves(result, [
      ['a2', 'a4'],
      ['h7', 'h5'],
      ['a4', 'a5'],
      ['h5', 'h4'],
      ['a5', 'a6'],
      ['h4', 'h3'],
      ['a6', 'b7'],
      ['h3', 'g2'],
    ])

    const beforePromotion = result.current.position
    act(() => {
      result.current.makeMove('b7', 'c8')
    })

    act(() => {
      result.current.cancelPromotion()
    })

    expect(result.current.pendingPromotion).toBeNull()
    expect(result.current.position).toBe(beforePromotion)
  })

  it('gameStatus starts as playing', () => {
    const { result } = renderHook(() => useChessGame())
    expect(result.current.gameStatus).toEqual({ type: 'playing' })
  })

  it("gameStatus becomes checkmate after Scholar's mate via makeMove", () => {
    const { result } = renderHook(() => useChessGame())
    act(() => {
      result.current.makeMove('e2', 'e4')
    })
    act(() => {
      result.current.makeMove('e7', 'e5')
    })
    act(() => {
      result.current.makeMove('f1', 'c4')
    })
    act(() => {
      result.current.makeMove('b8', 'c6')
    })
    act(() => {
      result.current.makeMove('d1', 'h5')
    })
    act(() => {
      result.current.makeMove('g8', 'f6')
    })
    act(() => {
      result.current.makeMove('h5', 'f7')
    })
    expect(result.current.gameStatus).toEqual({ type: 'checkmate', winner: 'white' })
  })

  it('resetGame resets the board and gameStatus', () => {
    const { result } = renderHook(() => useChessGame())
    act(() => {
      result.current.makeMove('e2', 'e4')
    })
    act(() => {
      result.current.resetGame()
    })
    expect(result.current.position).toBe(STARTING_FEN)
    expect(result.current.moves).toEqual([])
    expect(result.current.gameStatus).toEqual({ type: 'playing' })
    expect(result.current.pendingPromotion).toBeNull()
  })
})

describe('detectStatus', () => {
  it('returns playing for the initial position', () => {
    const chess = new Chess()
    expect(detectStatus(chess)).toEqual({ type: 'playing' })
  })

  it("returns checkmate with winner white after Scholar's mate", () => {
    const chess = new Chess()
    chess.move({ from: 'e2', to: 'e4' })
    chess.move({ from: 'e7', to: 'e5' })
    chess.move({ from: 'f1', to: 'c4' })
    chess.move({ from: 'b8', to: 'c6' })
    chess.move({ from: 'd1', to: 'h5' })
    chess.move({ from: 'g8', to: 'f6' })
    chess.move({ from: 'h5', to: 'f7' })
    expect(detectStatus(chess)).toEqual({ type: 'checkmate', winner: 'white' })
  })

  it('returns check with the correct player', () => {
    const chess = new Chess()
    chess.move({ from: 'e2', to: 'e4' })
    chess.move({ from: 'e7', to: 'e5' })
    chess.move({ from: 'g1', to: 'f3' })
    chess.move({ from: 'b8', to: 'c6' })
    chess.move({ from: 'f1', to: 'c4' })
    chess.move({ from: 'g8', to: 'f6' })
    chess.move({ from: 'f3', to: 'g5' })
    chess.move({ from: 'd7', to: 'd5' })
    chess.move({ from: 'e4', to: 'd5' })
    chess.move({ from: 'c6', to: 'a5' })
    chess.move({ from: 'c4', to: 'b5' })
    expect(detectStatus(chess)).toEqual({ type: 'check', player: 'black' })
  })

  it('returns stalemate', () => {
    const chess = new Chess()
    chess.load('8/8/8/8/8/1Q6/8/k1K5 b - - 0 1')
    expect(detectStatus(chess)).toEqual({ type: 'stalemate' })
  })

  it('returns draw with reason insufficient_material for lone kings', () => {
    const chess = new Chess()
    chess.load('k7/8/8/8/8/8/8/7K w - - 0 1')
    expect(detectStatus(chess)).toEqual({ type: 'draw', reason: 'insufficient_material' })
  })

  it('returns draw with reason threefold_repetition after knights shuttle', () => {
    const chess = new Chess()
    chess.move({ from: 'g1', to: 'f3' })
    chess.move({ from: 'g8', to: 'f6' })
    chess.move({ from: 'f3', to: 'g1' })
    chess.move({ from: 'f6', to: 'g8' })
    chess.move({ from: 'g1', to: 'f3' })
    chess.move({ from: 'g8', to: 'f6' })
    chess.move({ from: 'f3', to: 'g1' })
    chess.move({ from: 'f6', to: 'g8' })
    expect(detectStatus(chess)).toEqual({ type: 'draw', reason: 'threefold_repetition' })
  })
})
