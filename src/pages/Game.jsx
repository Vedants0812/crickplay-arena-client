import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import { useGameStore } from '../store/gameStore';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';
import StadiumBackground from '../components/StadiumBackground';
import { sound } from '../utils/sound';

const LABELS = ['A','B','C','D'];
const OPT_COLORS = ['#40c4ff','#e040fb','#ffd700','#ff6b35'];

const DIFF_BADGE = { easy:'🟢 Easy', medium:'🟡 Medium', hard:'🔴 Hard' };
const CAT_ICON   = { History:'📜', Records:'🏆', Rules:'📋', Venues:'🏟️', Players:'⭐' };

/* ── Points flash overlay ── */
function PointsFlash({ points, correct }) {
  if (!points) return null;
  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20`}>
      <div className={`font-display text-5xl animate-pop-in ${correct ? 'neon-green' : 'neon-ember'}`}>
        {correct ? `+${points}` : '✗'}
      </div>
    </div>
  );
}

/* ── Streak badge ── */
function StreakBadge({ streak }) {
  if (streak < 2) return null;
  const label = streak >= 5 ? '🔥 ON FIRE!' : streak >= 3 ? '⚡ HOT STREAK' : '✨ STREAK';
  return (
    <div className="animate-streak-bounce inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-display tracking-widest"
      style={{ background:'rgba(255,107,53,0.2)', border:'1px solid rgba(255,107,53,0.5)', color:'#ff6b35' }}>
      {label} ×{streak}
    </div>
  );
}

/* ── Finished waiting screen ── */
function FinishedWaiting({ leaderboard, playerId, myScore }) {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center px-4">
      <StadiumBackground />
      <div className="relative z-10 text-center max-w-md w-full">
        <div className="text-7xl mb-4 animate-float">🏁</div>
        <h2 className="font-display text-5xl neon-green mb-2">YOU FINISHED!</h2>
        <p className="font-body text-white/50 mb-2">Your score: <span className="text-pitch-400 font-bold text-xl">{myScore.toLocaleString()} pts</span></p>
        <p className="font-body text-white/30 text-sm mb-8">Waiting for other players to finish…</p>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <span className="font-display text-xl tracking-widest text-white/50">LIVE STANDINGS</span>
          </div>
          <Leaderboard players={leaderboard} currentPlayerId={playerId} showProgress />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-white/25 font-body text-sm">
          <span className="w-2 h-2 rounded-full bg-pitch-400 animate-pulse" />
          Results coming soon…
        </div>
      </div>
    </div>
  );
}

export default function Game() {
  const navigate  = useNavigate();
  const store     = useGameStore();
  const {
    roomId, player, currentQuestion, timeLeft, selectedAnswer,
    answerLocked, revealData, leaderboard, gameState,
    playerFinished, myScore, streak, lastAnswerCorrect, questionTransition,
  } = store;
  const setSelectedAnswer = useGameStore(s => s.setSelectedAnswer);

  const prevQRef     = useRef(null);
  const prevTimeRef  = useRef(timeLeft);
  const [showPoints, setShowPoints]   = useState(null); // { points, correct }
  const [flashState, setFlashState]   = useState(null); // 'correct' | 'wrong'

  useEffect(() => {
    if (!roomId || !player) navigate('/');
    if (gameState === 'results') navigate('/results');
  }, [roomId, player, gameState]);

  // Question appear sound + reset flash
  useEffect(() => {
    if (currentQuestion && currentQuestion.index !== prevQRef.current) {
      prevQRef.current = currentQuestion.index;
      setFlashState(null);
      setShowPoints(null);
      sound.questionAppear();
    }
  }, [currentQuestion?.index]);

  // Timer sounds
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0 && !answerLocked) sound.timerWarning();
    if (timeLeft === 0) sound.timerEnd();
    prevTimeRef.current = timeLeft;
  }, [timeLeft]);

  // Answer reveal sounds + flash
  useEffect(() => {
    if (!revealData) return;
    const correct = revealData.yourAnswer !== null && revealData.yourAnswer !== undefined
                    && revealData.yourAnswer === revealData.correctAnswer;
    if (correct) {
      sound.correct();
      setFlashState('correct');
    } else if (revealData.yourAnswer !== null && revealData.yourAnswer !== undefined) {
      sound.wrong();
      setFlashState('wrong');
    }
  }, [revealData]);

  // Points flash from answerAck
  useEffect(() => {
    const handler = ({ isCorrect, points }) => {
      if (points > 0) {
        setShowPoints({ points, correct: isCorrect });
        setTimeout(() => setShowPoints(null), 1200);
      }
    };
    socket.on('answerAck', handler);
    return () => socket.off('answerAck', handler);
  }, []);

  const submitAnswer = (idx) => {
    if (answerLocked || !currentQuestion || revealData) return;
    sound.answerSelected();
    setSelectedAnswer(idx);
    socket.emit('submitAnswer', { roomId, questionIndex: currentQuestion.index, answerIndex: idx });
  };

  // ── Finished waiting screen ──
  if (playerFinished || gameState === 'finished') {
    return <FinishedWaiting leaderboard={leaderboard} playerId={player?.id} myScore={myScore} />;
  }

  // ── Loading question screen ──
  if (!currentQuestion) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center gap-5">
        <StadiumBackground />
        <div className="relative z-10 text-center">
          <div className="text-7xl mb-4 animate-bounce">🏏</div>
          <p className="font-display text-4xl tracking-widest neon-green">LOADING…</p>
          <p className="font-body text-white/30 text-sm mt-2">Preparing your questions</p>
        </div>
      </div>
    );
  }

  const { index, total, question, options, category, difficulty } = currentQuestion;
  const isReveal  = !!revealData;
  const correct   = revealData?.correctAnswer;
  const myRank    = leaderboard.findIndex(p => p.id === player?.id) + 1;

  const getBtnClass = (i) => {
    if (!isReveal) return `answer-btn${selectedAnswer === i ? ' selected' : ''}`;
    if (i === correct)                           return 'answer-btn reveal-correct';
    if (selectedAnswer === i && i !== correct)   return 'answer-btn reveal-wrong';
    return 'answer-btn reveal-dim';
  };

  return (
    <div className={`min-h-screen relative flex flex-col md:flex-row transition-opacity duration-300 ${questionTransition ? 'opacity-0' : 'opacity-100'}`}>
      <StadiumBackground />

      {/* ── Main quiz area ── */}
      <div className="relative z-10 flex-1 flex flex-col p-4 md:p-6 md:pr-4 max-w-3xl mx-auto w-full">

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-4 animate-slide-down">
          {/* Progress pips */}
          <div className="flex-1 flex gap-1">
            {Array(total).fill(0).map((_,i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  background: i < index ? '#00ff88' : i === index ? 'rgba(0,255,136,0.55)' : 'rgba(255,255,255,0.08)',
                  boxShadow:  i === index ? '0 0 8px rgba(0,255,136,0.7)' : 'none',
                }} />
            ))}
          </div>
          <span className="font-mono text-sm text-white/30 shrink-0">{index+1}/{total}</span>
          {myRank > 0 && (
            <div className="shrink-0 px-2.5 py-1 rounded-full font-body text-sm"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-white/30">Rank </span>
              <span className="text-pitch-400 font-bold">#{myRank}</span>
            </div>
          )}
          {streak >= 2 && <StreakBadge streak={streak} />}
        </div>

        {/* Question card */}
        <div className={`glass rounded-2xl p-5 md:p-6 mb-4 relative overflow-hidden animate-scale-in
          ${flashState === 'correct' ? 'animate-correct-flash' : ''}
          ${flashState === 'wrong'   ? 'animate-wrong-shake'   : ''}`}>
          {/* Points flash */}
          {showPoints && <PointsFlash points={showPoints.points} correct={showPoints.correct} />}

          {/* Meta row */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">{CAT_ICON[category] || '🏏'}</span>
            <span className="font-body text-xs text-white/35 uppercase tracking-widest">{category}</span>
            <span className="ml-auto font-body text-xs">{DIFF_BADGE[difficulty] || ''}</span>
          </div>

          <div className="flex items-start gap-5">
            <div className="shrink-0">
              <Timer timeLeft={timeLeft} maxTime={currentQuestion.timeLimit || 30} size={90} />
            </div>
            <div className="flex-1 pt-1">
              <h2 className="font-body font-bold text-xl md:text-2xl text-white leading-snug">
                {question}
              </h2>
            </div>
          </div>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 content-start">
          {options.map((opt, i) => (
            <button key={i} onClick={() => submitAnswer(i)}
              disabled={answerLocked || isReveal}
              className={getBtnClass(i)}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center
                                 font-display text-xl font-bold text-[#04080f]"
                  style={{ background: OPT_COLORS[i] }}>
                  {LABELS[i]}
                </span>
                <span className="flex-1 leading-snug">{opt}</span>
                {isReveal && i === correct && <span className="text-pitch-400 text-xl ml-auto shrink-0">✓</span>}
                {isReveal && selectedAnswer === i && i !== correct && <span className="text-ember-400 text-xl ml-auto shrink-0">✗</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Reveal / status */}
        <div className="mt-4 min-h-[56px] flex items-start justify-center">
          {isReveal && (
            <div className="w-full p-4 rounded-2xl animate-scale-in"
              style={{ background:'rgba(0,255,136,0.07)', border:'1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span>💡</span>
                <span className="font-body font-bold text-pitch-400 text-xs uppercase tracking-widest">Explanation</span>
                {category && <span className="ml-auto text-xs text-white/25 font-body">{CAT_ICON[category]} {category}</span>}
              </div>
              <p className="font-body text-white/65 text-sm leading-relaxed">{revealData.explanation}</p>
              <p className="text-center text-white/20 font-body text-xs mt-2 animate-pulse">
                Next question in a moment…
              </p>
            </div>
          )}
          {answerLocked && !isReveal && (
            <div className="flex items-center gap-2 text-pitch-400/60 font-body text-sm animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-pitch-400 animate-pulse" />
              Answer locked — revealing soon…
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="relative z-10 w-full md:w-64 lg:w-72 p-4 md:pt-6 md:pr-5 shrink-0">
        <div className="glass rounded-2xl p-4 sticky top-4">
          <div className="flex items-center gap-2 mb-4">
            <span>📊</span>
            <h3 className="font-display text-lg tracking-widest text-white/45">LIVE SCORES</h3>
          </div>
          <Leaderboard players={leaderboard} currentPlayerId={player?.id} showProgress />
        </div>
      </div>
    </div>
  );
}
