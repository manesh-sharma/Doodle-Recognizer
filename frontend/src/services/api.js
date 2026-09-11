const hostname = typeof window !== 'undefined' ? (window.location.hostname || '127.0.0.1') : '127.0.0.1';
const BASE_URL = `http://${hostname}:8000`;

class ApiService {
  getToken() {
    return localStorage.getItem('doodle_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('doodle_token', token);
    } else {
      localStorage.removeItem('doodle_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'API request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async register(username, password, email = null) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  // Prediction
  async predict(imageDataBase64, targetClass = null) {
    return this.request('/api/predict', {
      method: 'POST',
      body: JSON.stringify({
        image: imageDataBase64,
        target_class: targetClass,
      }),
    });
  }

  async predictDoodle(imageDataBase64, targetClass = null) {
    return this.predict(imageDataBase64, targetClass);
  }

  async getModelStatus() {
    return this.request('/api/model/status');
  }

  // Game
  async getPrompts() {
    return this.request('/api/game/prompts');
  }

  async saveGame(rounds, totalScore) {
    return this.request('/api/game/save', {
      method: 'POST',
      body: JSON.stringify({
        rounds,
        total_score: totalScore,
      }),
    });
  }

  async getGameHistory() {
    return this.request('/api/game/history');
  }

  async getLeaderboard() {
    return this.request('/api/game/leaderboard');
  }

  // Contexto Solo Mode
  async getContextoTarget(difficulty = null) {
    const query = difficulty ? `?difficulty=${difficulty}` : '';
    return this.request(`/api/game/contexto/target${query}`);
  }

  async submitContextoGuess(sessionId, imageBase64 = null, manualGuess = null) {
    return this.request('/api/game/contexto/guess', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        image: imageBase64,
        manual_guess: manualGuess,
      }),
    });
  }

  async getContextoHint(sessionId, level = 1) {
    return this.request(`/api/game/contexto/hint?session_id=${sessionId}&level=${level}`);
  }

  async giveUpContexto(sessionId) {
    return this.request('/api/game/contexto/give_up', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    });
  }

  // Multiplayer
  async createMultiplayerRoom() {
    return this.request('/api/multiplayer/create', {
      method: 'POST',
    });
  }

  async getMultiplayerRoom(code) {
    return this.request(`/api/multiplayer/room/${code}`);
  }
}

export const api = new ApiService();
