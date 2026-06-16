export type Color = 'w' | 'b'

export type GameStatus =
  | 'in_progress'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'check'

export interface MoveRecord {
  san: string
  from: string
  to: string
  piece: string
  color: Color
  captured?: string
  promotion?: string
  fen: string
}

export interface GameState {
  fen: string
  turn: Color
  status: GameStatus
  isGameOver: boolean
  history: MoveRecord[]
  legalMoves: string[]
}
