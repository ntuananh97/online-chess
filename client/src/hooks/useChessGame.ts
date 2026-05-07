import { useState } from "react";
import { Chess, Square } from "chess.js";
import { SquareHandlerArgs } from "react-chessboard";
import { audio } from "@/lib/audio/AudioManager";
import { AudioEvent } from "@/lib/audio/audioTypes";
import { soundsForSuccessfulMove } from "@/lib/audio/chessAudioAdapter";

export type GameOrientation = "white" | "black";
export type GameStatus =
  | { type: "playing" }
  | { type: "check"; player: "white" | "black" }
  | { type: "checkmate"; winner: "white" | "black" }
  | { type: "stalemate" }
  | { type: "draw"; reason: "insufficient_material" | "threefold_repetition" };

export function detectStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    return { type: "checkmate", winner: chess.turn() === "w" ? "black" : "white" };
  }
  if (chess.isStalemate()) return { type: "stalemate" };
  if (chess.isInsufficientMaterial()) {
    return { type: "draw", reason: "insufficient_material" };
  }
  if (chess.isThreefoldRepetition()) {
    return { type: "draw", reason: "threefold_repetition" };
  }
  if (chess.isCheck()) {
    return { type: "check", player: chess.turn() === "w" ? "white" : "black" };
  }
  return { type: "playing" };
}

export interface UseChessGameReturn {
  position: string;
  moves: string[];
  orientation: GameOrientation;
  gameStatus: GameStatus;
  makeMove: (from: string, to: string) => boolean;
  pendingPromotion: PendingPromotion | null;
  confirmPromotion: (piece: PromotionPiece) => boolean;
  cancelPromotion: () => void;
  optionSquares: Record<string, React.CSSProperties>;
  onSquareClick: (args: SquareHandlerArgs) => void;
  resetGame: () => void;
}

export type PromotionPiece = "q" | "r" | "b" | "n";
export interface PendingPromotion {
  from: string;
  to: string;
  color: "white" | "black";
}

export function useChessGame(): UseChessGameReturn {
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState(() => chess.fen());
  const [moves, setMoves] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>({ type: "playing" });

  const [optionSquares, setOptionSquares] = useState({});
  const [moveFrom, setMoveFrom] = useState("");
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const orientation: GameOrientation = "white";

  function executeMove(from: string, to: string, promotion?: PromotionPiece): boolean {
    try {
      const move = promotion ? { from, to, promotion } : { from, to };
      const result = chess.move(move);
      if (!result) {
        audio.play(AudioEvent.ILLEGAL);
        return false;
      }

      setPosition(chess.fen());
      setMoves((previousMoves) => [...previousMoves, result.san]);

      // clear moveFrom and optionSquares
      setMoveFrom("");
      setOptionSquares({});
      setPendingPromotion(null);
      const nextStatus = detectStatus(chess);
      setGameStatus(nextStatus);

      const eventSounds = soundsForSuccessfulMove(result, nextStatus);
      console.log("🚀 ~ executeMove ~ eventSounds:", eventSounds)
      eventSounds.forEach((event) => audio.play(event));

      return true;
    } catch {
      audio.play(AudioEvent.ILLEGAL);
      return false;
    }
  }

  function isPromotionMove(from: string, to: string): PendingPromotion | null {
    const piece = chess.get(from as Square);
    if (!piece || piece.type !== "p") {
      return null;
    }

    const legalMoves = chess.moves({
      square: from as Square,
      verbose: true,
    });
    const targetMove = legalMoves.find((move) => move.from === from && move.to === to);
    if (!targetMove) {
      return null;
    }

    const promotionRank = piece.color === "w" ? "8" : "1";
    if (!to.endsWith(promotionRank)) {
      return null;
    }

    return { from, to, color: piece.color === "w" ? "white" : "black" };
  }

  function makeMove(from: string, to: string): boolean {
    if (pendingPromotion) {
      return false;
    }

    const promotion = isPromotionMove(from, to);
    if (promotion) {
      setPendingPromotion(promotion);
      setMoveFrom("");
      setOptionSquares({});
      return false;
    }

    return executeMove(from, to);
  }

  function confirmPromotion(piece: PromotionPiece): boolean {
    if (!pendingPromotion) {
      return false;
    }
    return executeMove(pendingPromotion.from, pendingPromotion.to, piece);
  }

  function cancelPromotion() {
    setPendingPromotion(null);
    setMoveFrom("");
    setOptionSquares({});
  }

  function getMoveOptions(square: Square) {
    // get the moves for the square
    const moves = chess.moves({
      square,
      verbose: true,
    });

    // if no moves, clear the option squares
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    // create a new object to store the option squares
    const newSquares: Record<string, React.CSSProperties> = {};

    // loop through the moves and set the option squares
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chess.get(move.to) &&
          chess.get(move.to)?.color !== chess.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)" // larger circle for capturing
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        // smaller circle for moving
        borderRadius: "50%",
      };
    }

    // set the square clicked to move from to yellow
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)",
    };

    // set the option squares
    setOptionSquares(newSquares);

    // return true to indicate that there are move options
    return true;
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    if (pendingPromotion) {
      return;
    }

    // piece clicked to move
    if (!moveFrom && piece) {
      // get the move options for the square
      const hasMoveOptions = getMoveOptions(square as Square);

      // if move options, set the moveFrom to the square
      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      // return early
      return;
    }

    // square clicked to move to, check if valid move
    const moves = chess.moves({
      square: moveFrom as Square,
      verbose: true,
    });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    // not a valid move
    if (!foundMove) {
      // check if clicked on new piece
      const hasMoveOptions = getMoveOptions(square as Square);

      // if new piece, setMoveFrom, otherwise clear moveFrom
      setMoveFrom(hasMoveOptions ? square : "");

      // return early
      return;
    }

    try {
      makeMove(moveFrom, square);
    } catch {
      // if invalid, setMoveFrom and getMoveOptions
      const hasMoveOptions = getMoveOptions(square as Square);

      // if new piece, setMoveFrom, otherwise clear moveFrom
      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      // return early
      return;
    }
  }

  function resetGame() {
    chess.reset();
    setPosition(chess.fen());
    setMoves([]);
    setGameStatus({ type: "playing" });
    setPendingPromotion(null);
    setMoveFrom("");
    setOptionSquares({});
  }

  return {
    position,
    moves,
    orientation,
    gameStatus,
    pendingPromotion,
    confirmPromotion,
    cancelPromotion,
    optionSquares,
    onSquareClick,
    makeMove,
    resetGame,
  };
}
