import { useState } from "react";
import { Chess, Square } from "chess.js";
import { SquareHandlerArgs } from "react-chessboard";

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
  optionSquares: Record<string, React.CSSProperties>;
  onSquareClick: (args: SquareHandlerArgs) => void;
  resetGame: () => void;
}

export function useChessGame(): UseChessGameReturn {
  const [chess] = useState(() => new Chess());
  const [position, setPosition] = useState(() => chess.fen());
  const [moves, setMoves] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>({ type: "playing" });

  const [optionSquares, setOptionSquares] = useState({});
  const [moveFrom, setMoveFrom] = useState("");

  const orientation: GameOrientation = "white";

  function makeMove(from: string, to: string): boolean {
    try {
      const result = chess.move({ from, to, promotion: "q" });
      if (!result) {
        return false;
      }

      setPosition(chess.fen());
      setMoves((previousMoves) => [...previousMoves, result.san]);

      // clear moveFrom and optionSquares
      setMoveFrom("");
      setOptionSquares({});
      setGameStatus(detectStatus(chess));

      return true;
    } catch {
      return false;
    }
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

    // is normal move
    try {
      const result = chess.move({
        from: moveFrom,
        to: square,
        promotion: "q",
      });

      // update the position state
      setPosition(chess.fen());
      setMoves((previousMoves) => [...previousMoves, result.san]);

      // clear moveFrom and optionSquares
      setMoveFrom("");
      setOptionSquares({});
      setGameStatus(detectStatus(chess));
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
    setMoveFrom("");
    setOptionSquares({});
  }

  return {
    position,
    moves,
    orientation,
    gameStatus,
    optionSquares,
    onSquareClick,
    makeMove,
    resetGame,
  };
}
