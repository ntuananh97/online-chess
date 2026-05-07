import type { Move } from "chess.js";
import { AudioEvent, type AudioEvent as SoundEvent } from "@/lib/audio/audioTypes";

/** Status discriminant only — keeps this module free of `useChessGame` imports (no circular deps). */
export type ChessGameStatusType =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw";

/**
 * Maps a successful chess.js `Move` to the primary SFX.
 *
 * Precedence mirrors how Lichess-style clients classify moves and aligns with chess.js’s
 * internal move flags (the deprecated string `move.flags`):
 * - `k` / `q` — kingside / queenside castle → we use isKingsideCastle / isQueensideCastle.
 * - `p` — promotion → isPromotion() (often appears with `c` when capturing on promote).
 * - `c` — ordinary capture → isCapture().
 * - `e` — en passant capture → isEnPassant() (also a capture in UX terms).
 * - otherwise quiet move (may include `n` non-capture, `b` big pawn push).
 */
export function primarySoundFromMove(move: Move): SoundEvent {
  if (move.isKingsideCastle() || move.isQueensideCastle()) {
    return AudioEvent.CASTLE;
  }
  if (move.isPromotion()) {
    return AudioEvent.PROMOTION;
  }
  if (move.isCapture() || move.isEnPassant()) {
    return AudioEvent.CAPTURE;
  }
  return AudioEvent.MOVE;
}

/** After the position is updated: optional check fanfare or game-over sting (not both for mate). */
export function secondarySoundsAfterMove(status: { type: ChessGameStatusType }): SoundEvent[] {
  const { type } = status;
  if (type === "checkmate" || type === "stalemate" || type === "draw") {
    return [AudioEvent.GAME_END];
  }
  if (type === "check") {
    return [AudioEvent.CHECK];
  }
  return [];
}

export function soundsForSuccessfulMove(
  move: Move,
  status: { type: ChessGameStatusType },
): SoundEvent[] {
  return [primarySoundFromMove(move), ...secondarySoundsAfterMove(status)];
}
