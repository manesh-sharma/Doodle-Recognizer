# 🎨 Doodle Recognizer — AI-Powered QuickDraw Game (V3.0)

An end-to-end full-stack AI sketch recognition and party game inspired by Google *Quick, Draw!*. Built with **FastAPI**, **TensorFlow/Keras**, **React 18**, **Tailwind CSS**, and **WebSockets**.

Players can practice freely in **Normal Mode**, race against time in **Single Player Arcade Mode**, or compete with friends in real-time **Multiplayer Team Mode** with synchronized timers, live match rankings, and mutual doodle exhibition.

---

## 🚀 Game Modes

### 1. 🖌️ Normal Mode (Free Sandbox)
* **Real-time AI Inference**: Predicts the user's doodle after every stroke (on mouse/touch release).
* **Top 5 Softmax Predictions**: Displays live confidence percentages with ranked progress bars.
* **Calibrated Drawing Tools**: 4 balanced brush presets (Fine, Medium, Bold, Heavy), eraser tool with visual indicator, Undo, Redo, Clear, and instant PNG download.

### 2. ⏱️ Single Player Game Mode (Arcade Challenge)
* **4 Progressive Difficulty Rounds**:
  * **Round 1 & 2**: Easy category (50 seconds per round)
  * **Round 3**: Medium category (100 seconds)
  * **Round 4**: Hard category (150 seconds)
* **Multi-Attempt Recognition**: Players can refine or redraw their sketch multiple times within the time limit. The system tracks each attempt and automatically awards the highest confidence score achieved.
* **Round Transition Protection**: Confirmation modal confirms when you want to proceed to the next round.
* **End-of-Game Analysis Modal**: Complete scorecard summarizing prompt categories, difficulty tiers, individual round scores, total match score, and direct download buttons for each round's artwork.

### 3. 👥 Multiplayer Team Mode (Real-Time Synchronized Play)
* **Lobby & Room Codes**: Host creates a private room and receives a unique 6-character room code. Up to 8 players can join.
* **Non-Host Ready Gate**: Non-host participants must click **"Ready Up"**. The host's **"Start Match"** button is unlocked only once all connected players are ready.
* **Zero-Drift Epoch Wall-Clock Sync**: Server synchronizes absolute UNIX epoch timestamps (`round_end_timestamp`). Clients compute local clock skew and update time every 250ms, eliminating tab throttle drift and ensuring all players end each round simultaneously.
* **Live In-Match Leaderboard**: WebSocket broadcasts real-time score updates as participants draw and submit sketches.
* **Round Completion Safety**: Players confirm with a popup before submitting "I'm Done" for each round.
* **Multiplayer Podium & Shared Gallery**: Final standings with gold, silver, and bronze podium badges. Players can inspect opponents' sketches and download individual drawings directly from the match summary.
* **Synchronized Rematch ("Play Another Match")**: Host resets the room back to the lobby with fresh randomized categories for everyone.

---

## 🛠️ Project Structure

```
Doodle/
├── backend/
│   ├── app/
│   │   ├── config.py                # Environment configs & JSON dataset paths
│   │   ├── database.py              # SQLite + SQLAlchemy models (User, GameHistory, Round)
│   │   ├── model_service.py         # Keras CNN loader, combine classes engine & preprocessor
│   │   ├── multiplayer_manager.py   # In-memory room manager, state transitions, clock sync
│   │   ├── routes/
│   │   │   ├── auth_routes.py       # JWT registration, login, and user profile
│   │   │   ├── game_routes.py       # Single-player prompt generation and match saving
│   │   │   ├── predict_routes.py    # Real-time inference endpoint
│   │   │   └── multiplayer_routes.py# REST room creation and WebSocket room handler
│   │   └── main.py                  # FastAPI application with CORS & lifespan events
│   ├── run.py                       # Uvicorn entry point (binds to 0.0.0.0:8000)
│   ├── test_backend.py              # End-to-end backend test suite
│   └── test_combine_logic.py        # Unit tests for combine engine & removed classes
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx     # Reusable "Are you sure?" confirmation popup
│   │   │   ├── DrawingCanvas.jsx    # Canvas with undo/redo, brush sizes & responsive scaling
│   │   │   ├── Navbar.jsx           # Top bar with profile modal opener & theme toggle
│   │   │   ├── PredictionSidebar.jsx# Ranked predictions with animated confidence bars
│   │   │   ├── ProfileModal.jsx     # User info, stats, match history & settings modal
│   │   │   ├── RoundAnalysisModal.jsx # Single-player post-game scorecard & doodle exports
│   │   │   └── MultiplayerLeaderboardModal.jsx # Multiplayer podium & artwork gallery
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Authentication & user profile state
│   │   │   └── ThemeContext.jsx     # Light/Dark mode state with localStorage persistence
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx    # Mode selector cards (Normal, Single, Multiplayer)
│   │   │   ├── LandingPage.jsx      # Animated landing hero & authentication forms
│   │   │   ├── NormalModePage.jsx   # Free drawing sandbox
│   │   │   ├── GameModePage.jsx     # 4-round single-player arcade challenge
│   │   │   ├── MultiplayerLobbyPage.jsx # Team creation, code joining & ready room
│   │   │   └── MultiplayerGamePage.jsx  # Live synchronized multiplayer match
│   │   ├── services/
│   │   │   └── api.js               # Dynamic host resolution REST & Auth client
│   │   └── App.jsx                  # Main state container & WebSocket coordinator
│   ├── tailwind.config.js           # Tailwind CSS configuration with darkMode: 'class'
│   ├── package.json                 # React 18, Vite, Tailwind CSS, Lucide icons
│   └── vite.config.js               # Configured with --host 0.0.0.0
│
├── curated_classes_v4.json          # 345 classes categorized into Easy, Medium, Hard, Removed
├── curated_v4_combine_classes.json  # 27 normal groups + 1 dynamic bird support group
├── model.keras                      # Trained Keras CNN model weights
├── app.bat                          # One-click launch script for Windows
└── stop.bat                         # One-click server termination script
```

---

## ⚡ Quick Start Guide

### 🚀 One-Click Launch (Windows)
Simply double-click **`app.bat`** in the project root!
It will:
1. Start the FastAPI backend on `http://localhost:8000`
2. Start the Vite React frontend on `http://localhost:5173`
3. Automatically open your default web browser to `http://localhost:5173`

To stop all servers at any time, run **`stop.bat`** or close the terminal windows.

---

### 💻 Manual Setup

#### Prerequisites
* **Python**: 3.10, 3.11, or 3.12
* **Node.js**: 18+ and npm
* **Git**

#### 1. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install fastapi uvicorn tensorflow keras pillow opencv-python pydantic sqlalchemy passlib[bcrypt] python-jose[cryptography] python-multipart websockets requests

# Verify combine logic and model service
python test_combine_logic.py

# Start backend server
python run.py
```
*Backend runs on `http://0.0.0.0:8000`.*  
*Interactive Swagger API docs available at `http://localhost:8000/docs`.*

#### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Test production build
npm run build

# Start Vite development server
npm run dev
```
*Vite starts on `http://0.0.0.0:5173`.*

---

## 🎮 How to Play

### Drawing Tips for Maximum AI Recognition
1. **Draw Iconic Contours**: The model was trained on simple human doodles. Draw distinguishing silhouettes (e.g. an apple with a stem, glasses with two round frames and a bridge).
2. **Avoid Shading or Scribbling**: The neural network detects contours and vector-like lines, not solid shading.
3. **Use Suitable Brush Sizes**: The default brush size is calibrated for optimal recognition in $28 \times 28$ bitmap space.
4. **Multiple Submissions**: In timed game modes, you can continue refining your sketch—the game tracks and keeps your highest confidence score!

### Multiplayer Match Walkthrough
1. **Host Creates Team**: Click **"Create Team"** to generate a 6-character room code (e.g., `SKETCH`).
2. **Players Join**: Friends enter the code and click **"Join Team"**.
3. **Ready Up**: Non-host players click **"Click to Ready Up!"** (button turns green).
4. **Start Match**: The Host clicks **"Start Match Now!"**.
5. **Synchronized Rounds**: All players sketch the same prompt with synchronized epoch timers.
6. **Confirmation Safety**: Clicking **"I'm Done"** prompts a confirmation popup to avoid early lock-ins.
7. **Podium & Art Gallery**: Compare scores on the final leaderboard and click on each opponent's card to inspect and download their doodles.

---


