// ─────────────────────────────────────────────────────────────
//  CrickPlay Arena – Zustand Store v2
//  New state: playerFinished, questionTransition, streaks
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';

export const AVATAR_LIST = [
  { id:'bat',        name:'The Batsman',  color:'#00ff88', emoji:'🏏' },
  { id:'bowl',       name:'The Bowler',   color:'#ff6b35', emoji:'⚾' },
  { id:'keeper',     name:'The Keeper',   color:'#ffd700', emoji:'🧤' },
  { id:'allrounder', name:'All-Rounder',  color:'#e040fb', emoji:'⭐' },
  { id:'captain',    name:'The Captain',  color:'#40c4ff', emoji:'👑' },
  { id:'fielder',    name:'The Fielder',  color:'#ff4081', emoji:'🏃' },
];

export const useGameStore = create((set, get) => ({
  // ── Connection ──────────────────────────────────────────────
  connected:  false,
  socketId:   null,

  // ── Player identity ─────────────────────────────────────────
  player:     null,   // { id, name, avatar, score, isHost }

  // ── Room ────────────────────────────────────────────────────
  roomId:     null,
  players:    [],
  gameState:  'home', // home|lobby|avatar|countdown|playing|finished|results

  // ── Gameplay ────────────────────────────────────────────────
  countdown:        null,
  currentQuestion:  null,   // { index, total, question, options, category, difficulty, timeLimit }
  timeLeft:         30,
  selectedAnswer:   null,
  answerLocked:     false,
  lastAnswerCorrect: null,  // true|false|null — for visual feedback flash
  revealData:       null,   // { correctAnswer, explanation, category, leaderboard, yourAnswer }

  // ── Scoring ─────────────────────────────────────────────────
  leaderboard:       [],
  finalLeaderboard:  [],
  myScore:           0,
  streak:            0,     // consecutive correct answers
  lastPoints:        0,     // points just earned

  // ── Progress (independent mode) ─────────────────────────────
  playerFinished: false,    // current player finished all questions

  // ── UI / transitions ────────────────────────────────────────
  questionTransition: false, // true while animating between questions
  chatMessages: [],
  error: null,

  // ── Actions ─────────────────────────────────────────────────
  setConnected:  (c, id) => set({ connected: c, socketId: id }),
  setError:      (e)     => set({ error: e }),
  clearError:    ()      => set({ error: null }),
  setPlayer:     (p)     => set({ player: p }),
  setRoomId:     (r)     => set({ roomId: r }),
  setPlayers:    (p)     => set({ players: p }),
  setGameState:  (s)     => set({ gameState: s }),
  setCountdown:  (n)     => set({ countdown: n }),

  setCurrentQuestion: (q) => set({
    currentQuestion:  q,
    timeLeft:         q?.timeLimit ?? 30,
    selectedAnswer:   null,
    answerLocked:     false,
    revealData:       null,
    lastAnswerCorrect: null,
    questionTransition: false,
  }),

  setTimeLeft:   (t)  => set({ timeLeft: t }),

  setSelectedAnswer: (idx) => set({ selectedAnswer: idx, answerLocked: true }),

  setRevealData: (data) => set((s) => {
    const correct  = data.yourAnswer !== null && data.yourAnswer !== undefined
                     && data.yourAnswer === data.correctAnswer;
    const newStreak = correct ? s.streak + 1 : 0;
    return {
      revealData:        data,
      lastAnswerCorrect: correct,
      streak:            newStreak,
      leaderboard:       data.leaderboard ?? s.leaderboard,
    };
  }),

  setLeaderboard:      (lb) => set({ leaderboard: lb }),
  setFinalLeaderboard: (lb) => set({ finalLeaderboard: lb }),

  setMyScore:    (score, points) => set({ myScore: score, lastPoints: points }),
  setPlayerFinished: (v)  => set({ playerFinished: v }),
  setQuestionTransition: (v) => set({ questionTransition: v }),

  addChatMessage: (msg) =>
    set((s) => ({ chatMessages: [...s.chatMessages.slice(-60), msg] })),

  // Full reset (leave game)
  reset: () => set({
    roomId: null, players: [], gameState: 'home',
    countdown: null, currentQuestion: null, timeLeft: 30,
    selectedAnswer: null, answerLocked: false, lastAnswerCorrect: null,
    revealData: null, leaderboard: [], finalLeaderboard: [],
    myScore: 0, streak: 0, lastPoints: 0, playerFinished: false,
    questionTransition: false, chatMessages: [], error: null, player: null,
  }),

  // Partial reset (play again)
  resetGame: () => set({
    gameState: 'lobby', countdown: null, currentQuestion: null, timeLeft: 30,
    selectedAnswer: null, answerLocked: false, lastAnswerCorrect: null,
    revealData: null, leaderboard: [], finalLeaderboard: [],
    myScore: 0, streak: 0, lastPoints: 0, playerFinished: false,
    questionTransition: false,
  }),
}));
