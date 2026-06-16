import { useEffect, useRef, useState } from 'react'
import { Chessboard, defaultPieces } from 'react-chessboard'
import type { PieceDropHandlerArgs } from 'react-chessboard'
import { useChessGame } from './hooks/useChessGame'
import type { Color } from './types/chess.types'

// ─── Types ────────────────────────────────────────────────────────────────────

type PromotionPiece = 'q' | 'r' | 'b' | 'n'

interface PendingPromotion {
  from: string
  to: string
  color: Color
}

type GameResult =
  | { type: 'lost_on_time'; loser: Color }
  | { type: 'resigned'; loser: Color }
  | null

// ─── Constants ────────────────────────────────────────────────────────────────

const CLOCK_START = 60 // 1+0 bullet
const CLOCKS_KEY = 'chess-app-clocks'
const RESULT_KEY = 'chess-app-result'

const PROMOTION_PIECES: PromotionPiece[] = ['q', 'r', 'b', 'n']
const PIECE_LABELS: Record<PromotionPiece, string> = {
  q: 'Queen',
  r: 'Rook',
  b: 'Bishop',
  n: 'Knight',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function loadClocks(): { w: number; b: number } {
  try {
    const parsed = JSON.parse(localStorage.getItem(CLOCKS_KEY) ?? 'null')
    if (typeof parsed?.w === 'number' && typeof parsed?.b === 'number') return parsed
  } catch {}
  return { w: CLOCK_START, b: CLOCK_START }
}

function loadResult(): GameResult {
  try {
    return JSON.parse(localStorage.getItem(RESULT_KEY) ?? 'null')
  } catch {}
  return null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ClockPanel({
  label,
  time,
  isActive,
  isGameOver,
}: {
  label: string
  time: number
  isActive: boolean
  isGameOver: boolean
}) {
  const ticking = isActive && !isGameOver
  const critical = time < 10 && ticking
  return (
    <div
      className={[
        'flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 transition-colors',
        ticking ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white',
      ].join(' ')}
    >
      <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 leading-none">
        {label}
      </span>
      <span
        className={[
          'text-3xl font-mono font-bold tabular-nums leading-none',
          critical ? 'text-red-600' : 'text-slate-800',
        ].join(' ')}
      >
        {formatTime(time)}
      </span>
    </div>
  )
}

function PromotionModal({
  color,
  onSelect,
}: {
  color: Color
  onSelect: (piece: PromotionPiece) => void
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center gap-4">
        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Choose promotion
        </p>
        <div className="flex gap-3">
          {PROMOTION_PIECES.map((p) => {
            const key = `${color}${p.toUpperCase()}` as keyof typeof defaultPieces
            const PieceIcon = defaultPieces[key]
            return (
              <button
                key={p}
                onClick={() => onSelect(p)}
                title={PIECE_LABELS[p]}
                className="w-16 h-16 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center"
              >
                <div className="w-12 h-12">
                  <PieceIcon />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatusBanner({
  status,
  turn,
  gameResult,
}: {
  status: string
  turn: Color
  gameResult: GameResult
}) {
  if (gameResult?.type === 'lost_on_time') {
    const winner = gameResult.loser === 'w' ? 'Black' : 'White'
    return (
      <div className="rounded-lg bg-red-100 border border-red-300 px-4 py-2 text-center">
        <span className="font-bold text-red-700">Lost on Time</span>
        <span className="text-red-600"> — {winner} wins</span>
      </div>
    )
  }
  if (gameResult?.type === 'resigned') {
    const winner = gameResult.loser === 'w' ? 'Black' : 'White'
    return (
      <div className="rounded-lg bg-red-100 border border-red-300 px-4 py-2 text-center">
        <span className="font-bold text-red-700">Resigned</span>
        <span className="text-red-600"> — {winner} wins</span>
      </div>
    )
  }
  if (status === 'checkmate') {
    const winner = turn === 'w' ? 'Black' : 'White'
    return (
      <div className="rounded-lg bg-red-100 border border-red-300 px-4 py-2 text-center">
        <span className="font-bold text-red-700">Checkmate</span>
        <span className="text-red-600"> — {winner} wins</span>
      </div>
    )
  }
  if (status === 'stalemate') {
    return (
      <div className="rounded-lg bg-gray-100 border border-gray-300 px-4 py-2 text-center">
        <span className="font-bold text-gray-700">Stalemate — Draw</span>
      </div>
    )
  }
  if (status === 'draw') {
    return (
      <div className="rounded-lg bg-gray-100 border border-gray-300 px-4 py-2 text-center">
        <span className="font-bold text-gray-700">Draw</span>
      </div>
    )
  }
  if (status === 'check') {
    return (
      <div className="rounded-lg bg-amber-100 border border-amber-300 px-4 py-2 text-center">
        <span className="font-bold text-amber-700">Check!</span>
      </div>
    )
  }
  return null
}

function TurnIndicator({
  turn,
  isEffectivelyOver,
}: {
  turn: Color
  isEffectivelyOver: boolean
}) {
  if (isEffectivelyOver) return null
  return (
    <div className="flex items-center gap-3 px-1">
      <div
        className={[
          'w-5 h-5 rounded-full border-2 flex-shrink-0',
          turn === 'w'
            ? 'bg-white border-gray-400 shadow-sm'
            : 'bg-gray-900 border-gray-600',
        ].join(' ')}
      />
      <span className="text-sm font-medium text-gray-700">
        {turn === 'w' ? 'White' : 'Black'} to move
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function App() {
  const { state, makeMove, undo, reset } = useChessGame()

  const [clocks, setClocks] = useState(loadClocks)
  const [gameResult, setGameResult] = useState<GameResult>(loadResult)
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null)
  const historyBottomRef = useRef<HTMLDivElement>(null)

  const isEffectivelyOver = state.isGameOver || gameResult !== null

  // Persist clocks and result to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(CLOCKS_KEY, JSON.stringify(clocks))
  }, [clocks])

  useEffect(() => {
    localStorage.setItem(RESULT_KEY, JSON.stringify(gameResult))
  }, [gameResult])

  // Clock tick — restarts cleanly whenever the active player changes
  useEffect(() => {
    if (isEffectivelyOver || state.history.length === 0) return
    const id = setInterval(() => {
      setClocks((prev) => ({ ...prev, [state.turn]: Math.max(0, prev[state.turn] - 1) }))
    }, 1000)
    return () => clearInterval(id)
  }, [isEffectivelyOver, state.turn, state.history.length])

  // Detect expiry after each clock update
  useEffect(() => {
    if (gameResult !== null) return
    const expired = clocks.w === 0 ? 'w' : clocks.b === 0 ? 'b' : null
    if (expired) setGameResult({ type: 'lost_on_time', loser: expired })
  }, [clocks, gameResult])

  // Auto-scroll move history
  useEffect(() => {
    historyBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.history.length])

  // ── Handlers ──

  const handleNewGame = () => {
    reset()
    localStorage.removeItem(CLOCKS_KEY)
    localStorage.removeItem(RESULT_KEY)
    setClocks({ w: CLOCK_START, b: CLOCK_START })
    setGameResult(null)
    setPendingPromotion(null)
  }

  const handleResign = () => {
    if (isEffectivelyOver) return
    setGameResult({ type: 'resigned', loser: state.turn })
  }

  const onPieceDrop = ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
    if (!targetSquare || isEffectivelyOver) return false

    const isPromotion =
      piece.pieceType[1]?.toLowerCase() === 'p' &&
      (targetSquare[1] === '8' || targetSquare[1] === '1')

    if (isPromotion) {
      setPendingPromotion({
        from: sourceSquare,
        to: targetSquare,
        color: piece.pieceType[0] as Color,
      })
      return false
    }

    return makeMove({ from: sourceSquare, to: targetSquare }) !== null
  }

  const handlePromotion = (promotionPiece: PromotionPiece) => {
    if (!pendingPromotion || isEffectivelyOver) return
    makeMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: promotionPiece })
    setPendingPromotion(null)
  }

  // ── Derived display data ──

  const movePairs = state.history.reduce<{ number: number; white: string; black?: string }[]>(
    (pairs, move, i) => {
      if (i % 2 === 0) pairs.push({ number: Math.floor(i / 2) + 1, white: move.san })
      else pairs[pairs.length - 1].black = move.san
      return pairs
    },
    [],
  )

  // ── Render ──

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center p-6 md:p-10">
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl">

        {/* Board */}
        <div className="relative flex-shrink-0 w-full md:w-[560px]">
          <Chessboard
            options={{
              position: state.fen,
              onPieceDrop,
              allowDrawingArrows: true,
            }}
          />
          {pendingPromotion && (
            <PromotionModal color={pendingPromotion.color} onSelect={handlePromotion} />
          )}
        </div>

        {/* Sidebar */}
        <div className="flex-1 flex flex-col gap-4 md:h-[560px]">

          {/* Clocks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex gap-3">
            <ClockPanel
              label="Black"
              time={clocks.b}
              isActive={state.turn === 'b'}
              isGameOver={isEffectivelyOver}
            />
            <ClockPanel
              label="White"
              time={clocks.w}
              isActive={state.turn === 'w'}
              isGameOver={isEffectivelyOver}
            />
          </div>

          {/* Turn indicator + status banner */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3">
            <TurnIndicator turn={state.turn} isEffectivelyOver={isEffectivelyOver} />
            <StatusBanner status={state.status} turn={state.turn} gameResult={gameResult} />
          </div>

          {/* Move history */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Move History
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-sm">
              {movePairs.length === 0 ? (
                <p className="text-slate-400 text-xs">No moves yet.</p>
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {movePairs.map(({ number, white, black }) => (
                      <tr key={number} className="hover:bg-slate-50">
                        <td className="w-8 py-0.5 text-slate-400 select-none">{number}.</td>
                        <td className="w-1/2 py-0.5 px-2 text-slate-800">{white}</td>
                        <td className="w-1/2 py-0.5 px-2 text-slate-800">{black ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div ref={historyBottomRef} />
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex gap-3">
            <button
              onClick={undo}
              disabled={state.history.length === 0 || isEffectivelyOver}
              className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Undo
            </button>
            <button
              onClick={handleResign}
              disabled={isEffectivelyOver || state.history.length === 0}
              className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Resign
            </button>
            <button
              onClick={handleNewGame}
              className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              New Game
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
