# Chess App

A modern, responsive web-based chess application. This project is built as a portfolio piece to document professional project execution and AI-assisted development paradigms — from architecture and planning through implementation.

## Tech Stack

- **Frontend:** Vite + React + TypeScript
- **Styling:** Tailwind CSS v4
- **Chess Logic Engine:** [`chess.js`](https://github.com/jhlywa/chess.js) — handles game rules, move legality, and state validation
- **Board UI:** [`react-chessboard`](https://github.com/Clariity/react-chessboard) — leveraged directly to avoid redundant custom `Square`/`Piece` components

### Architecture Decisions

- **Why `chess.js` instead of writing our own rules engine:** Chess move validation is a deceptively large surface area — en passant, castling rights, check/checkmate detection, threefold repetition, etc. A hand-rolled implementation is a common source of subtle bugs and a poor use of effort when a mature, well-tested library already solves it. Outsourcing this lets development focus on UX and game mechanics instead.
- **Why `react-chessboard` instead of custom `Square`/`Piece` components:** It already handles square rendering, piece sprites, and drag-and-drop internally, and integrates cleanly with `chess.js`'s board state. Building custom components for this would duplicate functionality without adding value at this stage. If custom move-highlighting or themed styling is needed later, `react-chessboard` supports that via props rather than requiring separate components.
- **Why the game state's source of truth lives in `chess.js`, not a hand-rolled board array:** The `Chess` instance (backed by FEN) is treated as authoritative. UI-only concerns (selected square, highlights, promotion-picker visibility) are kept separate in React state and never duplicate or override the engine's state.

## Current Project Status

Phase 1 (Engine/Logic) is complete — see [Roadmap](#next-steps--roadmap) below for full details and what's next.

### Project Structure

```
chess-app/
└── src/
    ├── components/        # (Phase 2+) Board, MoveHistory, GameControls, etc.
    ├── hooks/
    │   └── useChessGame.ts
    ├── lib/
    │   └── chessHelpers.ts
    ├── types/
    │   └── chess.types.ts
    ├── App.tsx             # Phase 1 text-based test harness
    └── main.tsx
```

## Getting Started

**Prerequisites:** [Node.js](https://nodejs.org/) 18 or newer (developed against Node 22).

```bash
cd chess-app
npm install      # only needed if dependencies aren't already installed
npm run dev
```

Then open `http://localhost:5173` in your browser.

**Using the Phase 1 test harness:** There's no visual board yet — instead you'll see a plain-text interface. Type a move in standard chess notation (e.g. `e4`, `Nf3`, `exd5`) into the input box and click **Move**. The page will update to show whose turn it is, the game status, the move history, and all currently legal moves. Use **Undo** to take back the last move, or **Reset** to start a new game.

## Next Steps / Roadmap

- [x] **Phase 1 — Engine/Logic:** Complete.
  - Initialized a clean Vite + React + TypeScript workspace.
  - Built the `useChessGame` hook (`src/hooks/useChessGame.ts`), wrapping a `chess.js` instance and exposing `turn`, `status` (check/checkmate/stalemate/draw/in_progress), `FEN`, verbose `move history`, and `legal moves`.
  - Implemented and verified `makeMove`, `undo`, and `reset` actions.
  - Built a temporary plain-text test harness in `App.tsx` to exercise the engine without a visual board.
  - Type-checks pass clean via `tsc -b --noEmit`.
- [ ] **Phase 2 — Static Board UI (next up):** Replace the plain-text test harness with an actual visual chessboard using `react-chessboard`, wired directly to the existing `useChessGame` hook to render the live position.
- [ ] **Phase 3 — Interaction:** Click/drag-to-move, legal-move highlighting, promotion picker, captured pieces, move history panel.
- [ ] **Phase 4 — Game Mechanics:** Turn indicator, check/checkmate/draw banners, undo, new game, resign controls.
- [ ] **Phase 5 — Polish:** Timers, sound, animations, board flip, PGN export/import.
- [ ] **Phase 6 — Stretch:** Stockfish (WASM) AI opponent, then online multiplayer with a backend.
