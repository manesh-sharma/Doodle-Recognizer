import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer, showToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { NormalModePage } from './pages/NormalModePage';
import { GameModePage } from './pages/GameModePage';
import { MultiplayerLobbyPage } from './pages/MultiplayerLobbyPage';
import { MultiplayerGamePage } from './pages/MultiplayerGamePage';
import { api } from './services/api';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setView] = useState('dashboard'); // 'dashboard', 'normal', 'game', 'multiplayer_lobby', 'multiplayer_game'

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
      // Authenticate with JWT token
      ws.send(JSON.stringify({ type: 'join', token, room_code: roomCode }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'room_state') {
          setRoomState(data.room);
          // Auto-transition views based on room status
          if (data.room.status === 'in_round' || data.room.status === 'round_summary' || data.room.status === 'game_finished') {
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
      <Navbar currentView={currentView} setView={setView} />
      <main className="flex-1">
        {currentView === 'dashboard' && <DashboardPage setView={setView} />}
        {currentView === 'normal' && <NormalModePage setView={setView} />}
        {currentView === 'game' && <GameModePage setView={setView} />}
        {currentView === 'multiplayer_lobby' && (
          <MultiplayerLobbyPage
            setView={setView}
            roomState={roomState}
            connected={wsConnected}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onToggleReady={handleToggleReady}
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
