import { Chess } from 'chess.js'
import type { GameStatus, MoveRecord } from '../types/chess.types'

export function getGameStatus(game: Chess): GameStatus {
  if (game.isCheckmate()) return 'checkmate'
  if (game.isStalemate()) return 'stalemate'
  if (game.isDraw()) return 'draw'
  if (game.isCheck()) return 'check'
  return 'in_progress'
}

export function getMoveHistory(game: Chess): MoveRecord[] {
  return game.history({ verbose: true }).map((move) => ({
    san: move.san,
    from: move.from,
    to: move.to,
    piece: move.piece,
    color: move.color,
    captured: move.captured,
    promotion: move.promotion,
    fen: move.after,
  }))
}
