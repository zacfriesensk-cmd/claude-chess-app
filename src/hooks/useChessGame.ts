import { useCallback, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { getGameStatus, getMoveHistory } from '../lib/chessHelpers'
import type { GameState } from '../types/chess.types'

const MOVES_KEY = 'chess-app-moves'

type StoredMove = { from: string; to: string; promotion?: string }

function loadGame(): Chess {
  const g = new Chess()
  try {
    const raw = localStorage.getItem(MOVES_KEY)
    if (!raw) return g
    const moves: StoredMove[] = JSON.parse(raw)
    for (const m of moves) g.move(m)
  } catch {
    localStorage.removeItem(MOVES_KEY)
  }
  return g
}

function saveGame(game: Chess) {
  const moves: StoredMove[] = game.history({ verbose: true }).map((m) => ({
    from: m.from,
    to: m.to,
    ...(m.promotion ? { promotion: m.promotion } : {}),
  }))
  localStorage.setItem(MOVES_KEY, JSON.stringify(moves))
}

export function useChessGame() {
  const [game] = useState(loadGame)
  const [, forceUpdate] = useState(0)

  const refresh = useCallback(() => forceUpdate((n) => n + 1), [])

  const state: GameState = useMemo(
    () => ({
      fen: game.fen(),
      turn: game.turn(),
      status: getGameStatus(game),
      isGameOver: game.isGameOver(),
      history: getMoveHistory(game),
      legalMoves: game.moves(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, game.fen()],
  )

  const makeMove = useCallback(
    (move: string | { from: string; to: string; promotion?: string }) => {
      try {
        const result = game.move(move)
        if (result) {
          saveGame(game)
          refresh()
        }
        return result
      } catch {
        return null
      }
    },
    [game, refresh],
  )

  const undo = useCallback(() => {
    const result = game.undo()
    if (result) {
      saveGame(game)
      refresh()
    }
    return result
  }, [game, refresh])

  const reset = useCallback(() => {
    game.reset()
    localStorage.removeItem(MOVES_KEY)
    refresh()
  }, [game, refresh])

  return { state, makeMove, undo, reset }
}
