import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer, showToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { NormalModePage } from './pages/NormalModePage';
import { GameModePage } from './pages/GameModePage';
import { ExtremeChallengePage } from './pages/ExtremeChallengePage';
import { LearningModePage } from './pages/LearningModePage';
import { ContextoSoloPage } from './pages/ContextoSoloPage';
import { MultiplayerLobbyPage } from './pages/MultiplayerLobbyPage';
import { MultiplayerGamePage } from './pages/MultiplayerGamePage';
import { api } from './services/api';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setView] = useState('dashboard'); // 'dashboard', 'normal', 'game', 'extreme', 'learning', 'contexto_solo', 'multiplayer_lobby', 'multiplayer_game'

  // Multiplayer WebSocket & Room State
  const [roomState, setRoomState] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  // Clean up WebSocket on logout or unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectToRoomWebSocket = (roomCode) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const token = api.getToken();
    const hostname = window.location.hostname || '127.0.0.1';
    const wsUrl = `ws://${hostname}:8000/ws/multiplayer/${roomCode}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({ type: 'join', token, room_code: roomCode }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'room_state') {
          setRoomState(data.room);
          // Auto-transition views based on room status
          if (
            data.room.status === 'in_round' ||
            data.room.status === 'round_summary' ||
            data.room.status === 'imposter_drawing' ||
            data.room.status === 'imposter_voting' ||
            data.room.status === 'imposter_reveal' ||
            data.room.status === 'contexto_race' ||
            data.room.status === 'contexto_summary' ||
            data.room.status === 'game_finished'
          ) {
            setView('multiplayer_game');
          } else if (data.room.status === 'lobby') {
            setView('multiplayer_lobby');
          }
        } else if (data.type === 'score_update') {
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: data.players || prev.players,
            };
          });
        } else if (data.type === 'player_finished') {
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              players: data.players || prev.players,
            };
          });
        } else if (data.type === 'round_ended') {
          setRoomState(data.room);
          setView('multiplayer_game');
          showToast(`Round ${data.round} complete! Advancing shortly...`, 'info', 3000);
        } else if (data.type === 'imposter_stroke_added') {
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              composite_canvas: data.composite_canvas,
              top_prediction: data.top_prediction,
              target_confidence: data.target_confidence,
              turn_count: data.turn_count,
            };
          });
        } else if (data.type === 'imposter_voting_started') {
          const reasonText = data.reason === 'accuracy_reached'
            ? `AI recognized sketch with ${data.target_confidence}% accuracy! Voting begins!`
            : 'All turns complete! Voting begins to catch the Imposter!';
          showToast(reasonText, 'warning', 4000);
        } else if (data.type === 'imposter_vote_cast') {
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              votes_count: data.votes_count,
            };
          });
        } else if (data.type === 'imposter_round_reveal') {
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              round_result: data.result,
              players: data.players || prev.players,
            };
          });
          const outcomeText = data.result.outcome === 'innocents_win'
            ? `Innocents Win! The Imposter (${data.result.imposter_username}) was caught!`
            : `Imposter Wins! ${data.result.imposter_username} fooled everyone!`;
          showToast(outcomeText, data.result.outcome === 'innocents_win' ? 'success' : 'warning', 5000);
        } else if (data.type === 'contexto_feed_update') {
          if (data.is_match) {
            showToast(`🎯 ${data.username} solved the secret word!`, 'success', 4000);
          } else {
            showToast(`${data.username} guessed: Rank #${data.rank} (${data.proximity})`, 'info', 2000);
          }
        } else if (data.type === 'contexto_round_ended') {
          showToast(`Round finished! The mystery word was "${data.secret_word}"!`, 'info', 4000);
        } else if (data.type === 'game_finished') {
          setRoomState(data.room);
          setView('multiplayer_game');
          showToast('Multiplayer match finished! Check out the final leaderboard.', 'success', 4000);
        } else if (data.type === 'error') {
          showToast(data.message || 'Multiplayer error', 'error');
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket connection error:', err);
      showToast('Multiplayer connection error', 'error');
    };

    wsRef.current = ws;
  };

  const handleCreateRoom = async (code) => {
    connectToRoomWebSocket(code);
    setView('multiplayer_lobby');
  };

  const handleJoinRoom = async (code) => {
    connectToRoomWebSocket(code);
    setView('multiplayer_lobby');
  };

  const handleToggleReady = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'toggle_ready' }));
    }
  };

  const handleSetGameSettings = (gameMode, totalRounds) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_game_settings', game_mode: gameMode, total_rounds: totalRounds }));
    }
  };

  const handleStartGame = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
    }
  };

  const handleSubmitAttempt = (score, doodle) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'submit_attempt', score, doodle }));
    }
  };

  const handleFinishRound = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'finish_round' }));
    }
  };

  const handleSubmitImposterStroke = (compositeCanvas) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'imposter_stroke', composite_canvas: compositeCanvas }));
    }
  };

  const handleSubmitImposterVote = (suspectId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'imposter_vote', suspect_id: suspectId }));
    }
  };

  const handleSubmitContextoGuess = (doodle) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'contexto_guess', doodle }));
    }
  };

  const handlePlayAgain = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'play_again' }));
    }
  };

  const handleLeaveRoom = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRoomState(null);
    setWsConnected(false);
    setView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Doodle Recognizer...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {currentView === 'dashboard' && <Navbar currentView={currentView} setView={setView} />}
      <main className="flex-1">
        {currentView === 'dashboard' && <DashboardPage setView={setView} />}
        {currentView === 'normal' && <NormalModePage setView={setView} />}
        {currentView === 'game' && <GameModePage setView={setView} />}
        {currentView === 'extreme' && <ExtremeChallengePage setView={setView} />}
        {currentView === 'learning' && <LearningModePage setView={setView} />}
        {currentView === 'contexto_solo' && <ContextoSoloPage setView={setView} />}
        {currentView === 'multiplayer_lobby' && (
          <MultiplayerLobbyPage
            setView={setView}
            roomState={roomState}
            connected={wsConnected}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onToggleReady={handleToggleReady}
            onSetGameSettings={handleSetGameSettings}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
        {currentView === 'multiplayer_game' && (
          <MultiplayerGamePage
            setView={setView}
            roomState={roomState}
            currentUserId={user?.id}
            onSubmitAttempt={handleSubmitAttempt}
            onFinishRound={handleFinishRound}
            onSubmitImposterStroke={handleSubmitImposterStroke}
            onSubmitImposterVote={handleSubmitImposterVote}
            onSubmitContextoGuess={handleSubmitContextoGuess}
            onPlayAgain={handlePlayAgain}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </main>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
