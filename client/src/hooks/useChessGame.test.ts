import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useChessGame } from './useChessGame'

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('useChessGame', () => {
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
})
