import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { AudioEvent } from "@/lib/audio/audioTypes";
import {
  primarySoundFromMove,
  secondarySoundsAfterMove,
  soundsForSuccessfulMove,
} from "@/lib/audio/chessAudioAdapter";
import { detectStatus } from "@/hooks/useChessGame";

describe("chessAudioAdapter", () => {
  it("classifies a quiet move as MOVE", () => {
    const chess = new Chess();
    const move = chess.move({ from: "e2", to: "e4" });
    expect(move).not.toBeNull();
    expect(primarySoundFromMove(move!)).toBe(AudioEvent.MOVE);
  });

  it("classifies a capture as CAPTURE", () => {
    const chess = new Chess();
    chess.move({ from: "e2", to: "e4" });
    chess.move({ from: "d7", to: "d5" });
    const move = chess.move({ from: "e4", to: "d5" });
    expect(move).not.toBeNull();
    expect(primarySoundFromMove(move!)).toBe(AudioEvent.CAPTURE);
  });

  it("classifies kingside castling as CASTLE", () => {
    const chess = new Chess("r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1");
    const move = chess.move({ from: "e1", to: "g1" });
    expect(move).not.toBeNull();
    expect(primarySoundFromMove(move!)).toBe(AudioEvent.CASTLE);
  });

  it("classifies promotion as PROMOTION", () => {
    const chess = new Chess("8/P7/8/8/8/8/8/K6k w - - 0 1");
    const move = chess.move({ from: "a7", to: "a8", promotion: "q" });
    expect(move).not.toBeNull();
    expect(primarySoundFromMove(move!)).toBe(AudioEvent.PROMOTION);
  });

  it("classifies en passant as CAPTURE", () => {
    const chess = new Chess("rnbqkbnr/pppppppp/8/8/4Pp2/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
    const move = chess.move({ from: "f4", to: "e3" });
    expect(move).not.toBeNull();
    expect(primarySoundFromMove(move!)).toBe(AudioEvent.CAPTURE);
  });

  it("adds CHECK after move when status is check", () => {
    const chess = new Chess();
    chess.move({ from: "e2", to: "e4" });
    chess.move({ from: "e7", to: "e5" });
    chess.move({ from: "g1", to: "f3" });
    chess.move({ from: "b8", to: "c6" });
    chess.move({ from: "f1", to: "c4" });
    chess.move({ from: "g8", to: "f6" });
    chess.move({ from: "f3", to: "g5" });
    chess.move({ from: "d7", to: "d5" });
    chess.move({ from: "e4", to: "d5" });
    chess.move({ from: "c6", to: "a5" });
    const move = chess.move({ from: "c4", to: "b5" });
    expect(move).not.toBeNull();
    const status = detectStatus(chess);
    expect(status).toEqual({ type: "check", player: "black" });
    expect(secondarySoundsAfterMove(status)).toEqual([AudioEvent.CHECK]);
    expect(soundsForSuccessfulMove(move!, status)).toEqual([AudioEvent.MOVE, AudioEvent.CHECK]);
  });

  it("adds GAME_END on checkmate (not CHECK)", () => {
    const chess = new Chess();
    chess.move({ from: "e2", to: "e4" });
    chess.move({ from: "e7", to: "e5" });
    chess.move({ from: "f1", to: "c4" });
    chess.move({ from: "b8", to: "c6" });
    chess.move({ from: "d1", to: "h5" });
    chess.move({ from: "g8", to: "f6" });
    const move = chess.move({ from: "h5", to: "f7" });
    expect(move).not.toBeNull();
    const status = detectStatus(chess);
    expect(status.type).toBe("checkmate");
    expect(secondarySoundsAfterMove(status)).toEqual([AudioEvent.GAME_END]);
    expect(soundsForSuccessfulMove(move!, status)).toEqual([
      AudioEvent.CAPTURE,
      AudioEvent.GAME_END,
    ]);
  });

  it("maps terminal draw to GAME_END", () => {
    expect(secondarySoundsAfterMove({ type: "draw" })).toEqual([AudioEvent.GAME_END]);
    expect(secondarySoundsAfterMove({ type: "stalemate" })).toEqual([AudioEvent.GAME_END]);
  });

  it("returns no secondary sounds when playing", () => {
    expect(secondarySoundsAfterMove({ type: "playing" })).toEqual([]);
  });
});
