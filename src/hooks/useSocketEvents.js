// ─────────────────────────────────────────────────────────────
//  CrickPlay Arena – Socket Events Hook v2
//  Handles all server→client events cleanly in one place.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
import { useNavigate }       from 'react-router-dom';
import socket                from '../socket';
import { useGameStore }      from '../store/gameStore';

export function useSocketEvents() {
  const navigate = useNavigate();
  const store    = useGameStore();
  const navRef   = useRef(navigate);
  navRef.current = navigate;

  useEffect(() => {
    socket.connect();

    const reg = (ev, fn) => socket.on(ev, fn);

    reg('connect',       () => store.setConnected(true,  socket.id));
    reg('disconnect',    () => store.setConnected(false, null));
    reg('connect_error', (e) => store.setError(`Connection error: ${e.message}`));

    reg('playersUpdate', ({ players })           => store.setPlayers(players));
    reg('playerJoined',  ({ players })           => store.setPlayers(players));

    reg('playerLeft', ({ players, newHostId }) => {
      store.setPlayers(players);
      const me = store.player;
      if (newHostId && me?.id === newHostId)
        store.setPlayer({ ...me, isHost: true });
    });

    reg('countdown', ({ count }) => {
      store.setCountdown(count);
      store.setGameState('countdown');
    });

    reg('gameStart', () => {
      store.setGameState('playing');
      store.setCountdown(null);
      navRef.current('/game');
    });

    // Independent per-player events
    reg('question',     (q)   => {
      store.setQuestionTransition(true);
      setTimeout(() => {
        store.setCurrentQuestion(q);
        store.setQuestionTransition(false);
      }, 350);
    });

    reg('timer',        ({ timeLeft }) => store.setTimeLeft(timeLeft));

    reg('answerReveal', (data) => store.setRevealData(data));

    reg('scoreUpdate',  ({ leaderboard }) => store.setLeaderboard(leaderboard));

    reg('playerFinished', ({ score, leaderboard }) => {
      store.setPlayerFinished(true);
      store.setMyScore(score, 0);
      store.setLeaderboard(leaderboard);
      store.setGameState('finished');
    });

    reg('gameOver', ({ leaderboard }) => {
      store.setFinalLeaderboard(leaderboard);
      store.setGameState('results');
      navRef.current('/results');
    });

    reg('gameRestarted', ({ players }) => {
      store.setPlayers(players);
      store.resetGame();
      navRef.current('/lobby');
    });

    reg('lobbyChatMessage', (msg) => store.addChatMessage(msg));

    return () => {
      socket.offAny();
      socket.disconnect();
    };
  }, []); // eslint-disable-line
}
